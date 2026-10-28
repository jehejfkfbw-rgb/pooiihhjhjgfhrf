"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Smartphone,
  Database,
  Bot,
  Palette,
  ShieldCheck,
  Check,
  ArrowLeft,
} from "lucide-react";
import {
  SERVICES,
  CURRENCY_LABEL,
  CURRENCY_NAME,
  formatPrice,
  type Currency,
  type ServiceIconKey,
} from "@/lib/site";
import { Reveal } from "./Reveal";

const ICONS: Record<ServiceIconKey, React.ComponentType<{ size?: number; className?: string }>> = {
  globe: Globe,
  smartphone: Smartphone,
  database: Database,
  bot: Bot,
  palette: Palette,
  shield: ShieldCheck,
};

const GRADIENTS = [
  "from-cyan-400/25 to-sky-500/5 text-cyan-300",
  "from-violet-400/25 to-fuchsia-500/5 text-violet-300",
  "from-emerald-400/25 to-teal-500/5 text-emerald-300",
  "from-fuchsia-400/25 to-purple-500/5 text-fuchsia-300",
  "from-amber-400/25 to-orange-500/5 text-amber-300",
  "from-rose-400/25 to-pink-500/5 text-rose-300",
];

export function CurrencyToggle({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div className="glass inline-flex rounded-full p-1.5">
      {(["EGP", "SAR"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`relative rounded-full px-5 py-2 text-sm font-bold transition-colors ${
            currency === c ? "text-white" : "text-ink-dim hover:text-white"
          }`}
        >
          {currency === c && (
            <motion.span
              layoutId="currency-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-l from-violet-600 to-cyan-600"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative">
            {CURRENCY_NAME[c]} <span className="opacity-70">({CURRENCY_LABEL[c]})</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function ServicesSection() {
  const [currency, setCurrency] = useState<Currency>("EGP");

  return (
    <section id="services" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="text-center">
          <span className="glass inline-block rounded-full px-4 py-1.5 text-xs font-bold text-cyan-300">
            خدماتنا — سعران، عملتان، جودة واحدة
          </span>
          <h2 className="font-display mt-5 text-4xl font-black text-white sm:text-5xl">
            خدمات تغطي <span className="text-gradient">رحلتك الرقمية</span> كاملة
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-dim">
            بدّل بين الجنيه المصري والريال السعودي لترى أسعارنا الرسمية لكل سوق — الشفافية تبدأ من
            أول زيارة.
          </p>
          <div className="mt-8 flex justify-center">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
        </Reveal>

        <div id="pricing" className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <Reveal key={s.id} delay={i * 0.06}>
                <article className="glass-soft card-hover group relative flex h-full flex-col overflow-hidden rounded-3xl p-7">
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} border border-white/5`}
                  >
                    <Icon size={26} />
                  </div>
                  <h3 className="font-display text-xl font-black text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{s.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-ink-dim">
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <div className="flex items-end justify-between border-t border-white/5 pt-5">
                      <div>
                        <div className="text-[11px] text-ink-dim">{s.unit ?? "يبدأ من"}</div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currency}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="font-display text-2xl font-black text-white"
                          >
                            {formatPrice(s.price[currency], currency)}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <a
                        href="#order"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-ink-dim transition group-hover:border-cyan-400/40 group-hover:text-cyan-300"
                      >
                        اطلبها
                        <ArrowLeft size={14} />
                      </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.15} className="mt-10">
          <p className="text-center text-xs text-ink-dim">
            الأسعار المذكورة تمهيدية ويبدأ منها التقييم — العرض النهائي يُقدَّم بعد دراسة طلبك
            واعتماده من إدارة نوفا كود.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
