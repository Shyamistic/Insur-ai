import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  hashMessage,
  http,
  keccak256,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { INSURANCE_ABI, CONTRACT_ADDRESS, og_galileo } from "@/lib/contract";
import { evaluateClaimWithTee } from "@/lib/0g/compute";

export const runtime = "nodejs";

function requiredServerKey(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
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
    const coverageAmount = body.coverageAmount ? BigInt(body.coverageAmount) : parseEther("0.01");

    const decision = await evaluateClaimWithTee({
      claimId,
      policyId,
      evidenceCid,
      coverageAmount,
      triggerValue: typeof body.triggerValue === "number" ? body.triggerValue : undefined,
    });

    // Demo-compatible signature path: sign settlement payload with designated TEE key.
    const teeAccount = privateKeyToAccount(requiredServerKey("TEE_SIGNER_PRIVATE_KEY"));
    const digest = keccak256(
      encodePacked(
        ["uint256", "uint256", "address", "uint256", "bool"],
        [claimId, policyId, holder, decision.payoutAmount, decision.approved],
      ),
    );
    const teeSignature = await teeAccount.signMessage({ message: { raw: digest } });

    const shouldSettle = body.settleOnChain !== false && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

    if (!shouldSettle) {
      return NextResponse.json({
        ok: true,
        mode: "evaluation_only",
        decision,
        teeSignature,
      });
    }

    const bot = privateKeyToAccount(requiredServerKey("CLAIMS_BOT_PRIVATE_KEY"));
    const walletClient = createWalletClient({
      account: bot,
      chain: og_galileo as never,
      transport: http("https://evmrpc-testnet.0g.ai"),
    });
    const publicClient = createPublicClient({
      chain: og_galileo as never,
      transport: http("https://evmrpc-testnet.0g.ai"),
    });

    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI,
      functionName: "settleClaim",
      args: [claimId, decision.approved, decision.payoutAmount, teeSignature, decision.attestationHash],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      ok: true,
      decision,
      teeSignature,
      txHash,
      receiptStatus: receipt.status,
      attestDigest: hashMessage(decision.attestation),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
