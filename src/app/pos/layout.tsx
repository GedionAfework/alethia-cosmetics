import { AppFrame } from "@/components/layout/app-frame";
import { requirePage } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const access = await requirePage(
    (ability) => ability.can("create", "Sale") || ability.can("read", "Sale") || ability.can("read", "SalesLedger")
  );
  return <AppFrame access={access}>{children}</AppFrame>;
}
