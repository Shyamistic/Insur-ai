"use client";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACT_ADDRESS, INSURANCE_ABI } from "@/lib/contract";

const RECENT_CLAIMS = [
  { id: "CLM-001", holder: "alice.0g", type: "📱 Gadget", amount: 480, status: "paid", ai: "96%", time: "2h ago" },
  { id: "CLM-002", holder: "dave.0g", type: "✈️ Flight", amount: 250, status: "approved", ai: "91%", time: "5h ago" },
  { id: "CLM-003", holder: "sarah.0g", type: "🎫 Event", amount: 150, status: "processing", ai: "—", time: "1h ago" },
  { id: "CLM-004", holder: "mike.0g", type: "🏥 Medical", amount: 5000, status: "pending", ai: "—", time: "30m ago" },
];

const RECENT_TXS = [
  { desc: "Policy activation", amount: "+$25.00", type: "premium", time: "3m ago" },
  { desc: "Claim payout #CLM-001", amount: "-$480.00", type: "payout", time: "2h ago" },
  { desc: "Capital deposit", amount: "+$50,000.00", type: "deposit", time: "1d ago" },
  { desc: "Claim payout #CLM-002", amount: "-$250.00", type: "payout", time: "5h ago" },
];

export default function InsurerDashboard() {
  const [depositAmount, setDepositAmount] = useState("0.1");

  const { address, isConnected } = useAccount();
  const { data: stats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getStats",
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const statsList = [
    { label: "Total Policies", value: stats?.[0]?.toString() || "0", delta: "+0 today", icon: "🛡️", color: "var(--cyan)" },
    { label: "Active Claims", value: stats?.[1]?.toString() || "0", delta: "0 processing", icon: "📋", color: "var(--amber)" },
    { label: "Revenue (0G)", value: stats?.[2] ? Number(formatEther(stats[2])).toFixed(2) : "0", delta: "onchain", icon: "💰", color: "var(--emerald)" },
    { label: "Pool Balance", value: stats?.[4] ? Number(formatEther(stats[4])).toFixed(2) + " 0G" : "0", delta: "Available", icon: "🏦", color: "var(--violet)" },
  ];

  async function handleDeposit() {
    if (!isConnected || !depositAmount) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI,
      functionName: "depositFunds",
      value: parseEther(depositAmount),
    });
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Insurer Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            <span style={{ color: "var(--amber)" }}>bob.insurer.0g</span> — Real-time overview of your insurance pool
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost btn-sm">Export Report</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statsList.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <span className="badge badge-cyan" style={{ fontSize: 10 }}>LIVE</span>
            </div>
            <div className="stat-value" style={{ color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Recent Claims */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Claims</h3>
            <span className="badge badge-amber">4 pending review</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RECENT_CLAIMS.map((claim) => (
              <div key={claim.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--cyan)", fontWeight: 600 }}>{claim.id}</span>
                    <span style={{ fontSize: 12 }}>{claim.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {claim.holder} · {claim.time}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--emerald)", fontSize: 14 }}>${claim.amount}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: claim.status === "paid" ? "var(--emerald)" : claim.status === "approved" ? "var(--cyan)" : claim.status === "processing" ? "var(--violet)" : "var(--amber)"
                  }}>
                    {claim.status.toUpperCase()}
                  </div>
                </div>
                {claim.ai !== "—" && (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,255,157,0.12)", border: "1px solid rgba(0,255,157,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--emerald)", flexShrink: 0 }}>
                    {claim.ai}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fund Pool */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Deposit Capital */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💰 Fund Liquidity Pool</h3>
            {isConfirmed ? (
              <div>
                <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 600, marginBottom: 8 }}>✅ Deposit Confirmed</div>
                <div className="hash-display" style={{ fontSize: 11 }}>{hash}</div>
              </div>
            ) : (
              <div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Deposit Amount (0G)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-success"
                  style={{ width: "100%" }}
                  disabled={isPending || isConfirming}
                  onClick={handleDeposit}
                >
                  {isPending || isConfirming ? (
                    <><span className="animate-blink">●</span> Broadcasting to 0G Chain...</>
                  ) : (
                    `Deposit ${depositAmount} 0G`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pool Transactions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RECENT_TXS.map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.desc}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{tx.time}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 13, color: tx.type === "payout" ? "var(--rose)" : "var(--emerald)" }}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TEE Node Health */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔐 TEE Compute Node Health</h3>
          <span className="badge badge-emerald">All systems operational</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ padding: "10px 8px", background: "rgba(0,255,157,0.06)", border: "1px solid rgba(0,255,157,0.2)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--emerald)", marginBottom: 2 }}>NODE-{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Intel TDX</div>
              <div style={{ width: 6, height: 6, background: "var(--emerald)", borderRadius: "50%", margin: "4px auto 0", boxShadow: "0 0 6px var(--emerald)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
