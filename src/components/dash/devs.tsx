"use client";

import { useEffect, useState } from "react";
import { Save, Flame, FolderGit2, TerminalSquare, Headset } from "lucide-react";
import { api, Spinner, Toggle } from "./ui";
import type { Notify } from "./shell";
import type { SiteDev, SiteStaff } from "@/lib/types";

const STATUS_OPTS = [
  { v: "online", label: "متاح" },
  { v: "mission", label: "في مهمة" },
  { v: "training", label: "بيتدرب" },
  { v: "offline", label: "مش متاح" },
];

export default function Devs({ notify }: { notify: Notify }) {
  const [devs, setDevs] = useState<SiteDev[] | null>(null);
  const [staffList, setStaffList] = useState<SiteStaff[]>([]);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    api<{ devs: SiteDev[] }>("/api/admin/devs").then((d) => setDevs(d.devs)).catch(() => {});
    api<{ staff: SiteStaff[] }>("/api/admin/staff").then((d) => setStaffList(d.staff)).catch(() => {});
  }, []);

  async function toggleStaff(m: SiteStaff) {
    setStaffList((l) => l.map((x) => (x.id === m.id ? { ...x, online: !m.online } : x)));
    await api("/api/admin/staff", { method: "PUT", body: JSON.stringify({ id: m.id, online: !m.online }) });
    notify(m.online ? `${m.name} أصبح غير متاح` : `${m.name} أصبح متاح للاستقبال`);
  }

  async function save(d: SiteDev) {
    setSaving(d.id);
    await api("/api/admin/devs", {
      method: "PUT",
      body: JSON.stringify({ id: d.id, status: d.status, mission: d.mission }),
    });
    setSaving(null);
    notify(`تم حفظ حالة ${d.code}`);
  }

  if (!devs) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          وحدة NOVA CORE — هنا بتتحكم في حالة كل وكيل وبتوجّه لهم المهام. التغييرات بتظهر فورًا على الموقع العام.
        </p>
        <span className="rounded-full bg-violet-500/15 px-4 py-1.5 text-xs font-black text-violet-200">3 وكلاء نشطين</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {devs.map((d) => (
          <div key={d.id} className="glass overflow-hidden rounded-2xl">
            <div className="relative h-44 overflow-hidden">
              <img src={d.avatar} alt={d.name} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e1d] to-transparent" />
              <div className="absolute bottom-3 right-4">
                <p className="font-mono text-[10px] tracking-[0.3em] text-cyan-300">{d.code}</p>
                <h3 className="text-xl font-black">{d.name}</h3>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm font-bold text-violet-300">{d.role}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-500" dir="ltr">{d.stack}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Flame className="size-3 text-orange-400" /> مستوى {d.level} · XP {d.xp}%</span>
                <span className="flex items-center gap-1"><FolderGit2 className="size-3 text-cyan-300" /> {d.projectsDone} مشروع</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400" style={{ width: `${d.xp}%` }} />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-slate-500">الحالة</label>
                <select
                  className="nova-input appearance-none"
                  value={d.status}
                  onChange={(e) => setDevs(devs.map((x) => (x.id === d.id ? { ...x, status: e.target.value } : x)))}
                >
                  {STATUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <TerminalSquare className="size-3" /> المهمة الحالية
                </label>
                <input
                  className="nova-input"
                  value={d.mission}
                  onChange={(e) => setDevs(devs.map((x) => (x.id === d.id ? { ...x, mission: e.target.value } : x)))}
                  placeholder="وجّه مهمة جديدة للوكيل..."
                />
              </div>

              <button
                onClick={() => save(d)}
                disabled={saving === d.id}
                className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving === d.id ? "جاري الحفظ..." : "اعتمد التعديلات"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* فريق الاستقبال البشري */}
      <div className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/15"><Headset className="size-5 text-emerald-300" /></span>
          <div>
            <h2 className="text-lg font-black">فريق الاستقبال البشري</h2>
            <p className="text-xs text-slate-500">بيستقبلوا الطلبات الجديدة وبيردوا على العملاء — ميّت اللي مش شغال النهاردة</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {staffList.map((m) => (
            <div key={m.id} className={`glass rounded-2xl p-5 transition ${m.online ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500/40 to-violet-600/40 text-lg font-black">
                  {m.name.charAt(0)}
                </span>
                <Toggle on={m.online} onChange={() => toggleStaff(m)} />
              </div>
              <h3 className="mt-3 font-black">{m.name}</h3>
              <p className="text-xs font-bold text-violet-300">{m.role}</p>
              <p className="mt-1 text-[11px] text-slate-500">قسم {m.dept}</p>
              <p className={`mt-3 flex items-center gap-1.5 text-[11px] font-black ${m.online ? "text-emerald-300" : "text-slate-500"}`}>
                <span className={`size-1.5 rounded-full ${m.online ? "bg-emerald-400 anim-pulse-dot" : "bg-slate-600"}`} />
                {m.online ? "متاح — بيستقبل طلبات" : "غير متاح"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
