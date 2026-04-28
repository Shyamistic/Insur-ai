import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying InsurAI to 0G Galileo Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer address:  ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance:  ${ethers.formatEther(balance)} 0G\n`);

  if (balance === 0n) {
    console.error("❌ Deployer has no balance. Get testnet 0G from https://faucet.0g.ai");
    process.exit(1);
  }

  // TEE signer is a separate account (simulates 0G Compute enclave)
  // In production this would be the TEE enclave's hardware-bound keypair
  const TEE_SIGNER = process.env.TEE_SIGNER_ADDRESS || deployer.address;
  console.log(`🔐 TEE Signer:        ${TEE_SIGNER}`);

  // Initial pool deposit (0.1 0G for demo)
  const initialDeposit = ethers.parseEther("0.1");
  console.log(`🏦 Initial pool deposit: ${ethers.formatEther(initialDeposit)} 0G\n`);

  // Deploy contract
  const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
  console.log("📡 Broadcasting deployment transaction...");
  
  const contract = await InsurancePolicy.deploy(TEE_SIGNER, { value: initialDeposit });
  console.log(`⏳ Waiting for deployment... (tx: ${contract.deploymentTransaction()?.hash})`);
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ InsurancePolicy deployed successfully!");
  console.log("─".repeat(60));
  console.log(`📋 Contract Address:  ${contractAddress}`);
  console.log(`🌐 Network:          0G Galileo Testnet (Chain ID: 16602)`);
  console.log(`🔗 Explorer:         https://chainscan-galileo.0g.ai/address/${contractAddress}`);
  console.log(`💰 Pool Balance:     ${ethers.formatEther(initialDeposit)} 0G`);
  console.log(`🔐 TEE Signer:       ${TEE_SIGNER}`);
  console.log("─".repeat(60));

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    teeSignerAddress: TEE_SIGNER,
    deployerAddress: deployer.address,
    network: "0g-galileo",
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    explorerUrl: `https://chainscan-galileo.0g.ai/address/${contractAddress}`,
    deployTxHash: contract.deploymentTransaction()?.hash,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../src/lib/deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to src/lib/deployment.json`);

  // Verify stats
  const stats = await contract.getStats();
  console.log(`\n📊 Contract Stats:`);
  console.log(`   Policies: ${stats[0]}`);
  console.log(`   Claims:   ${stats[1]}`);
  console.log(`   Pool:     ${ethers.formatEther(stats[4])} 0G`);

  console.log("\n🎉 Deployment complete! Add to .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=16602`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
