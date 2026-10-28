"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Send, Menu, X } from "lucide-react";
import { LogoWord } from "./Logo";
import { WHATSAPP_LINK } from "@/lib/site";

const LINKS = [
  { href: "#services", label: "الخدمات" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#agents", label: "الفريق الذكي" },
  { href: "#process", label: "كيف نعمل" },
  { href: "/track", label: "تتبع مشروعي" },
  { href: "#contact", label: "تواصل" },
];

export function Navbar({ onOpenChat }: { onOpenChat: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? "glass shadow-[0_10px_40px_-18px_rgba(0,0,0,0.8)]" : ""
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#top" aria-label="Nova Code">
          <LogoWord compact={scrolled} />
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-dim transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={onOpenChat}
            className="glass-soft flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-ink transition hover:border-cyan-400/50 hover:text-cyan-300"
          >
            <MessageSquareText size={16} />
            تحدث معنا
          </button>
          <a
            href="#order"
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
          >
            <Send size={15} />
            اطلب مشروعك
          </a>
        </div>

        <button
          className="lg:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="القائمة"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <div className="glass lg:hidden">
          <div className="flex flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-bold text-ink-dim transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenChat();
                }}
                className="glass-soft flex-1 rounded-xl px-4 py-3 text-sm font-bold text-cyan-300"
              >
                تحدث معنا
              </button>
              <a
                href="#order"
                onClick={() => setOpen(false)}
                className="btn-primary flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold text-white"
              >
                اطلب مشروعك
              </a>
            </div>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              className="mt-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-center text-sm font-bold text-emerald-300"
            >
              واتساب مباشر: 01503724381
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
