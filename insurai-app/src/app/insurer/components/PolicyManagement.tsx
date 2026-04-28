"use client";

const POLICY_TEMPLATES = [
  { id: "TMPL-001", name: "Flight Delay Shield", type: "flight_delay", active: true, policies: 847, revenue: "$8,470", payout: "$12,300", loss: "17.3%" },
  { id: "TMPL-002", name: "Gadget Warranty Plus", type: "gadget_warranty", active: true, policies: 312, revenue: "$14,040", payout: "$8,200", loss: "12.8%" },
  { id: "TMPL-003", name: "Event Cancellation", type: "event_cancellation", active: false, policies: 89, revenue: "$1,068", payout: "$450", loss: "9.2%" },
  { id: "TMPL-004", name: "Travel Medical Guard", type: "travel_medical", active: true, policies: 36, revenue: "$4,860", payout: "$0", loss: "0%" },
];

const PRODUCT_ICONS: Record<string, string> = {
  flight_delay: "✈️",
  gadget_warranty: "📱",
  event_cancellation: "🎫",
  travel_medical: "🏥",
};

export default function PolicyManagement() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Policy Management</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage your insurance products, pricing, and performance.</p>
        </div>
        <button className="btn btn-primary btn-sm">+ New Product</button>
      </div>

      {/* Performance Summary */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: "Total Products", value: "4", color: "var(--cyan)" },
          { label: "Total Policies", value: "1,284", color: "var(--emerald)" },
          { label: "Total Revenue", value: "$28.4K", color: "var(--violet)" },
          { label: "Avg Loss Ratio", value: "13.1%", color: "var(--amber)" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: s.color, marginBottom: 4, fontSize: 28 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Product Table */}
      <div className="table-wrapper" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Policies Issued</th>
              <th>Revenue</th>
              <th>Claims Paid</th>
              <th>Loss Ratio</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {POLICY_TEMPLATES.map((tmpl) => (
              <tr key={tmpl.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{PRODUCT_ICONS[tmpl.type]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tmpl.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{tmpl.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${tmpl.active ? "badge-emerald" : "badge-amber"}`}>
                    {tmpl.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{tmpl.policies.toLocaleString()}</td>
                <td style={{ color: "var(--emerald)", fontWeight: 600 }}>{tmpl.revenue}</td>
                <td style={{ color: "var(--rose)", fontWeight: 600 }}>{tmpl.payout}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: parseFloat(tmpl.loss) < 15 ? "var(--emerald)" : "var(--amber)" }}>
                      {tmpl.loss}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                    <button className={`btn btn-sm ${tmpl.active ? "btn-danger" : "btn-success"}`}>
                      {tmpl.active ? "Pause" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract Info */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Smart Contract</h3>
          <span className="badge badge-emerald">Verified on 0G Chain</span>
        </div>
        <div className="grid-2" style={{ gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Contract Address
            </div>
            <div className="hash-display" style={{ fontSize: 12 }}>0xDEADBEEF12345678901234567890abcdef123456</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Network
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 600 }}>0G Testnet</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Block #4,829,156</span>
              <span style={{ fontSize: 13, color: "var(--cyan)", cursor: "pointer" }}>View on Chainscan →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
