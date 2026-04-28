"use client";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, INSURANCE_ABI } from "@/lib/contract";
import { formatEther } from "viem";
import { getMockPolicies, shortHash } from "@/lib/data";

interface Props {
  onBuyNew: () => void;
  onSubmitClaim: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  flight_delay: "✈️ Flight Delay",
  gadget_warranty: "📱 Gadget Warranty",
  event_cancellation: "🎫 Event Cancellation",
  travel_medical: "🏥 Travel Medical",
};

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  active: { label: "Active", badge: "badge-emerald" },
  expired: { label: "Expired", badge: "badge-amber" },
  claimed: { label: "Claimed", badge: "badge-violet" },
  pending_claim: { label: "Pending Claim", badge: "badge-amber" },
};

export default function PolicyList({ onBuyNew, onSubmitClaim }: Props) {
  const { address, isConnected } = useAccount();

  const { data: policyIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getHolderPolicies",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: stats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getStats",
  });

  const policies = getMockPolicies();
  const activePoliciesCount = policyIds?.length || 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Welcome back, <span className="gradient-text">alice.0g</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Your policies are protected by 0G Compute TEE
          </p>
        </div>
        <button className="btn btn-primary" onClick={onBuyNew}>+ Buy New Policy</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: "My Policies", value: activePoliciesCount.toString(), icon: "🛡️", color: "var(--cyan)" },
          { label: "Protocol Policies", value: stats?.[0]?.toString() || "0", icon: "🌐", color: "var(--emerald)" },
          { label: "Claims Filed", value: stats?.[1]?.toString() || "0", icon: "📋", color: "var(--violet)" },
          { label: "Total Payouts", value: stats?.[3] ? Number(formatEther(stats[3])).toFixed(2) + " 0G" : "0", icon: "⚡", color: "var(--amber)" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 32 }}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Policies Table */}
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>My Policies</h2>
        <button className="btn btn-secondary btn-sm" onClick={onSubmitClaim}>Submit a Claim →</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Coverage</th>
              <th>Premium</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => {
              const sc = STATUS_CONFIG[p.status];
              return (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}>{p.id}</span>
                  </td>
                  <td>{TYPE_LABELS[p.type] || p.type}</td>
                  <td><span style={{ color: "var(--emerald)", fontWeight: 600 }}>${p.coverage}</span></td>
                  <td><span style={{ color: "var(--text-secondary)" }}>${p.premium}</span></td>
                  <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {new Date(p.expiresAt).toLocaleDateString("en-US")}
                  </td>
                  <td>
                    <span className="hash-display" style={{ fontSize: 11 }}>
                      {shortHash(p.txHash, 6)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Contract Info */}
      <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "var(--radius-md)" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Contract Info
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Contract Address: </span>
            <span className="hash-display" style={{ display: "inline", padding: "2px 8px", fontSize: 12 }}>
              {CONTRACT_ADDRESS}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Network: </span>
            <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}>0G Testnet</span>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Block Height: </span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--violet)" }}>#4,829,156</span>
          </div>
        </div>
      </div>
    </div>
  );
}
