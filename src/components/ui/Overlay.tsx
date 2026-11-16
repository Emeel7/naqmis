"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/** Accessible modal / right-hand drawer: Esc closes, focus is trapped and restored, body scroll is locked. */
export default function Overlay({ open, onClose, title, variant = "modal", size = "md", children, footer }: {
  open: boolean; onClose: () => void; title: string; variant?: "modal" | "drawer"; size?: "md" | "lg" | "xl"; children: ReactNode; footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; previous?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  const width = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div className={cn("fixed inset-0 z-50 flex", variant === "drawer" ? "justify-end" : "items-center justify-center p-4")}>
      <div className="no-print absolute inset-0 bg-navy-950/50" onClick={onClose} aria-hidden />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={cn(
          "relative flex w-full flex-col bg-white shadow-pop focus:outline-none",
          variant === "drawer" ? "h-full max-w-xl" : cn("max-h-[92vh] rounded-2xl", width)
        )}
      >
        <div className="no-print flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-500 hover:bg-navy-50">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="no-print flex flex-wrap justify-end gap-2 border-t border-navy-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
