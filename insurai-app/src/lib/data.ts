// Simulated 0G blockchain state and helpers

export type PolicyType = "flight_delay" | "gadget_warranty" | "event_cancellation" | "travel_medical";

export interface Policy {
  id: string;
  type: PolicyType;
  holder: string;
  agentId: string;
  premium: number;
  coverage: number;
  status: "active" | "expired" | "claimed" | "pending_claim";
  createdAt: string;
  expiresAt: string;
  txHash: string;
  contractAddress: string;
  details: Record<string, string>;
}

export interface Claim {
  id: string;
  policyId: string;
  holder: string;
  agentId: string;
  type: PolicyType;
  status: "pending" | "processing" | "approved" | "rejected" | "paid";
  submittedAt: string;
  evidenceCid: string;
  submitTxHash: string;
  teeSig?: string;
  payoutTxHash?: string;
  payoutAmount?: number;
  aiScore?: number;
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  label: string;
  status: "pending" | "running" | "done" | "failed";
  timestamp?: string;
  detail?: string;
}

export const POLICY_PRODUCTS = [
  {
    type: "flight_delay" as PolicyType,
    name: "Flight Delay Shield",
    icon: "✈️",
    description: "Get compensated automatically if your flight is delayed by 2+ hours",
    premiums: [
      { coverage: 100, premium: 8, label: "$100 (Budget)" },
      { coverage: 250, premium: 15, label: "$250 (Standard)" },
      { coverage: 500, premium: 25, label: "$500 (Premium)" },
    ],
    color: "cyan",
    fields: ["Flight Number", "Flight Date", "Departure Airport", "Arrival Airport"],
  },
  {
    type: "gadget_warranty" as PolicyType,
    name: "Gadget Warranty Plus",
    icon: "📱",
    description: "Extended warranty for electronics — covers accidental damage & malfunction",
    premiums: [
      { coverage: 200, premium: 20, label: "$200 (Basic)" },
      { coverage: 500, premium: 45, label: "$500 (Standard)" },
      { coverage: 1000, premium: 80, label: "$1,000 (Pro)" },
    ],
    color: "violet",
    fields: ["Device Type", "Device Model", "Purchase Date", "Serial Number"],
  },
  {
    type: "event_cancellation" as PolicyType,
    name: "Event Cancellation Cover",
    icon: "🎫",
    description: "Full refund if your booked event is cancelled due to covered reasons",
    premiums: [
      { coverage: 150, premium: 12, label: "$150 (Basic)" },
      { coverage: 400, premium: 30, label: "$400 (Standard)" },
      { coverage: 800, premium: 55, label: "$800 (Premium)" },
    ],
    color: "emerald",
    fields: ["Event Name", "Event Date", "Venue", "Ticket Cost"],
  },
  {
    type: "travel_medical" as PolicyType,
    name: "Travel Medical Guard",
    icon: "🏥",
    description: "Emergency medical coverage while travelling internationally",
    premiums: [
      { coverage: 5000, premium: 35, label: "$5,000 (Essential)" },
      { coverage: 25000, premium: 80, label: "$25,000 (Standard)" },
      { coverage: 100000, premium: 150, label: "$100,000 (Comprehensive)" },
    ],
    color: "amber",
    fields: ["Destination Country", "Travel Start Date", "Return Date", "Pre-existing Conditions"],
  },
];

export function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

export function generateCid(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789";
  let cid = "Qm";
  for (let i = 0; i < 44; i++) cid += chars[Math.floor(Math.random() * chars.length)];
  return cid;
}

export function generateTeeSig(): string {
  const chars = "0123456789abcdef";
  let sig = "0x";
  for (let i = 0; i < 130; i++) sig += chars[Math.floor(Math.random() * 16)];
  return sig;
}

export function shortHash(hash: string, len = 8): string {
  if (hash.length <= len * 2 + 3) return hash;
  return `${hash.slice(0, len + 2)}...${hash.slice(-len)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Simulated on-chain state (in-memory for demo)
const MOCK_POLICIES: Policy[] = [
  {
    id: "POL-001",
    type: "flight_delay",
    holder: "Alice Chen",
    agentId: "alice.0g",
    premium: 25,
    coverage: 500,
    status: "active",
    createdAt: "2026-04-20T10:30:00Z",
    expiresAt: "2026-05-20T10:30:00Z",
    txHash: "0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    contractAddress: "0xDEADBEEF12345678901234567890abcdef123456",
    details: {
      "Flight Number": "AI-202",
      "Flight Date": "2026-05-10",
      "Departure Airport": "BOM",
      "Arrival Airport": "DEL",
    },
  },
  {
    id: "POL-002",
    type: "gadget_warranty",
    holder: "Alice Chen",
    agentId: "alice.0g",
    premium: 45,
    coverage: 500,
    status: "claimed",
    createdAt: "2026-03-15T14:20:00Z",
    expiresAt: "2027-03-15T14:20:00Z",
    txHash: "0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567",
    contractAddress: "0xDEADBEEF12345678901234567890abcdef123456",
    details: {
      "Device Type": "Smartphone",
      "Device Model": "iPhone 16 Pro",
      "Purchase Date": "2026-03-10",
      "Serial Number": "C39ZP2QXPHL6",
    },
  },
];

const MOCK_CLAIMS: Claim[] = [
  {
    id: "CLM-001",
    policyId: "POL-002",
    holder: "Alice Chen",
    agentId: "alice.0g",
    type: "gadget_warranty",
    status: "paid",
    submittedAt: "2026-04-18T09:15:00Z",
    evidenceCid: "QmXYZ123abcdefghijklmnopqrstuvwxyz0123456789ab",
    submitTxHash: "0xc3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
    teeSig: "3045022100a1b2c3d4e5f6789012345678901234567890abcdef123456789021200b2c3d4",
    payoutTxHash: "0xd4e5f6789012345678901234567890abcdef1234567890abcdef123456789",
    payoutAmount: 480,
    aiScore: 0.94,
    processingSteps: [
      { label: "Claim submitted to chain", status: "done", timestamp: "09:15:01" },
      { label: "Evidence uploaded to 0G Storage", status: "done", timestamp: "09:15:04", detail: "QmXYZ123..." },
      { label: "TEE enclave initialized", status: "done", timestamp: "09:15:06" },
      { label: "AI model inference", status: "done", timestamp: "09:15:08", detail: "Score: 0.94 (APPROVED)" },
      { label: "Enclave signature verified", status: "done", timestamp: "09:15:09", detail: "SIG: 3045..." },
      { label: "Payout released", status: "done", timestamp: "09:15:10", detail: "$480 → alice.0g" },
    ],
  },
];

export function getMockPolicies(): Policy[] {
  return MOCK_POLICIES;
}

export function getMockClaims(): Claim[] {
  return MOCK_CLAIMS;
}

export function addPolicy(policy: Policy) {
  MOCK_POLICIES.unshift(policy);
}

export function addClaim(claim: Claim) {
  MOCK_CLAIMS.unshift(claim);
}
