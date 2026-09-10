import { createPublicClient, formatEther, http, parseEther, type Hash } from "viem";
import {
  BOT_RPC_URL,
  BOT_TIP_AMOUNT,
  BOT_TIP_AMOUNT_WEI,
  BOT_TIP_RECIPIENT,
} from "./config";
import { botChain } from "./chain";

export type TipVerifyResult =
  | {
      ok: true;
      txHash: Hash;
      from: string;
      to: string;
      valueWei: string;
      valueBot: string;
      blockNumber: string;
    }
  | { ok: false; error: string };

export function getBotPublicClient() {
  return createPublicClient({
    chain: botChain,
    transport: http(BOT_RPC_URL),
  });
}

/**
 * Verify a native BOT tip tx: success, recipient, and value ≥ tip amount.
 */
export async function verifyBotTipTx(
  txHash: string,
  expectedFrom?: string,
): Promise<TipVerifyResult> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ok: false, error: "Invalid transaction hash" };
  }

  const client = getBotPublicClient();
  const hash = txHash as Hash;

  let receipt;
  let tx;
  try {
    [receipt, tx] = await Promise.all([
      client.getTransactionReceipt({ hash }),
      client.getTransaction({ hash }),
    ]);
  } catch {
    return {
      ok: false,
      error: "Transaction not found on BOT Chain yet — wait a few seconds and retry.",
    };
  }

  if (!receipt || receipt.status !== "success") {
    return { ok: false, error: "Transaction failed or still pending on BOT Chain" };
  }

  const to = (tx.to || "").toLowerCase();
  const tipTo = BOT_TIP_RECIPIENT.toLowerCase();
  if (to !== tipTo) {
    return {
      ok: false,
      error: `Tip must be sent to ${BOT_TIP_RECIPIENT}`,
    };
  }

  const value = tx.value ?? BigInt(0);
  if (value < BOT_TIP_AMOUNT_WEI) {
    return {
      ok: false,
      error: `Tip too small — need at least ${BOT_TIP_AMOUNT} BOT (got ${formatEther(value)} BOT)`,
    };
  }

  const from = tx.from.toLowerCase();
  if (expectedFrom && from !== expectedFrom.toLowerCase()) {
    return {
      ok: false,
      error: "Tip payer does not match the connected wallet",
    };
  }

  return {
    ok: true,
    txHash: hash,
    from,
    to,
    valueWei: value.toString(),
    valueBot: formatEther(value),
    blockNumber: receipt.blockNumber.toString(),
  };
}

export function tipValueWei(): bigint {
  return parseEther(BOT_TIP_AMOUNT);
}
