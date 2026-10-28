"use client";

import { MessageCircle, Mail, Clock, MapPin, ArrowUpLeft } from "lucide-react";
import { COMPANY, WHATSAPP_LINK } from "@/lib/site";
import { Reveal } from "./Reveal";

export function ContactSection() {
  return (
    <section id="contact" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-display text-4xl font-black text-white sm:text-5xl">
            تواصل معنا — <span className="text-gradient">نرد في نفس اليوم</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-dim">
            قنواتنا الرسمية الوحيدة — احذر أي جهة تدّعي تمثيلنا بوسائل أخرى.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Reveal delay={0.05}>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              className="glass card-hover group flex h-full flex-col rounded-[2rem] p-8"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <MessageCircle size={26} />
              </span>
              <h3 className="font-display mt-5 text-2xl font-black text-white">واتساب مباشر</h3>
              <p className="mt-2 flex-1 text-sm text-ink-dim">
                أسرع طريق للرد — لفظية أو كتابية، مصر والسعودية.
              </p>
              <div className="mt-6 flex items-center justify-between">
                <span dir="ltr" className="font-display text-2xl font-black tracking-wide text-emerald-300">
                  {COMPANY.whatsappDisplay}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-300/80 transition group-hover:gap-2">
                  افتح المحادثة <ArrowUpLeft size={14} />
                </span>
              </div>
            </a>
          </Reveal>

          <Reveal delay={0.12}>
            <a
              href={`mailto:${COMPANY.email}`}
              className="glass card-hover group flex h-full flex-col rounded-[2rem] p-8"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                <Mail size={26} />
              </span>
              <h3 className="font-display mt-5 text-2xl font-black text-white">البريد الإلكتروني</h3>
              <p className="mt-2 flex-1 text-sm text-ink-dim">
                للعروض الرسمية، الشراكات، والمستندات التعاقدية.
              </p>
              <div className="mt-6 flex items-center justify-between gap-3">
                <span dir="ltr" className="font-display break-all text-lg font-black text-cyan-300">
                  {COMPANY.email}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-cyan-300/80 transition group-hover:gap-2">
                  راسلنا <ArrowUpLeft size={14} />
                </span>
              </div>
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="mt-8">
          <div className="glass-soft grid gap-4 rounded-2xl p-6 text-center sm:grid-cols-2">
            <div className="flex items-center justify-center gap-2 text-sm text-ink-dim">
              <Clock size={16} className="text-violet-300" />
              مواعيد الرد: يومياً ١٠ صباحاً — ١٢ منتصف الليل
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-ink-dim">
              <MapPin size={16} className="text-violet-300" />
              نخدم مصر والسعودية فقط — عن بُعد وبكفاءة كاملة
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
