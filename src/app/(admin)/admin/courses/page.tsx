import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { listStages, listSubjects } from "@/lib/data";
import { CoursesManager } from "@/components/admin/managers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة الكورسات" };

export default async function AdminCoursesPage() {
  const [stageRows, subjectRows, teacherRows] = await Promise.all([
    listStages(),
    listSubjects(),
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(eq(users.role, "teacher")),
  ]);

  return (
    <CoursesManager
      stageOptions={stageRows.map((s) => ({ value: s.id, label: s.name }))}
      subjectOptions={subjectRows.map((s) => ({
        value: s.id,
        label: `${s.name} — ${stageRows.find((x) => x.id === s.stageId)?.name ?? ""}`,
      }))}
      teacherOptions={teacherRows.map((t) => ({ value: t.id, label: t.fullName }))}
    />
  );
}
