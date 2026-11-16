"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/format";
import type { Outcome } from "@/lib/store";

interface ToastItem { id: number; kind: "success" | "error"; text: string }
const Ctx = createContext<{ notify: (o: Outcome) => void; success: (t: string) => void } | null>(null);
export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside <ToastProvider>");
  return c;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = (id: number) => setItems((l) => l.filter((t) => t.id !== id));
  const push = useCallback((kind: ToastItem["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, kind, text }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 6000);
  }, []);
  const notify = useCallback((o: Outcome) => push(o.ok ? "success" : "error", o.ok ? o.message : o.error), [push]);
  const success = useCallback((t: string) => push("success", t), [push]);

  return (
    <Ctx.Provider value={{ notify, success }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 shadow-pop", t.kind === "success" ? "border-emerald-300" : "border-rose-300")}>
            {t.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden />}
            <p className="flex-1 text-sm"><span className="sr-only">{t.kind === "success" ? "Success: " : "Error: "}</span>{t.text}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss message" className="rounded p-1 text-slate-500 hover:bg-navy-50"><X className="h-4 w-4" aria-hidden /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
