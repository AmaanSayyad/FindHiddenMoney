"use client";

import {
  BOT_TIP_AMOUNT,
  BOT_TIP_RECIPIENT,
} from "@/lib/botchain/config";

const UNLOCK_KEY = "fhm.botTipUnlocks.v1";

export type TipUnlockRecord = {
  address: string;
  txHash: string;
  at: number;
};

function loadAll(): Record<string, TipUnlockRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TipUnlockRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, TipUnlockRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(UNLOCK_KEY, JSON.stringify(map));
}

export function isWalletTipUnlocked(address: string): boolean {
  const key = address.toLowerCase();
  return Boolean(loadAll()[key]?.txHash);
}

export function getTipUnlock(address: string): TipUnlockRecord | null {
  return loadAll()[address.toLowerCase()] ?? null;
}

export function markWalletTipUnlocked(address: string, txHash: string) {
  const map = loadAll();
  map[address.toLowerCase()] = {
    address: address.toLowerCase(),
    txHash,
    at: Date.now(),
  };
  saveAll(map);
}

export function clearTipUnlock(address: string) {
  const map = loadAll();
  delete map[address.toLowerCase()];
  saveAll(map);
}

export { BOT_TIP_AMOUNT, BOT_TIP_RECIPIENT };
