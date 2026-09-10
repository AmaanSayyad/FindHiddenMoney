/** BOT Chain (mainnet) — product + tip constants */

export const BOT_CHAIN_ID = 677;
export const BOT_CHAIN_ID_HEX = "0x2a5";

export const BOT_RPC_URL = "https://rpc.botchain.ai";
export const BOT_EXPLORER_URL = "https://scan.botchain.ai";
export const BOT_WS_URL = "wss://ws-rpc.botchain.ai";

export const BOT_NATIVE = {
  symbol: "BOT",
  name: "BOT",
  decimals: 18,
} as const;

/** Where Find Hidden Money collects reveal tips (native BOT). */
export const BOT_TIP_RECIPIENT =
  "0x9B4d9039A96Bfd7320C865aaCC69F35b51f425a7" as const;

/** Tip required to unlock token holdings. */
export const BOT_TIP_AMOUNT = "0.3";
export const BOT_TIP_AMOUNT_WEI = 300_000_000_000_000_000n; // 0.3 * 1e18

export const BOT_TOKENS = {
  wbot: {
    address: "0xD5452816194a3784dBa983426cCe7c122F4abd30" as const,
    symbol: "WBOT",
    name: "Wrapped BOT",
    decimals: 18,
  },
  usdt: {
    address: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C" as const,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  ca: {
    address: "0x546307af427902A75771434Df831d88219784E19" as const,
    symbol: "CA",
    name: "CaryPact",
    decimals: 18,
  },
} as const;

export const BOT_MULTICALL3 =
  "0x47FA21f684bBAD707A53a0f9BE59F1422F46C265" as const;

export function botExplorerTx(hash: string): string {
  return `${BOT_EXPLORER_URL}/tx/${hash}`;
}

export function botExplorerAddress(address: string): string {
  return `${BOT_EXPLORER_URL}/address/${address}`;
}
