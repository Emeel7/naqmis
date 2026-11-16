"use client";
// Demo store: React context + localStorage. NOT a backend. Anyone with the browser can edit this data.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Db, LearnerAwardStatus, Session, Persona, User } from "./types";
import { makeSeed } from "./seed";
import * as A from "./actions";
import { currentUser, getPersona } from "./selectors";

const DB_KEY = "naqmis-demo-db-v1";
const SESSION_KEY = "naqmis-demo-session-v1";

export type Outcome = { ok: true; message: string } | { ok: false; error: string; field?: string };

interface Store {
  db: Db; session: Session; ready: boolean; persona: Persona | null; user: User | null;
  login: (email: string, password: string) => Outcome & { persona?: Persona };
  logout: () => void;
  signup: (input: A.SignupInput) => Outcome;
  resetDemo: () => void;
  submitQualification: (input: A.QualInput, asDraft: boolean) => Outcome;
  submitDraft: (qualificationId: number) => Outcome;
  review: (qualificationId: number, action: A.ReviewAction, comment: string) => Outcome;
  enrol: (qualificationId: number) => Outcome;
  qabSubmitEnrolment: (input: A.EnrolmentInput) => Outcome;
  updateAward: (learnerQualId: number, status: LearnerAwardStatus, graduationDate: string) => Outcome;
}

const Ctx = createContext<Store | null>(null);
export const useDemo = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useDemo must be used inside <DemoProvider>");
  return s;
};

const toOutcome = (r: A.Res<unknown>): Outcome => (r.ok ? { ok: true, message: r.message } : { ok: false, error: r.error, field: r.field });

export function DemoProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>(() => makeSeed());
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);
  const dbRef = useRef(db);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { const parsed = JSON.parse(raw) as Db; dbRef.current = parsed; setDb(parsed); }
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setSession(JSON.parse(s) as Session);
    } catch { /* corrupted storage: fall back to seed data */ }
    setReady(true);
  }, []);

  const persistDb = (next: Db) => {
    dbRef.current = next; setDb(next);
    try { localStorage.setItem(DB_KEY, JSON.stringify(next)); } catch { /* storage full/blocked: still works in memory */ }
  };
  const persistSession = (s: Session) => {
    setSession(s);
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  };

  const run = useCallback(<T,>(fn: (d: Db) => A.Res<T>): Outcome => {
    const r = fn(dbRef.current);
    if (r.ok) persistDb(r.db);
    return toOutcome(r);
  }, []);

  const user = currentUser(db, session);
  const persona = getPersona(db, session);
  const needUser = (): User | null => user;
  const noUser: Outcome = { ok: false, error: "Your session has expired. Please log in again." };

  const store = useMemo<Store>(() => ({
    db, session, ready, persona, user,
    login: (email, password) => {
      const cred = dbRef.current.demo_credentials.find((c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password);
      if (!cred) return { ok: false, error: "Incorrect email or password." };
      const s: Session = cred.kind === "learner" ? { kind: "learner", id: cred.ref_id } : { kind: "user", id: cred.ref_id };
      if (s.kind === "user" && !dbRef.current.users.find((u) => u.user_id === s.id)?.is_active) return { ok: false, error: "This account is inactive." };
      persistSession(s);
      return { ok: true, message: "Welcome back!", persona: getPersona(dbRef.current, s) ?? undefined };
    },
    logout: () => persistSession(null),
    signup: (input) => {
      const r = A.signupLearner(dbRef.current, input);
      if (!r.ok) return toOutcome(r);
      persistDb(r.db);
      persistSession({ kind: "learner", id: r.data!.learner_id });
      return toOutcome(r);
    },
    resetDemo: () => { persistDb(makeSeed()); persistSession(null); },
    submitQualification: (input, asDraft) => { const u = needUser(); return u ? run((d) => A.submitQualification(d, u, input, asDraft)) : noUser; },
    submitDraft: (id) => { const u = needUser(); return u ? run((d) => A.submitDraft(d, u, id)) : noUser; },
    review: (id, action, comment) => { const u = needUser(); return u ? run((d) => A.reviewQualification(d, u, id, action, comment)) : noUser; },
    enrol: (qid) => (session?.kind === "learner" ? run((d) => A.enrolLearner(d, session.id, qid)) : noUser),
    qabSubmitEnrolment: (input) => { const u = needUser(); return u ? run((d) => A.qabSubmitEnrolment(d, u, input)) : noUser; },
    updateAward: (id, status, date) => { const u = needUser(); return u ? run((d) => A.updateAwardStatus(d, u, id, status, date)) : noUser; },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [db, session, ready, persona, user, run]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

