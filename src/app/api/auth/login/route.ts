import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, issueSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit(`login:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!username || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: { include: { permissions: true } } },
  });
  const match = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !user.isActive || !match) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const { token, home } = await issueSession(user);
  const res = NextResponse.json({ ok: true, home });
  return attachSessionCookie(res, token);
}
