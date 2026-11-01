import type { Metadata } from "next";
import DashShell from "@/components/dash/shell";

// بوابة مخفية — مش بتتأرشف ومش ليها أي لينك عام غير النقطة السرية في الفوتر
export const metadata: Metadata = {
  title: "NOVA CORE — وحدة التحكم",
  robots: { index: false, follow: false },
};

export default function DevConsolePage() {
  return <DashShell />;
}
