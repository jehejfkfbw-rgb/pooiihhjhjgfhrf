"use client";

import { Cpu, ShieldCheck } from "lucide-react";
import { EMPLOYEES } from "@/lib/employees";
import { Reveal } from "./Reveal";

export function AgentsSection() {
  const teams = [...new Set(EMPLOYEES.map((e) => e.team))];

  return (
    <section id="agents" className="relative py-28">
      <div className="nebula absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-fuchsia-300">
            <Cpu size={14} />
            NEBRAS AI CORE — عقلي مركزي يدير فريقاً من 18 موظفاً ذكياً
          </span>
          <h2 className="font-display mt-5 text-4xl font-black text-white sm:text-5xl">
            فريق العمل: <span className="text-gradient">18 موظفاً متخصصاً</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-dim">
            لا روبوتات شكلية — كل موظف له دور وأوامر وصلاحيات محددة، والعقل المركزي يختار الفريق
            المناسب لكل مشروع فقط. وكل ما ينتج يتحقق بفحوصات فعلية ويعتمد من الإدارة قبل التسليم.
          </p>
        </Reveal>

        <div className="mt-16 space-y-10">
          {teams.map((team, ti) => {
            const members = EMPLOYEES.filter((e) => e.team === team);
            return (
              <Reveal key={team} delay={ti * 0.06}>
                <div className="glass-soft rounded-[2rem] p-7 sm:p-9">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-black text-white">{team}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-ink-dim">
                      {members.length} موظفين
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((a) => (
                      <div key={a.roleKey} className="glass card-hover rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/15 font-display text-lg font-black text-white shadow-lg">
                            {a.name.replace("م. ", "").replace("د. ", "").slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-display text-sm font-black text-white">{a.name}</div>
                            <div className="truncate text-[11px] text-ink-dim" dir="auto">{a.roleTitle}</div>
                          </div>
                        </div>
                        <p className="mt-3 text-[12px] leading-relaxed text-ink-dim">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mt-10">
          <div className="glass flex flex-wrap items-center justify-center gap-3 rounded-2xl px-6 py-4 text-center">
            <ShieldCheck size={18} className="text-emerald-300" />
            <p className="text-sm text-ink-dim">
              <span className="font-bold text-white">ضابط الجودة:</span> كل مهمة تمر بفحوصات
              فعلية (تشغيل، صياغة، أمان) — ولا يُسلَّم أي مشروع إلا بعد اعتماد الإدارة والتحقق من
              النتائج.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
