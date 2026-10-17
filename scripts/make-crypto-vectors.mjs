#!/usr/bin/env node
/**
 * M1 crypto spike helper.
 *   node scripts/make-crypto-vectors.mjs            copy the pinned golden vectors to mobile/spike/vectors.json
 *   node scripts/make-crypto-vectors.mjs --verify E decrypt envelope E (made on a phone) with the vector DEK
 */
import { copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const golden = join(root, "packages/core/test/golden-vectors.json");
const verifyAt = process.argv.indexOf("--verify");

if (verifyAt === -1) {
  copyFileSync(golden, join(root, "mobile/spike/vectors.json"));
  console.log("✓ mobile/spike/vectors.json");
} else {
  const envelope = process.argv[verifyAt + 1];
  const { dekB64 } = JSON.parse(readFileSync(golden, "utf8"));
  const [version, iv, data] = envelope.split(".");
  if (version !== "v1") throw new Error("not a v1 envelope");
  const key = await crypto.subtle.importKey("raw", Buffer.from(dekB64, "base64"), "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Buffer.from(iv, "base64") }, key, Buffer.from(data, "base64"));
  console.log(new TextDecoder().decode(plain));
}
