# NAQMIS – User Interface Prototype

A lightweight, responsive **Next.js** demonstration of the Kenya National Qualifications Authority (KNQA)
*National Qualifications Management Information System*. It shows how **learners**, **qualification awarding
bodies (QABs)** and **KNQA staff** interact with the data model in `NAQMIS_Normalized_PostgreSQL_Design.docx`.

> ⚠️ **Academic demonstration only.** No database, no backend, sample data only. The graduation certificate is a
> clearly-labelled demo sample and is **not** an official KNQA document.

## Technology stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · Lucide React · Three.js via React Three Fiber (one lazy-loaded 3D scene).
No UI/chart libraries – charts are small hand-built SVG/CSS components.

## Install and run
```bash
npm install
npm run dev          # http://localhost:3000  (redirects to /login)
npm run build && npm start   # optional production check
```
Requires Node.js 18.17+.

## Sample logins (password for all: `Demo@1234`)
| Role | Email | Notes |
|---|---|---|
| Learner | `amina@learner.demo` | Has a **Graduated** record (certificate), a Completed and an Enrolled record |
| Learner | `mercy@learner.demo` | **Enrolled only** – no certificate available |
| QAB (QAB_Admin) | `admin@kit.demo` | Kilimani Institute of Technology – Fully accredited |
| QAB (QAB_Admin) | `admin@lua.demo` | Lakeview University – Provisionally accredited |
| QAB (QAB_Submitter) | `submitter@rvp.demo`, `submitter@eapsb.demo` | Rift Valley Polytechnic / EA Professional Standards Board |
| QAB (blocked cases) | `submitter@chc.demo` (Pending), `submitter@hac.demo` (Suspended) | Show accreditation restrictions |
| KNQA reviewer | `reviewer@knqa.demo` | Can start review, approve, reject |
| KNQA auditor | `auditor@knqa.demo` | Read-only |

New learners can also sign up at `/signup`. The sidebar has **Reset demo data**.

## Routes (9)
`/login` · `/signup` · `/learner` · `/learner/qualifications` · `/learner/enrolments` · `/qab` · `/qab/qualifications` · `/knqa` · `/reports`
(`/` only redirects to `/login` via `next.config.mjs`.) Qualification details, review forms, certificates and history
are drawers/modals/tabs, not extra routes.

## Project structure
```
data/                      JSON seed files (qabs, users, knqf_levels, qualifications, qualification_registrations,
                           learners, enrolments = learner_qualifications, nqd_records, demo_credentials)
src/app/                   Routes + per-role layouts (each layout wraps pages in <AppShell allow=[…]>)
src/lib/types.ts           TypeScript types mirroring the schema tables and enums
src/lib/actions.ts         Business rules (pure functions) – validation, status transitions, uniqueness
src/lib/selectors.ts       Role-based data scoping + joined views (stand-in for the RLS policies)
src/lib/reports.ts         Report aggregation
src/lib/store.tsx          React context + localStorage persistence + demo login
src/components/ui/         Design system: Button, StatusBadge, Cards, Field, Overlay, Table, Tabs, Toast, Charts…
src/components/layout/     AppShell (responsive sidebar, route guard, reset)
src/components/certificate Certificate layout + dialog
src/components/three/      3D scene + static fallback
```

## Local JSON + localStorage
On first load the app deep-copies the JSON files in `data/` into memory and saves every change to the browser's
`localStorage` (`naqmis-demo-db-v1`; session in `naqmis-demo-session-v1`). The JSON files are never modified.
**This is prototype persistence only** – it is per-browser, single-user, unencrypted and trivially editable. It is
not a secure or multi-user backend. "Reset demo data" restores the original JSON.

## Key workflows
1. **QAB submits** a qualification (`/qab/qualifications`) → status *Submitted* + a `qualification_registrations` row.
2. **KNQA reviews** (`/knqa` → Qualifications → Review): start review, add comment, approve (→ *Registered*, effective/review dates set) or reject (comment required). Each action adds a history row.
3. **Learner enrols** (`/learner/qualifications`): only *Registered* qualifications of currently accredited QABs are listed; enrolment creates a `learner_qualifications` row with status *Enrolled*.
4. **QAB manages learner records** (`/qab`): submit enrolment records (by National ID) and move records Enrolled → Completed → Graduated (a certificate number is generated and an `nqd_records` row is queued).
5. **Certificate**: shown only when the record is *Graduated* with a certificate number and graduation date.
6. **Reports** (`/reports`): QAB sees its own aggregates; KNQA sees system-wide aggregates.

## Seven design considerations

### 1. Usability
**Why:** Three very different audiences (learners, institution staff, regulators) must complete tasks without training.
**How:** Each role gets its own short navigation and dashboard; forms are grouped with concise labels, hints and inline errors; every action ends with a visible success/error toast; empty states explain the next step.
**Example:** After a QAB submits a qualification, a toast confirms "Submitted… Status: Submitted" and the new row appears at the top of the list with its status badge; KNQA sees it in the review queue immediately.

