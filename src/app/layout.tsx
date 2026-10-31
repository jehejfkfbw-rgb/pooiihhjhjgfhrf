import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const jb = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb",
});

export const metadata: Metadata = {
  title: "نوفا ديجيتال | Nova Digital — شركة برمجيات مصرية",
  description:
    "نوفا ديجيتال: مواقع، متاجر إلكترونية، تطبيقات موبايل، وأنظمة ذكاء اصطناعي محلية. سوفتوير أسطوري من قلب مصر — كلمنا 01503724381.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${jb.variable}`}>
      <body className="font-sans bg-[#03040c] text-slate-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
