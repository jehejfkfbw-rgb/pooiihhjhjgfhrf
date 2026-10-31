import { isDbAlive } from "@/lib/db-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const alive = await isDbAlive();
  return Response.json({ ok: alive, db: alive ? "connected" : "no-database" });
}
