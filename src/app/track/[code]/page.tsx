import type { Metadata } from "next";
import { TrackClient } from "@/components/client/TrackClient";

export const metadata: Metadata = { title: "حالة المشروع — NEBRAS AI" };

export default async function TrackCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <main className="starfield nebula min-h-screen bg-nova-950">
      <TrackClient code={code} />
    </main>
  );
}
