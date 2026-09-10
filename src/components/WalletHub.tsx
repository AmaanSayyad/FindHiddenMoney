"use client";

import { useState } from "react";
import { useMultichainWallet } from "@/context/MultichainWallet";
import type { MultiInsights, WalletSlice } from "@/lib/balances/multi-wallet";
import { formatUsd, shortenAddress } from "@/lib/format";
import { MAX_WALLETS } from "@/lib/wallets/roster";
import { MAX_SOLANA_WALLETS } from "@/lib/wallets/solana-roster";

type ViewMode = "combined" | "wallet";

type Props = {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  activeWallet: string | "all";
  onActiveWallet: (address: string | "all") => void;
  slices: WalletSlice[];
  insights: MultiInsights | null;
  totalValueUsd: number;
  scanProgress: { done: number; total: number } | null;
  scanning: boolean;
};

export function WalletHub({
  viewMode,
  onViewMode,
  activeWallet,
  onActiveWallet,
  slices,
  insights,
  totalValueUsd,
  scanProgress,
  scanning,
}: Props) {
  const {
    walletKind,
    roster,
    solanaRoster,
    activeEvm,
    requestMoreAccounts,
    importEvmBulk,
    toggleWallet,
    toggleSolanaWallet,
    setAllEnabled,
    setAllSolanaEnabled,
    removeWallet,
    removeSolanaWallet,
    addActivePhantomSolana,
    clearSolanaRoster,
    maxSolanaWallets,
    isPending,
  } = useMultichainWallet();

  const phantomSolanaRoster = solanaRoster.filter(
    (w) => w.source === "phantom" || w.source === "manual",
  );

  const isPhantom = walletKind === "phantom";
  const mmInRoster = activeEvm
    ? roster.find((w) => w.address === activeEvm)
    : undefined;
  const mmEnabled = Boolean(mmInRoster?.enabled);
  const mmScanned = activeEvm
    ? slices.find((s) => s.address === activeEvm)
    : undefined;

  const [bulk, setBulk] = useState("");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const onImport = () => {
    const result = importEvmBulk(bulk);
    if (result.error) {
      setBulkMsg(result.error);
      return;
    }
    setBulkMsg(`Added ${result.added}. Roster now ${result.total}/${MAX_WALLETS}.`);
    setBulk("");
    if (result.added > 0) setShowImport(false);
  };

  const onMoreMm = async () => {
    const added = await requestMoreAccounts();
    setBulkMsg(
      added > 0
        ? `MetaMask added ${added} account(s). Select multiple in the MetaMask prompt if needed.`
        : "No new MetaMask accounts — in the prompt, click the account list and select all you want.",
    );
  };

  const onAddPhantomSol = async () => {
    const added = await addActivePhantomSolana();
    setBulkMsg(
      added > 0
        ? `Added Phantom Solana account (${added} new). Switch accounts in Phantom to collect more (up to ${maxSolanaWallets}).`
        : "That account is already in the roster (or Phantom returned nothing). Switch to another account in Phantom, then click Add again.",
    );
  };

  const sliceByAddr = new Map(slices.map((s) => [s.address, s]));
  const enabledSolCount = phantomSolanaRoster.filter((w) => w.enabled).length;
  const enabledEvmCount = roster.filter((w) => w.enabled).length;

  return (
    <div className="wallet-hub">
      <div className="wallet-hub-head">
        <div>
          <p className="extra-chain-title">Wallets</p>
          <p className="extra-chain-copy">
            {isPhantom
              ? `Phantom-only: collect up to ${MAX_SOLANA_WALLETS} Solana accounts. Phantom does not show a MetaMask-style “select all” list — switch accounts in the extension and we auto-add each one. Roster is saved across disconnect.`
              : `MetaMask-only: analyze up to ${MAX_WALLETS} accounts together — combined total, or drill into each wallet. Deep scan stays per-wallet.`}
          </p>
        </div>
        <div className="view-toggle" role="group" aria-label="Portfolio view">
          <button
            type="button"
            className={viewMode === "combined" ? "active" : ""}
            onClick={() => {
              onViewMode("combined");
              onActiveWallet("all");
            }}
          >
            Combined
          </button>
          <button
            type="button"
            className={viewMode === "wallet" ? "active" : ""}
            onClick={() => onViewMode("wallet")}
          >
            Per wallet
          </button>
        </div>
      </div>

      {isPhantom ? (
        <div className="roster-warn" role="status">
          <p>
            <strong>How to connect all ~60 Phantom wallets:</strong> Phantom’s
            connect popup only approves the <em>currently selected</em> Solana
            account (there is no checkbox list for all wallets). Keep this page
            open, open Phantom, switch Account 1 → 2 → 3… — each switch is
            auto-added. Collected:{" "}
            <strong>{phantomSolanaRoster.length}</strong>/{maxSolanaWallets}.
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <button
              type="button"
              className="linkish"
              disabled={isPending}
              onClick={() => void onAddPhantomSol()}
            >
              Add active Phantom account
            </button>
            {" · "}
            <button
              type="button"
              className="linkish"
              onClick={() => {
                if (
                  confirm(
                    "Clear all saved Phantom Solana wallets from this app?",
                  )
                ) {
                  clearSolanaRoster();
                }
              }}
            >
              Clear saved roster
            </button>
          </p>
        </div>
      ) : null}

      {activeEvm && !mmInRoster && !isPhantom ? (
        <p className="roster-warn" role="status">
          MetaMask is on <code>{shortenAddress(activeEvm)}</code>, which is not
          in this roster. Click{" "}
          <button
            type="button"
            className="linkish"
            disabled={isPending}
            onClick={() => void onMoreMm()}
          >
            Add from MetaMask
          </button>{" "}
          — you were comparing MetaMask to a different wallet.
        </p>
      ) : null}

      {activeEvm && mmInRoster && !mmEnabled ? (
        <p className="roster-warn" role="status">
          Selected EVM account <code>{shortenAddress(activeEvm)}</code> is in
          the roster but off.{" "}
          <button
            type="button"
            className="linkish"
            onClick={() => {
              toggleWallet(activeEvm, true);
              onViewMode("wallet");
              onActiveWallet(activeEvm);
            }}
          >
            Enable &amp; focus it
          </button>
        </p>
      ) : null}

      {activeEvm &&
      mmEnabled &&
      viewMode === "wallet" &&
      activeWallet !== "all" &&
      activeWallet !== activeEvm ? (
        <p className="roster-warn" role="status">
          Viewing <code>{shortenAddress(activeWallet)}</code> while the wallet
          is on <code>{shortenAddress(activeEvm)}</code>
          {mmScanned?.status === "done"
            ? ` (EVM wallet scan: ${formatUsd(mmScanned.totalValueUsd)}).`
            : "."}{" "}
          <button
            type="button"
            className="linkish"
            onClick={() => onActiveWallet(activeEvm)}
          >
            Show active EVM account
          </button>
        </p>
      ) : null}

      {!isPhantom &&
      roster.length > 0 &&
      enabledEvmCount < roster.length ? (
        <p className="roster-warn" role="status">
          Only <strong>{enabledEvmCount}</strong> of{" "}
          <strong>{roster.length}</strong> EVM wallets are enabled. Click{" "}
          <button
            type="button"
            className="linkish"
            onClick={() => setAllEnabled(true)}
          >
            Enable all
          </button>
          .
        </p>
      ) : null}

      {isPhantom &&
      phantomSolanaRoster.length > 0 &&
      enabledSolCount < phantomSolanaRoster.length ? (
        <p className="roster-warn" role="status">
          Only <strong>{enabledSolCount}</strong> of{" "}
          <strong>{phantomSolanaRoster.length}</strong> Solana wallets are
          enabled.{" "}
          <button
            type="button"
            className="linkish"
            onClick={() => setAllSolanaEnabled(true)}
          >
            Enable all Solana
          </button>
        </p>
      ) : null}

      {insights ? (
        <div className="insight-strip">
          <div>
            <span>Combined</span>
            <strong>{formatUsd(totalValueUsd)}</strong>
          </div>
          <div>
            <span>Scanned</span>
            <strong>
              {insights.scannedCount}/
              {enabledEvmCount + enabledSolCount}
            </strong>
          </div>
          <div>
            <span>In roster</span>
            <strong>
              {isPhantom
                ? `${phantomSolanaRoster.length} SOL · ${roster.length} EVM`
                : roster.length}
            </strong>
          </div>
          <div>
            <span>Empty</span>
            <strong>{insights.emptyCount}</strong>
          </div>
          <div>
            <span>Top wallet</span>
            <strong>{Math.round(insights.topWalletShare * 100)}%</strong>
          </div>
          <div>
            <span>Top 3</span>
            <strong>{Math.round(insights.top3Share * 100)}%</strong>
          </div>
          {insights.errorCount > 0 ? (
            <div>
              <span>Errors</span>
              <strong className="insight-danger">{insights.errorCount}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      {scanProgress && scanning ? (
        <div className="scan-progress" role="status">
          <div
            className="scan-progress-bar"
            style={{
              width: `${Math.round(
                (scanProgress.done / Math.max(scanProgress.total, 1)) * 100,
              )}%`,
            }}
          />
          <p>
            Scanning wallets {scanProgress.done}/{scanProgress.total}
            {scanProgress.total > 20
              ? " — large roster; batched scan in progress."
              : ""}
          </p>
        </div>
      ) : null}

      <div className="wallet-hub-actions">
        {isPhantom ? (
          <>
            <button
              type="button"
              className="btn-ghost"
              disabled={isPending}
              onClick={() => void onAddPhantomSol()}
            >
              Add active Phantom account
            </button>
            <button
              type="button"
              className="linkish"
              onClick={() => setAllSolanaEnabled(true)}
            >
              Enable all Solana
            </button>
            <button
              type="button"
              className="linkish"
              onClick={() => setAllSolanaEnabled(false)}
            >
              Disable all Solana
            </button>
            {roster.length > 0 ? (
              <>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setAllEnabled(true)}
                >
                  Enable all EVM
                </button>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setAllEnabled(false)}
                >
                  Disable all EVM
                </button>
              </>
            ) : null}
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-ghost"
              disabled={isPending}
              onClick={() => void onMoreMm()}
            >
              Add from MetaMask
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowImport((v) => !v)}
            >
              {showImport ? "Hide paste" : "Paste addresses"}
            </button>
            <button
              type="button"
              className="linkish"
              onClick={() => setAllEnabled(true)}
            >
              Enable all
            </button>
            <button
              type="button"
              className="linkish"
              onClick={() => setAllEnabled(false)}
            >
              Disable all
            </button>
          </>
        )}
      </div>

      {showImport && !isPhantom ? (
        <div className="bulk-import">
          <textarea
            rows={4}
            spellCheck={false}
            placeholder="Paste many 0x addresses (comma or newline separated). Max 200."
            value={bulk}
            onChange={(e) => {
              setBulk(e.target.value);
              setBulkMsg(null);
            }}
          />
          <button type="button" className="btn-ghost" onClick={onImport}>
            Import to roster
          </button>
        </div>
      ) : null}
      {bulkMsg ? <p className="extra-chain-copy">{bulkMsg}</p> : null}

      {isPhantom && phantomSolanaRoster.length > 0 ? (
        <>
          <p className="extra-chain-title" style={{ marginTop: "1rem" }}>
            Solana ({phantomSolanaRoster.length}/{maxSolanaWallets})
          </p>
          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead>
                <tr>
                  <th>On</th>
                  <th>Wallet</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Assets</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {phantomSolanaRoster.map((w) => {
                  const slice = sliceByAddr.get(w.address);
                  const selected =
                    viewMode === "wallet" && activeWallet === w.address;
                  const status = !w.enabled
                    ? "off"
                    : slice?.status ?? (scanning ? "pending" : "idle");
                  return (
                    <tr
                      key={`sol:${w.address}`}
                      className={[
                        selected ? "selected" : "",
                        !w.enabled ? "row-off" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={w.enabled}
                          onChange={(e) =>
                            toggleSolanaWallet(w.address, e.target.checked)
                          }
                          aria-label={`Include ${w.label}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="wallet-pick"
                          onClick={() => {
                            onViewMode("wallet");
                            onActiveWallet(w.address);
                          }}
                          title={w.address}
                        >
                          <strong>{w.label}</strong>
                          <code>{shortenAddress(w.address)}</code>
                          <em>PH · Solana</em>
                        </button>
                      </td>
                      <td>
                        <span className={`status-pill status-${status}`}>
                          {status}
                        </span>
                      </td>
                      <td className="num">
                        {w.enabled
                          ? formatUsd(slice?.totalValueUsd ?? null)
                          : "—"}
                      </td>
                      <td className="num">
                        {w.enabled ? (slice?.tokenCount ?? "—") : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => removeSolanaWallet(w.address)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {(roster.length > 0 || !isPhantom) && (
        <>
          {isPhantom && roster.length > 0 ? (
            <p className="extra-chain-title" style={{ marginTop: "1rem" }}>
              EVM ({roster.length})
            </p>
          ) : null}
          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead>
                <tr>
                  <th>On</th>
                  <th>Wallet</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Assets</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {roster.map((w) => {
                  const slice = sliceByAddr.get(w.address);
                  const selected =
                    viewMode === "wallet" && activeWallet === w.address;
                  const status = !w.enabled
                    ? "off"
                    : slice?.status ?? (scanning ? "pending" : "idle");
                  return (
                    <tr
                      key={w.address}
                      className={[
                        selected ? "selected" : "",
                        !w.enabled ? "row-off" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={w.enabled}
                          onChange={(e) =>
                            toggleWallet(w.address, e.target.checked)
                          }
                          aria-label={`Include ${w.label}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="wallet-pick"
                          onClick={() => {
                            onViewMode("wallet");
                            onActiveWallet(w.address);
                          }}
                          title={w.address}
                        >
                          <strong>{w.label}</strong>
                          <code>{shortenAddress(w.address)}</code>
                          <em>
                            {w.source === "metamask"
                              ? "MM"
                              : w.source === "phantom"
                                ? "PH"
                                : "pasted"}
                            {activeEvm === w.address ? " · selected" : ""}
                          </em>
                        </button>
                      </td>
                      <td>
                        <span className={`status-pill status-${status}`}>
                          {status}
                        </span>
                      </td>
                      <td className="num">
                        {w.enabled
                          ? formatUsd(slice?.totalValueUsd ?? null)
                          : "—"}
                      </td>
                      <td className="num">
                        {w.enabled ? (slice?.tokenCount ?? "—") : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => removeWallet(w.address)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {roster.length === 0 && !isPhantom ? (
              <p className="empty-state">
                Connect MetaMask (multi-select accounts) or paste a list of
                addresses.
              </p>
            ) : null}
            {roster.length === 0 && isPhantom && phantomSolanaRoster.length === 0 ? (
              <p className="empty-state">
                Connect Phantom, then switch accounts in the extension to build
                your Solana roster (up to {maxSolanaWallets}).
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
