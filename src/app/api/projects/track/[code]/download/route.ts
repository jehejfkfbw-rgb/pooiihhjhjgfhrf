import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectFiles } from "@/db/schema";
import { buildZip } from "@/lib/nebras/zip";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.code, code.trim().toUpperCase()))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "رمز المتابعة غير صحيح" }, { status: 404 });
  }
  if (project.status !== "delivered") {
    return NextResponse.json({ error: "الملفات متاحة بعد التسليم" }, { status: 403 });
  }
  const files = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, project.id));
  if (!files.length) {
    return NextResponse.json({ error: "لا توجد ملفات" }, { status: 404 });
  }
  const zip = buildZip(
    files.map((f) => ({
      path: f.path,
      data: Buffer.from(f.content, "utf8"),
    })),
  );
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.code}.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}
