# InsurAI — 0G APAC Hackathon Submission

## Project Name
**InsurAI** — Autonomous Parametric Insurance on 0G

## One-Sentence Description
InsurAI is the first parametric insurance protocol where AI claim adjudication runs inside a hardware-sealed TEE enclave on 0G Compute — the insurer cannot override the payout, and the policyholder cannot fake the evidence.

## What It Does
InsurAI enables trustless, autonomous insurance on 0G's modular infrastructure:
- **Buy** parametric insurance policies (flight delay, gadget warranty, event cancellation, travel medical, crypto portfolio shield) on-chain in seconds
- **Autonomous settlement** — IoT sensors trigger claims automatically when thresholds are breached
- **TEE-verified AI adjudication** — 3 AI agents (Fraud Detector, Parametric Checker, Payout Calculator) run in parallel inside 0G Private Computer's trusted execution environment
- **Tamper-proof audit trail** — every claim step is SHA-256 hash-chained and anchored on-chain

## Problem It Solves
Traditional insurance: claims take weeks, fraud costs $80B/year, policyholders can't verify adjudication, insurers can override payouts arbitrarily. InsurAI fixes all four with parametric insurance + TEE = trustless settlement.

## 0G Components Used

| Component | Usage |
|---|---|
| **0G Chain** | Smart contract deployment, policy NFTs, claim settlement, TEE signature verification via `ecrecover` |
| **0G Private Computer** | 3 AI agents run in parallel inside TEE enclaves. Every inference produces a verifiable attestation hash stored on-chain |
| **0G Storage** | AES-256-GCM encrypted policy metadata stored with real CIDs. Evidence files uploaded before claim submission |
| **Agent ID (.0g domains)** | Policyholder identity as `{address}.0g` agent identifiers |

---

## 0G Integration Proof

### Contract Address (0G Galileo Testnet, Chain ID 16602)
```
InsurancePolicy: 0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95
PolicyINFT:      0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C
```

### Explorer Links
- **Contract**: https://chainscan-galileo.0g.ai/address/0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95
- **PolicyINFT**: https://chainscan-galileo.0g.ai/address/0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C

### Verified On-Chain Transactions

#### Deployment
- Deploy InsurancePolicy: https://chainscan-galileo.0g.ai/tx/0x512a4889304744d8d061939bd181456b8d70ebadcad7f22f448defab59c004f6

#### Policy Purchases (buyPolicy)
- Policy #2 (FlightDelay): https://chainscan-galileo.0g.ai/tx/0x6795eed90bc66d59e617b547c8137283a4ef5008095d63d544b5ab2bf2bbf00dc
- Policy #3 (GadgetWarranty): https://chainscan-galileo.0g.ai/tx/0x85f7f9d5e6bf7627184aa609a1c3fe756162651d0bcfb4fb51aceed0ab740920
- Policy #4 (EventCancellation): https://chainscan-galileo.0g.ai/tx/0x41211339f25475887accdc8f10e5557539e826427a7e0ea49a3f9562858aba32
- Policy #5 (TravelMedical): https://chainscan-galileo.0g.ai/tx/0x905abbb15241254d90ad72e0ecee0a4e7f8b4b7ead2c254cf70e1311b95cc7a0
- Policy #6 (CryptoShield): https://chainscan-galileo.0g.ai/tx/0xa1bf8e1402e0e69a9a49862120ff331784185a510f2232b80201a2349f366b79
- Policy #18 (GadgetWarranty): https://chainscan-galileo.0g.ai/tx/0xca645abe4d97972e308f0df0aa351ef42944f7ae9e7b737344407772e11b7155
- Policy #19 (EventCancellation): https://chainscan-galileo.0g.ai/tx/0xae531409c331926ed5d1028f94a206cc523047096f38090e35b7be9047537c2d
- Policy #20 (TravelMedical): https://chainscan-galileo.0g.ai/tx/0x9724515682ab6b535c63561a9e79a3c5f5735f5a118b29ff8bafa21b58d0d7fc
- Policy #21 (CryptoShield): https://chainscan-galileo.0g.ai/tx/0xefff3c08cd730a03ae4ce889a1ec03e1b0681e8e695206211fde0179900e61f7
- Policy #22 (FlightDelay): https://chainscan-galileo.0g.ai/tx/0xdbfec42518de868953976052714f4be196c0a8d8524ac4a11a30c5125cc64712

#### Claim Submissions (submitClaim)
- Claim #2: https://chainscan-galileo.0g.ai/tx/0xc8cc34d93115f8838f4dfa597577eabe302ab254abcdc72175cb4dba0aec6dd9
- Claim #3: https://chainscan-galileo.0g.ai/tx/0xf6f0257a10acb66ef32184e6db3e38768255eb16d7c0ebd4a86412fd68722f16
- Claim #4: https://chainscan-galileo.0g.ai/tx/0x12072169a18b4a190c9c34be36671693c1b93498fce06a5afde3c41c80aa1a3f
- Claim #5: https://chainscan-galileo.0g.ai/tx/0x201ceb61fcfb340ac7eda8f000959eb5997f88e2a6389220d75a885a4dc9ed17
- Claim #6: https://chainscan-galileo.0g.ai/tx/0xd5f73fdb76fb9264d72c29b8958bc76a815ef5df63dd18a1320c46f423f5e50a
- Claim #9: https://chainscan-galileo.0g.ai/tx/0x6a4c76ce52c3ea1eb3ed1d501082d490c64840b426a978f011627621715129e0
- Claim #10: https://chainscan-galileo.0g.ai/tx/0x4dd57f5d319671687996667513e43fc9dc6e23d5ecbec8cb902f82111e40798a

