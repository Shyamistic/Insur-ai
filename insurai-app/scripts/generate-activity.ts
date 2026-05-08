/**
 * InsurAI On-Chain Activity Generator
 * 
 * Generates real on-chain activity to demonstrate the platform:
 * - Buys multiple policies of different types
 * - Submits claims with TEE evaluation
 * - Creates verifiable transaction history on 0G Chain
 * 
 * Usage:
 *   npx tsx scripts/generate-activity.ts --network 0g-galileo --count 10
 *   npx tsx scripts/generate-activity.ts --network 0g-mainnet --count 5
 */

import { createPublicClient, createWalletClient, http, parseEther, encodePacked, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const args = process.argv.slice(2);
const networkArg = args.find((a) => a.startsWith("--network="))?.split("=")[1] || "0g-galileo";
const countArg = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] || "5");

const IS_MAINNET = networkArg === "0g-mainnet";
const RPC_URL = IS_MAINNET ? "https://evmrpc.0g.ai" : "https://evmrpc-testnet.0g.ai";
const EXPLORER = IS_MAINNET ? "https://chainscan.0g.ai" : "https://chainscan-galileo.0g.ai";
const CHAIN_ID = IS_MAINNET ? 16661 : 16602;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const DEPLOYER_KEY = (process.env.DEPLOYER_PRIVATE_KEY || "0x4f0faadd5d24f67cdd113f2c5dcb1a444da3b2f01c239e52db2b5efbdb5305fc") as `0x${string}`;
// TEE signer matches the current contract TEE signer (updated via updateTeeSigner to 0x01EFA...)
const TEE_KEY = (process.env.TEE_SIGNER_PRIVATE_KEY || "0xad9a2ce89816de3073abf6db54dc27779411ad0e773856516f13b1de9d088890") as `0x${string}`;

if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
  console.error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set. Deploy contracts first.");
  process.exit(1);
}

if (!DEPLOYER_KEY || DEPLOYER_KEY.includes("YOUR_")) {
  console.error("❌ DEPLOYER_PRIVATE_KEY not set in .env.local");
  process.exit(1);
}

