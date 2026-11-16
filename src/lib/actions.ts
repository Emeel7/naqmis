// Business rules for the prototype. Pure functions: (db, args) -> new db or an error.
// They enforce the constraints from the supplied schema (unique keys, status enums, date checks).
import type {
  Db, Learner, LearnerAwardStatus, LearnerQualification, Qualification, QualificationStatus, User,
} from "./types";
import { label } from "./format";

export type Res<T = undefined> =
  | { ok: true; db: Db; message: string; data?: T }
  | { ok: false; error: string; field?: string };

const fail = (error: string, field?: string): { ok: false; error: string; field?: string } => ({ ok: false, error, field });
export const todayStr = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();
const nextId = <T,>(rows: T[], key: keyof T) => rows.reduce((m, r) => Math.max(m, Number(r[key])), 0) + 1;

export const isReviewer = (u: User) => u.role === "KNQA_Reviewer" || u.role === "KNQA_Admin";
const accredited = (s: string) => s === "Provisionally_Accredited" || s === "Fully_Accredited";
const ACTIVE_AWARD: LearnerAwardStatus[] = ["Enrolled", "Completed", "Graduated"];

/* ----------------------------- QAB: qualifications ----------------------------- */
export interface QualInput { title: string; qualification_code: string; description: string; knqf_level_id: number }

export function submitQualification(db: Db, actor: User, input: QualInput, asDraft: boolean): Res<Qualification> {
  if (!actor.qab_id) return fail("Only awarding-body users can submit qualifications.");
  const qab = db.qabs.find((q) => q.qab_id === actor.qab_id);
  if (!qab) return fail("Institution record not found.");
  if (qab.accreditation_status === "Suspended" || qab.accreditation_status === "Revoked")
    return fail(`Your institution's accreditation is ${label(qab.accreditation_status)}. New submissions are blocked.`);

  const title = input.title.trim();
  const code = input.qualification_code.trim().toUpperCase();
  const description = input.description.trim();
  if (!title) return fail("Qualification title is required.", "title");
  if (title.length > 255) return fail("Title must be 255 characters or fewer.", "title");
  if (!/^[A-Z0-9][A-Z0-9-]{2,49}$/.test(code))
    return fail("Code must be 3–50 characters using letters, numbers and hyphens (e.g. KIT-DICT-601).", "qualification_code");
  if (description.length < 20) return fail("Please add a description of at least 20 characters.", "description");
  if (!db.knqf_levels.some((l) => l.knqf_level_id === input.knqf_level_id)) return fail("Select a KNQF level.", "knqf_level_id");
  if (db.qualifications.some((q) => q.qualification_code === code))
    return fail("This qualification code is already in use (codes must be unique).", "qualification_code");
  if (db.qualifications.some((q) => q.qab_id === qab.qab_id && q.knqf_level_id === input.knqf_level_id && q.title.toLowerCase() === title.toLowerCase()))
    return fail("Your institution already has a qualification with this title at this KNQF level.", "title");

  const now = nowIso();
  const status: QualificationStatus = asDraft ? "Draft" : "Submitted";
  const qualification: Qualification = {
    qualification_id: nextId(db.qualifications, "qualification_id"), qab_id: qab.qab_id, knqf_level_id: input.knqf_level_id,
    qualification_code: code, title, description, current_status: status, effective_date: null, review_date: null,
    managed_by_user_id: actor.user_id, created_at: now, updated_at: now,
  };
  const reg = {
    reg_id: nextId(db.qualification_registrations, "reg_id"), qualification_id: qualification.qualification_id,
    actioned_by_user_id: actor.user_id, registration_date: now, status,
    notes: asDraft ? "Saved as draft by institution." : "Submitted for registration by institution.",
  };
  return {
    ok: true, data: qualification,
    message: asDraft ? `“${title}” saved as a draft.` : `“${title}” submitted to KNQA. Status: Submitted.`,
    db: { ...db, qualifications: [...db.qualifications, qualification], qualification_registrations: [...db.qualification_registrations, reg] },
  };
}

