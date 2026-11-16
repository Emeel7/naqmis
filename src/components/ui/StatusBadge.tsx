import { AlertTriangle, Archive, Ban, BookOpen, Check, CheckCircle2, Clock, Eye, GraduationCap, Pencil, Send, ShieldAlert, ShieldCheck, UserMinus, XCircle } from "lucide-react";
import type { ComponentType } from "react";
import { cn, label } from "@/lib/format";

// One badge for every status enum in the schema. Colour + icon + text, so colour is never the only signal.
const MAP: Record<string, { cls: string; Icon: ComponentType<{ className?: string }> }> = {
  // qualification_status_enum
  Draft: { cls: "bg-slate-100 text-slate-700 ring-slate-300", Icon: Pencil },
  Submitted: { cls: "bg-sky-50 text-sky-800 ring-sky-300", Icon: Send },
  Under_Review: { cls: "bg-amber-50 text-amber-800 ring-amber-300", Icon: Eye },
  Registered: { cls: "bg-emerald-50 text-emerald-800 ring-emerald-300", Icon: CheckCircle2 },
  Rejected: { cls: "bg-rose-50 text-rose-800 ring-rose-300", Icon: XCircle },
  Archived: { cls: "bg-slate-100 text-slate-600 ring-slate-300", Icon: Archive },
  // accreditation_status_enum
  Pending: { cls: "bg-amber-50 text-amber-800 ring-amber-300", Icon: Clock },
  Provisionally_Accredited: { cls: "bg-sky-50 text-sky-800 ring-sky-300", Icon: ShieldCheck },
  Fully_Accredited: { cls: "bg-emerald-50 text-emerald-800 ring-emerald-300", Icon: ShieldCheck },
  Suspended: { cls: "bg-orange-50 text-orange-800 ring-orange-300", Icon: ShieldAlert },
  Revoked: { cls: "bg-rose-50 text-rose-800 ring-rose-300", Icon: Ban },
  // learner_award_status_enum
  Enrolled: { cls: "bg-sky-50 text-sky-800 ring-sky-300", Icon: BookOpen },
  Completed: { cls: "bg-violet-50 text-violet-800 ring-violet-300", Icon: Check },
  Graduated: { cls: "bg-emerald-50 text-emerald-800 ring-emerald-300", Icon: GraduationCap },
  Withdrawn: { cls: "bg-slate-100 text-slate-700 ring-slate-300", Icon: UserMinus },
  // nqd_sync_status_enum
  Queued: { cls: "bg-slate-100 text-slate-700 ring-slate-300", Icon: Clock },
  Transferred: { cls: "bg-sky-50 text-sky-800 ring-sky-300", Icon: Send },
  Failed: { cls: "bg-rose-50 text-rose-800 ring-rose-300", Icon: AlertTriangle },
  Acknowledged: { cls: "bg-emerald-50 text-emerald-800 ring-emerald-300", Icon: CheckCircle2 },
};

export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = MAP[status] ?? MAP.Draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", m.cls, className)}>
      <m.Icon className="h-3.5 w-3.5" aria-hidden />
      {label(status)}
    </span>
  );
}
