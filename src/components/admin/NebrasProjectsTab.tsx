"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, ChevronLeft, Loader2, Inbox } from "lucide-react";
import { NebrasProjectDetail } from "./NebrasProjectDetail";

const STATUS_AR: Record<string, { label: string; cls: string }> = {
  intake: { label: "قيد الاستقبال", cls: "text-cyan-300" },
  planned: { label: "مخطّط", cls: "text-violet-300" },
  awaiting_confirm: { label: "بانتظار الاعتماد", cls: "text-amber-300" },
  running: { label: "قيد التنفيذ", cls: "text-emerald-300" },
  paused: { label: "متوقف", cls: "text-amber-300" },
  blocked: { label: "يتطلب تدخلك", cls: "text-rose-300" },
  failed: { label: "متعثر", cls: "text-rose-300" },
  delivered: { label: "مسلّم", cls: "text-emerald-300" },
  cancelled: { label: "ملغى", cls: "text-ink-dim" },
};

export function NebrasProjectsTab() {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/projects", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setProjects(d.projects ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (selected !== null) {
    return <NebrasProjectDetail projectId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-ink-dim">
        كل المشاريع القادمة من نموذج «اطلب مشروعك» — تحديث حي كل 5 ثوانٍ من حالة قاعدة البيانات الفعلية.
      </p>
      {loading && projects.length === 0 ? (
        <div className="flex justify-center py-16 text-ink-dim">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-soft rounded-3xl border-dashed p-14 text-center">
          <Inbox size={32} className="mx-auto text-ink-dim/50" />
          <p className="mt-3 text-sm text-ink-dim">لا توجد مشاريع NEBRAS بعد — أول طلب من النموذج سيظهر هنا فور تحليله.</p>
        </div>
      ) : (
        projects.map((p) => {
          const st = STATUS_AR[String(p.status)] ?? STATUS_AR.planned;
          return (
            <button
              key={Number(p.id)}
              onClick={() => setSelected(Number(p.id))}
              className="glass card-hover flex w-full flex-wrap items-center gap-4 rounded-3xl p-6 text-start"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/10 text-cyan-200">
                <FolderOpen size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-black text-white">{String(p.title)}</span>
                  <span className={`text-[11px] font-bold ${st.cls}`}>
                    {st.label}
                    {p.status === "running" && <span className="ms-1 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400 align-middle" />}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-ink-dim">
                  <span dir="ltr" className="font-mono text-cyan-300">{String(p.code)}</span>
                  <span>{String(p.clientName)}</span>
                  <span>نوع: {String(p.type)}</span>
                  <span>مهام: {Number(p.tasksDone)}/{Number(p.tasksTotal)} منجزة</span>
                  {Number(p.tasksFailed) > 0 && <span className="font-bold text-rose-300">{Number(p.tasksFailed)} فاشلة</span>}
                  {p.eta ? <span>التسليم: {new Date(String(p.eta)).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} (ثقة {Number(p.etaConfidence)}%)</span> : null}
                </div>
                <div className="mt-2 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400 transition-all duration-700" style={{ width: `${Number(p.progress)}%` }} />
                </div>
              </div>
              <ChevronLeft size={16} className="text-ink-dim" />
            </button>
          );
        })
      )}
    </div>
  );
}
