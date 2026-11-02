"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Save, Search, GraduationCap } from "lucide-react";
import { api, Field, Modal, Spinner, Toggle, Empty } from "./ui";
import type { Notify } from "./shell";
import type { SiteKnowledge } from "@/lib/types";

const EMPTY = { category: "عام", patternText: "", answer: "", priority: 1, active: true };

export default function Knowledge({ notify }: { notify: Notify }) {
  const [list, setList] = useState<SiteKnowledge[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("الكل");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [unknown, setUnknown] = useState<string[]>([]);

  async function load() {
    const d = await api<{ knowledge: SiteKnowledge[] }>("/api/admin/knowledge");
    setList(d.knowledge);
    const un = await api<{ chats: { question: string }[] }>("/api/admin/chats?unmatched=1");
    setUnknown([...new Set(un.chats.map((c) => c.question))].slice(0, 12));
  }

  useEffect(() => { load().catch(() => {}); }, []);

  const cats = useMemo(() => ["الكل", ...new Set((list ?? []).map((k) => k.category))], [list]);
  const filtered = useMemo(
    () => (list ?? []).filter((k) =>
      (cat === "الكل" || k.category === cat) &&
      (q === "" || k.answer.includes(q) || k.patterns.some((p) => p.includes(q))),
    ),
    [list, q, cat],
  );

  function openNew(prefill?: string) {
    setEditId(null);
    setForm({ ...EMPTY, patternText: prefill ?? "" });
    setOpen(true);
  }

  function openEdit(k: SiteKnowledge) {
    setEditId(k.id);
    setForm({ category: k.category, patternText: k.patterns.join("\n"), answer: k.answer, priority: k.priority, active: k.active });
    setOpen(true);
  }

  async function save() {
    const patterns = form.patternText.split("\n").map((p) => p.trim()).filter(Boolean);
    if (!patterns.length || !form.answer.trim()) return notify("لازم نمط واحد على الأقل + إجابة");
    const body = { category: form.category, patterns, answer: form.answer, priority: form.priority, active: form.active };
    if (editId) {
      await api(`/api/admin/knowledge/${editId}`, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await api("/api/admin/knowledge", { method: "POST", body: JSON.stringify(body) });
    }
    setOpen(false);
    await load();
    notify(editId ? "تم تحديث الرد" : "البوت اتدرب على رد جديد");
  }

  async function toggleActive(k: SiteKnowledge) {
    await api(`/api/admin/knowledge/${k.id}`, { method: "PUT", body: JSON.stringify({ active: !k.active }) });
    setList((l) => (l ?? []).map((x) => (x.id === k.id ? { ...x, active: !k.active } : x)));
  }

  async function remove(id: number) {
    if (!confirm("تحذف الرد ده من دماغ البوت؟")) return;
    await api(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    await load();
    notify("تم حذف الرد");
  }

  if (!list) return <Spinner />;

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input className="nova-input !pr-9" placeholder="دوّر في الردود أو الأنماط..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button onClick={() => openNew()} className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white">
            <GraduationCap className="size-4" /> درّب البوت على رد جديد
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-bold transition ${cat === c ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? <Empty text="مفيش ردود مطابقة" /> : (
          <div className="space-y-3">
            {filtered.map((k) => (
              <div key={k.id} className={`glass rounded-2xl p-4 transition ${k.active ? "" : "opacity-45"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cyan-500/15 px-3 py-0.5 text-[10px] font-black text-cyan-300">{k.category}</span>
                    <span className="text-[10px] font-bold text-slate-500">أولوية {k.priority} · اتستخدمت {k.hits} مرة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle on={k.active} onChange={() => toggleActive(k)} />
                    <button onClick={() => openEdit(k)} className="grid size-8 place-items-center rounded-lg bg-white/5 transition hover:bg-violet-500/20"><Pencil className="size-3.5" /></button>
                    <button onClick={() => remove(k.id)} className="grid size-8 place-items-center rounded-lg bg-white/5 transition hover:bg-rose-500/20 hover:text-rose-300"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-1 text-xs font-bold text-violet-200">الأنماط: {k.patterns.join(" · ")}</p>
                <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-slate-400">{k.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الأسئلة اللي البوت معرفهاش */}
      <div>
        <div className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-sm font-black">
            <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15"><GraduationCap className="size-4 text-amber-300" /></span>
            أسئلة العملاء من غير جواب
          </h3>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            دي أسئلة حقيقية البوت ملقاش ليها رد. دوس على أي واحدة وهيجهزلك نموذج التدريب على طول.
          </p>
          {unknown.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-500/[0.07] p-4 text-center text-xs font-bold text-emerald-300">البوت رد على كل حاجة — مستوى تغطية كامل</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {unknown.map((u) => (
                <li key={u}>
                  <button
                    onClick={() => openNew(u)}
                    className="w-full truncate rounded-xl bg-amber-500/[0.07] px-4 py-2.5 text-right text-xs font-semibold text-amber-100/90 transition hover:bg-amber-500/15"
                  >
                    {u}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "تعديل رد البوت" : "تدريب البوت على رد جديد"} wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="التصنيف">
              <input className="nova-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="الأسعار / التواصل / الخدمات..." />
            </Field>
            <Field label={`الأولوية: ${form.priority}`}>
              <input type="range" min={0} max={10} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full accent-violet-500" dir="ltr" />
            </Field>
          </div>
          <Field label="الأنماط (كل سطر = كلمة أو جملة لو العميل قالها الرد ده هيطلع)">
            <textarea
              className="nova-input min-h-24 resize-y font-semibold"
              value={form.patternText}
              onChange={(e) => setForm({ ...form, patternText: e.target.value })}
              placeholder={"بكام التصميم\nسعر اللوجو\nلوجو كام"}
            />
          </Field>
          <Field label="الإجابة اللي البوت هيرد بيها">
            <textarea className="nova-input min-h-32 resize-y" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="اكتب الرد باللهجة المصرية..." />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            <span className="text-xs font-bold text-slate-400">الرد مفعّل؟</span>
            <Toggle on={form.active} onChange={(v) => setForm({ ...form, active: v })} />
          </div>
          <button onClick={save} className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black text-white">
            <Save className="size-4" /> احفظ في دماغ البوت
          </button>
        </div>
      </Modal>
    </div>
  );
}
