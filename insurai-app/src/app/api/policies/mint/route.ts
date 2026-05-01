import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { uploadEncryptedPolicyMetadata } from "@/lib/0g/storage";
import { og_galileo } from "@/lib/contract";

export const runtime = "nodejs";

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

    const upload = await uploadEncryptedPolicyMetadata(metadata);
    const inftAddress = process.env.NEXT_PUBLIC_POLICY_INFT_ADDRESS as `0x${string}` | undefined;

    if (!inftAddress || inftAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({
        ok: true,
        mode: "metadata_only_stub",
        encryptedMetadataUri: upload.encryptedMetadataUri,
        cipherHash: upload.cipherHash,
        note: "iNFT mint skipped because NEXT_PUBLIC_POLICY_INFT_ADDRESS is unset.",
      });
    }

    const pk = process.env.CLAIMS_BOT_PRIVATE_KEY as `0x${string}` | undefined;
    if (!pk) {
      return NextResponse.json({
        ok: true,
        mode: "metadata_only_stub",
        encryptedMetadataUri: upload.encryptedMetadataUri,
        cipherHash: upload.cipherHash,
        note: "iNFT mint skipped because CLAIMS_BOT_PRIVATE_KEY is unset.",
      });
    }

    const account = privateKeyToAccount(pk);
    const walletClient = createWalletClient({
      account,
      chain: og_galileo as never,
      transport: http("https://evmrpc-testnet.0g.ai"),
    });
    const publicClient = createPublicClient({
      chain: og_galileo as never,
      transport: http("https://evmrpc-testnet.0g.ai"),
    });

    const txHash = await walletClient.writeContract({
      address: inftAddress,
      abi: POLICY_INFT_ABI,
      functionName: "mintPolicy",
      args: [to, upload.encryptedMetadataUri],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      ok: true,
      mode: "minted",
      encryptedMetadataUri: upload.encryptedMetadataUri,
      txHash,
      receiptStatus: receipt.status,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
