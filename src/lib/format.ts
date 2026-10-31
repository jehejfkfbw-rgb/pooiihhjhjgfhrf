export function egp(n: number): string {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function num(n: number): string {
  return new Intl.NumberFormat("ar-EG-u-nu-latn").format(n);
}

export function arDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(date);
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "دلوقتي";
  if (m < 60) return `من ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `من ${h} ساعة`;
  const dd = Math.floor(h / 24);
  return `من ${dd} يوم`;
}
