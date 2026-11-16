"use client";
import { useState } from "react";
import { Award, Lock } from "lucide-react";
import { useDemo } from "@/lib/store";
import { scopedEnrolments, type EnrolmentView } from "@/lib/selectors";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/Cards";
import Table from "@/components/ui/Table";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import StatusBadge from "@/components/ui/StatusBadge";
import Button, { LinkButton } from "@/components/ui/Button";
import CertificateDialog from "@/components/certificate/CertificateDialog";

export default function MyEnrolments() {
  const { db, session } = useDemo();
  const [tab, setTab] = useState("all");
  const [cert, setCert] = useState<EnrolmentView | null>(null);
  const all = scopedEnrolments(db, session).sort((a, b) => b.lq.enrolment_date.localeCompare(a.lq.enrolment_date));
  const current = all.filter((v) => v.lq.status === "Enrolled" || v.lq.status === "Completed");
  const previous = all.filter((v) => !(v.lq.status === "Enrolled" || v.lq.status === "Completed"));
  const rows = tab === "current" ? current : tab === "previous" ? previous : all;

  return (
    <>
      <PageHeader title="My enrolments" description="Your learner records (learner_qualifications). Certificates are available only for Graduated records."
        actions={<LinkButton href="/learner/qualifications" variant="secondary">Find a qualification</LinkButton>} />
      <Tabs ariaLabel="Enrolment filter" value={tab} onChange={setTab}
        tabs={[{ id: "all", label: "All", count: all.length }, { id: "current", label: "Current", count: current.length }, { id: "previous", label: "Previous", count: previous.length }]} />
      <TabPanel id={tab}>
        <Table caption="My enrolments" rows={rows} rowKey={(v) => v.lq.learner_qual_id}
          emptyTitle="No enrolments in this view" emptyDescription="Enrol in a registered qualification to see it here."
          columns={[
            { header: "Qualification", cell: (v) => <div><p className="font-medium text-navy-900">{v.qualification.title}</p><p className="text-xs text-slate-500">{v.qab.name} · {v.level.level_name}</p></div> },
            { header: "Enrolled", cell: (v) => fmtDate(v.lq.enrolment_date) },
            { header: "Graduated", cell: (v) => fmtDate(v.lq.graduation_date) },
            { header: "Status", cell: (v) => <StatusBadge status={v.lq.status} /> },
            { header: "Certificate", cell: (v) => v.lq.status === "Graduated" && v.lq.certificate_number
              ? <Button size="sm" variant="secondary" icon={<Award className="h-4 w-4" aria-hidden />} onClick={() => setCert(v)}>View certificate</Button>
              : <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" aria-hidden />Available after graduation</span> },
          ]} />
      </TabPanel>
      <CertificateDialog view={cert} onClose={() => setCert(null)} />
    </>
  );
}
