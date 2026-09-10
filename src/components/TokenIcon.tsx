"use client";

import { useEffect, useState } from "react";
import { tokenLogoCandidates } from "@/lib/token-logo";

type Props = {
  chainId: number | null;
  chainSlug: string;
  tokenAddress: string | null;
  thumbnail: string | null;
  symbol: string;
  tokenType?: string;
  size?: number;
};

/**
 * Renders a token logo, cascading through provider thumbnail → Llama →
 * Trust Wallet → symbol CDN when URLs 404.
 */
export function TokenIcon({
  chainId,
  chainSlug,
  tokenAddress,
  thumbnail,
  symbol,
  tokenType,
  size = 36,
}: Props) {
  const candidates = tokenLogoCandidates({
    chainId,
    chainSlug,
    tokenAddress,
    thumbnail,
    symbol,
    tokenType,
  });
  const [index, setIndex] = useState(0);

  // Reset when the token identity changes.
  useEffect(() => {
    setIndex(0);
  }, [chainSlug, tokenAddress, thumbnail, symbol]);

  const src = candidates[index];
  const initials = (symbol || "?").slice(0, 2).toUpperCase();

  if (!src) {
    return (
      <span
        className="token-thumb fallback"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      className="token-thumb"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        setIndex((i) => (i + 1 < candidates.length ? i + 1 : candidates.length));
      }}
    />
  );
}
