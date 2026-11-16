const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-05-30" or ISO timestamp -> "30 May 2026" (no timezone shifts). */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export const label = (s: string) => s.replace(/_/g, " ");
export const cn = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");
export const fullName = (p: { first_name: string; middle_name?: string | null; last_name: string }) =>
  [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
export const pct = (n: number, d: number) => (d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`);
