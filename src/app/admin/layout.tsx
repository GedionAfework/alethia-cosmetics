import { AppFrame } from "@/components/layout/app-frame";
import { requireOffice } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireOffice();
  return <AppFrame access={access}>{children}</AppFrame>;
}
