# InsurAI — Autonomous Parametric Insurance on 0G

> **The first insurance protocol where the AI adjuster runs in a hardware-sealed enclave. The insurer cannot override the payout. The policyholder cannot fake the evidence.**

[![0G Chain](https://img.shields.io/badge/0G-Chain%20%7C%20Galileo%20Testnet-00D4FF)](https://chainscan-galileo.0g.ai)
[![0G Compute](https://img.shields.io/badge/0G-Private%20Computer%20TEE-7B2FFF)](https://pc.testnet.0g.ai)
[![0G Storage](https://img.shields.io/badge/0G-Storage%20SDK-00FF9D)](https://storagescan-galileo.0g.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/PBT-16%20tests%20passing-green)](./src/tests/pbt.test.ts)

---

## What InsurAI Does

InsurAI is a **parametric insurance protocol** built entirely on 0G's modular infrastructure. It enables:

- **Instant policy purchase** — buy flight delay, gadget warranty, event cancellation, travel medical, or crypto portfolio shield coverage on-chain in seconds
- **Autonomous claim settlement** — IoT sensors trigger claims automatically when thresholds are breached (temperature, voltage, flight delay)
- **TEE-verified AI adjudication** — three AI agents (Fraud Detector, Parametric Checker, Payout Calculator) run in parallel inside 0G Private Computer's trusted execution environment
- **Tamper-proof audit trail** — every claim processing step is SHA-256 hash-chained and the root hash is anchored on-chain
- **Encrypted policy metadata** — AES-256-GCM encrypted policy details stored on 0G Storage with verifiable CIDs

---

## Live On-Chain Deployment

| | Address | Explorer |
|---|---|---|
| **InsurancePolicy** | `0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95` | [View ↗](https://chainscan-galileo.0g.ai/address/0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95) |
| **PolicyINFT (ERC-7857)** | `0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C` | [View ↗](https://chainscan-galileo.0g.ai/address/0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C) |
| **Network** | 0G Galileo Testnet — Chain ID 16602 | |
| **Policies created** | **35+** across all 5 product types | |
| **Claims settled** | **15+ TEE-verified** with ECDSA signatures | |
| **Deploy TX** | `0x512a4889...` | [View ↗](https://chainscan-galileo.0g.ai/tx/0x512a4889304744d8d061939bd181456b8d70ebadcad7f22f448defab59c004f6) |
| **Sample settlement** | `0xd395474d...` | [View ↗](https://chainscan-galileo.0g.ai/tx/0xd395474d368a48e7ae9d9e9b2a02624cd167f409a0818f30a226957c68ea35b0) |

---

## The Problem

Traditional insurance:
- Claims take **weeks** to settle (human adjusters, paperwork)
- Fraud costs the industry **$80B/year** (no cryptographic verification)
- Policyholders can't verify the adjudication process (black box decisions)
- Insurers can override payouts arbitrarily (no trustless enforcement)

InsurAI fixes all four with a single architectural insight: **parametric insurance + TEE = trustless settlement**.

---

## 0G Integration

| 0G Component | How InsurAI Uses It |
|---|---|
| **0G Chain** | Smart contract deployment, policy NFTs, claim settlement, TEE signature verification via `ecrecover` |
| **0G Private Computer** | Three AI agents (fraud detection, parametric checking, payout calculation) run in parallel inside TEE enclaves. Every inference call produces a verifiable attestation. |
| **0G Storage** | AES-256-GCM encrypted policy metadata stored with real CIDs. Evidence files uploaded before claim submission. |
| **Agent ID (.0g domains)** | Policyholder identity represented as `{address}.0g` agent identifiers |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Consumer Browser (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  BuyPolicy   │  │ SubmitClaim  │  │   ClaimHistory       │  │
│  │  Component   │  │  Component   │  │   Component          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
└─────────┼─────────────────┼───────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (Node.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /api/policies│  │ /api/claims  │  │  /api/sensors        │  │
│  │ /mint        │  │ /evaluate    │  │  /trigger + /stream  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│  ┌──────▼───────┐  ┌──────▼───────┐             │              │
│  │ 0G Storage   │  │ 0G Private   │             │              │
│  │ SDK Upload   │  │ Computer     │             │              │
│  │ (encrypted)  │  │ (3 agents)   │             │              │
│  └──────────────┘  └──────┬───────┘             │              │
│                            │                     │              │
│                    ┌───────▼─────────────────────▼──────────┐  │
│                    │     SHA-256 Audit Trail Builder         │  │
│                    │  claim_submitted → evidence_uploaded →  │  │
│                    │  tee_initialized → ai_inference →       │  │
│                    │  signature_generated → settlement_exec  │  │
│                    └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    0G Chain (EVM, Chain ID 16602)               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   InsurancePolicy.sol    │  │     PolicyINFT.sol        │    │
│  │  - buyPolicy()           │  │  - mintPolicy()           │    │
│  │  - submitClaim()         │  │  - ERC-7857 iNFT          │    │
│  │  - settleClaim()         │  │  - encrypted metadata URI │    │
│  │  - ecrecover TEE sig     │  └──────────────────────────┘    │
│  └──────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent TEE Pipeline

```
Claim Submitted
      │
      ▼
┌─────────────────────────────────────────────────────┐
│         0G Private Computer TEE Enclave             │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ 🔍 Fraud        │  │ 📋 Parametric Checker   │  │
│  │    Detector     │  │                         │  │
│  │ fraud_score 0-1 │  │ match_score 0-1         │  │
│  │ (1.0=legit)     │  │ (1.0=perfect match)     │  │
│  └────────┬────────┘  └────────────┬────────────┘  │
│           │                        │                │
│           └──────────┬─────────────┘                │
│                      │                              │
│  ┌───────────────────▼─────────────────────────┐   │
│  │ 💰 Payout Calculator                        │   │
│  │ payout_ratio 0-1 (1.0=full coverage)        │   │
│  └───────────────────┬─────────────────────────┘   │
│                      │                              │
│  Aggregated Score = fraud×0.4 + match×0.4 + payout×0.2
│  Approved if score ≥ 0.75                           │
│                      │                              │
│  ┌───────────────────▼─────────────────────────┐   │
│  │ ECDSA Signature (TEE private key)           │   │
│  │ keccak256(claimId, policyId, holder,        │   │
│  │           payoutAmount, approved)           │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
      │
      ▼
settleClaim() on-chain — ecrecover verifies TEE signature
```

---

## Autonomous IoT Trigger Flow

```
IoT Sensor Reading
      │
      ▼
POST /api/sensors/stream
      │
      ├── temperature_c > 30°C? ──► Threshold Breached
      └── voltage_v < 210V?    ──► Threshold Breached
                                          │
                                          ▼
                              submitClaim() on-chain
                              (via bot wallet)
                                          │
                                          ▼
                              evaluateClaimWithTee()
                              (3 parallel AI agents)
                                          │
                                          ▼
                              settleClaim() on-chain
                              (TEE signature verified)
                                          │
                                          ▼
                              Payout sent to policyholder
                              (all within ~30 seconds)
```

---

## Insurance Products

| Product | Trigger | Coverage |
|---------|---------|----------|
| ✈️ Flight Delay | Flight delayed > threshold | Up to 5 0G |
| 📱 Gadget Warranty | Device damage/theft | Up to 3 0G |
| 🎫 Event Cancellation | Event cancelled | Up to 2 0G |
| 🏥 Travel Medical | Medical emergency abroad | Up to 10 0G |
| 🛡️ Crypto Portfolio Shield | Portfolio drawdown > threshold | Up to 20 0G |

---

## Property-Based Tests

InsurAI uses `fast-check` for property-based testing — verifying correctness invariants across thousands of random inputs.

```bash
npx vitest run src/tests/pbt.test.ts --reporter=verbose
```

| Test Suite | Properties Verified |
|---|---|
| CP-01: Payout Bounds | `payout ∈ [0, coverage]` for all inputs |
| CP-01: Rejection | `score < 0.75 → payout = 0` always |
| CP-01: Approval | `score ≥ 0.75 → payout = coverage × ratio` |
| CP-02: Aggregation | Score always in `[0, 1]`, weights sum to 1.0 |
| CP-03: Encryption | `decrypt(encrypt(x)) = x` for all metadata |
| CP-03: Non-determinism | Each encryption produces unique IV |
| CP-04: Audit Chain | `verify(build(steps)) = true` always |
| CP-04: Tamper Detection | Mutating any hash breaks verification |
| CP-05: Precision | 50% payout ratio ≈ coverage/2 within 1 wei |

**16/16 tests passing.**

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- A wallet with 0G Galileo testnet tokens (from https://faucet.0g.ai)

### 1. Clone & Install

```bash
git clone <repo-url>
cd InsurAI/insurai-app
npm install --legacy-peer-deps
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
# 0G Chain
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...          # Deploy first (see below)
NEXT_PUBLIC_POLICY_INFT_ADDRESS=0x...

# 0G Private Computer (get key at pc.testnet.0g.ai/dashboard/api-keys)
OG_PRIVATE_COMPUTER_API_KEY=sk-...
OG_PRIVATE_COMPUTER_URL=https://router-api.testnet.0g.ai/v1

# 0G Storage
OG_STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai

# Server-side keys (never exposed to browser)
DEPLOYER_PRIVATE_KEY=0x...
TEE_SIGNER_PRIVATE_KEY=0x...
CLAIMS_BOT_PRIVATE_KEY=0x...

# Encryption (64-char hex string)
POLICY_METADATA_ENCRYPTION_KEY=<64-char-hex>
```

### 3. Deploy Contracts

```bash
# Compile
npx hardhat compile

# Deploy to 0G Galileo Testnet
npx hardhat run scripts/deploy.ts --network 0g-galileo

# Deploy to 0G Mainnet
npx hardhat run scripts/deploy.ts --network 0g-mainnet
```

Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` with the deployed address.

### 4. Run Development Server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Run Tests

```bash
npx vitest run src/tests/pbt.test.ts --reporter=verbose
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/policies/mint` | POST | Upload encrypted metadata to 0G Storage, optionally mint iNFT |
| `/api/claims/evaluate` | POST | Run 3-agent TEE evaluation, sign with TEE key, settle on-chain |
| `/api/evidence/upload` | POST | Upload evidence file to 0G Storage |
| `/api/sensors/trigger` | POST | Manually trigger autonomous claim from sensor reading |
| `/api/sensors/stream` | POST | Generate sensor readings, auto-trigger on threshold breach |
| `/api/health` | GET | Real-time status of all 0G service integrations |
| `/api/network-status` | GET | Live 0G compute provider availability |

---

## Project Structure

```
insurai-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── claims/evaluate/    # Multi-agent TEE evaluation
│   │   │   ├── policies/mint/      # 0G Storage upload + iNFT mint
│   │   │   ├── evidence/upload/    # Evidence file upload
│   │   │   ├── sensors/trigger/    # Autonomous IoT trigger
│   │   │   ├── sensors/stream/     # Sensor data stream
│   │   │   ├── health/             # 0G integration health check
│   │   │   └── network-status/     # Compute provider status
│   │   ├── app/                    # Consumer portal (wallet-connected)
│   │   │   └── components/
│   │   │       ├── BuyPolicy.tsx   # Calls /api/policies/mint first
│   │   │       ├── SubmitClaim.tsx # Calls /api/claims/evaluate
│   │   │       ├── PolicyList.tsx  # Reads on-chain state
│   │   │       └── ClaimHistory.tsx # On-chain + multi-agent display
│   │   ├── demo/                   # Autonomous trigger demo (no wallet)
│   │   └── insurer/                # Insurer dashboard (real stats)
│   ├── lib/
│   │   ├── 0g/
│   │   │   ├── compute.ts          # 0G Private Computer API (3 agents)
│   │   │   ├── storage.ts          # 0G Storage SDK + AES-256-GCM
│   │   │   └── audit.ts            # SHA-256 hash-chained audit trail
│   │   ├── payout.ts               # Pure payout calculation (PBT-tested)
│   │   └── contract.ts             # ABI, addresses, chain configs
│   └── tests/
│       └── pbt.test.ts             # 16 property-based tests
├── contracts/
│   ├── InsurancePolicy.sol         # Main contract with TEE ecrecover
│   └── PolicyINFT.sol              # ERC-7857 iNFT with encrypted URI
└── scripts/
    └── deploy.ts                   # Hardhat deploy (testnet + mainnet)
```

---

## Judging Criteria Mapping

| Criterion | InsurAI Implementation |
|---|---|
| **0G Technical Integration Depth** | Uses ALL 4 core 0G components: Chain (smart contracts + TEE ecrecover settlement), Private Computer (3-agent parallel TEE inference with Featherless fallback), Storage (AES-256-GCM encrypted metadata + evidence), Agent ID (.0g domains). Every claim produces a verifiable TEE attestation hash anchored on-chain. |
| **Technical Implementation & Completeness** | Full end-to-end flow: buy policy → upload to 0G Storage → submit claim → 3-agent TEE evaluation → on-chain settlement. **35+ real on-chain policies, 15+ TEE-verified settlements, 16 property-based tests** verify correctness invariants. SHA-256 audit trail for every claim. |
| **Product Value & Market Potential** | Insurance is a **$6T global industry**. Parametric insurance is the fastest-growing segment. InsurAI is the **ONLY insurance project** in the hackathon — uncontested vertical with clear product-market fit. |
| **User Experience & Demo Quality** | Premium glassmorphism UI. Autonomous demo page shows full pipeline in 30 seconds without wallet. Real-time multi-agent evaluation display. Explorer links for every transaction. |
| **Team Capability & Documentation** | Comprehensive README, architecture diagrams, API reference, deployment guide, SUBMISSION.md with all proof links, 16 passing property-based tests. |

---

## The One-Line Pitch

> *InsurAI is the first insurance protocol where the AI adjuster runs in a hardware-sealed enclave — the insurer physically cannot override the payout, and the policyholder cannot fake the evidence. Built entirely on 0G's modular stack.*

---

## License

MIT

---

*Built for the 0G APAC Hackathon 2026 · Powered by 0G Chain, 0G Private Computer, and 0G Storage*
