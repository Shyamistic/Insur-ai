"use client";
import { getMockClaims, shortHash } from "@/lib/data";

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: string }> = {
  pending: { label: "Pending", badge: "badge-amber", icon: "⏳" },
  processing: { label: "Processing", badge: "badge-cyan", icon: "⚙️" },
  approved: { label: "Approved", badge: "badge-emerald", icon: "✅" },
  rejected: { label: "Rejected", badge: "badge-rose", icon: "❌" },
  paid: { label: "Paid Out", badge: "badge-emerald", icon: "💸" },
};

const TYPE_LABELS: Record<string, string> = {
  flight_delay: "✈️ Flight Delay",
  gadget_warranty: "📱 Gadget Warranty",
  event_cancellation: "🎫 Event Cancellation",
  travel_medical: "🏥 Travel Medical",
};

export default function ClaimHistory() {
  const claims = getMockClaims();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Claim History</h1>
        <p style={{ color: "var(--text-secondary)" }}>All your claims with onchain proofs and TEE attestations.</p>
      </div>

      {claims.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h3 style={{ color: "var(--text-secondary)" }}>No claims yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Submit your first claim from the sidebar.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {claims.map((claim) => {
            const sc = STATUS_CONFIG[claim.status];
            return (
              <div key={claim.id} className="card">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cyan)" }}>{claim.id}</span>
                      <span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {TYPE_LABELS[claim.type] || claim.type} •{" "}
                      {new Date(claim.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  {claim.payoutAmount && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--emerald)" }}>
                        ${claim.payoutAmount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Paid Out</div>
                    </div>
                  )}
                </div>

                {/* Artifacts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      Submit Tx
                    </div>
                    <div className="hash-display" style={{ fontSize: 11 }}>{shortHash(claim.submitTxHash, 8)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      Storage CID
                    </div>
                    <div className="hash-display" style={{ fontSize: 11, color: "var(--violet)", borderColor: "rgba(123,47,255,0.2)", background: "rgba(123,47,255,0.06)" }}>
                      {shortHash(claim.evidenceCid, 8)}
                    </div>
                  </div>
                  {claim.payoutTxHash && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                        Payout Tx
                      </div>
                      <div className="hash-display" style={{ fontSize: 11, color: "var(--emerald)", borderColor: "rgba(0,255,157,0.2)", background: "rgba(0,255,157,0.06)" }}>
                        {shortHash(claim.payoutTxHash, 8)}
                      </div>
                    </div>
                  )}
                </div>

                {/* TEE Sig */}
                {claim.teeSig && (
                  <div className="tee-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--emerald)" }}>🔐 TEE Enclave Signature</span>
                      {claim.aiScore && (
                        <span className="badge badge-emerald">AI Score: {(claim.aiScore * 100).toFixed(0)}% Confidence</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--emerald)", wordBreak: "break-all" }}>
                      {claim.teeSig}
                    </div>
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
