import {
  Connection,
  PublicKey,
  TransactionInstruction,
  AddressLookupTableAccount,
  VersionedTransaction,
  Transaction,
} from "@solana/web3.js";
import { CrossbarClient, OracleJob } from "@switchboard-xyz/common";
import { PullFeed, Queue, AnchorUtils, asV0Tx } from "@switchboard-xyz/on-demand";

const PUMP_FUN_API = "https://frontend-api-v2.pump.fun/coins";
const CROSSBAR_URL = "https://crossbar.switchboard.xyz";

/**
 * Wallet interface compatible with Anchor / Switchboard SDK.
 * Matches the shape returned by Reown AppKit wallet provider.
 */
export interface SwitchboardWallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

export interface CreateFeedResult {
  feedPubkey: PublicKey;
  signature: string;
}

export interface FeedUpdateResult {
  instructions: TransactionInstruction[];
  lookupTables: AddressLookupTableAccount[];
  numSuccesses: number;
}

/**
 * Create an OracleJob definition that fetches a pump.fun token's USD market cap.
 * The value returned by this job is an i128 with 18 decimal precision (Switchboard standard).
 *
 * For price-per-token predictions, set the market's price_target accordingly
 * (the on-chain program compares the raw oracle value vs the scaled target).
 */
function createPumpFunPriceJob(tokenMint: string): ReturnType<typeof OracleJob.fromObject> {
  return OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: `${PUMP_FUN_API}/${tokenMint}`,
        },
      },
      {
        jsonParseTask: {
          path: "$.usd_market_cap",
        },
      },
    ],
  });
}

/**
 * Load the Switchboard On-Demand program and default queue.
 * Caches nothing — call sparingly or cache externally.
 */
async function loadSwitchboardProgram(connection: Connection, wallet?: SwitchboardWallet) {
  const program = await AnchorUtils.loadProgramFromConnection(
    connection,
    wallet as any, // Anchor Wallet interface — shape matches
  );
  const queue = await Queue.loadDefault(program);
  return { program, queue };
}

/**
 * Store an OracleJob on the Switchboard crossbar via the legacy `/store` endpoint.
 *
 * IMPORTANT: The SDK's `fetchUpdateIx` internally uses `LegacyCrossbarClient.fetch()`
 * to load jobs. That legacy endpoint can only read feeds stored via the legacy `/store`
 * endpoint — NOT feeds stored via the v2 `storeOracleFeed()` method. Using v2 storage
 * results in feeds that can never be cranked (oracle nodes can't find the job definition).
 */
async function storeJobLegacy(
  job: ReturnType<typeof OracleJob.fromObject>,
  queuePubkey: PublicKey,
): Promise<{ feedHash: string }> {
  // Convert OracleJob to plain JSON (the legacy /store endpoint expects JSON objects, not protobuf)
  const jobJson = job.toJSON();

  const resp = await fetch(`${CROSSBAR_URL}/store`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queue: queuePubkey.toBase58(),
      jobs: [jobJson],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Crossbar legacy store failed (${resp.status}): ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  if (!data.feedHash) {
    throw new Error("Crossbar legacy store returned no feedHash");
  }

  return { feedHash: data.feedHash as string };
}

/**
 * Create a Switchboard pull feed from any OracleJob definition.
 *
 * Flow:
 *  1. Store the job on the legacy crossbar endpoint → feedHash
 *  2. Create the on-chain feed account with that feedHash
 *
 * Returns the feed pubkey to pass to `createMarketWithOptions({ oracleFeed })`.
 */
export async function createGenericFeed(
  connection: Connection,
  wallet: SwitchboardWallet,
  job: ReturnType<typeof OracleJob.fromObject>,
  feedName: string,
): Promise<CreateFeedResult> {
  const { program, queue } = await loadSwitchboardProgram(connection, wallet);

  // 1. Store on legacy crossbar → feedHash (must use legacy so SDK's fetchUpdateIx can find it)
  const storeResult = await storeJobLegacy(job, queue.pubkey);
  const feedHash = Buffer.from(storeResult.feedHash.replace("0x", ""), "hex");
  console.log(`[Switchboard] Stored job on legacy crossbar, feedHash: ${storeResult.feedHash}`);

  // 2. Create on-chain feed account
  const [pullFeed, feedKp] = PullFeed.generate(program);

  const initIx = await pullFeed.initIx({
    name: feedName,
    queue: queue.pubkey,
    maxVariance: 1.0,
    minResponses: 1,
    minSampleSize: 1,
    maxStaleness: 150,
    feedHash,
    payer: wallet.publicKey,
  });

  // Build V0 transaction (pre-signed by feedKp, payer is the user's wallet)
  const tx = await asV0Tx({
    connection,
    ixs: [initIx],
    payer: wallet.publicKey,
    signers: [feedKp],
    computeUnitPrice: 75_000,
    computeUnitLimitMultiple: 1.3,
  });

  // Wallet signs as payer
  const signedTx = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: true,
  });
  await connection.confirmTransaction(sig, "confirmed");

  // Verify the transaction actually succeeded on-chain
  const txResult = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0 });
  if (txResult?.meta?.err) {
    console.error("[Switchboard] Feed creation failed on-chain:", JSON.stringify(txResult.meta.err));
    throw new Error(`Feed creation failed on-chain: ${JSON.stringify(txResult.meta.err)}`);
  }

  return {
    feedPubkey: feedKp.publicKey,
    signature: sig,
  };
}

