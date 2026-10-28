import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  devTasks,
  marketingPosts,
  chatMessages,
  staff,
  assignments,
} from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    redirect("/nova-ctrl-9x82");
  }

  const [ordersRows, devRows, marketingRows, chatRows, staffRows, assignmentRows] =
    await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200),
    db.select().from(devTasks).orderBy(desc(devTasks.createdAt)).limit(200),
    db.select().from(marketingPosts).orderBy(desc(marketingPosts.createdAt)).limit(100),
    db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(60),
    db.select().from(staff).orderBy(desc(staff.createdAt)).limit(100),
    db.select().from(assignments).orderBy(desc(assignments.createdAt)).limit(200),
  ]);

  return (
    <AdminShell
      orders={ordersRows.map((o) => ({
        id: o.id,
        clientName: o.clientName,
        phone: o.phone,
        service: o.service,
        budget: o.budget,
        details: o.details,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      }))}
      devTasks={devRows.map((t) => ({
        id: t.id,
        orderId: t.orderId,
        title: t.title,
        content: t.content,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      }))}
      marketing={marketingRows.map((m) => ({
        id: m.id,
        agentName: m.agentName,
        platform: m.platform,
        topic: m.topic,
        content: m.content,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      }))}
      staff={staffRows.map((s) => ({
        id: s.id,
        name: s.name,
        username: s.username,
        role: s.role,
        title: s.title,
        active: s.active,
        createdAt: s.createdAt.toISOString(),
      }))}
      assignments={assignmentRows.map((a) => ({
        id: a.id,
        staffId: a.staffId,
        orderId: a.orderId,
        title: a.title,
        instructions: a.instructions,
        output: a.output,
        adminNote: a.adminNote,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))}
      chats={chatRows.map((c) => ({
        id: c.id,
        sessionId: c.sessionId,
        agentName: c.agentName,
        role: c.role,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
