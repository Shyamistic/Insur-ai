import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Chat session endpoint stub.
 * This route is referenced in the build but not yet implemented.
 * Future: integrate with Eliza or other conversational AI agent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || "";

    return NextResponse.json({
      ok: true,
      response: "Chat functionality is coming soon. For now, use the consumer portal to buy policies and submit claims.",
      sessionId: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "Chat service is not yet implemented",
    note: "This endpoint is a placeholder for future conversational AI integration",
  });
}
