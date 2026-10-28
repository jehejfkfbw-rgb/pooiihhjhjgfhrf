"use client";

import { ClipboardList, Bot, BadgeCheck, Code2, Rocket } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: ClipboardList,
    title: "املأ طلب مشروعك",
    desc: "نموذج واحد بدقيقتين يشرح فكرتك وميزانيتك — أو راسلنا واتساب مباشرة.",
    key: "٢ دقيقة",
  },
  {
    icon: Bot,
    title: "الفريق الذكي يجهّز المقترح",
    desc: "كريم وسارة وعمر يحللون طلبك ويبنون خطة تنفيذ كاملة بالتقنيات والجدول الزمني.",
    key: "فوري",
  },
  {
    icon: BadgeCheck,
    title: "اعتماد الإدارة — شرط أساسي",
    desc: "المدير يراجع كل مقترح بنفسه في لوحة التحكم. لا يُعتمد ولا يُسلَّم أي عمل دون موافقته.",
    key: "إلزامي",
    highlight: true,
  },
  {
    icon: Code2,
    title: "التنفيذ بمتابعة شفافة",
    desc: "تطوير مرحلي بتقارير دورية وروابط تجربة مباشرة حتى لا تفاجأ بالنتيجة النهائية.",
    key: "أسبوعياً",
  },
  {
    icon: Rocket,
    title: "الإطلاق والدعم",
    desc: "إطلاق رسمي، تدريب على الاستخدام، وضمان صيانة ودعم حقيقي للسوقين المصري والسعودي.",
    key: "مستمر",
  },
];

export function ProcessSection() {
  return (
    <section id="process" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-display text-4xl font-black text-white sm:text-5xl">
            كيف نعمل؟ <span className="text-gradient">خمس خطوات</span> لا غبار عليها
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-dim">
            منهجية ثابتة تجمع سرعة الذكاء الاصطناعي بصرامة المراجعة البشرية.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.07} className="h-full">
              <div
                className={`card-hover relative flex h-full flex-col rounded-3xl p-6 ${
                  s.highlight
                    ? "glass border-2 border-fuchsia-400/50 shadow-[0_0_50px_-12px_rgba(217,70,239,0.4)]"
                    : "glass-soft"
                }`}
              >
                {s.highlight && (
                  <span className="absolute -top-3 start-4 rounded-full bg-gradient-to-l from-fuchsia-500 to-violet-500 px-3 py-1 text-[10px] font-black text-white">
                    شرط الجودة لدينا
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      s.highlight
                        ? "bg-gradient-to-br from-fuchsia-500/40 to-violet-500/20 text-fuchsia-200"
                        : "bg-violet-500/15 text-violet-300"
                    }`}
                  >
                    <s.icon size={20} />
                  </span>
                  <span className="font-display text-4xl font-black text-white/8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-base font-black text-white">{s.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-dim">{s.desc}</p>
                <span className="mt-4 w-fit rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-cyan-300">
                  {s.key}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
