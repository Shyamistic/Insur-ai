import { NextRequest, NextResponse } from "next/server";
import { uploadEvidenceFile } from "@/lib/0g/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const policyId = formData.get("policyId") as string | null;

    if (!file) {
      // If no file, generate a deterministic CID from description
      const description = formData.get("description") as string | null;
      const crypto = await import("node:crypto");
      const hash = crypto.createHash("sha256")
        .update(`${policyId}-${description}-${Date.now()}`)
        .digest("hex");
      return NextResponse.json({
        ok: true,
        evidenceCid: `0g://evidence/${hash}`,
        mode: "hash_only",
        note: "No file provided — CID generated from description hash",
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadEvidenceFile(buffer, file.name);

    return NextResponse.json({
      ok: true,
      evidenceCid: result.evidenceCid,
      mode: result.mode,
      fileName: file.name,
      fileSize: buffer.length,
      policyId,
    });
  } catch (error) {
    console.error("[evidence/upload] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
