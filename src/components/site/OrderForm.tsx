"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle2, Phone, User, FileText, Wrench } from "lucide-react";
import { SERVICES, formatPrice, type Currency } from "@/lib/site";
import { Reveal } from "./Reveal";

export function OrderForm() {
  const [currency, setCurrency] = useState<Currency>("EGP");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      clientName: String(fd.get("clientName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      service: String(fd.get("service") ?? ""),
      budget: `${String(fd.get("budget") ?? "")} ${currency === "EGP" ? "ج.م" : "ر.س"}`.trim(),
      details: String(fd.get("details") ?? ""),
    };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "تعذر إرسال الطلب");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="order" className="relative py-28">
      <div className="nebula absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-4xl px-5 lg:px-8">
        <Reveal>
          <div className="glass overflow-hidden rounded-[2rem] p-1">
            <div className="rounded-[1.8rem] bg-nova-950/60 p-8 sm:p-12">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 text-center"
                  >
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <CheckCircle2 size={40} />
                    </span>
                    <h3 className="font-display mt-6 text-3xl font-black text-white">
                      تم استلام طلبك بنجاح
                    </h3>
                    <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-dim">
                      فريق التطوير الذكي بدأ تجهيز مقترح التنفيذ — وسيُعرض على إدارة نوفا كود
                      للاعتماد أولاً، ثم نتواصل معك على جوالك بالخطة والسعر النهائي.
                    </p>
                    <button
                      onClick={() => setDone(false)}
                      className="glass-soft mt-8 rounded-xl px-6 py-3 text-sm font-bold text-cyan-300"
                    >
                      إرسال طلب آخر
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" exit={{ opacity: 0, y: -14 }}>
                    <div className="text-center">
                      <h2 className="font-display text-4xl font-black text-white">
                        اطلب <span className="text-gradient">مشروعك</span>
                      </h2>
                      <p className="mx-auto mt-3 max-w-lg text-sm text-ink-dim">
                        املأ النموذج وسيجهز فريقنا الذكي مقترح التنفيذ، ثم يُعتمد من الإدارة ونتواصل
                        معك — مجاناً وبدون التزام.
                      </p>
                    </div>

                    <form onSubmit={submit} className="mt-10 grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-dim">
                          <User size={14} /> الاسم الكامل
                        </span>
                        <input required name="clientName" className="field" placeholder="مثال: محمد عبد الله" />
                      </label>
                      <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-dim">
                          <Phone size={14} /> رقم الجوال (واتساب)
                        </span>
                        <input
                          required
                          name="phone"
                          className="field text-left"
                          dir="ltr"
                          placeholder="01xxxxxxxxx / 05xxxxxxxx"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-dim">
                          <Wrench size={14} /> الخدمة المطلوبة
                        </span>
                        <select name="service" className="field" defaultValue={SERVICES[0].title}>
                          {SERVICES.map((s) => (
                            <option key={s.id} value={s.title}>
                              {s.title} — {s.unit ?? "يبدأ من"} {formatPrice(s.price.EGP, "EGP")} /{" "}
                              {formatPrice(s.price.SAR, "SAR")}
                            </option>
                          ))}
                          <option value="مشروع مخصص / غير ذلك">مشروع مخصص / غير ذلك</option>
                        </select>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-xs font-bold text-ink-dim">
                          الميزانية التقريبية (اختياري)
                        </span>
                        <div className="flex gap-3">
                          <input
                            name="budget"
                            className="field flex-1"
                            inputMode="numeric"
                            placeholder="مثال: 20000"
                          />
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="field w-36"
                          >
                            <option value="EGP">جنيه مصري</option>
                            <option value="SAR">ريال سعودي</option>
                          </select>
                        </div>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-dim">
                          <FileText size={14} /> فكرة المشروع بالتفصيل
                        </span>
                        <textarea
                          required
                          name="details"
                          rows={5}
                          className="field resize-none"
                          placeholder="اشرح فكرتك: ماذا تريد أن يفعل النظام؟ لمن؟ وما أهم ٣ مميزات لا غنى عنها؟"
                        />
                      </label>

                      {error && (
                        <p className="sm:col-span-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300">
                          {error}
                        </p>
                      )}

                      <button
                        disabled={loading}
                        className="btn-primary sm:col-span-2 flex items-center justify-center gap-3 rounded-2xl px-8 py-4 font-display text-base font-black text-white disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={19} />
                            جارٍ إرسال طلبك للفريق...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            أرسل الطلب لفريق نوفا كود
                          </>
                        )}
                      </button>
                      <p className="sm:col-span-2 text-center text-[11px] text-ink-dim">
                        بياناتك في أمان — تُستخدم فقط للتواصل بشأن طلبك ولا تُشارك مع أي طرف ثالث.
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
