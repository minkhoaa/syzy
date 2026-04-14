import { NextRequest, NextResponse } from "next/server";

const DEXSCREENER_API = "https://api.dexscreener.com/tokens/v1/solana";

/**
 * Proxy endpoint for DexScreener API to avoid CORS issues.
 * Usage: GET /api/dexscreener?mint=<token_mint_address>
 *
 * Returns the DexScreener pair data array for the given Solana token.
 * The first pair (index 0) is typically the most liquid.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mint = searchParams.get("mint");

  if (!mint) {
    return NextResponse.json(
      { error: "Missing 'mint' query parameter" },
      { status: 400 }
    );
  }

  try {
    const url = `${DEXSCREENER_API}/${mint}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `DexScreener API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API /api/dexscreener] Error fetching from DexScreener:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch from DexScreener API" },
      { status: 502 }
    );
  }
}
