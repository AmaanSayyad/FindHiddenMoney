import { http, createConfig } from "wagmi";
import { metaMask } from "wagmi/connectors";
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  fantom,
  zkSync,
  polygonZkEvm,
  linea,
  scroll,
  blast,
  mantle,
  gnosis,
  celo,
  moonbeam,
  aurora,
  cronos,
  sei,
} from "wagmi/chains";
import { botChain } from "@/lib/botchain/chain";
import { BOT_RPC_URL } from "@/lib/botchain/config";

export const chains = [
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  fantom,
  zkSync,
  polygonZkEvm,
  linea,
  scroll,
  blast,
  mantle,
  gnosis,
  celo,
  moonbeam,
  aurora,
  cronos,
  sei,
  botChain,
] as const;

export const config = createConfig({
  chains,
  connectors: [metaMask()],
  transports: Object.fromEntries(
    chains.map((chain) => [
      chain.id,
      http(chain.id === botChain.id ? BOT_RPC_URL : undefined),
    ]),
  ) as Record<(typeof chains)[number]["id"], ReturnType<typeof http>>,
  ssr: true,
});
