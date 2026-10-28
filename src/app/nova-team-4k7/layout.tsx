import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Nova Code — Team",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <div className="starfield nebula min-h-screen bg-nova-950">{children}</div>;
}
