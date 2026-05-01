export async function purchasePolicy(apiBase: string, wallet: string, userMessage: string) {
  const body = {
    to: wallet,
    metadata: {
      intent: "chat_purchase_policy",
      sourceMessage: userMessage,
      createdAt: new Date().toISOString(),
    },
  };
  const res = await fetch(`${apiBase}/api/policies/mint`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}
