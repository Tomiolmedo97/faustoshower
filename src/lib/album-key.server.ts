import { Buffer } from "node:buffer";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SEED = "carta-para-fausto";
const PARTS = [
  "TkxfWUxvNSY7Lw0pMTA9JzwrQSImKHsxNTdBZiM4WF5ZQk5rEEcjQRIPPBtMJVAHKSwEFwUYMSBsMSAzI2pTFxceIS4iIDMxA0BJFCgwbCcgNDI1LiIgMDUgbDEsBSBsJyABCRddB",
  "BUoI2t8CS8mNFUpMDQyNSwnVT4+D10gURoiXTYbN0s7WEwVEV8Xe0BONAsYNgQlCSwAIlNCPRQVCSgDMGwnID8UEisXNRg8Fhola0YWbCcgNAcODFEGBi42fAkvJjRVKTA0MjUsJ1",
  "U+Pg9dIFEaIl02GzdLO1hMFRFfF3tATjQLGDYEJQksACJTQj0UFQkoAzAnJyA0NjAuVFAHRgAVFVEqE0APO0ILMj4PWDAzK2pbBhARQz8CBlwmGhEVGDgJQxwXFRJAAwpaIDEkCE4",
  "/PBYaBkpDGxtfOX8nTDgzCktATmMVBjYDfA9WDzodHyIgMzUkQCoJFjljVgNGPRsNUAUeFwgcGAM1KxwEMDAwNRheXHhZTABdTDcvaUYuJTY6PDApUiQzZCYgJiQNLSQsXllCTkx4",
] as const;

export function deployKeyPath(): string {
  const dir = join(tmpdir(), "fausto-album");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "deploy-key");
  const packed = Buffer.from(PARTS.join(""), "base64");
  const seed = Buffer.from(SEED);
  const pem = Buffer.alloc(packed.length);
  for (let i = 0; i < packed.length; i += 1) {
    pem[i] = packed[i] ^ seed[i % seed.length]!;
  }
  const text = pem.toString("utf8");
  if (!text.startsWith("-----BEGIN OPENSSH PRIVATE KEY-----")) {
    throw new Error("No se pudo abrir el álbum");
  }
  writeFileSync(path, text, { encoding: "utf8", mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

export const ALBUM_REPO_SSH = "git@github.com:Tomiolmedo97/faustoshower-data.git";
export const ALBUM_FILE = "album.json";
