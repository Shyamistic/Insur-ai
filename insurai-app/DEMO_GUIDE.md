# InsurAI — 3-Minute Demo Guide

## Setup (before recording)
1. `npm run dev` → http://localhost:3000
2. Have MetaMask connected to 0G Galileo Testnet (Chain ID 16602)
3. Have the `/demo` page open in a second tab

---

## Demo Script (3 minutes)

### 0:00–0:20 — The Problem
> *"Insurance is a $6 trillion industry. Claims take weeks. Fraud costs $80 billion per year. The adjudicator is a black box. InsurAI fixes all three."*

Show: Landing page at `http://localhost:3000`

---

### 0:20–0:50 — Buy a Policy (0G Chain + 0G Storage)
> *"A user buys a Flight Delay policy. The metadata is AES-256 encrypted and stored on 0G Storage. The policy is minted on 0G Chain."*

1. Click **"Launch App"** → connect MetaMask
2. Click **"Buy Policy"** → select **Flight Delay**
3. Choose coverage tier → fill in flight details
4. Click **"Pay & Activate"**
5. Show the transaction on **0G Chainscan Explorer**
6. Show the encrypted metadata CID (starts with `0g://`)

---

### 0:50–1:30 — Autonomous IoT Trigger (0G Compute TEE)
> *"Now watch what happens when a sensor detects a threshold breach. No human involved."*

1. Open `/demo` page
2. Watch the live sensor dashboard — temperature readings animating
3. When threshold breaches: claim auto-submits
4. Show the **3-agent TEE evaluation** in real-time:
   - 🔍 Fraud Detector: 92% legitimate
   - 📋 Parametric Checker: 95% match
   - 💰 Payout Calculator: 100% ratio
5. Show the **TEE attestation hash** — this is the cryptographic proof
6. Show the **settleClaim transaction** on the explorer

> *"Every decision is sealed in hardware. The insurer cannot override it."*

---

### 1:30–2:00 — Claim History + Audit Trail
> *"Every step is SHA-256 hash-chained. Tamper one entry — the whole chain breaks."*

1. Go to **Claim History** tab
2. Expand a settled claim
3. Show the **multi-agent breakdown** (3 scores)
4. Click **"Verify Chain"** — shows ✓ Chain Valid
5. Show the 6-step audit trail with hashes

---

### 2:00–2:30 — Insurer Dashboard (Real On-Chain Stats)
> *"The insurer sees real-time stats pulled directly from the smart contract."*

1. Open `/insurer`
2. Show: pool balance, total policies, claims settled, total payouts
3. Show: 0G Compute provider status (live API check)
4. Show: contract address linking to explorer

---

### 2:30–3:00 — The Pitch
> *"InsurAI is the only insurance protocol in this hackathon. It uses ALL of 0G's stack:*
> - *0G Chain for settlement*
> - *0G Private Computer for TEE-sealed AI adjudication*
> - *0G Storage for encrypted evidence*
> - *Agent ID for policyholder identity*
>
> *The insurer physically cannot override the payout. The policyholder cannot fake the evidence. Trust is architectural, not contractual."*

Show: `https://chainscan-galileo.0g.ai/address/0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95`

---

## Key Numbers to Mention
- **23+ policies** created on-chain
- **8+ claims** settled with TEE signatures
- **16 property-based tests** passing
- **3 AI agents** running in parallel per claim
- **6-step SHA-256 audit trail** per claim
- **0G Galileo Testnet** — Chain ID 16602

## Explorer Links for Demo
- Contract: https://chainscan-galileo.0g.ai/address/0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95
- Sample settlement TX: https://chainscan-galileo.0g.ai/tx/0xd395474d368a48e7ae9d9e9b2a02624cd167f409a0818f30a226957c68ea35b0
