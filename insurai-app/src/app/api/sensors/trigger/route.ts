import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { INSURANCE_ABI, CONTRACT_ADDRESS, og_galileo, og_mainnet } from "@/lib/contract";
import { evaluateClaimWithTee } from "@/lib/0g/compute";
import { keccak256, encodePacked } from "viem";

export const runtime = "nodejs";

const IS_MAINNET = process.env.NEXT_PUBLIC_IS_MAINNET === "true";
const activeChain = IS_MAINNET ? og_mainnet : og_galileo;
const rpcUrl = IS_MAINNET ? "https://evmrpc.0g.ai" : "https://evmrpc-testnet.0g.ai";

// Thresholds for autonomous triggering
const THRESHOLDS = {
  temperature_c: { max: 30, description: "Temperature exceeds 30°C" },
  voltage_v: { min: 210, description: "Voltage drops below 210V" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sensorId, routeId, metric, value, policyId: overridePolicyId } = body;

    // ── Check if threshold is breached ────────────────────────────────────────
    let breached = false;
    let breachReason = "";

    if (metric === "temperature_c" && value > THRESHOLDS.temperature_c.max) {
      breached = true;
      breachReason = `${THRESHOLDS.temperature_c.description} (${value}°C > ${THRESHOLDS.temperature_c.max}°C)`;
    } else if (metric === "voltage_v" && value < THRESHOLDS.voltage_v.min) {
      breached = true;
      breachReason = `${THRESHOLDS.voltage_v.description} (${value}V < ${THRESHOLDS.voltage_v.min}V)`;
    }

    if (!breached) {
      return NextResponse.json({
        ok: true,
        triggered: false,
        reason: `No threshold breach detected for ${metric}=${value}`,
      });
    }

    // ── Check if contract is deployed ─────────────────────────────────────────
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({
        ok: true,
        triggered: false,
        reason: "Contract not deployed — cannot trigger autonomous claim",
        breach: { metric, value, reason: breachReason },
      });
    }

    const botKey = process.env.CLAIMS_BOT_PRIVATE_KEY as `0x${string}` | undefined;
    const teeKey = process.env.TEE_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;

    if (!botKey || !teeKey) {
      return NextResponse.json({
        ok: true,
        triggered: false,
        reason: "Bot keys not configured — cannot trigger autonomous claim",
        breach: { metric, value, reason: breachReason },
      });
    }

    // ── Use demo policy ID 1 if no override ───────────────────────────────────
    const policyId = BigInt(overridePolicyId || 1);
    const evidenceCid = `0g://sensor/${sensorId}-${routeId}-${Date.now()}`;

    const botAccount = privateKeyToAccount(botKey);
    const walletClient = createWalletClient({
      account: botAccount,
      chain: activeChain as never,
      transport: http(rpcUrl),
    });
    const publicClient = createPublicClient({
      chain: activeChain as never,
      transport: http(rpcUrl),
    });

    // ── Submit claim on-chain ─────────────────────────────────────────────────
    let claimId: bigint;
    try {
      const submitTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: INSURANCE_ABI as never,
        functionName: "submitClaim",
        args: [policyId, evidenceCid],
      } as never);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: submitTx });

      const log = receipt.logs.find((l) => l.topics[0]?.toLowerCase().includes("claim"));
      claimId = log?.topics[1] ? BigInt(log.topics[1]) : BigInt(Date.now());
    } catch (submitErr) {
      // If submit fails (e.g., policy not active), return breach info without claim
      return NextResponse.json({
        ok: true,
        triggered: false,
        reason: `Claim submission failed: ${submitErr instanceof Error ? submitErr.message : "unknown"}`,
        breach: { metric, value, reason: breachReason },
      });
    }

    // ── Evaluate with TEE ─────────────────────────────────────────────────────
    const policy = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI,
      functionName: "getPolicy",
      args: [policyId],
    });

    const coverageAmount = (policy as { coverage: bigint }).coverage || BigInt(parseFloat("0.01") * 1e18);

    const decision = await evaluateClaimWithTee({
      claimId,
      policyId,
      evidenceCid,
      coverageAmount,
      triggerValue: value,
    });

    // ── Sign and settle ───────────────────────────────────────────────────────
    const teeAccount = privateKeyToAccount(teeKey);
    const holder = botAccount.address;
    const digest = keccak256(
      encodePacked(
        ["uint256", "uint256", "address", "uint256", "bool"],
        [claimId, policyId, holder, decision.payoutAmount, decision.approved],
      ),
    );
    const teeSignature = await teeAccount.signMessage({ message: { raw: digest } });

    const settleTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: INSURANCE_ABI as never,
      functionName: "settleClaim",
      args: [claimId, decision.approved, decision.payoutAmount, teeSignature, decision.attestationHash],
    } as never);

    await publicClient.waitForTransactionReceipt({ hash: settleTx });

    return NextResponse.json({
      ok: true,
      triggered: true,
      claimId: claimId.toString(),
      settlementTx: settleTx,
      breach: { metric, value, reason: breachReason },
      decision: {
        approved: decision.approved,
        score: decision.score,
        reason: decision.reason,
        payoutAmount: decision.payoutAmount.toString(),
        agentResponses: decision.agentResponses,
        auditTrail: decision.auditTrail,
      },
    });
  } catch (error) {
    console.error("[sensors/trigger] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
