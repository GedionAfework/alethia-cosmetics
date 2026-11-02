import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, issueSession } from "@/lib/auth/session";
import { botConfigured, validateWebAppInitData } from "@/lib/telegram/validate";
import { linkTelegramAccount } from "@/services/inventory.service";

export async function POST(req: NextRequest) {
  if (!botConfigured()) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is missing on the server. Add it in Vercel env vars and redeploy." },
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
          "Invalid Telegram login. Check that TELEGRAM_BOT_TOKEN matches this bot, and open the Mini App from that bot (not the browser).",
      },
      { status: 401 }
    );
  }

  const user = await linkTelegramAccount(tgUser);
  if (!user || !user.isActive) {
    return NextResponse.json(
      {
        error:
          "This Telegram account is not on the staff list. Put your username in ADMIN_TELEGRAM_USERNAMES (first Super Admin) or ask a Super Admin to add you.",
      },
      { status: 403 }
    );
  }

  const { token, home } = await issueSession(user);
  const res = NextResponse.json({ ok: true, home });
  return attachSessionCookie(res, token);
}
