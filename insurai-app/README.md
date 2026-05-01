# InsurAI — Web 4.0 Insurance on 0G

**Opening zinger:** _"If the trigger is real, payout should be as automatic as an API response."_

InsurAI is a parametric insurance dApp for the 0G Aristotle/Galileo ecosystem: claims are evaluated with TEE-backed AI signals, policy metadata is encrypted before storage, and user UX can start from chat instead of dashboards.

## 4-Component Architecture

| Component | What it does | Why it matters to judges |
|---|---|---|
| 0G Chain (`contracts/InsurancePolicy.sol`) | Settlement, premiums, payouts, attestation hash storage | Ming: verifiable, auditable decision trail |
| 0G Compute (`src/lib/0g/compute.ts`) | TEE-oriented claim scoring via broker service discovery (`listService`) | Ming: no hardcoded provider URL |
| 0G DA (`src/app/api/sensors/stream/route.ts` + `services/sensor-consumer.ts`) | High-frequency sensor stream ingestion and breach-driven claim evaluation | Fan: micro-parametric events at high event rates |
| Agentic UX (`src/app/chat/page.tsx` + `agents/insurance-eliza`) | One-sign session then quote/purchase/claim actions via agent | Thomas + Michael: invisible UX + policy identity |

## Demo Flows

### 1) TEE Actuary Flow
- `POST /api/claims/evaluate` performs model decisioning and returns attestation payload/hash.
- Decision is signed with configured TEE signer key for onchain verification flow.
- `settleClaim` now stores `attestationHash` in the claim record.

**Model choice:** `Qwen3.6-Plus` default in env for lower latency and high throughput under repeated claim checks.

### 2) High-Frequency Parametric Flow
- `POST /api/sensors/stream` emits burst readings (target demo: ~10 readings/sec equivalent).
- `services/sensor-consumer.ts` polls stream and triggers claim evaluation on breaches.
- Example pitch numbers at 864,000 events/day (10 rps):
  - Ethereum calldata-heavy route (illustrative): **~$13,000/day**
  - 0G DA route (illustrative): **~$6.5/day**

> These are pitch estimates. Replace with final judge-ready DA pricing references before finals.

### 3) iNFT Policy Identity Stub
- `contracts/PolicyINFT.sol` ships as ERC-721 + ERC-7857-style interface signature stub.
- Encrypted metadata URI is recorded per token.
- Full transfer-time re-encryption is intentionally deferred.

### 4) Chat UX with Session Key Pattern
- User signs one message once in chat (`/chat`).
- Session is registered server-side via `POST /api/chat/session`.
- Agent service can execute quote/purchase/claim actions for that session.

## Quick Start

```bash
cp .env.example .env.local
npm install
npm run dev
npm run eliza:agent
npm run sensor:consumer
```

Optional contract deploy:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network 0g-galileo
```

## Honest Status (Stubbed / v2 Roadmap)

- `ERC-7857` secure transfer-time re-encryption: **stub — v2 roadmap**.
- 0G DA publish endpoint integration: if `OG_DA_INGEST_URL` is missing, local NDJSON stub is used.
- 0G Storage upload endpoint integration: if `OG_STORAGE_UPLOAD_URL` is missing, local encrypted blob stub is used.
- Session key flow is **not full ERC-4337 account abstraction**; it is a pragmatic delegated-session pattern for demo UX.

## 90-Second Demo Script

See `DEMO_SCRIPT.md`.