### 2. Accessibility
**Why:** A public-sector system must be usable by people with different abilities and devices.
**How:** All inputs have visible `<label>`s with hint/error text linked via `aria-describedby`; modals and drawers trap focus, close with Esc and restore focus; a skip-to-content link and visible focus rings are provided; status badges always combine **text + icon + colour**; charts print their numbers and legends; motion is minimised when `prefers-reduced-motion` is set.
**Example:** The award-status donut chart lists "Graduated 5 · 25%" beside each colour, so it is readable without colour vision. *Not claimed:* no formal WCAG audit or screen-reader testing has been done; tab lists are not arrow-key navigable.

### 3. Responsiveness
**Why:** Learners are likely to use phones; staff use laptops.
**How:** Desktop-first layouts collapse to one column; the sidebar becomes a hamburger menu below `lg`; tables scroll horizontally inside their own container instead of breaking the page; forms switch from two columns to one.
**Example:** The QAB qualification page shows the registration form beside the submissions table on wide screens and stacks them on tablets/phones.

### 4. Security and privacy
**Why:** QABs must never see each other's learners or submissions; KNQA oversight is system-wide.
**How:** Every page reads data through role-scoped selectors (`scopedEnrolments`, `scopedQualifications`) that mirror the RLS policies in the database design; QAB actions verify the record belongs to the actor's institution; the KNQA auditor is read-only; learners see only their own records. QABs add learners by National ID rather than browsing a global learner list.
**Example:** Logged in as `admin@kit.demo`, the learner table and reports contain only Kilimani Institute records. **Important:** this is *demonstration* security. Passwords are stored in plain text in `demo_credentials.json`/localStorage, nothing is encrypted, and anyone can edit localStorage. It is not production-secure.

### 5. Data integrity and consistency
**Why:** The UI should never allow states that the database design forbids.
**How:** Types and JSON seed data mirror the schema; status dropdowns use only the supplied enum values; business rules enforce unique qualification codes, unique (QAB, title, level), `review_date > effective_date`, `graduation_date ≥ enrolment_date`, and the QAB/KNQA role split. Enrolments are `learner_qualifications` rows because a learner can hold many qualifications and a qualification many learners (a many-to-many junction), and each status change on a qualification writes a `qualification_registrations` history row.
**Example:** A certificate button is enabled only when the `learner_qualifications` row has status **Graduated** – merely enrolling (or being Completed) never produces one, and certificate numbers are unique.

### 6. Performance and efficiency
**Why:** A demo must load fast on modest hardware and projectors.
**How:** Minimal dependencies (no chart/UI frameworks); small seed datasets (~20 enrolments); the 3D scene is code-split with `next/dynamic`, uses `frameloop="demand"` (renders only when the pointer moves), and falls back to a static SVG for reduced-motion, no-WebGL or low-core-count devices; no continuous animations.
**Example:** The login page's 3D "ten KNQF levels" staircase stops rendering when idle; if WebGL is unavailable the SVG staircase appears instead.

### 7. Consistency
**Why:** Users who work across portals (or staff who switch roles) should not relearn the interface.
**How:** One design system (navy/blue palette, same typography, buttons, tables, drawers, form fields); one `StatusBadge` for all four status families; the same shell, header and toast behaviour for learner, QAB and KNQA.
**Example:** "Registered" always renders as the same green badge with a check icon whether it appears in the learner catalogue, the QAB submissions table or the KNQA review drawer.

## Known limitations and assumptions
- **Not production software.** localStorage persistence, plain-text demo passwords, no server-side checks.
- **Learner login is demo-only.** The supplied `users` table has no Learner role and no password column; learners authenticate through a separate `demo_credentials` list (`kind: "learner"`). The production schema is not altered.
- **`submitted_by_user_id`** is NOT NULL in `learner_qualifications`. For learner self-enrolment the prototype records the awarding body's active user as submitter (demo assumption). The extra `demo_source` field on enrolments is a presentation/demo field, **not** a schema column.
- **No KNQA_Admin** user/module is seeded (per brief). Two KNQA roles are demonstrated: Reviewer and Auditor.
- KNQF level names and minimum credits are **illustrative sample values**, not official figures. Institutions, people and IDs are fictional.
- **Graduation rate** = Graduated ÷ all enrolment records in scope (a simple demo definition).
- QABs can submit learner enrolments only for their own *Registered* qualifications while *Provisionally* or *Fully* accredited. Suspended/Revoked QABs cannot submit anything; Pending QABs can submit qualifications but not enrol learners.
- The "QR-style" verification image on the certificate is decorative and not scannable. NQD records are display-only (status shown in the KNQA learners tab; no real transfer occurs).
- Built and unit-tested at the logic level; visual layouts should be checked in your browser (desktop and a phone-width window).
