"use client";
import { useState } from "react";
import { BookOpen, Building2, CheckCircle2, ClipboardList, History, Landmark, Search, ShieldCheck, Users, XCircle, Eye } from "lucide-react";
import { useDemo } from "@/lib/store";
import { enrolmentViews, userName } from "@/lib/selectors";
import { availableReviewActions, isReviewer, type ReviewAction } from "@/lib/actions";
import { cn, fmtDate, fullName, label } from "@/lib/format";
import { Card, CardTitle, Notice, PageHeader, StatCard } from "@/components/ui/Cards";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import Table from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Overlay from "@/components/ui/Overlay";
import Field, { inputCls } from "@/components/ui/Field";
import HistoryTimeline from "@/components/ui/HistoryTimeline";
import { useToast } from "@/components/ui/Toast";

const QUAL_STATUSES = ["Draft", "Submitted", "Under_Review", "Registered", "Rejected", "Archived"];
const AWARD_STATUSES = ["Enrolled", "Completed", "Graduated", "Withdrawn", "Revoked"];

export default function KnqaDashboard() {
  const { db, user, review } = useDemo();
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [qStatus, setQStatus] = useState("");
  const [qSearch, setQSearch] = useState("");
  const [lStatus, setLStatus] = useState("");
  const [lSearch, setLSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");

  const views = enrolmentViews(db);
  const canReview = !!user && isReviewer(user);
  const qabOf = (id: number) => db.qabs.find((q) => q.qab_id === id);
  const awaiting = db.qualifications.filter((q) => q.current_status === "Submitted" || q.current_status === "Under_Review");
  const selected = db.qualifications.find((q) => q.qualification_id === openId) ?? null;
  const selQab = selected ? qabOf(selected.qab_id) : undefined;
  const selLevel = selected ? db.knqf_levels.find((l) => l.knqf_level_id === selected.knqf_level_id) : undefined;

  const quals = db.qualifications
    .filter((q) => (!qStatus || q.current_status === qStatus) && (!qSearch || `${q.title} ${q.qualification_code} ${qabOf(q.qab_id)?.name}`.toLowerCase().includes(qSearch.toLowerCase())))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const learnerRows = views.filter((v) => (!lStatus || v.lq.status === lStatus) && (!lSearch || `${fullName(v.learner)} ${v.learner.national_id} ${v.qualification.title} ${v.qab.name}`.toLowerCase().includes(lSearch.toLowerCase())));
  const history = [...db.qualification_registrations].sort((a, b) => b.registration_date.localeCompare(a.registration_date) || b.reg_id - a.reg_id);

  function open(id: number) { setOpenId(id); setComment(""); setCommentError(""); }
  function act(action: ReviewAction) {
    if (!selected) return;
    const r = review(selected.qualification_id, action, comment);
    if (r.ok) { toast.notify(r); setComment(""); setCommentError(""); if (action !== "start_review") setOpenId(null); }
    else if (r.field === "comment") setCommentError(r.error);
    else toast.notify(r);
  }
  const actions = selected ? availableReviewActions(selected.current_status) : [];

  const reviewButton = (id: number, s: string) => (
    <Button size="sm" variant={s === "Submitted" || s === "Under_Review" ? "primary" : "secondary"} onClick={() => open(id)} icon={s === "Submitted" || s === "Under_Review" ? <Eye className="h-4 w-4" aria-hidden /> : undefined}>
      {s === "Submitted" || s === "Under_Review" ? "Review" : "View"}
    </Button>
  );

  return (
    <>
      <PageHeader title="KNQA oversight dashboard" description="System-wide view of qualifications, awarding bodies, learners and registration decisions." />
      {!canReview && <div className="mb-5"><Notice title="Read-only access">Your role ({user ? label(user.role) : ""}) can inspect records but cannot approve or reject qualifications.</Notice></div>}
      <Tabs ariaLabel="KNQA sections" value={tab} onChange={setTab} tabs={[
        { id: "overview", label: "Overview", icon: <Landmark className="h-4 w-4" aria-hidden /> },
        { id: "qualifications", label: "Qualifications", icon: <ClipboardList className="h-4 w-4" aria-hidden />, count: awaiting.length },
        { id: "history", label: "Registration history", icon: <History className="h-4 w-4" aria-hidden /> },
        { id: "qabs", label: "Awarding bodies", icon: <Building2 className="h-4 w-4" aria-hidden /> },
        { id: "learners", label: "Learners & enrolments", icon: <Users className="h-4 w-4" aria-hidden /> },
      ]} />

      {tab === "overview" && (
        <TabPanel id="overview">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Awarding bodies" value={db.qabs.length} icon={Building2} />
            <StatCard label="Qualifications" value={db.qualifications.length} hint={`${db.qualifications.filter((q) => q.current_status === "Registered").length} registered`} icon={ShieldCheck} />
            <StatCard label="Awaiting review" value={awaiting.length} hint="Submitted / Under review" icon={ClipboardList} />
            <StatCard label="Learners" value={db.learners.length} icon={Users} />
            <StatCard label="Enrolments" value={db.learner_qualifications.length} icon={BookOpen} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle action={<Button size="sm" variant="ghost" onClick={() => setTab("qualifications")}>Open review queue</Button>}>Awaiting your review</CardTitle>
              {awaiting.length === 0 ? <p className="text-sm text-slate-600">Nothing is waiting for review. 🎉</p> : (
                <ul className="divide-y divide-navy-100">
                  {awaiting.map((q) => (
                    <li key={q.qualification_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0"><p className="font-medium text-navy-900">{q.title}</p><p className="text-xs text-slate-500">{qabOf(q.qab_id)?.name} · Level {q.knqf_level_id}</p></div>
                      <div className="flex items-center gap-2"><StatusBadge status={q.current_status} />{reviewButton(q.qualification_id, q.current_status)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardTitle>Recent activity</CardTitle>
              <ul className="space-y-3">
                {history.slice(0, 6).map((r) => {
                  const q = db.qualifications.find((x) => x.qualification_id === r.qualification_id);
                  return (
                    <li key={r.reg_id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={r.status} /><span className="text-xs text-slate-500">{fmtDate(r.registration_date)}</span></div>
                      <p className="mt-1 text-slate-700">{q?.title} <span className="text-slate-500">· {userName(db, r.actioned_by_user_id)}</span></p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </TabPanel>
      )}

      {tab === "qualifications" && (
        <TabPanel id="qualifications">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
            <Field label="Search qualifications">{(p) => (
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
                <input {...p} type="search" className={cn(inputCls, "pl-9")} placeholder="Title, code or institution" value={qSearch} onChange={(e) => setQSearch(e.target.value)} /></div>)}</Field>
            <Field label="Status">{(p) => <select {...p} className={inputCls} value={qStatus} onChange={(e) => setQStatus(e.target.value)}><option value="">All statuses</option>{QUAL_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>}</Field>
          </div>
          <Table caption="All qualifications" rows={quals} rowKey={(q) => q.qualification_id} emptyTitle="No qualifications match"
            columns={[
              { header: "Qualification", cell: (q) => <div><p className="font-medium text-navy-900">{q.title}</p><p className="font-mono text-xs text-slate-500">{q.qualification_code}</p></div> },
              { header: "Awarding body", cell: (q) => qabOf(q.qab_id)?.name },
              { header: "Level", cell: (q) => q.knqf_level_id },
              { header: "Status", cell: (q) => <StatusBadge status={q.current_status} /> },
              { header: "Updated", cell: (q) => fmtDate(q.updated_at) },
              { header: "Action", cell: (q) => reviewButton(q.qualification_id, q.current_status) },
            ]} />
        </TabPanel>
      )}

      {tab === "history" && (
        <TabPanel id="history">
          <Table caption="Qualification registration history" rows={history} rowKey={(r) => r.reg_id}
            columns={[
              { header: "Date", cell: (r) => fmtDate(r.registration_date) },
              { header: "Qualification", cell: (r) => { const q = db.qualifications.find((x) => x.qualification_id === r.qualification_id); return <div><p className="font-medium text-navy-900">{q?.title}</p><p className="text-xs text-slate-500">{q && qabOf(q.qab_id)?.name}</p></div>; } },
              { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              { header: "Actioned by", cell: (r) => userName(db, r.actioned_by_user_id) },
              { header: "Notes", cell: (r) => <span className="text-slate-700">{r.notes ?? "—"}</span>, className: "min-w-[16rem]" },
            ]} />
        </TabPanel>
      )}

      {tab === "qabs" && (
        <TabPanel id="qabs">
          <Table caption="Qualification awarding bodies" rows={db.qabs} rowKey={(q) => q.qab_id}
            columns={[
              { header: "Awarding body", cell: (q) => <div><p className="font-medium text-navy-900">{q.name}</p><p className="font-mono text-xs text-slate-500">{q.qab_code}</p></div> },
              { header: "Type", cell: (q) => label(q.qab_type) },
              { header: "Accreditation", cell: (q) => <StatusBadge status={q.accreditation_status} /> },
              { header: "County", cell: (q) => q.county },
              { header: "Qualifications", cell: (q) => db.qualifications.filter((x) => x.qab_id === q.qab_id).length },
              { header: "Enrolments", cell: (q) => views.filter((v) => v.qab.qab_id === q.qab_id).length },
              { header: "Contact", cell: (q) => <div className="text-xs"><p>{q.official_email}</p><p className="text-slate-500">{q.phone_number}</p></div> },
            ]} />
        </TabPanel>
      )}

      {tab === "learners" && (
        <TabPanel id="learners">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
            <Field label="Search records">{(p) => (
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
                <input {...p} type="search" className={cn(inputCls, "pl-9")} placeholder="Learner, National ID, qualification or institution" value={lSearch} onChange={(e) => setLSearch(e.target.value)} /></div>)}</Field>
            <Field label="Award status">{(p) => <select {...p} className={inputCls} value={lStatus} onChange={(e) => setLStatus(e.target.value)}><option value="">All statuses</option>{AWARD_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>}</Field>
          </div>
          <Table caption="Learner enrolments across all awarding bodies" rows={learnerRows} rowKey={(v) => v.lq.learner_qual_id} emptyTitle="No records match"
            columns={[
              { header: "Learner", cell: (v) => <div><p className="font-medium text-navy-900">{fullName(v.learner)}</p><p className="text-xs text-slate-500">ID {v.learner.national_id}</p></div> },
              { header: "Qualification", cell: (v) => <div><p>{v.qualification.title}</p><p className="text-xs text-slate-500">{v.qab.name}</p></div> },
              { header: "Enrolled", cell: (v) => fmtDate(v.lq.enrolment_date) },
              { header: "Status", cell: (v) => <StatusBadge status={v.lq.status} /> },
              { header: "NQD sync", cell: (v) => v.nqd ? <div><StatusBadge status={v.nqd.status} />{v.nqd.error_message && <p className="mt-1 text-xs text-rose-700">{v.nqd.error_message}</p>}</div> : <span className="text-xs text-slate-500">—</span> },
            ]} />
        </TabPanel>
      )}

      <Overlay open={!!selected} onClose={() => setOpenId(null)} variant="drawer" title={selected ? (canReview && actions.length ? "Review qualification" : "Qualification details") : ""}
        footer={selected && canReview && actions.length > 0 ? (
          <>
            {actions.includes("start_review") && <Button variant="secondary" onClick={() => act("start_review")} icon={<Eye className="h-4 w-4" aria-hidden />}>Start review</Button>}
            {actions.includes("reject") && <Button variant="danger" onClick={() => act("reject")} icon={<XCircle className="h-4 w-4" aria-hidden />}>Reject</Button>}
            {actions.includes("approve") && <Button variant="success" onClick={() => act("approve")} icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}>Approve & register</Button>}
          </>
        ) : <Button variant="secondary" onClick={() => setOpenId(null)}>Close</Button>}>
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={selected.current_status} /><span className="font-mono text-xs text-slate-500">{selected.qualification_code}</span></div>
              <h3 className="mt-2 text-lg font-semibold">{selected.title}</h3>
              <p className="text-sm text-slate-600">{selQab?.name} · {selLevel?.level_name}</p>
            </div>
            <p className="text-sm text-slate-700">{selected.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Effective date</dt><dd>{fmtDate(selected.effective_date)}</dd></div>
              <div><dt className="text-slate-500">Review date</dt><dd>{fmtDate(selected.review_date)}</dd></div>
              <div><dt className="text-slate-500">Managed by</dt><dd>{userName(db, selected.managed_by_user_id)}</dd></div>
              <div><dt className="text-slate-500">Institution accreditation</dt><dd>{selQab && <StatusBadge status={selQab.accreditation_status} />}</dd></div>
            </dl>
            <div><h4 className="mb-2 text-sm font-semibold">Status history</h4><HistoryTimeline db={db} qualificationId={selected.qualification_id} /></div>
            {canReview && actions.length > 0 && (
              <Field label="Reviewer comment" error={commentError} hint="Visible to the institution in its status history. Required when rejecting.">{(p) => (
                <textarea {...p} rows={4} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />)}</Field>
            )}
            {canReview && actions.length === 0 && <Notice>No review actions are available for a qualification with status {label(selected.current_status)}.</Notice>}
          </div>
        )}
      </Overlay>
    </>
  );
}
