import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
// ethers is injected by @nomicfoundation/hardhat-toolbox at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hreAny = hre as any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const { ethers } = hreAny;
  const network = hre.network.name;
  const isMainnet = network === "0g-mainnet";
  const chainId = isMainnet ? 16661 : 16602;
  const explorerBase = isMainnet
    ? "https://chainscan.0g.ai"
    : "https://chainscan-galileo.0g.ai";
  const rpcUrl = isMainnet
    ? "https://evmrpc.0g.ai"
    : "https://evmrpc-testnet.0g.ai";

  console.log(`🚀 Deploying InsurAI to 0G ${isMainnet ? "Mainnet" : "Galileo Testnet"}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer address:  ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance:  ${ethers.formatEther(balance)} 0G\n`);

  if (balance === 0n) {
    if (isMainnet) {
      console.error("❌ Deployer has no balance. Bridge 0G tokens to mainnet first.");
    } else {
      console.error("❌ Deployer has no balance. Get testnet 0G from https://faucet.0g.ai");
    }
    process.exit(1);
  }

  // TEE signer is a separate account (simulates 0G Compute enclave)
  // In production this would be the TEE enclave's hardware-bound keypair
  const TEE_SIGNER = process.env.TEE_SIGNER_ADDRESS || deployer.address;
  console.log(`🔐 TEE Signer:        ${TEE_SIGNER}`);

  // Initial pool deposit
  const initialDeposit = isMainnet
    ? ethers.parseEther("0.01")  // smaller deposit on mainnet
    : ethers.parseEther("0.05"); // testnet
  console.log(`🏦 Initial pool deposit: ${ethers.formatEther(initialDeposit)} 0G\n`);

  // ── Deploy InsurancePolicy ──────────────────────────────────────────────────
  const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
  console.log("📡 Broadcasting InsurancePolicy deployment...");

  const contract = await InsurancePolicy.deploy(TEE_SIGNER, { value: initialDeposit });
  console.log(`⏳ Waiting for deployment... (tx: ${contract.deploymentTransaction()?.hash})`);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ InsurancePolicy deployed successfully!");
  console.log("─".repeat(60));
  console.log(`📋 Contract Address:  ${contractAddress}`);
  console.log(`🌐 Network:          0G ${isMainnet ? "Mainnet" : "Galileo Testnet"} (Chain ID: ${chainId})`);
  console.log(`🔗 Explorer:         ${explorerBase}/address/${contractAddress}`);
  console.log(`💰 Pool Balance:     ${ethers.formatEther(initialDeposit)} 0G`);
  console.log(`🔐 TEE Signer:       ${TEE_SIGNER}`);
  console.log("─".repeat(60));

  // ── Deploy PolicyINFT ───────────────────────────────────────────────────────
  const PolicyINFT = await ethers.getContractFactory("PolicyINFT");
  console.log("\n📡 Broadcasting PolicyINFT deployment...");
  const inft = await PolicyINFT.deploy(deployer.address);
  await inft.waitForDeployment();
  const policyINFTAddress = await inft.getAddress();
  console.log(`🪪 PolicyINFT:       ${policyINFTAddress}`);
  console.log(`🔗 Explorer:         ${explorerBase}/address/${policyINFTAddress}`);

  // ── Save deployment info ────────────────────────────────────────────────────
  const deploymentInfo = {
    contractAddress,
    teeSignerAddress: TEE_SIGNER,
    deployerAddress: deployer.address,
    network: network,
    chainId,
    rpcUrl,
    explorerUrl: `${explorerBase}/address/${contractAddress}`,
    deployTxHash: contract.deploymentTransaction()?.hash,
    policyINFTAddress,
    deployedAt: new Date().toISOString(),
    isMainnet,
  };

  const outputPath = path.join(__dirname, "../src/lib/deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to src/lib/deployment.json`);

  // ── Verify stats ────────────────────────────────────────────────────────────
  const stats = await contract.getStats();
  console.log(`\n📊 Contract Stats:`);
  console.log(`   Policies: ${stats[0]}`);
  console.log(`   Claims:   ${stats[1]}`);
  console.log(`   Pool:     ${ethers.formatEther(stats[4])} 0G`);

  console.log("\n🎉 Deployment complete! Add to .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_POLICY_INFT_ADDRESS=${policyINFTAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${chainId}`);
  console.log(`NEXT_PUBLIC_IS_MAINNET=${isMainnet}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
