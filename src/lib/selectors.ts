// Read-only helpers: who is logged in, what they may see, and joined "views" of the tables.
import type { Db, KnqfLevel, Learner, LearnerQualification, NqdRecord, Persona, Qab, Qualification, Session, User } from "./types";

export function currentUser(db: Db, s: Session): User | null {
  return s?.kind === "user" ? db.users.find((u) => u.user_id === s.id) ?? null : null;
}
export function currentLearner(db: Db, s: Session): Learner | null {
  return s?.kind === "learner" ? db.learners.find((l) => l.learner_id === s.id) ?? null : null;
}
export function getPersona(db: Db, s: Session): Persona | null {
  if (!s) return null;
  if (s.kind === "learner") return currentLearner(db, s) ? "learner" : null;
  const u = currentUser(db, s);
  if (!u) return null;
  return u.role === "QAB_Admin" || u.role === "QAB_Submitter" ? "qab" : "knqa";
}
export const homeFor = (p: Persona) => (p === "learner" ? "/learner" : p === "qab" ? "/qab" : "/knqa");

export interface EnrolmentView {
  lq: LearnerQualification; learner: Learner; qualification: Qualification; qab: Qab; level: KnqfLevel; nqd?: NqdRecord;
}

export function enrolmentViews(db: Db): EnrolmentView[] {
  const out: EnrolmentView[] = [];
  for (const lq of db.learner_qualifications) {
    const learner = db.learners.find((l) => l.learner_id === lq.learner_id);
    const qualification = db.qualifications.find((q) => q.qualification_id === lq.qualification_id);
    const qab = qualification && db.qabs.find((x) => x.qab_id === qualification.qab_id);
    const level = qualification && db.knqf_levels.find((l) => l.knqf_level_id === qualification.knqf_level_id);
    if (!learner || !qualification || !qab || !level) continue;
    const nqd = [...db.nqd_records].reverse().find((n) => n.learner_qual_id === lq.learner_qual_id);
    out.push({ lq, learner, qualification, qab, level, nqd });
  }
  return out;
}

/** Data scoping = the prototype's stand-in for the RLS policies in the schema document. */
export function scopedEnrolments(db: Db, s: Session): EnrolmentView[] {
  const persona = getPersona(db, s);
  const all = enrolmentViews(db);
  if (persona === "knqa") return all;
  if (persona === "qab") { const id = currentUser(db, s)?.qab_id; return all.filter((v) => v.qab.qab_id === id); }
  if (persona === "learner") return all.filter((v) => v.learner.learner_id === s?.id);
  return [];
}

export function scopedQualifications(db: Db, s: Session): Qualification[] {
  const persona = getPersona(db, s);
  if (persona === "knqa") return db.qualifications;
  if (persona === "qab") { const id = currentUser(db, s)?.qab_id; return db.qualifications.filter((q) => q.qab_id === id); }
  return [];
}

export function currentQab(db: Db, s: Session): Qab | null {
  const id = currentUser(db, s)?.qab_id;
  return id ? db.qabs.find((q) => q.qab_id === id) ?? null : null;
}

export const userName = (db: Db, id: number) => {
  const u = db.users.find((x) => x.user_id === id);
  return u ? `${u.first_name} ${u.last_name}` : "Unknown";
};

/** Qualifications a learner can enrol in: Registered + awarding body currently accredited. */
export function catalogue(db: Db): Array<{ q: Qualification; qab: Qab; level: KnqfLevel }> {
  const out: Array<{ q: Qualification; qab: Qab; level: KnqfLevel }> = [];
  for (const q of db.qualifications) {
    if (q.current_status !== "Registered") continue;
    const qab = db.qabs.find((x) => x.qab_id === q.qab_id);
    const level = db.knqf_levels.find((l) => l.knqf_level_id === q.knqf_level_id);
    if (!qab || !level) continue;
    if (qab.accreditation_status !== "Fully_Accredited" && qab.accreditation_status !== "Provisionally_Accredited") continue;
    out.push({ q, qab, level });
  }
  return out;
}
