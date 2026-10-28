"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, CheckCircle2, AlertTriangle, Gauge } from "lucide-react";

export function NebrasStatsTab() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/stats", { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  if (!data) {
    return <div className="py-16 text-center text-sm text-ink-dim">جارٍ حساب الإحصائيات من قاعدة البيانات...</div>;
  }

  const p = (data.projects ?? {}) as Record<string, unknown>;
  const t = (data.tasks ?? {}) as Record<string, unknown>;
  const tt = (data.tests ?? {}) as Record<string, unknown>;
  const u = (data.usage ?? {}) as Record<string, unknown>;
  const byRole = (data.byRole ?? []) as Record<string, unknown>[];

  const KPI = [
    { label: "إجمالي المشاريع", value: Number(p.total), icon: Briefcase, tone: "text-cyan-300" },
    { label: "قيد التنفيذ الآن", value: Number(p.running), icon: Gauge, tone: "text-emerald-300" },
    { label: "متعثرة / تحتاج تدخل", value: Number(p.blocked), icon: AlertTriangle, tone: "text-rose-300" },
    { label: "مسلّمة", value: Number(p.delivered), icon: CheckCircle2, tone: "text-emerald-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI.map((k) => (
          <div key={k.label} className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className={`font-display text-3xl font-black ${k.tone}`}>{k.value}</div>
              <k.icon size={20} className={k.tone} />
            </div>
            <div className="mt-2 text-[11px] font-bold text-ink-dim">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-soft rounded-3xl p-6">
          <h4 className="text-xs font-black text-white">المهام</h4>
          <div className="mt-3 space-y-2 text-[12px] text-ink-dim">
            <div className="flex justify-between"><span>إجمالي</span><b className="text-white">{Number(t.total)}</b></div>
            <div className="flex justify-between"><span>منجزة بفحوصات ناجحة</span><b className="text-emerald-300">{Number(t.done)}</b></div>
            <div className="flex justify-between"><span>فاشلة</span><b className="text-rose-300">{Number(t.failed)}</b></div>
            <div className="flex justify-between"><span>في الطابور/التنفيذ</span><b className="text-cyan-300">{Number(t.queued)}</b></div>
            <div className="flex justify-between border-t border-white/10 pt-2"><span>معدل الإنجاز</span><b className="text-violet-300">{t.successRate != null ? `${Number(t.successRate)}%` : "—"}</b></div>
          </div>
        </div>
        <div className="glass-soft rounded-3xl p-6">
          <h4 className="text-xs font-black text-white">الجودة — فحوصات فعلية</h4>
          <div className="mt-3 space-y-2 text-[12px] text-ink-dim">
            <div className="flex justify-between"><span>فحوصات شُغلت</span><b className="text-white">{Number(tt.total)}</b></div>
            <div className="flex justify-between"><span>ناجحة</span><b className="text-emerald-300">{Number(tt.pass)}</b></div>
            <div className="flex justify-between"><span>فاشلة</span><b className="text-rose-300">{Number(tt.fail)}</b></div>
            <div className="flex justify-between border-t border-white/10 pt-2"><span>معدل النجاح</span><b className="text-violet-300">{tt.passRate != null ? `${Number(tt.passRate)}%` : "—"}</b></div>
          </div>
        </div>
        <div className="glass-soft rounded-3xl p-6">
          <h4 className="text-xs font-black text-white">استهلاك النماذج</h4>
          <div className="mt-3 space-y-2 text-[12px] text-ink-dim">
            <div className="flex justify-between"><span>استدعاءات</span><b className="text-white">{Number(u.calls)}</b></div>
            <div className="flex justify-between"><span>حرف استعلام</span><b className="text-white">{Number(u.promptChars).toLocaleString()}</b></div>
            <div className="flex justify-between"><span>حرف رد</span><b className="text-white">{Number(u.completionChars).toLocaleString()}</b></div>
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span>التكلفة الفعلية</span>
              <b className="text-violet-300">{u.costUsd != null ? `$${Number(u.costUsd).toFixed(4)}` : "غير متاح"}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-soft overflow-x-auto rounded-3xl">
        <div className="border-b border-white/10 px-6 py-4 text-xs font-black text-white">أداء الموظفين (حسب المهام المسجلة فعلياً)</div>
        {byRole.length === 0 ? (
          <p className="p-8 text-center text-[12px] text-ink-dim">لا مهام مسجلة بعد.</p>
        ) : (
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-[10px] text-ink-dim">
                <th className="px-6 py-3 text-start">الدور</th>
                <th className="px-3 py-3 text-start">مهام</th>
                <th className="px-3 py-3 text-start">منجزة</th>
                <th className="px-3 py-3 text-start">فاشلة</th>
                <th className="px-3 py-3 text-start">معدل النجاح</th>
              </tr>
            </thead>
            <tbody>
              {byRole.map((r, i) => {
                const total = Number(r.total);
                const rate = total ? Math.round((Number(r.done) / total) * 100) : 0;
                return (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-6 py-3 font-bold text-white" dir="ltr">{String(r.role)}</td>
                    <td className="px-3 py-3 text-ink-dim">{total}</td>
                    <td className="px-3 py-3 text-emerald-300">{Number(r.done)}</td>
                    <td className="px-3 py-3 text-rose-300">{Number(r.failed)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-cyan-400" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-ink-dim">{total ? `${rate}%` : "—"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