export function submitDraft(db: Db, actor: User, qualificationId: number): Res {
  const q = db.qualifications.find((x) => x.qualification_id === qualificationId);
  if (!q || q.qab_id !== actor.qab_id) return fail("Qualification not found for your institution.");
  if (q.current_status !== "Draft") return fail("Only drafts can be submitted.");
  const qab = db.qabs.find((x) => x.qab_id === q.qab_id);
  if (qab && (qab.accreditation_status === "Suspended" || qab.accreditation_status === "Revoked"))
    return fail(`Your institution's accreditation is ${label(qab.accreditation_status)}. New submissions are blocked.`);
  const now = nowIso();
  return {
    ok: true, message: `“${q.title}” submitted to KNQA. Status: Submitted.`,
    db: {
      ...db,
      qualifications: db.qualifications.map((x) => (x === q ? { ...x, current_status: "Submitted", updated_at: now } : x)),
      qualification_registrations: [
        ...db.qualification_registrations,
        { reg_id: nextId(db.qualification_registrations, "reg_id"), qualification_id: q.qualification_id, actioned_by_user_id: actor.user_id, registration_date: now, status: "Submitted", notes: "Submitted for registration by institution." },
      ],
    },
  };
}

/* ----------------------------- KNQA: review ----------------------------- */
export type ReviewAction = "start_review" | "approve" | "reject";
const REVIEW_RULES: Record<ReviewAction, { from: QualificationStatus[]; to: QualificationStatus; note: string }> = {
  start_review: { from: ["Submitted"], to: "Under_Review", note: "Review started." },
  approve: { from: ["Submitted", "Under_Review"], to: "Registered", note: "Approved for registration." },
  reject: { from: ["Submitted", "Under_Review"], to: "Rejected", note: "Rejected." },
};
export const availableReviewActions = (s: QualificationStatus): ReviewAction[] =>
  (Object.keys(REVIEW_RULES) as ReviewAction[]).filter((a) => REVIEW_RULES[a].from.includes(s));

export function reviewQualification(db: Db, actor: User, qualificationId: number, action: ReviewAction, comment: string): Res {
  if (!isReviewer(actor)) return fail("Your role is read-only. Only a KNQA reviewer can change a qualification's status.");
  const q = db.qualifications.find((x) => x.qualification_id === qualificationId);
  if (!q) return fail("Qualification not found.");
  const rule = REVIEW_RULES[action];
  if (!rule.from.includes(q.current_status)) return fail(`A qualification with status ${label(q.current_status)} cannot be moved to ${label(rule.to)}.`);
  const note = comment.trim();
  if (action === "reject" && note.length < 10) return fail("Please give a reason for rejection (at least 10 characters) so the institution can respond.", "comment");

  const now = nowIso();
  let effective = q.effective_date, review = q.review_date;
  if (action === "approve") {
    effective = todayStr();
    const r = new Date(); r.setFullYear(r.getFullYear() + 5);
    review = r.toISOString().slice(0, 10); // review_date > effective_date (chk_qual_dates)
  }
  return {
    ok: true,
    message: action === "start_review" ? `Review started for “${q.title}”.` : action === "approve" ? `“${q.title}” approved. Status: Registered.` : `“${q.title}” rejected. The institution can see your comment.`,
    db: {
      ...db,
      qualifications: db.qualifications.map((x) => (x === q ? { ...x, current_status: rule.to, effective_date: effective, review_date: review, updated_at: now } : x)),
      qualification_registrations: [
        ...db.qualification_registrations,
        { reg_id: nextId(db.qualification_registrations, "reg_id"), qualification_id: q.qualification_id, actioned_by_user_id: actor.user_id, registration_date: now, status: rule.to, notes: note || rule.note },
      ],
    },
  };
}

/* ----------------------------- Learner: enrolment ----------------------------- */
function checkEnrolable(db: Db, q: Qualification | undefined): string | null {
  if (!q) return "Qualification not found.";
  if (q.current_status !== "Registered") return "Only Registered qualifications are open for enrolment.";
  const qab = db.qabs.find((x) => x.qab_id === q.qab_id);
  if (!qab || !accredited(qab.accreditation_status)) return "The awarding body is not currently accredited to enrol learners.";
  return null;
}

