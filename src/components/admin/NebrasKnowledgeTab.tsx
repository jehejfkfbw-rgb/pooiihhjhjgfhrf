"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  BookOpen,
  ShieldCheck,
  Plus,
  X,
  Trash2,
  Check,
  Loader2,
  Database,
  Lightbulb,
  Wrench,
  Puzzle,
  GraduationCap,
  Code2,
  Star,
} from "lucide-react";

const CAT_AR: Record<string, string> = {
  concept: "مفهوم",
  guide: "دليل",
  example: "مثال",
  fix: "إصلاح خطأ",
  template: "قالب",
  doc: "توثيق",
};
const SRC_AR: Record<string, string> = {
  "official-docs": "وثائق رسمية (مرجعية)",
  "company-generated": "إنتاج NEBRAS AI",
  "open-source": "مفتوح المصدر (مرخّص)",
  "platform-tests": "اختبارات المنصة",
};

type SubTab = "kb" | "experience" | "learning";

export function NebrasKnowledgeTab() {
  const [sub, setSub] = useState<SubTab>("kb");
  const [kb, setKb] = useState<Record<string, unknown> | null>(null);
  const [exp, setExp] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadKb = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (topic) params.set("topic", topic);
    if (cat) params.set("category", cat);
    const r = await fetch(`/api/admin/kb?${params}`, { cache: "no-store" });
    if (r.ok) setKb(await r.json());
  }, [q, topic, cat]);

  const loadExp = useCallback(async () => {
    const r = await fetch("/api/admin/kb/experience", { cache: "no-store" });
    if (r.ok) setExp(await r.json());
  }, []);

  useEffect(() => {
    loadKb();
    loadExp();
  }, [loadKb, loadExp]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(id: number, action: string) {
    setBusy(`${id}-${action}`);
    const r = await fetch(`/api/admin/kb/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    setToast(r.ok ? (action === "delete" ? "حُذف المدخل" : action === "verify" ? "تم التحقق من المدخل" : "أُلغي التحقق") : "فشل");
    loadKb();
  }

  async function addEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy("add");
    const r = await fetch("/api/admin/kb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        content: fd.get("content"),
        summary: fd.get("summary"),
        topicKey: fd.get("topicKey"),
        category: fd.get("category"),
        language: fd.get("language"),
        tech: fd.get("tech"),
        code: fd.get("code"),
        source: fd.get("source"),
        license: fd.get("license"),
        tags: fd.get("tags"),
      }),
    });
    const d = await r.json().catch(() => null);
    setBusy(null);
    setToast(r.ok ? "أُضيف المدخل إلى قاعدة المعرفة" : d?.error ?? "فشل");
    if (r.ok) {
      setShowAdd(false);
      loadKb();
    }
  }

  const stats = (kb?.stats ?? {}) as Record<string, unknown>;
  const topics = (kb?.topics ?? []) as { key: string; title: string }[];
  const entries = (kb?.entries ?? []) as Record<string, unknown>[];
  const byCat = (stats.byCategory ?? []) as { category: string; c: number }[];
  const accuracy = stats.estimateAccuracy as number | null;

  return (
    <div className="space-y-6">
      {/* شريط إحصاءات */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-3xl font-black text-cyan-300">{Number(stats.total ?? 0)}</div>
          <div className="mt-1 text-[11px] font-bold text-ink-dim">مدخل معرفة موثق</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-3xl font-black text-emerald-300">{Number(stats.verified ?? 0)}</div>
          <div className="mt-1 text-[11px] font-bold text-ink-dim">محققة يدوياً من المطور</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-3xl font-black text-violet-300">{Number(stats.fixes ?? 0)}</div>
          <div className="mt-1 text-[11px] font-bold text-ink-dim">إصلاح أخطاء موثق</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-3xl font-black text-fuchsia-300">{Number(stats.components ?? 0)}</div>
          <div className="mt-1 text-[11px] font-bold text-ink-dim">مكوّن قابل لإعادة الاستخدام</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-3xl font-black text-amber-300">
            {accuracy != null ? `${Math.max(0, accuracy)}%` : "—"}
          </div>
          <div className="mt-1 text-[11px] font-bold text-ink-dim">
            دقة تقديرات المدة ({Number(stats.estimateSamples ?? 0)} مشروعاً)
          </div>
        </div>
      </div>

      {/* تبويبات فرعية */}
      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: "kb", label: "قاعدة المعرفة", icon: BookOpen },
            { id: "experience", label: "خبرات المشاريع", icon: Lightbulb },
            { id: "learning", label: "التعلم والتطوير", icon: GraduationCap },
          ] as { id: SubTab; label: string; icon: React.ComponentType<{ size?: number }> }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
              sub === t.id ? "bg-gradient-to-l from-violet-600 to-cyan-600 text-white" : "glass-soft text-ink-dim hover:text-white"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ قاعدة المعرفة ============ */}
      {sub === "kb" && (
        <>
          <div className="glass rounded-3xl p-5">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-1 gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="بحث ذكي في المعرفة: حقن SQL، RTL، CORS، فهارس..."
                  className="field flex-1 !py-2.5 text-xs"
                />
                <button onClick={loadKb} className="btn-primary flex items-center gap-2 rounded-xl px-5 text-xs font-black text-white">
                  <Search size={14} /> بحث
                </button>
              </div>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="field w-44 !py-2.5 text-xs">
                <option value="">كل المواضيع</option>
                {topics.map((t) => (
                  <option key={t.key} value={t.key}>{t.title}</option>
                ))}
              </select>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="field w-36 !py-2.5 text-xs">
                <option value="">كل التصنيفات</option>
                {Object.entries(CAT_AR).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button onClick={() => setShowAdd(!showAdd)} className="glass-soft flex items-center gap-2 rounded-xl px-4 text-xs font-bold text-emerald-300">
                {showAdd ? <X size={13} /> : <Plus size={13} />} {showAdd ? "إغلاق" : "إدخال جديد"}
              </button>
            </div>
            {byCat.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {byCat.map((c) => (
                  <button key={c.category} onClick={() => setCat(cat === c.category ? "" : c.category)} className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${cat === c.category ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-ink-dim hover:text-white"}`}>
                    {CAT_AR[c.category] ?? c.category}: {Number(c.c)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showAdd && (
            <form onSubmit={addEntry} className="glass rounded-3xl p-6">
              <h3 className="font-display text-sm font-black text-white">إدخال جديد في قاعدة المعرفة</h3>
              <p className="mt-1 text-[11px] text-ink-dim">سُجّل المصدر والترخيص — لا تنسخ محتوى محمياً دون إذن.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input name="title" required placeholder="العنوان" className="field text-xs" />
                <div className="flex gap-2">
                  <select name="topicKey" className="field flex-1 text-xs">
                    {topics.map((t) => (<option key={t.key} value={t.key}>{t.title}</option>))}
                  </select>
                  <select name="category" className="field w-28 text-xs">
                    {Object.entries(CAT_AR).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
                <input name="summary" placeholder="ملخص (سطر)" className="field text-xs" />
                <div className="flex gap-2">
                  <select name="source" className="field flex-1 text-xs">
                    {Object.entries(SRC_AR).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <input name="license" placeholder="الترخيص (مثال CC-BY-4.0)" className="field w-40 text-xs" />
                </div>
                <input name="language" placeholder="اللغة (JavaScript)" className="field text-xs" />
                <input name="tech" placeholder="التقنية" className="field text-xs" />
                <textarea name="content" required rows={3} placeholder="المحتوى الكامل (20+ حرف)" className="field text-xs" />
                <textarea name="code" rows={3} placeholder="كود (اختياري)" className="field font-mono text-[11px]" dir="ltr" />
                <input name="tags" placeholder="وسوم: sql, أداء, فهارس" className="field text-xs" />
              </div>
              <button disabled={busy === "add"} className="btn-primary mt-4 rounded-xl px-6 py-3 text-xs font-black text-white disabled:opacity-50">
                {busy === "add" ? <Loader2 size={13} className="inline animate-spin" /> : <Plus size={13} className="inline" />} إضافة إلى قاعدة المعرفة
              </button>
            </form>
          )}

          <div className="space-y-2">
            {entries.length === 0 && (
              <p className="glass-soft rounded-2xl p-8 text-center text-sm text-ink-dim">
                {q ? "لا نتائج لهذا البحث — جرّب كلمات أوسع (مثال: أمان، اختبار، node)." : "لا مدخلات."}
              </p>
            )}
            {entries.map((e) => (
              <div key={Number(e.id)} className="glass-soft rounded-2xl">
                <button onClick={() => setSel(sel === e.id ? null : Number(e.id))} className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-start">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/10 text-cyan-200">
                    <BookOpen size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-white">{String(e.title)}</span>
                      {e.verified ? <ShieldCheck size={13} className="text-emerald-400" /> : null}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-ink-dim">
                      <span>{CAT_AR[String(e.category)]}</span>
                      <span>•</span>
                      <span>{SRC_AR[String(e.source)] ?? String(e.source)}</span>
                      {e.tech ? (<><span>•</span><span dir="ltr">{String(e.tech)}</span></>) : null}
                      {e.license ? (<><span>•</span><span>{String(e.license)}</span></>) : null}
                      <span>•</span>
                      <span>استُخدم {Number(e.usageCount)}×</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(ev) => { ev.stopPropagation(); act(Number(e.id), e.verified ? "unverify" : "verify"); }} disabled={busy !== null} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300 transition hover:border-emerald-400/40 disabled:opacity-40">
                      {busy === `${e.id}-verify` ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} {e.verified ? "ألغِ التحقق" : "تحقق"}
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); act(e.id as number, "delete"); }} disabled={busy !== null} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-rose-300 transition hover:border-rose-400/40 disabled:opacity-40">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </button>
                {sel === e.id && (
                  <div className="border-t border-white/10 px-5 py-4">
                    <p className="text-[13px] leading-relaxed text-ink">{String(e.summary)}</p>
                    <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-ink-dim">{String(e.content)}</p>
                    {e.code ? (
                      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-nova-950/80 p-4 font-mono text-[11px] text-cyan-100" dir="ltr">{String(e.code)}</pre>
                    ) : null}
                    {e.sourceUrl ? (
                      <a href={String(e.sourceUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] text-cyan-300 underline" dir="ltr">{String(e.sourceUrl)}</a>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ خبرات المشاريع ============ */}
      {sub === "experience" && exp && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-soft rounded-3xl p-6">
            <h3 className="font-display flex items-center gap-2 text-sm font-black text-white"><Database size={15} className="text-violet-300" /> قرارات هندسية</h3>
            <div className="mt-3 space-y-2">
              {((exp.decisions as Record<string, unknown>[]) ?? []).map((d, i) => (
                <div key={i} className="rounded-xl bg-white/3 p-3 text-[12px]">
                  <b className="text-white">{String(d.decision)}</b>
                  <p className="mt-1 text-ink-dim">{String(d.reason ?? "")}</p>
                  {d.alternatives ? <p className="mt-1 text-[11px] opacity-70">البدائل: {String(d.alternatives)}</p> : null}
                </div>
              ))}
              {(exp.decisions as unknown[])?.length === 0 && <p className="text-[12px] text-ink-dim">تُسجل القرارات عند تسليم أول مشروع.</p>}
            </div>
          </div>
          <div className="glass-soft rounded-3xl p-6">
            <h3 className="font-display flex items-center gap-2 text-sm font-black text-white"><Lightbulb size={15} className="text-amber-300" /> دروس مستفادة</h3>
            <div className="mt-3 space-y-2">
              {((exp.lessons as Record<string, unknown>[]) ?? []).map((l, i) => (
                <div key={i} className="rounded-xl bg-white/3 p-3 text-[12px]">
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">{String(l.category)}</span>
                  <b className="ms-2 text-white">{String(l.problem)}</b>
                  <p className="mt-1 text-ink-dim">{String(l.solution ?? "")}</p>
                </div>
              ))}
              {(exp.lessons as unknown[])?.length === 0 && <p className="text-[12px] text-ink-dim">تُسجل تلقائياً من مهام احتاجت إعادة محاولة.</p>}
            </div>
          </div>
          <div className="glass-soft rounded-3xl p-6">
            <h3 className="font-display flex items-center gap-2 text-sm font-black text-white"><Wrench size={15} className="text-rose-300" /> أخطاء شائعة وإصلاحها</h3>
            <div className="mt-3 space-y-2">
              {((exp.fixes as Record<string, unknown>[]) ?? []).map((f, i) => (
                <div key={i} className="rounded-xl bg-white/3 p-3 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-white">{String(f.title)}</b>
                    <span className="shrink-0 rounded-full bg-rose-400/10 px-2 py-0.5 text-[9px] font-bold text-rose-300">{Number(f.occurrences)}× رُصد</span>
                  </div>
                  <p className="mt-1 text-ink-dim">{String(f.fix)}</p>
                  {f.prevention ? <p className="mt-1 text-[11px] opacity-70">وقاية: {String(f.prevention)}</p> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-soft rounded-3xl p-6">
            <h3 className="font-display flex items-center gap-2 text-sm font-black text-white"><Puzzle size={15} className="text-emerald-300" /> مكونات معاد استخدامها</h3>
            <div className="mt-3 space-y-2">
              {((exp.components as Record<string, unknown>[]) ?? []).map((c, i) => (
                <div key={i} className="rounded-xl bg-white/3 p-3 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <b className="flex items-center gap-1.5 text-white"><Code2 size={12} className="text-emerald-300" />{String(c.name)}</b>
                    <span className="shrink-0 text-[10px] text-ink-dim">{Number(c.timesUsed)} استخدام</span>
                  </div>
                  <p className="mt-1 text-ink-dim">{String(c.description ?? "")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
  )}

      {/* ============ التعلم ============ */}
      {sub === "learning" && exp && (
        <div className="space-y-4">
          <div className="glass-soft overflow-x-auto rounded-3xl">
            <div className="border-b border-white/10 px-6 py-4 text-xs font-black text-white">
              معايرة التقديرات — المقارن بين المقدَّر والفعلي حسب نوع الخدمة (يُطبق تلقائياً على مشاريع جديدة)
            </div>
            <table className="w-full min-w-[560px] text-xs">
              <thead><tr className="text-[10px] text-ink-dim"><th className="px-6 py-3 text-start">نوع الخدمة</th><th className="px-3 py-3 text-start">مشاريع مسلَّمة</th><th className="px-3 py-3 text-start">متوسط المقدَّر</th><th className="px-3 py-3 text-start">متوسط الفعلي</th><th className="px-3 py-3 text-start">انحراف</th></tr></thead>
              <tbody>
                {((exp.learning as Record<string, unknown>[]) ?? []).map((l, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-6 py-3 font-bold text-white" dir="ltr">{String(l.type)}</td>
                    <td className="px-3 py-3">{Number(l.n)}</td>
                    <td className="px-3 py-3">{Number(l.avgEstMin)} د</td>
                    <td className="px-3 py-3">{Number(l.avgActualMin)} د</td>
                    <td className="px-3 py-3">{l.deviation != null ? `${Number(l.deviation) > 0 ? "+" : ""}${Number(l.deviation)}%` : "—"}</td>
                  </tr>
                ))}
                {(exp.learning as unknown[])?.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-ink-dim">تظهر المعايرة بعد تسليم 3+ مشاريع من نفس النوع.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="glass-soft overflow-x-auto rounded-3xl">
            <div className="border-b border-white/10 px-6 py-4 text-xs font-black text-white">سجل المشاريع: تقدير مقابل فعلي</div>
            <table className="w-full min-w-[560px] text-xs">
              <thead><tr className="text-[10px] text-ink-dim"><th className="px-6 py-3 text-start">المشروع</th><th className="px-3 py-3 text-start">النوع</th><th className="px-3 py-3 text-start">مهام</th><th className="px-3 py-3 text-start">مقدَّر (د)</th><th className="px-3 py-3 text-start">فعلي</th></tr></thead>
              <tbody>
                {((exp.records as Record<string, unknown>[]) ?? []).map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-6 py-3 font-mono text-cyan-300" dir="ltr">{String(r.code)}</td>
                    <td className="px-3 py-3" dir="ltr">{String(r.serviceType)}</td>
                    <td className="px-3 py-3">{Number(r.taskCount)}</td>
                    <td className="px-3 py-3">{Number(r.estLowMin)}–{Number(r.estHighMin)}</td>
                    <td className="px-3 py-3">{(Number(r.actualSec) / 60).toFixed(1)} د</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-cyan-400/40 px-6 py-3 text-sm font-bold text-cyan-200">{toast}</div>
      )}
    </div>
  );
}
