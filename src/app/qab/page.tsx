"use client";
import { useMemo, useState, type FormEvent } from "react";
import { Award, Building2, GraduationCap, Mail, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { useDemo } from "@/lib/store";
import { currentQab, scopedEnrolments, scopedQualifications, type EnrolmentView } from "@/lib/selectors";
import { allowedNext, todayStr } from "@/lib/actions";
import { cn, fmtDate, fullName, label } from "@/lib/format";
import type { LearnerAwardStatus } from "@/lib/types";
import { Card, CardTitle, Notice, PageHeader, StatCard } from "@/components/ui/Cards";
import Table from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Button, { LinkButton } from "@/components/ui/Button";
import Overlay from "@/components/ui/Overlay";
import Field, { inputCls } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import CertificateDialog from "@/components/certificate/CertificateDialog";

const blank = { national_id: "", first_name: "", middle_name: "", last_name: "", date_of_birth: "", email: "", qualification_id: "", enrolment_date: todayStr() };
const AWARD: LearnerAwardStatus[] = ["Enrolled", "Completed", "Graduated", "Withdrawn", "Revoked"];

export default function QabOverview() {
  const { db, session, qabSubmitEnrolment, updateAward } = useDemo();
  const toast = useToast();
  const qab = currentQab(db, session);
  const records = scopedEnrolments(db, session);
  const quals = scopedQualifications(db, session);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<EnrolmentView | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [gradDate, setGradDate] = useState(todayStr());
  const [editError, setEditError] = useState("");
  const [cert, setCert] = useState<EnrolmentView | null>(null);

  const enrolable = useMemo(() => quals.filter((q) => q.current_status === "Registered"), [quals]);
  const canEnrol = !!qab && (qab.accreditation_status === "Fully_Accredited" || qab.accreditation_status === "Provisionally_Accredited");
  const rows = records.filter((v) => {
    const t = `${fullName(v.learner)} ${v.learner.national_id ?? ""} ${v.qualification.title}`.toLowerCase();
    return (!search || t.includes(search.toLowerCase())) && (!statusFilter || v.lq.status === statusFilter);
  });
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setForm((s) => ({ ...s, [k]: e.target.value }));

  function submitEnrolment(e: FormEvent) {
    e.preventDefault();
    const r = qabSubmitEnrolment({ ...form, qualification_id: Number(form.qualification_id) });
    if (r.ok) { toast.notify(r); setShowForm(false); setForm({ ...blank, enrolment_date: todayStr() }); setErrors({}); }
    else setErrors({ [r.field ?? "form"]: r.error });
  }
  function openEdit(v: EnrolmentView) { setEditing(v); setNextStatus(allowedNext(v.lq.status)[0] ?? ""); setGradDate(todayStr()); setEditError(""); }
  function saveEdit() {
    if (!editing) return;
    const r = updateAward(editing.lq.learner_qual_id, nextStatus as LearnerAwardStatus, gradDate);
    if (r.ok) { toast.notify(r); setEditing(null); } else setEditError(r.error);
  }

  if (!qab) return null;
  return (
    <>
      <PageHeader title="Institution & learner records" description="Your awarding body profile and the learner records linked to your qualifications."
        actions={<LinkButton href="/qab/qualifications" variant="secondary">Manage qualifications</LinkButton>} />

      {(qab.accreditation_status === "Suspended" || qab.accreditation_status === "Revoked") && <div className="mb-5"><Notice tone="danger" title={`Accreditation ${label(qab.accreditation_status)}`}>You cannot submit new qualifications or enrolment records until KNQA restores your accreditation. Existing records remain visible.</Notice></div>}
      {qab.accreditation_status === "Pending" && <div className="mb-5"><Notice tone="warning" title="Accreditation pending">Your institution can draft and submit qualifications, but cannot enrol learners until it is at least provisionally accredited.</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle action={<StatusBadge status={qab.accreditation_status} />}>Institution profile</CardTitle>
          <h3 className="text-xl font-semibold">{qab.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{qab.qab_code} · {label(qab.qab_type)}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden /><div><dt className="sr-only">Email</dt><dd>{qab.official_email}</dd></div></div>
            <div className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden /><div><dt className="sr-only">Phone</dt><dd>{qab.phone_number}</dd></div></div>
            <div className="flex gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden /><div><dt className="sr-only">Address</dt><dd>{qab.physical_address}, {qab.county} {qab.postal_code}</dd></div></div>
          </dl>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatCard label="Qualifications" value={quals.length} hint={`${quals.filter((q) => q.current_status === "Registered").length} registered`} icon={Building2} />
          <StatCard label="Learners" value={new Set(records.map((r) => r.learner.learner_id)).size} hint={`${records.length} enrolment records`} icon={Users} />
        </div>
      </div>

      <section className="mt-8" aria-labelledby="records-h">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 id="records-h" className="text-lg font-semibold">Learner records</h2>
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} disabled={!canEnrol || enrolable.length === 0} onClick={() => { setErrors({}); setShowForm(true); }}>Submit enrolment record</Button>
        </div>
        {canEnrol && enrolable.length === 0 && <div className="mb-3"><Notice>You need at least one <strong>Registered</strong> qualification before learners can be enrolled.</Notice></div>}
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
          <Field label="Search records">{(p) => (
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input {...p} type="search" className={cn(inputCls, "pl-9")} placeholder="Learner name, National ID or qualification" value={search} onChange={(e) => setSearch(e.target.value)} /></div>)}</Field>
          <Field label="Award status">{(p) => (
            <select {...p} className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>{AWARD.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>)}</Field>
        </div>
        <Table caption="Learner records for your institution" rows={rows} rowKey={(v) => v.lq.learner_qual_id} emptyTitle="No learner records found" emptyDescription="Adjust the filters or submit an enrolment record."
          columns={[
            { header: "Learner", cell: (v) => <div><p className="font-medium text-navy-900">{fullName(v.learner)}</p><p className="text-xs text-slate-500">ID {v.learner.national_id}</p></div> },
            { header: "Qualification", cell: (v) => <div><p>{v.qualification.title}</p><p className="font-mono text-xs text-slate-500">{v.qualification.qualification_code}</p></div> },
            { header: "Enrolled", cell: (v) => fmtDate(v.lq.enrolment_date) },
            { header: "Status", cell: (v) => <StatusBadge status={v.lq.status} /> },
            { header: "Certificate no.", cell: (v) => <span className="font-mono text-xs">{v.lq.certificate_number ?? "—"}</span> },
            { header: "Actions", cell: (v) => (
              <div className="flex flex-wrap gap-2">
                {allowedNext(v.lq.status).length > 0 && <Button size="sm" variant="secondary" onClick={() => openEdit(v)} aria-label={`Update status for ${fullName(v.learner)}`}>Update status</Button>}
                {v.lq.status === "Graduated" && <Button size="sm" variant="ghost" icon={<Award className="h-4 w-4" aria-hidden />} onClick={() => setCert(v)}>Certificate</Button>}
              </div>) },
          ]} />
      </section>

      <Overlay open={showForm} onClose={() => setShowForm(false)} title="Submit enrolment record" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" form="enrol-form" icon={<GraduationCap className="h-4 w-4" aria-hidden />}>Submit record</Button></>}>
        <form id="enrol-form" onSubmit={submitEnrolment} className="grid gap-4 sm:grid-cols-2" noValidate>
          {errors.form && <div className="sm:col-span-2"><Notice tone="danger">{errors.form}</Notice></div>}
          <Field label="Qualification" required error={errors.qualification_id} className="sm:col-span-2">{(p) => (
            <select {...p} className={inputCls} value={form.qualification_id} onChange={set("qualification_id")}><option value="">Select a registered qualification</option>
              {enrolable.map((q) => <option key={q.qualification_id} value={q.qualification_id}>{q.qualification_code} – {q.title}</option>)}</select>)}</Field>
          <Field label="Learner National ID" required hint="If this ID already exists, the existing learner is linked and the details below are ignored." error={errors.national_id} className="sm:col-span-2">{(p) => <input {...p} inputMode="numeric" className={inputCls} value={form.national_id} onChange={set("national_id")} />}</Field>
          <Field label="First name" error={errors.first_name} hint="Required for new learners">{(p) => <input {...p} className={inputCls} value={form.first_name} onChange={set("first_name")} />}</Field>
          <Field label="Middle name">{(p) => <input {...p} className={inputCls} value={form.middle_name} onChange={set("middle_name")} />}</Field>
          <Field label="Last name" error={errors.last_name} hint="Required for new learners">{(p) => <input {...p} className={inputCls} value={form.last_name} onChange={set("last_name")} />}</Field>
          <Field label="Date of birth" error={errors.date_of_birth} hint="Required for new learners">{(p) => <input {...p} type="date" max={todayStr()} className={inputCls} value={form.date_of_birth} onChange={set("date_of_birth")} />}</Field>
          <Field label="Email" error={errors.email}>{(p) => <input {...p} type="email" className={inputCls} value={form.email} onChange={set("email")} />}</Field>
          <Field label="Enrolment date" required error={errors.enrolment_date}>{(p) => <input {...p} type="date" max={todayStr()} className={inputCls} value={form.enrolment_date} onChange={set("enrolment_date")} />}</Field>
        </form>
      </Overlay>

      <Overlay open={!!editing} onClose={() => setEditing(null)} title="Update award status"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit} disabled={!nextStatus}>Save status</Button></>}>
        {editing && (
          <div className="space-y-4">
            {editError && <Notice tone="danger">{editError}</Notice>}
            <p className="text-sm"><strong>{fullName(editing.learner)}</strong> · {editing.qualification.title}</p>
            <p className="flex items-center gap-2 text-sm">Current status: <StatusBadge status={editing.lq.status} /></p>
            <Field label="New status" required>{(p) => <select {...p} className={inputCls} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>{allowedNext(editing.lq.status).map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>}</Field>
            {nextStatus === "Graduated" && <Field label="Graduation date" required hint="A certificate number is generated automatically." >{(p) => <input {...p} type="date" min={editing.lq.enrolment_date} max={todayStr()} className={inputCls} value={gradDate} onChange={(e) => setGradDate(e.target.value)} />}</Field>}
          </div>
        )}
      </Overlay>
      <CertificateDialog view={cert} onClose={() => setCert(null)} />
    </>
  );
}
