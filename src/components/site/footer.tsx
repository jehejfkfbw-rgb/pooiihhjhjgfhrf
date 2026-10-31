import Link from "next/link";
import { Phone, Mail, MessageCircle, MapPin, Heart } from "lucide-react";
import { COMPANY, DASH_PATH } from "@/lib/site";

const SERVICE_LINKS = ["مواقع إلكترونية", "متاجر إلكترونية", "تطبيقات موبايل", "ذكاء اصطناعي محلي", "أنظمة إدارة", "هوية وتسويق"];
const QUICK_LINKS = [
  { href: "#services", label: "خدماتنا" },
  { href: "#order", label: "اطلب خدمتك أونلاين" },
  { href: "#track", label: "تتبع طلبك" },
  { href: "#team", label: "فريق نوفا" },
  { href: "#work", label: "أعمالنا" },
  { href: "#contact", label: "تواصل معانا" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-black/30">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
                <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
              </span>
              <div>
                <p className="text-lg font-black">نوفا ديجيتال</p>
                <p className="font-mono text-[9px] tracking-[0.35em] text-violet-300/70">NOVA · DIGITAL</p>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
              شركة برمجيات مصرية بتبني سوفتوير أسطوري: مواقع، متاجر، تطبيقات، وأنظمة ذكاء اصطناعي محلية شغالة على بياناتك.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-black text-slate-200">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-slate-400 transition hover:text-cyan-300">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-black text-slate-200">خدماتنا</h4>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((s) => (
                <li key={s}><a href="#services" className="text-sm text-slate-400 transition hover:text-cyan-300">{s}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-black text-slate-200">كلمنا</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-violet-400" />
                <a href={`tel:${COMPANY.phone}`} dir="ltr" className="transition hover:text-cyan-300">{COMPANY.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="size-4 text-emerald-400" />
                <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="transition hover:text-cyan-300">واتساب — رد في 5 دقايق</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-cyan-400" />
                <a href={`mailto:${COMPANY.email}`} dir="ltr" className="transition hover:text-cyan-300">{COMPANY.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-pink-400" />
                {COMPANY.city} — بنخدم كل المحافظات
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex items-center justify-between border-t border-white/[0.07] pt-6">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            © 2026 نوفا ديجيتال — كل الحقوق محفوظة · صُنع
            <Heart className="size-3 fill-rose-500 text-rose-500" />
            في مصر
          </p>
          {/* البوابة السرية لنواة المطور — مش بتظهر لحد */}
          <Link
            href={DASH_PATH}
            aria-label="core"
            className="size-2 rounded-full bg-white/10 transition hover:bg-violet-400 hover:shadow-[0_0_12px_rgba(139,92,246,0.9)]"
          />
        </div>
      </div>
    </footer>
  );
}
