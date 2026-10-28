"use client";

import { useCallback, useEffect, useState } from "react";
import { Power, Pencil, X, Check, Loader2 } from "lucide-react";

interface Emp {
  id: number;
  roleKey: string;
  name: string;
  roleTitle: string;
  team: string;
  description: string | null;
  systemPrompt: string;
  model: string | null;
  active: boolean;
}

export function NebrasEmployeesTab() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [editing, setEditing] = useState<Emp | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/employees", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setEmps(d.employees ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function toggle(e: Emp) {
    setBusy(e.id);
    const r = await fetch("/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: e.id, active: !e.active }),
    });
    setBusy(null);
    setToast(r.ok ? `${e.active ? "تم تعطيل" : "تم تفعيل"} ${e.name}` : "فشل التعديل");
    load();
  }

  async function savePrompt(e: Emp) {
    setBusy(e.id);
    const r = await fetch("/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: e.id, systemPrompt: draft }),
    });
    setBusy(null);
    setEditing(null);
    setToast(r.ok ? "تم تحديث أوامر " + e.name : "فشل التحديث");
    load();
  }

  const teams = [...new Set(emps.map((e) => e.team))];

  return (
    <div className="space-y-6">
      <p className="text-[11px] text-ink-dim">
        فريق الموظفين الذكيين — يمكنك تعطيل أي موظف (ستُنفَّذ مهامه عبر المولّد المحلي)، أو تعديل أوامره (System Prompt) لتغيير سلوكه في المشاريع القادمة.
      </p>
      {teams.map((team) => (
        <div key={team}>
          <h3 className="font-display mb-3 text-sm font-black text-violet-200">{team}</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {emps
              .filter((e) => e.team === team)
              .map((e) => (
                <div key={e.id} className={`glass rounded-2xl p-5 ${!e.active ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/15 font-display text-sm font-black text-white">
                        {e.name.replace("م. ", "").replace("د. ", "").slice(0, 1)}
                      </span>
                      <div>
                        <div className="text-sm font-black text-white">{e.name}</div>
                        <div className="text-[10px] text-ink-dim">{e.roleTitle}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(e)}
                      disabled={busy === e.id}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                        e.active
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : "border-white/15 bg-white/5 text-ink-dim"
                      }`}
                    >
                      {busy === e.id ? <Loader2 size={11} className="animate-spin" /> : <Power size={11} />}
                      {e.active ? "نشط" : "معطل"}
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-ink-dim">{e.description}</p>
                  {editing?.id === e.id ? (
                    <div className="mt-3">
                      <textarea value={draft} onChange={(ev) => setDraft(ev.target.value)} rows={5} className="field resize-none font-mono text-[11px]" dir="auto" />
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => savePrompt(e)} disabled={busy === e.id} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-4 py-2 text-[11px] font-bold text-emerald-300 disabled:opacity-40">
                          <Check size={12} /> حفظ
                        </button>
                        <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2 text-[11px] font-bold text-ink-dim">
                          <X size={12} /> إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(e);
                        setDraft(e.systemPrompt);
                      }}
                      className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 transition hover:text-cyan-200"
                    >
                      <Pencil size={11} /> تعديل أوامر النظام
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
      {toast && (
        <div className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-cyan-400/40 px-6 py-3 text-sm font-bold text-cyan-200">
          {toast}
        </div>
      )}
    </div>
  );
}
