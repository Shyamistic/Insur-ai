import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  http,
  keccak256,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { INSURANCE_ABI, CONTRACT_ADDRESS, og_galileo, og_mainnet } from "@/lib/contract";
import { evaluateClaimWithTee } from "@/lib/0g/compute";

export const runtime = "nodejs";

const IS_MAINNET = process.env.NEXT_PUBLIC_IS_MAINNET === "true";
const activeChain = IS_MAINNET ? og_mainnet : og_galileo;
const rpcUrl = IS_MAINNET ? "https://evmrpc.0g.ai" : "https://evmrpc-testnet.0g.ai";

function requiredServerKey(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value as `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const claimId = BigInt(body.claimId);
    const policyId = BigInt(body.policyId);
    const holder = body.holder as `0x${string}`;
    const evidenceCid = String(body.evidenceCid || "");
    const coverageAmount = body.coverageAmount
      ? BigInt(body.coverageAmount)
      : parseEther("0.01");

    // ── Run multi-agent TEE evaluation ────────────────────────────────────────
    const decision = await evaluateClaimWithTee({
      claimId,
      policyId,
      evidenceCid,
      coverageAmount,
      triggerValue: typeof body.triggerValue === "number" ? body.triggerValue : undefined,
    });

    // ── Sign settlement payload with TEE key ──────────────────────────────────
    const teeAccount = privateKeyToAccount(requiredServerKey("TEE_SIGNER_PRIVATE_KEY"));
    const digest = keccak256(
      encodePacked(
        ["uint256", "uint256", "address", "uint256", "bool"],
        [claimId, policyId, holder, decision.payoutAmount, decision.approved],
      ),
    );
    const teeSignature = await teeAccount.signMessage({ message: { raw: digest } });

    // ── Check if we should settle on-chain ────────────────────────────────────
    const shouldSettle =
      body.settleOnChain !== false &&
      CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

    if (!shouldSettle) {
      return NextResponse.json({
        ok: true,
        mode: "evaluation_only",
        decision: {
          ...decision,
          payoutAmount: decision.payoutAmount.toString(),
          attestationHash: decision.attestationHash,
        },
        teeSignature,
      });
    }

    // ── Settle on-chain ───────────────────────────────────────────────────────
    const bot = privateKeyToAccount(requiredServerKey("CLAIMS_BOT_PRIVATE_KEY"));
    const walletClient = createWalletClient({
      account: bot,
      chain: activeChain as never,
      transport: http(rpcUrl),
    });
    const publicClient = createPublicClient({
      chain: activeChain as never,
      transport: http(rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI as never,
      functionName: "settleClaim",
      args: [
        claimId,
        decision.approved,
        decision.payoutAmount,
        teeSignature,
        decision.attestationHash,
      ],
    } as never);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      ok: true,
      decision: {
        approved: decision.approved,
        payoutAmount: decision.payoutAmount.toString(),
        score: decision.score,
        reason: decision.reason,
        agentResponses: decision.agentResponses,
        auditTrail: decision.auditTrail,
        attestation: decision.attestation,
        attestationHash: decision.attestationHash,
      },
      teeSignature,
      txHash,
      receiptStatus: receipt.status,
    });
  } catch (error) {
    console.error("[claims/evaluate] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