export function enrolLearner(db: Db, learnerId: number, qualificationId: number): Res<LearnerQualification> {
  const learner = db.learners.find((l) => l.learner_id === learnerId);
  if (!learner) return fail("Learner record not found.");
  const q = db.qualifications.find((x) => x.qualification_id === qualificationId);
  const problem = checkEnrolable(db, q);
  if (problem || !q) return fail(problem ?? "Qualification not found.");
  if (db.learner_qualifications.some((e) => e.learner_id === learnerId && e.qualification_id === qualificationId && ACTIVE_AWARD.includes(e.status)))
    return fail("You already have an active or completed record for this qualification.");
  // Schema requires submitted_by_user_id (NOT NULL -> users). Demo assumption: recorded under the awarding body's user.
  const submitter = db.users.find((u) => u.qab_id === q.qab_id && u.is_active);
  if (!submitter) return fail("This awarding body has no active user to record the enrolment.");
  const now = nowIso();
  const row: LearnerQualification = {
    learner_qual_id: nextId(db.learner_qualifications, "learner_qual_id"), learner_id: learnerId, qualification_id: qualificationId,
    submitted_by_user_id: submitter.user_id, enrolment_date: todayStr(), graduation_date: null, certificate_number: null,
    status: "Enrolled", created_at: now, updated_at: now, demo_source: "learner_self_enrolment",
  };
  return { ok: true, data: row, message: `You are now enrolled in “${q.title}”.`, db: { ...db, learner_qualifications: [...db.learner_qualifications, row] } };
}

/* ----------------------------- QAB: learner records ----------------------------- */
export interface EnrolmentInput {
  national_id: string; first_name: string; middle_name: string; last_name: string; date_of_birth: string;
  email: string; qualification_id: number; enrolment_date: string;
}

export function qabSubmitEnrolment(db: Db, actor: User, input: EnrolmentInput): Res<LearnerQualification> {
  if (!actor.qab_id) return fail("Only awarding-body users can submit enrolment records.");
  const q = db.qualifications.find((x) => x.qualification_id === input.qualification_id);
  if (!q || q.qab_id !== actor.qab_id) return fail("Choose one of your institution's qualifications.", "qualification_id");
  const problem = checkEnrolable(db, q);
  if (problem) return fail(problem, "qualification_id");
  const nid = input.national_id.trim();
  if (!/^\d{6,12}$/.test(nid)) return fail("National ID must be 6–12 digits.", "national_id");
  if (!input.enrolment_date) return fail("Enrolment date is required.", "enrolment_date");
  if (input.enrolment_date > todayStr()) return fail("Enrolment date cannot be in the future.", "enrolment_date");

  let learners = db.learners;
  let learner = learners.find((l) => l.national_id === nid);
  const linkedExisting = !!learner;
  const now = nowIso();
  if (!learner) {
    if (!input.first_name.trim()) return fail("First name is required for a new learner.", "first_name");
    if (!input.last_name.trim()) return fail("Last name is required for a new learner.", "last_name");
    if (!input.date_of_birth || input.date_of_birth >= todayStr()) return fail("Enter a valid date of birth (must be in the past).", "date_of_birth");
    if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) return fail("Enter a valid email address.", "email");
    learner = {
      learner_id: nextId(learners, "learner_id"), national_id: nid, first_name: input.first_name.trim(), middle_name: input.middle_name.trim() || null,
      last_name: input.last_name.trim(), date_of_birth: input.date_of_birth, email: input.email.trim() || null, phone_number: null, created_at: now, updated_at: now,
    } as Learner;
    learners = [...learners, learner];
  }
  if (db.learner_qualifications.some((e) => e.learner_id === learner!.learner_id && e.qualification_id === q.qualification_id && ACTIVE_AWARD.includes(e.status)))
    return fail("This learner already has an active or completed record for this qualification.", "national_id");
  const row: LearnerQualification = {
    learner_qual_id: nextId(db.learner_qualifications, "learner_qual_id"), learner_id: learner.learner_id, qualification_id: q.qualification_id,
    submitted_by_user_id: actor.user_id, enrolment_date: input.enrolment_date, graduation_date: null, certificate_number: null,
    status: "Enrolled", created_at: now, updated_at: now, demo_source: "qab_submission",
  };
  return {
    ok: true, data: row,
    message: linkedExisting ? "Enrolment recorded and linked to the existing learner record." : "New learner created and enrolment recorded.",
    db: { ...db, learners, learner_qualifications: [...db.learner_qualifications, row] },
  };
}

export const allowedNext = (s: LearnerAwardStatus): LearnerAwardStatus[] =>
  ({ Enrolled: ["Completed", "Withdrawn"], Completed: ["Graduated", "Withdrawn"], Graduated: ["Revoked"], Withdrawn: [], Revoked: [] } as Record<LearnerAwardStatus, LearnerAwardStatus[]>)[s];

