import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { AnnouncementsManager, BroadcastsManager, MessagesManager } from "@/components/admin/managers";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الرسائل والإعلانات" };

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const sp = await searchParams;
  const stageRows = await listStages();
  const stageOptions = stageRows.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">الرسائل والإعلانات</h1>
        <p className="mt-1.5 text-sm text-mist-600">
          بثّ رسالة فورية لكل المستخدمين، ومتابعة رسائل الزوار الواردة، ونشر إعلانات تصل للطلاب في لوحة تقدمهم والصفحة الرئيسية.
          {sp.message ? <span className="mr-2 font-bold text-success">{sp.message}</span> : null}
        </p>
      </div>

      <BroadcastComposer />
      <BroadcastsManager />
      <AnnouncementsManager stageOptions={stageOptions} />
      <MessagesManager />
    </div>
  );
}
