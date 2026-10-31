"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export async function api<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const d = await r.json().catch(() => ({}));
  return d as T;
}

export function Panel({
  title, icon, sub, action, children, className = "",
}: {
  title?: string; icon?: ReactNode; sub?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`glass rounded-2xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            {icon}
            <div>
              <h3 className="text-sm font-black text-slate-100">{title}</h3>
              {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Toggle({ on, onChange, danger = false }: { on: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
        on ? (danger ? "bg-rose-500" : "bg-emerald-500") : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-0.5" : "left-[22px]"}`}
      />
    </button>
  );
}

export function Modal({
  open, onClose, title, children, wide = false,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[88vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0e1d] shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <h3 className="font-black">{title}</h3>
              <button onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-white/5 transition hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold text-slate-400">{label}</label>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="size-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-slate-500">{text}</p>;
}
