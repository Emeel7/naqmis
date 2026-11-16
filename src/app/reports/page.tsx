"use client";
import { useMemo } from "react";
import { BookOpen, GraduationCap, Percent, Users } from "lucide-react";
import { useDemo } from "@/lib/store";
import { currentQab, scopedEnrolments } from "@/lib/selectors";
import { buildReport } from "@/lib/reports";
import { pct } from "@/lib/format";
import { Card, CardTitle, Notice, PageHeader, StatCard } from "@/components/ui/Cards";
import { BarList, Donut } from "@/components/ui/Charts";
import Table from "@/components/ui/Table";

export default function ReportsPage() {
  const { db, session, persona } = useDemo();
  const qab = currentQab(db, session);
  const views = scopedEnrolments(db, session);
  const r = useMemo(() => buildReport(views), [views]);
  const isKnqa = persona === "knqa";

  return (
    <>
      <PageHeader title="Learner reports" description={isKnqa ? "System-wide aggregates across all awarding bodies." : `Aggregates for ${qab?.name ?? "your institution"} only.`} />
      <div className="mb-5"><Notice>{isKnqa ? "Showing records for all awarding bodies (KNQA oversight view)." : "Your report is limited to records linked to your institution's qualifications."} Figures are derived live from the demo data.</Notice></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total learners" value={r.totalLearners} hint="Distinct learners" icon={Users} />
        <StatCard label="Total enrolments" value={r.totalEnrolments} hint="learner_qualifications rows" icon={BookOpen} />
        <StatCard label="Graduates" value={r.graduated} hint="Status: Graduated" icon={GraduationCap} />
        <StatCard label="Graduation rate" value={pct(r.graduated, r.totalEnrolments)} hint="Graduated ÷ all enrolments" icon={Percent} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardTitle>Enrolments by qualification</CardTitle>
          <BarList items={r.byQualification.slice(0, 8).map((s) => ({ label: s.qualification.title, sub: isKnqa ? s.qabName : s.qualification.qualification_code, value: s.enrolments }))} /></Card>
        <Card><CardTitle>Learner distribution by award status</CardTitle><Donut data={r.byStatus} /></Card>
      </div>

      {isKnqa && <Card className="mt-6"><CardTitle>Enrolments by awarding body</CardTitle><BarList items={r.byQab.map((b) => ({ label: b.name, value: b.count }))} /></Card>}

      <section className="mt-6" aria-labelledby="pop-h">
        <h2 id="pop-h" className="mb-3 text-base font-semibold">Qualification popularity</h2>
        <Table caption="Qualifications ranked by enrolments" rows={r.byQualification.map((s, i) => ({ ...s, rank: i + 1 }))} rowKey={(s) => s.qualification.qualification_id} emptyTitle="No enrolment data"
          columns={[
            { header: "#", cell: (s) => s.rank, className: "w-12" },
            { header: "Qualification", cell: (s) => <div><p className="font-medium text-navy-900">{s.qualification.title}</p>{isKnqa && <p className="text-xs text-slate-500">{s.qabName}</p>}</div> },
            { header: "Enrolments", cell: (s) => s.enrolments },
            { header: "Graduates", cell: (s) => s.graduates },
            { header: "Graduation rate", cell: (s) => pct(s.graduates, s.enrolments) },
          ]} />
      </section>
    </>
  );
}