/**
 * Create a Switchboard pull feed for a pump.fun token price.
 * Convenience wrapper around createGenericFeed.
 */
export async function createPumpFunPriceFeed(
  connection: Connection,
  wallet: SwitchboardWallet,
  tokenMint: string,
): Promise<CreateFeedResult> {
  const job = createPumpFunPriceJob(tokenMint);
  return createGenericFeed(connection, wallet, job, `pf-${tokenMint.slice(0, 8)}`);
}

/**
 * Fetch oracle update instructions for an existing Switchboard feed.
 *
 * Used before calling `resolveViaOracle` to ensure the feed has fresh data.
 * The returned instructions include Secp256k1 signature verification + feed update.
 * Bundle them BEFORE the resolveViaOracle instruction in the same transaction.
 *
 * The SDK's fetchUpdateIx internally uses `LegacyCrossbarClient.fetch()` to load
 * jobs. This works because createGenericFeed stores jobs via the legacy `/store`
 * endpoint (the same backend the SDK reads from).
 */
export async function fetchFeedUpdateIx(
  connection: Connection,
  feedPubkey: PublicKey,
  wallet?: SwitchboardWallet,
): Promise<FeedUpdateResult> {
  const { program } = await loadSwitchboardProgram(connection, wallet);
  const feed = new PullFeed(program, feedPubkey);
  const crossbar = CrossbarClient.default();

  try {
    console.log(`[Switchboard] Fetching update for feed ${feedPubkey.toBase58()}...`);

    const [updateIx, responses, numSuccesses, luts, failures] = await feed.fetchUpdateIx({
      numSignatures: 1,
      crossbarClient: crossbar,
    });

    console.log(`[Switchboard] fetchUpdateIx result: numSuccesses=${numSuccesses}, instructions=${updateIx?.length ?? 0}, luts=${luts?.length ?? 0}, failures=${failures?.length ?? 0}`);
    if (failures && failures.length > 0) {
      console.warn(`[Switchboard] Oracle failures:`, failures.map((f: any) => f?.message || f).slice(0, 3));
    }

    return {
      instructions: updateIx ?? [],
      lookupTables: luts,
      numSuccesses,
    };
  } catch (error: any) {
    const msg = error?.message || "";
    console.error(`[Switchboard] fetchUpdateIx error for feed ${feedPubkey.toBase58()}:`, msg);
    if (msg.includes("400") || msg.includes("Bad Request")) {
      console.warn(
        `[Switchboard] Crossbar could not load jobs for feed ${feedPubkey.toBase58()}. Falling back to resolve-only.`
      );
      return {
        instructions: [],
        lookupTables: [],
        numSuccesses: 0,
      };
    }
    throw error;
  }
}
