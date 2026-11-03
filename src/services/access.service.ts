import { Prisma } from "@prisma/client";
import type { PermissionCode } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const TELEGRAM_USERNAME = /^[a-zA-Z0-9_]{5,32}$/;

export async function listRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      permissions: { orderBy: { permission: "asc" } },
      _count: { select: { users: true } },
    },
  });
}

export async function teamCounts() {
  const [users, roles, superAdmins] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.user.count({ where: { isActive: true, isSuperAdmin: true } }),
  ]);
  return { users, roles, superAdmins };
}

export async function getRole(id: string) {
  return prisma.role.findUnique({
    where: { id },
    include: { permissions: true, _count: { select: { users: true } } },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ name: "asc" }],
    include: { role: true, _count: { select: { sales: true } } },
  });
}

export async function listActiveStaff() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      telegramUsername: true,
      isSuperAdmin: true,
      role: { select: { name: true } },
    },
  });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { role: true, _count: { select: { sales: true } } },
  });
}

export async function createRole(input: { name: string; description: string; permissions: PermissionCode[] }) {
  const name = cleanName(input.name);
  if (input.permissions.length === 0) throw new Error("Select at least one permission.");
  try {
    return await prisma.role.create({
      data: {
        name,
        description: cleanDescription(input.description),
        permissions: { create: input.permissions.map((permission) => ({ permission })) },
      },
    });
  } catch (err) {
    throw friendly(err, "A role with that name already exists.");
  }
}

export async function updateRole(input: {
  id: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
}) {
  if (input.permissions.length === 0) throw new Error("Select at least one permission.");
  const role = await prisma.role.findUnique({ where: { id: input.id } });
  if (!role) throw new Error("Role not found.");

  try {
    await prisma.$transaction([
      prisma.role.update({
        where: { id: role.id },
        data: { name: cleanName(input.name), description: cleanDescription(input.description) },
      }),
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: input.permissions.map((permission) => ({ roleId: role.id, permission })),
      }),
    ]);
  } catch (err) {
    throw friendly(err, "A role with that name already exists.");
  }
}

export async function deleteRole(id: string) {
  const users = await prisma.user.count({ where: { roleId: id } });
  if (users > 0) throw new Error("Move everyone off this role before deleting it.");
  try {
    await prisma.role.delete({ where: { id } });
  } catch {
    throw new Error("Role not found.");
  }
}

export async function createUser(input: {
  name: string;
  roleId: string;
  telegramUsername: string;
  isSuperAdmin?: boolean;
}) {
  if (input.name.trim().length < 2) throw new Error("Enter the person's name.");
  const telegramUsername = cleanTelegramRequired(input.telegramUsername);
  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) throw new Error("Choose a role. Create one first if the list is empty.");

  const username = await uniqueUsername(telegramUsername);

  try {
    return await prisma.user.create({
      data: {
        name: input.name.trim(),
        username,
        roleId: role.id,
        telegramUsername,
        isSuperAdmin: Boolean(input.isSuperAdmin),
        passwordHash: null,
      },
    });
  } catch (err) {
    throw friendly(err, "That Telegram username is already on the staff list.");
  }
}

export async function updateUser(input: {
  id: string;
  actorId: string;
  name: string;
  roleId: string;
  telegramUsername: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
}) {
  if (input.name.trim().length < 2) throw new Error("Enter the person's name.");
  if (input.id === input.actorId && !input.isActive) {
    throw new Error("You cannot deactivate your own account.");
  }

  const current = await prisma.user.findUnique({ where: { id: input.id } });
  if (!current) throw new Error("User not found.");
  const nextRole = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!nextRole) throw new Error("Choose a role.");

  const telegramUsername = cleanTelegramRequired(input.telegramUsername);
  const nextIsSuperAdmin = input.isSuperAdmin ?? current.isSuperAdmin;

  if (input.id === input.actorId && current.isSuperAdmin && !nextIsSuperAdmin) {
    throw new Error("Use Settings to hand off Super Admin. You cannot remove it from yourself here.");
  }
  if (input.id === input.actorId && current.isSuperAdmin && !input.isActive) {
    throw new Error("Hand off Super Admin in Settings before deactivating your account.");
  }

  if (current.isSuperAdmin && current.isActive && (!nextIsSuperAdmin || !input.isActive)) {
    await assertAnotherSuperAdmin(current.id);
  }

  try {
    return await prisma.user.update({
      where: { id: current.id },
      data: {
        name: input.name.trim(),
        roleId: nextRole.id,
        telegramUsername,
        isActive: input.isActive,
        isSuperAdmin: nextIsSuperAdmin,
      },
    });
  } catch (err) {
    throw friendly(err, "That Telegram username is already on the staff list.");
  }
}

export async function grantSuperAdmin(input: { actorId: string; targetId: string }) {
  if (input.actorId === input.targetId) {
    throw new Error("You already have Super Admin.");
  }
  const target = await prisma.user.findUnique({ where: { id: input.targetId } });
  if (!target || !target.isActive) throw new Error("Choose an active staff member.");
  if (target.isSuperAdmin) throw new Error("That person is already a Super Admin.");

  return prisma.user.update({
    where: { id: target.id },
    data: { isSuperAdmin: true },
  });
}

export async function transferSuperAdmin(input: {
  actorId: string;
  targetId: string;
  confirmTelegramUsername: string;
}) {
  if (input.actorId === input.targetId) {
    throw new Error("Choose someone else to receive Super Admin.");
  }

  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.actorId } }),
    prisma.user.findUnique({ where: { id: input.targetId } }),
  ]);
  if (!actor?.isSuperAdmin || !actor.isActive) {
    throw new Error("Only an active Super Admin can hand off access.");
  }
  if (!target || !target.isActive) throw new Error("Choose an active staff member.");

  const confirm = cleanTelegramRequired(input.confirmTelegramUsername);
  if (!target.telegramUsername || target.telegramUsername !== confirm) {
    throw new Error("Type their Telegram username exactly to confirm the handoff.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { isSuperAdmin: true } }),
    prisma.user.update({ where: { id: actor.id }, data: { isSuperAdmin: false } }),
  ]);

  return target;
}

async function assertAnotherSuperAdmin(excludeId: string) {
  const others = await prisma.user.count({
    where: { isActive: true, isSuperAdmin: true, id: { not: excludeId } },
  });
  if (others === 0) {
    throw new Error("Keep at least one active Super Admin, or hand off access in Settings first.");
  }
}

async function uniqueUsername(telegramUsername: string) {
  const base = telegramUsername.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 28) || "staff";
  let candidate = base.length >= 3 ? base : `${base}user`;
  for (let i = 0; i < 20; i++) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    candidate = `${base.slice(0, 24)}${i + 2}`;
  }
  return `${base.slice(0, 20)}${Date.now().toString(36)}`;
}

function cleanName(value: string) {
  const name = value.trim();
  if (name.length < 2) throw new Error("Enter a role name.");
  if (name.length > 40) throw new Error("Role name must be 40 characters or fewer.");
  return name;
}

function cleanDescription(value: string) {
  const description = value.trim();
  return description || null;
}

function cleanTelegramRequired(value: string) {
  const cleaned = value.trim().replace(/^@/, "").toLowerCase();
  if (!TELEGRAM_USERNAME.test(cleaned)) {
    throw new Error("Telegram username must be 5–32 characters: letters, numbers, or underscores.");
  }
  return cleaned;
}

function friendly(err: unknown, uniqueMessage: string) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return new Error(uniqueMessage);
  }
  return err instanceof Error ? err : new Error("Could not save.");
}
