import { AppFrame } from "@/components/layout/app-frame";
import { requirePage } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const access = await requirePage(() => true);
  return <AppFrame access={access}>{children}</AppFrame>;
}
