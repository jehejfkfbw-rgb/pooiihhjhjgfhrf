"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  CheckCircle2,
  Phone,
  User,
  FileText,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { SERVICES, formatPrice, type Currency } from "@/lib/site";
import { Reveal } from "./Reveal";

const TYPE_BY_SERVICE: Record<string, string> = {
  "مواقع ومتاجر إلكترونية": "web",
  "تطبيقات الموبايل": "app",
  "أنظمة إدارة مخصصة ERP/CRM": "software",
  "تصميم UI/UX وهوية بصرية": "design",
};

export function OrderForm() {
  const [currency, setCurrency] = useState<Currency>("EGP");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refId = useMemo(() => crypto.randomUUID(), [done]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const service = String(fd.get("service") ?? "");
    const payload = {
      refId,
      clientName: String(fd.get("clientName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      service,
      title: String(fd.get("title") ?? "").trim(),
      serviceType: TYPE_BY_SERVICE[service] ?? "",
      budget: `${String(fd.get("budget") ?? "")} ${currency === "EGP" ? "ج.م" : "ر.س"}`.trim(),
      details: String(fd.get("details") ?? ""),
      priority: String(fd.get("priority") ?? "normal"),
      deadlineWish: String(fd.get("deadlineWish") ?? "").trim(),
    };
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "تعذر إرسال الطلب");
      setDone({ code: data.code });
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
                      العقل المركزي استلم مشروعك
                    </h3>
                    <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-dim">
                      بدأ التحليل الآن: محلل الأعمال، المهندس التقني، ومدير المشاريع سيعيدون إليك
                      خطة التنفيذ والتقدير — وسيُعتمد كل شيء من الإدارة قبل التنفيذ.
                    </p>
                    <div className="mx-auto mt-7 max-w-xs rounded-2xl border border-cyan-400/30 bg-cyan-400/5 px-6 py-4">
                      <div className="text-[11px] text-ink-dim">رمز متابعة مشروعك</div>
                      <div dir="ltr" className="font-mono text-2xl font-black tracking-widest text-cyan-300">
                        {done.code}
                      </div>
                    </div>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      <a
                        href={`/track/${done.code}`}
                        className="btn-primary flex items-center gap-2 rounded-xl px-7 py-3.5 font-display text-sm font-black text-white"
                      >
                        <ExternalLink size={15} />
                        تابع مشروعك لحظة بلحظة
                      </a>
                      <button
                        onClick={() => {
                          setDone(null);
                        }}
                        className="glass-soft rounded-xl px-6 py-3.5 text-sm font-bold text-cyan-300"
                      >
                        إرسال طلب آخر
                      </button>
                    </div>
                    <p className="mt-5 text-[11px] text-ink-dim">
                      احتفظ بالرمز — به تفتح حالة مشروعك، وملفاتك، والتسليم فقط.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" exit={{ opacity: 0, y: -14 }}>
                    <div className="text-center">
                      <h2 className="font-display text-4xl font-black text-white">
                        اطلب <span className="text-gradient">مشروعك</span>
                      </h2>
                      <p className="mx-auto mt-3 max-w-lg text-sm text-ink-dim">
                        العقل المركزي يحلل، ويخطّط، ويُقدّر — والفريق الذكي ينفذ بفحوصات فعلية.
                        تابع كل خطوة من صفحة المتابعة برمز سري خاص بك.
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
                        <span className="mb-2 block text-xs font-bold text-ink-dim">عنوان المشروع (اختياري)</span>
                        <input name="title" className="field" placeholder="مثال: متجر أزياء «سِدر»" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-ink-dim">الأولوية</span>
                        <select name="priority" className="field" defaultValue="normal">
                          <option value="low">عادية</option>
                          <option value="normal">قياسية</option>
                          <option value="high">عاجل</option>
                          <option value="urgent">حرج — له موعد ثابت</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-ink-dim">الموعد المطلوب (اختياري)</span>
                        <input name="deadlineWish" className="field" placeholder="مثال: قبل نهاية الشهر" />
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
                          placeholder="اشرح فكرتك: ماذا يفعل النظام؟ لمن؟ وما أهم ٣ مميزات؟ وهل تحتاج دفع أونلاين أو مصادقة؟ (كلما أوضح كان التحليل أدق)"
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
                            العقل المركزي يستلم مشروعك...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            أرسل مشروعك للعقل المركزي
                          </>
                        )}
                      </button>
                      <p className="sm:col-span-2 text-center text-[11px] text-ink-dim">
                        لن يبدأ أي عمل إلا بعد اعتمادك للنطاق والتقدير — وبياناتك تظهر لك وحدك عبر رمز المتابعة.
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
