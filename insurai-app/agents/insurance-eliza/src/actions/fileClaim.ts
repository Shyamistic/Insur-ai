export async function fileClaim(apiBase: string, wallet: string, userMessage: string) {
  const res = await fetch(`${apiBase}/api/claims/evaluate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      claimId: "1",
      policyId: "1",
      holder: wallet,
      evidenceCid: `chat-claim-${Date.now()}`,
      coverageAmount: "10000000000000000",
      triggerValue: userMessage.includes("temperature") ? 33.1 : 205,
      settleOnChain: false,
    }),
  });
  return res.json();
}
