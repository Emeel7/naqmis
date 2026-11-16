"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export interface TabDef { id: string; label: string; icon?: ReactNode; count?: number }

export default function Tabs({ tabs, value, onChange, ariaLabel }: { tabs: TabDef[]; value: string; onChange: (id: string) => void; ariaLabel: string }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="mb-5 flex gap-1 overflow-x-auto border-b border-navy-200">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id} role="tab" aria-selected={active} aria-controls={`panel-${t.id}`} id={`tab-${t.id}`}
            onClick={() => onChange(t.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium",
              active ? "border-navy-800 text-navy-900" : "border-transparent text-slate-600 hover:text-navy-800"
            )}
          >
            {t.icon}{t.label}
            {t.count !== undefined && <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-800">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const TabPanel = ({ id, children }: { id: string; children: ReactNode }) => (
  <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`}>{children}</div>
);
