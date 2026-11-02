"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Mail, Clock, Send, CheckCircle2, LoaderCircle } from "lucide-react";
import { COMPANY } from "@/lib/site";

export default function Contact({ hoursLabel }: { hoursLabel: string }) {
  const [form, setForm] = useState({ name: "", phone: "", service: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErr("");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.ok) {
        setState("error");
        setErr(d.error ?? "جرب تاني");
        return;
      }
      setState("sent");
      setForm({ name: "", phone: "", service: "", message: "" });
    } catch {
      setState("error");
      setErr("النت عمل مشكلة.. جرب تاني");
    }
  }

  const cards = [
    { icon: Phone, label: "مكالمة مباشرة", value: COMPANY.phone, href: `tel:${COMPANY.phone}`, dir: "ltr" as const },
    { icon: MessageCircle, label: "واتساب", value: "ابدأ شات دلوقتي", href: COMPANY.whatsapp },
    { icon: Mail, label: "الإيميل", value: COMPANY.email, href: `mailto:${COMPANY.email}`, dir: "ltr" as const },
    { icon: Clock, label: "مواعيد العمل", value: hoursLabel },
  ];

  return (
    <section id="contact" className="relative overflow-hidden py-24">
      <div className="absolute -right-40 bottom-0 size-[420px] rounded-full bg-cyan-600/15 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— CONTACT —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            جاهز تبدأ؟ <span className="text-grad">كلمنا دلوقتي</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">سيب بياناتك أو كلمنا مباشرة — الرد بياخد أقل من 5 دقايق في مواعيد العمل.</p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          {/* كروت التواصل */}
          <div className="space-y-4 lg:col-span-2">
            {cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                {c.href ? (
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="glass hover-glow flex items-center gap-4 rounded-2xl p-5">
                    <span className="btn-neon grid size-12 shrink-0 place-items-center rounded-xl text-white"><c.icon className="size-5" /></span>
                    <span>
                      <span className="block text-xs font-bold text-slate-400">{c.label}</span>
                      <span className="block font-black" dir={c.dir}>{c.value}</span>
                    </span>
                  </a>
                ) : (
                  <div className="glass flex items-center gap-4 rounded-2xl p-5">
                    <span className="btn-neon grid size-12 shrink-0 place-items-center rounded-xl text-white"><c.icon className="size-5" /></span>
                    <span>
                      <span className="block text-xs font-bold text-slate-400">{c.label}</span>
                      <span className="block font-black">{c.value}</span>
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* الفورم */}
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-7 lg:col-span-3"
          >
            {state === "sent" ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                <CheckCircle2 className="size-16 text-emerald-400" />
                <h3 className="mt-4 text-2xl font-black">وصلت رسالتك!</h3>
                <p className="mt-2 max-w-sm text-slate-400">هنكلمك في أسرع وقت. ولو مستعجل، ابعتلنا واتساب على {COMPANY.phone} دلوقتي.</p>
                <button type="button" onClick={() => setState("idle")} className="mt-6 rounded-xl border border-white/15 px-6 py-2.5 text-sm font-bold transition hover:bg-white/5">
                  ابعت رسالة تانية
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-400">اسمك</label>
                    <input className="nova-input" placeholder="مثال: أحمد محمود" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-400">رقم الموبايل</label>
                    <input className="nova-input" dir="ltr" placeholder="01xxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold text-slate-400">نوع المشروع</label>
                  <select className="nova-input appearance-none" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    <option value="">اختار...</option>
                    <option>موقع إلكتروني</option>
                    <option>متجر إلكتروني</option>
                    <option>تطبيق موبايل</option>
                    <option>نظام إدارة / لوحة تحكم</option>
                    <option>ذكاء اصطناعي / شات بوت</option>
                    <option>هوية بصرية وتسويق</option>
                    <option>حاجة تانية</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold text-slate-400">حكاية مشروعك (اختياري)</label>
                  <textarea className="nova-input min-h-28 resize-y" placeholder="احكيلنا باختصار عن فكرتك..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                {state === "error" && <p className="mt-3 text-sm font-bold text-rose-400">{err}</p>}
                <button type="submit" disabled={state === "sending"} className="btn-neon mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white disabled:opacity-50">
                  {state === "sending" ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-4 -scale-x-100" />}
                  {state === "sending" ? "جاري الإرسال..." : "ابعت طلبك"}
                </button>
              </>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
}
