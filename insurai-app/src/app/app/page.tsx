"use client";
import { useState } from "react";
import Link from "next/link";
import PolicyList from "./components/PolicyList";
import BuyPolicy from "./components/BuyPolicy";
import SubmitClaim from "./components/SubmitClaim";
import ClaimHistory from "./components/ClaimHistory";
import styles from "./app.module.css";

type Tab = "dashboard" | "buy" | "claim" | "history";

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "buy", icon: "🛡️", label: "Buy Policy" },
  { id: "claim", icon: "📋", label: "Submit Claim" },
  { id: "history", icon: "📜", label: "Claim History" },
];

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { address, isConnected } = useAccount();

  return (
    <div className="layout-sidebar">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogo}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }} className="gradient-text">
              InsurAI
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Consumer Portal</div>
          </div>
        </div>

        {/* Wallet */}
        <div className={styles.walletCard}>
          <div style={{ marginBottom: 16 }}>
             <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>
          
          {isConnected && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div className="dot-live" />
                <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}>Connected</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </>
          )}
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

        {/* 0G Integration Status */}
        <div className={styles.integrationPanel}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            0G Integration
          </div>
          {[
            { label: "0G Chain", status: "Live", color: "var(--emerald)" },
            { label: "0G Compute", status: "Ready", color: "var(--cyan)" },
            { label: "0G Storage", status: "Active", color: "var(--violet)" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.status}</span>
            </div>
          ))}
        </div>

        <Link href="/" style={{ display: "block", marginTop: 12 }}>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
            ← Back to Home
          </button>
        </Link>
      </aside>

      {/* Main */}
      <main className="main-content">
        {activeTab === "dashboard" && <PolicyList onBuyNew={() => setActiveTab("buy")} onSubmitClaim={() => setActiveTab("claim")} />}
        {activeTab === "buy" && <BuyPolicy onSuccess={() => setActiveTab("dashboard")} />}
        {activeTab === "claim" && <SubmitClaim onSuccess={() => setActiveTab("history")} />}
        {activeTab === "history" && <ClaimHistory />}
      </main>
    </div>
  );
}
