/**
 * InsurAI Property-Based Tests
 * Uses fast-check to verify correctness properties across random inputs.
 *
 * Run with: npx vitest run src/tests/pbt.test.ts
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { calculatePayout, aggregateAgentScores } from "../lib/payout";
import { encryptPolicyMetadata, decryptPolicyMetadata } from "../lib/0g/storage";
import { buildAuditTrail, verifyAuditTrail, computeStepHash } from "../lib/0g/audit";

// ─── CP-01: Payout Calculation Bounds ────────────────────────────────────────
describe("CP-01: Payout Calculation Bounds", () => {
  it("payout never exceeds coverage (upper bound)", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1_000_000_000_000_000_000n }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (coverage, score, payoutRatio) => {
          const payout = calculatePayout(coverage, score, payoutRatio);
          return payout <= coverage;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("payout is always non-negative (lower bound)", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1_000_000_000_000_000_000n }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (coverage, score, payoutRatio) => {
          const payout = calculatePayout(coverage, score, payoutRatio);
          return payout >= 0n;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("score < 0.75 always results in zero payout (rejection property)", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1_000_000_000_000_000_000n }),
        fc.float({ min: 0, max: Math.fround(0.7499), noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (coverage, score, payoutRatio) => {
          const payout = calculatePayout(coverage, score, payoutRatio);
          return payout === 0n;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("score >= 0.75 with payoutRatio=1.0 results in full coverage payout", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 10000n, max: 1_000_000_000_000_000_000n }),
        fc.float({ min: 0.75, max: 1.0, noNaN: true }),
        (coverage, score) => {
          const payout = calculatePayout(coverage, score, 1.0);
          // Allow for integer rounding: payout should be within 1 wei of coverage
          return payout >= coverage - 1n && payout <= coverage;
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ─── CP-02: Agent Score Aggregation ──────────────────────────────────────────
describe("CP-02: Agent Score Aggregation", () => {
  it("aggregated score is always in [0, 1]", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (fraud, match, payout) => {
          const score = aggregateAgentScores(fraud, match, payout);
          return score >= 0 && score <= 1;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("all-zero scores produce zero aggregate", () => {
    expect(aggregateAgentScores(0, 0, 0)).toBe(0);
  });

  it("all-one scores produce one aggregate", () => {
    expect(aggregateAgentScores(1, 1, 1)).toBeCloseTo(1.0, 5);
  });

  it("weights sum to 1.0 (fraud=0.4, match=0.4, payout=0.2)", () => {
    // With all scores = 0.5, result should be 0.5
    expect(aggregateAgentScores(0.5, 0.5, 0.5)).toBeCloseTo(0.5, 5);
  });
});

// ─── CP-03: Encryption Round-Trip ────────────────────────────────────────────
describe("CP-03: Encryption Round-Trip", () => {
  // Set a test encryption key
  const testKey = "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";
  const originalEnv = process.env.POLICY_METADATA_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.POLICY_METADATA_ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.POLICY_METADATA_ENCRYPTION_KEY = originalEnv;
  });

  it("decrypt(encrypt(data)) === data (round-trip property)", () => {
    fc.assert(
      fc.property(
        fc.record({
          product: fc.string({ minLength: 1, maxLength: 50 }),
          coverage: fc.integer({ min: 1, max: 1000000 }),
          premium: fc.integer({ min: 1, max: 10000 }),
          details: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 0, maxLength: 100 }),
          ),
        }),
        (metadata) => {
          const encrypted = encryptPolicyMetadata(metadata);
          const decrypted = decryptPolicyMetadata(encrypted);
          return JSON.stringify(decrypted) === JSON.stringify(metadata);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("each encryption produces different ciphertext (non-deterministic due to random IV)", () => {
    const metadata = { product: "test", coverage: 1000, premium: 10, details: {} };
    const enc1 = encryptPolicyMetadata(metadata);
    const enc2 = encryptPolicyMetadata(metadata);
    // IVs should be different (random)
    expect(enc1.iv).not.toBe(enc2.iv);
    // But both should decrypt to the same value
    expect(JSON.stringify(decryptPolicyMetadata(enc1))).toBe(JSON.stringify(metadata));
    expect(JSON.stringify(decryptPolicyMetadata(enc2))).toBe(JSON.stringify(metadata));
  });

  it("encrypted blob has required keys: iv, tag, data", () => {
    fc.assert(
      fc.property(
        fc.record({ value: fc.string() }),
        (data) => {
          const encrypted = encryptPolicyMetadata(data);
          return (
            typeof encrypted.iv === "string" &&
            typeof encrypted.tag === "string" &&
            typeof encrypted.data === "string" &&
            encrypted.iv.length === 24 && // 12 bytes = 24 hex chars
            encrypted.tag.length === 32    // 16 bytes = 32 hex chars
          );
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ─── CP-04: Audit Trail Integrity ────────────────────────────────────────────
describe("CP-04: Audit Trail Integrity", () => {
  it("valid audit trail always verifies", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            step: fc.constantFrom(
              "claim_submitted" as const,
              "evidence_uploaded" as const,
              "tee_initialized" as const,
              "ai_inference" as const,
              "signature_generated" as const,
              "settlement_executed" as const,
            ),
            data: fc.record({ value: fc.string() }),
          }),
          { minLength: 1, maxLength: 6 },
        ),
        (steps) => {
          const trail = buildAuditTrail(steps);
          const result = verifyAuditTrail(trail);
          return result.valid;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("mutating any step hash breaks verification", () => {
    const steps = [
      { step: "claim_submitted" as const, data: { claimId: "1" } },
      { step: "evidence_uploaded" as const, data: { cid: "0g://test" } },
      { step: "tee_initialized" as const, data: { model: "deepseek" } },
    ];
    const trail = buildAuditTrail(steps);

    // Mutate the hash of step 1
    const mutated = trail.map((entry, i) =>
      i === 1 ? { ...entry, hash: "0".repeat(64) } : entry,
    );

    const result = verifyAuditTrail(mutated);
    expect(result.valid).toBe(false);
    expect(result.failedAtIndex).toBeDefined();
  });

  it("audit trail hash is deterministic for same inputs", () => {
    const hash1 = computeStepHash("0".repeat(64), "claim_submitted", "2026-05-08T00:00:00.000Z", { claimId: "1" });
    const hash2 = computeStepHash("0".repeat(64), "claim_submitted", "2026-05-08T00:00:00.000Z", { claimId: "1" });
    expect(hash1).toBe(hash2);
  });

  it("different data produces different hash", () => {
    const hash1 = computeStepHash("0".repeat(64), "claim_submitted", "2026-05-08T00:00:00.000Z", { claimId: "1" });
    const hash2 = computeStepHash("0".repeat(64), "claim_submitted", "2026-05-08T00:00:00.000Z", { claimId: "2" });
    expect(hash1).not.toBe(hash2);
  });
});

// ─── CP-05: Payout Calculation Precision ─────────────────────────────────────
describe("CP-05: Payout Calculation Precision", () => {
  it("payout with 50% ratio is approximately half of coverage", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 10000n, max: 1_000_000_000_000_000_000n }),
        (coverage) => {
          const payout = calculatePayout(coverage, 0.9, 0.5);
          // Should be within 1 wei of coverage/2
          const expected = coverage / 2n;
          const diff = payout > expected ? payout - expected : expected - payout;
          return diff <= 1n;
        },
      ),
      { numRuns: 100 },
    );
  });
});