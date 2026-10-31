"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Gauge, Bot, FolderKanban, BrainCircuit, MessagesSquare, Inbox, Settings2,
  ArrowRight, Activity, ShieldCheck, ClipboardList, Hammer, Database,
} from "lucide-react";

import Overview from "./overview";
import Orders from "./orders";
import Forge from "./forge";
import DatabasePanel from "./database";
import Devs from "./devs";
import Projects from "./projects";
import Knowledge from "./knowledge";
import Chats from "./chats";
import Leads from "./leads";
import SettingsPanel from "./settings-panel";

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: Gauge, comp: Overview },
  { id: "orders", label: "الطلبات", icon: ClipboardList, comp: Orders },
  { id: "forge", label: "الاستوديو الحي", icon: Hammer, comp: Forge },
  { id: "devs", label: "الفريق والوكلاء", icon: Bot, comp: Devs },
  { id: "projects", label: "المشاريع", icon: FolderKanban, comp: Projects },
  { id: "database", label: "قاعدة البيانات", icon: Database, comp: DatabasePanel },
  { id: "knowledge", label: "قاعدة المعرفة", icon: BrainCircuit, comp: Knowledge },
  { id: "chats", label: "سجل المحادثات", icon: MessagesSquare, comp: Chats },
  { id: "leads", label: "رسائل العملاء", icon: Inbox, comp: Leads },
  { id: "settings", label: "إعدادات النواة", icon: Settings2, comp: SettingsPanel },
] as const;

const BOOT_LINES = [
  "NOVA CORE // BIOS v3.7.1",
  "AUTH :: وكيل-مطور مُصرّح — ACCESS GRANTED",
  "تحميل قاعدة المعرفة المحلية... تم",
  "إيقاظ الوكلاء الثلاثة... تم",
  "مزامنة الساعة: Africa/Cairo",
  "تهيئة لوحة القيادة...",
];

export type Notify = (msg: string) => void;

export default function DashShell() {
  const [boot, setBoot] = useState(true);
  const [bootLine, setBootLine] = useState(0);
  const [tab, setTab] = useState<string>("overview");
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [clock, setClock] = useState("--:--:--");
  const [up, setUp] = useState(0);
  const [botOn, setBotOn] = useState(true);
  const startRef = useRef(Date.now());

  const notify: Notify = (msg) => setToast({ msg, key: Date.now() });

  // شاشة الإقلاع
  useEffect(() => {
    const t = setInterval(() => setBootLine((v) => (v + 1) % (BOOT_LINES.length + 2)), 340);
    const done = setTimeout(() => setBoot(false), 2400);
    return () => { clearInterval(t); clearTimeout(done); };
  }, []);

  // ساعة القاهرة + أبتايم + حالة البوت
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      timeZone: "Africa/Cairo", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const tick = () => {
      setClock(fmt.format(new Date()));
      setUp(Math.floor((Date.now() - startRef.current) / 1000));
    };
    tick();
    const t = setInterval(tick, 1000);
    const poll = setInterval(async () => {
      try {
        const r = await fetch("/api/chat");
        const d = await r.json();
        setBotOn(Boolean(d.enabled));
      } catch { /* ignore */ }
    }, 30000);
    const keepWarm = setInterval(() => {
      fetch("/api/health").catch(() => {});
    }, 45000);
    fetch("/api/chat").then((r) => r.json()).then((d) => setBotOn(Boolean(d.enabled))).catch(() => {});
    return () => { clearInterval(t); clearInterval(poll); clearInterval(keepWarm); };
  }, []);

  const upText = `${String(Math.floor(up / 60)).padStart(2, "0")}:${String(up % 60).padStart(2, "0")}`;
  const Active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="min-h-screen bg-[#04050d] text-slate-200">
      {/* شاشة الإقلاع */}
      <AnimatePresence>
        {boot && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[200] grid place-items-center bg-[#020308]"
          >
            <div className="w-[min(90vw,480px)]">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
                  <ShieldCheck className="size-5 text-white" />
                </span>
                <div>
                  <p className="font-black">نواة نوفا — لوحة المطور</p>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-violet-300/70">NOVA-CORE · RESTRICTED</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 font-mono text-[11px] leading-6 text-emerald-300/90" dir="ltr">
                {BOOT_LINES.slice(0, bootLine + 1).map((l, i) => (
                  <p key={i} dir={/[؀-ۿ]/.test(l) ? "rtl" : "ltr"}>
                    <span className="text-slate-600">▸ </span>{l}
                  </p>
                ))}
                <span className="anim-blink text-violet-300">▮</span>
                <div className="mt-4 h-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded bg-gradient-to-r from-violet-500 to-cyan-400" style={{ animation: "boot-bar 2.1s ease forwards" }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* الشريط الجانبي */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-l border-white/[0.07] bg-[#070914] p-4 lg:flex">
          <div className="flex items-center gap-3 px-2 py-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-[0_0_20px_-4px_rgba(139,92,246,0.8)]">
              <Activity className="size-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-black">نواة نوفا</p>
              <p className="font-mono text-[9px] tracking-[0.3em] text-cyan-300/70">DEV CONSOLE</p>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  tab === t.id
                    ? "bg-gradient-to-l from-violet-600/30 to-cyan-500/10 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <t.icon className={`size-4.5 ${tab === t.id ? "text-cyan-300" : ""}`} />
                {t.label}
              </button>
            ))}
          </nav>

          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-slate-400 transition hover:border-violet-400/40 hover:text-white"
          >
            <ArrowRight className="size-4" />
            العودة للموقع العام
          </Link>
        </aside>

        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* الشريط العلوي */}
          <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#04050d]/85 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              {/* تابات الموبايل */}
              <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:hidden">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold transition ${
                      tab === t.id ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400"
                    }`}
                  >
                    <t.icon className="size-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              <h1 className="hidden text-lg font-black lg:block">{Active.label}</h1>
              <div className="mr-auto flex items-center gap-3">
                <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black ${botOn ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                  <span className={`size-1.5 rounded-full anim-pulse-dot ${botOn ? "bg-emerald-400" : "bg-rose-400"}`} />
                  البوت {botOn ? "شغال" : "متوقف"}
                </span>
                <span className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 font-mono text-[11px] text-slate-400 sm:flex" dir="ltr">
                  UPTIME {upText}
                </span>
                <span className="rounded-full bg-gradient-to-l from-violet-600/25 to-cyan-500/20 px-3 py-1.5 font-mono text-[11px] font-bold text-cyan-200" dir="ltr">
                  {clock} <span className="text-slate-500">CAI</span>
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.28 }}
              >
                <Active.comp notify={notify} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* التوست */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2600)}
            className="fixed bottom-6 right-1/2 z-[120] translate-x-1/2 rounded-2xl border border-emerald-400/30 bg-[#0a1710]/95 px-6 py-3.5 text-sm font-bold text-emerald-200 shadow-2xl backdrop-blur"
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
