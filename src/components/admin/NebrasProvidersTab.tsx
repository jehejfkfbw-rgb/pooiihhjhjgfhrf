"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, Cloud, Wifi, WifiOff, RefreshCw } from "lucide-react";

export function NebrasProvidersTab() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/providers", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-ink-dim">
        <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
        <span className="text-sm">جارٍ اختبار الاتصال الفعلي بالمزودين...</span>
      </div>
    );
  }

  const providers = (data.providers ?? []) as Record<string, unknown>[];
  const usage = (data.usage ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-black text-white">مزودو النماذج — فحص اتصال حقيقي</h3>
          <button onClick={load} className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-cyan-200 transition hover:border-cyan-400/40">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> إعادة الفحص
          </button>
        </div>
        <p className="mt-1 text-[11px] text-ink-dim">لا نعتبر المزود متصلاً إلا بعد رد فعلي من الخادم — غير ذلك يظهر «غير متصل».</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {providers.map((p, i) => (
            <div key={i} className={`glass-soft rounded-2xl border p-5 ${p.online ? "border-emerald-400/30" : "border-white/10"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.online ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-ink-dim"}`}>
                  {i === 0 ? <Cpu size={19} /> : <Cloud size={19} />}
                </span>
                <div>
                  <div className="text-sm font-black text-white">{String(p.name)}</div>
                  <div className="font-mono text-[10px] text-ink-dim" dir="ltr">{String(p.model)}</div>
                </div>
                <span className={`ms-auto flex items-center gap-1.5 text-[11px] font-bold ${p.online ? "text-emerald-300" : "text-amber-300"}`}>
                  {p.online ? <Wifi size={13} /> : <WifiOff size={13} />}
                  {p.online ? "متصل" : "غير متصل"}
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-dim">{String(p.detail)}</p>
            </div>
          ))}
        </div>
        <div className="glass-soft mt-4 rounded-2xl p-4">
          <p className="text-[11px] leading-relaxed text-ink-dim">
            <span className="font-bold text-white">ترتيب الاستخدام:</span> Ollama المحلي أولاً (بدون تكلفة سحابية) — وإذا لم يكن متاحاً يُستخدم الـ API السحابي عند ضبط المفتاح على الخادم
            (<span dir="ltr" className="font-mono text-[10px]">OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL</span>). المفاتيح لا تظهر أبداً في الواجهة أو السجلات. بدون أي مزود يعمل «المولّد المحلي» — وجميع الفحوصات التالیه تبقى فعلية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-2xl font-black text-cyan-300">{Number(usage.calls ?? 0)}</div>
          <div className="mt-1 text-[11px] text-ink-dim">استدعاءات نماذج مسجلة ({Number(usage.okCalls ?? 0)} ناجح)</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-2xl font-black text-violet-300">{Number(usage.promptChars ?? 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-ink-dim">حرف استعلام إجمالي</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-2xl font-black text-fuchsia-300">{Number(usage.completionChars ?? 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-ink-dim">حرف رد إجمالي</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="font-display text-2xl font-black text-emerald-300">
            {usage.costUsd != null ? `$${Number(usage.costUsd).toFixed(4)}` : "غير متاح"}
          </div>
          <div className="mt-1 text-[11px] text-ink-dim">التكلفة الفعلية (تظهر عندما يتوفر تسعير النموذج)</div>
        </div>
      </div>
    </div>
  );
}
