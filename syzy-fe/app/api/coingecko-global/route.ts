import { NextResponse } from "next/server";

const COINGECKO_GLOBAL_API = "https://api.coingecko.com/api/v3/global";

/**
 * Proxy endpoint for CoinGecko global data API to avoid CORS issues.
 * Usage: GET /api/coingecko-global
 */
export async function GET() {
  try {
    const response = await fetch(COINGECKO_GLOBAL_API, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `CoinGecko API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API /api/coingecko-global] Error fetching from CoinGecko:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch from CoinGecko API" },
      { status: 502 }
    );
  }
}
