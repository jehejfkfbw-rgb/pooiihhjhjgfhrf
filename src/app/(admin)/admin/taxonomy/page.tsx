import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { StagesManager, SubjectsManager } from "@/components/admin/managers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المراحل والمواد" };

export default async function AdminTaxonomyPage() {
  const stageRows = await listStages();
  const stageOptions = stageRows.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">المراحل والمواد</h1>
        <p className="mt-1.5 text-sm text-mist-600">
          هيكل المنصة التعليمي: أضف مرحلة جديدة (مثل «الدبلومات المهنية») ثم موادها، وستظهر فورًا في الموقع وفي عوامل تصفية الكورسات.
        </p>
      </div>

      <StagesManager />
      <SubjectsManager stageOptions={stageOptions} />
    </div>
  );
}
