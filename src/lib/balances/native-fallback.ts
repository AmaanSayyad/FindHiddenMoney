import { NATIVE_SCAN_CHAINS } from "./chains";
import { nodeRequest } from "./http";
import type { PortfolioResult, TokenBalance } from "./types";

const PRICE_IDS: Record<string, string> = {
  ETH: "ethereum",
  BNB: "binancecoin",
  POL: "matic-network",
  AVAX: "avalanche-2",
  FTM: "fantom",
  frxETH: "frax-ether",
  FRXETH: "frax-ether",
};

async function ethGetBalance(
  rpc: string,
  address: string,
): Promise<bigint | null> {
  try {
    const { status, text } = await nodeRequest(rpc, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
      timeoutMs: 8_000,
    });
    if (status < 200 || status >= 300) return null;
    const data = JSON.parse(text) as { result?: string };
    if (typeof data.result !== "string") return null;
    return BigInt(data.result);
  } catch {
    return null;
  }
}

async function fetchNativePrices(
  symbols: string[],
): Promise<Map<string, number>> {
  const ids = [
    ...new Set(
      symbols.map((s) => PRICE_IDS[s]).filter((id): id is string => !!id),
    ),
  ];
  const out = new Map<string, number>();
  if (ids.length === 0) return out;
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const { status, text } = await nodeRequest(url, { timeoutMs: 8_000 });
    if (status < 200 || status >= 300) return out;
    const data = JSON.parse(text) as Record<string, { usd?: number }>;
    for (const [sym, id] of Object.entries(PRICE_IDS)) {
      const usd = data[id]?.usd;
      if (typeof usd === "number") out.set(sym, usd);
    }
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * Native gas balances on major public EVM RPCs.
 * Used when Ankr is missing or rate-limited. Does not enumerate ERC-20s.
 */
export async function fetchNativeFallbackPortfolio(
  address: string,
): Promise<PortfolioResult> {
  // Prefer the major chains first so multi-wallet sweeps stay light.
  const chains = NATIVE_SCAN_CHAINS.slice(0, 8);

  const settled = await Promise.all(
    chains.map(async (chain): Promise<TokenBalance | null> => {
      const raw = await ethGetBalance(chain.rpc, address);
      if (raw == null || raw === BigInt(0)) return null;

      const balance = Number(raw) / 10 ** chain.decimals;
      if (balance <= 0) return null;

      return {
        chainId: chain.chainId,
        chainName: chain.name,
        chainSlug: chain.slug,
        symbol: chain.symbol,
        name: `${chain.symbol} (native)`,
        balance,
        balanceRaw: raw.toString(),
        decimals: chain.decimals,
        priceUsd: null,
        valueUsd: null,
        tokenAddress: null,
        thumbnail: null,
        tokenType: "native",
      };
    }),
  );

  let tokens = settled.filter((t): t is TokenBalance => t != null);
  const prices = await fetchNativePrices(tokens.map((t) => t.symbol));
  tokens = tokens.map((t) => {
    const priceUsd = prices.get(t.symbol) ?? null;
    return {
      ...t,
      priceUsd,
      valueUsd: priceUsd != null ? t.balance * priceUsd : null,
    };
  });

  const chainsHit = new Set(tokens.map((t) => t.chainSlug));
  const totalValueUsd = tokens.reduce((s, t) => s + (t.valueUsd ?? 0), 0);

  return {
    address,
    totalValueUsd,
    tokenCount: tokens.length,
    chainCount: chainsHit.size,
    tokens,
    provider: "native-rpc-fallback",
    scannedAt: new Date().toISOString(),
    warnings: [
      "Native RPC fallback — major-chain gas balances only (ERC-20 discovery needs Ankr).",
    ],
  };
}
