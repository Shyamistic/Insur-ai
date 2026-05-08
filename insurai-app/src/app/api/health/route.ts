import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { og_galileo, og_mainnet, CONTRACT_ADDRESS } from "@/lib/contract";
import { getComputeNetworkStatus } from "@/lib/0g/compute";
import { checkStorageHealth } from "@/lib/0g/storage";

export const runtime = "nodejs";

const IS_MAINNET = process.env.NEXT_PUBLIC_IS_MAINNET === "true";
const activeChain = IS_MAINNET ? og_mainnet : og_galileo;
const rpcUrl = IS_MAINNET ? "https://evmrpc.0g.ai" : "https://evmrpc-testnet.0g.ai";

export async function GET() {
  const timestamp = new Date().toISOString();

  // ── Check 0G Chain ────────────────────────────────────────────────────────
  let chainStatus: "ok" | "degraded" | "down" = "down";
  let blockHeight = 0;
  try {
    const publicClient = createPublicClient({
      chain: activeChain as never,
      transport: http(rpcUrl),
    });
    const block = await publicClient.getBlockNumber();
    blockHeight = Number(block);
    chainStatus = "ok";
  } catch {
    chainStatus = "down";
  }

  // ── Check 0G Storage ──────────────────────────────────────────────────────
  let storageStatus: "ok" | "degraded" | "down" = "down";
  let storageMode = "unknown";
  let storageIndexerUrl = "";
  try {
    const health = await checkStorageHealth();
    storageStatus = health.ok ? "ok" : "degraded";
    storageMode = health.mode;
    storageIndexerUrl = health.indexerUrl;
  } catch {
    storageStatus = "down";
  }

  // ── Check 0G Private Computer ─────────────────────────────────────────────
  let computeStatus: "ok" | "degraded" | "down" = "down";
  let computeProviderCount = 0;
  let computeModels: string[] = [];
  let computeLatencyMs = 0;
  try {
    const compute = await getComputeNetworkStatus();
    computeStatus = compute.ok ? "ok" : "degraded";
    computeProviderCount = compute.providerCount;
    computeModels = compute.models;
    computeLatencyMs = compute.latencyMs;
  } catch {
    computeStatus = "down";
  }

  const allOk = chainStatus === "ok" && storageStatus !== "down" && computeStatus !== "down";

  return NextResponse.json({
    ok: allOk,
    timestamp,
    network: IS_MAINNET ? "mainnet" : "testnet",
    contractAddress: CONTRACT_ADDRESS,
    services: {
      chain: {
        status: chainStatus,
        blockHeight,
        rpcUrl,
        network: IS_MAINNET ? "0G Mainnet (16661)" : "0G Galileo Testnet (16602)",
      },
      storage: {
        status: storageStatus,
        mode: storageMode,
        indexerUrl: storageIndexerUrl,
      },
      compute: {
        status: computeStatus,
        providerCount: computeProviderCount,
        models: computeModels,
        latencyMs: computeLatencyMs,
        endpoint: process.env.OG_PRIVATE_COMPUTER_URL || "not configured",
        apiKeyConfigured: !!process.env.OG_PRIVATE_COMPUTER_API_KEY,
      },
    },
  });
}
