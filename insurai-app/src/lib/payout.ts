/**
 * Pure function for payout calculation.
 * Extracted to enable property-based testing.
 *
 * Properties that must hold:
 * 1. payout <= coverageAmount (upper bound)
 * 2. payout >= 0 (lower bound)
 * 3. score < 0.75 → payout = 0 (rejection)
 * 4. score >= 0.75 → payout = coverageAmount * payoutRatio (approval)
 */
export function calculatePayout(
  coverageAmount: bigint,
  score: number,
  payoutRatio: number,
): bigint {
  if (score < 0.75) return 0n;
  // Clamp payoutRatio to [0, 1]
  const ratio = Math.max(0, Math.min(1, payoutRatio));
  // Use integer arithmetic to avoid floating-point precision issues
  const ratioScaled = BigInt(Math.round(ratio * 10000));
  const payout = (coverageAmount * ratioScaled) / 10000n;
  // Ensure payout never exceeds coverage (safety guard)
  return payout > coverageAmount ? coverageAmount : payout;
}

/**
 * Compute the aggregated multi-agent score.
 * fraud_score * 0.4 + match_score * 0.4 + payout_ratio * 0.2
 */
export function aggregateAgentScores(
  fraudScore: number,
  matchScore: number,
  payoutRatio: number,
): number {
  const clamped = (v: number) => Math.max(0, Math.min(1, v));
  return clamped(fraudScore) * 0.4 + clamped(matchScore) * 0.4 + clamped(payoutRatio) * 0.2;
}
