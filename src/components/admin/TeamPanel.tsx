"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  KeyRound,
  Power,
  Send,
  ClipboardList,
  ShieldCheck,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  STAFF_PORTAL_PATH,
  ADMIN_PORTAL_PATH,
  type AssignmentRow,
  type StaffRow,
  type OrderRow,
} from "@/lib/site";

const ROLE_LABEL: Record<string, string> = {
  cs: "خدمة عملاء",
  marketing: "تسويق",
  dev: "تطوير",
};

const STATUS_META: Record<
  AssignmentRow["status"],
  { label: string; cls: string }
> = {
  assigned: { label: "جديدة", cls: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30" },
  in_progress: { label: "قيد التنفيذ", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  submitted: { label: "بانتظار اعتمادك", cls: "bg-violet-400/10 text-violet-300 border-violet-400/30" },
  approved: { label: "معتمدة", cls: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  rejected: { label: "مرفوضة", cls: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
};

function fmt(iso: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function TeamPanel({
  staff,
  assignments,
  orders,
}: {
  staff: StaffRow[];
  assignments: AssignmentRow[];
  orders: OrderRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  async function call(
    url: string,
    init: RequestInit,
    key: string,
    success: string,
  ): Promise<boolean> {
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "فشل الإجراء");
      setMsg(success);
      router.refresh();
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "حدث خطأ");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function addStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ok = await call(
      "/api/admin/staff",
      {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          username: fd.get("username"),
          password: fd.get("password"),
          role: fd.get("role"),
          title: fd.get("title"),
        }),
      },
      "add-staff",
      "تم إنشاء حساب الموظف — يمكنه الدخول من بوابة الفريق",
    );
    if (ok) form.reset();
  }

  async function assign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ok = await call(
      "/api/admin/assignments",
      {
        method: "POST",
        body: JSON.stringify({
          staffId: Number(fd.get("staffId")),
          orderId: fd.get("orderId") ? Number(fd.get("orderId")) : null,
          title: fd.get("title"),
          instructions: fd.get("instructions"),
        }),
      },
      "assign",
      "تم إسناد المهمة — ستظهر للموظف في بوابته فوراً",
    );
    if (ok) form.reset();
  }

  async function act(id: number, action: "approve" | "reject" | "delete") {
    await call(
      `/api/admin/assignments/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action, note: notes[id] ?? "" }),
      },
      `a-${id}`,
      action === "approve"
        ? "تم اعتماد مخرجات الموظف"
        : action === "reject"
          ? "تم إرجاع المهمة للموظف مع ملاحظتك"
          : "تم حذف المهمة",
    );
  }

  async function toggleActive(id: number) {
    await call(
      `/api/admin/staff/${id}`,
      { method: "PATCH", body: JSON.stringify({ action: "toggle" }) },
      `s-${id}`,
      "تم تحديث حالة الحساب",
    );
  }

  async function resetPassword(id: number) {
    const password = window.prompt("كلمة المرور الجديدة (6 أحرف على الأقل):");
    if (!password) return;
    await call(
      `/api/admin/staff/${id}`,
      { method: "PATCH", body: JSON.stringify({ action: "password", password }) },
      `p-${id}`,
      "تم تغيير كلمة مرور الموظف",
    );
  }

  function copy(text: string, label: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2200);
      })
      .catch(() => setMsg("تعذر النسخ — انسخه يدوياً"));
  }

  const pendingReview = assignments.filter((a) => a.status === "submitted");
  const activeStaff = staff.filter((s) => s.active);

  return (
    <div className="space-y-7">
      {msg && (
        <div className="glass rounded-xl border-cyan-400/40 px-5 py-3 text-center text-xs font-bold text-cyan-200">
          {msg}
        </div>
      )}

      {/* الروابط السرية — تظهر هنا فقط */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-display flex items-center gap-2 text-base font-black text-white">
          <ShieldCheck size={18} className="text-emerald-300" />
          روابط البوابات السرية — لك وحدك
        </h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-dim">
          لا توجد هذه الروابط في أي مكان بالموقع العام. رابط لوحة المطور لك وحدك، ورابط بوابة
          الفريق يُرسل لموظفي خدمة العملاء/التسويق فقط وهم لا يستطيعون فتح لوحتك.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "لوحة المطور (أنت فقط)", path: ADMIN_PORTAL_PATH },
            { label: "بوابة الموظفين (فريقك)", path: STAFF_PORTAL_PATH },
          ].map((l) => (
            <div key={l.label} className="glass-soft rounded-2xl p-4">
              <div className="text-[10px] font-bold text-ink-dim">{l.label}</div>
              <div dir="ltr" className="mt-1.5 truncate font-mono text-xs font-bold text-cyan-200">
                {l.path}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => copy(l.path, l.path)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-ink-dim transition hover:text-white"
                >
                  <Copy size={11} />
                  {copied === l.path ? "تم النسخ" : "نسخ"}
                </button>
                <a
                  href={l.path}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold text-ink-dim transition hover:text-white"
                >
                  <ExternalLink size={11} /> فتح
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* الموظفون */}
      <section className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display flex items-center gap-2 text-base font-black text-white">
            <Users size={18} className="text-cyan-300" />
            فريق العمل البشري ({staff.length})
          </h3>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-ink-dim">
            {activeStaff.length} حساب نشط
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.length === 0 && (
            <p className="text-xs text-ink-dim">
              لا يوجد موظفون بعد — افتح بوابة الفريق مرة واحدة لإنشاء الحسابات الافتراضية، أو أضف
              حساباً جديداً من النموذج بالأسفل.
            </p>
          )}
          {staff.map((s) => (
            <div key={s.id} className="glass-soft rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-white">{s.name}</div>
                  <div className="truncate text-[10px] text-ink-dim">{s.title ?? ROLE_LABEL[s.role]}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                    s.active
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/30 bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {s.active ? "نشط" : "موقوف"}
                </span>
              </div>
              <div dir="ltr" className="mt-2 font-mono text-[11px] text-cyan-200">
                {s.username}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy !== null}
                  onClick={() => toggleActive(s.id)}
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-ink-dim transition hover:text-white disabled:opacity-40"
                >
                  {busy === `s-${s.id}` ? <Loader2 size={10} className="animate-spin" /> : <Power size={10} />}
                  {s.active ? "إيقاف" : "تنشيط"}
                </button>
                <button
                  disabled={busy !== null}
                  onClick={() => resetPassword(s.id)}
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-ink-dim transition hover:text-white disabled:opacity-40"
                >
                  <KeyRound size={10} /> كلمة مرور
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={addStaff} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-cyan-400/25 bg-cyan-500/5 p-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-3 flex items-center gap-2 text-xs font-black text-cyan-200">
            <UserPlus size={15} /> إضافة حساب موظف جديد
          </div>
          <input name="name" required className="field" placeholder="اسم الموظف" />
          <input name="username" required className="field text-left" dir="ltr" placeholder="username (إنجليزي)" />
          <input name="password" required type="text" className="field text-left" dir="ltr" placeholder="كلمة مرور مبدئية" />
          <input name="title" className="field" placeholder="المسمى — مثال: خدمة عملاء السعودية" />
          <select name="role" className="field" defaultValue="cs">
            <option value="cs">فريق خدمة العملاء</option>
            <option value="marketing">فريق التسويق</option>
            <option value="dev">فريق التطوير</option>
          </select>
          <button
            disabled={busy !== null}
            className="btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black text-white disabled:opacity-50"
          >
            {busy === "add-staff" ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            إنشاء الحساب
          </button>
        </form>
      </section>

      {/* إسناد مهمة */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-display flex items-center gap-2 text-base font-black text-white">
          <Send size={18} className="text-violet-300" />
          إسناد مهمة لموظف
        </h3>
        <p className="mt-1 text-[11px] text-ink-dim">
          أنت تعطي الشغل — والموظف ينفّذه في بوابته ثم يرجع لك للاعتماد. لا يستطيع التسليم النهائي
          بدون موافقتك.
        </p>
        <form onSubmit={assign} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="staffId" required className="field" defaultValue="">
              <option value="" disabled>
                اختر الموظف المسؤول
              </option>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.title ?? ROLE_LABEL[s.role]}
                </option>
              ))}
            </select>
            <select name="orderId" className="field" defaultValue="">
              <option value="">بدون ربط بطلب عميل</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} — {o.clientName} ({o.service})
                </option>
              ))}
            </select>
          </div>
          <input name="title" required className="field" placeholder="عنوان المهمة — مثال: اتصل بالعميلة نورة وجهّز عرض تطبيق الحجوزات" />
          <textarea
            name="instructions"
            rows={3}
            className="field resize-none"
            placeholder="تعليماتك التفصيلية: ما المطلوب بالضبط؟ النبرة؟ السعر المعتمد؟ مدة التنفيذ؟"
          />
          <button
            disabled={busy !== null}
            className="btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black text-white disabled:opacity-50"
          >
            {busy === "assign" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            إسناد المهمة
          </button>
        </form>
      </section>

      {/* المهام المسندة */}
      <section className="space-y-4">
        <h3 className="font-display flex items-center gap-2 text-base font-black text-white">
          <ClipboardList size={18} className="text-amber-300" />
          مهام الفريق ومراجعة المخرجات
          {pendingReview.length > 0 && (
            <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-black text-white">
              {pendingReview.length} بانتظارك
            </span>
          )}
        </h3>

        {assignments.length === 0 && (
          <div className="glass-soft rounded-3xl border-dashed p-10 text-center text-sm text-ink-dim">
            لم تُسند أي مهام بعد — استخدم النموذج بالأعلى لإعطاء الشغل لفريقك.
          </div>
        )}

        {assignments.map((a) => {
          const member = staff.find((s) => s.id === a.staffId);
          const order = orders.find((o) => o.id === a.orderId);
          const sm = STATUS_META[a.status];
          return (
            <article key={a.id} className="glass rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-sm font-black text-white">{a.title}</h4>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-dim">
                    <span className="font-bold text-cyan-300">مسندة إلى: {member?.name ?? "—"}</span>
                    {order && <span>طلب #{order.id} — {order.clientName}</span>}
                    <span className="flex items-center gap-1"><Clock size={10} /> {fmt(a.createdAt)}</span>
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${sm.cls}`}>
                  {sm.label}
                </span>
              </div>

              {a.instructions && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-white/[0.04] p-3.5 text-[12px] leading-relaxed text-ink-dim">
                  {a.instructions}
                </p>
              )}

              {a.output ? (
                <details className="group mt-3">
                  <summary className="glass-soft cursor-pointer list-none rounded-xl px-4 py-2.5 text-[11px] font-bold text-violet-200">
                    مخرجات الموظف — راجعها قبل الاعتماد
                  </summary>
                  <pre className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-nova-950/70 p-4 font-sans text-[12px] leading-relaxed text-ink">
                    {a.output}
                  </pre>
                </details>
              ) : (
                <p className="mt-3 text-[11px] text-ink-dim">
                  {a.status === "in_progress" ? "الموظف يعمل على المهمة الآن..." : "لم يبدأ التنفيذ بعد."}
                </p>
              )}

              {a.adminNote && (
                <p className="mt-2 text-[11px] text-rose-300">ملاحظتك السابقة: {a.adminNote}</p>
              )}

              {a.output && a.status !== "approved" && (
                <div className="mt-4 space-y-2">
                  <input
                    value={notes[a.id] ?? ""}
                    onChange={(e) => setNotes((p) => ({ ...p, [a.id]: e.target.value }))}
                    className="field text-[12px]"
                    placeholder="ملاحظة للاعتماد أو سبب الإرجاع (اختياري)"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy !== null}
                      onClick={() => act(a.id, "approve")}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-5 py-2.5 text-[11px] font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-40"
                    >
                      {busy === `a-${a.id}` ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      اعتماد وتسليم
                    </button>
                    <button
                      disabled={busy !== null}
                      onClick={() => act(a.id, "reject")}
                      className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-[11px] font-black text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-40"
                    >
                      <XCircle size={13} /> إرجاع للتصحيح
                    </button>
                    <button
                      disabled={busy !== null}
                      onClick={() => act(a.id, "delete")}
                      className="glass-soft rounded-xl px-4 py-2.5 text-[11px] font-bold text-ink-dim transition hover:text-rose-300"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
