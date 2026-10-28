import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEBRAS AI | نبراس — شركة ذكاء اصطناعي لمصر والسعودية",
  description:
    "NEBRAS AI: شركة برمجيات تدير مشاريعك بمحرك ذكاء اصطناعي مركزي وفريق 18 موظفاً ذكياً — تحلل، تخطط، تنفذ بفحوصات فعلية، وتسلّم. بأسعار بالجنيه المصري والريال السعودي.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
