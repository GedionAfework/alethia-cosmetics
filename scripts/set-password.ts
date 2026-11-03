/**
 * Set (or reset) a website login password.
 *
 *   npx tsx scripts/set-password.ts <username> <password>
 *
 * Uses DATABASE_URL from the environment, falling back to .env. To target production:
 *
 *   DATABASE_URL="postgresql://…neon…" npx tsx scripts/set-password.ts admin "new-strong-password"
 *
 * If the user does not exist it is created as a Super Admin with the "Admin" role.
 * Nothing else (products, sales, other users) is touched.
 */
import "../prisma/load-env";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ADMIN_PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
  const [rawUsername, password] = process.argv.slice(2);
  const username = (rawUsername || "").trim().toLowerCase();
  if (!username || !password) {
    console.error("Usage: npx tsx scripts/set-password.ts <username> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Use a password of at least 8 characters.");
    process.exit(1);
  }

  const host = (process.env.DATABASE_URL || "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Database host: ${host || "(not set)"}`);

  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, isActive: true } });
    console.log(`Password updated for "${username}" (Super Admin: ${existing.isSuperAdmin}).`);
    return;
  }

  let role = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: "Admin",
        description: "Full shop access. Super Admin status is separate.",
        permissions: { create: ADMIN_PERMISSIONS.map((permission) => ({ permission })) },
      },
    });
  }
  await prisma.user.create({
    data: {
      name: "Aletheia Admin",
      username,
      passwordHash,
      roleId: role.id,
      isSuperAdmin: true,
      isActive: true,
    },
  });
  console.log(`Created Super Admin "${username}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
