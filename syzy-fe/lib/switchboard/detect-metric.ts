import { Connection, PublicKey } from "@solana/web3.js";
import { PullFeed, AnchorUtils } from "@switchboard-xyz/on-demand";
import { PUMP_METRICS, PUMP_METRIC_KEYS } from "./job-templates";

export interface DetectedMetric {
  metricType: number;
  label: string;
  /** Token mint address extracted from the feed URL (pump.fun / dexscreener) */
  tokenAddress?: string;
  /** Token symbol extracted from the feed URL (binance pairs) */
  tokenSymbol?: string;
}

/**
 * Inspect a Switchboard feed's job definition and auto-detect the metric type.
 * Returns null if the feed is not a recognized metric feed.
 */
export async function detectFeedMetric(
  connection: Connection,
  feedPubkey: PublicKey,
): Promise<DetectedMetric | null> {
  try {
    const program = await AnchorUtils.loadProgramFromConnection(connection);
    const feed = new PullFeed(program, feedPubkey);

    const jobs = await feed.loadJobs();
    if (!jobs || jobs.length === 0) return null;

    // Get the first job's tasks (OracleJob protobuf or plain object)
    const job = jobs[0];
    const tasks = job?.tasks;
    if (!tasks || tasks.length < 2) return null;

    // Extract httpTask url and jsonParseTask path
    const httpUrl: string | undefined | null =
      (tasks[0] as any)?.httpTask?.url ?? (tasks[0] as any)?.http_task?.url;
    const jsonPath: string | undefined | null =
      (tasks[1] as any)?.jsonParseTask?.path ?? (tasks[1] as any)?.json_parse_task?.path;

    if (!httpUrl || !jsonPath) return null;

    // Check if this is a recognized feed
    const isPumpFun = httpUrl.includes("pump.fun");
    const isDexScreener = httpUrl.includes("dexscreener.com");
    const isBinance = httpUrl.includes("binance.com");
    const isCoinGecko = httpUrl.includes("coingecko.com");

    if (!isPumpFun && !isDexScreener && !isBinance && !isCoinGecko) return null;

    // Extract token info from the feed URL
    let tokenAddress: string | undefined;
    let tokenSymbol: string | undefined;

    if (isPumpFun) {
      // URL: https://frontend-api-v3.pump.fun/coins/{mint}?sync=true
      const match = httpUrl.match(/\/coins\/([A-HJ-NP-Za-km-z1-9]+)/);
      if (match) tokenAddress = match[1];
    } else if (isDexScreener) {
      // URL: https://api.dexscreener.com/tokens/v1/solana/{mint}
      const match = httpUrl.match(/\/solana\/([A-HJ-NP-Za-km-z1-9]+)/);
      if (match) tokenAddress = match[1];
    } else if (isBinance) {
      // URL: ...?symbol=BTCUSDT → extract "BTC"
      const match = httpUrl.match(/symbol=(\w+?)USDT/);
      if (match) tokenSymbol = match[1];
    }

    // Match the jsonPath against known metrics
    for (const key of PUMP_METRIC_KEYS) {
      const metric = PUMP_METRICS[key];
      // Ensure data source matches
      if (isPumpFun && metric.api !== "v3") continue;
      if (isDexScreener && metric.api !== "dexscreener") continue;
      if (isBinance && metric.api !== "binance") continue;
      if (isCoinGecko && metric.api !== "coingecko") continue;
      if (metric.path === jsonPath) {
        return { metricType: metric.metricType, label: metric.label, tokenAddress, tokenSymbol };
      }
    }

    return null;
  } catch (error) {
    console.warn("[detectFeedMetric] Failed to detect metric:", error);
    return null;
  }
}
