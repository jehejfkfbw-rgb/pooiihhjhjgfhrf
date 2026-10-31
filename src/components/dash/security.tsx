"use client";

import { useEffect, useState } from "react";
import {
  Shield, Siren, Radar, ScanSearch, Copy, Link as LinkIcon,
  LoaderCircle, ShieldAlert, ShieldCheck, Bot, Ban,
} from "lucide-react";
import { api, Panel, Spinner, Toggle } from "./ui";
import type { Notify } from "./shell";
import { arDate, timeAgo } from "@/lib/format";
import type { SiteSecurityAgent, SiteSecurityEvent, SiteSecurityReport } from "@/lib/types";

type Payload = {
  ok: boolean;
  links: { site: string; dashboard: string };
  security: { lockdown: boolean; autoBlock: boolean; keepalive: boolean };
  agents: SiteSecurityAgent[];
  totals: { total: number; blocked: number; high: number; critical: number };
  recent: SiteSecurityEvent[];
  reports: SiteSecurityReport[];
};

const STATUS_CLS: Record<string, string> = {
  watching: "bg-cyan-500/15 text-cyan-300",
  scanning: "bg-violet-500/15 text-violet-300",
  defending: "bg-rose-500/15 text-rose-300",
  maintenance: "bg-amber-500/15 text-amber-300",
};

const SEV_CLS: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  high: "bg-orange-500/15 text-orange-300",
  critical: "bg-rose-500/15 text-rose-300",
};

export default function SecurityOps({ notify }: { notify: Notify }) {
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  async function load() {
    const d = await api<Payload>("/api/admin/security/overview");
    setData(d);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function togglePanic(v: boolean) {
    setBusy(true);
    await api("/api/admin/security/panic", { method: "PUT", body: JSON.stringify({ on: v }) });
    await load();
    setBusy(false);
    notify(v ? "تم تفعيل درع الطوارئ" : "تم إلغاء وضع الطوارئ");
  }

  async function runScan() {
    setBusy(true);
    await api("/api/admin/security/scan", { method: "POST" });
    await load();
    setBusy(false);
    notify("تم تشغيل فحص داخلي وتسجيل تقرير جديد");
  }

  if (!data) return <Spinner />;

  const cards = [
    { label: "إجمالي الأحداث اليوم", value: data.totals.total, icon: Radar, cls: "text-cyan-300" },
    { label: "تم اعتراضه آليًا", value: data.totals.blocked, icon: Ban, cls: "text-emerald-300" },
    { label: "عالي/حرج", value: data.totals.high, icon: ShieldAlert, cls: "text-orange-300" },
    { label: "حرج جدًا", value: data.totals.critical, icon: Siren, cls: "text-rose-300" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{c.label}</span>
              <c.icon className={`size-4 ${c.cls}`} />
            </div>
            <p className="mt-3 text-3xl font-black">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="AI Security Agents" icon={<Bot className="size-4 text-cyan-300" />} sub="فريق SOC افتراضي محلي 100%" className="xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {data.agents.map((a) => (
              <div key={a.id} className="rounded-2xl bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-cyan-300">{a.code}</p>
                    <h3 className="text-lg font-black">{a.name}</h3>
                    <p className="text-xs font-bold text-violet-300">{a.role}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${STATUS_CLS[a.status] ?? STATUS_CLS.watching}`}>{a.status}</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{a.specialty}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-black/30 p-3">
                    <p className="text-slate-500">الثقة</p>
                    <p className="mt-1 font-black text-emerald-300">{a.confidence}%</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-3">
                    <p className="text-slate-500">الاستجابة</p>
                    <p className="mt-1 font-black text-cyan-300">{a.responseMs}ms</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-500">{a.mission}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="أوامر SOC" icon={<Shield className="size-4 text-rose-300" />} sub="درع الطوارئ والفحص السريع">
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">زر الطوارئ</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">يقفل المسارات الحساسة للعامة ويحوّل المنصة لوضع دفاعي</p>
                </div>
                <Toggle on={data.security.lockdown} onChange={togglePanic} danger />
              </div>
            </div>
            <button onClick={runScan} disabled={busy} className="btn-neon flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-black text-white disabled:opacity-50">
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
              تشغيل فحص ثغرات داخلي
            </button>
            <div className="rounded-2xl bg-amber-500/[0.08] p-4 text-[11px] leading-relaxed text-amber-200">
              ملاحظة مهمة: حافظنا على استقرار الرابط قدر الإمكان عن طريق health/heartbeat داخل اللوحة والموقع،
              لكن تثبيت رابط المعاينة المؤقت نفسه بشكل دائم خارج سيطرة الكود. للاستمرارية الحقيقية استخدم نشر ثابت على Vercel + دومين مخصص.
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="روابط التشغيل الحالية" icon={<LinkIcon className="size-4 text-violet-300" />} className="xl:col-span-1">
          <LinkRow label="الموقع الأساسي" value={data.links.site} copied={copied} setCopied={setCopied} />
          <div className="mt-3" />
          <LinkRow label="لوحة المطورين" value={data.links.dashboard} copied={copied} setCopied={setCopied} />
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            الـ heartbeat مفعّل: {data.security.keepalive ? "نعم" : "لا"} — التحقق الصحي الدوري شغّال طالما فيه زوار أو لوحة مفتوحة.
          </p>
        </Panel>

        <Panel title="آخر الأحداث الأمنية" icon={<Radar className="size-4 text-cyan-300" />} className="xl:col-span-2">
          <div className="space-y-2.5">
            {data.recent.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">لسه مفيش أحداث مسجلة — الحركة نظيفة</p>
            ) : data.recent.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-black ${SEV_CLS[e.severity] ?? SEV_CLS.low}`}>{e.severity}</span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-slate-400" dir="ltr">{e.method} {e.path}</span>
                <span className="font-semibold text-slate-300">{e.summary}</span>
                <span className="mr-auto text-slate-600">{timeAgo(e.createdAt)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="تقارير المراقبة السيبرانية" icon={<ShieldCheck className="size-4 text-emerald-300" />} sub="آخر مخرجات فريق SOC المحلي">
        <div className="grid gap-4 lg:grid-cols-2">
          {data.reports.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">شغّل فحص داخلي أو سيب المنصة تجمع أحداث أكتر علشان التقارير تظهر هنا</p>
          ) : data.reports.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black">{r.title}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">{r.mode} · {arDate(r.createdAt)}</p>
                </div>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black text-cyan-300">SOC Report</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{r.summary}</p>
              {r.recommendations?.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                  {r.recommendations.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function LinkRow({ label, value, copied, setCopied }: { label: string; value: string; copied: string; setCopied: (v: string) => void }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <input className="nova-input !py-2 font-mono text-[11px]" dir="ltr" readOnly value={value} />
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(value); setTimeout(() => setCopied(""), 1500); }}
          className="grid size-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/15"
        >
          {copied === value ? <ShieldCheck className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
