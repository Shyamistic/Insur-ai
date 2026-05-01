"use client";

import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";

type ChatMessage = { role: "user" | "agent"; text: string };

export default function ChatPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      text: 'Type: "Insure my Lagos-to-London cargo against temperature spikes above 30C, $5000 coverage".',
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const elizaUrl = useMemo(() => process.env.NEXT_PUBLIC_ELIZA_URL || "http://localhost:4300", []);

  async function startSession() {
    if (!address) return;
    const message = `InsurAI session key authorization\nWallet: ${address}\nPurpose: Let the agent execute insured actions for this demo session only.`;
    const signature = await signMessageAsync({ message });

    const response = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, signature, message }),
    });
    const data = await response.json();
    if (data.ok) setSessionId(data.sessionId);
  }

  async function send() {
    if (!input.trim() || !sessionId) return;
    const text = input.trim();
    setInput("");
    setPending(true);
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch(`${elizaUrl}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, wallet: address }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "agent", text: String(data.reply || "No reply") }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Eliza service unavailable. Start it with `npm run eliza:agent`." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>InsurAI Chat Concierge</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Session key pattern: sign once, then agent executes quote/purchase/claim actions.
      </p>

      <div style={{ marginBottom: 16 }}>
        <ConnectButton />
      </div>

      {isConnected && !sessionId && (
        <button onClick={startSession} className="btn btn-primary" style={{ marginBottom: 16 }}>
          Sign Once to Start Session
        </button>
      )}

      <div className="card" style={{ minHeight: 320, marginBottom: 12 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <strong>{m.role === "agent" ? "InsurAI Agent" : "You"}:</strong> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="form-input"
          placeholder="Ask to quote, purchase policy, or file claim..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!sessionId || pending}
        />
        <button className="btn btn-primary" onClick={send} disabled={!sessionId || pending}>
          {pending ? "Sending..." : "Send"}
        </button>
      </div>
    </main>
  );
}
