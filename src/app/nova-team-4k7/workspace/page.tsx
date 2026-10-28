import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments, orders, staff } from "@/db/schema";
import { getStaffSessionId } from "@/lib/auth";
import { STAFF_PORTAL_PATH } from "@/lib/site";
import { StaffWorkspace } from "@/components/staff/StaffWorkspace";

export const dynamic = "force-dynamic";

export default async function StaffWorkspacePage() {
  const staffId = await getStaffSessionId();
  if (!staffId) redirect(STAFF_PORTAL_PATH);

  const [me] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.active, true)))
    .limit(1);

  if (!me) redirect(STAFF_PORTAL_PATH);

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      instructions: assignments.instructions,
      output: assignments.output,
      adminNote: assignments.adminNote,
      status: assignments.status,
      createdAt: assignments.createdAt,
      updatedAt: assignments.updatedAt,
      orderId: assignments.orderId,
      clientName: orders.clientName,
      phone: orders.phone,
      service: orders.service,
      budget: orders.budget,
      details: orders.details,
    })
    .from(assignments)
    .leftJoin(orders, eq(assignments.orderId, orders.id))
    .where(eq(assignments.staffId, staffId))
    .orderBy(desc(assignments.createdAt))
    .limit(100);

  return (
    <StaffWorkspace
      portal={STAFF_PORTAL_PATH}
      me={{ id: me.id, name: me.name, role: me.role, title: me.title }}
      tasks={rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
    />
  );
}
