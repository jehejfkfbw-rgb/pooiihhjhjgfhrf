"use client";

import { motion } from "framer-motion";
import { Terminal, Flame, FolderGit2, Headset } from "lucide-react";
import type { SiteDev, SiteStaff } from "@/lib/types";

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  online: { label: "متاح", cls: "bg-emerald-500/15 text-emerald-300", dot: "bg-emerald-400" },
  mission: { label: "في مهمة", cls: "bg-violet-500/15 text-violet-300", dot: "bg-violet-400" },
  training: { label: "بيتدرب", cls: "bg-cyan-500/15 text-cyan-300", dot: "bg-cyan-400" },
  offline: { label: "مش متاح", cls: "bg-slate-500/15 text-slate-400", dot: "bg-slate-500" },
};

export default function Team({ devs, staff = [] }: { devs: SiteDev[]; staff?: SiteStaff[] }) {
  return (
    <section id="team" className="relative overflow-hidden py-24">
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-l from-transparent via-cyan-400/40 to-transparent" />
      <div className="absolute -left-32 top-1/3 size-[400px] rounded-full bg-violet-700/15 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— NOVA CORE —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            فريقنا مش بس بشر…
            <br />
            <span className="text-grad">عندنا 3 وكلاء ذكاء اصطناعي بيطوّروا 24/7</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            نواة نوفا (NOVA CORE) فيها 3 وكلاء أذكياء اتدربوا محليًا على قواعد بيانات ضخمة،
            بيشتغلوا جنب مهندسينا البشر علشان تسلّم مشروعك أسرع وأنضف.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {devs.map((d, i) => {
            const st = STATUS[d.status] ?? STATUS.online;
            return (
              <motion.div
                key={d.code}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="glass hover-glow group relative overflow-hidden rounded-3xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={d.avatar}
                    alt={`${d.name} — ${d.role}`}
                    className="size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070914] via-transparent to-transparent" />
                  <span className={`absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black backdrop-blur ${st.cls}`}>
                    <span className={`size-1.5 rounded-full anim-pulse-dot ${st.dot}`} />
                    {st.label}
                  </span>
                  <div className="absolute bottom-4 right-5">
                    <p className="font-mono text-[10px] tracking-[0.35em] text-cyan-300">{d.code}</p>
                    <h3 className="text-2xl font-black">{d.name}</h3>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm font-bold text-violet-300">{d.role}</p>
                  <p className="mt-2 font-mono text-[11px] text-slate-500" dir="ltr">{d.stack}</p>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Flame className="size-3 text-orange-400" /> المستوى {d.level}</span>
                      <span className="font-mono">{d.xp}% XP</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.xp}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-l from-violet-500 via-fuchsia-500 to-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <FolderGit2 className="size-3.5 text-cyan-300" />
                      {d.projectsDone} مشروع سلّمه
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Terminal className="size-3" />
                      {d.mission}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* فريق الاستقبال البشري */}
        {staff.length > 0 && (
          <div className="mt-20">
            <div className="text-center">
              <h3 className="flex items-center justify-center gap-2 text-2xl font-black">
                <Headset className="size-6 text-emerald-400" />
                ووراهم <span className="text-grad">فريق استقبال بشري</span> بيستلم طلبك أول ما يوصل
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
                زي أي شركة حقيقية بالظبط: موظفين متخصصين بيستقبلوا طلبك، يراجعوه، وبعدين يسلموه لوكيل التنفيذ.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {staff.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="glass hover-glow flex items-center gap-4 rounded-2xl p-5"
                >
                  <span className="relative grid size-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-600/30 p-3 text-xl font-black">
                    {m.name.charAt(0)}
                    <span className={`absolute -bottom-0.5 -left-0.5 size-3 rounded-full border-2 border-[#070914] ${m.online ? "bg-emerald-400" : "bg-slate-600"}`} />
                  </span>
                  <div>
                    <p className="font-black">{m.name}</p>
                    <p className="mt-0.5 text-xs font-bold text-violet-300">{m.role}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{m.dept} · {m.online ? "متاح دلوقتي" : "مش متاح"}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
