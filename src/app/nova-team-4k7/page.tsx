import { redirect } from "next/navigation";
import { getStaffSessionId } from "@/lib/auth";
import { ensureDefaultStaff } from "@/lib/staff";
import { STAFF_PORTAL_PATH } from "@/lib/site";
import { StaffLoginForm } from "@/components/staff/StaffLoginForm";

export const dynamic = "force-dynamic";

export default async function StaffLoginPage() {
  await ensureDefaultStaff();
  if (await getStaffSessionId()) {
    redirect(`${STAFF_PORTAL_PATH}/workspace`);
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <StaffLoginForm portal={STAFF_PORTAL_PATH} />
    </main>
  );
}
