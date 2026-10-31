"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/site";

const LINKS = [
  { href: "#services", label: "خدماتنا" },
  { href: "#order", label: "اطلب خدمتك" },
  { href: "#team", label: "فريق نوفا" },
  { href: "#work", label: "أعمالنا" },
  { href: "#track", label: "تتبع طلبك" },
  { href: "/account", label: "حسابي" },
  { href: "#contact", label: "تواصل معانا" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#03040c]/85 backdrop-blur-xl border-b border-white/10 py-3" : "py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <a href="#" className="group flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-[0_0_25px_-5px_rgba(139,92,246,0.8)]">
            <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
            <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 blur-md transition group-hover:opacity-40" />
          </span>
          <span className="leading-none">
            <span className="block text-lg font-black">نوفا ديجيتال</span>
            <span className="block font-mono text-[10px] tracking-[0.35em] text-violet-300/80">NOVA · DIGITAL</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-semibold text-slate-300 transition hover:text-white after:absolute after:-bottom-1.5 after:right-0 after:h-px after:w-0 after:bg-gradient-to-l after:from-violet-400 after:to-cyan-400 after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={COMPANY.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="btn-neon hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white sm:flex"
          >
            <MessageCircle className="size-4" />
            كلمنا واتساب
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
            aria-label="القائمة"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-white/10 bg-[#03040c]/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-6 py-5">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={COMPANY.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="btn-neon mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white"
              >
                <MessageCircle className="size-4" />
                كلمنا واتساب — {COMPANY.phone}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
