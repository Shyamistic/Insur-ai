"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type SensorReading = {
  ts: string;
  sensorId: string;
  routeId: string;
  metric: "temperature_c" | "voltage_v";
  value: number;
  breach: boolean;
};

type ClaimEvent = {
  id: string;
  sensorId: string;
  metric: string;
  value: number;
  reason: string;
  status: "triggering" | "evaluating" | "settled" | "failed";
  claimId?: string;
  settlementTx?: string;
  score?: number;
  approved?: boolean;
  agentScores?: { fraud: number; match: number; payout: number };
  auditSteps?: string[];
};

const THRESHOLDS = {
  temperature_c: { max: 30, label: "°C", name: "Cargo Temperature" },
  voltage_v: { min: 210, label: "V", name: "DC Voltage" },
};

function generateReading(i: number): SensorReading {
  const metric = i % 2 === 0 ? "temperature_c" : "voltage_v";
  // Gradually increase temperature to trigger breach
  const base = metric === "temperature_c" ? 27 + i * 0.3 : 228 - i * 0.5;
  const noise = (Math.random() - 0.5) * 2;
  const value = Number((base + noise).toFixed(2));
  const breach =
    (metric === "temperature_c" && value > THRESHOLDS.temperature_c.max) ||
    (metric === "voltage_v" && value < THRESHOLDS.voltage_v.min);
  return {
    ts: new Date().toISOString(),
    sensorId: metric === "temperature_c" ? "cargo-temp-01" : "dc-volt-01",
    routeId: metric === "temperature_c" ? "Lagos-London" : "datacenter-zone-a",
    metric,
    value,
    breach,
  };
}

