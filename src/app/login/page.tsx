"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, LogIn } from "lucide-react";
import { useDemo } from "@/lib/store";
import { homeFor } from "@/lib/selectors";
import Field, { inputCls } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Notice } from "@/components/ui/Cards";
import Hero3D from "@/components/three/Hero3D";

const DEMO = [
  { who: "Learner", note: "has a Graduated record (certificate) + an Enrolled one", email: "amina@learner.demo" },
  { who: "Learner (no certificate)", note: "Enrolled only", email: "mercy@learner.demo" },
  { who: "QAB – Kilimani Institute", note: "Fully accredited", email: "admin@kit.demo" },
  { who: "QAB – Lakeview University", note: "Provisionally accredited", email: "admin@lua.demo" },
  { who: "KNQA reviewer", note: "can approve / reject", email: "reviewer@knqa.demo" },
  { who: "KNQA auditor", note: "read-only", email: "auditor@knqa.demo" },
];

export default function LoginPage() {
  const { ready, persona, login } = useDemo();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && persona) router.replace(homeFor(persona)); }, [ready, persona, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Enter both your email and password."); return; }
    setBusy(true);
    const r = login(email, password);
    if (r.ok && r.persona) router.replace(homeFor(r.persona));
    else { setError(r.ok ? "Could not determine your role." : r.error); setBusy(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 text-white lg:flex" aria-label="About NAQMIS">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white/10 p-2"><GraduationCap className="h-6 w-6" aria-hidden /></span>
          <span className="text-xl font-semibold">NAQMIS</span>
        </div>
        <div className="h-72 w-full"><Hero3D /></div>
        <div>
          <h2 className="!text-white text-3xl font-semibold leading-tight">One register for every national qualification.</h2>
          <p className="mt-3 max-w-md text-navy-200">Awarding bodies register qualifications, KNQA reviews them, and learners enrol and earn recognised awards — across KNQF levels 1 to 10.</p>
          <p className="mt-6 text-xs text-navy-300">Academic demonstration prototype · sample data only</p>
        </div>
      </section>

      <main id="main" className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden"><GraduationCap className="h-6 w-6 text-navy-800" aria-hidden /><span className="text-lg font-semibold text-navy-900">NAQMIS</span></div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Use a demonstration account to explore the learner, awarding-body or KNQA portal.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {error && <Notice tone="danger">{error}</Notice>}
            <Field label="Email" required>
              {(p) => <input {...p} type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Field label="Password" required>
              {(p) => <input {...p} type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Field>
            <Button type="submit" className="w-full" loading={busy} icon={<LogIn className="h-4 w-4" aria-hidden />}>Sign in</Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">New learner? <Link href="/signup" className="font-medium text-navy-700 underline">Create a demo account</Link></p>

          <div className="mt-8 rounded-xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-semibold">Demo accounts <span className="font-normal text-slate-500">(password for all: Demo@1234)</span></h2>
            <ul className="mt-3 divide-y divide-navy-100">
              {DEMO.map((d) => (
                <li key={d.email} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 text-sm"><p className="font-medium text-navy-900">{d.who}</p><p className="truncate text-xs text-slate-500">{d.email} · {d.note}</p></div>
                  <Button size="sm" variant="secondary" onClick={() => { setEmail(d.email); setPassword("Demo@1234"); setError(""); }} aria-label={`Fill in ${d.who} credentials`}>Use</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
