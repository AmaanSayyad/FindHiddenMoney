import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/balances";
import { verifyBotTipTx } from "@/lib/botchain/tip";
import {
  BOT_TIP_AMOUNT,
  BOT_TIP_RECIPIENT,
} from "@/lib/botchain/config";

export const maxDuration = 60;

type Body = {
  txHash?: string;
  from?: string;
};

/**
 * Verify a native BOT tip on chain 677 unlocked a wallet reveal.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const txHash = body.txHash?.trim();
  if (!txHash) {
    return NextResponse.json({ error: "txHash required" }, { status: 400 });
  }
  const from =
    body.from && isValidEvmAddress(body.from) ? body.from.toLowerCase() : undefined;

  const result = await verifyBotTipTx(txHash, from);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        tipAmount: BOT_TIP_AMOUNT,
        tipRecipient: BOT_TIP_RECIPIENT,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    unlocked: true,
    tipAmount: BOT_TIP_AMOUNT,
    tipRecipient: BOT_TIP_RECIPIENT,
    ...result,
  });
}

export async function GET() {
  return NextResponse.json({
    tipAmount: BOT_TIP_AMOUNT,
    tipRecipient: BOT_TIP_RECIPIENT,
    chainId: 677,
    symbol: "BOT",
  });
}
