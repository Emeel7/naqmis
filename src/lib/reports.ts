import type { LearnerAwardStatus, Qualification } from "./types";
import type { EnrolmentView } from "./selectors";

export const AWARD_STATUSES: LearnerAwardStatus[] = ["Enrolled", "Completed", "Graduated", "Withdrawn", "Revoked"];

export interface QualificationStat { qualification: Qualification; qabName: string; enrolments: number; graduates: number }

export function buildReport(views: EnrolmentView[]) {
  const totalEnrolments = views.length;
  const totalLearners = new Set(views.map((v) => v.learner.learner_id)).size;
  const graduated = views.filter((v) => v.lq.status === "Graduated").length;
  const byStatus = AWARD_STATUSES.map((status) => ({ status, count: views.filter((v) => v.lq.status === status).length }));

  const map = new Map<number, QualificationStat>();
  const qabMap = new Map<string, number>();
  for (const v of views) {
    const s = map.get(v.qualification.qualification_id) ?? { qualification: v.qualification, qabName: v.qab.name, enrolments: 0, graduates: 0 };
    s.enrolments += 1;
    if (v.lq.status === "Graduated") s.graduates += 1;
    map.set(v.qualification.qualification_id, s);
    qabMap.set(v.qab.name, (qabMap.get(v.qab.name) ?? 0) + 1);
  }
  const byQualification = [...map.values()].sort((a, b) => b.enrolments - a.enrolments || a.qualification.title.localeCompare(b.qualification.title));
  const byQab = [...qabMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  return { totalEnrolments, totalLearners, graduated, graduationRate: totalEnrolments ? graduated / totalEnrolments : 0, byStatus, byQualification, byQab };
}
