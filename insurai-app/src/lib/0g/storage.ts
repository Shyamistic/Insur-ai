import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { toHex } from "viem";

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadResult = {
  encryptedMetadataUri: string;
  cipherHash: `0x${string}`;
  mode: "0g_storage_sdk" | "0g_storage_endpoint" | "local_stub_file";
  rootHash?: string;
};

type EncryptedBlob = {
  iv: string;
  tag: string;
  data: string;
};

// ─── Encryption Key ───────────────────────────────────────────────────────────
function getEncryptionKey(): Buffer {
  const raw = process.env.POLICY_METADATA_ENCRYPTION_KEY || "";
  if (!raw || raw.length !== 64) {
    // In development, use a deterministic key derived from a constant
    if (process.env.NODE_ENV !== "production") {
      return Buffer.from("0".repeat(64), "hex");
    }
    throw new Error("POLICY_METADATA_ENCRYPTION_KEY must be a 64-char hex string.");
  }
  return Buffer.from(raw, "hex");
}

// ─── Encrypt ──────────────────────────────────────────────────────────────────
export function encryptPolicyMetadata(payload: unknown): EncryptedBlob {
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

// ─── Decrypt ──────────────────────────────────────────────────────────────────
export function decryptPolicyMetadata(encrypted: EncryptedBlob): unknown {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, "hex");
  const tag = Buffer.from(encrypted.tag, "hex");
  const data = Buffer.from(encrypted.data, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    throw new Error("Decryption failed: invalid tag or corrupted data");
  }
}

// ─── Upload to 0G Storage ─────────────────────────────────────────────────────
export async function uploadEncryptedPolicyMetadata(payload: unknown): Promise<UploadResult> {
  const encrypted = encryptPolicyMetadata(payload);
  const blob = JSON.stringify(encrypted);
  const cipherHash = toHex(crypto.createHash("sha256").update(blob).digest()) as `0x${string}`;

  // ── Try 0G Storage SDK ────────────────────────────────────────────────────
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const indexerUrl =
    process.env.OG_STORAGE_INDEXER_URL ||
    (process.env.NEXT_PUBLIC_IS_MAINNET === "true"
      ? "https://indexer-storage-turbo.0g.ai"
      : "https://indexer-storage-testnet-turbo.0g.ai");

  if (deployerKey && deployerKey !== "0x0000000000000000000000000000000000000000000000000000000000000001") {
    try {
      // Dynamic import to avoid bundling issues in browser
      const { Indexer } = await import("@0gfoundation/0g-storage-ts-sdk");

      const indexer = new Indexer(indexerUrl);

      const buffer = Buffer.from(blob, "utf8");
      // @ts-expect-error — SDK types vary by version
      const [tx, err] = await indexer.upload(buffer, 0, "");

      if (!err && tx) {
        const rootHash = typeof tx === "string" ? tx : String(tx);
        return {
          encryptedMetadataUri: `0g://${rootHash}`,
          cipherHash,
          mode: "0g_storage_sdk",
          rootHash,
        };
      }
      console.warn("[storage] 0G SDK upload returned error:", err);
    } catch (sdkError) {
      console.warn("[storage] 0G SDK upload failed, falling back:", sdkError);
    }
  }

  // ── Try HTTP endpoint ─────────────────────────────────────────────────────
  const uploadUrl = process.env.OG_STORAGE_UPLOAD_URL;
  if (uploadUrl) {
    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.OG_STORAGE_API_KEY
            ? { authorization: `Bearer ${process.env.OG_STORAGE_API_KEY}` }
            : {}),
        },
        body: blob,
      });
      const data = await res.json().catch(() => ({}));
      const uri = String(data?.uri || data?.cid || `0g://stub/${cipherHash}`);
      return { encryptedMetadataUri: uri, cipherHash, mode: "0g_storage_endpoint" };
    } catch (httpError) {
      console.warn("[storage] HTTP endpoint upload failed:", httpError);
    }
  }

  // ── Local stub fallback ───────────────────────────────────────────────────
  const dir = path.join(process.cwd(), ".data", "storage");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${cipherHash.slice(2)}.json`);
  await fs.writeFile(filePath, blob, "utf8");
  return {
    encryptedMetadataUri: `0g://local/${cipherHash.slice(2)}`,
    cipherHash,
    mode: "local_stub_file",
  };
}

// ─── Upload Raw Evidence ──────────────────────────────────────────────────────
export async function uploadEvidenceFile(
  fileBuffer: Buffer,
  fileName: string,
): Promise<{ evidenceCid: string; mode: string }> {
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const cipherHash = `0x${hash}`;

  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const indexerUrl =
    process.env.OG_STORAGE_INDEXER_URL ||
    (process.env.NEXT_PUBLIC_IS_MAINNET === "true"
      ? "https://indexer-storage-turbo.0g.ai"
      : "https://indexer-storage-testnet-turbo.0g.ai");

  if (deployerKey && deployerKey !== "0x0000000000000000000000000000000000000000000000000000000000000001") {
    try {
      const { Indexer } = await import("@0gfoundation/0g-storage-ts-sdk");

      const indexer = new Indexer(indexerUrl);

      // @ts-expect-error — SDK types vary by version
      const [tx, err] = await indexer.upload(fileBuffer, 0, "");
      if (!err && tx) {
        return { evidenceCid: `0g://${tx}`, mode: "0g_storage_sdk" };
      }
    } catch (e) {
      console.warn("[storage] Evidence upload SDK failed:", e);
    }
  }

  // Fallback: store locally and return hash-based CID
  const dir = path.join(process.cwd(), ".data", "evidence");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${hash}-${fileName}`), fileBuffer);
  return { evidenceCid: `0g://evidence/${hash}`, mode: "local_stub_file" };
}

// ─── Storage Health Check ─────────────────────────────────────────────────────
export async function checkStorageHealth(): Promise<{
  ok: boolean;
  mode: string;
  indexerUrl: string;
}> {
  const indexerUrl =
    process.env.OG_STORAGE_INDEXER_URL ||
    (process.env.NEXT_PUBLIC_IS_MAINNET === "true"
      ? "https://indexer-storage-turbo.0g.ai"
      : "https://indexer-storage-testnet-turbo.0g.ai");

  try {
    const res = await fetch(`${indexerUrl}/api/v1/status`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return { ok: true, mode: "0g_storage_sdk", indexerUrl };
    }
  } catch {
    // fall through
  }

  const uploadUrl = process.env.OG_STORAGE_UPLOAD_URL;
  if (uploadUrl) {
    return { ok: true, mode: "0g_storage_endpoint", indexerUrl: uploadUrl };
  }

  return { ok: false, mode: "local_stub_file", indexerUrl };
}
