"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./landing.module.css";

/* ──────────────────────────── Iconography ──────────────────────────── */
/* Custom 1.5-stroke line icons. No emoji, no clip-art. */
const Icon = {
  Bolt: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Arrow: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Shield: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3 5 6v6c0 4.5 3 8.5 7 9 4-.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Cpu: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  ),
  Chain: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5" />
    </svg>
  ),
  Box: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  ),
  Badge: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M14 9h4M14 13h3M5 17.5C6 16 8 15 9 15s3 1 4 2.5" />
    </svg>
  ),
  Lightning: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Globe: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  Cart: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 4h2l2.5 12h11L21 8H6" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  ),
  AlertTriangle: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 4 2 20h20L12 4Z" />
      <path d="M12 10v5M12 18v.5" />
    </svg>
  ),
  FileText: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  Lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  Check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m5 12 5 5 9-11" />
    </svg>
  ),
  Plane: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M16 4 8 12l-4-1-2 2 6 3 3 6 2-2-1-4 8-8c1.5-1.5 0-3-1-3-.5 0-1 .2-1.4.6L16 4Z" />
    </svg>
  ),
  Clock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Sparkle: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}>
      <path d="M12 2c.4 4 2 5.6 6 6-4 .4-5.6 2-6 6-.4-4-2-5.6-6-6 4-.4 5.6-2 6-6Z" />
    </svg>
  ),
};

/* ──────────────────────────── Data ──────────────────────────── */

const STATS = [
  { value: "4.2s", label: "Median claim decision", mono: true },
  { value: "100%", label: "Onchain audit coverage", mono: false },
  { value: "0G TEE", label: "Compute attestation layer", mono: false },
  { value: "0", label: "Human reviewers in the loop", mono: true },
];

const HOW_IT_WORKS = [
  { n: "01", title: "Buy a policy", icon: <Icon.Cart />, desc: "Pick a parametric product and pay the premium from your 0G wallet. Settlement is immediate." },
  { n: "02", title: "Trigger occurs", icon: <Icon.AlertTriangle />, desc: "An insurable event happens — a flight is delayed, a device fails, a sensor crosses a threshold." },
  { n: "03", title: "Submit evidence", icon: <Icon.FileText />, desc: "Upload supporting documents. They're pinned to 0G Storage; the CID is committed onchain." },
  { n: "04", title: "TEE inference", icon: <Icon.Cpu />, desc: "Our model runs inside a 0G Compute enclave. The signed verdict never exposes private data." },
  { n: "05", title: "Instant payout", icon: <Icon.Lightning />, desc: "The contract validates the TEE signature and releases funds in the same block — no escrow desk." },
];

const TECH_STACK = [
  { name: "0G Chain", desc: "EVM-Compatible L1", icon: <Icon.Chain />, sub: "Policy contracts, premium escrow, settlement.", tone: "indigo" },
  { name: "0G Compute", desc: "TEE Inference Network", icon: <Icon.Cpu />, sub: "Intel TDX and NVIDIA H100 secure enclaves.", tone: "plum" },
  { name: "0G Storage", desc: "Decentralized Blobs", icon: <Icon.Box />, sub: "Claim documents and attestations, content-addressed.", tone: "rust" },
  { name: ".0g Agent ID", desc: "Onchain Identity", icon: <Icon.Badge />, sub: "Human-readable wallet handles for policy owners.", tone: "moss" },
];

const FEATURES = [
  { icon: <Icon.Shield />,     title: "Parametric policies",        desc: "Flight delay, device coverage, event cancellation — written in code, not in 40 pages of fine print.", tone: "indigo", size: "wide" },
  { icon: <Icon.Lock />,       title: "Private by construction",    desc: "Personal data is decrypted only inside the TEE. The host can't see it. We can't see it. Neither can your insurer.", tone: "plum",   size: "default" },
  { icon: <Icon.Cpu />,        title: "AI verdicts you can audit",  desc: "Every model decision ships with a hardware attestation and a deterministic input hash. Verifiable from chain.", tone: "moss",   size: "default" },
  { icon: <Icon.Chain />,      title: "Onchain settlement",         desc: "Premiums and payouts move through audited contracts on 0G's EVM L1.", tone: "indigo", size: "default" },
  { icon: <Icon.Badge />,      title: ".0g identity",               desc: "Bind your policies to a name like alice.0g. Portable. Resolvable. Revocable.", tone: "rust",   size: "default" },
  { icon: <Icon.Lightning />,  title: "Same-block payout",          desc: "From verdict to wallet in one block — no escrow desk, no Friday-afternoon banker.", tone: "moss",   size: "wide" },
];

