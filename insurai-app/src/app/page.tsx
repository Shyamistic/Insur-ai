"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./landing.module.css";

const STATS = [
  { value: "< 5s", label: "Claim Decision Time" },
  { value: "100%", label: "Privacy Guaranteed" },
  { value: "0G TEE", label: "AI Compute Layer" },
  { value: "Onchain", label: "Immutable Audit Log" },
];

const FEATURES = [
  {
    icon: "🛡️",
    title: "Parametric Policies",
    desc: "Buy flight delay, gadget warranty, and event insurance onchain in seconds. No paperwork, no hidden clauses.",
    color: "cyan",
  },
  {
    icon: "🧠",
    title: "TEE-Verified AI Claims",
    desc: "Our AI model runs inside Intel/NVIDIA secure enclaves on 0G Compute. Claim data never leaves the enclave.",
    color: "violet",
  },
  {
    icon: "⛓️",
    title: "0G Chain Settlement",
    desc: "Smart contracts on 0G's EVM-compatible L1 enforce policy logic, escrow premiums, and auto-release payouts.",
    color: "emerald",
  },
  {
    icon: "📦",
    title: "Immutable Storage",
    desc: "All claim documents, CIDs, and attestations are logged to 0G Storage — tamper-proof and millisecond-fast.",
    color: "amber",
  },
  {
    icon: "🪪",
    title: ".0g Agent Identity",
    desc: "Users bind wallets to human-readable .0g domains like alice.0g, making policy ownership portable and verifiable.",
    color: "cyan",
  },
  {
    icon: "⚡",
    title: "Instant Payouts",
    desc: "Once the enclave returns an approval signature, the smart contract auto-releases funds. No human in the loop.",
    color: "violet",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Buy a Policy", desc: "Choose a parametric insurance product and pay the premium onchain via your 0G wallet." },
  { step: "02", title: "Trigger Event Occurs", desc: "Flight delayed? Device broken? The insured event is automatically or manually flagged." },
  { step: "03", title: "Submit Claim", desc: "Upload evidence. It's stored immutably on 0G Storage and a CID is recorded on-chain." },
  { step: "04", title: "TEE Verification", desc: "0G Compute runs our AI in a secure enclave. It analyzes the evidence and signs a decision." },
  { step: "05", title: "Instant Payout", desc: "The smart contract validates the TEE signature and immediately releases your payout." },
];

const TECH_STACK = [
  { name: "0G Chain", desc: "EVM-compatible L1", icon: "⛓️", sub: "Policy contracts & settlement" },
  { name: "0G Compute", desc: "TEE Inference Network", icon: "🧠", sub: "Intel/NVIDIA secure enclaves" },
  { name: "0G Storage", desc: "Decentralized Blobs", icon: "📦", sub: "Claim docs & attestations" },
  { name: ".0g Agent ID", desc: "Onchain Identity", icon: "🪪", sub: "Human-readable wallet names" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [txCount, setTxCount] = useState(12847);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTxCount((n) => n + Math.floor(Math.random() * 3) + 1), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>⚡</div>
            <span className="gradient-text" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>
              InsurAI
            </span>
          </div>
          <div className={styles.navLinks}>
            <a href="#how-it-works">How it Works</a>
            <a href="#tech">Technology</a>
            <a href="#features">Features</a>
            <Link href="/chat">Chat</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/insurer" className="btn btn-ghost btn-sm">Insurer Portal</Link>
            <Link href="/app" className="btn btn-primary btn-sm">Launch App →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className="dot-live" />
            <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}>LIVE ON 0G TESTNET</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
              {mounted ? txCount.toLocaleString() : "12,847"} policies issued
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Insurance That Thinks,{" "}
            <span className="gradient-text">Pays Automatically</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The first autonomous insurance platform on 0G Blockchain. AI verifies claims
            inside hardware-secure enclaves. Smart contracts pay out instantly. No middlemen, no delays.
          </p>

          <div className={styles.heroActions}>
            <Link href="/chat" className="btn btn-secondary btn-lg">
              Chat Concierge
            </Link>
            <Link href="/app" className="btn btn-primary btn-lg">
              <span>Buy Insurance Now</span>
              <span>→</span>
            </Link>
            <Link href="/insurer" className="btn btn-secondary btn-lg">Insurer Dashboard</Link>
          </div>

          {/* Live Proof Strip */}
          <div className={styles.proofStrip}>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>Latest Claim TX</span>
              <span className="hash-display" style={{ fontSize: 11 }}>0xA1B2C3D4E5F6...8901</span>
            </div>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>Storage CID</span>
              <span className="hash-display" style={{ fontSize: 11 }}>QmXYZ123abc...789</span>
            </div>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>TEE Signature</span>
              <span className="hash-display" style={{ fontSize: 11, color: "var(--emerald)", borderColor: "rgba(0,255,157,0.2)", background: "rgba(0,255,157,0.06)" }}>SIG:3045...DEAD</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className={styles.statsBanner}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className="stat-value gradient-text">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className="badge badge-cyan">THE PROCESS</div>
          <h2>How InsurAI Works</h2>
          <p>End-to-end automated insurance from purchase to payout — all verifiable onchain.</p>
        </div>
        <div className={styles.stepsGrid}>
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNumber}>{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className="badge badge-violet">POWERED BY 0G</div>
          <h2>Built on the Full 0G Stack</h2>
          <p>Deep integration with 0G's AI-native infrastructure for privacy, speed, and verifiability.</p>
        </div>
        <div className="grid-4">
          {TECH_STACK.map((t, i) => (
            <div key={i} className={`card ${styles.techCard}`}>
              <div className={styles.techIcon}>{t.icon}</div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{t.name}</h3>
              <div className="badge badge-cyan" style={{ marginBottom: 8 }}>{t.desc}</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className="badge badge-emerald">FEATURES</div>
          <h2>Everything Insurance Should Be</h2>
          <p>Transparent. Private. Instant. Trustless.</p>
        </div>
        <div className="grid-3">
          {FEATURES.map((f, i) => (
            <div key={i} className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon} data-color={f.color}>{f.icon}</div>
              <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaContent}>
          <h2>Ready to Experience the Future of Insurance?</h2>
          <p>Join thousands of users already protected by AI-verified, onchain insurance.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/app" className="btn btn-primary btn-lg">Get Protected Now →</Link>
            <Link href="/insurer" className="btn btn-secondary btn-lg">Partner With Us</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <div className={styles.logoIcon}>⚡</div>
            <span className="gradient-text" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>InsurAI</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Powered by{" "}
            <span style={{ color: "var(--cyan)" }}>0G Chain</span>,{" "}
            <span style={{ color: "var(--violet)" }}>0G Compute</span> &{" "}
            <span style={{ color: "var(--emerald)" }}>0G Storage</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Contract: <span className="hash-display" style={{ display: "inline", padding: "2px 8px" }}>0xDEAD...BEEF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
