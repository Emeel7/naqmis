import type { Db } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { userName } from "@/lib/selectors";
import StatusBadge from "./StatusBadge";

/** Registration history for one qualification (qualification_registrations, oldest first). */
export default function HistoryTimeline({ db, qualificationId }: { db: Db; qualificationId: number }) {
  const rows = db.qualification_registrations
    .filter((r) => r.qualification_id === qualificationId)
    .sort((a, b) => a.registration_date.localeCompare(b.registration_date) || a.reg_id - b.reg_id);
  if (rows.length === 0) return <p className="text-sm text-slate-500">No history yet.</p>;
  return (
    <ol className="space-y-4 border-l-2 border-navy-100 pl-4">
      {rows.map((r) => (
        <li key={r.reg_id} className="relative">
          <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-navy-600" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} />
            <span className="text-xs text-slate-500">{fmtDate(r.registration_date)} · {userName(db, r.actioned_by_user_id)}</span>
          </div>
          {r.notes && <p className="mt-1 text-sm text-slate-700">{r.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
