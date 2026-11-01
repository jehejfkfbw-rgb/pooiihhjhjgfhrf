import { Shield, Radar, Siren, Bot } from "lucide-react";
import type { SiteSecurityAgent } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  watching: "مراقبة حية",
  scanning: "فحص ثغرات",
  defending: "وضع دفاعي",
  maintenance: "صيانة",
};

export function CyberDefense({ agents }: { agents: SiteSecurityAgent[] }) {
  return (
    <section className="relative py-24">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-l from-transparent via-rose-500/25 to-transparent" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— CYBER DEFENSE —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            فريق <span className="text-grad">AI Security Agents</span> شغال 24/7
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            مراقبة مرور لحظية، كشف محاولات SQLi/XSS، فحص ثغرات داخلي، وزر طوارئ دفاعي — كله محلي بالكامل من غير ما نغيّر نموذج الذكاء الاصطناعي الأساسي.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {agents.map((a) => (
            <div key={a.id} className="glass hover-glow rounded-3xl p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-cyan-500/20 text-rose-300">
                  <Bot className="size-6" />
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-cyan-300">{STATUS_LABEL[a.status] ?? a.status}</span>
              </div>
              <p className="mt-4 font-mono text-[10px] tracking-widest text-slate-500">{a.code}</p>
              <h3 className="mt-1 text-xl font-black">{a.name}</h3>
              <p className="mt-1 text-sm font-bold text-rose-300">{a.role}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{a.specialty}</p>
              <div className="mt-4 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-300"><Shield className="size-3.5" /> {a.confidence}% ثقة</span>
                <span className="flex items-center gap-1.5 text-cyan-300"><Radar className="size-3.5" /> {a.responseMs}ms</span>
              </div>
            </div>
          ))}
        </div>

        <div className="glass mt-8 rounded-3xl p-6 text-sm leading-relaxed text-slate-300">
          <p className="flex items-center gap-2 font-black text-rose-300">
            <Siren className="size-4" /> ملاحظة تشغيلية
          </p>
          <p className="mt-2">
            أضفنا keepalive وفحص صحي دوري لتطويل استمرارية الخدمة <b>طالما فيه زائر أو لوحة مفتوحة</b>.
            أما تثبيت رابط المعاينة المؤقت نفسه بشكل دائم فده بيعتمد على منصة الاستضافة، والحل الإنتاجي الدائم هو دومين ثابت على Vercel أو مزوّد دائم.
          </p>
        </div>
      </div>
    </section>
  );
}
