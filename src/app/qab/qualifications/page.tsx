"use client";
import { useState, type FormEvent } from "react";
import { History, Save, Send } from "lucide-react";
import { useDemo } from "@/lib/store";
import { currentQab, scopedQualifications } from "@/lib/selectors";
import { fmtDate, label } from "@/lib/format";
import type { Qualification } from "@/lib/types";
import { Card, CardTitle, Notice, PageHeader } from "@/components/ui/Cards";
import Field, { inputCls } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Overlay from "@/components/ui/Overlay";
import HistoryTimeline from "@/components/ui/HistoryTimeline";
import { useToast } from "@/components/ui/Toast";

const blank = { title: "", qualification_code: "", description: "", knqf_level_id: "" };

export default function QabQualifications() {
  const { db, session, submitQualification, submitDraft } = useDemo();
  const toast = useToast();
  const qab = currentQab(db, session);
  const quals = scopedQualifications(db, session).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historyFor, setHistoryFor] = useState<Qualification | null>(null);
  const blocked = !qab || qab.accreditation_status === "Suspended" || qab.accreditation_status === "Revoked";
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setForm((s) => ({ ...s, [k]: e.target.value }));

  function send(asDraft: boolean) {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Qualification title is required.";
    if (!form.qualification_code.trim()) errs.qualification_code = "Qualification code is required.";
    if (!form.knqf_level_id) errs.knqf_level_id = "Select a KNQF level.";
    if (!form.description.trim()) errs.description = "A description is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const r = submitQualification({ ...form, knqf_level_id: Number(form.knqf_level_id) }, asDraft);
    if (r.ok) { toast.notify(r); setForm(blank); setErrors({}); }
    else setErrors({ [r.field ?? "form"]: r.error });
  }
  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(false); };
  const submittedOn = (id: number) => db.qualification_registrations.filter((r) => r.qualification_id === id && r.status === "Submitted").map((r) => r.registration_date).sort()[0];

  return (
    <>
      <PageHeader title="Qualifications" description="Register new qualifications with KNQA and track where each submission stands." />
      {blocked && qab && <div className="mb-5"><Notice tone="danger" title={`Accreditation ${label(qab.accreditation_status)}`}>New qualification submissions are blocked for your institution.</Notice></div>}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardTitle>Register a qualification</CardTitle>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {errors.form && <Notice tone="danger">{errors.form}</Notice>}
            <fieldset disabled={blocked} className="space-y-4 disabled:opacity-60">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-600">Qualification details</legend>
              <Field label="Title" required error={errors.title} hint="Official qualification name, e.g. Diploma in Applied Statistics.">{(p) => <input {...p} className={inputCls} value={form.title} onChange={set("title")} maxLength={255} />}</Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Code" required error={errors.qualification_code} hint="Unique. Letters, numbers, hyphens.">{(p) => <input {...p} className={inputCls} value={form.qualification_code} onChange={set("qualification_code")} placeholder="KIT-XXX-601" />}</Field>
                <Field label="KNQF level" required error={errors.knqf_level_id}>{(p) => (
                  <select {...p} className={inputCls} value={form.knqf_level_id} onChange={set("knqf_level_id")}><option value="">Select level</option>
                    {db.knqf_levels.map((l) => <option key={l.knqf_level_id} value={l.knqf_level_id}>{l.level_name}</option>)}</select>)}</Field>
              </div>
              <Field label="Description" required error={errors.description} hint={`${form.description.trim().length} characters · minimum 20. Describe scope, outcomes and target learners.`}>{(p) => <textarea {...p} rows={5} className={inputCls} value={form.description} onChange={set("description")} />}</Field>
            </fieldset>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={blocked} icon={<Save className="h-4 w-4" aria-hidden />} onClick={() => send(true)}>Save as draft</Button>
              <Button type="submit" disabled={blocked} icon={<Send className="h-4 w-4" aria-hidden />}>Submit for registration</Button>
            </div>
          </form>
        </Card>

        <section className="xl:col-span-3" aria-labelledby="mine-h">
          <h2 id="mine-h" className="mb-3 text-base font-semibold">Your submissions ({quals.length})</h2>
          <Table caption="Qualifications submitted by your institution" rows={quals} rowKey={(q) => q.qualification_id} emptyTitle="No qualifications yet" emptyDescription="Use the form to submit your first qualification."
            columns={[
              { header: "Qualification", cell: (q) => <div><p className="font-medium text-navy-900">{q.title}</p><p className="font-mono text-xs text-slate-500">{q.qualification_code} · Level {q.knqf_level_id}</p></div> },
              { header: "Status", cell: (q) => <StatusBadge status={q.current_status} /> },
              { header: "Dates", cell: (q) => (
                <dl className="space-y-0.5 text-xs text-slate-600">
                  <div>Submitted: {fmtDate(submittedOn(q.qualification_id))}</div>
                  <div>Effective: {fmtDate(q.effective_date)}</div>
                  <div>Review due: {fmtDate(q.review_date)}</div>
                </dl>) },
              { header: "Actions", cell: (q) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" icon={<History className="h-4 w-4" aria-hidden />} onClick={() => setHistoryFor(q)} aria-label={`View status history for ${q.title}`}>History</Button>
                  {q.current_status === "Draft" && <Button size="sm" disabled={blocked} onClick={() => toast.notify(submitDraft(q.qualification_id))}>Submit</Button>}
                </div>) },
            ]} />
        </section>
      </div>

      <Overlay open={!!historyFor} onClose={() => setHistoryFor(null)} title="Registration history" variant="drawer"
        footer={<Button variant="secondary" onClick={() => setHistoryFor(null)}>Close</Button>}>
        {historyFor && (
          <div className="space-y-4">
            <div><p className="font-semibold text-navy-900">{historyFor.title}</p><p className="font-mono text-xs text-slate-500">{historyFor.qualification_code}</p></div>
            <HistoryTimeline db={db} qualificationId={historyFor.qualification_id} />
          </div>
        )}
      </Overlay>
    </>
  );
}