/* ──────────────────────────── Page ──────────────────────────── */

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [policyCount, setPolicyCount] = useState(12940);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(
      () => setPolicyCount((n) => n + Math.floor(Math.random() * 3) + 1),
      2200
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.page}>
      {/* ─── Nav ─── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} aria-label="InsurAI home">
            <div className={styles.logoMark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 5 6v6c0 4.5 3 8.5 7 9 4-.5 7-4.5 7-9V6l-7-3Z" />
              </svg>
            </div>
            <span className={styles.logoWord}>InsurAI</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#how">How it works</a>
            <a href="#tech">Infrastructure</a>
            <a href="#features">Features</a>
            <Link href="/demo">Live demo</Link>
            <Link href="/chat">Support</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/insurer" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/app" className="btn btn-primary btn-sm">
              Get coverage <Icon.Arrow />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroMesh} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowDot} />
              <span><span className={styles.heroEyebrowStrong}>Live</span> on 0G testnet</span>
              <span className={styles.heroEyebrowDivider} />
              <span className="mono">{(mounted ? policyCount : 12940).toLocaleString()} policies</span>
            </div>

            <h1 className={styles.heroTitle}>
              Insurance that <span className={styles.heroTitleAccent}>settles itself.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              InsurAI writes parametric policies onchain, verifies claims inside hardware-secure
              enclaves, and pays out in the same block. No adjusters. No paperwork.
              No three-business-day waits.
            </p>

            <div className={styles.heroActions}>
              <Link href="/app" className="btn btn-primary btn-lg">
                Buy your first policy <Icon.Arrow />
              </Link>
              <Link href="/demo" className="btn btn-secondary btn-lg">
                See it pay a claim
              </Link>
            </div>

            <div className={styles.heroTrust}>
              <div className={styles.heroTrustLabel}>Audited and attested by</div>
              <div className={styles.heroTrustRow}>
                <span className={styles.heroTrustItem}><Icon.Lock /> Intel TDX</span>
                <span className={styles.heroTrustItem}><Icon.Cpu /> NVIDIA H100</span>
                <span className={styles.heroTrustItem}><Icon.Chain /> 0G Chain</span>
                <span className={styles.heroTrustItem}><Icon.Box /> 0G Storage</span>
              </div>
            </div>
          </div>

          {/* ─── Policy Receipt (hero centerpiece) ─── */}
          <div className={styles.heroVisual}>
            <article className={styles.receipt} aria-label="Sample parametric policy receipt">
              <header className={styles.receiptHeader}>
                <div className={styles.receiptBrand}>
                  <span className={styles.receiptBrandDot}>
                    <Icon.Shield width="11" height="11" stroke="currentColor" strokeWidth="2" />
                  </span>
                  InsurAI
                </div>
                <div className={styles.receiptId}>
                  <strong>FD-2026-A14B</strong>
                  Issued 2026-05-11
                </div>
              </header>

              <div className={styles.receiptTitle}>Flight Delay Cover</div>

              <div className={styles.receiptRoute}>
                <div className={styles.receiptRouteAirport}>LHR</div>
                <div className={styles.receiptRouteLine}>
                  <Icon.Plane width="14" height="14" />
                </div>
                <div className={styles.receiptRouteAirport}>JFK</div>
              </div>

              <div className={styles.receiptGrid}>
                <div className={styles.receiptCell}>
                  <span className={styles.receiptCellLabel}>Premium</span>
                  <span className={styles.receiptCellValue}>$12.40</span>
                </div>
                <div className={styles.receiptCell}>
                  <span className={styles.receiptCellLabel}>Max payout</span>
                  <span className={styles.receiptCellValue}>$400.00</span>
                </div>
                <div className={styles.receiptCell}>
                  <span className={styles.receiptCellLabel}>Trigger</span>
                  <span className={styles.receiptCellValue}>Delay ≥ 2h</span>
                </div>
                <div className={styles.receiptCell}>
                  <span className={styles.receiptCellLabel}>Policy</span>
                  <span className={styles.receiptCellValue}>0xA1B2…8901</span>
                </div>
              </div>

              <div className={styles.receiptDivider} aria-hidden="true" />

              <div className={styles.receiptEventLabel}>Trigger event</div>
              <div className={styles.receiptEvent}>
                <span className={styles.receiptEventIcon}><Icon.Clock width="16" height="16" /></span>
                <span className={styles.receiptEventText}>
                  Flight delayed <strong>3h 14m</strong> — confirmed via FAA feed
                </span>
              </div>

              <div className={styles.receiptVerify}>
                <span className={styles.receiptVerifyDot} />
                TEE attested · sig 3045…dead · 2.1s
              </div>

              <div className={styles.receiptPayout}>
                <div className={styles.receiptPayoutLabel}>
                  Status
                  <strong>Paid · same block</strong>
                </div>
                <div className={styles.receiptPayoutAmount}>
                  <span>$</span>237.00
                </div>
              </div>
            </article>

            <div className={styles.receiptSideCard} aria-hidden="true">
              <div className={styles.receiptSideCardAvatar}>A</div>
              <div className={styles.receiptSideCardText}>
                <strong>alice.0g</strong>
                received $237.00
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust band ─── */}
      <section className={styles.trustBand}>
        <div className={styles.trustBandInner}>
          <div className={styles.trustBandLabel}>Built on the full 0G stack</div>
          <div className={styles.trustBandLogos}>
            <span><Icon.Chain /> 0G Chain</span>
            <span><Icon.Cpu /> 0G Compute</span>
            <span><Icon.Box /> 0G Storage</span>
            <span><Icon.Badge /> .0g Agent ID</span>
            <span><Icon.Lock /> Intel TDX</span>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className={styles.statsBanner}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className={`${styles.statValue} ${s.mono ? styles.statValueMono : ""}`}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionEyebrow}>How it works</div>
            <h2 className={styles.sectionTitle}>From premium to payout, in five steps.</h2>
          </div>
          <p className={styles.sectionLead}>
            Every InsurAI policy is a deterministic program. The trigger condition is encoded in
            Solidity. The verdict is signed by a remote-attested enclave. The payout is on chain.
            Read the <a href="#tech">contract source →</a>
          </p>
        </header>

        <div className={styles.howGrid}>
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className={styles.howStep}>
              <span className={styles.howStepNumber}>{s.n}</span>
              <div className={styles.howStepIcon}>{s.icon}</div>
              <div className={styles.howStepTitle}>{s.title}</div>
              <p className={styles.howStepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech stack ─── */}
      <section id="tech" className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionEyebrow}>Infrastructure</div>
            <h2 className={styles.sectionTitle}>Four primitives. One coherent system.</h2>
          </div>
          <p className={styles.sectionLead}>
            We didn't bolt AI onto a traditional insurance backend. We rebuilt every layer on
            0G's AI-native infrastructure so that privacy, speed, and verifiability are
            structural — not promises.
          </p>
        </header>

        <div className={styles.techGrid}>
          {TECH_STACK.map((t) => (
            <div key={t.name} className={styles.techCard} data-tone={t.tone}>
              <div className={styles.techIcon}>{t.icon}</div>
              <div>
                <div className={styles.techName}>{t.name}</div>
                <div className={styles.techDesc}>{t.desc}</div>
              </div>
              <p className={styles.techSub}>{t.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features (editorial mix) ─── */}
      <section id="features" className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionEyebrow}>Features</div>
            <h2 className={styles.sectionTitle}>What you get when insurance is just software.</h2>
          </div>
          <p className={styles.sectionLead}>
            No call centers. No fine print written by adversaries. No claim-handler discretion.
            Just programs that run, signatures you can verify, and payouts that arrive when
            the contract says they will.
          </p>
        </header>

        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <article key={f.title} className={styles.featureCard} data-tone={f.tone} data-size={f.size}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Quote / metric block ─── */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.quoteBlock}>
          <div>
            <p className={styles.quoteText}>
              <em>“Eight seconds from delay confirmation to my wallet.</em> I checked the
              block explorer twice because I couldn't believe the payout had already
              landed.”
            </p>
            <div className={styles.quoteAttr}>
              <div>
                <strong>Maya Chen</strong>
                Flight delay claimant · alice.0g
              </div>
            </div>
          </div>
          <div className={styles.quoteMeta}>
            <div className={styles.quoteMetric}>
              <div className={styles.quoteMetricValue}>$1.84M</div>
              <div className={styles.quoteMetricLabel}>Paid out to policyholders</div>
            </div>
            <div className={styles.quoteMetric}>
              <div className={styles.quoteMetricValue}>99.4%</div>
              <div className={styles.quoteMetricLabel}>Claims auto-settled without review</div>
            </div>
            <div className={styles.quoteMetric}>
              <div className={styles.quoteMetricValue}>4.2s</div>
              <div className={styles.quoteMetricLabel}>Median verdict to payout</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Coverage in 30 seconds. Payouts in a block.</h2>
            <p className={styles.ctaLead}>
              Connect a wallet, pick a parametric product, and you're insured. No forms,
              no calls, no quotes that expire on Monday.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/app" className="btn btn-primary btn-lg">
              Buy a policy <Icon.Arrow />
            </Link>
            <Link href="/insurer" className="btn btn-secondary btn-lg">
              Underwrite with us
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogoBlock}>
            <Link href="/" className={styles.logo} aria-label="InsurAI home">
              <div className={styles.logoMark}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 5 6v6c0 4.5 3 8.5 7 9 4-.5 7-4.5 7-9V6l-7-3Z" />
                </svg>
              </div>
              <span className={styles.logoWord}>InsurAI</span>
            </Link>
            <p className={styles.footerTagline}>
              Autonomous, parametric, onchain insurance — verified by hardware, settled by code.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Product</h4>
            <Link href="/app">Buy coverage</Link>
            <Link href="/demo">Live demo</Link>
            <Link href="/chat">Support</Link>
            <Link href="/insurer">Insurer portal</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Infrastructure</h4>
            <a href="#tech">0G Chain</a>
            <a href="#tech">0G Compute</a>
            <a href="#tech">0G Storage</a>
            <a href="#tech">.0g Agent ID</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Resources</h4>
            <a href="https://0g.ai" target="_blank" rel="noopener noreferrer">0G docs</a>
            <a href="#features">Audit reports</a>
            <a href="#how">Whitepaper</a>
            <a href="#how">Status</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 InsurAI Labs · Built on 0G</span>
          <span className={styles.footerContract}>
            Contract <span className="hash-display" style={{ display: "inline" }}>0xDEAD…BEEF</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
