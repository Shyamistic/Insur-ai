export async function getQuote(message: string) {
  const coverageMatch = message.match(/\$([0-9]+)/);
  const coverage = coverageMatch ? Number(coverageMatch[1]) : 5000;
  const premium = Math.max(20, Math.round(coverage * 0.015));
  return {
    coverage,
    premium,
    quoteId: `Q-${Date.now()}`,
  };
}
