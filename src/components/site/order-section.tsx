"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ShoppingBag, Smartphone, BrainCircuit, LayoutDashboard, Palette,
  Megaphone, Check, Crown, Clock, Copy, MessageCircle, MapPinCheck, X,
} from "lucide-react";
import { COMPANY } from "@/lib/site";
import { egp } from "@/lib/format";
import type { SiteService } from "@/lib/types";

const CAT_ICONS: Record<string, typeof Globe> = {
  web: Globe, store: ShoppingBag, app: Smartphone, ai: BrainCircuit, system: LayoutDashboard, design: Palette, marketing: Megaphone,
};

export default function OrderSection({ services }: { services: SiteService[] }) {
  const [picked, setPicked] = useState<SiteService | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", details: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [orderCode, setOrderCode] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) return;
    setState("sending");
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, serviceId: picked.id }),
      });
      const d = await r.json();
      if (!d.ok) {
        setState("error");
        setErr(d.error ?? "جرب تاني");
        return;
      }
      setOrderCode(d.code);
      setState("done");
    } catch {
      setState("error");
      setErr("النت عمل مشكلة.. جرب تاني");
    }
  }

  function close() {
    setPicked(null);
    setState("idle");
    setForm({ name: "", phone: "", details: "" });
    setOrderCode("");
  }

  return (
    <section id="order" className="relative py-24">
      <div className="absolute -right-40 top-1/4 size-[400px] rounded-full bg-violet-700/12 blur-[130px]" />
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— ORDER NOW —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            اطلب خدمتك <span className="text-grad">أونلاين في دقيقة</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            كتالوج برمجياتنا كله قدامك — اختار، اطلب، وهيجيلك <span className="font-bold text-cyan-300">كود تتبع</span> تشوف بيه طلبك
            بيتنفذ خطوة بخطوة لحد ما تستلم ملف الكود كامل.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {services.filter((s) => s.active).map((s, i) => {
            const Icon = CAT_ICONS[s.category] ?? Globe;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 5) * 0.07 }}
                className={`glass hover-glow relative flex flex-col rounded-3xl p-5 ${s.popular ? "border border-violet-500/40" : ""}`}
              >
                {s.popular && (
                  <span className="absolute -top-3 right-4 flex items-center gap-1 rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-600 px-3 py-1 text-[10px] font-black text-white shadow-lg">
                    <Crown className="size-3" /> مطلوبة بشدة
                  </span>
                )}
                <span className="grid size-11 w-fit place-items-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 text-violet-300">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-black leading-snug">{s.name}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{s.description}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[11px] font-bold">
                  <span className="text-cyan-300">من {egp(s.price)}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="size-3" /> {s.deliveryDays} يوم
                  </span>
                </div>
                <button
                  onClick={() => setPicked(s)}
                  className="btn-neon mt-4 w-full rounded-xl py-2.5 text-sm font-black text-white"
                >
                  اطلبها دلوقتي
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* مودال الطلب */}
      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0c1a] p-7 shadow-2xl"
            >
              {state === "done" ? (
                <div className="text-center">
                  <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/15">
                    <MapPinCheck className="size-8 text-emerald-400" />
                  </span>
                  <h3 className="mt-4 text-2xl font-black">طلبك اتسجل بنجاح!</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    فريق الاستقبال بيراجع طلبك دلوقتي. احتفظ بكود التتبع ده:
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <span className="rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/10 px-6 py-3 font-mono text-2xl font-black tracking-widest text-cyan-300" dir="ltr">
                      {orderCode}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(orderCode); }}
                      className="grid size-11 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="نسخ الكود"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    أول ما يتقبل طلبك، الذكاء الاصطناعي هيحددلك معاد التسليم بالظبط — تابعه من قسم (تتبع طلبك) تحت.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <a href="#track" onClick={close} className="btn-neon flex-1 rounded-xl py-3 text-sm font-black text-white">
                      رح لصفحة التتبع
                    </a>
                    <a
                      href={`${COMPANY.whatsapp}?text=${encodeURIComponent(`أهلًا، أنا عامل طلب جديد كود ${orderCode} — ${picked.name}`)}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-black transition hover:bg-white/5"
                    >
                      <MessageCircle className="size-4 text-emerald-400" /> أكد على واتساب
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-cyan-300">طلب خدمة جديد</p>
                      <h3 className="mt-1 text-xl font-black">{picked.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">يبدأ من {egp(picked.price)} · التسليم في ~{picked.deliveryDays} يوم عمل</p>
                    </div>
                    <button onClick={close} className="grid size-9 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10">
                      <X className="size-4" />
                    </button>
                  </div>
                  <form onSubmit={submit} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-400">اسمك</label>
                        <input className="nova-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسمك الكامل" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-400">رقم الموبايل</label>
                        <input className="nova-input" required dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-400">تفاصيل طلبك (اختياري بس بيساعدنا ننفذ صح)</label>
                      <textarea className="nova-input min-h-24 resize-y" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="مثال: عندي براند ملابس وعايز متجر بألوان أسود وذهبي..." />
                    </div>
                    {state === "error" && <p className="text-sm font-bold text-rose-400">{err}</p>}
                    <button type="submit" disabled={state === "sending"} className="btn-neon w-full rounded-xl py-3.5 font-black text-white disabled:opacity-50">
                      {state === "sending" ? "جاري تسجيل الطلب..." : "سجّل الطلب وهات كود التتبع"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
