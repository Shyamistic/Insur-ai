"use client";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS, INSURANCE_ABI, CLAIM_STATUS_MAP, explorerTxUrl, IS_CONTRACT_DEPLOYED } from "@/lib/contract";
import { getMockClaims, shortHash } from "@/lib/data";
import { verifyAuditTrail, type AuditStep } from "@/lib/0g/audit";

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: string }> = {
  none: { label: "None", badge: "badge-amber", icon: "○" },
  pending: { label: "Pending", badge: "badge-amber", icon: "⏳" },
  approved: { label: "Approved", badge: "badge-emerald", icon: "✅" },
  rejected: { label: "Rejected", badge: "badge-rose", icon: "❌" },
  paid: { label: "Paid Out", badge: "badge-emerald", icon: "💸" },
};

const TYPE_LABELS: Record<string, string> = {
  flight_delay: "✈️ Flight Delay",
  gadget_warranty: "📱 Gadget Warranty",
  event_cancellation: "🎫 Event Cancellation",
  travel_medical: "🏥 Travel Medical",
  crypto_portfolio_shield: "🛡️ Crypto Shield",
};

type OnChainClaim = {
  id: string;
  policyId: string;
  holder: string;
  evidenceCid: string;
  status: string;
  submittedAt: string;
  settledAt: string;
  payout: string;
  teeSignature: string;
  attestationHash: string;
  // Parsed from attestation (if available)
  agentResponses?: Array<{ agentName: string; score: number; reasoning: string }>;
  auditTrail?: AuditStep[];
  aiScore?: number;
};

