import { RoleEditor } from "@/components/admin/role-editor";

export const dynamic = "force-dynamic";

export default async function EditRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  return <RoleEditor id={id} error={error} />;
}
