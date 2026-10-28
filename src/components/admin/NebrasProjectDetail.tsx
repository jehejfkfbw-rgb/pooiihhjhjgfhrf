"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Cpu,
  CheckCircle2,
  X,
  Loader2,
  FileCode2,
  Terminal,
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  Gauge,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

type Tab = "tasks" | "files" | "events" | "tests" | "messages" | "estimates" | "usage";

const STATUS_AR: Record<string, { label: string; cls: string }> = {
  intake: { label: "قيد الاستقبال", cls: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30" },
  needs_info: { label: "بانتظار معلومات", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  planned: { label: "مخطّط", cls: "bg-violet-400/10 text-violet-300 border-violet-400/30" },
  awaiting_confirm: { label: "بانتظار اعتماد النطاق", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  running: { label: "قيد التنفيذ", cls: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  paused: { label: "متوقف مؤقتاً", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  blocked: { label: "يتطلب تدخل المطور", cls: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
  delivered: { label: "تم التسليم", cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40" },
  cancelled: { label: "ملغى", cls: "bg-white/5 text-ink-dim border-white/15" },
  failed: { label: "متعثر", cls: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
};

const TASK_AR: Record<string, string> = {
  queued: "في الطابور",
  running: "قيد التنفيذ",
  done: "منجزة ✓",
  failed: "فاشلة",
  skipped: "مُسقطة",
};

function fmtDT(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));
}

export function NebrasProjectDetail({
  projectId,
  onBack,
}: {
  projectId: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>("tasks");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [selFile, setSelFile] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/projects/${projectId}`, { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch {
      // ignore poll errors
    }
  }, [projectId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(action: string, note = "") {
    setBusy(action);
    try {
      const r = await fetch(`/api/admin/projects/${projectId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const d = await r.json();
      setToast(r.ok ? (d.message ?? "تم") : d.error ?? "فشل الإجراء");
      await load();
    } catch {
      setToast("خطأ في الاتصال");
    } finally {
      setBusy(null);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-dim">
        <Loader2 className="animate-spin" size={22} />
        <span className="ms-3 text-sm">جارٍ تحميل المشروع...</span>
      </div>
    );
  }

  const p = data.project as Record<string, unknown> & { status: string };
  const tasks = data.tasks as Record<string, unknown>[];
  const files = data.files as Record<string, unknown>[];
  const events = data.events as Record<string, unknown>[];
  const tests = data.tests as Record<string, unknown>[];
  const messages = data.messages as Record<string, unknown>[];
  const estimates = data.estimates as Record<string, unknown>[];
  const usage = data.usage as Record<string, unknown>[];
  const st = STATUS_AR[p.status] ?? STATUS_AR.planned;
  const progress = Number(p.progress) || 0;
  const activeFile = files.find((f) => f.path === selFile);

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "tasks", label: `المهام (${tasks.length})`, icon: ClipboardCheck },
    { id: "files", label: `الملفات (${files.length})`, icon: FileCode2 },
    { id: "events", label: "السجل الزمني", icon: Terminal },
    { id: "tests", label: `الاختبارات (${tests.length})`, icon: Cpu },
    { id: "messages", label: `الرسائل (${messages.length})`, icon: MessageSquare },
    { id: "estimates", label: "تقديرات التسليم", icon: TrendingUp },
    { id: "usage", label: `الاستهلاك (${usage.length})`, icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div className="glass rounded-[2rem] p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={onBack} className="glass-soft rounded-xl p-2.5 text-ink-dim transition hover:text-white" aria-label="رجوع">
              <ArrowRight size={16} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-black text-white">{String(p.title)}</h1>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-cyan-300" dir="ltr">
                  {String(p.code)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-dim">
                العميل: {String(p.clientName)} • النوع: {String(p.type)} • أولوية: {String(p.priority)} • أُنشئ {fmtDT(p.createdAt as string)}
              </p>
            </div>
          </div>
          <div className="text-end">
            <div className="text-[11px] text-ink-dim">موعد التسليم المتوقع</div>
            <div className="font-display text-lg font-black text-cyan-300">
              {p.deliveryEta ? fmtDT(p.deliveryEta as string) : "—"}
            </div>
            <div className="text-[11px] text-ink-dim">
              ثقة {p.etaConfidence ? Number(p.etaConfidence) : "—"}% • تقدم أوزاني {progress}%
            </div>
          </div>
        </div>

        {/* شريط التقدم الأوزاني */}
        <div className="mt-5">
          <div className="h-3 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-ink-dim">
            التقدم محسوب من وزن المهام المنجزة بالاعتماد على نتائج الفحوصات الفعلية — الكتابة وحدها لا تُحسب إنجازاً.
          </p>
        </div>

        {/* أزرار التحكم */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button disabled={busy !== null} onClick={() => act("analyze")} className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-violet-200 transition hover:border-violet-400/40 disabled:opacity-40">
            {busy === "analyze" ? <Loader2 size={13} className="animate-spin" /> : <Cpu size={13} />} إعادة التحليل والخطة
          </button>
          <button disabled={busy !== null || p.status === "delivered"} onClick={() => act("approve")} className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-emerald-200 transition hover:border-emerald-400/40 disabled:opacity-40">
            <CheckCircle2 size={13} /> اعتماد النطاق والتكلفة
          </button>
          {p.status !== "running" && p.status !== "delivered" && p.status !== "cancelled" && (
            <button disabled={busy !== null} onClick={() => act("start")} className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white disabled:opacity-50">
              {busy === "start" ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} {p.status === "paused" ? "استئناف التنفيذ" : "بدء التنفيذ"}
            </button>
          )}
          {p.status === "running" && (
            <button disabled={busy !== null} onClick={() => act("pause")} className="flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2.5 text-xs font-black text-amber-300 transition hover:bg-amber-500/25 disabled:opacity-40">
              <Pause size={13} /> إيقاف مؤقت
            </button>
          )}
          {p.status !== "delivered" && p.status !== "cancelled" && (
            <button disabled={busy !== null} onClick={() => act("cancel")} className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-40">
              <XCircle size={13} /> إلغاء
            </button>
          )}
          {p.status === "cancelled" && (
            <button disabled={busy !== null} onClick={() => act("start")} className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-cyan-200 disabled:opacity-40">
              <RotateCcw size={13} /> استعادة
            </button>
          )}
        </div>

        {/* توجيه للعقل المركزي */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (instruction.trim().length < 5) return;
            act("instruction", instruction.trim());
            setInstruction("");
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="توجيه جديد للعقل المركزي بشأن هذا المشروع — يُطبَّق من المهمة القادمة..."
            className="field flex-1 !py-2.5 text-xs"
          />
          <button className="glass-soft rounded-xl px-5 text-xs font-bold text-cyan-200 transition hover:border-cyan-400/40">
            إرسال التوجيه
          </button>
        </form>
      </div>

      {/* تبويبات */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
              tab === t.id ? "bg-gradient-to-l from-violet-600 to-cyan-600 text-white" : "glass-soft text-ink-dim hover:text-white"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* المهام */}
      {tab === "tasks" && (
        <div className="space-y-2.5">
          {tasks.length === 0 && <p className="glass-soft rounded-2xl p-8 text-center text-sm text-ink-dim">لا توجد مهام بعد — شغّل «إعادة التحليل والخطة».</p>}
          {tasks.map((t, i) => (
            <div key={String(t.id)} className="glass-soft flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5">
              <span className="w-7 text-center font-mono text-xs text-ink-dim">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">{String(t.title)}</div>
                <div className="mt-0.5 flex flex-wrap gap-3 text-[10px] text-ink-dim">
                  <span>الموظف: {String(t.agentName ?? t.agentRole)}</span>
                  <span>الوزن: {Number(t.weightMin)} د</span>
                  {t.startedAt ? <span>بدأ {fmtDT(t.startedAt as string)}</span> : null}
                  {t.finishedAt ? <span>انتهى {fmtDT(t.finishedAt as string)}</span> : null}
                  <span>المحاولات: {Number(t.attempts)}/{Number(t.maxAttempts)}</span>
                </div>
                {t.error ? (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-[10px] font-bold text-rose-300">آخر فشل</summary>
                    <p className="mt-1 rounded-lg bg-rose-500/10 p-2 font-mono text-[10px] text-rose-200" dir="ltr">{String(t.error)}</p>
                  </details>
                ) : null}
                {t.outputSummary ? (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-[10px] font-bold text-cyan-300">ملخص المخرجات</summary>
                    <p className="mt-1 whitespace-pre-line rounded-lg bg-white/5 p-2 text-[11px] text-ink">{String(t.outputSummary)}</p>
                  </details>
                ) : null}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  t.status === "done"
                    ? "bg-emerald-400/15 text-emerald-300"
                    : t.status === "running"
                      ? "bg-cyan-400/15 text-cyan-300"
                      : t.status === "failed"
                        ? "bg-rose-400/15 text-rose-300"
                        : "bg-white/5 text-ink-dim"
                }`}
              >
                {TASK_AR[String(t.status)] ?? String(t.status)}
                {t.status === "running" && <span className="ms-1 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-300 align-middle" />}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* الملفات */}
      {tab === "files" && (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="glass-soft max-h-[560px] space-y-1 overflow-y-auto rounded-2xl p-3">
            {files.length === 0 && <p className="p-6 text-center text-xs text-ink-dim">لا توجد ملفات بعد — تبدأ الظهور مع أول مهمة منفذة.</p>}
            {files.map((f) => (
              <button
                key={String(f.path)}
                onClick={() => setSelFile(String(f.path))}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-xs transition ${
                  selFile === f.path ? "bg-gradient-to-l from-violet-600/40 to-cyan-600/30 text-white" : "text-ink-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="truncate font-mono" dir="ltr">{String(f.path)}</span>
                <span className="shrink-0 text-[9px] opacity-70">v{Number(f.version)} • {Number(f.size)}B</span>
              </button>
            ))}
          </div>
          <div className="glass-soft overflow-hidden rounded-2xl">
            {activeFile ? (
              <>
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <span className="font-mono text-xs text-cyan-300" dir="ltr">{String(activeFile.path)}</span>
                  <span className="text-[10px] text-ink-dim">
                    {String(activeFile.action)} • v{Number(activeFile.version)} • آخر تعديل {fmtDT(activeFile.updatedAt as string)}
                  </span>
                </div>
                <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap p-5 font-mono text-[11px] leading-relaxed text-ink" dir="ltr">
                  {String(activeFile.content)}
                </pre>
              </>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 p-10 text-ink-dim">
                <FileCode2 size={30} />
                <p className="text-xs">اختر ملفاً من القائمة لمعاينة محتواه الفعلي</p>
                <p className="text-[10px] opacity-60">النسخ السابقة محفوظة برقم الإصدار في قاعدة البيانات</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* السجل */}
      {tab === "events" && (
        <div className="space-y-2">
          {events.length === 0 && <p className="glass-soft rounded-2xl p-8 text-center text-sm text-ink-dim">لا توجد أحداث بعد.</p>}
          {events.map((e, i) => (
            <div key={i} className="glass-soft flex gap-3 rounded-2xl px-5 py-3">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  String(e.kind).includes("fail") || String(e.kind) === "error"
                    ? "bg-rose-400"
                    : String(e.kind).includes("done") || String(e.kind) === "delivery" || String(e.kind) === "approval"
                      ? "bg-emerald-400"
                      : String(e.kind).includes("start") || String(e.kind) === "log"
                        ? "bg-cyan-400"
                        : "bg-violet-400"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-dim">
                  <span className="font-bold text-white">{String(e.actor)}</span>
                  <span className="rounded bg-white/5 px-1.5 font-mono text-[9px]">{String(e.kind)}</span>
                  <span>{fmtDT(e.createdAt as string)}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink">{String(e.message)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الاختبارات */}
      {tab === "tests" && (
        <div className="space-y-2">
          <p className="text-[11px] text-ink-dim">هذه نتائج فحوصات فعلية شُغلت على الملفات (node --check، تشغيل خادم مؤقت، فحص أسرار) — لا أرقام تقديرية.</p>
          {tests.length === 0 && <p className="glass-soft rounded-2xl p-8 text-center text-sm text-ink-dim">لم تُشغَّل فحوصات بعد.</p>}
          {tests.map((t, i) => (
            <div key={i} className="glass-soft flex items-center gap-3 rounded-2xl px-5 py-3">
              {String(t.status) === "pass" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <X size={16} className="text-rose-400" />}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">{String(t.name)}</div>
                <div className="mt-0.5 font-mono text-[10px] text-ink-dim" dir="ltr">{String(t.detail ?? "")}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${t.status === "pass" ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>
                {String(t.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* الرسائل */}
      {tab === "messages" && (
        <div className="space-y-2">
          {messages.length === 0 && <p className="glass-soft rounded-2xl p-8 text-center text-sm text-ink-dim">لا رسائل بعد.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`glass-soft flex gap-3 rounded-2xl px-5 py-3 ${m.sender === "client" ? "border-cyan-400/25" : ""}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black ${m.sender === "client" ? "bg-cyan-500/20 text-cyan-200" : m.sender === "dev" ? "bg-violet-500/20 text-violet-200" : "bg-white/10 text-ink-dim"}`}>
                {m.sender === "client" ? "عم" : m.sender === "dev" ? "مط" : "نظ"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-ink-dim">
                  {m.sender === "client" ? "العميل" : m.sender === "dev" ? "المطور" : "النظام"} • {fmtDT(m.createdAt as string)}
                </div>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink">{String(m.content)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* التقديرات */}
      {tab === "estimates" && (
        <div className="space-y-2">
          {estimates.map((e, i) => (
            <div key={i} className="glass-soft rounded-2xl px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-black text-white">
                  {e.low ? fmtDT(e.low as string) : "—"} ← {e.high ? fmtDT(e.high as string) : "—"}
                </div>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-bold text-cyan-300">ثقة {Number(e.confidence)}%</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">{String(e.basis)}</p>
              <div className="mt-1 text-[10px] opacity-60">عُدّل في {fmtDT(e.at as string)}</div>
            </div>
          ))}
          {estimates.length === 0 && <p className="glass-soft rounded-2xl p-8 text-center text-sm text-ink-dim">لا تقديرات بعد التحليل.</p>}
        </div>
      )}

      {/* الاستهلاك */}
      {tab === "usage" && (
        <div className="glass-soft overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[640px] text-start text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-ink-dim">
                <th className="px-5 py-3 text-start">الدور</th>
                <th className="px-3 py-3 text-start">المزود</th>
                <th className="px-3 py-3 text-start">النموذج</th>
                <th className="px-3 py-3 text-start">حجم الاستعلام</th>
                <th className="px-3 py-3 text-start">حجم الرد</th>
                <th className="px-3 py-3 text-start">المدة</th>
                <th className="px-3 py-3 text-start">التكلفة</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u, i) => (
                <tr key={i} className="border-b border-white/5 text-ink">
                  <td className="px-5 py-3 font-bold">{String(u.roleKey)}</td>
                  <td className="px-3 py-3">{String(u.provider)}</td>
                  <td className="px-3 py-3 font-mono text-[10px]" dir="ltr">{String(u.model)}</td>
                  <td className="px-3 py-3">{Number(u.promptChars).toLocaleString()} ح</td>
                  <td className="px-3 py-3">{Number(u.completionChars).toLocaleString()} ح</td>
                  <td className="px-3 py-3">{Math.round(Number(u.durationMs) / 100) / 10} ث</td>
                  <td className="px-3 py-3">{u.costUsd != null ? `$${Number(u.costUsd).toFixed(6)}` : <span className="text-ink-dim">غير متاح</span>}</td>
                </tr>
              ))}
              {usage.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-ink-dim">لا استخدام مسجل بعد بدء التنفيذ.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-cyan-400/40 px-6 py-3.5 text-center text-sm font-bold text-cyan-200 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
