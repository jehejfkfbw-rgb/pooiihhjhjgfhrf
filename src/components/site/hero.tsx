"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { ArrowDown, MessageCircle, Sparkles, Cpu, Zap, ShieldCheck } from "lucide-react";
import { COMPANY } from "@/lib/site";

const WORDS = ["أسطوري", "بيتكلم مصري", "شغال 24/7", "أسرع من البرق"];

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2, ease: "easeOut", onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

const STATS = [
  { to: 120, suffix: "+", label: "مشروع مسلّم" },
  { to: 98, suffix: "%", label: "رضا العملاء" },
  { to: 3, suffix: "", label: "وكلاء ذكاء اصطناعي" },
  { to: 14, suffix: "", label: "محافظة بنخدمها" },
];

export default function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16">
      {/* الخلفية */}
      <div className="absolute inset-0">
        <img src="/img/hero-nebula.jpg" alt="" className="size-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03040c]/60 via-[#03040c]/40 to-[#03040c]" />
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="absolute -top-32 right-[8%] size-[420px] rounded-full bg-violet-600/25 blur-[130px]" />
        <div className="absolute bottom-0 left-[6%] size-[380px] rounded-full bg-cyan-500/20 blur-[130px]" />
      </div>

      {/* أيقونات طايرة */}
      <motion.div className="absolute top-[22%] left-[10%] hidden lg:block" animate={{ y: [0, -18, 0] }} transition={{ duration: 7, repeat: Infinity }}>
        <div className="glass rounded-2xl p-4"><Cpu className="size-6 text-cyan-300" /></div>
      </motion.div>
      <motion.div className="absolute top-[58%] right-[6%] hidden lg:block" animate={{ y: [0, 16, 0] }} transition={{ duration: 8, repeat: Infinity, delay: 1 }}>
        <div className="glass rounded-2xl p-4"><Zap className="size-6 text-violet-300" /></div>
      </motion.div>
      <motion.div className="absolute bottom-[24%] left-[16%] hidden lg:block" animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}>
        <div className="glass rounded-2xl p-4"><ShieldCheck className="size-6 text-pink-300" /></div>
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="glass inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-violet-200">
            <Sparkles className="size-4 text-cyan-300" />
            شركة برمجيات مصرية · الذكاء الاصطناعي عندنا محلي 100%
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-7 text-5xl font-black leading-[1.15] sm:text-6xl lg:text-7xl"
        >
          بنبني سوفتوير
          <span className="relative mx-3 inline-block align-baseline">
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -26, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
                className="text-grad inline-block"
              >
                {WORDS[i]}
              </motion.span>
            </AnimatePresence>
          </span>
          <br />
          <span className="text-slate-200">من قلب مصر</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
        >
          نوفا ديجيتال بتحوّل فكرتك لمنتج رقمي يعيش: مواقع فخمة، متاجر إلكترونية،
          تطبيقات موبايل، وأنظمة ذكاء اصطناعي محلية شغالة على بياناتك أنت —
          بأسعار بالجنيه المصري وفريق هجين من البشر والوكلاء الأذكياء.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <a href="#contact" className="btn-neon flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white">
            ابدأ مشروعك
            <ArrowDown className="size-4" />
          </a>
          <a
            href={COMPANY.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="glass hover-glow flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold"
          >
            <MessageCircle className="size-5 text-emerald-400" />
            {COMPANY.phone}
          </a>
        </motion.div>

        {/* العدادات */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="glass hover-glow rounded-2xl px-4 py-5">
              <div className="text-grad text-3xl font-black sm:text-4xl">
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-400">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <span className="text-[10px] font-bold tracking-[0.3em]">اكتشف أكتر</span>
          <span className="block h-8 w-px bg-gradient-to-b from-violet-400 to-transparent" />
        </div>
      </div>
    </section>
  );
}
