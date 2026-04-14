import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import bs58 from "bs58";

const COOLDOWN_MS =
  Number(process.env.COOLDOWN_SECONDS || "3600") * 1000;
const CLAIM_AMOUNT =
  Number(process.env.CLAIM_AMOUNT_TOKENS || "1000") * 1_000_000; // 6 decimals

function getTokenMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
  if (!mint) throw new Error("NEXT_PUBLIC_TOKEN_MINT not configured");
  return new PublicKey(mint);
}

// In-memory rate limit map (wallet -> last claim timestamp)
const rateLimitMap = new Map<string, number>();

function getMintAuthority(): Keypair {
  const key = process.env.MINT_AUTHORITY_PRIVATE_KEY;
  if (!key) throw new Error("MINT_AUTHORITY_PRIVATE_KEY not configured");
  return Keypair.fromSecretKey(bs58.decode(key));
}

function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet");
  return new Connection(rpcUrl, "confirmed");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    // Validate wallet address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(wallet);
      if (!PublicKey.isOnCurve(recipientPubkey)) {
        throw new Error("Invalid pubkey");
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Check rate limit
    const lastClaim = rateLimitMap.get(wallet);
    if (lastClaim) {
      const elapsed = Date.now() - lastClaim;
      if (elapsed < COOLDOWN_MS) {
        const cooldownEndsAt = lastClaim + COOLDOWN_MS;
        return NextResponse.json(
          {
            success: false,
            error: "Rate limited. Please wait before claiming again.",
            cooldownEndsAt,
          },
          { status: 429 }
        );
      }
    }

    const connection = getConnection();
    const mintAuthority = getMintAuthority();
    const tokenMint = getTokenMint();

    // Get or create ATA for recipient (authority pays rent)
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority, // payer
      tokenMint,
      recipientPubkey
    );

    // Mint tokens
    const signature = await mintTo(
      connection,
      mintAuthority, // payer
      tokenMint,
      ata.address,
      mintAuthority, // mint authority
      CLAIM_AMOUNT
    );

    // Record claim timestamp
    const now = Date.now();
    rateLimitMap.set(wallet, now);

    return NextResponse.json({
      success: true,
      data: {
        signature,
        amount: CLAIM_AMOUNT / 1_000_000,
        cooldownEndsAt: now + COOLDOWN_MS,
      },
    });
  } catch (err) {
    console.error("Faucet claim error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to mint tokens",
      },
      { status: 500 }
    );
  }
}
