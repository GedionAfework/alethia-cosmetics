import { prisma } from "@/lib/db/prisma";

export const LOGO_MAX_BYTES = 900 * 1024;

const SIGNATURES: { type: string; matches: (b: Buffer) => boolean }[] = [
  { type: "image/png", matches: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: "image/jpeg", matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/webp",
    matches: (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
];

/** Detect the image type from its bytes. SVG and anything else is rejected. */
function sniffImageType(bytes: Buffer) {
  return SIGNATURES.find((sig) => sig.matches(bytes))?.type ?? null;
}

export async function saveLogo(bytes: Buffer) {
  if (bytes.length === 0) throw new Error("Use a PNG, JPG or WebP image.");
  if (bytes.length > LOGO_MAX_BYTES) throw new Error("Image must be under 1 MB.");
  const type = sniffImageType(bytes);
  if (!type) throw new Error("Use a PNG, JPG or WebP image.");

  await prisma.shopSettings.upsert({
    where: { id: 1 },
    create: { id: 1, logo: bytes, logoType: type },
    update: { logo: bytes, logoType: type },
  });
}

export async function removeLogo() {
  await prisma.shopSettings.upsert({
    where: { id: 1 },
    create: { id: 1, logo: null, logoType: null },
    update: { logo: null, logoType: null },
  });
}

export async function getLogo() {
  const row = await prisma.shopSettings.findUnique({
    where: { id: 1 },
    select: { logo: true, logoType: true, updatedAt: true },
  });
  if (!row?.logo || !row.logoType) return null;
  return { bytes: row.logo, type: row.logoType, updatedAt: row.updatedAt };
}

/** Cache-busting URL for the current logo, or null when none is set. */
export async function getLogoUrl() {
  try {
    const row = await prisma.shopSettings.findFirst({
      where: { id: 1, logo: { not: null } },
      select: { updatedAt: true },
    });
    return row ? `/api/logo?v=${row.updatedAt.getTime()}` : null;
  } catch {
    // Table missing (migration not applied yet) or DB hiccup: fall back to the letter mark.
    return null;
  }
}