export default function ClaimHistory() {
  const { address, isConnected } = useAccount();
  const [onChainClaims, setOnChainClaims] = useState<OnChainClaim[]>([]);
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [auditVerifications, setAuditVerifications] = useState<Record<string, boolean>>({});

  // ── Read holder's claim IDs ────────────────────────────────────────────────
  const { data: claimIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getHolderClaims",
    args: address ? [address] : undefined,
    query: { enabled: !!address && IS_CONTRACT_DEPLOYED },
  });

  // ── Read each claim's details ─────────────────────────────────────────────
  const claimContracts = (claimIds ?? []).map((id) => ({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: INSURANCE_ABI,
    functionName: "getClaim" as const,
    args: [id] as [bigint],
  }));

  const { data: claimDetails } = useReadContracts({
    contracts: claimContracts,
    query: { enabled: claimContracts.length > 0 },
  });

  // ── Parse on-chain claim data ─────────────────────────────────────────────
  useEffect(() => {
    if (!claimDetails) return;
    const parsed: OnChainClaim[] = [];
    for (const result of claimDetails) {
      if (result.status !== "success" || !result.result) continue;
      const c = result.result as {
        id: bigint;
        policyId: bigint;
        holder: string;
        evidenceCid: string;
        status: number;
        submittedAt: bigint;
        settledAt: bigint;
        payout: bigint;
        teeSignature: string;
        attestationHash: string;
      };

      parsed.push({
        id: `CLM-${c.id.toString()}`,
        policyId: `POL-${c.policyId.toString()}`,
        holder: c.holder,
        evidenceCid: c.evidenceCid,
        status: CLAIM_STATUS_MAP[c.status] || "pending",
        submittedAt: new Date(Number(c.submittedAt) * 1000).toISOString(),
        settledAt: c.settledAt > BigInt(0) ? new Date(Number(c.settledAt) * 1000).toISOString() : "",
        payout: formatEther(c.payout),
        teeSignature: c.teeSignature,
        attestationHash: c.attestationHash,
      });
    }
    setOnChainClaims(parsed);
  }, [claimDetails]);

  function verifyAudit(claimId: string, trail: AuditStep[]) {
    const result = verifyAuditTrail(trail);
    setAuditVerifications((prev) => ({ ...prev, [claimId]: result.valid }));
  }

  // Use on-chain data if available, fall back to mock
  const displayClaims = onChainClaims.length > 0 ? onChainClaims : getMockClaims();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Claim History</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          All your claims with onchain proofs, TEE attestations, and audit trails.
        </p>
      </div>

      {displayClaims.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h3 style={{ color: "var(--text-secondary)" }}>No claims yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Submit your first claim from the sidebar.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayClaims.map((claim) => {
            const claimId = "id" in claim ? claim.id : `CLM-${Math.random()}`;
            const status = "status" in claim ? claim.status : "paid";
            const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const isExpanded = expandedClaim === claimId;

            // Handle both on-chain and mock claim shapes
            const submitTxHash = "submitTxHash" in claim ? claim.submitTxHash : "";
            const payoutTxHash = "payoutTxHash" in claim ? claim.payoutTxHash : "";
            const evidenceCid = "evidenceCid" in claim ? claim.evidenceCid : "";
            const teeSig = "teeSig" in claim ? claim.teeSig : ("teeSignature" in claim ? claim.teeSignature : "");
            const aiScore = "aiScore" in claim ? claim.aiScore : undefined;
            const payout = "payoutAmount" in claim ? claim.payoutAmount : ("payout" in claim ? parseFloat(claim.payout as string) : 0);
            const agentResponses = "agentResponses" in claim ? claim.agentResponses : undefined;
            const auditTrail = "auditTrail" in claim ? claim.auditTrail : undefined;

            return (
              <div key={claimId} className="card">
                {/* Header */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12, cursor: "pointer" }}
                  onClick={() => setExpandedClaim(isExpanded ? null : claimId)}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cyan)" }}>{claimId}</span>
                      <span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {"type" in claim ? (TYPE_LABELS[claim.type as string] || claim.type) : "Claim"} •{" "}
                      {new Date("submittedAt" in claim ? claim.submittedAt : Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {payout && Number(payout) > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--emerald)" }}>
                          {typeof payout === "number" ? `$${payout.toLocaleString()}` : `${payout} 0G`}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Paid Out</div>
                      </div>
                    )}
                    <span style={{ color: "var(--text-muted)", fontSize: 18 }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Artifacts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  {submitTxHash && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Submit Tx</div>
                      <a href={explorerTxUrl(submitTxHash)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div className="hash-display" style={{ fontSize: 10, cursor: "pointer" }}>{shortHash(submitTxHash, 8)} ↗</div>
                      </a>
                    </div>
                  )}
                  {evidenceCid && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Storage CID</div>
                      <div className="hash-display" style={{ fontSize: 10, color: "var(--violet)", borderColor: "rgba(123,47,255,0.2)", background: "rgba(123,47,255,0.06)" }}>
                        {shortHash(evidenceCid, 8)}
                      </div>
                    </div>
                  )}
                  {payoutTxHash && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Payout Tx</div>
                      <a href={explorerTxUrl(payoutTxHash)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div className="hash-display" style={{ fontSize: 10, color: "var(--emerald)", borderColor: "rgba(0,255,157,0.2)", background: "rgba(0,255,157,0.06)", cursor: "pointer" }}>
                          {shortHash(payoutTxHash, 8)} ↗
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* TEE Sig */}
                {teeSig && (
                  <div className="tee-box" style={{ marginBottom: isExpanded ? 16 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--emerald)" }}>🔐 TEE Enclave Signature</span>
                      {aiScore !== undefined && (
                        <span className="badge badge-emerald">AI Score: {(aiScore * 100).toFixed(0)}%</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--emerald)", wordBreak: "break-all" }}>
                      {teeSig}
                    </div>
                  </div>
                )}

                {/* Expanded: Multi-Agent + Audit Trail */}
                {isExpanded && (
                  <div style={{ marginTop: 16 }}>
                    {/* Multi-Agent Evaluation */}
                    {agentResponses && agentResponses.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🤖 Multi-Agent Evaluation</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                          {agentResponses.map((agent) => {
                            const labels: Record<string, string> = {
                              fraud_detector: "🔍 Fraud Detector",
                              parametric_checker: "📋 Parametric",
                              payout_calculator: "💰 Payout Calc",
                            };
                            const scoreColor = agent.score >= 0.75 ? "var(--emerald)" : agent.score >= 0.5 ? "var(--amber)" : "var(--rose)";
                            return (
                              <div key={agent.agentName} style={{ padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{labels[agent.agentName] || agent.agentName}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor, marginBottom: 4 }}>{(agent.score * 100).toFixed(0)}%</div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4 }}>{agent.reasoning?.slice(0, 60)}...</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Audit Trail */}
                    {auditTrail && auditTrail.length > 0 && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700 }}>🔗 SHA-256 Audit Trail</h4>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => verifyAudit(claimId, auditTrail)}
                          >
                            {auditVerifications[claimId] === undefined
                              ? "Verify Chain"
                              : auditVerifications[claimId]
                              ? "✓ Chain Valid"
                              : "✗ Chain Invalid"}
                          </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {auditTrail.map((entry, i) => (
                            <div key={i} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cyan)" }}>{entry.step}</span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--emerald)" }}>
                                {entry.hash.slice(0, 16)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
