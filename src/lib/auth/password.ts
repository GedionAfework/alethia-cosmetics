import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const keyBuf = Buffer.from(key, "hex");
  if (hash.length !== keyBuf.length) return false;
  return timingSafeEqual(hash, keyBuf);
}
