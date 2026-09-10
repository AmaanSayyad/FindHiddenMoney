"use client";

import { useEffect, useState } from "react";
import { useMultichainWallet } from "@/context/MultichainWallet";
import { shortenAddress } from "@/lib/format";
import { isPhantomInstalled } from "@/lib/multichain/phantom";

export function ConnectButton() {
  const {
    accounts,
    walletKind,
    roster,
    solanaRoster,
    enabledEvm,
    enabledSolana,
    isConnected,
    isPending,
    error,
    connect,
    connectPhantom,
    disconnect,
  } = useMultichainWallet();
  const [mounted, setMounted] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasPhantom(isPhantomInstalled());
  }, []);

  if (!mounted) {
    return (
      <button type="button" className="btn-primary" disabled>
        Connect wallet
      </button>
    );
  }

  if (isConnected) {
    const solCount = enabledSolana.length || solanaRoster.length;
    const evmCount = enabledEvm.length || roster.length;
    const label =
      walletKind === "phantom"
        ? solCount > 0 && evmCount > 0
          ? `${solCount} SOL · ${evmCount} EVM`
          : solCount > 1
            ? `${solCount} Solana wallets`
            : solCount === 1
              ? shortenAddress(enabledSolana[0] || solanaRoster[0]!.address)
              : evmCount > 1
                ? `${evmCount} EVM wallets`
                : enabledEvm[0]
                  ? shortenAddress(enabledEvm[0])
                  : accounts.solana[0]
                    ? shortenAddress(accounts.solana[0])
                    : "connected"
        : enabledEvm.length > 1
          ? `${enabledEvm.length} wallets`
          : enabledEvm[0]
            ? shortenAddress(enabledEvm[0])
            : accounts.evm[0]
              ? shortenAddress(accounts.evm[0])
              : `${roster.length || 1} wallet`;

    const kindLabel =
      walletKind === "phantom"
        ? "Phantom"
        : walletKind === "metamask"
          ? "MetaMask"
          : "Wallet";

    return (
      <div className="connect-row">
        <span
          className="address-chip"
          title={
            [
              ...enabledSolana,
              ...enabledEvm,
              ...accounts.all.map((a) => a.caip10),
            ].join("\n") || undefined
          }
        >
          {kindLabel} · {label}
        </span>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => void disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="connect-stack">
      <div className="connect-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={isPending}
          onClick={() => void connect().catch(() => undefined)}
        >
          {isPending ? "Connecting…" : "Connect MetaMask"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={isPending}
          onClick={() => void connectPhantom().catch(() => undefined)}
        >
          {isPending ? "Connecting…" : "Connect Phantom"}
        </button>
      </div>
      {hasPhantom ? (
        <p className="muted-hint">
          Phantom and MetaMask stay separate. Phantom connect only returns the
          active Solana account — switch accounts in Phantom to collect all
          wallets (saved across disconnect).
        </p>
      ) : (
        <p className="muted-hint">
          Phantom not detected — install the extension to use that button.
        </p>
      )}
      {error ? (
        <p className="error-text">
          {/temple|another wallet|not found|not detected/i.test(error)
            ? "Couldn’t open the wallet — another extension may be capturing the page."
            : error}
        </p>
      ) : null}
    </div>
  );
}
