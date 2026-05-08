# Git Push Instructions

Run these commands in your terminal from `C:\Users\shyam.BATCONSOLE\Desktop\InsurAI`:

```powershell
# Step 1: Initialize git (if not already done)
git init

# Step 2: Add all files EXCEPT secrets
git add insurai-app/src/
git add insurai-app/contracts/
git add insurai-app/scripts/
git add insurai-app/services/
git add insurai-app/public/
git add insurai-app/package.json
git add insurai-app/package-lock.json
git add insurai-app/hardhat.config.cjs
git add insurai-app/next.config.ts
git add insurai-app/tsconfig.json
git add insurai-app/vitest.config.ts
git add insurai-app/eslint.config.mjs
git add insurai-app/.gitignore
git add insurai-app/.env.local.example
git add insurai-app/README.md
git add insurai-app/SUBMISSION.md
git add insurai-app/DEMO_GUIDE.md
git add insurai-app/DEPLOY.md
git add insurai-app/vercel.json

# Step 3: Verify .env.local is NOT staged
git status

# Step 4: Commit
git commit -m "feat: InsurAI - Autonomous Parametric Insurance on 0G APAC Hackathon

Deployed on 0G Galileo Testnet:
- InsurancePolicy: 0xb3D949Ac25AABEbf628f8f8AD630214079cA8e95
- PolicyINFT: 0xE06c6a8128fa0a90A1c8A9d2B0F442DD602ec79C
- 35+ policies, 15+ TEE-verified claim settlements

Features:
- 3-agent parallel TEE evaluation (Fraud + Parametric + Payout)
- SHA-256 hash-chained audit trail per claim
- 0G Private Computer + Featherless AI dual-provider
- 0G Storage SDK for AES-256-GCM encrypted metadata
- Autonomous IoT trigger demo
- 16 property-based tests passing
- Full Next.js 16 frontend with glassmorphism UI"

# Step 5: Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/insurai.git
git branch -M main
git push -u origin main
```

## Vercel Deploy (after git push)

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy from insurai-app directory
cd insurai-app
vercel --prod
```

Then add all environment variables from DEPLOY.md in the Vercel dashboard.
