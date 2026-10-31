"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { api, Field, Modal, Spinner, Empty } from "./ui";
import type { Notify } from "./shell";
import { egp } from "@/lib/format";
import type { SiteProject } from "@/lib/types";

const TYPE_OPTS = [
  { v: "website", label: "موقع" },
  { v: "store", label: "متجر إلكتروني" },
  { v: "app", label: "تطبيق موبايل" },
  { v: "ai", label: "نظام ذكي" },
  { v: "system", label: "نظام إدارة" },
];

const STATUS_OPTS = [
  { v: "queued", label: "في الطابور", cls: "bg-amber-500/15 text-amber-300" },
  { v: "ongoing", label: "جاري العمل", cls: "bg-violet-500/15 text-violet-300" },
  { v: "done", label: "مسلّم", cls: "bg-emerald-500/15 text-emerald-300" },
];

const EMPTY_FORM = { title: "", client: "", type: "website", description: "", tech: "", status: "queued", progress: 0, budget: 0, year: "2026" };

export default function Projects({ notify }: { notify: Notify }) {
  const [list, setList] = useState<SiteProject[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function load() {
    const d = await api<{ projects: SiteProject[] }>("/api/admin/projects");
    setList(d.projects);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  function openNew() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  }

  function openEdit(p: SiteProject) {
    setEditId(p.id);
    setForm({ title: p.title, client: p.client, type: p.type, description: p.description, tech: p.tech, status: p.status, progress: p.progress, budget: p.budget, year: p.year });
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim()) return notify("اكتب اسم المشروع الأول");
    const url = editId ? `/api/admin/projects/${editId}` : "/api/admin/projects";
    await api(url, { method: editId ? "PUT" : "POST", body: JSON.stringify(form) });
    setOpen(false);
    await load();
    notify(editId ? "تم تحديث المشروع" : "اتضاف مشروع جديد للنواة");
  }

  async function remove(id: number) {
    if (!confirm("متأكد إنك عايز تحذف المشروع ده؟")) return;
    await api(`/api/admin/projects/${id}`, { method: "DELETE" });
    await load();
    notify("تم حذف المشروع");
  }

  if (!list) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">{list.length} مشروع مسجل — أي تعديل هنا بينعكس على صفحة الأعمال فورًا.</p>
        <button onClick={openNew} className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white">
          <Plus className="size-4" /> مشروع جديد
        </button>
      </div>

      {list.length === 0 ? <Empty text="مفيش مشاريع — ابدأ بإضافة أول مشروع" /> : (
        <div className="space-y-3">
          {list.map((p) => {
            const st = STATUS_OPTS.find((s) => s.v === p.status) ?? STATUS_OPTS[0];
            return (
              <div key={p.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-black">{p.title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.client} · {TYPE_OPTS.find((t) => t.v === p.type)?.label} · {p.year}</p>
                </div>

                <div className="w-40">
                  <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                    <span>الإنجاز</span><span className="font-mono">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <p className="w-28 text-left font-mono text-sm font-bold text-cyan-300" dir="ltr">{egp(p.budget)}</p>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-violet-500/20 hover:text-white">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-300">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "تعديل المشروع" : "مشروع جديد"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المشروع">
            <input className="nova-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: متجر عطور النيل" />
          </Field>
          <Field label="العميل">
            <input className="nova-input" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="اسم العميل" />
          </Field>
          <Field label="النوع">
            <select className="nova-input appearance-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <select className="nova-input appearance-none" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </Field>
          <Field label={`نسبة الإنجاز: ${form.progress}%`}>
            <input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} className="w-full accent-violet-500" dir="ltr" />
          </Field>
          <Field label="قيمة العقد بالجنيه">
            <input type="number" className="nova-input" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} dir="ltr" />
          </Field>
          <Field label="السنة">
            <input className="nova-input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} dir="ltr" />
          </Field>
          <Field label="التقنيات (تتعرض على الموقع)">
            <input className="nova-input" value={form.tech} onChange={(e) => setForm({ ...form, tech: e.target.value })} placeholder="Next.js · PostgreSQL" dir="ltr" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="وصف قصير">
            <textarea className="nova-input min-h-20 resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <button onClick={save} className="btn-neon mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black text-white">
          <Save className="size-4" /> حفظ المشروع
        </button>
      </Modal>
    </div>
  );
}
