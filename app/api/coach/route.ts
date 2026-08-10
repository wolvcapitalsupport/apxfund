import { NextRequest, NextResponse } from "next/server";

// ==========================================
// APY CALCULATION ENDPOINT
// POST /api/apy
// Calculates daily yield from an annual APY
// Formula: (balance * apy) / 52 / 7
// ==========================================

type APYRequestBody = {
  balance: number;
  apy: number; // as a percentage e.g. 5.2 for 5.2%
};

type APYResponseBody = {
  balance: number;
  apy_percentage: number;
  weekly_yield: number;
  daily_yield: number;
  projected_annual: number;
};

export async function POST(req: NextRequest) {
  try {
    const body: APYRequestBody = await req.json();
    const { balance, apy } = body;

    // --- Input validation ---
    if (balance === undefined || apy === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: balance and apy." },
        { status: 400 }
      );
    }

    if (typeof balance !== "number" || typeof apy !== "number") {
      return NextResponse.json(
        { error: "Fields balance and apy must be numbers." },
        { status: 400 }
      );
    }

    if (balance < 0) {
      return NextResponse.json(
        { error: "Balance cannot be negative." },
        { status: 400 }
      );
    }

    if (apy < 0 || apy > 100) {
      return NextResponse.json(
        { error: "APY must be between 0 and 100." },
        { status: 400 }
      );
    }

    // --- APY math ---
    // Convert percentage to decimal: 5.2% -> 0.052
    const apyDecimal = apy / 100;

    // Weekly yield: (balance * APY) / 52
    const weekly_yield = (balance * apyDecimal) / 52;

    // Daily yield: weekly / 7
    const daily_yield = weekly_yield / 7;

    // Projected annual (simple, not compounded)
    const projected_annual = balance * apyDecimal;

    const response: APYResponseBody = {
      balance: parseFloat(balance.toFixed(2)),
      apy_percentage: apy,
      weekly_yield: parseFloat(weekly_yield.toFixed(6)),
      daily_yield: parseFloat(daily_yield.toFixed(6)),
      projected_annual: parseFloat(projected_annual.toFixed(2)),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("[APY Route Error]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// Optional: block non-POST methods clearly
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
