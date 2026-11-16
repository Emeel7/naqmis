"use client";
import { useMemo, useState } from "react";
import { Building2, CheckCircle2, Search } from "lucide-react";
import { useDemo } from "@/lib/store";
import { catalogue } from "@/lib/selectors";
import { cn } from "@/lib/format";
import { Card, EmptyState, Notice, PageHeader } from "@/components/ui/Cards";
import Field, { inputCls } from "@/components/ui/Field";
import Overlay from "@/components/ui/Overlay";
import Button, { LinkButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Item = ReturnType<typeof catalogue>[number];

export default function QualificationCatalogue() {
  const { db, session, enrol } = useDemo();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [qabId, setQabId] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const all = useMemo(() => catalogue(db), [db]);
  const qabs = useMemo(() => Array.from(new Map(all.map((i) => [i.qab.qab_id, i.qab])).values()), [all]);
  const items = all.filter((i) => {
    const text = `${i.q.title} ${i.q.qualification_code} ${i.qab.name} ${i.q.description ?? ""}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!level || i.level.knqf_level_id === Number(level)) && (!qabId || i.qab.qab_id === Number(qabId));
  });
  const enrolled = (qid: number) => session?.kind === "learner" && db.learner_qualifications.some((e) => e.learner_id === session.id && e.qualification_id === qid && ["Enrolled", "Completed", "Graduated"].includes(e.status));

  function close() { setSelected(null); setConfirming(false); setDone(false); setError(""); }
  function confirm() {
    if (!selected) return;
    const r = enrol(selected.q.qualification_id);
    if (r.ok) { setDone(true); setConfirming(false); toast.notify(r); } else { setError(r.error); setConfirming(false); toast.notify(r); }
  }

  return (
    <>
      <PageHeader title="Find a qualification" description="Browse qualifications that are Registered with KNQA and offered by currently accredited awarding bodies." />
      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Search">{(p) => (
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input {...p} type="search" className={cn(inputCls, "pl-9")} placeholder="Title, code or institution" value={q} onChange={(e) => setQ(e.target.value)} /></div>)}
          </Field>
          <Field label="KNQF level">{(p) => (
            <select {...p} className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All levels</option>{db.knqf_levels.map((l) => <option key={l.knqf_level_id} value={l.knqf_level_id}>{l.level_name}</option>)}
            </select>)}
          </Field>
          <Field label="Awarding body">{(p) => (
            <select {...p} className={inputCls} value={qabId} onChange={(e) => setQabId(e.target.value)}>
              <option value="">All institutions</option>{qabs.map((b) => <option key={b.qab_id} value={b.qab_id}>{b.name}</option>)}
            </select>)}
          </Field>
        </div>
      </Card>

      <p className="mb-3 text-sm text-slate-600" role="status">{items.length} qualification{items.length === 1 ? "" : "s"} found</p>
      {items.length === 0 ? <EmptyState title="No qualifications match your filters" description="Try clearing the search or choosing a different level." action={<Button variant="secondary" onClick={() => { setQ(""); setLevel(""); setQabId(""); }}>Clear filters</Button>} /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.q.qualification_id}>
              <Card as="article" className="flex h-full flex-col">
                <span className="w-fit rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-navy-800">KNQF Level {i.level.knqf_level_id}</span>
                <h2 className="mt-3 text-base font-semibold">{i.q.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Building2 className="h-4 w-4 shrink-0" aria-hidden />{i.qab.name}</p>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{i.q.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">{i.q.qualification_code}</span>
                  {enrolled(i.q.qualification_id) ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden />Enrolled</span> : null}
                  <Button size="sm" variant="secondary" onClick={() => setSelected(i)} aria-label={`View details for ${i.q.title}`}>View details</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Overlay open={!!selected} onClose={close} variant="drawer" title={selected?.q.title ?? ""}
        footer={selected && (done ? (
          <><Button variant="secondary" onClick={close}>Close</Button><LinkButton href="/learner/enrolments">Go to my enrolments</LinkButton></>
        ) : confirming ? (
          <><Button variant="secondary" onClick={() => setConfirming(false)}>Back</Button><Button onClick={confirm}>Confirm enrolment</Button></>
        ) : (
          <><Button variant="secondary" onClick={close}>Close</Button><Button disabled={enrolled(selected.q.qualification_id)} onClick={() => { setError(""); setConfirming(true); }}>{enrolled(selected.q.qualification_id) ? "Already enrolled" : "Enrol now"}</Button></>
        ))}>
        {selected && (
          <div className="space-y-4">
            {done && <Notice tone="info" title="Enrolment confirmed">You are enrolled in this qualification. Its status is <strong>Enrolled</strong>; your awarding body will update it as you progress.</Notice>}
            {error && <Notice tone="danger">{error}</Notice>}
            {confirming && <Notice tone="warning" title="Confirm your enrolment">You are about to enrol in <strong>{selected.q.title}</strong> at <strong>{selected.qab.name}</strong>.</Notice>}
            <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
              <dt className="text-slate-500">Awarding body</dt><dd className="font-medium">{selected.qab.name}</dd>
              <dt className="text-slate-500">KNQF level</dt><dd className="font-medium">{selected.level.level_name}</dd>
              <dt className="text-slate-500">Minimum credits</dt><dd>{selected.level.min_credits} (level minimum)</dd>
              <dt className="text-slate-500">Code</dt><dd className="font-mono">{selected.q.qualification_code}</dd>
              <dt className="text-slate-500">County</dt><dd>{selected.qab.county}</dd>
            </dl>
            <div><h3 className="text-sm font-semibold">Description</h3><p className="mt-1 text-sm text-slate-700">{selected.q.description}</p></div>
          </div>
        )}
      </Overlay>
    </>
  );
}
