import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, issueSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { username?: string } | null;
  const username = String(body?.username || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: { include: { permissions: true } } },
  });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Unknown staff account." }, { status: 404 });
  }

  const { token, home } = await issueSession(user);
  const res = NextResponse.json({ ok: true, home });
  return attachSessionCookie(res, token);
}
