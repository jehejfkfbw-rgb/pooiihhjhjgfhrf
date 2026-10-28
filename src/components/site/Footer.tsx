import { COMPANY, WHATSAPP_LINK } from "@/lib/site";
import { LogoWord } from "./Logo";
import { MessageCircle, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-nova-line/60 py-14">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <LogoWord compact />
          <p className="max-w-md text-center md:text-start text-sm leading-relaxed text-ink-dim">
            NEBRAS AI — نبراس: شركة برمجيات تخدم السوقين المصري والسعودي فقط، بمحرك ذكاء اصطناعي
            مركزي يدير 18 موظفاً ذكياً من التحليل إلى التسليم الموثق.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              aria-label="واتساب"
              className="glass-soft flex h-11 w-11 items-center justify-center rounded-xl text-emerald-300 transition hover:border-emerald-400/40"
            >
              <MessageCircle size={19} />
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              aria-label="البريد"
              className="glass-soft flex h-11 w-11 items-center justify-center rounded-xl text-cyan-300 transition hover:border-cyan-400/40"
            >
              <Mail size={19} />
            </a>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-ink-dim md:flex-row">
          <span>
            © {new Date().getFullYear()} Nova Code — جميع الحقوق محفوظة.
          </span>
          <span dir="ltr" className="font-medium">
            {COMPANY.whatsappDisplay} · {COMPANY.email}
          </span>
        </div>
      </div>
    </footer>
  );
}
