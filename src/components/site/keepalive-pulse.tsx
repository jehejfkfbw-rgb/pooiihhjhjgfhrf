"use client";

import { useEffect } from "react";

/** نبضة خفيفة لإبقاء healthcheck دافئ طالما الصفحة مفتوحة */
export default function KeepAlivePulse() {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/health", { cache: "no-store" }).catch(() => {});
      }
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  return null;
}
