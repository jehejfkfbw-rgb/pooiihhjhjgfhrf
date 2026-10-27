import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { bootstrap } from "@/lib/bootstrap";
import { ToastProvider } from "@/components/toast";
import { BroadcastListener } from "@/components/broadcast-listener";

export const metadata: Metadata = {
  title: {
    default: "نبراس | NEBRAS — منصة تعليمية ذكية",
    template: "%s | نبراس",
  },
  description: "نبراس — نور المعرفة، طريق المستقبل. منصة تعليمية عربية متكاملة للمراحل الابتدائية والإعدادية والثانوية والجامعية: كورسات، دروس، اختبارات، نتائج، ومتابعة تقدم.",
  keywords: ["نبراس", "NEBRAS", "منصة تعليمية", "تعليم عربي", "كورسات", "اختبارات إلكترونية"],
  applicationName: "NEBRAS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "نبراس",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B3A6B" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1F3B" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // تهيئة المخطط والبيانات الأولية وقت التشغيل فقط (تُتخطى أثناء البناء)
  await bootstrap();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        {/* إعدادات التطبيق القابل للتثبيت (PWA) */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="نبراس" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-screen bg-white text-navy-900 antialiased">
        <ToastProvider>
          {children}
          {/* البثّ الفوري: رسالة الإدارة تظهر لكل المستخدمين لثوانٍ محدودة */}
          <BroadcastListener />
        </ToastProvider>
      </body>
    </html>
  );
}
