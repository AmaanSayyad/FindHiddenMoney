"use client";

import { createSolanaClient } from "@metamask/connect-solana";
import { getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";

type ConnectFeature = {
  connect: (input?: {
    silent?: boolean;
  }) => Promise<{ accounts: ReadonlyArray<{ address: string }> }>;
};

let clientPromise: Promise<Awaited<ReturnType<typeof createSolanaClient>>> | null =
  null;

function isMetaMaskWallet(wallet: Wallet): boolean {
  return /metamask/i.test(wallet.name) && !/temple/i.test(wallet.name);
}

function accountsFromWallet(wallet: Wallet): string[] {
  return [
    ...new Set(
      wallet.accounts
        .map((a) => a.address)
        .filter((a) => typeof a === "string" && a.length >= 32),
    ),
  ];
}

async function ensureSolanaClient() {
  if (!clientPromise) {
    clientPromise = createSolanaClient({
      dapp: {
        name: "Find Hidden Money",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000",
      },
      analytics: { enabled: false },
      api: {
        supportedNetworks: {
          mainnet: "https://api.mainnet-beta.solana.com",
        },
      },
    });
  }
  return clientPromise;
}

function findRegisteredMetaMask(): Wallet | null {
  try {
    const { get } = getWallets();
    return get().find(isMetaMaskWallet) ?? null;
  } catch {
    return null;
  }
}

/**
 * Automatically request Solana accounts from MetaMask via Wallet Standard
 * (@metamask/connect-solana). No address paste required when Multichain Solana
 * is available in the user's MetaMask build.
 */
export async function requestMetaMaskSolanaAccounts(opts?: {
  /** Prefer silent reconnect when accounts already authorized. */
  silentFirst?: boolean;
}): Promise<{ addresses: string[]; error?: string }> {
  if (typeof window === "undefined") {
    return { addresses: [], error: "Not in browser" };
  }

  try {
    await ensureSolanaClient();
  } catch (err) {
    return {
      addresses: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to init MetaMask Solana client",
    };
  }

  const wallet = findRegisteredMetaMask() ?? (await ensureSolanaClient()).getWallet();
  const existing = accountsFromWallet(wallet);
  if (existing.length > 0 && opts?.silentFirst !== false) {
    return { addresses: existing };
  }

  const feature = wallet.features["standard:connect"] as
    | ConnectFeature
    | undefined;
  if (!feature?.connect) {
    return {
      addresses: existing,
      error:
        "MetaMask Solana connect unavailable — update MetaMask or enable Solana in the wallet.",
    };
  }

  try {
    if (opts?.silentFirst !== false) {
      try {
        const silent = await feature.connect({ silent: true });
        const addrs = silent.accounts.map((a) => a.address).filter(Boolean);
        if (addrs.length > 0) return { addresses: [...new Set(addrs)] };
      } catch {
        /* fall through to interactive */
      }
    }

    const { accounts } = await feature.connect();
    const addresses = [
      ...new Set(accounts.map((a) => a.address).filter(Boolean)),
    ];
    return { addresses };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/reject|denied|4001/i.test(msg)) {
      return { addresses: existing, error: "Solana connect rejected in MetaMask." };
    }
    return {
      addresses: existing,
      error: msg || "Solana connect failed",
    };
  }
}
