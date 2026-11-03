import { NextRequest, NextResponse } from "next/server";
import { getLogo } from "@/services/settings.service";

export async function GET(req: NextRequest) {
  const logo = await getLogo();
  if (!logo) return new NextResponse(null, { status: 404 });

  const versioned = req.nextUrl.searchParams.has("v");
  return new NextResponse(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.type,
      "Content-Length": String(logo.bytes.length),
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
