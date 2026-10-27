import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { UsersManager } from "@/components/admin/managers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة المستخدمين" };

export default async function AdminUsersPage() {
  const stageRows = await listStages();
  return <UsersManager stageOptions={stageRows.map((s) => ({ value: s.id, label: s.name }))} />;
}
