"use client";
import { useState, useEffect } from "react";
import { POLICY_PRODUCTS, addPolicy, type Policy } from "@/lib/data";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS, INSURANCE_ABI, POLICY_TYPE_REVERSE, explorerTxUrl } from "@/lib/contract";

interface Props {
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export default function BuyPolicy({ onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPremium, setSelectedPremium] = useState<number>(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [policyId, setPolicyId] = useState("");
  const [storageCid, setStorageCid] = useState("");
  const [storageMode, setStorageMode] = useState("");
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { address, isConnected } = useAccount();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const selectedProduct = POLICY_PRODUCTS.find((p) => p.type === selectedType);
  const selectedPremiumOpt = selectedProduct?.premiums[selectedPremium];

  async function handleBuy() {
    if (!selectedProduct || !selectedPremiumOpt || !isConnected) return;
    setUploadError("");
    setIsUploadingMetadata(true);

    // ── Step 1: Upload metadata to 0G Storage, get real CID ──────────────────
    let realStorageCid: string;
    try {
      const mintRes = await fetch("/api/policies/mint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: address,
          metadata: {
            product: selectedProduct.name,
            productType: selectedProduct.type,
            coverage: selectedPremiumOpt.coverage,
            premium: selectedPremiumOpt.premium,
            details: fieldValues,
            mintedAt: new Date().toISOString(),
          },
        }),
      });
      const mintData = await mintRes.json();
      if (!mintData.ok) throw new Error(mintData.error || "Metadata upload failed");
      realStorageCid = mintData.encryptedMetadataUri;
      setStorageCid(realStorageCid);
      setStorageMode(mintData.storageMode || mintData.mode || "unknown");
    } catch (err) {
      setUploadError(`Storage upload failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsUploadingMetadata(false);
      return;
    }
    setIsUploadingMetadata(false);

    // ── Step 2: Write to contract with real CID ───────────────────────────────
    const policyTypeEnum = POLICY_TYPE_REVERSE[selectedProduct.type] ?? 0;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI,
      functionName: "buyPolicy",
      args: [
        address ? `${address.slice(0, 6)}.0g` : "user.0g",
        policyTypeEnum,
        BigInt(parseEther(selectedPremiumOpt.coverage.toString())),
        BigInt(30),
        realStorageCid,
      ],
      value: parseEther(selectedPremiumOpt.premium.toString()),
    });
  }

  useEffect(() => {
    if (isConfirmed && hash) {
      const newPolicyId = `POL-${Date.now().toString().slice(-6)}`;
      setPolicyId(newPolicyId);
      setStep(3);

      addPolicy({
        id: newPolicyId,
        type: selectedProduct?.type || "flight_delay",
        holder: address || "0x...",
        agentId: address ? `${address.slice(0, 6)}.0g` : "user.0g",
        premium: selectedPremiumOpt?.premium || 0,
        coverage: selectedPremiumOpt?.coverage || 0,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        txHash: hash,
        contractAddress: CONTRACT_ADDRESS,
        details: fieldValues,
      } as Policy);
    }
  }, [isConfirmed, hash]);

  const isProcessing = isUploadingMetadata || isPending || isConfirming;

  const COLOR_MAP: Record<string, string> = {
    cyan: "var(--cyan)",
    violet: "var(--violet)",
    emerald: "var(--emerald)",
    amber: "var(--amber)",
    rose: "var(--rose)",
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Buy a Policy</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Choose a parametric insurance product and pay onchain in seconds.
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40, maxWidth: 480 }}>
        {["Choose Product", "Configure", "Confirm"].map((label, i) => {
          const s = i + 1;
          const isDone = step > s;
          const isActive = step === s;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div className={`step-dot ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}>
                  {isDone ? "✓" : s}
                </div>
                <span style={{ fontSize: 11, color: isActive ? "var(--cyan)" : "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={`step-line ${isDone ? "completed" : ""}`} style={{ marginBottom: 18 }} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Product Selection */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Select Insurance Product</h2>
          <div className="grid-2">
            {POLICY_PRODUCTS.map((product) => {
              const isSelected = selectedType === product.type;
              const col = COLOR_MAP[product.color] || "var(--cyan)";
              return (
                <div
                  key={product.type}
                  className="card"
                  onClick={() => setSelectedType(product.type)}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? `1px solid ${col}` : undefined,
                    background: isSelected ? `rgba(0,212,255,0.06)` : undefined,
                    boxShadow: isSelected ? `0 0 20px rgba(0,212,255,0.15)` : undefined,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{product.icon}</div>
                  <h3 style={{ fontSize: 17, marginBottom: 8 }}>{product.name}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                    {product.description}
                  </p>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    From <span style={{ color: col, fontWeight: 700 }}>${product.premiums[0].premium}</span> premium
                  </div>
                  {isSelected && (
                    <div style={{ marginTop: 12 }}>
                      <span className={`badge badge-${product.color}`}>Selected ✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={!selectedType} onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && selectedProduct && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            Configure {selectedProduct.icon} {selectedProduct.name}
          </h2>

          <div className="grid-2" style={{ marginBottom: 28 }}>
            <div className="card-gradient">
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Select Coverage</h3>
              {selectedProduct.premiums.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPremium(i)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    border: selectedPremium === i ? "1px solid var(--cyan)" : "1px solid rgba(255,255,255,0.08)",
                    background: selectedPremium === i ? "var(--cyan-dim)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    marginBottom: 8,
                    transition: "all 0.2s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Premium: <strong style={{ color: "var(--cyan)" }}>${opt.premium}</strong>
                  </span>
                </div>
              ))}
            </div>

            <div className="card-gradient">
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Policy Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Product", value: selectedProduct.name },
                  { label: "Coverage", value: `$${selectedPremiumOpt?.coverage.toLocaleString()}`, color: "var(--emerald)" },
                  { label: "Premium", value: `$${selectedPremiumOpt?.premium}`, color: "var(--cyan)" },
                  { label: "Duration", value: "30 days" },
                  { label: "Agent ID", value: address ? `${address.slice(0, 6)}.0g` : "user.0g", color: "var(--violet)" },
                  { label: "Network", value: "0G Chain", color: "var(--emerald)" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color || "var(--text-primary)" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 20 }}>Policy Details</h3>
            <div className="grid-2">
              {selectedProduct.fields.map((field) => (
                <div key={field} className="form-group">
                  <label className="form-label">{field}</label>
                  <input
                    className="form-input"
                    placeholder={`Enter ${field}`}
                    value={fieldValues[field] || ""}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 0G Storage info */}
          <div style={{ padding: "12px 16px", background: "rgba(123,47,255,0.06)", border: "1px solid rgba(123,47,255,0.2)", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 12, color: "var(--text-secondary)" }}>
            📦 Policy metadata will be encrypted and stored on <strong style={{ color: "var(--violet)" }}>0G Storage</strong> before the blockchain transaction.
          </div>

          {uploadError && (
            <div style={{ padding: "12px 16px", background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 13, color: "#ff6b6b" }}>
              ⚠️ {uploadError}
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 13, color: "#ff6b6b" }}>
              ⚠️ Transaction failed: {error.message.slice(0, 120)}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={handleBuy} disabled={isProcessing}>
              {isUploadingMetadata ? (
                <><span className="animate-blink">●</span> Uploading to 0G Storage...</>
              ) : isPending || isConfirming ? (
                <><span className="animate-blink">●</span> Broadcasting to 0G Chain...</>
              ) : (
                `Pay $${selectedPremiumOpt?.premium} & Activate`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && hash && (
        <div className="animate-fade-in" style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Policy Activated!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
            Your policy is live on 0G Chain. Metadata encrypted on 0G Storage.
          </p>

          <div className="card" style={{ textAlign: "left", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Policy ID", value: policyId, color: "var(--cyan)", mono: true },
                { label: "Agent ID", value: address ? `${address.slice(0, 6)}.0g` : "user.0g", color: "var(--violet)" },
                { label: "Coverage", value: `$${selectedPremiumOpt?.coverage.toLocaleString()}`, color: "var(--emerald)" },
                { label: "Status", value: "✅ Active", color: "var(--emerald)" },
                { label: "Storage Mode", value: storageMode || "0G Storage", color: "var(--violet)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: item.color, fontFamily: item.mono ? "var(--font-mono)" : undefined }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {storageCid && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                0G Storage CID
              </div>
              <div className="hash-display" style={{ fontSize: 11, color: "var(--violet)", borderColor: "rgba(123,47,255,0.2)", background: "rgba(123,47,255,0.06)", wordBreak: "break-all" }}>
                {storageCid}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Transaction Hash (0G Chain)
            </div>
            <div className="hash-display" style={{ wordBreak: "break-all", fontSize: 12 }}>{hash}</div>
          </div>

          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block", padding: "14px 20px", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "var(--radius-md)", marginBottom: 32, fontSize: 13, color: "var(--cyan)", textDecoration: "none", textAlign: "center" }}
          >
            🔗 Verify on 0G Chainscan Explorer →
          </a>

          <button className="btn btn-primary btn-lg" onClick={onSuccess}>
            View My Policies →
          </button>
        </div>
      )}
    </div>
  );
}
