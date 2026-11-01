import { db } from "@/db";
import { securityEvents } from "@/db/schema";
import { NextRequest } from "next/server";

export function requestMeta(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for") || "unknown",
    path: req.nextUrl.pathname,
    userAgent: req.headers.get("user-agent") || "unknown"
  };
}

export async function logSecurityEvent(input: any) {
  const isSuspicious = /select|drop|insert|delete|<script|alert/i.test(input.bodyText || "");
  
  const verdict = {
    blocked: isSuspicious,
    severity: isSuspicious ? "high" : "low" as any,
    summary: isSuspicious ? "محاولة اختراق محتملة (Pattern Match)" : "نشاط طبيعي"
  };

  if (isSuspicious) {
    await db.insert(securityEvents).values({
      type: "exploit-attempt",
      severity: verdict.severity,
      source: input.source ?? "web",
      ip: input.ip,
      path: input.path,
      userAgent: input.userAgent ?? "",
      summary: verdict.summary,
      blocked: true,
    });
  }

  return verdict;
}
