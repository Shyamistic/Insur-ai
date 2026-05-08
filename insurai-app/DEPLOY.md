# InsurAI Deployment Guide

## Quick Deploy to Vercel (Free)

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from insurai-app directory
cd insurai-app
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework: Next.js (auto-detected)
# - Build command: npm run build
# - Install command: npm install --legacy-peer-deps

# Set environment variables in Vercel dashboard:
# https://vercel.com/your-project/settings/environment-variables
```

### Option 2: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set root directory to `insurai-app`
4. Add environment variables (see below)
5. Deploy

### Required Environment Variables for Vercel
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95
NEXT_PUBLIC_POLICY_INFT_ADDRESS=0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_IS_MAINNET=false
NEXT_PUBLIC_0G_RPC=https://evmrpc-testnet.0g.ai
OG_PRIVATE_COMPUTER_API_KEY=sk-34aeba28-6d01-46c0-ae77-46f199669e67
OG_PRIVATE_COMPUTER_URL=https://router-api.testnet.0g.ai/v1
OG_COMPUTE_MODEL=deepseek-chat-v3-0324
FEATHERLESS_API_KEY=rc_333013a7f6872fa381481696e768bfd6fc3896ad987618a0c9efec0b4358e06a
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
FEATHERLESS_MODEL=deepseek-ai/DeepSeek-V4-Pro
OG_STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
POLICY_METADATA_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
TEE_SIGNER_PRIVATE_KEY=0xad9a2ce89816de3073abf6db54dc27779411ad0e773856516f13b1de9d088890
CLAIMS_BOT_PRIVATE_KEY=0xad9a2ce89816de3073abf6db54dc27779411ad0e773856516f13b1de9d088890
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

---

## Git Setup

```bash
# From the InsurAI root directory
git init
git add insurai-app/
git add -A

# Make sure .env.local is NOT committed (it's in .gitignore)
git status  # verify .env.local is not listed

git commit -m "feat: InsurAI - Autonomous Parametric Insurance on 0G

- Smart contracts deployed on 0G Galileo Testnet
- InsurancePolicy: 0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95
- PolicyINFT: 0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C
- 35+ policies created, 15+ TEE-verified claims settled
- 3-agent parallel TEE evaluation (Fraud + Parametric + Payout)
- SHA-256 hash-chained audit trail per claim
- 16 property-based tests passing
- 0G Private Computer + Featherless AI dual-provider
- 0G Storage SDK for encrypted policy metadata
- Autonomous IoT trigger demo page"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/insurai.git
git branch -M main
git push -u origin main
```

---

## Contract Deployment

```bash
cd insurai-app

# Testnet (0G Galileo)
npm run deploy:testnet

# Mainnet (0G Mainnet - requires mainnet 0G tokens)
npm run deploy:mainnet

# Generate on-chain activity
npm run activity:testnet
```

---

## Local Development

```bash
cd insurai-app
npm install --legacy-peer-deps
cp .env.local.example .env.local
# Edit .env.local with your keys
npm run dev
# → http://localhost:3000
```

## Run Tests
```bash
npm run test:pbt
# 16/16 property-based tests passing
```
