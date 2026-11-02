import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, issueSession } from "@/lib/auth/session";
import { botConfigured, validateWebAppInitData } from "@/lib/telegram/validate";
import { linkTelegramAccount } from "@/services/inventory.service";

export async function POST(req: NextRequest) {
  try {
    if (!botConfigured()) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN is missing on the server. Add it in Vercel env vars and redeploy." },
        { status: 503 }
      );
    }
    if (!process.env.SESSION_SECRET?.trim()) {
      return NextResponse.json(
        { error: "SESSION_SECRET is missing on the server. Add a long random value in Vercel env vars and redeploy." },
        { status: 503 }
      );
    }
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { error: "DATABASE_URL is missing on the server. Link Neon / set it in Vercel env vars and redeploy." },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => null)) as { initData?: string } | null;
    const initData = body?.initData;
    if (!initData) {
      return NextResponse.json({ error: "Missing Telegram data." }, { status: 400 });
    }

    const tgUser = validateWebAppInitData(initData);
    if (!tgUser) {
      return NextResponse.json(
        {
          error:
            "Invalid Telegram login. TELEGRAM_BOT_TOKEN must match this bot, and you must open the Mini App from that bot (URL must be https://alethia-cosmetics.vercel.app — not /api/telegram/webhook).",
        },
        { status: 401 }
      );
    }

    const user = await linkTelegramAccount(tgUser);
    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          error:
            "This Telegram account is not on the staff list. Put Gedion_Afework in ADMIN_TELEGRAM_USERNAMES (first Super Admin), redeploy, then reopen the bot.",
        },
        { status: 403 }
      );
    }

    const { token, home } = await issueSession(user);
    const res = NextResponse.json({ ok: true, home, user: user.username });
    return attachSessionCookie(res, token);
  } catch (err) {
    console.error("Telegram auth failed", err);
    const message = err instanceof Error ? err.message : "Server error during Telegram sign-in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
