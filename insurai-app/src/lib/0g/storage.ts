import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { toHex } from "viem";

type UploadResult = {
  encryptedMetadataUri: string;
  cipherHash: `0x${string}`;
  mode: "0g_storage_endpoint" | "local_stub_file";
};

function getEncryptionKey() {
  const raw = process.env.POLICY_METADATA_ENCRYPTION_KEY || "";
  if (!raw || raw.length !== 64) {
    throw new Error("POLICY_METADATA_ENCRYPTION_KEY must be a 64-char hex string.");
  }
  return Buffer.from(raw, "hex");
}

export function encryptPolicyMetadata(payload: unknown) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  };
}

export async function uploadEncryptedPolicyMetadata(payload: unknown): Promise<UploadResult> {
  const encrypted = encryptPolicyMetadata(payload);
  const blob = JSON.stringify(encrypted);
  const cipherHash = toHex(crypto.createHash("sha256").update(blob).digest()) as `0x${string}`;

  const uploadUrl = process.env.OG_STORAGE_UPLOAD_URL;
  if (uploadUrl) {
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.OG_STORAGE_API_KEY ? { authorization: `Bearer ${process.env.OG_STORAGE_API_KEY}` } : {}),
      },
      body: blob,
    });
    const data = await res.json().catch(() => ({}));
    const uri = String(data?.uri || data?.cid || `0g://stub/${cipherHash}`);
    return { encryptedMetadataUri: uri, cipherHash, mode: "0g_storage_endpoint" };
  }

  const dir = path.join(process.cwd(), ".data", "storage");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${cipherHash.slice(2)}.json`);
  await fs.writeFile(filePath, blob, "utf8");
  return {
    encryptedMetadataUri: `0g://stub/${cipherHash.slice(2)}`,
    cipherHash,
    mode: "local_stub_file",
  };
}
