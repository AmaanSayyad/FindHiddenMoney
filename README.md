# Find Hidden Money

Connect MetaMask’s **multichain accounts**, then scan:

- **EVM** — 2,000+ Chainlist networks (native) + Ankr ERC-20s on major chains (includes Monad, HyperEVM, Sei, Rootstock, Robinhood Chain when public RPCs exist)
- **Solana** — SOL + SPL / Token-2022 balances
- **Bitcoin** — BTC via mempool.space
- **Tron** — TRX + TRC-10/TRC-20 via TronGrid

## Stack

- **Next.js** App Router + TypeScript
- **MetaMask Multichain API** (`wallet_createSession` / CAIP-25) for EVM + Solana + Bitcoin + Tron accounts
- **framer-motion** — page/hero/portfolio transitions (respects reduced motion)
- **@number-flow/react** — animated portfolio total
- **Chainlist** — parallel `eth_getBalance` across ~2,500 EVM RPCs
- **Ankr Advanced API** — ERC-20 + priced balances on indexed EVM chains
- **Solana RPC / mempool.space / TronGrid** for non-EVM ecosystems

## Setup

```bash
npm install
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `ANKR_API_KEY` | ERC-20 + priced balances on Ankr’s indexed chains (recommended) |
| `MORALIS_API_KEY` | Optional indexer fallback |

Even without keys, the Chainlist mega-sweep still checks native gas balances on **thousands** of EVM networks. Token (ERC-20) discovery on major chains needs Ankr or Moralis.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect MetaMask, and wait for the scan.

## API

`GET /api/balances?address=0x…` returns:

```json
{
  "address": "0x…",
  "totalValueUsd": 1234.56,
  "tokenCount": 42,
  "chainCount": 8,
  "provider": "ankr",
  "tokens": [
    {
      "chainName": "Ethereum",
      "symbol": "USDC",
      "balance": 100.5,
      "valueUsd": 100.5,
      "tokenAddress": "0x…"
    }
  ]
}
```

## Notes

- MetaMask exposes one EVM address reused across chains — that is what we scan.
- Non-EVM assets (Bitcoin, Solana, Cosmos, etc.) need different addresses / connectors and are out of scope for MetaMask’s default EVM account.
- The app is **read-only**: no transactions, approvals, or signatures beyond the wallet connect prompt.
