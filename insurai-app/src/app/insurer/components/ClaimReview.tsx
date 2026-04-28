"use client";
import { getMockClaims, getMockPolicies, shortHash, generateTxHash } from "@/lib/data";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending: { label: "Pending", badge: "badge-amber" },
  processing: { label: "Processing", badge: "badge-cyan" },
  approved: { label: "Approved", badge: "badge-emerald" },
  rejected: { label: "Rejected", badge: "badge-rose" },
  paid: { label: "Paid Out", badge: "badge-emerald" },
};

export default function ClaimReview() {
  const claims = getMockClaims();
  const policies = getMockPolicies();
  const [selectedClaim, setSelectedClaim] = useState(claims[0] || null);
  const [approving, setApproving] = useState(false);
  const [approveTx, setApproveTx] = useState("");

  async function handleApprove() {
    setApproving(true);
    await new Promise((r) => setTimeout(r, 1800));
    setApproveTx(generateTxHash());
    setApproving(false);
  }

  const policy = policies.find((p) => p.id === selectedClaim?.policyId);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Claim Review</h1>
        <p style={{ color: "var(--text-secondary)" }}>Inspect AI decisions, TEE attestations, and manage claim payouts.</p>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Claims List */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>All Claims</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {claims.map((claim) => {
              const sc = STATUS_CONFIG[claim.status];
              const isSelected = selectedClaim?.id === claim.id;
              return (
                <div
                  key={claim.id}
                  className="card"
                  onClick={() => setSelectedClaim(claim)}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? "1px solid var(--cyan)" : undefined,
                    background: isSelected ? "rgba(0,212,255,0.05)" : undefined,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", color: "var(--cyan)", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                        {claim.id}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {claim.agentId} · {new Date(claim.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`badge ${sc.badge}`}>{sc.label}</span>
                      {claim.payoutAmount && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--emerald)", marginTop: 4 }}>
                          ${claim.payoutAmount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Detail */}
        {selectedClaim && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selectedClaim.id}</h3>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{selectedClaim.agentId}</div>
                </div>
                <span className={`badge ${STATUS_CONFIG[selectedClaim.status]?.badge}`}>
                  {STATUS_CONFIG[selectedClaim.status]?.label}
                </span>
              </div>

              {/* Key info */}
              {[
                { label: "Policy", value: selectedClaim.policyId },
                { label: "Coverage", value: policy ? `$${policy.coverage}` : "—" },
                { label: "Payout", value: selectedClaim.payoutAmount ? `$${selectedClaim.payoutAmount}` : "Pending" },
                { label: "Submitted", value: new Date(selectedClaim.submittedAt).toLocaleString() },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Artifacts */}
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Onchain Artifacts</h4>
              {[
                { label: "Submit TX", hash: selectedClaim.submitTxHash, color: "var(--cyan)" },
                { label: "Storage CID", hash: selectedClaim.evidenceCid, color: "var(--violet)" },
                { label: "Payout TX", hash: selectedClaim.payoutTxHash || "—", color: "var(--emerald)" },
              ].map((a) => (
                <div key={a.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    {a.label}
                  </div>
                  <div className="hash-display" style={{ fontSize: 11, color: a.color }}>
                    {a.hash !== "—" ? shortHash(a.hash, 10) : "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* TEE Result */}
            {selectedClaim.teeSig && (
              <div className="tee-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--emerald)" }}>🔐 TEE Decision</span>
                  {selectedClaim.aiScore && (
                    <span className="badge badge-emerald">
                      Confidence: {(selectedClaim.aiScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>Enclave Signature:</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--emerald)", wordBreak: "break-all", lineHeight: 1.6 }}>
                  {selectedClaim.teeSig}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedClaim.status === "pending" && (
              <div className="card">
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Manual Override</h4>
                {approveTx ? (
                  <div>
                    <div style={{ color: "var(--emerald)", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>✅ Override recorded onchain</div>
                    <div className="hash-display" style={{ fontSize: 11 }}>{approveTx.slice(0, 48)}...</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-success btn-sm" disabled={approving} onClick={handleApprove} style={{ flex: 1 }}>
                      {approving ? "Processing..." : "✅ Approve & Pay"}
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                      ❌ Reject Claim
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
