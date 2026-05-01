import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { cleanupSessions, createSession } from "@/lib/session-key";

export const runtime = "nodejs";

function buildSessionMessage(address: string) {
  const statement = process.env.CHAT_SESSION_STATEMENT || "InsurAI session key authorization";
  return `${statement}\nWallet: ${address}\nIssued At: ${new Date().toISOString()}`;
}

export async function POST(req: NextRequest) {
  try {
    cleanupSessions();
    const body = await req.json();
    const address = body.address as `0x${string}`;
    const signature = body.signature as `0x${string}`;
    const message = String(body.message || buildSessionMessage(address));

    const valid = await verifyMessage({ address, message, signature });
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const sessionId = createSession({
      address,
      signature,
      createdAt: Date.now(),
    });

    return NextResponse.json({ ok: true, sessionId, message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
