"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Siren, Phone, Lock, Radar } from "lucide-react";
import { COMPANY } from "@/lib/site";

/** شاشة الإغلاق الكامل — بتظهر لما درع الطوارئ يتفعل من لوحة المطورين */
export default function BreachScreen() {
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      timeZone: "Africa/Cairo", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const tick = () => setClock(fmt.format(new Date()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0a0204] px-5 text-slate-100">
      {/* خلفية إنذار */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(220,38,38,0.18),transparent)]" />
        <div className="grid-bg absolute inset-0 opacity-40" />
        <motion.div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-rose-600 via-rose-400 to-rose-600"
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-2xl rounded-3xl border border-rose-500/30 bg-[#12060a]/90 p-8 text-center shadow-[0_0_120px_-30px_rgba(220,38,38,0.55)] backdrop-blur-xl sm:p-12"
      >
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-rose-500/15">
          <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <Siren className="size-10 text-rose-400" />
          </motion.span>
        </span>

        <p className="mt-6 font-mono text-[11px] font-black tracking-[0.35em] text-rose-400">SECURITY LOCKDOWN · NOVA SOC</p>
        <h1 className="mt-3 text-3xl font-black leading-snug sm:text-4xl">
          في مشكلة في المنصة — <span className="text-rose-400">تم رصد محاولة اختراق</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
          فريق الأمن السيبراني (AI Security Agents) رصد نشاطًا غير طبيعي، فتم تفعيل <b className="text-rose-300">درع الطوارئ</b> وإيقاف
          الخدمة مؤقتًا لحماية بيانات العملاء ومشاريعهم. كل البيانات مشفرة ومحفوظة، ومفيش أي حاجة اتسرقت — الإغلاق إجراء وقائي فوري.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <Lock className="mx-auto size-5 text-rose-300" />
            <p className="mt-2 text-[11px] font-black text-slate-300">الخدمات موقوفة مؤقتًا</p>
            <p className="mt-0.5 text-[10px] text-slate-500">الطلبات والمحادثات والتتبع</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <Radar className="mx-auto size-5 text-rose-300" />
            <p className="mt-2 text-[11px] font-black text-slate-300">الفحص جارٍ الآن</p>
            <p className="mt-0.5 text-[10px] text-slate-500">4 وكلاء أمن بيحللوا الحدث</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <ShieldAlert className="mx-auto size-5 text-emerald-300" />
            <p className="mt-2 text-[11px] font-black text-slate-300">بياناتك في أمان</p>
            <p className="mt-0.5 text-[10px] text-slate-500">مفيش وصول خارجي للقاعدة</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={`tel:${COMPANY.phone}`} className="flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-rose-500">
            <Phone className="size-4" /> خط الطوارئ: {COMPANY.phone}
          </a>
          <span className="rounded-2xl bg-white/[0.05] px-5 py-3.5 font-mono text-sm font-bold text-slate-400" dir="ltr">
            {clock} CAIRO
          </span>
        </div>

        <p className="mt-6 text-[11px] text-slate-600">
          هترجع الخدمة تلقائيًا أول ما فريق نوفا يلغي وضع الطوارئ من لوحة التحكم الآمنة.
        </p>
      </motion.div>
    </main>
  );
}
