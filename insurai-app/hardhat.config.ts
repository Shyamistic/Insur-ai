import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const TEE_PRIVATE_KEY = process.env.TEE_SIGNER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000002";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    "0g-galileo": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache-hardhat",
  },
};

export default config;
