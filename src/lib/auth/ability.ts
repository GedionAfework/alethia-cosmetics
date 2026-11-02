import { AbilityBuilder, createMongoAbility, type ForcedSubject, type MongoAbility, type RawRuleOf } from "@casl/ability";

export type Actions = "manage" | "create" | "read" | "update" | "delete";

export type SaleSubject = { employeeId: string } & ForcedSubject<"Sale">;

export type Subjects =
  | "Dashboard"
  | "Inventory"
  | "StockReceipt"
  | "Alert"
  | "SalesLedger"
  | "Report"
  | "Sale"
  | SaleSubject
  | "User"
  | "Role"
  | "Settings"
  | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilityFor(user: { id: string; permissions: string[]; isSuperAdmin?: boolean }) {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user.isSuperAdmin) {
    can("manage", "all");
    return build();
  }

  for (const permission of user.permissions) {
    switch (permission) {
      case "dashboard:read":
        can("read", "Dashboard");
        break;
      case "inventory:read":
        can("read", "Inventory");
        break;
      case "inventory:manage":
        can("manage", "Inventory");
        break;
      case "stock:receive":
        can("create", "StockReceipt");
        break;
      case "alert:read":
        can("read", "Alert");
        break;
      case "ledger:read":
        can("read", "SalesLedger");
        break;
      case "report:read":
        can("read", "Report");
        break;
      case "sale:create":
        can("create", "Sale");
        break;
      case "sale:read-own":
        can("read", "Sale", { employeeId: user.id });
        break;
      default:
        break;
    }
  }

  return build();
}

export function homePath(ability: AppAbility) {
  if (ability.can("read", "Dashboard")) return "/admin";
  if (ability.can("read", "Inventory")) return "/admin/inventory";
  if (ability.can("create", "StockReceipt")) return "/admin/receive";
  if (ability.can("read", "Alert")) return "/admin/alerts";
  if (ability.can("read", "SalesLedger")) return "/admin/sales";
  if (ability.can("read", "Report")) return "/admin/reports";
  if (ability.can("manage", "User")) return "/admin/users";
  if (ability.can("manage", "Role")) return "/admin/roles";
  if (ability.can("manage", "Settings")) return "/account/settings";
  if (ability.can("create", "Sale")) return "/pos";
  if (ability.can("read", "Sale")) return "/pos/sales";
  return "/account";
}

export function canEnterOffice(ability: AppAbility) {
  return homePath(ability).startsWith("/admin");
}

export function abilityFromRules(rules: RawRuleOf<AppAbility>[]) {
  return createMongoAbility<AppAbility>(rules);
}
