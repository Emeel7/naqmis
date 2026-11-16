"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, UserPlus } from "lucide-react";
import { useDemo } from "@/lib/store";
import { homeFor } from "@/lib/selectors";
import Field, { inputCls } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Notice } from "@/components/ui/Cards";
import { useToast } from "@/components/ui/Toast";

const empty = { first_name: "", last_name: "", national_id: "", date_of_birth: "", email: "", password: "" };

export default function SignupPage() {
  const { ready, persona, signup } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => { if (ready && persona) router.replace(homeFor(persona)); }, [ready, persona, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = signup(f);
    if (r.ok) { toast.success(r.message); router.replace("/learner"); return; }
    setErrors({ [r.field ?? "form"]: r.error });
    setBusy(false);
  }

  return (
    <main id="main" className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-4 flex items-center gap-2"><GraduationCap className="h-6 w-6 text-navy-800" aria-hidden /><span className="text-lg font-semibold text-navy-900">NAQMIS</span></div>
        <h1 className="text-2xl font-semibold">Create a learner account</h1>
        <div className="mt-3"><Notice title="Demonstration only">The supplied database design has no learner login role (learners live in the <code>learners</code> table). This prototype adds a separate demo-only credential store so learners can sign in.</Notice></div>
        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
          {errors.form && <div className="sm:col-span-2"><Notice tone="danger">{errors.form}</Notice></div>}
          <Field label="First name" required error={errors.first_name}>{(p) => <input {...p} className={inputCls} value={f.first_name} onChange={set("first_name")} autoComplete="given-name" />}</Field>
          <Field label="Last name" required error={errors.last_name}>{(p) => <input {...p} className={inputCls} value={f.last_name} onChange={set("last_name")} autoComplete="family-name" />}</Field>
          <Field label="National ID" required hint="6–12 digits. Used as the unique learner key." error={errors.national_id}>{(p) => <input {...p} inputMode="numeric" className={inputCls} value={f.national_id} onChange={set("national_id")} />}</Field>
          <Field label="Date of birth" required error={errors.date_of_birth}>{(p) => <input {...p} type="date" className={inputCls} value={f.date_of_birth} onChange={set("date_of_birth")} autoComplete="bday" />}</Field>
          <Field label="Email" required error={errors.email} className="sm:col-span-2">{(p) => <input {...p} type="email" className={inputCls} value={f.email} onChange={set("email")} autoComplete="email" />}</Field>
          <Field label="Password" required hint="At least 8 characters. Stored in your browser only (demo)." error={errors.password} className="sm:col-span-2">{(p) => <input {...p} type="password" className={inputCls} value={f.password} onChange={set("password")} autoComplete="new-password" />}</Field>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
            <Link href="/login" className="text-sm font-medium text-navy-700 underline">Back to sign in</Link>
            <Button type="submit" loading={busy} icon={<UserPlus className="h-4 w-4" aria-hidden />}>Create account</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
