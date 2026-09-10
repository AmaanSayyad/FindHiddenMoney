"use client";

import { useState } from "react";
import {
  BOT_CHAIN_ID,
  BOT_EXPLORER_URL,
  BOT_TIP_AMOUNT,
  BOT_TIP_RECIPIENT,
  botExplorerTx,
} from "@/lib/botchain/config";
import { botChainAddEthereumParams } from "@/lib/botchain/chain";
import { tipValueWei } from "@/lib/botchain/tip";
import {
  isWalletTipUnlocked,
  markWalletTipUnlocked,
} from "@/lib/botchain/unlock";
import { shortenAddress } from "@/lib/format";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

function getEvmProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    ethereum?: EthereumProvider;
    phantom?: { ethereum?: EthereumProvider };
  };
  // Prefer Phantom ethereum when user connected via Phantom; else injected.
  return w.phantom?.ethereum || w.ethereum || null;
}

async function ensureBotChain(provider: EthereumProvider) {
  const chainId = (await provider.request({ method: "eth_chainId" })) as string;
  const want = `0x${BOT_CHAIN_ID.toString(16)}`;
  if (chainId?.toLowerCase() === want) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: want }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [botChainAddEthereumParams()],
      });
      return;
    }
    throw err;
  }
}

type Props = {
  /** Primary EVM address that must tip (payer). */
  payerAddress: string | null;
  unlocked: boolean;
  onUnlocked: (txHash: string) => void;
};

export function BotTipGate({ payerAddress, unlocked, onUnlocked }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualHash, setManualHash] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const verifyHash = async (txHash: string, from?: string) => {
    const res = await fetch("/api/botchain/tip/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash,
        from: from || payerAddress || undefined,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      txHash?: string;
    };
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Tip verification failed");
    }
    const hash = data.txHash || txHash;
    if (payerAddress) markWalletTipUnlocked(payerAddress, hash);
    setLastTx(hash);
    onUnlocked(hash);
  };

  const onTip = async () => {
    setError(null);
    if (!payerAddress) {
      setError("Connect an EVM wallet (MetaMask or Phantom) to tip in BOT.");
      return;
    }
    if (isWalletTipUnlocked(payerAddress)) {
      onUnlocked(manualHash || "cached");
      return;
    }

    const provider = getEvmProvider();
    if (!provider) {
      setError("No EVM wallet found — install MetaMask or Phantom.");
      return;
    }

    setPending(true);
    try {
      await ensureBotChain(provider);
      const valueHex = `0x${tipValueWei().toString(16)}`;
      const txHash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: payerAddress,
            to: BOT_TIP_RECIPIENT,
            value: valueHex,
            chainId: `0x${BOT_CHAIN_ID.toString(16)}`,
          },
        ],
      })) as string;

      setLastTx(txHash);
      // Brief wait for inclusion on ~0.75s blocks
      await new Promise((r) => setTimeout(r, 2500));
      await verifyHash(txHash, payerAddress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/insufficient|funds|balance/i.test(msg)) {
        setError(
          `Need at least ${BOT_TIP_AMOUNT} BOT on BOT Chain (677) plus gas. Bridge USDT→BOT or buy BOT on BDEX.`,
        );
      } else if (/reject|denied|4001/i.test(msg)) {
        setError("Tip cancelled in wallet.");
      } else {
        setError(msg || "Tip failed");
      }
    } finally {
      setPending(false);
    }
  };

  const onManualVerify = async () => {
    setError(null);
    if (!manualHash.trim()) {
      setError("Paste a BOT Chain tip transaction hash.");
      return;
    }
    setPending(true);
    try {
      await verifyHash(manualHash.trim(), payerAddress || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setPending(false);
    }
  };

  if (unlocked) {
    return (
      <div className="bot-tip-banner bot-tip-unlocked" role="status">
        <p>
          <strong>Tokens unlocked</strong> with a {BOT_TIP_AMOUNT} BOT tip on
          BOT Chain.
          {lastTx && lastTx.startsWith("0x") ? (
            <>
              {" "}
              <a
                href={botExplorerTx(lastTx)}
                target="_blank"
                rel="noreferrer"
              >
                View tip
              </a>
            </>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className="bot-tip-gate" role="region" aria-label="BOT tip unlock">
      <div className="bot-tip-copy">
        <p className="bot-tip-eyebrow">BOT Chain · reveal fee</p>
        <h2 className="bot-tip-title">
          Tip {BOT_TIP_AMOUNT} BOT to unlock tokens &amp; chains
        </h2>
        <p className="bot-tip-body">
          Your total portfolio value stays visible. Token names and which
          networks they sit on unlock after you tip native BOT on BOT Chain
          (chain ID {BOT_CHAIN_ID}). Tips go to{" "}
          <code title={BOT_TIP_RECIPIENT}>
            {shortenAddress(BOT_TIP_RECIPIENT)}
          </code>
          .
        </p>
      </div>

      <div className="bot-tip-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={pending || !payerAddress}
          onClick={() => void onTip()}
        >
          {pending ? "Confirming tip…" : `Tip ${BOT_TIP_AMOUNT} BOT & unlock`}
        </button>
        <a
          className="btn-ghost"
          href="https://dex.botchain.ai/#/swap"
          target="_blank"
          rel="noreferrer"
        >
          Get BOT on BDEX
        </a>
        <a
          className="linkish"
          href={`${BOT_EXPLORER_URL}/address/${BOT_TIP_RECIPIENT}`}
          target="_blank"
          rel="noreferrer"
        >
          Tip address on explorer
        </a>
      </div>

      <div className="bot-tip-manual">
        <p className="extra-chain-copy">
          Already tipped? Paste the transaction hash to verify.
        </p>
        <div className="bot-tip-manual-row">
          <input
            type="text"
            spellCheck={false}
            placeholder="0x…"
            value={manualHash}
            onChange={(e) => setManualHash(e.target.value)}
          />
          <button
            type="button"
            className="btn-ghost"
            disabled={pending}
            onClick={() => void onManualVerify()}
          >
            Verify tip
          </button>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {!payerAddress ? (
        <p className="extra-chain-copy">
          Connect MetaMask or Phantom (EVM) first — the tip is paid from that
          address.
        </p>
      ) : null}
    </div>
  );
}
