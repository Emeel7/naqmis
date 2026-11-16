"use client";
import { useState } from "react";
import Link from "next/link";
import { Award, BookOpen, CheckCircle2, GraduationCap, Layers, Search } from "lucide-react";
import { useDemo } from "@/lib/store";
import { currentLearner, scopedEnrolments, type EnrolmentView } from "@/lib/selectors";
import { fmtDate } from "@/lib/format";
import { Card, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui/Cards";
import StatusBadge from "@/components/ui/StatusBadge";
import Button, { LinkButton } from "@/components/ui/Button";
import CertificateDialog from "@/components/certificate/CertificateDialog";

export default function LearnerDashboard() {
  const { db, session } = useDemo();
  const [cert, setCert] = useState<EnrolmentView | null>(null);
  const learner = currentLearner(db, session);
  const mine = scopedEnrolments(db, session).sort((a, b) => b.lq.enrolment_date.localeCompare(a.lq.enrolment_date));
  const count = (s: string) => mine.filter((v) => v.lq.status === s).length;
  const graduates = mine.filter((v) => v.lq.status === "Graduated" && v.lq.certificate_number);

  return (
    <>
      <PageHeader
        title={`Welcome, ${learner?.first_name ?? "learner"}`}
        description="Track your qualifications, discover new ones and view your graduation certificates."
        actions={<LinkButton href="/learner/qualifications" icon={<Search className="h-4 w-4" aria-hidden />}>Find a qualification</LinkButton>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total enrolments" value={mine.length} icon={Layers} />
        <StatCard label="In progress" value={count("Enrolled")} hint="Status: Enrolled" icon={BookOpen} />
        <StatCard label="Completed" value={count("Completed")} hint="Awaiting graduation" icon={CheckCircle2} />
        <StatCard label="Graduated" value={graduates.length} hint="Certificates available" icon={GraduationCap} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle action={<Link href="/learner/enrolments" className="text-sm font-medium text-navy-700 underline">View all</Link>}>Recent enrolments</CardTitle>
          {mine.length === 0 ? (
            <EmptyState title="No enrolments yet" description="Browse registered qualifications and enrol in one to get started." action={<LinkButton href="/learner/qualifications">Browse qualifications</LinkButton>} />
          ) : (
            <ul className="divide-y divide-navy-100">
              {mine.slice(0, 4).map((v) => (
                <li key={v.lq.learner_qual_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0"><p className="font-medium text-navy-900">{v.qualification.title}</p><p className="text-xs text-slate-500">{v.qab.name} · Enrolled {fmtDate(v.lq.enrolment_date)}</p></div>
                  <StatusBadge status={v.lq.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Your certificates</CardTitle>
          {graduates.length === 0 ? (
            <p className="text-sm text-slate-600">A certificate becomes available once an awarding body marks an enrolment as <strong>Graduated</strong>.</p>
          ) : (
            <ul className="space-y-3">
              {graduates.map((v) => (
                <li key={v.lq.learner_qual_id} className="rounded-lg border border-navy-100 p-3">
                  <p className="text-sm font-medium text-navy-900">{v.qualification.title}</p>
                  <p className="text-xs text-slate-500">Graduated {fmtDate(v.lq.graduation_date)}</p>
                  <Button size="sm" variant="secondary" className="mt-2" icon={<Award className="h-4 w-4" aria-hidden />} onClick={() => setCert(v)}>View certificate</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <CertificateDialog view={cert} onClose={() => setCert(null)} />
    </>
  );
}
