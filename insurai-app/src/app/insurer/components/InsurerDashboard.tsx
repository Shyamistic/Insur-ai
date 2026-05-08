"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACT_ADDRESS, INSURANCE_ABI, IS_CONTRACT_DEPLOYED, explorerTxUrl } from "@/lib/contract";

export default function InsurerDashboard() {
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [networkStatus, setNetworkStatus] = useState<{
    ok: boolean;
    activeCount: number;
    models: string[];
    latencyMs: number;
  } | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    services?: {
      chain?: { status: string; blockHeight: number };
      storage?: { status: string; mode: string };
      compute?: { status: string; providerCount: number };
    };
  } | null>(null);

  const { address, isConnected } = useAccount();

  const { data: stats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getStats",
    query: { enabled: IS_CONTRACT_DEPLOYED, refetchInterval: 15000 },
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // ── Fetch real network status ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchStatus() {
      try {
        const [nsRes, hRes] = await Promise.all([
          fetch("/api/network-status"),
          fetch("/api/health"),
        ]);
        if (nsRes.ok) setNetworkStatus(await nsRes.json());
        if (hRes.ok) setHealthStatus(await hRes.json());
      } catch { /* silent */ }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConfirmed) refetchStats();
  }, [isConfirmed]);

  const statsList = [
    {
      label: "Total Policies",
      value: stats?.[0]?.toString() || "—",
      delta: IS_CONTRACT_DEPLOYED ? "onchain" : "not deployed",
      icon: "🛡️",
      color: "var(--cyan)",
    },
    {
      label: "Total Claims",
      value: stats?.[1]?.toString() || "—",
      delta: "all time",
      icon: "📋",
      color: "var(--amber)",
    },
    {
      label: "Revenue (0G)",
      value: stats?.[2] ? Number(formatEther(stats[2])).toFixed(4) : "—",
      delta: "net premiums",
      icon: "💰",
      color: "var(--emerald)",
    },
    {
      label: "Pool Balance",
      value: stats?.[4] ? `${Number(formatEther(stats[4])).toFixed(4)} 0G` : "—",
      delta: "available",
      icon: "🏦",
      color: "var(--violet)",
    },
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

  const chainOk = healthStatus?.services?.chain?.status === "ok";
  const storageOk = healthStatus?.services?.storage?.status !== "down";
  const computeOk = healthStatus?.services?.compute?.status !== "down";

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Insurer Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            <span style={{ color: "var(--amber)" }}>
              {address ? `${address.slice(0, 6)}.insurer.0g` : "insurer.0g"}
            </span>{" "}
            — Real-time overview of your insurance pool
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/api/health" target="_blank" rel="noopener noreferrer">
            <button className="btn btn-ghost btn-sm">Health Check ↗</button>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statsList.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <span className={`badge ${IS_CONTRACT_DEPLOYED ? "badge-cyan" : "badge-amber"}`} style={{ fontSize: 10 }}>
                {IS_CONTRACT_DEPLOYED ? "LIVE" : "STUB"}
              </span>
            </div>
            <div className="stat-value" style={{ color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Fund Pool */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💰 Fund Liquidity Pool</h3>
            {isConfirmed && hash ? (
              <div>
                <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 600, marginBottom: 8 }}>✅ Deposit Confirmed</div>
                <a href={explorerTxUrl(hash)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div className="hash-display" style={{ fontSize: 11, cursor: "pointer" }}>{hash.slice(0, 32)}... ↗</div>
                </a>
              </div>
            ) : (
              <div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Deposit Amount (0G)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0.001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-success"
                  style={{ width: "100%" }}
                  disabled={isPending || isConfirming || !IS_CONTRACT_DEPLOYED}
                  onClick={handleDeposit}
                >
                  {isPending || isConfirming ? (
                    <><span className="animate-blink">●</span> Broadcasting...</>
                  ) : (
                    `Deposit ${depositAmount} 0G to Pool`
                  )}
                </button>
                {!IS_CONTRACT_DEPLOYED && (
                  <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 8 }}>
                    ⚠️ Deploy contract first to enable deposits
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pool utilization */}
          {stats && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Pool Utilization</h3>
              {(() => {
                const pool = Number(formatEther(stats[4]));
                const payouts = Number(formatEther(stats[3]));
                const total = pool + payouts;
                const utilization = total > 0 ? (payouts / total) * 100 : 0;
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Utilization</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--amber)" }}>{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Paid out: {payouts.toFixed(4)} 0G</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Available: {pool.toFixed(4)} 0G</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* 0G Network Status */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>🌐 0G Network Status</h3>
            <span className={`badge ${chainOk && storageOk && computeOk ? "badge-emerald" : "badge-amber"}`}>
              {chainOk && storageOk && computeOk ? "All Systems OK" : "Partial"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                label: "0G Chain",
                status: chainOk ? "ok" : "checking",
                detail: healthStatus?.services?.chain?.blockHeight
                  ? `Block #${healthStatus.services.chain.blockHeight.toLocaleString()}`
                  : "Connecting...",
                color: chainOk ? "var(--emerald)" : "var(--amber)",
              },
              {
                label: "0G Storage",
                status: storageOk ? "ok" : "checking",
                detail: healthStatus?.services?.storage?.mode || "Checking...",
                color: storageOk ? "var(--emerald)" : "var(--amber)",
              },
              {
                label: "0G Private Computer",
                status: computeOk ? "ok" : "checking",
                detail: networkStatus
                  ? `${networkStatus.activeCount} models • ${networkStatus.latencyMs}ms`
                  : "Checking...",
                color: computeOk ? "var(--emerald)" : "var(--amber)",
              },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.detail}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>
                    {item.status === "ok" ? "Online" : "Checking"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Available models */}
          {networkStatus?.models && networkStatus.models.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Available TEE Models
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {networkStatus.models.slice(0, 4).map((model) => (
                  <span key={model} className="badge badge-violet" style={{ fontSize: 10 }}>
                    {model.slice(0, 20)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TEE Node Health */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔐 0G Private Computer TEE Nodes</h3>
          <span className={`badge ${computeOk ? "badge-emerald" : "badge-amber"}`}>
            {networkStatus ? `${networkStatus.activeCount} Active` : "Checking..."}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {Array.from({ length: Math.max(networkStatus?.activeCount || 6, 6) }, (_, i) => (
            <div key={i} style={{ padding: "10px 8px", background: "rgba(0,255,157,0.06)", border: "1px solid rgba(0,255,157,0.2)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--emerald)", marginBottom: 2 }}>NODE-{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Intel TDX</div>
              <div style={{ width: 6, height: 6, background: "var(--emerald)", borderRadius: "50%", margin: "4px auto 0", boxShadow: "0 0 6px var(--emerald)" }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
          Powered by <strong style={{ color: "var(--cyan)" }}>0G Private Computer</strong> — OpenAI-compatible API with hardware TEE attestation on every inference request.
        </div>
      </div>
    </div>
  );
}