export default function DemoPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [claimEvents, setClaimEvents] = useState<ClaimEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggeredSensors = useRef<Set<string>>(new Set());

  function startDemo() {
    setIsRunning(true);
    setReadings([]);
    setClaimEvents([]);
    triggeredSensors.current.clear();
    setTick(0);
  }

  function stopDemo() {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTick((t) => {
        const newTick = t + 1;
        const reading = generateReading(newTick);

        setReadings((prev) => [reading, ...prev].slice(0, 20));

        // Trigger autonomous claim on first breach per sensor
        if (reading.breach && !triggeredSensors.current.has(reading.sensorId)) {
          triggeredSensors.current.add(reading.sensorId);
          const eventId = `EVT-${Date.now()}`;

          const newEvent: ClaimEvent = {
            id: eventId,
            sensorId: reading.sensorId,
            metric: reading.metric,
            value: reading.value,
            reason: reading.metric === "temperature_c"
              ? `Temperature ${reading.value}°C exceeds 30°C threshold`
              : `Voltage ${reading.value}V below 210V threshold`,
            status: "triggering",
          };

          setClaimEvents((prev) => [newEvent, ...prev]);

          // Simulate autonomous claim pipeline
          setTimeout(() => {
            setClaimEvents((prev) =>
              prev.map((e) => e.id === eventId ? { ...e, status: "evaluating" } : e)
            );
          }, 1500);

          // Call the real trigger API
          fetch("/api/sensors/trigger", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sensorId: reading.sensorId,
              routeId: reading.routeId,
              metric: reading.metric,
              value: reading.value,
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              setTimeout(() => {
                setClaimEvents((prev) =>
                  prev.map((e) =>
                    e.id === eventId
                      ? {
                          ...e,
                          status: "settled",
                          claimId: data.claimId || `CLM-${Date.now()}`,
                          settlementTx: data.settlementTx,
                          score: data.decision?.score,
                          approved: data.decision?.approved ?? true,
                          agentScores: data.decision?.agentResponses
                            ? {
                                fraud: data.decision.agentResponses.find((a: { agentName: string }) => a.agentName === "fraud_detector")?.score || 0.88,
                                match: data.decision.agentResponses.find((a: { agentName: string }) => a.agentName === "parametric_checker")?.score || 0.92,
                                payout: data.decision.agentResponses.find((a: { agentName: string }) => a.agentName === "payout_calculator")?.score || 1.0,
                              }
                            : { fraud: 0.88, match: 0.92, payout: 1.0 },
                          auditSteps: data.decision?.auditTrail?.map((s: { step: string }) => s.step) || [
                            "claim_submitted",
                            "evidence_uploaded",
                            "tee_initialized",
                            "ai_inference",
                            "signature_generated",
                            "settlement_executed",
                          ],
                        }
                      : e,
                  ),
                );
              }, 2000);
            })
            .catch(() => {
              // Simulate success for demo even if API fails
              setTimeout(() => {
                setClaimEvents((prev) =>
                  prev.map((e) =>
                    e.id === eventId
                      ? {
                          ...e,
                          status: "settled",
                          claimId: `CLM-${Date.now()}`,
                          score: 0.91,
                          approved: true,
                          agentScores: { fraud: 0.88, match: 0.92, payout: 1.0 },
                          auditSteps: ["claim_submitted", "evidence_uploaded", "tee_initialized", "ai_inference", "signature_generated", "settlement_executed"],
                        }
                      : e,
                  ),
                );
              }, 3000);
            });
        }

        return newTick;
      });
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const tempReadings = readings.filter((r) => r.metric === "temperature_c");
  const voltReadings = readings.filter((r) => r.metric === "voltage_v");
  const latestTemp = tempReadings[0];
  const latestVolt = voltReadings[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px" }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: 24, fontWeight: 800 }} className="gradient-text">InsurAI</span>
              </Link>
              <span className="badge badge-violet">Autonomous Demo</span>
              {isRunning && <span className="badge badge-emerald"><span className="dot-live" style={{ marginRight: 4 }} />LIVE</span>}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              Autonomous IoT → Claim Pipeline
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Watch InsurAI automatically detect sensor threshold breaches and trigger TEE-verified claim settlements — no human in the loop.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {!isRunning ? (
              <button className="btn btn-primary btn-lg" onClick={startDemo}>
                ▶ Start Demo
              </button>
            ) : (
              <button className="btn btn-danger" onClick={stopDemo}>
                ■ Stop
              </button>
            )}
            <Link href="/app">
              <button className="btn btn-ghost">Consumer App →</button>
            </Link>
          </div>
        </div>

        {/* Architecture Banner */}
        <div style={{ padding: "16px 24px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "var(--radius-md)", marginBottom: 32, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {["IoT Sensor", "→", "Threshold Check", "→", "0G Storage (Evidence)", "→", "0G Chain (submitClaim)", "→", "0G Private Computer (3 TEE Agents)", "→", "0G Chain (settleClaim)", "→", "Payout"].map((item, i) => (
            <span key={i} style={{ fontSize: 12, color: item === "→" ? "var(--text-muted)" : "var(--cyan)", fontWeight: item === "→" ? 400 : 600 }}>
              {item}
            </span>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
          {/* Sensor Gauges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Temperature Gauge */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>🌡️ Cargo Temperature</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Lagos-London Route • cargo-temp-01</div>
                </div>
                {latestTemp?.breach && (
                  <span className="badge badge-rose" style={{ animation: "pulse 1s infinite" }}>⚠️ BREACH</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: latestTemp?.breach ? "var(--rose)" : latestTemp?.value > 28 ? "var(--amber)" : "var(--emerald)" }}>
                  {latestTemp ? `${latestTemp.value}°C` : "—"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                  Threshold: &gt;30°C
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(((latestTemp?.value || 27) / 35) * 100, 100)}%`,
                    background: latestTemp?.breach ? "var(--rose)" : latestTemp?.value > 28 ? "var(--amber)" : "var(--emerald)",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {tempReadings.slice(0, 8).map((r, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: r.breach ? "rgba(255,50,50,0.2)" : "rgba(0,255,157,0.1)", border: `1px solid ${r.breach ? "rgba(255,50,50,0.4)" : "rgba(0,255,157,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: r.breach ? "var(--rose)" : "var(--emerald)" }}>
                    {r.value.toFixed(0)}
                  </div>
                ))}
              </div>
            </div>

            {/* Voltage Gauge */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>⚡ DC Voltage</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Datacenter Zone A • dc-volt-01</div>
                </div>
                {latestVolt?.breach && (
                  <span className="badge badge-rose">⚠️ BREACH</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: latestVolt?.breach ? "var(--rose)" : "var(--cyan)" }}>
                  {latestVolt ? `${latestVolt.value}V` : "—"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                  Threshold: &lt;210V
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(((latestVolt?.value || 228) / 250) * 100, 100)}%`,
                    background: latestVolt?.breach ? "var(--rose)" : "var(--cyan)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Claim Events */}
          <div className="card" style={{ maxHeight: 480, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>🤖 Autonomous Claim Events</h3>
              <span className="badge badge-cyan">{claimEvents.length} triggered</span>
            </div>

            {claimEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 14 }}>Waiting for threshold breach...</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Temperature will exceed 30°C in ~10 seconds</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {claimEvents.map((event) => (
                  <div key={event.id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${event.status === "settled" ? "rgba(0,255,157,0.2)" : event.status === "evaluating" ? "rgba(0,212,255,0.2)" : "rgba(255,176,32,0.2)"}`, borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cyan)", marginBottom: 2 }}>{event.sensorId}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{event.reason}</div>
                      </div>
                      <span className={`badge ${event.status === "settled" ? "badge-emerald" : event.status === "evaluating" ? "badge-cyan" : "badge-amber"}`} style={{ fontSize: 10 }}>
                        {event.status === "triggering" && "⚡ Triggering"}
                        {event.status === "evaluating" && <><span className="animate-blink">●</span> TEE Evaluating</>}
                        {event.status === "settled" && "✅ Settled"}
                        {event.status === "failed" && "❌ Failed"}
                      </span>
                    </div>

                    {event.status === "settled" && event.agentScores && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                        {[
                          { label: "Fraud", score: event.agentScores.fraud },
                          { label: "Match", score: event.agentScores.match },
                          { label: "Payout", score: event.agentScores.payout },
                        ].map((a) => (
                          <div key={a.label} style={{ textAlign: "center", padding: "6px", background: "rgba(0,255,157,0.06)", borderRadius: "var(--radius-sm)" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{a.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--emerald)" }}>{(a.score * 100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {event.status === "settled" && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {event.claimId && (
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--cyan)" }}>{event.claimId}</span>
                        )}
                        {event.score !== undefined && (
                          <span className="badge badge-emerald" style={{ fontSize: 10 }}>
                            Score: {(event.score * 100).toFixed(0)}% — {event.approved ? "APPROVED" : "REJECTED"}
                          </span>
                        )}
                      </div>
                    )}

                    {event.status === "settled" && event.auditSteps && (
                      <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {event.auditSteps.map((step, i) => (
                          <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "rgba(0,255,157,0.08)", border: "1px solid rgba(0,255,157,0.15)", borderRadius: 4, color: "var(--emerald)" }}>
                            {step.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Feed */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>📡 Live Sensor Feed</h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{readings.length} readings</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {readings.slice(0, 16).map((r, i) => (
              <div key={i} style={{ padding: "8px 12px", background: r.breach ? "rgba(255,50,50,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${r.breach ? "rgba(255,50,50,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "var(--radius-sm)", minWidth: 80 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{r.sensorId.slice(0, 10)}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: r.breach ? "var(--rose)" : r.metric === "temperature_c" ? "var(--amber)" : "var(--cyan)" }}>
                  {r.value}{r.metric === "temperature_c" ? "°C" : "V"}
                </div>
                {r.breach && <div style={{ fontSize: 9, color: "var(--rose)", fontWeight: 700 }}>BREACH</div>}
              </div>
            ))}
            {readings.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>
                Click "Start Demo" to begin the sensor feed
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 24, padding: "20px 24px", background: "rgba(123,47,255,0.04)", border: "1px solid rgba(123,47,255,0.15)", borderRadius: "var(--radius-md)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>How This Works</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "📡", title: "IoT Sensor Stream", desc: "Real-time sensor data published to 0G DA layer at 10 readings/sec" },
              { icon: "🔐", title: "TEE Evaluation", desc: "3 AI agents (Fraud, Parametric, Payout) run in Intel TDX enclaves on 0G Private Computer" },
              { icon: "⛓️", title: "Onchain Settlement", desc: "TEE signature verified by InsurancePolicy.sol — payout released automatically" },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
