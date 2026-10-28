"use client";

import { Cpu, Code2, Headset, Megaphone, ShieldCheck } from "lucide-react";
import { AGENTS, TEAM_META } from "@/lib/agents";
import { Reveal } from "./Reveal";

const TEAM_ICONS = {
  dev: Code2,
  cs: Headset,
  marketing: Megaphone,
} as const;

export function AgentsSection() {
  const teams = (["dev", "cs", "marketing"] as const).map((t) => ({
    key: t,
    meta: TEAM_META[t],
    members: AGENTS.filter((a) => a.team === t),
    Icon: TEAM_ICONS[t],
  }));

  return (
    <section id="agents" className="relative py-28">
      <div className="nebula absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-fuchsia-300">
            <Cpu size={14} />
            يعمل محلياً 100% — عبر Ollama بدون اشتراكات خارجية
          </span>
          <h2 className="font-display mt-5 text-4xl font-black text-white sm:text-5xl">
            فريق عمل من <span className="text-gradient">٧ وكلاء أذكياء</span> في خدمتك
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-dim">
            في نوفا كود لا يعمل الذكاء الاصطناعي بديلاً عن الإنسان، بل معه: كل مخرجات الفريق
            تُراجع وتُعتمد من الإدارة قبل أن تصل إليك.
          </p>
        </Reveal>

        <div className="mt-16 space-y-12">
          {teams.map(({ key, meta, members, Icon }, ti) => (
            <Reveal key={key} delay={ti * 0.08}>
              <div className="glass-soft rounded-[2rem] p-7 sm:p-9">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/10 text-cyan-200 border border-white/5">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-black text-white">{meta.label}</h3>
                      <p className="text-xs text-ink-dim">{meta.desc}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-ink-dim">
                    {members.length} {key === "dev" ? "مطورين" : "موظفين"}
                  </span>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((a) => (
                    <div
                      key={a.id}
                      className="glass card-hover rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.tint} font-display text-lg font-black text-white shadow-lg`}
                        >
                          {a.name[0]}
                        </span>
                        <div>
                          <div className="font-display text-sm font-black text-white">{a.name}</div>
                          <div className="text-[11px] text-ink-dim">{a.role}</div>
                        </div>
                        <span className="ms-auto flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                          نشط
                        </span>
                      </div>
                      <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">{a.brief}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-10">
          <div className="glass flex flex-wrap items-center justify-center gap-3 rounded-2xl px-6 py-4 text-center">
            <ShieldCheck size={18} className="text-emerald-300" />
            <p className="text-sm text-ink-dim">
              <span className="font-bold text-white">ضابط الجودة البشري:</span> لا يُعتمد أي طلب أو
              مقترح أو محتوى إلا بعد مراجعة وموافقة إدارة نوفا كود عبر لوحة التحكم الخاصة.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
