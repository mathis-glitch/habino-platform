import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-slate-100 text-slate-700",
  success:  "bg-emerald-50 text-emerald-700",
  warning:  "bg-amber-50 text-amber-700",
  danger:   "bg-red-50 text-red-600",
  info:     "bg-blue-50 text-blue-700",
  outline:  "border border-slate-300 text-slate-600 bg-transparent",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
