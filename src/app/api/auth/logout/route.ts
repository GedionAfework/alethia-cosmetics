import { NextRequest, NextResponse } from "next/server";
import { clearSessionOn } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  return clearSessionOn(res);
}
