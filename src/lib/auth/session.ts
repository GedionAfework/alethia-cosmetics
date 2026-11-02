import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { defineAbilityFor, homePath } from "@/lib/auth/ability";
import { prisma } from "@/lib/db/prisma";

export const COOKIE_NAME = "alethia_cosmo_session";

export type SessionPayload = {
  userId: string;
  username: string;
};

export type AppUser = {
  id: string;
  name: string;
  username: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  isSuperAdmin: boolean;
  isActive: boolean;
  telegramUsername: string | null;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || !payload.username) return null;
    return {
      userId: String(payload.userId),
      username: String(payload.username),
    };
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export function clearSessionOn(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { role: { include: { permissions: true } } },
  });
  if (!user || !user.isActive) return null;
  return toAppUser(user);
}

export function toAppUser(user: {
  id: string;
  name: string;
  username: string;
  roleId: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  telegramUsername: string | null;
  role: { name: string; permissions: { permission: string }[] };
}): AppUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((row) => row.permission),
    isSuperAdmin: user.isSuperAdmin,
    isActive: user.isActive,
    telegramUsername: user.telegramUsername,
  };
}

export async function issueSession(user: {
  id: string;
  username: string;
  isSuperAdmin?: boolean;
  role: { permissions: { permission: string }[] };
}) {
  const token = await createSessionToken({ userId: user.id, username: user.username });
  const ability = defineAbilityFor({
    id: user.id,
    permissions: user.role.permissions.map((row) => row.permission),
    isSuperAdmin: user.isSuperAdmin,
  });
  return { token, home: homePath(ability) };
}
