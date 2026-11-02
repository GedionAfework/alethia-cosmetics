export const PERMISSIONS = [
  {
    code: "dashboard:read",
    label: "View dashboard",
    group: "Shop",
    description: "See today's totals and the stock summary.",
  },
  {
    code: "inventory:read",
    label: "View inventory",
    group: "Inventory",
    description: "See products, prices, and stock.",
  },
  {
    code: "inventory:manage",
    label: "Manage inventory",
    group: "Inventory",
    description: "Add, edit, and remove products and prices.",
  },
  {
    code: "stock:receive",
    label: "Receive stock",
    group: "Inventory",
    description: "Record a delivery and increase the on-hand balance.",
  },
  {
    code: "alert:read",
    label: "View stock alerts",
    group: "Inventory",
    description: "See low and out-of-stock items, and get those Telegram alerts.",
  },
  {
    code: "ledger:read",
    label: "View daily sales",
    group: "Sales",
    description: "See every sale for a day and export it.",
  },
  {
    code: "report:read",
    label: "View monthly reports",
    group: "Sales",
    description: "See monthly totals, the chart, and exports.",
  },
  {
    code: "sale:create",
    label: "Take sales",
    group: "Register",
    description: "Use the register, deduct stock, and print a receipt.",
  },
  {
    code: "sale:read-own",
    label: "View own sales",
    group: "Register",
    description: "See the sales this person recorded.",
  },
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number]["code"];

export const ADMIN_PERMISSIONS: PermissionCode[] = PERMISSIONS.map((item) => item.code);

export const EMPLOYEE_PERMISSIONS: PermissionCode[] = ["sale:create", "sale:read-own"];

const permissionSet = new Set<string>(ADMIN_PERMISSIONS);

export function isPermissionCode(value: string): value is PermissionCode {
  return permissionSet.has(value);
}

export function selectedPermissions(values: string[]): PermissionCode[] {
  return ADMIN_PERMISSIONS.filter((code) => values.includes(code));
}

export function permissionLabel(code: string) {
  return PERMISSIONS.find((item) => item.code === code)?.label ?? code;
}

export function permissionsByGroup() {
  const groups: { group: string; items: (typeof PERMISSIONS)[number][] }[] = [];
  for (const item of PERMISSIONS) {
    let bucket = groups.find((group) => group.group === item.group);
    if (!bucket) {
      bucket = { group: item.group, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(item);
  }
  return groups;
}
