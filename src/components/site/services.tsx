import { Globe, ShoppingBag, Smartphone, BrainCircuit, LayoutDashboard, Palette, Check, Crown } from "lucide-react";
import { COMPANY } from "@/lib/site";

const SERVICES = [
  { icon: Globe, title: "تصميم وتطوير المواقع", desc: "مواقع تعريفية ومنصات شركات سريعة البرق، بتفتح في أقل من ثانية ومتجهزة لمحركات البحث.", price: "4,999 ج.م" },
  { icon: ShoppingBag, title: "متاجر إلكترونية", desc: "متاجر متكاملة ببوابات دفع مصرية (فودافون كاش، انستاباي، فيزا) + شحن ولوحة تحكم سهلة.", price: "11,999 ج.م" },
  { icon: Smartphone, title: "تطبيقات موبايل", desc: "iOS وAndroid بكود واحد، إشعارات وخرايط ومدفوعات، ونشر رسمي على المتاجر.", price: "24,999 ج.م" },
  { icon: BrainCircuit, title: "ذكاء اصطناعي محلي", desc: "شات بوتس بتفهم اللهجة المصرية، تحليل بيانات، ورؤية حاسوبية — كلها شغالة على بياناتك أنت.", price: "9,999 ج.م" },
  { icon: LayoutDashboard, title: "أنظمة إدارة ولوحات تحكم", desc: "ERP / CRM / مخازن وفواتير، بصلاحيات مستخدمين وتقارير لحظية مفصّلة على شغلك.", price: "14,999 ج.م" },
  { icon: Palette, title: "هوية بصرية وتسويق", desc: "لوجوهات وهوية كاملة، SEO، وإعلانات ممولة على فيسبوك وجوجل وتيك توك.", price: "1,499 ج.م" },
];

const TIERS = [
  {
    name: "البداية", price: "4,999", unit: "ج.م", tag: "موقع تعريفي", featured: false,
    features: ["تصميم فخم متجاوب مع الموبايل", "5 صفحات + نموذج تواصل", "دومين + استضافة أول سنة هدية", "ربط واتساب وخرائط جوجل", "تسليم خلال 7-14 يوم", "دعم فني 3 شهور مجانًا"],
    wa: "أهلاً، عايز أبدأ بباقة البداية (موقع تعريفي 4,999 ج.م)",
  },
  {
    name: "النمو", price: "11,999", unit: "ج.م", tag: "متجر إلكتروني", featured: true,
    features: ["منتجات وطلبات غير محدودة", "دفع: فودافون كاش / انستاباي / فيزا", "ربط شركات الشحن", "لوحة تحكم + تقارير مبيعات", "تدريبك على الإدارة بنفسك", "تسليم خلال ~21 يوم"],
    wa: "أهلاً، مهتم بباقة النمو (متجر إلكتروني 11,999 ج.م)",
  },
  {
    name: "الأسطورة", price: "مخصوص", unit: "", tag: "نظام متكامل", featured: false,
    features: ["موقع + تطبيق + نظام إدارة", "مساعد ذكاء اصطناعي محلي لعملائك", "أولوية فريق NOVA CORE الكامل", "تكاملات مخصوصة غير محدودة", "SLA دعم أولوية 24/7", "جلسة تحليل مجانية قبل البدء"],
    wa: "أهلاً، عندي مشروع كبير وعايز باقة الأسطورة (سعر مخصوص)",
  },
];

export function Services() {
  return (
    <section id="services" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— SERVICES —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            خدمات <span className="text-grad">بتغطي كل حاجة</span> في رحلتك الرقمية
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">من أول سطر كود لحد ما مشروعك يبقى براند — كل ده تحت سقف واحد وبالجنيه المصري.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, idx) => (
            <div key={s.title} className="glass hover-glow group relative overflow-hidden rounded-3xl p-7">
              <span className="pointer-events-none absolute -left-3 -top-5 font-mono text-7xl font-black text-white/[0.04]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="relative">
                <span className="mb-5 grid size-13 w-fit place-items-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 p-3.5 text-violet-300 transition group-hover:scale-110">
                  <s.icon className="size-6" />
                </span>
                <h3 className="text-xl font-black">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-cyan-300">
                  يبدأ من {s.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-l from-transparent via-violet-500/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— PRICING —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            باقات واضحة، <span className="text-grad-gold">بالجنيه المصري</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">مفيش مفاجآت ومفيش أرقام مخفية. الباقة اللي تعجبك خدها زي ما هي أو عدّلها على مزاجك.</p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl p-[1.5px] ${t.featured ? "ring-conic shadow-[0_0_60px_-15px_rgba(139,92,246,0.6)]" : "bg-white/10"}`}
            >
              {t.featured && (
                <span className="absolute -top-3.5 right-1/2 translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-1.5 text-xs font-black text-white shadow-lg">
                  <Crown className="size-3.5" /> الأكثر طلبًا
                </span>
              )}
              <div className="flex flex-1 flex-col rounded-3xl bg-[#0a0c1a] p-8">
                <p className="text-sm font-bold text-slate-400">{t.tag}</p>
                <h3 className="mt-1 text-2xl font-black">{t.name}</h3>
                <div className="mt-5 flex items-end gap-2">
                  <span className={`font-black ${t.price === "مخصوص" ? "text-grad text-4xl" : "text-5xl text-white"}`}>{t.price}</span>
                  {t.unit && <span className="pb-2 text-slate-400">{t.unit}</span>}
                </div>
                <ul className="mt-7 flex-1 space-y-3.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15">
                        <Check className="size-3 text-emerald-400" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`${COMPANY.whatsapp}?text=${encodeURIComponent(t.wa)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-8 block rounded-2xl py-3.5 text-center text-sm font-black transition ${
                    t.featured ? "btn-neon text-white" : "border border-white/15 bg-white/5 hover:border-violet-400/50 hover:bg-violet-500/10"
                  }`}
                >
                  اطلب الباقة دلوقتي
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          كل الباقات قابلة للتقسيط: 50% مقدم · 30% أول نسخة تجريبية · 20% عند التسليم. عايز حاجة مختلفة؟ نعملك عرض سعر مخصوص.
        </p>
      </div>
    </section>
  );
}
