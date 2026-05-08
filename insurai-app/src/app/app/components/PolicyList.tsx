"use client";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS, INSURANCE_ABI, POLICY_TYPE_MAP, explorerTxUrl, IS_CONTRACT_DEPLOYED } from "@/lib/contract";
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
  crypto_portfolio_shield: "🛡️ Crypto Shield",
};

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  active: { label: "Active", badge: "badge-emerald" },
  expired: { label: "Expired", badge: "badge-amber" },
  claimed: { label: "Claimed", badge: "badge-violet" },
  pending_claim: { label: "Pending Claim", badge: "badge-amber" },
};

type OnChainPolicy = {
  id: string;
  type: string;
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
  storageCid: string;
};

export default function PolicyList({ onBuyNew, onSubmitClaim }: Props) {
  const { address, isConnected } = useAccount();
  const [blockHeight, setBlockHeight] = useState<string>("Loading...");
  const [onChainPolicies, setOnChainPolicies] = useState<OnChainPolicy[]>([]);

  // ── Read protocol stats ───────────────────────────────────────────────────
  const { data: stats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getStats",
    query: { enabled: IS_CONTRACT_DEPLOYED },
  });

  // ── Read holder's policy IDs ──────────────────────────────────────────────
  const { data: policyIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: INSURANCE_ABI,
    functionName: "getHolderPolicies",
    args: address ? [address] : undefined,
    query: { enabled: !!address && IS_CONTRACT_DEPLOYED },
  });

  // ── Read each policy's details ────────────────────────────────────────────
  const policyContracts = (policyIds ?? []).map((id) => ({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: INSURANCE_ABI,
    functionName: "getPolicy" as const,
    args: [id] as [bigint],
  }));

  const { data: policyDetails } = useReadContracts({
    contracts: policyContracts,
    query: { enabled: policyContracts.length > 0 },
  });

  // ── Parse on-chain policy data ────────────────────────────────────────────
  useEffect(() => {
    if (!policyDetails) return;
    const parsed: OnChainPolicy[] = [];
    for (const result of policyDetails) {
      if (result.status !== "success" || !result.result) continue;
      const p = result.result as {
        id: bigint;
        holder: string;
        agentId: string;
        policyType: number;
        coverage: bigint;
        premium: bigint;
        createdAt: bigint;
        expiresAt: bigint;
        active: boolean;
        storageCid: string;
      };
      const now = Date.now() / 1000;
      const expiresAt = Number(p.expiresAt);
      const status: OnChainPolicy["status"] = !p.active
        ? "claimed"
        : expiresAt < now
        ? "expired"
        : "active";

      parsed.push({
        id: `POL-${p.id.toString()}`,
        type: POLICY_TYPE_MAP[p.policyType] || "flight_delay",
        holder: p.holder,
        agentId: p.agentId,
        premium: Number(formatEther(p.premium)),
        coverage: Number(formatEther(p.coverage)),
        status,
        createdAt: new Date(Number(p.createdAt) * 1000).toISOString(),
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        txHash: "",
        contractAddress: CONTRACT_ADDRESS,
        details: {},
        storageCid: p.storageCid,
      });
    }
    setOnChainPolicies(parsed);
  }, [policyDetails]);

  // ── Fetch real block height ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchBlockHeight() {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_IS_MAINNET === "true"
          ? "https://evmrpc.0g.ai"
          : "https://evmrpc-testnet.0g.ai";
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
        });
        const data = await res.json();
        const hex = data?.result;
        if (hex) setBlockHeight(`#${parseInt(hex, 16).toLocaleString()}`);
      } catch {
        setBlockHeight("Unavailable");
      }
    }
    fetchBlockHeight();
    const interval = setInterval(fetchBlockHeight, 10000);
    return () => clearInterval(interval);
  }, []);

  // Use on-chain data if available, fall back to mock for demo
  const displayPolicies = onChainPolicies.length > 0 ? onChainPolicies : getMockPolicies();
  const activePoliciesCount = policyIds?.length ?? displayPolicies.filter((p) => p.status === "active").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Welcome back,{" "}
            <span className="gradient-text">
              {address ? `${address.slice(0, 6)}.0g` : "alice.0g"}
            </span>
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
          { label: "Protocol Policies", value: stats?.[0]?.toString() || "—", icon: "🌐", color: "var(--emerald)" },
          { label: "Claims Filed", value: stats?.[1]?.toString() || "—", icon: "📋", color: "var(--violet)" },
          {
            label: "Total Payouts",
            value: stats?.[3] ? `${Number(formatEther(stats[3])).toFixed(3)} 0G` : "—",
            icon: "⚡",
            color: "var(--amber)",
          },
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

      {displayPolicies.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
          <h3 style={{ color: "var(--text-secondary)", marginBottom: 8 }}>No policies yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>Buy your first policy to get protected.</p>
          <button className="btn btn-primary" onClick={onBuyNew}>Buy a Policy →</button>
        </div>
      ) : (
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
                <th>Storage CID</th>
              </tr>
            </thead>
            <tbody>
              {displayPolicies.map((p) => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}>
                        {p.id}
                      </span>
                    </td>
                    <td>{TYPE_LABELS[p.type] || p.type}</td>
                    <td><span style={{ color: "var(--emerald)", fontWeight: 600 }}>{p.coverage} 0G</span></td>
                    <td><span style={{ color: "var(--text-secondary)" }}>{p.premium} 0G</span></td>
                    <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {new Date(p.expiresAt).toLocaleDateString("en-US")}
                    </td>
                    <td>
                      {"storageCid" in p && p.storageCid ? (
                        <span className="hash-display" style={{ fontSize: 10, color: "var(--violet)" }}>
                          {shortHash(p.storageCid, 6)}
                        </span>
                      ) : p.txHash ? (
                        <a href={explorerTxUrl(p.txHash)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                          <span className="hash-display" style={{ fontSize: 10, cursor: "pointer" }}>
                            {shortHash(p.txHash, 6)} ↗
                          </span>
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Contract Info */}
      <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "var(--radius-md)" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Contract Info
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Contract: </span>
            {IS_CONTRACT_DEPLOYED ? (
              <a href={`https://chainscan-galileo.0g.ai/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <span className="hash-display" style={{ display: "inline", padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>
                  {shortHash(CONTRACT_ADDRESS, 6)} ↗
                </span>
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "var(--amber)" }}>Not deployed</span>
            )}
          </div>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Network: </span>
            <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}>
              {process.env.NEXT_PUBLIC_IS_MAINNET === "true" ? "0G Mainnet" : "0G Testnet"}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Block: </span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--violet)" }}>{blockHeight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
