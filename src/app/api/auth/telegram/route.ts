import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, issueSession } from "@/lib/auth/session";
import { validateWebAppInitData } from "@/lib/telegram/validate";
import { linkTelegramAccount } from "@/services/inventory.service";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { initData?: string } | null;
  const initData = body?.initData;
  if (!initData) {
    return NextResponse.json({ error: "Missing Telegram data." }, { status: 400 });
  }

  const tgUser = validateWebAppInitData(initData);
  if (!tgUser) {
    return NextResponse.json({ error: "Invalid Telegram login." }, { status: 401 });
  }

  const user = await linkTelegramAccount(tgUser);
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "This Telegram account is not on the staff list." },
      { status: 403 }
    );
  }

  const { token, home } = await issueSession(user);
  const res = NextResponse.json({ ok: true, home });
  return attachSessionCookie(res, token);
}
