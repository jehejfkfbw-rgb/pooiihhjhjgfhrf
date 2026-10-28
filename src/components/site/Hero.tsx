"use client";

import { motion } from "framer-motion";
import { ArrowDown, Rocket, Bot, MapPin, Sparkles } from "lucide-react";
import { NovaMark } from "./Logo";

const WORDS = ["متاجر تبيع فعلاً", "تطبيقات بلا حدود", "أنظمة إدارة ذكية", "ذكاءً اصطناعياً محلياً"];

function Orbit({ r, dur, children }: { r: number; dur: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={
        {
          "--orbit-r": `${r}px`,
          animation: `orbit ${dur}s linear infinite`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function Hero({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="starfield absolute inset-0 opacity-80" />
      <div className="nebula absolute inset-0" />
      <div className="grid-bg absolute inset-0" />

      {/* نواة النوفا المدارية */}
      <div className="pointer-events-none absolute top-1/2 left-[16%] hidden h-0 w-0 -translate-y-1/2 lg:block">
        <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 animate-float">
          <NovaMark size={112} />
        </div>
        <div className="absolute top-1/2 left-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet-400/25" />
        <div className="absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" />
        <Orbit r={190} dur={14}>
          <span className="glass flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl text-cyan-300">
            <Rocket size={20} />
          </span>
        </Orbit>
        <Orbit r={260} dur={24}>
          <span className="glass flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl text-fuchsia-300">
            <Bot size={20} />
          </span>
        </Orbit>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-28 pb-20 lg:px-8">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 flex flex-wrap items-center gap-3"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-violet-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse-dot" />
              شركة برمجيات تعمل بمحرك ذكاء اصطناعي حقيقي
            </span>
            <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-dim">
              <MapPin size={12} className="text-emerald-300" /> مصر
              <span className="text-white/30">|</span>
              <MapPin size={12} className="text-emerald-300" /> السعودية
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="font-display text-[2.6rem] leading-[1.15] font-black tracking-tight text-white sm:text-6xl lg:text-[4.4rem]"
          >
            نحوّل طلبك إلى
            <br />
            <span className="shine-text">مشروع مُسلَّم — بفريق الذكاء الاصطناعي</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-ink-dim"
          >
            <span className="font-bold text-white">NEBRAS AI</span> يدير مشروعك
            <span className="text-cyan-300 font-bold"> العقل المركزي</span>: يحلل طلبك، يخطّط
            ويوزّع على <span className="text-white font-bold">18 موظفاً ذكياً</span>، ينفذ بفحوصات
            فعلية، ويحدّث موعد التسليم — ولا يُسلَّم شيء قبل التحقق. الأسعار واضحة
            <span className="text-white font-bold"> بالجنيه المصري والريال السعودي</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="#order"
              className="btn-primary flex items-center gap-2.5 rounded-2xl px-8 py-4 font-display text-base font-black text-white"
            >
              <Sparkles size={18} />
              اطلب مشروعك الآن
            </a>
            <button
              onClick={onOpenChat}
              className="glass flex items-center gap-2.5 rounded-2xl px-7 py-4 font-display text-base font-black text-cyan-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
            >
              <Bot size={19} />
              اسأل فريقنا الذكي
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-12 grid max-w-lg grid-cols-3 gap-4"
          >
            {[
              { n: "18", l: "موظف ذكي متخصص" },
              { n: "8", l: "مراحل تنفيذ موثقة" },
              { n: "24/7", l: "تتبع حي لمشروعك" },
            ].map((s) => (
              <div key={s.l} className="glass-soft rounded-2xl px-4 py-3 text-center">
                <div className="font-display text-2xl font-black text-gradient">{s.n}</div>
                <div className="mt-1 text-[11px] font-medium text-ink-dim">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <a
        href="#services"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-ink-dim transition hover:text-cyan-300"
        aria-label="انتقل للأسفل"
      >
        <ArrowDown size={22} className="animate-bounce" />
      </a>

      {/* كلمات متحركة */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-nova-line/50 bg-nova-950/60 py-3 backdrop-blur-sm marquee-mask">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap [direction:ltr]">
          {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => (
            <span key={i} className="flex items-center gap-10 text-sm font-bold text-ink-dim/70">
              {w}
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
