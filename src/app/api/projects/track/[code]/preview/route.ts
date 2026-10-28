import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectFiles } from "@/db/schema";

// معاينة حية لصفحة المشروع: نسترجع HTML ونضمّن CSS/JS فعلياً
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.code, code.trim().toUpperCase()))
    .limit(1);
  if (!project || project.status !== "delivered") {
    return NextResponse.json({ error: "المعاينة متاحة بعد التسليم" }, { status: 403 });
  }
  const files = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, project.id));
  const byPath = new Map(files.map((f) => [f.path, f.content]));
  const htmlFile = byPath.get("public/index.html");
  if (!htmlFile) {
    return NextResponse.json(
      { error: "هذا النوع من المشاريع لا يحتوي على صفحة Web للمعاينة — راجع قائمة الملفات" },
      { status: 404 },
    );
  }
  let html = htmlFile;
  for (const f of files) {
    if (f.path.endsWith(".css")) {
      html = html.split(`<link rel="stylesheet" href="./${f.path.split("/").pop()}" />`).join(`<style>\n${f.content}\n</style>`);
      html = html.split(`href="/${f.path}"`).join(`<link rel="stylesheet" data-inlined>`);
    }
  }
  for (const f of files) {
    if (f.path.endsWith(".js")) {
      html = html.split(`<script src="./${f.path.split("/").pop()}"></script>`).join(`<script>\n${f.content}\n</script>`);
    }
  }
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
