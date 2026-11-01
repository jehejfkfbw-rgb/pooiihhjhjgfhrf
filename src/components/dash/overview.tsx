"use client";

import { useEffect, useState } from "react";
import {
  Banknote, FolderKanban, MessagesSquare, Inbox, Bot, BrainCircuit, Radar, Flame, ArrowDownLeft,
} from "lucide-react";
import { api, Panel, Spinner } from "./ui";
import type { Notify } from "./shell";
import { egp, timeAgo } from "@/lib/format";
import type { SiteChat, SiteLead } from "@/lib/types";

type StatsPayload = {
  ok: boolean;
  stats: {
    projects: { total: number; done: number; ongoing: number; queued: number; budgetDone: number; budgetActive: number };
    leads: { total: number; fresh: number };
    chats: { total: number; matched: number; unmatched: number; matchRate: number };
    knowledge: { total: number; active: number; hits: number };
  };
  bot: { enabled: boolean; within: boolean; clock: string; start: string; end: string; daysLabel: string };
  recentChats: SiteChat[];
  recentLeads: SiteLead[];
  topQuestions: { question: string; n: number }[];
};

export default function Overview({ }: { notify: Notify }) {
  const [d, setD] = useState<StatsPayload | null>(null);
  const [bars, setBars] = useState<number[]>(Array.from({ length: 24 }, () => 30));

  useEffect(() => {
    api<StatsPayload>("/api/admin/stats").then(setD).catch(() => {});
    const t = setInterval(() => {
      setBars((prev) => prev.map(() => 15 + Math.random() * 85));
    }, 900);
    return () => clearInterval(t);
  }, []);

  if (!d) return <Spinner />;
  const { stats, bot } = d;

  const CARDS = [
    { icon: FolderKanban, label: "المشاريع", value: String(stats.projects.total), sub: `${stats.projects.done} مسلّمة · ${stats.projects.ongoing} جارية · ${stats.projects.queued} في الطابور`, color: "text-violet-300" },
    { icon: Banknote, label: "قيمة الاشتغال (ج.م)", value: egp(stats.projects.budgetDone + stats.projects.budgetActive), sub: `${egp(stats.projects.budgetActive)} قيد التنفيذ`, color: "text-amber-300" },
    { icon: MessagesSquare, label: "أسئلة البوت", value: String(stats.chats.total), sub: `نسبة إجابة دقيقة ${stats.chats.matchRate}%`, color: "text-cyan-300" },
    { icon: Inbox, label: "رسائل العملاء", value: String(stats.leads.total), sub: `${stats.leads.fresh} رسالة جديدة`, color: "text-emerald-300" },
  ];

  return (
    <div className="space-y-5">
      {/* الإحصائيات */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.label} className="glass hover-glow rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{c.label}</span>
              <c.icon className={`size-4 ${c.color}`} />
            </div>
            <p className="mt-3 text-2xl font-black">{c.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* حالة البوت */}
        <Panel title="حالة المساعد الذكي" icon={<Bot className="size-4 text-cyan-300" />} sub="يتحكم من تاب إعدادات النواة">
          <div className="space-y-3 text-sm">
            <Row k="التشغيل" v={bot.enabled ? "شغال" : "متوقف"} ok={bot.enabled} />
            <Row k="داخل المواعيد الآن" v={bot.within ? "أيوه، بيرد فورًا" : "لأ، خارج الدوام"} ok={bot.within} />
            <Row k="نافذة الشغل" v={`${bot.start} ← ${bot.end}`} />
            <Row k="الأيام" v={bot.daysLabel || "كل الأيام"} />
            <Row k="ساعة القاهرة" v={bot.clock} />
          </div>
        </Panel>

        {/* نبض النواة */}
        <Panel title="نبض النواة" icon={<Radar className="size-4 text-violet-300" />} sub="نشاط حي لوكلاء NOVA CORE" className="relative overflow-hidden">
          <div className="flex h-28 items-end gap-1" dir="ltr">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-600/70 to-cyan-400/80 transition-all duration-700"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 font-mono text-[10px] text-slate-500" dir="ltr">
            <Flame className="size-3 text-orange-400" /> SYNTHETIC TELEMETRY · 3 AGENTS ACTIVE
          </p>
        </Panel>

        {/* قاعدة المعرفة */}
        <Panel title="قاعدة المعرفة" icon={<BrainCircuit className="size-4 text-pink-300" />} sub="دماغ البوت المحلية">
          <div className="space-y-3 text-sm">
            <div className="flex items-end justify-between">
              <span className="text-xs font-bold text-slate-500">ردود مدرّبة</span>
              <span className="text-2xl font-black">{stats.knowledge.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-l from-fuchsia-500 to-cyan-400"
                style={{ width: `${stats.knowledge.total ? (stats.knowledge.active / stats.knowledge.total) * 100 : 0}%` }}
              />
            </div>
            <Row k="ردود مفعّلة" v={String(stats.knowledge.active)} ok />
            <Row k="إجمالي الاستخدامات" v={String(stats.knowledge.hits)} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* آخر المحادثات */}
        <Panel title="آخر محادثات البوت" icon={<MessagesSquare className="size-4 text-cyan-300" />} className="xl:col-span-2">
          {d.recentChats.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">لسه مفيش محادثات — جرب تكلم البوت من الموقع</p>
          ) : (
            <ul className="space-y-2.5">
              {d.recentChats.slice(0, 7).map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${c.matched ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-200">{c.question}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{c.answer}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-600">{timeAgo(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* أسئلة محتاجة رد */}
        <Panel title="أسئلة مستنية رد" icon={<ArrowDownLeft className="size-4 text-amber-300" />} sub="البوت ملقاش ليها جواب — درّبها من قاعدة المعرفة">
          {d.topQuestions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">مفيش أسئلة معلّقة — البوت جاهز على كل حاجة</p>
          ) : (
            <ul className="space-y-2">
              {d.topQuestions.map((q, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/[0.06] px-3.5 py-2.5 text-xs">
                  <span className="truncate font-semibold text-amber-100/90">{q.question}</span>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 font-bold text-amber-300">×{q.n}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-2.5">
      <span className="text-xs font-bold text-slate-500">{k}</span>
      <span className={`text-xs font-black ${ok === true ? "text-emerald-300" : ok === false ? "text-amber-300" : "text-slate-200"}`}>{v}</span>
    </div>
  );
}
