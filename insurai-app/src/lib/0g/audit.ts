import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuditStep {
  step: string;
  timestamp: string;
  data: unknown;
  hash: string;
  prevHash: string;
}

export const AUDIT_STEPS = [
  "claim_submitted",
  "evidence_uploaded",
  "tee_initialized",
  "ai_inference",
  "signature_generated",
  "settlement_executed",
] as const;

export type AuditStepName = (typeof AUDIT_STEPS)[number];

// ─── Hash Computation ─────────────────────────────────────────────────────────
export function computeStepHash(
  prevHash: string,
  stepName: string,
  timestamp: string,
  data: unknown,
): string {
  const input = prevHash + stepName + timestamp + JSON.stringify(data);
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ─── Build Audit Trail ────────────────────────────────────────────────────────
export function buildAuditTrail(
  steps: Array<{ step: AuditStepName; data: unknown }>,
): AuditStep[] {
  let prevHash = "0".repeat(64); // genesis hash
  return steps.map(({ step, data }) => {
    const timestamp = new Date().toISOString();
    const hash = computeStepHash(prevHash, step, timestamp, data);
    const entry: AuditStep = { step, timestamp, data, hash, prevHash };
    prevHash = hash;
    return entry;
  });
}

// ─── Verify Audit Trail ───────────────────────────────────────────────────────
export function verifyAuditTrail(trail: AuditStep[]): {
  valid: boolean;
  failedAtIndex?: number;
  reason?: string;
} {
  let prevHash = "0".repeat(64);

  for (let i = 0; i < trail.length; i++) {
    const entry = trail[i];

    if (entry.prevHash !== prevHash) {
      return {
        valid: false,
        failedAtIndex: i,
        reason: `Step ${i} (${entry.step}): prevHash mismatch`,
      };
    }

    const expected = computeStepHash(entry.prevHash, entry.step, entry.timestamp, entry.data);
    if (expected !== entry.hash) {
      return {
        valid: false,
        failedAtIndex: i,
        reason: `Step ${i} (${entry.step}): hash mismatch — expected ${expected.slice(0, 16)}... got ${entry.hash.slice(0, 16)}...`,
      };
    }

    prevHash = entry.hash;
  }

  return { valid: true };
}

// ─── Get Final Hash ───────────────────────────────────────────────────────────
export function getAuditTrailRootHash(trail: AuditStep[]): string {
  if (trail.length === 0) return "0".repeat(64);
  return trail[trail.length - 1].hash;
}
