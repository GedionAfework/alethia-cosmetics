/**
 * Set (or reset) a website login password.
 *
 *   npx tsx scripts/set-password.ts <username> <password> [role]
 *
 * Uses DATABASE_URL from the environment, falling back to .env. To target production:
 *
 *   DATABASE_URL="postgresql://…neon…" npx tsx scripts/set-password.ts admin "new-strong-password"
 *
 * If the user does not exist it is created with [role] (default "Admin"). An "Admin" user is
 * made Super Admin; any other role (e.g. "Employee") is a regular staff account.
 * Nothing else (products, sales, other users) is touched.
 */
import "../prisma/load-env";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ADMIN_PERMISSIONS, EMPLOYEE_PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
  const [rawUsername, password, rawRole] = process.argv.slice(2);
  const roleName = (rawRole || "Admin").trim();
  const isAdmin = roleName.toLowerCase() === "admin";
  const username = (rawUsername || "").trim().toLowerCase();
  if (!username || !password) {
    console.error("Usage: npx tsx scripts/set-password.ts <username> <password> [role]");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Use a password of at least 6 characters.");
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

  let role = await prisma.role.findFirst({ where: { name: { equals: roleName, mode: "insensitive" } } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: isAdmin ? "Admin" : roleName,
        description: isAdmin ? "Full shop access. Super Admin status is separate." : "Take sales and view their own receipts.",
        permissions: {
          create: (isAdmin ? ADMIN_PERMISSIONS : EMPLOYEE_PERMISSIONS).map((permission) => ({ permission })),
        },
      },
    });
  }
  await prisma.user.create({
    data: {
      name: isAdmin ? "Aletheia Admin" : username.charAt(0).toUpperCase() + username.slice(1),
      username,
      passwordHash,
      roleId: role.id,
      isSuperAdmin: isAdmin,
      isActive: true,
    },
  });
  console.log(`Created "${username}" with role ${role.name}${isAdmin ? " (Super Admin)" : ""}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
