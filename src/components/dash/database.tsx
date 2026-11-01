"use client";

import { useEffect, useState } from "react";
import {
  Database, Server, Table2, ArrowRight, ChevronLeft, ChevronRight,
  RefreshCw, HardDrive, ShieldCheck,
} from "lucide-react";
import { api, Spinner } from "./ui";
import type { Notify } from "./shell";

type TableMeta = { name: string; label: string; count: number };
type Overview = { conn: { host: string; port: string; db: string }; tables: TableMeta[] };
type Browse = { table: string; total: number; page: number; pages: number; columns: string[]; rows: Record<string, unknown>[] };

function Chip({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className={`rounded-xl border p-3 ${ok ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-amber-500/25 bg-amber-500/[0.06]"}`}>
      <p className={`flex items-center gap-1.5 text-xs font-black ${ok ? "text-emerald-300" : "text-amber-300"}`}>
        <span className={`size-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400 anim-pulse-dot"}`} />
        {label}
      </p>
      <p className="mt-1 truncate text-[10px] text-slate-500" title={hint}>{hint}</p>
    </div>
  );
}

function Cell({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === "") return <span className="text-slate-700">—</span>;
  if (typeof v === "boolean")
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${v ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
        {v ? "نعم" : "لا"}
      </span>
    );
  if (typeof v === "number") return <span className="font-mono text-cyan-300" dir="ltr">{v}</span>;
  if (typeof v === "object") {
    const s = JSON.stringify(v);
    return <span className="font-mono text-[10px] text-slate-500" dir="ltr" title={s}>{s.length > 42 ? s.slice(0, 42) + "…" : s}</span>;
  }
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) s = new Date(s).toLocaleDateString("ar-EG-u-nu-latn", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return <span className="text-slate-300" title={s}>{s.length > 48 ? s.slice(0, 48) + "…" : s}</span>;
}

export default function DatabasePanel({ }: { notify: Notify }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [browse, setBrowse] = useState<Browse | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadOverview() {
    const d = await api<Overview>("/api/admin/db");
    setOverview(d);
  }

  async function open(table: string, page = 1) {
    setLoading(true);
    const d = await api<Browse>(`/api/admin/db?table=${table}&page=${page}`);
    setBrowse(d);
    setLoading(false);
  }

  useEffect(() => { loadOverview().catch(() => {}); }, []);

  if (!overview) return <Spinner />;

  const totalRows = overview.tables.reduce((s, t) => s + t.count, 0);

  return (
    <div>
      {!browse ? (
        <>
          {/* كارت الاتصال */}
          <div className="glass mb-5 flex flex-wrap items-center gap-4 rounded-2xl p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
              <Server className="size-6 text-white" />
            </span>
            <div className="flex-1">
              <p className="flex items-center gap-2 font-black">
                قاعدة البيانات المحلية — PostgreSQL
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-400 anim-pulse-dot" /> متصلة
                </span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-500" dir="ltr">
                {overview.conn.db} @ {overview.conn.host}:{overview.conn.port}
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-bold">
                <HardDrive className="size-4 text-violet-300" /> {overview.tables.length} جداول
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-bold">
                <Table2 className="size-4 text-cyan-300" /> {totalRows} سجل
              </span>
              <button onClick={loadOverview} className="grid size-10 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="تحديث">
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>

          {/* بطاقات الجداول */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview.tables.map((t) => (
              <button
                key={t.name}
                onClick={() => open(t.name)}
                className="glass hover-glow group flex items-center justify-between rounded-2xl p-5 text-right"
              >
                <div>
                  <p className="flex items-center gap-2 font-black">
                    <Database className="size-4 text-violet-300" /> {t.label}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500" dir="ltr">{t.name}</p>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-cyan-300">{t.count}</p>
                  <p className="text-[10px] font-bold text-slate-500">سجل</p>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 flex items-center gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="size-3.5 text-emerald-400" /> تصفح بغرض القراءة فقط — التعديل بيحصل من التابات المخصصة علشان سلامة البيانات.
          </p>
        </>
      ) : (
        <>
          {/* تصفح جدول */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button onClick={() => { setBrowse(null); loadOverview(); }} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-black transition hover:bg-white/10">
              <ArrowRight className="size-4" /> رجوع للجداول
            </button>
            <h2 className="font-black">
              جدول <span className="font-mono text-cyan-300" dir="ltr">{browse.table}</span>
            </h2>
            <span className="text-xs text-slate-500">{browse.total} سجل</span>
            <div className="mr-auto flex items-center gap-2">
              <button disabled={browse.page <= 1 || loading} onClick={() => open(browse.table, browse.page - 1)} className="grid size-9 place-items-center rounded-lg bg-white/5 disabled:opacity-30">
                <ChevronRight className="size-4" />
              </button>
              <span className="font-mono text-xs text-slate-400" dir="ltr">{browse.page} / {browse.pages}</span>
              <button disabled={browse.page >= browse.pages || loading} onClick={() => open(browse.table, browse.page + 1)} className="grid size-9 place-items-center rounded-lg bg-white/5 disabled:opacity-30">
                <ChevronLeft className="size-4" />
              </button>
            </div>
          </div>

          <div className="glass overflow-x-auto rounded-2xl">
            {browse.rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">الجدول فاضي لسه</p>
            ) : (
              <table className="w-full min-w-[640px] text-right text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    {browse.columns.map((c) => (
                      <th key={c} className="px-4 py-3 font-mono text-[10px] font-bold text-slate-500" dir="ltr">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {browse.rows.map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                      {browse.columns.map((c) => (
                        <td key={c} className="max-w-56 truncate px-4 py-3 align-top">
                          <Cell v={r[c]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
