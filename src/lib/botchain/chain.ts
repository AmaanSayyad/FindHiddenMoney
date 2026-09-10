import { defineChain } from "viem";
import {
  BOT_CHAIN_ID,
  BOT_EXPLORER_URL,
  BOT_NATIVE,
  BOT_RPC_URL,
} from "./config";

export const botChain = defineChain({
  id: BOT_CHAIN_ID,
  name: "BOT Chain",
  nativeCurrency: {
    name: BOT_NATIVE.name,
    symbol: BOT_NATIVE.symbol,
    decimals: BOT_NATIVE.decimals,
  },
  rpcUrls: {
    default: { http: [BOT_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "BOTScan", url: BOT_EXPLORER_URL },
  },
});

/** EIP-3085 payload for wallet_addEthereumChain */
export function botChainAddEthereumParams() {
  return {
    chainId: `0x${BOT_CHAIN_ID.toString(16)}`,
    chainName: "BOT Chain",
    nativeCurrency: {
      name: BOT_NATIVE.name,
      symbol: BOT_NATIVE.symbol,
      decimals: BOT_NATIVE.decimals,
    },
    rpcUrls: [BOT_RPC_URL],
    blockExplorerUrls: [BOT_EXPLORER_URL],
  };
}
