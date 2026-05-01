// ─── 0G Galileo Testnet Chain Definition ──────────────────────────────────────
export const og_galileo = {
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
    public: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: {
      name: "0G Chainscan",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
} as const;

// ─── Contract Configuration ───────────────────────────────────────────────────
// This is populated after deployment via scripts/deploy.ts
// Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local after deploying
export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const EXPLORER_BASE = "https://chainscan-galileo.0g.ai";
export const STORAGE_SCAN_BASE = "https://storagescan-galileo.0g.ai";

// ─── Storage Network Config ───────────────────────────────────────────────────
export const OG_STORAGE_RPC = "https://rpc-storage-testnet.0g.ai";
export const OG_STORAGE_INDEXER = "https://indexer-storage-testnet-standard.0g.ai";

// ─── ABI ─────────────────────────────────────────────────────────────────────
export const INSURANCE_ABI = [
  // Write functions
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
  // Read functions
  {
    name: "getPolicy",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "holder", type: "address" },
          { name: "agentId", type: "string" },
          { name: "policyType", type: "uint8" },
          { name: "coverage", type: "uint256" },
          { name: "premium", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "storageCid", type: "string" },
        ],
      },
    ],
  },
  {
    name: "getClaim",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "claimId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "policyId", type: "uint256" },
          { name: "holder", type: "address" },
          { name: "evidenceCid", type: "string" },
          { name: "status", type: "uint8" },
          { name: "submittedAt", type: "uint256" },
          { name: "settledAt", type: "uint256" },
          { name: "payout", type: "uint256" },
          { name: "teeSignature", type: "bytes" },
          { name: "attestationHash", type: "bytes32" },
        ],
      },
    ],
  },
  {
    name: "getHolderPolicies",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "getHolderClaims",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "getStats",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "_policyCount", type: "uint256" },
      { name: "_claimCount", type: "uint256" },
      { name: "_totalPremiums", type: "uint256" },
      { name: "_totalPayouts", type: "uint256" },
      { name: "_poolBalance", type: "uint256" },
    ],
  },
  {
    name: "getPoolBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "policyCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "teeSignerAddress",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  // Events
  {
    name: "PolicyPurchased",
    type: "event",
    inputs: [
      { name: "policyId", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "agentId", type: "string", indexed: false },
      { name: "policyType", type: "uint8", indexed: false },
      { name: "coverage", type: "uint256", indexed: false },
      { name: "premium", type: "uint256", indexed: false },
      { name: "storageCid", type: "string", indexed: false },
    ],
  },
  {
    name: "ClaimSubmitted",
    type: "event",
    inputs: [
      { name: "claimId", type: "uint256", indexed: true },
      { name: "policyId", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "evidenceCid", type: "string", indexed: false },
    ],
  },
  {
    name: "ClaimApproved",
    type: "event",
    inputs: [
      { name: "claimId", type: "uint256", indexed: true },
      { name: "policyId", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "payout", type: "uint256", indexed: false },
      { name: "teeSignature", type: "bytes", indexed: false },
      { name: "attestationHash", type: "bytes32", indexed: false },
    ],
  },
  {
    name: "FundsDeposited",
    type: "event",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
