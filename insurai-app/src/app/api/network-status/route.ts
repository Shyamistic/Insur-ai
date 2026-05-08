import { NextResponse } from "next/server";
import { getComputeNetworkStatus } from "@/lib/0g/compute";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getComputeNetworkStatus();

    return NextResponse.json({
      ok: status.ok,
      timestamp: new Date().toISOString(),
      providers: status.providers ?? status.models.map((model) => ({
        model,
        name: "0G Private Computer",
        status: "active",
        endpoint: process.env.OG_PRIVATE_COMPUTER_URL || "https://router-api.testnet.0g.ai/v1",
        latencyMs: status.latencyMs,
      })),
      activeCount: status.providerCount,
      models: status.models,
      latencyMs: status.latencyMs,
      apiKeyConfigured: !!process.env.OG_PRIVATE_COMPUTER_API_KEY,
      featherlessConfigured: !!process.env.FEATHERLESS_API_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        providers: [],
        activeCount: 0,
      },
      { status: 500 },
    );
  }
}
