"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, FlaskConical, Copy, CheckCircle2, LoaderCircle,
  Share2, RefreshCw, Cpu, Zap,
} from "lucide-react";
import { api, Panel, Spinner } from "./ui";
import type { Notify } from "./shell";

type Idea = {
  id: number; day: string; title: string; body: string; hashtags: string[];
  bestTime: string; platform: string; source: string; published: boolean; createdAt: string;
};

export default function GeminiPanel({ notify }: { notify: Notify }) {
  const [status, setStatus] = useState<{ ready: boolean; test?: { ok: boolean; text: string; error: string | null; ms: number } } | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function loadStatus(withTest = false) {
    const d = await api<{ ready: boolean; test?: { ok: boolean; text: string; error: string | null; ms: number } }>(
      `/api/admin/gemini${withTest ? "?test=1" : ""}`,
    );
    setStatus(d);
  }
  async function loadIdeas() {
    const d = await api<{ ideas: Idea[] }>("/api/social?all=1");
    setIdeas(d.ideas);
  }

  useEffect(() => {
    loadStatus().catch(() => {});
    loadIdeas().catch(() => {});
  }, []);

  async function runTest() {
    setTesting(true);
    await loadStatus(true);
    setTesting(false);
    notify("خلص الاختبار الحي لمحرك Gemini");
  }

  async function publish(id: number, v: boolean) {
    await api("/api/social", { method: "PUT", body: JSON.stringify({ id, published: v }) });
    await loadIdeas();
    notify(v ? "اتعلمت إنها منشورة" : "رجعت لمسودة");
  }

  if (!status || !ideas) return <Spinner />;

  return (
    <div className="space-y-5">
      {/* حالة المحرك */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="محرك Gemini" icon={<Cpu className="size-4 text-violet-300" />} sub="طبقة ذكاء إضافية فوق المحرك المحلي">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="text-xs font-bold text-slate-500">الحالة</span>
              <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black ${status.ready ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                <span className={`size-1.5 rounded-full anim-pulse-dot ${status.ready ? "bg-emerald-400" : "bg-amber-400"}`} />
                {status.ready ? "متفعل وجاهز" : "مش متفعل — المحرك المحلي شغال"}
              </span>
            </div>
            <button onClick={runTest} disabled={testing} className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50">
              {testing ? <LoaderCircle className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
              اختبر الاتصال الحي
            </button>
            {status.test && (
              <div className={`rounded-xl p-3 text-[11px] leading-relaxed ${status.test.ok ? "bg-emerald-500/[0.08] text-emerald-200" : "bg-rose-500/[0.08] text-rose-200"}`}>
                {status.test.ok
                  ? `رد Gemini: ${status.test.text} (${status.test.ms}ms)`
                  : `فشل الاتصال: ${status.test.error} — راجع المفتاح من Google AI Studio وتأكد إنه صالح.`}
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-slate-500">
              لو Gemini مش متاح لأي سبب، البوت بيرجع تلقائيًا للمحرك المحلي NOVA CORE — مفيش توقف أبدًا.
            </p>
          </div>
        </Panel>

        <Panel title="إحصائيات الأفكار" icon={<Sparkles className="size-4 text-amber-300" />} className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/[0.03] p-5 text-center">
              <p className="text-3xl font-black text-amber-300">{ideas.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">أفكار متولدة</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-5 text-center">
              <p className="text-3xl font-black text-emerald-300">{ideas.filter((i) => i.published).length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">اتنشرت فعلًا</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-5 text-center">
              <p className="text-3xl font-black text-violet-300">{ideas.filter((i) => i.source === "gemini").length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">من توليد Gemini</p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
            <Zap className="size-3.5 text-amber-300" /> فكرة جديدة بتتولد تلقائيًا كل يوم بتوقيت القاهرة — وتقدر تديرها من هنا.
          </p>
        </Panel>
      </div>

      {/* قايمة الأفكار */}
      <Panel title="أرشيف أفكار السوشيال ميديا" icon={<Share2 className="size-4 text-pink-300" />} sub="انسخ أي فكرة وانشرها، وعلّمها إنها اتنشرت"
        action={<button onClick={loadIdeas} className="grid size-9 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="تحديث"><RefreshCw className="size-4" /></button>}
      >
        {ideas.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">لسه مفيش أفكار — أول زيارة للموقع بتولد فكرة اليوم</p>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => (
              <div key={idea.id} className={`rounded-2xl bg-white/[0.03] p-5 transition ${idea.published ? "border border-emerald-500/20" : ""}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <p className="font-mono text-[10px] text-slate-500">{idea.day} · {idea.source === "gemini" ? "Gemini" : "محرك نوفا"}</p>
                    <h3 className="font-black">{idea.title}</h3>
                  </div>
                  {idea.published && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black text-emerald-300">
                      <CheckCircle2 className="size-3.5" /> منشورة
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-400">{idea.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {idea.hashtags.map((h) => (
                    <span key={h} className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-200">{h}</span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                  <span className="text-[11px] text-slate-500">{idea.bestTime} · {idea.platform}</span>
                  <div className="mr-auto flex gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${idea.title}\n\n${idea.body}\n\n${idea.hashtags.join(" ")}`); setCopied(idea.id); setTimeout(() => setCopied(null), 1500); }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-[11px] font-black transition hover:bg-white/15"
                    >
                      {copied === idea.id ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      {copied === idea.id ? "اتنسخت" : "نسخ"}
                    </button>
                    <button
                      onClick={() => publish(idea.id, !idea.published)}
                      className={`rounded-lg px-3.5 py-2 text-[11px] font-black transition ${idea.published ? "bg-white/10 hover:bg-white/15" : "btn-neon text-white"}`}
                    >
                      {idea.published ? "رجّعها مسودة" : "علّم منشورة"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
