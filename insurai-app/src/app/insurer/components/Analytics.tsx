"use client";

const MONTHLY_DATA = [
  { month: "Nov", policies: 45, claims: 3, revenue: 1200 },
  { month: "Dec", policies: 72, claims: 5, revenue: 1890 },
  { month: "Jan", policies: 130, claims: 8, revenue: 3240 },
  { month: "Feb", policies: 198, claims: 14, revenue: 5100 },
  { month: "Mar", policies: 312, claims: 22, revenue: 8240 },
  { month: "Apr", policies: 527, claims: 31, revenue: 14500 },
];

const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));
const maxPolicies = Math.max(...MONTHLY_DATA.map((d) => d.policies));

const DISTRIBUTION = [
  { label: "Flight Delay", percent: 65, color: "var(--cyan)" },
  { label: "Gadget Warranty", percent: 24, color: "var(--violet)" },
  { label: "Event Cancel", percent: 7, color: "var(--emerald)" },
  { label: "Travel Medical", percent: 4, color: "var(--amber)" },
];

const AI_METRICS = [
  { label: "Approval Rate", value: "78.3%", desc: "Claims auto-approved by AI" },
  { label: "Rejection Rate", value: "19.1%", desc: "Flagged as fraudulent by TEE" },
  { label: "Manual Review", value: "2.6%", desc: "Escalated to insurer" },
  { label: "Avg Confidence", value: "94.2%", desc: "AI decision score" },
];

export default function Analytics() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
        <p style={{ color: "var(--text-secondary)" }}>Platform performance metrics powered by onchain data.</p>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Monthly Revenue & Policy Growth</h3>
          <span className="badge badge-violet">Apr 2026 Best Month</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, paddingBottom: 8 }}>
          {MONTHLY_DATA.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                {/* Revenue bar */}
                <div
                  style={{
                    width: "40%",
                    height: `${(d.revenue / maxRevenue) * 130}px`,
                    background: "var(--gradient-main)",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    transition: "height 0.5s ease",
                    opacity: 0.85,
                  }}
                  title={`Revenue: $${d.revenue.toLocaleString()}`}
                />
                {/* Policies bar */}
                <div
                  style={{
                    width: "40%",
                    height: `${(d.policies / maxPolicies) * 130}px`,
                    background: "linear-gradient(to top, rgba(0,255,157,0.3), rgba(0,255,157,0.6))",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    border: "1px solid rgba(0,255,157,0.4)",
                  }}
                  title={`Policies: ${d.policies}`}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{d.month}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: "var(--gradient-main)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Revenue</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: "rgba(0,255,157,0.5)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Policies Issued</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Product Distribution */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Policy Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {DISTRIBUTION.map((d, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.percent}%</span>
                </div>
                <div className="progress-bar">
                  <div style={{ height: "100%", width: `${d.percent}%`, background: d.color, borderRadius: 2, transition: "width 0.6s ease", opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🧠 AI Model Performance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {AI_METRICS.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.desc}</div>
                </div>
                <div className="stat-value" style={{ fontSize: 20, color: "var(--cyan)" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        {[
          { label: "Unit Economics", value: "$10", desc: "Avg LTV per policy" },
          { label: "CAC", value: "$4.80", desc: "Customer acquisition cost" },
          { label: "Claims Speed", value: "4.8s", desc: "Avg TEE verification time" },
          { label: "Fraud Rate", value: "0.3%", desc: "Flagged fraudulent claims" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ fontSize: 28, color: "var(--violet)", marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
