"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ShoppingBag, Smartphone, BrainCircuit, LayoutDashboard, Building2 } from "lucide-react";
import { egp } from "@/lib/format";
import type { SiteProject } from "@/lib/types";

const TYPES: Record<string, { label: string; icon: typeof Globe }> = {
  website: { label: "موقع", icon: Globe },
  store: { label: "متجر إلكتروني", icon: ShoppingBag },
  app: { label: "تطبيق موبايل", icon: Smartphone },
  ai: { label: "نظام ذكي", icon: BrainCircuit },
  system: { label: "نظام إدارة", icon: LayoutDashboard },
};

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "website", label: "مواقع" },
  { key: "store", label: "متاجر" },
  { key: "app", label: "تطبيقات" },
  { key: "ai", label: "ذكاء اصطناعي" },
  { key: "system", label: "أنظمة" },
];

const STATUS_TXT: Record<string, { label: string; cls: string }> = {
  done: { label: "مسلّم", cls: "bg-emerald-500/15 text-emerald-300" },
  ongoing: { label: "بيشتغل دلوقتي", cls: "bg-violet-500/15 text-violet-300" },
  queued: { label: "في الطابور", cls: "bg-amber-500/15 text-amber-300" },
};

export default function Work({ projects }: { projects: SiteProject[] }) {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? projects : projects.filter((p) => p.type === filter);

  return (
    <section id="work" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— PORTFOLIO —</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              شغل <span className="text-grad">معمول بجد</span>، مش كلام
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  filter === f.key
                    ? "btn-neon text-white"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((p) => {
              const T = TYPES[p.type] ?? TYPES.website;
              const S = STATUS_TXT[p.status] ?? STATUS_TXT.queued;
              return (
                <motion.article
                  layout
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35 }}
                  className="glass hover-glow group flex flex-col rounded-3xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-600/25 to-cyan-500/15 px-3 py-2 text-xs font-bold text-violet-200">
                      <T.icon className="size-4" /> {T.label}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${S.cls}`}>{S.label}</span>
                  </div>

                  <h3 className="mt-5 text-xl font-black">{p.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Building2 className="size-3.5" /> {p.client} · {p.year}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{p.description}</p>

                  {p.status !== "done" && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-500">
                        <span>نسبة الإنجاز</span>
                        <span className="font-mono">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400 transition-all duration-700"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="font-mono text-[11px] text-slate-500" dir="ltr">{p.tech}</span>
                    <span className="text-sm font-black text-cyan-300">{egp(p.budget)}</span>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
