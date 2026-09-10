#!/usr/bin/env node
/**
 * Local BOT tip smoke test. Never commit private keys.
 *
 *   BOT_TEST_PK=0x... npx tsx scripts/test-bot-tip.mjs
 */
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const BOT_CHAIN_ID = 677;
const BOT_RPC_URL = "https://rpc.botchain.ai";
const BOT_TIP_AMOUNT = "0.3";
const BOT_TIP_RECIPIENT = "0x9B4d9039A96Bfd7320C865aaCC69F35b51f425a7";
const BOT_TIP_WEI = parseEther(BOT_TIP_AMOUNT);

const botChain = defineChain({
  id: BOT_CHAIN_ID,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: [BOT_RPC_URL] } },
});

const pk = process.env.BOT_TEST_PK?.trim();
if (!pk) {
  console.error("Set BOT_TEST_PK=0x... (do not commit)");
  process.exit(1);
}

const key = pk.startsWith("0x") ? pk : `0x${pk}`;
const account = privateKeyToAccount(key);
const publicClient = createPublicClient({
  chain: botChain,
  transport: http(BOT_RPC_URL),
});
const walletClient = createWalletClient({
  account,
  chain: botChain,
  transport: http(BOT_RPC_URL),
});

const bal = await publicClient.getBalance({ address: account.address });
console.log(
  JSON.stringify(
    {
      from: account.address,
      tipTo: BOT_TIP_RECIPIENT,
      tipAmount: BOT_TIP_AMOUNT,
      balanceBot: formatEther(bal),
      enough: bal >= BOT_TIP_WEI,
    },
    null,
    2,
  ),
);

// Portfolio probe via local API if up
try {
  const res = await fetch("http://localhost:3000/api/balances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evm: [account.address], mode: "indexed" }),
  });
  const data = await res.json();
  const botTokens = (data.tokens || []).filter(
    (t) => t.chainSlug === "botchain" || t.chainId === 677,
  );
  console.log("scan http", res.status, {
    tokenCount: data.tokenCount,
    botTokens: botTokens.map((t) => ({
      s: t.symbol,
      b: t.balance,
      u: t.valueUsd,
    })),
    providers: data.provider,
  });
} catch (e) {
  console.log("local balances API unavailable", e instanceof Error ? e.message : e);
}

if (bal < BOT_TIP_WEI) {
  console.error(
    `\nINSUFFICIENT BOT — need ${BOT_TIP_AMOUNT} + gas, have ${formatEther(bal)}.\nFund ${account.address} on BOT Chain (677), then re-run to send the tip.`,
  );
  process.exit(2);
}

const hash = await walletClient.sendTransaction({
  to: BOT_TIP_RECIPIENT,
  value: BOT_TIP_WEI,
});
console.log("sent tip", hash);

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    if (receipt?.status === "success") {
      const res = await fetch("http://localhost:3000/api/botchain/tip/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, from: account.address }),
      });
      console.log("verify api", res.status, await res.json());
      process.exit(res.ok ? 0 : 1);
    }
  } catch {
    console.log("waiting for inclusion…");
  }
}

console.error("Timed out waiting for tip confirmation");
process.exit(3);
