import { NextRequest, NextResponse } from "next/server";

const PUMP_API_V3 = "https://frontend-api-v3.pump.fun/coins";

/**
 * Proxy endpoint for pump.fun API to avoid CORS issues.
 * Usage: GET /api/pump?mint=<token_mint_address>
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
    const url = `${PUMP_API_V3}/${mint}?sync=true`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Syzy/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Pump.fun API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API /api/pump] Error fetching from pump.fun:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch from pump.fun API" },
      { status: 502 }
    );
  }
}
