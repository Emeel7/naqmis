import { useId, type ReactNode } from "react";
import { cn } from "@/lib/format";

export const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 aria-[invalid=true]:border-rose-500";

interface InputProps { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; required?: boolean }

/** Label + hint + error wrapper. `children` receives the id/aria props to spread on the control. */
export default function Field({ label, hint, error, required, children, className }: {
  label: string; hint?: string; error?: string; required?: boolean; className?: string; children: (p: InputProps) => ReactNode;
}) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy-900">
        {label} {required && <span className="text-rose-700" aria-hidden>*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-err`} className={cn("mt-1 text-xs font-medium text-rose-700")}>{error}</p>}
    </div>
  );
}
