import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, devTasks, marketingPosts, chatMessages, csDirectives } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    redirect("/nova-ctrl-9x82");
  }

  const [ordersRows, devRows, marketingRows, chatRows, directiveRows] =
    await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200),
      db.select().from(devTasks).orderBy(desc(devTasks.createdAt)).limit(200),
      db.select().from(marketingPosts).orderBy(desc(marketingPosts.createdAt)).limit(100),
      db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(60),
      db.select().from(csDirectives).orderBy(desc(csDirectives.createdAt)).limit(100),
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
      chats={chatRows.map((c) => ({
        id: c.id,
        sessionId: c.sessionId,
        agentName: c.agentName,
        role: c.role,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      }))}
      directives={directiveRows.map((d) => ({
        id: d.id,
        target: d.target,
        title: d.title,
        content: d.content,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
