import { requirePage } from "@/lib/auth/access";

export default async function ReportsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("read", "Report"));
  return children;
}
