import { getAddress, isAddress } from "viem";

type LogoToken = {
  chainId: number | null;
  chainSlug: string;
  tokenAddress: string | null;
  thumbnail: string | null;
  symbol: string;
  tokenType?: string;
};

/** Trust Wallet `blockchains/{name}` folder for common EVM nets. */
const TRUST_WALLET_CHAIN: Record<string, string> = {
  eth: "ethereum",
  ethereum: "ethereum",
  bsc: "smartchain",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanchec",
  fantom: "fantom",
  gnosis: "xdai",
  cronos: "cronos",
  celo: "celo",
  linea: "linea",
  scroll: "scroll",
  zksync: "zksync",
  blast: "blast",
  mantle: "mantle",
  moonbeam: "moonbeam",
  moonriver: "moonriver",
  aurora: "aurora",
  metis: "metis",
  fraxtal: "fraxtal",
  unichain: "unichain",
  solana: "solana",
  bitcoin: "bitcoin",
  tron: "tron",
  sui: "sui",
};

/** DefiLlama chain slug used in /icons/chains/rsz_{slug}.jpg */
const LLAMA_CHAIN: Record<string, string> = {
  eth: "ethereum",
  ethereum: "ethereum",
  bsc: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avax",
  fantom: "fantom",
  gnosis: "xdai",
  cronos: "cronos",
  celo: "celo",
  linea: "linea",
  scroll: "scroll",
  zksync: "era",
  blast: "blast",
  mantle: "mantle",
  fraxtal: "fraxtal",
  unichain: "unichain",
  sei: "sei",
  sonic: "sonic",
  hyperevm: "hyperliquid",
  mode: "mode",
  flare: "flare",
  rootstock: "rsk",
  robinhood: "ethereum",
  solana: "solana",
  bitcoin: "bitcoin",
  tron: "tron",
  sui: "sui",
  monads: "monad",
  monad: "monad",
};

function isNative(token: LogoToken): boolean {
  if (token.tokenType === "native") return true;
  if (!token.tokenAddress) return true;
  const a = token.tokenAddress.toLowerCase();
  return (
    a === "native" ||
    a === "0x0000000000000000000000000000000000000000" ||
    a === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  );
}

function checksumOrLower(address: string): string {
  if (isAddress(address)) {
    try {
      return getAddress(address);
    } catch {
      return address;
    }
  }
  return address;
}

function pushUnique(out: string[], url: string | null | undefined) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  if (!out.includes(url)) out.push(url);
}

/**
 * Ordered logo URL candidates for a token. First working image wins in the UI.
 * Covers missing Ankr/Moralis thumbnails and broken provider CDNs.
 */
export function tokenLogoCandidates(token: LogoToken): string[] {
  const out: string[] = [];
  const slug = token.chainSlug.toLowerCase().replace(/-/g, "_");
  const native = isNative(token);

  pushUnique(out, token.thumbnail);

  if (!native && token.tokenAddress) {
    const lower = token.tokenAddress.toLowerCase();
    const checksum = checksumOrLower(token.tokenAddress);

    if (token.chainId != null) {
      pushUnique(
        out,
        `https://icons.llamao.fi/icons/tokens/${token.chainId}/${lower}?h=64`,
      );
    }

    // Ethereum mainnet 1inch token list CDN (covers many majors).
    if (token.chainId === 1 || slug === "eth" || slug === "ethereum") {
      pushUnique(out, `https://tokens.1inch.io/${lower}.png`);
    }

    const tw = TRUST_WALLET_CHAIN[slug];
    if (slug === "solana" || tw === "solana") {
      pushUnique(
        out,
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${token.tokenAddress}/logo.png`,
      );
      pushUnique(
        out,
        `https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/assets/mainnet/${token.tokenAddress}/logo.png`,
      );
    } else if (tw && lower.startsWith("0x")) {
      pushUnique(
        out,
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${tw}/assets/${checksum}/logo.png`,
      );
    }
  } else {
    const llama = LLAMA_CHAIN[slug];
    if (llama) {
      pushUnique(out, `https://icons.llamao.fi/icons/chains/rsz_${llama}.jpg`);
    }
    const tw = TRUST_WALLET_CHAIN[slug];
    if (tw) {
      pushUnique(
        out,
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${tw}/info/logo.png`,
      );
    }
  }

  // Known ticker icons (native + popular ERC-20s when address lookup fails).
  const sym = token.symbol.trim().toLowerCase();
  if (sym && /^[a-z0-9]{1,12}$/.test(sym)) {
    pushUnique(
      out,
      `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${sym}.png`,
    );
  }

  return out;
}
