import { TrackEntry } from "@/components/client/TrackClient";

export const metadata = { title: "تتبع مشروعك — NEBRAS AI" };

export default function TrackPage() {
  return (
    <main className="starfield nebula min-h-screen bg-nova-950">
      <TrackEntry />
    </main>
  );
}
