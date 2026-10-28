"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ClipboardList,
  Play,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Lock,
  Inbox,
} from "lucide-react";
import { NovaMark } from "@/components/site/Logo";
import type { AssignmentStatus } from "@/lib/site";

interface TaskItem {
  id: number;
  title: string;
  instructions: string | null;
  output: string | null;
  adminNote: string | null;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  orderId: number | null;
  clientName: string | null;
  phone: string | null;
  service: string | null;
  budget: string | null;
  details: string | null;
}

const STATUS_META: Record<AssignmentStatus, { label: string; cls: string }> = {
  assigned: { label: "مهمة جديدة", cls: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30" },
  in_progress: { label: "قيد التنفيذ", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  submitted: { label: "بانتظار اعتماد الإدارة", cls: "bg-violet-400/10 text-violet-300 border-violet-400/30" },
  approved: { label: "معتمد من الإدارة", cls: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  rejected: { label: "أعيد للتصحيح", cls: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
};

const ROLE_LABEL: Record<string, string> = {
  cs: "فريق خدمة العملاء",
  marketing: "فريق التسويق",
  dev: "فريق التطوير",
};

function fmt(iso: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function StaffWorkspace({
  me,
  tasks,
  portal,
}: {
  me: { id: number; name: string; role: string; title: string | null };
  tasks: TaskItem[];
  portal: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [note, setNote] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      active: tasks.filter((t) => t.status === "assigned" || t.status === "in_progress").length,
      pending: tasks.filter((t) => t.status === "submitted").length,
      approved: tasks.filter((t) => t.status === "approved").length,
    }),
    [tasks],
  );

  async function act(id: number, action: "start" | "submit") {
    setBusy(id);
    setNote(null);
    try {
      const res = await fetch(`/api/staff/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, output: drafts[id] ?? "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "تعذر تنفيذ الإجراء");
      setNote(action === "start" ? "بدأت المهمة — نفّذها ثم سلّمها للإدارة" : "تم التسليم — في انتظار اعتماد الإدارة");
      router.refresh();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/staff/logout", { method: "POST" });
    router.replace(portal);
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 border-b border-nova-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <NovaMark size={30} />
            <div>
              <div className="font-display text-sm font-black text-white">بوابة فريق نوفا كود</div>
              <div className="text-[10px] text-ink-dim">مهامك المسندة من الإدارة — للتنفيذ فقط</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-end sm:block">
              <div className="text-xs font-black text-white">{me.name}</div>
              <div className="text-[10px] text-ink-dim">{me.title ?? ROLE_LABEL[me.role]}</div>
            </div>
            <button
              onClick={logout}
              className="glass-soft flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-300 transition hover:border-rose-400/40"
            >
              <LogOut size={14} />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-7 lg:px-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "مهام جارية", value: stats.active, tone: "text-cyan-300" },
            { label: "بانتظار الاعتماد", value: stats.pending, tone: "text-amber-300" },
            { label: "معتمدة", value: stats.approved, tone: "text-emerald-300" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <div className={`font-display text-2xl font-black ${s.tone}`}>{s.value}</div>
              <div className="mt-1 text-[11px] font-bold text-ink-dim">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-soft mt-4 flex items-start gap-3 rounded-2xl px-4 py-3">
          <Lock size={15} className="mt-0.5 shrink-0 text-violet-300" />
          <p className="text-[11px] leading-relaxed text-ink-dim">
            صلاحياتك: استلام المهمة، تنفيذها، وتسليم مخرجاتها. الاعتماد النهائي والتسعير وإرسال
            العروض للعملاء من اختصاص لوحة الإدارة فقط — لا تشارك رابط هذه البوابة مع أي شخص.
          </p>
        </div>

        {note && (
          <div className="glass mt-4 rounded-xl border-cyan-400/40 px-4 py-3 text-center text-xs font-bold text-cyan-200">
            {note}
          </div>
        )}

        <h2 className="font-display mt-7 flex items-center gap-2 text-base font-black text-white">
          <ClipboardList size={17} className="text-cyan-300" />
          المهام المسندة إليك ({tasks.length})
        </h2>

        <div className="mt-4 space-y-4">
          {tasks.length === 0 && (
            <div className="glass-soft rounded-3xl border-dashed p-12 text-center">
              <Inbox size={32} className="mx-auto text-ink-dim/50" />
              <p className="mx-auto mt-4 max-w-sm text-sm text-ink-dim">
                لا توجد مهام مسندة إليك حالياً. عندما يُسند لك المطور مهمة من لوحة الإدارة ستظهر
                هنا فوراً مع كل تفاصيل العميل المطلوبة.
              </p>
            </div>
          )}

          {tasks.map((t) => {
            const sm = STATUS_META[t.status];
            const editable = t.status === "assigned" || t.status === "in_progress" || t.status === "rejected";
            return (
              <article key={t.id} className="glass rounded-3xl p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-black text-white sm:text-base">{t.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-dim">
                      <Clock size={11} /> من الإدارة — {fmt(t.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${sm.cls}`}>
                    {sm.label}
                  </span>
                </div>

                {t.instructions && (
                  <div className="mt-4 rounded-2xl bg-violet-500/8 p-4">
                    <div className="text-[10px] font-black text-violet-300">تعليمات المطور</div>
                    <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink">
                      {t.instructions}
                    </p>
                  </div>
                )}

                {t.clientName && (
                  <div className="glass-soft mt-3 rounded-2xl p-4">
                    <div className="text-[10px] font-black text-cyan-300">بيانات العميل للتنفيذ</div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-ink-dim">
                      <span className="flex items-center gap-1.5">
                        <User size={11} /> {t.clientName}
                      </span>
                      <span className="flex items-center gap-1.5" dir="ltr">
                        <Phone size={11} /> {t.phone}
                      </span>
                      {t.budget && <span>الميزانية: {t.budget}</span>}
                    </div>
                    {t.service && (
                      <div className="mt-2 inline-block rounded-lg bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-200">
                        {t.service}
                      </div>
                    )}
                    {t.details && (
                      <p className="mt-2.5 whitespace-pre-line rounded-xl bg-nova-950/50 p-3 text-[12px] leading-relaxed text-ink">
                        {t.details}
                      </p>
                    )}
                  </div>
                )}

                {t.adminNote && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-rose-300" />
                    <p className="text-[12px] leading-relaxed text-rose-200">
                      <span className="font-black">ملاحظة الإدارة: </span>
                      {t.adminNote}
                    </p>
                  </div>
                )}

                {t.output && (
                  <details className="group mt-3">
                    <summary className="glass-soft cursor-pointer list-none rounded-xl px-4 py-2.5 text-[11px] font-bold text-cyan-200">
                      مخرجاتك المسلَّمة
                    </summary>
                    <pre className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-nova-950/70 p-4 font-sans text-[12px] leading-relaxed text-ink">
                      {t.output}
                    </pre>
                  </details>
                )}

                {t.status === "approved" && (
                  <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-[12px] font-bold text-emerald-300">
                    <CheckCircle2 size={14} /> تم اعتماد عملك من الإدارة — شكراً لك.
                  </p>
                )}

                {editable && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={drafts[t.id] ?? t.output ?? ""}
                      onChange={(e) => setDrafts((p) => ({ ...p, [t.id]: e.target.value }))}
                      rows={4}
                      className="field resize-none text-[13px]"
                      placeholder="اكتب ردك/مخرجاتك هنا: الرد النهائي على العميل، المحتوى المكتوب، أو ملاحظات التنفيذ..."
                    />
                    <div className="flex flex-wrap gap-2">
                      {t.status === "assigned" && (
                        <button
                          disabled={busy !== null}
                          onClick={() => act(t.id, "start")}
                          className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold text-amber-200 transition hover:border-amber-400/40 disabled:opacity-40"
                        >
                          {busy === t.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                          ابدأ التنفيذ
                        </button>
                      )}
                      <button
                        disabled={busy !== null}
                        onClick={() => act(t.id, "submit")}
                        className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black text-white disabled:opacity-50"
                      >
                        {busy === t.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        تسليم للإدارة للاعتماد
                      </button>
                    </div>
                  </div>
                )}

                {t.status === "submitted" && (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2.5 text-[12px] font-bold text-violet-200">
                    <Clock size={14} /> سلّمت المهمة — في انتظار مراجعة المطور واعتماده.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
