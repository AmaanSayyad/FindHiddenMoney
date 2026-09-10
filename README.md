# Find Hidden Money

> Text pitch deck — scroll like slides.

---

## Slide 01 · Title

```
FIND HIDDEN MONEY
─────────────────
Forgotten tokens. Every chain your wallet touches.
Unlock the inventory with BOT.

Product    Find Hidden Money
Network    BOT Chain (chain ID 677) + multichain EVM / Solana / BTC / more
GitHub     https://github.com/AmaanSayyad/FindHiddenMoney
```

---

## Slide 02 · The problem

```
THE PROBLEM
───────────
People hold value they cannot see.

• One MetaMask / Phantom account spans dozens of L2s and sidechains
• Dust, airdrops, bridged stables, and “dead” L2 gas sit forgotten
• Explorers are per-chain; wallets hide zero and dust by default
• There is no clean “show me everything I own” moment — and no reason
  to pay for that reveal in a native L1 token

Result: capital is stranded in plain sight.
```

---

## Slide 03 · The insight

```
THE INSIGHT
───────────
Portfolio total is curiosity.
Token + chain inventory is the product.

Users will pay a small native fee to learn WHERE the money is —
not just that it exists.
```

---

## Slide 04 · Solution

```
THE PRODUCT
───────────
1. Connect MetaMask or Phantom (multichain discovery, no paste required)
2. Instantly see combined portfolio VALUE in USD
3. Tip 0.3 BOT on BOT Chain to unlock:
      • which tokens you hold
      • which networks they live on
4. Filter, search, deep-scan wallets — then act elsewhere

Find Hidden Money turns “I wonder…” into a paid reveal on BOT Chain.
```

---

## Slide 05 · How it works

```
FLOW
────
CONNECT  →  SCAN  →  VALUE VISIBLE  →  TIP 0.3 BOT  →  TOKENS + CHAINS UNLOCK

Scan engines
  • Ankr / Moralis          — major EVM ERC-20s + prices
  • Chainlist RPC sweep     — native balances on 2,000+ EVM nets
  • Solana / Bitcoin / Sui / Tron / Robinhood / Fraxtal / …
  • BOT Chain RPC           — native BOT, WBOT, USDT, CaryPact (CA)

Tip
  • Amount     0.3 BOT (native)
  • Chain      BOT Chain mainnet (677)
  • Recipient  0x9B4d9039A96Bfd7320C865aaCC69F35b51f425a7
  • Verify     on-chain receipt (to + value + success)
```

---

## Slide 06 · Why BOT Chain

```
WHY BOT
───────
• Real L1 utility: every reveal is a native BOT transfer
• EVM-compatible — same 0x as MetaMask / Phantom EVM
• Fast blocks, low fees — tip UX feels instant
• Ecosystem surface: BDEX, bridge, Bo Wallet, explorer
• Clear narrative: AI / DePIN L1 gets consumer demand via tips

Official links
  Website   https://www.botchain.ai
  Docs      https://dev-docs.botchain.ai/docs/Developers/quick-guide/
  Explorer  https://scan.botchain.ai
  DEX       https://dex.botchain.ai
  Bridge    https://bridge.botchain.ai
```

---

## Slide 07 · Product principles

```
DESIGN
──────
BEFORE TIP
  ✓ Combined USD portfolio value
  ✓ Per-wallet totals
  ✗ Token symbols / contracts
  ✗ Network names & chain tabs

AFTER TIP
  ✓ Full inventory by chain
  ✓ Search, dust filter, deep scan
  ✓ Session unlock stored locally after verified tip

Security
  • Tip is explicit user-signed spend (not a hidden approval)
  • Seed phrases / private keys never leave the user’s machine
  • Server only verifies tip tx hashes on BOT RPC
```

---

## Slide 08 · Coverage map

```
ECOSYSTEMS SCANNED
──────────────────
EVM          Ethereum, L2s, HyperEVM, Monad, Sei, Fraxtal, Robinhood, …
BOT Chain    Native BOT + WBOT + USDT + CA
Solana       SOL + SPL / Token-2022 (up to 100 Phantom accounts)
Bitcoin      Native BTC
Sui          SUI + coins
Tron         TRX + TRC assets (when discovered)
```

---

## Slide 09 · Business model

```
MONETIZATION
────────────
Primary     0.3 BOT tip per unlock (on-chain, to treasury address)
Secondary   Future: bulk unlocks, API, pro deep-scan, partner fees

Unit economics (illustrative)
  Tip           0.3 BOT
  Cost to serve indexer RPC + BOT verify   → low variable cost
  Margin        driven by BOT demand + tip volume

Every paid reveal = measurable on-chain BOT utility.
```

---

## Slide 10 · Go-to-market

```
GTM
───
1. BOT / CaryPact communities — “find dust, pay in BOT”
2. Wallet power users (MetaMask multi-account, Phantom multi-wallet)
3. Content: “your portfolio is $X — tip to see the map”
4. Ecosystem grant / Option C support narratives on BOT Chain
5. Listing tips on BDEX + bridge paths so users can fund gas + tip
```

---

## Slide 11 · Tech stack

```
STACK
─────
Frontend     Next.js App Router, TypeScript, framer-motion
Wallets      MetaMask multichain + Phantom (Solana / EVM / BTC / Sui)
Indexers     Ankr Advanced API, Moralis (optional), Chainlist RPCs
BOT Chain    rpc.botchain.ai · tip verify API · wagmi chain 677
Deploy       GitHub → Vercel (ANKR_API_KEY as server env)
```

---

## Slide 12 · Traction checklist

```
SHIPPED
───────
[x] Multichain connect (MetaMask + Phantom)
[x] Combined USD portfolio before tip
[x] Token + chain inventory locked until 0.3 BOT tip
[x] BOT Chain balance scan + tip verification
[x] Multi-wallet Solana roster (up to 100)
[x] Deep / batch scan for large EVM rosters

NEXT
────
[ ] Production Vercel + env (when account quota allows)
[ ] Tip analytics dashboard for treasury
[ ] One-click “get BOT” deep-link from tip gate
[ ] Optional tip tiers (single wallet vs full roster)
```

---

## Slide 13 · Ask

```
THE ASK
───────
Support Find Hidden Money as a BOT Chain consumer app:

• Amplify tip utility (docs, grants, ecosystem listing)
• Preferential indexing / RPC guidance for BOT Chain
• Co-marketing with BDEX / bridge for tip funding paths

Outcome: every curious portfolio check burns a path for BOT demand.
```

---

## Slide 14 · One-liner

```
Find Hidden Money shows what your wallet is worth for free —
and sells the map of where it lives for 0.3 BOT.
```

---

# Developer setup

```bash
npm install
cp .env.example .env.local
# set ANKR_API_KEY (recommended)
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `ANKR_API_KEY` | ERC-20 + priced balances on Ankr indexed chains |
| `MORALIS_API_KEY` | Optional indexer fallback |
| `SOLANA_RPC_URL` | Optional dedicated Solana RPC |
| `TRONGRID_API_KEY` | Optional Tron rate limits |

Tip defaults live in `src/lib/botchain/config.ts` (0.3 BOT → treasury address).

```bash
npm run test-bot-tip   # optional: BOT_TEST_PK=0x… (never commit keys)
```

## License

Private / product repo — see GitHub permissions.
