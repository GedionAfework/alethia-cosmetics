import { createHmac, timingSafeEqual } from "crypto";

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

export function botConfigured() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  return Boolean(token) && !token.includes("PLACEHOLDER") && !token.startsWith("0000000000");
}

export function getAdminTelegramIds(): bigint[] {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => BigInt(s));
}

export function getAdminTelegramUsernames(): string[] {
  return (process.env.ADMIN_TELEGRAM_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

export function isAdminAccount(input: {
  telegramId?: bigint | number | string | null;
  username?: string | null;
}) {
  if (input.telegramId != null && input.telegramId !== "") {
    const id = BigInt(input.telegramId);
    if (getAdminTelegramIds().some((adminId) => adminId === id)) return true;
  }
  if (!input.username) return false;
  const normalized = input.username.replace(/^@/, "").toLowerCase();
  return getAdminTelegramUsernames().includes(normalized);
}

export function validateWebAppInitData(initData: string): TelegramUser | null {
  try {
    const token = getBotToken();
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    params.delete("hash");
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
    const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    const a = Buffer.from(calculated, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const authDate = Number(params.get("auth_date") || 0);
    if (!authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

    const userRaw = params.get("user");
    if (!userRaw) return null;
    return JSON.parse(userRaw) as TelegramUser;
  } catch {
    return null;
  }
}