export function updateAwardStatus(db: Db, actor: User, learnerQualId: number, status: LearnerAwardStatus, graduationDate: string): Res {
  const row = db.learner_qualifications.find((e) => e.learner_qual_id === learnerQualId);
  const q = row && db.qualifications.find((x) => x.qualification_id === row.qualification_id);
  if (!row || !q || q.qab_id !== actor.qab_id) return fail("Record not found for your institution.");
  if (!allowedNext(row.status).includes(status)) return fail(`A record with status ${label(row.status)} cannot be changed to ${label(status)}.`);
  const now = nowIso();
  let updated: LearnerQualification = { ...row, status, updated_at: now };
  let nqd = db.nqd_records;
  if (status === "Graduated") {
    if (!graduationDate) return fail("Graduation date is required.", "graduation_date");
    if (graduationDate < row.enrolment_date) return fail("Graduation date cannot be before the enrolment date.", "graduation_date");
    if (graduationDate > todayStr()) return fail("Graduation date cannot be in the future.", "graduation_date");
    const year = graduationDate.slice(0, 4);
    let seq = db.learner_qualifications.filter((e) => e.certificate_number).length + 1;
    let cert = `DEMO-NQ-${year}-${String(seq).padStart(4, "0")}`;
    while (db.learner_qualifications.some((e) => e.certificate_number === cert)) cert = `DEMO-NQ-${year}-${String(++seq).padStart(4, "0")}`;
    updated = { ...updated, graduation_date: graduationDate, certificate_number: cert };
    nqd = [...nqd, {
      nqd_id: nextId(nqd, "nqd_id"), learner_qual_id: row.learner_qual_id, initiated_by_user_id: actor.user_id, transfer_date: now, status: "Queued",
      external_nqd_ref: null, payload_snapshot: { certificate_number: cert, learner_id: row.learner_id, qualification_id: row.qualification_id, graduation_date: graduationDate }, error_message: null,
    }];
  }
  return {
    ok: true, message: status === "Graduated" ? `Marked Graduated. Certificate ${updated.certificate_number} is now available to the learner.` : `Record updated to ${label(status)}.`,
    db: { ...db, learner_qualifications: db.learner_qualifications.map((e) => (e === row ? updated : e)), nqd_records: nqd },
  };
}

/* ----------------------------- Signup (demo learner accounts) ----------------------------- */
export interface SignupInput { first_name: string; last_name: string; national_id: string; date_of_birth: string; email: string; password: string }

export function signupLearner(db: Db, input: SignupInput): Res<Learner> {
  const email = input.email.trim().toLowerCase();
  if (!input.first_name.trim()) return fail("First name is required.", "first_name");
  if (!input.last_name.trim()) return fail("Last name is required.", "last_name");
  if (!/^\d{6,12}$/.test(input.national_id.trim())) return fail("National ID must be 6–12 digits.", "national_id");
  if (!input.date_of_birth || input.date_of_birth >= todayStr()) return fail("Enter a valid date of birth (must be in the past).", "date_of_birth");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email address.", "email");
  if (input.password.length < 8) return fail("Password must be at least 8 characters.", "password");
  if (db.demo_credentials.some((c) => c.email.toLowerCase() === email)) return fail("An account with this email already exists.", "email");
  const existing = db.learners.find((l) => l.national_id === input.national_id.trim());
  if (existing && db.demo_credentials.some((c) => c.kind === "learner" && c.ref_id === existing.learner_id))
    return fail("A learner account already exists for this National ID.", "national_id");
  const now = nowIso();
  const learner: Learner = existing ?? {
    learner_id: nextId(db.learners, "learner_id"), national_id: input.national_id.trim(), first_name: input.first_name.trim(), middle_name: null,
    last_name: input.last_name.trim(), date_of_birth: input.date_of_birth, email, phone_number: null, created_at: now, updated_at: now,
  };
  return {
    ok: true, data: learner, message: "Account created. Welcome to NAQMIS!",
    db: {
      ...db, learners: existing ? db.learners : [...db.learners, learner],
      demo_credentials: [...db.demo_credentials, { email, password: input.password, kind: "learner", ref_id: learner.learner_id }],
    },
  };
}
