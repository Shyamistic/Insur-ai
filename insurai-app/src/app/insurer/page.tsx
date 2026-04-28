"use client";
import { useState } from "react";
import Link from "next/link";
import InsurerDashboard from "./components/InsurerDashboard";
import PolicyManagement from "./components/PolicyManagement";
import ClaimReview from "./components/ClaimReview";
import Analytics from "./components/Analytics";
import styles from "./insurer.module.css";

type Tab = "dashboard" | "policies" | "claims" | "analytics";

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "policies", icon: "📋", label: "Policy Management" },
  { id: "claims", icon: "🔍", label: "Claim Review" },
  { id: "analytics", icon: "📈", label: "Analytics" },
];

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function InsurerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { address, isConnected } = useAccount();

  return (
    <div className="layout-sidebar">
      <aside className="sidebar">
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogo}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }} className="gradient-text">
              InsurAI
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Insurer Portal</div>
          </div>
        </div>

        {/* Identity */}
        <div className={styles.insurerCard}>
          <div style={{ marginBottom: 16 }}>
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>
          
          {isConnected && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div className="dot-live" />
                <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>Insurer Live</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </>
          )}
        </div>

        <div className="divider" />

        {/* Fund Status */}
        <div className={styles.fundCard}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Pool Balance
          </div>
          <div className="stat-value" style={{ fontSize: 28, color: "var(--emerald)" }}>$142,500</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Available for payouts</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: "71%" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>$142.5K used</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>$200K total</span>
          </div>
        </div>

        <div className="divider" />

        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="divider" />

        <div className={styles.integrationPanel}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            0G Network
          </div>
          {[
            { label: "0G Chain", status: "Live", color: "var(--emerald)" },
            { label: "TEE Nodes", status: "12 Active", color: "var(--cyan)" },
            { label: "Storage", status: "∞", color: "var(--violet)" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.status}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <Link href="/app">
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Consumer App</button>
          </Link>
          <Link href="/">
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>← Home</button>
          </Link>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === "dashboard" && <InsurerDashboard />}
        {activeTab === "policies" && <PolicyManagement />}
        {activeTab === "claims" && <ClaimReview />}
        {activeTab === "analytics" && <Analytics />}
      </main>
    </div>
  );
}
