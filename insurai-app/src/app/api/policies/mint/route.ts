import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { uploadEncryptedPolicyMetadata } from "@/lib/0g/storage";
import { og_galileo, og_mainnet, POLICY_INFT_ADDRESS } from "@/lib/contract";

export const runtime = "nodejs";

const IS_MAINNET = process.env.NEXT_PUBLIC_IS_MAINNET === "true";
const activeChain = IS_MAINNET ? og_mainnet : og_galileo;
const rpcUrl = IS_MAINNET ? "https://evmrpc.0g.ai" : "https://evmrpc-testnet.0g.ai";

const POLICY_INFT_ABI = [
  {
    name: "mintPolicy",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "encryptedMetadataURI", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to = body.to as `0x${string}`;
    const metadata = body.metadata ?? {};

    // ── Upload encrypted metadata to 0G Storage ───────────────────────────────
    const upload = await uploadEncryptedPolicyMetadata(metadata);

    // ── Attempt iNFT mint if contract is deployed ─────────────────────────────
    const inftAddress = POLICY_INFT_ADDRESS;
    const pk = process.env.CLAIMS_BOT_PRIVATE_KEY as `0x${string}` | undefined;

    if (
      !inftAddress ||
      inftAddress === "0x0000000000000000000000000000000000000000" ||
      !pk
    ) {
      return NextResponse.json({
        ok: true,
        mode: upload.mode,
        encryptedMetadataUri: upload.encryptedMetadataUri,
        cipherHash: upload.cipherHash,
        note: "iNFT mint skipped — contract address or bot key not configured.",
      });
    }

    const account = privateKeyToAccount(pk);
    const walletClient = createWalletClient({
      account,
      chain: activeChain as never,
      transport: http(rpcUrl),
    });
    const publicClient = createPublicClient({
      chain: activeChain as never,
      transport: http(rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      address: inftAddress,
      abi: POLICY_INFT_ABI,
      functionName: "mintPolicy",
      args: [to, upload.encryptedMetadataUri],
    } as never);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      ok: true,
      mode: "minted",
      encryptedMetadataUri: upload.encryptedMetadataUri,
      cipherHash: upload.cipherHash,
      storageMode: upload.mode,
      txHash,
      receiptStatus: receipt.status,
    });
  } catch (error) {
    console.error("[policies/mint] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