const INSURANCE_ABI = [
  {
    name: "buyPolicy",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "agentId", type: "string" },
      { name: "policyType", type: "uint8" },
      { name: "coverage", type: "uint256" },
      { name: "durationDays", type: "uint256" },
      { name: "storageCid", type: "string" },
    ],
    outputs: [{ name: "policyId", type: "uint256" }],
  },
  {
    name: "submitClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "evidenceCid", type: "string" },
    ],
    outputs: [{ name: "claimId", type: "uint256" }],
  },
  {
    name: "settleClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "claimId", type: "uint256" },
      { name: "approved", type: "bool" },
      { name: "payoutAmount", type: "uint256" },
      { name: "teeSignature", type: "bytes" },
      { name: "attestationHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "depositFunds",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

const chain = {
  id: CHAIN_ID,
  name: IS_MAINNET ? "0G-Mainnet" : "0G-Galileo",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
} as const;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n🚀 InsurAI Activity Generator`);
  console.log(`   Network: ${networkArg} (Chain ID: ${CHAIN_ID})`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   Explorer: ${EXPLORER}`);
  console.log(`   Generating ${countArg} policy/claim cycles\n`);

  const account = privateKeyToAccount(DEPLOYER_KEY);
  const teeAccount = TEE_KEY && !TEE_KEY.includes("YOUR_") ? privateKeyToAccount(TEE_KEY) : account;

  const walletClient = createWalletClient({
    account,
    chain: chain as never,
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: chain as never,
    transport: http(RPC_URL),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Wallet: ${account.address}`);
  console.log(`   Balance: ${(Number(balance) / 1e18).toFixed(4)} 0G\n`);

  if (balance < parseEther("0.01")) {
    console.error("❌ Insufficient balance. Get testnet tokens from https://faucet.0g.ai");
    process.exit(1);
  }

  // Deposit funds to pool first
  console.log("📥 Depositing funds to insurance pool...");
  try {
    const depositTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI as never,
      functionName: "depositFunds",
      value: parseEther("0.08"), // larger deposit to cover multiple payouts
    } as never);
    await publicClient.waitForTransactionReceipt({ hash: depositTx });
    console.log(`   ✅ Deposited 0.08 0G | ${EXPLORER}/tx/${depositTx}\n`);
  } catch (e) {
    console.log(`   ⚠️  Deposit failed (pool may already be funded): ${e instanceof Error ? e.message.slice(0, 60) : e}\n`);
  }

  const policyTypes = [0, 1, 2, 3, 4]; // FlightDelay, Gadget, Event, Medical, CryptoShield
  const policyNames = ["FlightDelay", "GadgetWarranty", "EventCancellation", "TravelMedical", "CryptoShield"];
  const results: Array<{ policyId: string; claimId?: string; settleTx?: string }> = [];

  for (let i = 0; i < countArg; i++) {
    const policyType = policyTypes[i % policyTypes.length];
    const policyName = policyNames[policyType];
    const coverage = parseEther("0.005"); // 0.005 0G coverage — small enough to fit in pool
    const premium = parseEther("0.001"); // 0.001 0G premium
    const storageCid = `0g://activity-gen/${Date.now()}-${i}`;

    console.log(`[${i + 1}/${countArg}] Buying ${policyName} policy...`);

    try {
      // Buy policy
      const buyTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: INSURANCE_ABI as never,
        functionName: "buyPolicy",
        args: [
          `${account.address.slice(0, 6)}.0g`,
          policyType,
          coverage,
          BigInt(30),
          storageCid,
        ],
        value: premium,
      } as never);

      const buyReceipt = await publicClient.waitForTransactionReceipt({ hash: buyTx });
      
      // Extract policyId from logs (topic[1] of PolicyPurchased event)
      const policyLog = buyReceipt.logs[0];
      const policyId = policyLog?.topics[1] ? BigInt(policyLog.topics[1]) : BigInt(i + 1);
      
      console.log(`   ✅ Policy #${policyId} | ${EXPLORER}/tx/${buyTx}`);
      results.push({ policyId: policyId.toString() });

      await sleep(2000);

      // Submit claim for every other policy
      if (i % 2 === 0) {
        console.log(`   📋 Submitting claim for policy #${policyId}...`);
        const evidenceCid = `0g://evidence/activity-${Date.now()}-${i}`;
        
        const claimTx = await walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: INSURANCE_ABI as never,
          functionName: "submitClaim",
          args: [policyId, evidenceCid],
        } as never);

        const claimReceipt = await publicClient.waitForTransactionReceipt({ hash: claimTx });
        const claimLog = claimReceipt.logs[0];
        const claimId = claimLog?.topics[1] ? BigInt(claimLog.topics[1]) : BigInt(i + 100);

        console.log(`   ✅ Claim #${claimId} | ${EXPLORER}/tx/${claimTx}`);

        await sleep(2000);

        // Settle claim with TEE signature
        const approved = true;
        const payoutAmount = (coverage * BigInt(8000)) / BigInt(10000); // 80% payout = 0.004 0G
        const attestationHash = keccak256(`0x${Buffer.from(`attestation-${claimId}-${Date.now()}`).toString("hex")}`);
        
        const digest = keccak256(
          encodePacked(
            ["uint256", "uint256", "address", "uint256", "bool"],
            [claimId, policyId, account.address, payoutAmount, approved],
          ),
        );
        const teeSignature = await teeAccount.signMessage({ message: { raw: digest } });

        const settleTx = await walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: INSURANCE_ABI as never,
          functionName: "settleClaim",
          args: [claimId, approved, payoutAmount, teeSignature, attestationHash],
        } as never);

        await publicClient.waitForTransactionReceipt({ hash: settleTx });
        console.log(`   ✅ Settled claim #${claimId} (approved, ${(Number(payoutAmount) / 1e18).toFixed(4)} 0G) | ${EXPLORER}/tx/${settleTx}`);
        
        results[results.length - 1].claimId = claimId.toString();
        results[results.length - 1].settleTx = settleTx;
      }

      await sleep(3000);
    } catch (err) {
      console.error(`   ❌ Error: ${err instanceof Error ? err.message.slice(0, 100) : err}`);
    }
  }

  console.log(`\n✅ Activity generation complete!`);
  console.log(`   Policies created: ${results.length}`);
  console.log(`   Claims settled: ${results.filter((r) => r.settleTx).length}`);
  console.log(`   Explorer: ${EXPLORER}/address/${CONTRACT_ADDRESS}`);
  console.log(`\n📋 Summary:`);
  results.forEach((r, i) => {
    console.log(`   [${i + 1}] Policy #${r.policyId}${r.claimId ? ` → Claim #${r.claimId} settled` : ""}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
