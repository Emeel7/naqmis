"use client";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, Building2, GraduationCap, Landmark, LayoutDashboard, LogOut, Menu, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import type { Persona } from "@/lib/types";
import { useDemo } from "@/lib/store";
import { homeFor, currentLearner, currentQab } from "@/lib/selectors";
import { cn, fullName, label } from "@/lib/format";
import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";

interface NavItem { href: string; label: string; icon: ComponentType<{ className?: string }> }
const NAV: Record<Persona, NavItem[]> = {
  learner: [
    { href: "/learner", label: "Dashboard", icon: LayoutDashboard },
    { href: "/learner/qualifications", label: "Find qualifications", icon: Search },
    { href: "/learner/enrolments", label: "My enrolments", icon: BookOpen },
  ],
  qab: [
    { href: "/qab", label: "Institution & learners", icon: Building2 },
    { href: "/qab/qualifications", label: "Qualifications", icon: ShieldCheck },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ],
  knqa: [
    { href: "/knqa", label: "Oversight dashboard", icon: Landmark },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ],
};
const PORTAL: Record<Persona, string> = { learner: "Learner portal", qab: "Awarding body portal", knqa: "KNQA staff portal" };

export default function AppShell({ allow, children }: { allow: Persona[]; children: ReactNode }) {
  const { ready, persona, user, session, db, logout, resetDemo } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const allowed = !!persona && allow.includes(persona);

  useEffect(() => {
    if (!ready) return;
    if (!persona) router.replace("/login");
    else if (!allowed) router.replace(homeFor(persona));
  }, [ready, persona, allowed, router]);
  useEffect(() => setMenuOpen(false), [pathname]);

  if (!ready || !persona || !allowed) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600" role="status">Loading NAQMIS…</div>;
  }

  const learner = currentLearner(db, session);
  const qab = currentQab(db, session);
  const displayName = learner ? fullName(learner) : user ? `${user.first_name} ${user.last_name}` : "";
  const roleLabel = learner ? "Learner (demo account)" : user ? label(user.role) : "";
  const items = NAV[persona];

  const nav = (
    <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-4">
      {items.map((n) => {
        const active = pathname === n.href;
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-white/15 text-white" : "text-navy-100 hover:bg-white/10 hover:text-white")}>
            <n.icon className="h-4 w-4 shrink-0" aria-hidden />{n.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="rounded-lg bg-white/10 p-2"><GraduationCap className="h-5 w-5" aria-hidden /></span>
        <div><p className="text-lg font-semibold leading-none">NAQMIS</p><p className="mt-1 text-xs text-navy-200">{PORTAL[persona]}</p></div>
      </div>
      {nav}
      <div className="space-y-1 border-t border-white/10 p-3">
        <button onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-100 hover:bg-white/10 hover:text-white">
          <RotateCcw className="h-4 w-4" aria-hidden />Reset demo data
        </button>
        <button onClick={() => { logout(); router.replace("/login"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-100 hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden />Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to main content</a>
      <aside className="no-print hidden w-64 shrink-0 lg:block"><div className="fixed inset-y-0 w-64">{sidebar}</div></aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="relative h-full w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-navy-800 hover:bg-navy-50 lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{roleLabel}{qab ? ` · ${qab.name}` : ""}</p>
          </div>
          {qab && <StatusBadge status={qab.accreditation_status} className="hidden sm:inline-flex" />}
          <span className="hidden rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-600 ring-1 ring-inset ring-gold-100 md:inline">Demonstration prototype</span>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <Overlay open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?"
        footer={<>
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { resetDemo(); setConfirmReset(false); toast.success("Demo data restored to the original sample set."); router.replace("/login"); }}>Reset and log out</Button>
        </>}>
        <p className="text-sm text-slate-700">This erases everything you changed in this browser (new qualifications, enrolments, reviews, sign-ups) and restores the original sample data. You will be logged out.</p>
      </Overlay>
    </div>
  );
}
