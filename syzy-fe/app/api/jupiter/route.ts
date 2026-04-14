import { NextRequest, NextResponse } from "next/server";

const JUPITER_PRICE_API = "https://lite-api.jup.ag/price/v3/price";

/**
 * Proxy endpoint for Jupiter Price API to avoid CORS issues.
 * Usage: GET /api/jupiter?mint=<token_mint_address>
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
    const url = `${JUPITER_PRICE_API}?ids=${encodeURIComponent(mint)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Jupiter API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API /api/jupiter] Error fetching from Jupiter:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch from Jupiter API" },
      { status: 502 }
    );
  }
}
