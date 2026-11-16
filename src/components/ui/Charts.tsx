import { cn, label, pct } from "@/lib/format";

/** Horizontal bars with the numeric value always printed (never relies on bar length alone). */
export function BarList({ items, emptyText = "No data yet." }: { items: Array<{ label: string; sub?: string; value: number }>; emptyText?: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-navy-900" title={i.label}>{i.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{i.value}</span>
          </div>
          {i.sub && <p className="text-xs text-slate-500">{i.sub}</p>}
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-100" aria-hidden>
            <div className="h-full rounded-full bg-navy-600" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const COLORS: Record<string, string> = {
  Enrolled: "#0284c7", Completed: "#7c3aed", Graduated: "#059669", Withdrawn: "#64748b", Revoked: "#e11d48",
};

/** Donut chart with a text legend (label + count + %) so colour is not the only signal. */
export function Donut({ data }: { data: Array<{ status: string; count: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const r = 40, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Award status distribution of ${total} records`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#E1E9F4" strokeWidth="14" />
          {total > 0 && data.filter((d) => d.count > 0).map((d) => {
            const len = (d.count / total) * c;
            const el = <circle key={d.status} cx="50" cy="50" r={r} fill="none" stroke={COLORS[d.status]} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-navy-900">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">records</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: COLORS[d.status] }} aria-hidden />
            <span className="flex-1">{label(d.status)}</span>
            <span className={cn("tabular-nums font-semibold")}>{d.count}</span>
            <span className="w-10 text-right text-xs text-slate-500 tabular-nums">{pct(d.count, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
