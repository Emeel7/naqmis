import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { EmptyState } from "./Cards";

export interface Column<T> { header: string; cell: (row: T) => ReactNode; className?: string }

/** Responsive table: scrolls horizontally on small screens instead of breaking the layout. */
export default function Table<T>({ columns, rows, rowKey, caption, emptyTitle = "Nothing to show", emptyDescription }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string | number; caption: string; emptyTitle?: string; emptyDescription?: string;
}) {
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-navy-50 text-xs uppercase tracking-wide text-navy-700">
          <tr>{columns.map((c) => <th key={c.header} scope="col" className={cn("px-4 py-3 font-semibold", c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-navy-50/50">
              {columns.map((c) => <td key={c.header} className={cn("px-4 py-3 align-top", c.className)}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
