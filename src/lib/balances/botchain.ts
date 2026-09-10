import { nodeRequest } from "@/lib/balances/http";
import type { PortfolioResult, TokenBalance } from "@/lib/balances/types";
import {
  BOT_CHAIN_ID,
  BOT_NATIVE,
  BOT_RPC_URL,
  BOT_TOKENS,
} from "@/lib/botchain/config";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const { status, text } = await nodeRequest(BOT_RPC_URL, {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    timeoutMs: 12_000,
  });
  if (status < 200 || status >= 300) {
    throw new Error(`BOT RPC HTTP ${status}`);
  }
  const data = JSON.parse(text) as { result?: T; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return data.result as T;
}

async function fetchBotUsdPrice(): Promise<number | null> {
  try {
    const { status, text } = await nodeRequest(
      "https://api.coinstore.com/api/v1/ticker/price;symbol=BOTUSDT",
      { method: "GET", timeoutMs: 8_000 },
    );
    if (status >= 200 && status < 300) {
      const data = JSON.parse(text) as {
        data?: Array<{ price?: string }>;
      };
      const price = Number.parseFloat(data.data?.[0]?.price ?? "");
      if (Number.isFinite(price) && price > 0) return price;
    }
  } catch {
    /* fall through */
  }
  try {
    const { status, text } = await nodeRequest(
      "https://api.coingecko.com/api/v3/simple/price?ids=bot&vs_currencies=usd",
      { method: "GET", timeoutMs: 8_000 },
    );
    if (status >= 200 && status < 300) {
      const data = JSON.parse(text) as { bot?: { usd?: number } };
      const price = data.bot?.usd;
      if (typeof price === "number" && Number.isFinite(price)) return price;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function erc20Balance(
  token: string,
  owner: string,
): Promise<bigint | null> {
  // balanceOf(address)
  const data =
    "0x70a08231" + owner.replace(/^0x/, "").toLowerCase().padStart(64, "0");
  try {
    const result = await rpc<string>("eth_call", [
      { to: token, data },
      "latest",
    ]);
    if (typeof result !== "string" || result === "0x") return null;
    return BigInt(result);
  } catch {
    return null;
  }
}

/**
 * Native BOT + WBOT / USDT / CA on BOT Chain mainnet (677).
 */
export async function fetchBotChainPortfolio(
  address: string,
): Promise<PortfolioResult> {
  const warnings: string[] = [];
  const tokens: TokenBalance[] = [];
  const lower = address.toLowerCase();

  const [botPrice, rawNative] = await Promise.all([
    fetchBotUsdPrice(),
    rpc<string>("eth_getBalance", [lower, "latest"]).catch(() => null),
  ]);

  if (rawNative) {
    const raw = BigInt(rawNative);
    if (raw > BigInt(0)) {
      const balance = Number(raw) / 10 ** BOT_NATIVE.decimals;
      tokens.push({
        chainId: BOT_CHAIN_ID,
        chainName: "BOT Chain",
        chainSlug: "botchain",
        symbol: BOT_NATIVE.symbol,
        name: "BOT",
        balance,
        balanceRaw: raw.toString(),
        decimals: BOT_NATIVE.decimals,
        priceUsd: botPrice,
        valueUsd: botPrice != null ? balance * botPrice : null,
        tokenAddress: null,
        thumbnail: null,
        tokenType: "native",
      });
    }
  } else {
    warnings.push("BOT Chain: native balance RPC failed.");
  }

  const erc20s = [
    { ...BOT_TOKENS.wbot, priceUsd: botPrice },
    { ...BOT_TOKENS.usdt, priceUsd: 1 },
    { ...BOT_TOKENS.ca, priceUsd: null as number | null },
  ];

  await Promise.all(
    erc20s.map(async (t) => {
      const raw = await erc20Balance(t.address, lower);
      if (raw == null || raw === BigInt(0)) return;
      const balance = Number(raw) / 10 ** t.decimals;
      if (!(balance > 0)) return;
      tokens.push({
        chainId: BOT_CHAIN_ID,
        chainName: "BOT Chain",
        chainSlug: "botchain",
        symbol: t.symbol,
        name: t.name,
        balance,
        balanceRaw: raw.toString(),
        decimals: t.decimals,
        priceUsd: t.priceUsd,
        valueUsd: t.priceUsd != null ? balance * t.priceUsd : null,
        tokenAddress: t.address,
        thumbnail: null,
        tokenType: "erc20",
      });
    }),
  );

  tokens.sort(
    (a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0) || b.balance - a.balance,
  );
  const totalValueUsd = tokens.reduce((s, t) => s + (t.valueUsd ?? 0), 0);

  if (tokens.length > 0) {
    warnings.push(
      `BOT Chain: ${tokens.length} balance(s) via rpc.botchain.ai.`,
    );
  } else {
    warnings.push("BOT Chain: no BOT / WBOT / USDT / CA balances.");
  }

  return {
    address: lower,
    totalValueUsd,
    tokenCount: tokens.length,
    chainCount: tokens.length > 0 ? 1 : 0,
    tokens,
    provider: "botchain-rpc",
    scannedAt: new Date().toISOString(),
    warnings,
  };
}
