import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/format";

export function Card({ children, className, as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("rounded-xl border border-navy-100 bg-white p-5 shadow-card", className)}>{children}</Tag>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className="rounded-lg bg-navy-50 p-2 text-navy-700"><Icon className="h-4 w-4" aria-hidden /></span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-navy-200 bg-white px-6 py-10 text-center">
      <Inbox className="h-8 w-8 text-navy-300" aria-hidden />
      <p className="mt-3 font-medium text-navy-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warning" | "danger"; title?: string; children: ReactNode }) {
  const t = { info: "border-sky-200 bg-sky-50 text-sky-900", warning: "border-amber-300 bg-amber-50 text-amber-900", danger: "border-rose-300 bg-rose-50 text-rose-900" }[tone];
  return (
    <div role={tone === "info" ? "note" : "alert"} className={cn("rounded-lg border px-4 py-3 text-sm", t)}>
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
