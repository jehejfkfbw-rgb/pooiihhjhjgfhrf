"use client";

import Link from "next/link";

export default function AccountPage() {
  return (
    <main className="noise relative min-h-screen bg-[#03040c] text-slate-100 flex items-center justify-center">
      <div className="text-center p-8 glass rounded-3xl border border-white/10">
        <h1 className="text-2xl font-black mb-4">نظام الحسابات تحت التحديث</h1>
        <p className="text-slate-400 mb-6 max-w-sm">بنطور النظام حالياً، تقدر تتابع طلبك باستخدام كود التتبع في الصفحة الرئيسية.</p>
        <Link href="/" className="btn-neon px-6 py-3 rounded-xl font-bold inline-block">
          الرجوع للرئيسية
        </Link>
      </div>
    </main>
  );
}
