// Types mirror the supplied NAQMIS PostgreSQL design (NAQMIS_Normalized_PostgreSQL_Design.docx).
// Anything marked DEMO ONLY is NOT a column in the supplied schema.

export type QabType = "University" | "TVET_Institution" | "Professional_Body" | "Assessment_Body" | "Foreign_Awarding_Body";
export type AccreditationStatus = "Pending" | "Provisionally_Accredited" | "Fully_Accredited" | "Suspended" | "Revoked";
export type QualificationStatus = "Draft" | "Submitted" | "Under_Review" | "Registered" | "Rejected" | "Archived";
export type LearnerAwardStatus = "Enrolled" | "Completed" | "Graduated" | "Withdrawn" | "Revoked";
export type UserRole = "KNQA_Admin" | "KNQA_Reviewer" | "KNQA_Auditor" | "QAB_Submitter" | "QAB_Admin";
export type NqdSyncStatus = "Queued" | "Transferred" | "Failed" | "Acknowledged";

export interface KnqfLevel { knqf_level_id: number; level_name: string; min_credits: number; description: string | null }

export interface Qab {
  qab_id: number; qab_code: string; name: string; qab_type: QabType; accreditation_status: AccreditationStatus;
  official_email: string; phone_number: string; physical_address: string; county: string; postal_code: string | null;
  created_at: string; updated_at: string;
}

export interface User {
  user_id: number; qab_id: number | null; first_name: string; last_name: string; email: string;
  phone_number: string | null; role: UserRole; is_active: boolean; created_at: string; updated_at: string;
}

export interface Qualification {
  qualification_id: number; qab_id: number; knqf_level_id: number; qualification_code: string; title: string;
  description: string | null; current_status: QualificationStatus; effective_date: string | null; review_date: string | null;
  managed_by_user_id: number; created_at: string; updated_at: string;
}

export interface Learner {
  learner_id: number; national_id: string | null; first_name: string; middle_name: string | null; last_name: string;
  date_of_birth: string; email: string | null; phone_number: string | null; created_at: string; updated_at: string;
}

export interface QualificationRegistration {
  reg_id: number; qualification_id: number; actioned_by_user_id: number; registration_date: string;
  status: QualificationStatus; notes: string | null;
}

/** learner_qualifications: the learner <-> qualification junction (enrolment + award). */
export interface LearnerQualification {
  learner_qual_id: number; learner_id: number; qualification_id: number; submitted_by_user_id: number;
  enrolment_date: string; graduation_date: string | null; certificate_number: string | null; status: LearnerAwardStatus;
  created_at: string; updated_at: string;
  /** DEMO ONLY (not a schema column): records how the demo row was created. */
  demo_source?: "seed" | "learner_self_enrolment" | "qab_submission";
}

export interface NqdRecord {
  nqd_id: number; learner_qual_id: number; initiated_by_user_id: number; transfer_date: string; status: NqdSyncStatus;
  external_nqd_ref: string | null; payload_snapshot: Record<string, unknown> | null; error_message: string | null;
}

/** DEMO ONLY: the supplied `users` table has no learner role and no password column. */
export interface DemoCredential { email: string; password: string; kind: "user" | "learner"; ref_id: number }

export interface Db {
  knqf_levels: KnqfLevel[]; qabs: Qab[]; users: User[]; qualifications: Qualification[]; learners: Learner[];
  qualification_registrations: QualificationRegistration[]; learner_qualifications: LearnerQualification[];
  nqd_records: NqdRecord[]; demo_credentials: DemoCredential[];
}

export type Session = { kind: "user"; id: number } | { kind: "learner"; id: number } | null;
export type Persona = "learner" | "qab" | "knqa";
