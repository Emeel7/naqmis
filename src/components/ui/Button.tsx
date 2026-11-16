import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const styles: Record<Variant, string> = {
  primary: "bg-navy-800 text-white hover:bg-navy-900 disabled:bg-navy-300",
  secondary: "bg-white text-navy-800 border border-navy-200 hover:bg-navy-50 disabled:text-slate-400",
  ghost: "text-navy-700 hover:bg-navy-100 disabled:text-slate-400",
  danger: "bg-rose-700 text-white hover:bg-rose-800 disabled:bg-rose-300",
  success: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-300",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: "sm" | "md"; loading?: boolean; icon?: ReactNode;
}

const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors";
const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };

/** A real link that looks like a button (avoids invalid <a><button> nesting). */
export function LinkButton({ href, variant = "primary", size = "md", icon, children, className }: { href: string; variant?: Variant; size?: "sm" | "md"; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <Link href={href} className={cn(base, sizes[size], styles[variant].replace(/disabled:\S+/g, "").trim(), className)}>{icon}{children}</Link>;
}

export default function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        styles[variant], className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