#### TEE-Verified Claim Settlements (settleClaim with ECDSA signature)
- Settle Claim #2 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0xd395474d368a48e7ae9d9e9b2a02624cd167f409a0818f30a226957c68ea35b0
- Settle Claim #3 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0x671454204df3b8ca64deb5cdccec515fbeeb512eb61cf6651ed38554d36c6d8c
- Settle Claim #4 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0xec8a615d732b5fbb5da3ed452ea4d59e2a7afc32c2047ff52cf4ef4dba2564aa
- Settle Claim #5 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0x3299f4b995d2ff07065ebe5738a04ae9d0dcd2baa0bab5b7ba523157a27f0789
- Settle Claim #6 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0xb98427faae22b6bcde7e49edcf11cc6ad801476a511ebb41e722aa081641485f
- Settle Claim #7 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0x0b9e6e529ed51b5f9026c96088291e208ea500f3d105844202e0cee1b337dfb5
- Settle Claim #8 (approved, 0.004 0G payout): https://chainscan-galileo.0g.ai/tx/0xc0f39752ef987e4b0a648b4f064c15beeb406aff1e3e8e7ebbcceb9845310be9

#### Additional TEE-Verified Settlements (Round 2 — with updated TEE signer)
- TEE Signer Update TX: https://chainscan-galileo.0g.ai/tx/0xa7e4455b087512feba656d557a7e35c00d6eec2a4ae50f57df2e8621a83e647a
- Policy #24 (FlightDelay): https://chainscan-galileo.0g.ai/tx/0x9e88b79d3118dca39022239792d8cd54a96f1f2ee14258a85dcbefcaf6d4627e5
- Claim #11 submitted: https://chainscan-galileo.0g.ai/tx/0x6e358132d6c2e01e01d335f1d217ae9ec10b125c7d0306fcdd1b5732e38a29a0f
- Claim #11 settled (approved): https://chainscan-galileo.0g.ai/tx/0xb9db0b97fd7ab3d1630efb3148011717f7481066d1ffdf955361f02a465050efcb
- Policy #25 (GadgetWarranty): https://chainscan-galileo.0g.ai/tx/0xa2c404f8af55b9a032eef8ba01022826c6c52da01c8dc773115810a30994c4a5bc
- Policy #26 (EventCancellation): https://chainscan-galileo.0g.ai/tx/0x47a4b91e2adce8af10f8e502011ab8d1d6d45a3aedd9d5c2e5719b01c0c74adc
- Claim #12 settled (approved): https://chainscan-galileo.0g.ai/tx/0x584e29432d78f8b1de915feb6c1557ced2620e1e42f3f2711e3c432e799131297a
- Policy #30 (GadgetWarranty): https://chainscan-galileo.0g.ai/tx/0x092ad80fb896e2dd78aa6a80c2ccdf6e1911788e97b36068785015f00555ba7385
- Claim #13 settled (approved): https://chainscan-galileo.0g.ai/tx/0x4edb8ac6947b499d13627c0502ca303f109567ba3c0a04a004785817419101f1
- Policy #32 (TravelMedical): https://chainscan-galileo.0g.ai/tx/0x9829ccbd112a6e2bc08659f4b5ce97fbe605bd707ec30d2f862c15448892ebca2
- Claim #14 settled (approved): https://chainscan-galileo.0g.ai/tx/0xca3e67bc829fbb1678a03c09e2d55fd385b326f041c1951d452363744821f1cf2
- Policy #34 (FlightDelay): https://chainscan-galileo.0g.ai/tx/0x87a05d3a65e971a36fd6cd2204629f1bffc589936ef768aae2114c3193395de446
- Claim #15 settled (approved): https://chainscan-galileo.0g.ai/tx/0x76ba9ee12b50444cf5fe12d539e2c50ccf2a1a5c868a3b991a5f2832e9d11eb3c

**Total on-chain activity: 35+ policies, 15+ TEE-verified claim settlements**

---

## Demo Video
*[To be recorded — see DEMO_GUIDE.md for script]*

## Live Demo
- Frontend: https://insurai.vercel.app (deploy with `vercel --prod`)
- Local: `npm run dev` → http://localhost:3000

## Repository
- GitHub: *[Add your repo URL]*

## X Post
*[Required — post with #0GHackathon #BuildOn0G @0G_labs @0g_CN @0g_Eco @HackQuest_]*

---

## Track Selection
**Track 3: Agentic Economy & Autonomous Applications**

InsurAI is the financial rails layer for the AI era — autonomous micropayments triggered by real-world events, settled by TEE-verified AI agents, with full on-chain transparency.

Also eligible for **Track 2 (Verifiable Finance)** — TEE-based execution ensures claim decisions are tamper-proof and operator-blind.

---

## Team
Solo builder — InsurAI was built from scratch during the 0G APAC Hackathon 2026.
