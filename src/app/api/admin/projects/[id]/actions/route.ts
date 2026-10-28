import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, approvals, projectNotes, clientMessages } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import {
  analyzeProject,
  startProject,
  pauseProject,
  resumeProject,
  cancelProject,
  logEvent,
  addClientMessage,
  reconcileStale,
} from "@/lib/nebras/engine";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const [project] = await db.select().from(projects).where(eq(projects.id, pid)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }
  const body = await req.json();
  const action = String(body.action ?? "");
  const note = String(body.note ?? "").trim().slice(0, 2000);

  switch (action) {
    case "analyze": {
      await reconcileStale();
      setImmediate(() => analyzeProject(pid).catch(() => {}));
      return NextResponse.json({ ok: true, message: "بدأت إعادة التحليل والخطة" });
    }
    case "approve": {
      await db.insert(approvals).values({ projectId: pid, type: "scope", decision: "approved", by: "المطور", note: note || null });
      await addClientMessage(
        pid,
        "system",
        `تم اعتماد النطاق والتكلفة من الإدارة${note ? ` — ملاحظة: ${note}` : ""}. سيبدأ التنفيذ فور الضغط على «بدء التنفيذ» في اللوحة.`,
      );
      await logEvent(pid, "approval", "اعتمد المطور النطاق والتكلفة والشروط.", { actor: "المطور", meta: { note: note || undefined } });
      return NextResponse.json({ ok: true, message: "تم اعتماد النطاق والتكلفة" });
    }
    case "start": {
      const r = await startProject(pid);
      return r.ok
        ? NextResponse.json({ ok: true, message: "انطلق التنفيذ" })
        : NextResponse.json({ ok: false, error: r.error }, { status: 409 });
    }
    case "pause": {
      const r = await pauseProject(pid);
      return r.ok
        ? NextResponse.json({ ok: true, message: "تم الإيقاف المؤقت" })
        : NextResponse.json({ ok: false, error: r.error }, { status: 409 });
    }
    case "resume": {
      const r = await resumeProject(pid);
      return r.ok
        ? NextResponse.json({ ok: true, message: "تم الاستئناف" })
        : NextResponse.json({ ok: false, error: r.error }, { status: 409 });
    }
    case "cancel": {
      const r = await cancelProject(pid);
      return r.ok
        ? NextResponse.json({ ok: true, message: "تم الإلغاء" })
        : NextResponse.json({ ok: false, error: r.error }, { status: 409 });
    }
    case "instruction": {
      if (note.length < 5) {
        return NextResponse.json({ error: "اكتب التوجيه أولاً" }, { status: 400 });
      }
      await db.insert(projectNotes).values({ projectId: pid, from: "dev", content: note });
      await logEvent(pid, "instruction", "توجيه جديد من المطور للعقل المركزي: " + note.slice(0, 160), { actor: "المطور" });
      return NextResponse.json({ ok: true, message: "سيُطبق التوجيه من المهمة القادمة" });
    }
    default:
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
}
