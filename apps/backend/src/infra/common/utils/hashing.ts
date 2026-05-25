import { createHash } from "node:crypto";
import * as argon2 from "argon2";

export async function hash(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verify(hashed: string, plain: string): Promise<boolean> {
  return argon2.verify(hashed, plain);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
