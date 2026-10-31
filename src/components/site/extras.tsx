import { Sparkle, Star, Quote } from "lucide-react";

const MARQUEE = [
  "مواقع إلكترونية", "متاجر أونلاين", "تطبيقات موبايل", "ذكاء اصطناعي محلي",
  "لوحات تحكم", "دفع إلكتروني مصري", "هوية بصرية", "تحسين محركات البحث",
];

export function MarqueeStrip() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.07] bg-white/[0.02] py-4" dir="ltr">
      <div className="anim-marquee flex w-max items-center gap-10" style={{ direction: "ltr" }}>
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap" dir="rtl">
            <span className="text-lg font-black text-slate-300">{t}</span>
            <Sparkle className="size-4 text-violet-400/70" />
          </span>
        ))}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "أحمد الشريف", role: "صاحب متجر إلكتروني — القاهرة",
    text: "المتجر نزل في 3 أسابيع بالظبط زي المتفق عليه، والمبيعات زادت 4 أضعاف في أول شهرين. التعامل معاهم محترم والتسليم قبل المعاد.",
  },
  {
    name: "د. منى عبد الرحمن", role: "شبكة عيادات — مدينة نصر",
    text: "نظام الحجوزات غيّر شغلنا بالكامل. البوت بتاعهم بيرد على المرضى بالمصري وكأنه موظفة استقبال حقيقية. حاجة تشرّف.",
  },
  {
    name: "كريم فؤاد", role: "مؤسس تطبيق توصيل — الإسكندرية",
    text: "كنت خايف من موضوع الشركات، بس دول اشتغلوا معايا بعقد واضح ومراحل واضحة. التطبيق خرج أحسن من اللي في دماغي أصلاً.",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-l from-transparent via-cyan-500/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— REVIEWS —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">عملائنا <span className="text-grad">بيتكلموا عنا</span></h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="glass hover-glow relative rounded-3xl p-7">
              <Quote className="absolute left-6 top-6 size-8 text-violet-500/20" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-4 min-h-28 text-sm leading-relaxed text-slate-300">{t.text}</blockquote>
              <figcaption className="mt-6 border-t border-white/[0.07] pt-4">
                <p className="font-black">{t.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
