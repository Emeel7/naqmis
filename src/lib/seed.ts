import knqf from "@data/knqf_levels.json";
import qabs from "@data/qabs.json";
import users from "@data/users.json";
import qualifications from "@data/qualifications.json";
import learners from "@data/learners.json";
import regs from "@data/qualification_registrations.json";
import enrolments from "@data/enrolments.json";
import nqd from "@data/nqd_records.json";
import creds from "@data/demo_credentials.json";
import type { Db } from "./types";

/** Fresh deep copy of the JSON seed data (the JSON files themselves are never modified). */
export function makeSeed(): Db {
  return JSON.parse(
    JSON.stringify({
      knqf_levels: knqf, qabs, users, qualifications, learners,
      qualification_registrations: regs, learner_qualifications: enrolments,
      nqd_records: nqd, demo_credentials: creds,
    })
  ) as Db;
}
