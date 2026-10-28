import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  FilePlus2,
  HeartHandshake,
  Info,
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { bureauById, type NotificationType, type Priority, type Status } from "../lib/types";

/* ---------------- motion presets ---------------- */

export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- count up ---------------- */

export function CountUp({ value, duration = 850 }: { value: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = ref.current ?? 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  useEffect(() => {
    ref.current = display;
  }, [display]);
  return <span className="tnum">{display.toLocaleString("en-IN")}</span>;
}

/* ---------------- pills & badges ---------------- */

const STATUS_STYLE: Record<Status, { bg: string; text: string; dot: string }> = {
  Submitted: { bg: "bg-mist", text: "text-blue-800", dot: "bg-blue-500" },
  "Under Review": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "In Progress": { bg: "bg-peach", text: "text-orange-700", dot: "bg-saffron" },
  Resolved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Escalated: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight whitespace-nowrap",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, { bg: string; text: string; dot: string }> = {
  High: { bg: "bg-peach", text: "text-orange-700", dot: "bg-saffron" },
  Medium: { bg: "bg-mist", text: "text-blue-700", dot: "bg-brand" },
  Low: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

export function PriorityPill({ priority, className }: { priority: Priority; className?: string }) {
  const s = PRIORITY_STYLE[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {priority}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500",
        className
      )}
      title="All records in this prototype are simulated and stored locally in your browser."
    >
      <Database className="h-3 w-3" />
      Demo Data
    </span>
  );
}

/* ---------------- buttons ---------------- */

type ButtonVariant = "primary" | "accent" | "outline" | "subtle" | "ghost";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-[0_6px_16px_-6px_rgb(37_99_235_/_0.55)]",
    accent: "bg-saffron text-white hover:bg-saffron-dark shadow-[0_6px_16px_-6px_rgb(249_115_22_/_0.55)]",
    outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200/80",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-sm",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- bureau icon ---------------- */

const BUREAU_ICONS = {
  approval: BadgeCheck,
  academic: BookOpen,
  grievance: LifeBuoy,
  compliance: ShieldCheck,
  welfare: HeartHandshake,
} as const;

export function BureauIcon({
  bureauId,
  size = "md",
  className,
}: {
  bureauId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const b = bureauById(bureauId);
  const Icon = BUREAUS_ICON_SAFE(b.icon);
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconDims = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl", dims, className)}
      style={{ backgroundColor: b.soft, color: b.color }}
    >
      <Icon className={iconDims} strokeWidth={2} />
    </span>
  );
}

function BUREAUS_ICON_SAFE(icon: keyof typeof BUREAU_ICONS) {
  return BUREAU_ICONS[icon] ?? LifeBuoy;
}

/* ---------------- KPI tile ---------------- */

const TONES = {
  navy: { ring: "bg-navy/[0.06]", icon: "bg-navy text-white" },
  blue: { ring: "bg-mist", icon: "bg-brand text-white" },
  orange: { ring: "bg-peach", icon: "bg-saffron text-white" },
  green: { ring: "bg-emerald-50", icon: "bg-emerald-600 text-white" },
};

export function StatTile({
  label,
  value,
  suffix,
  caption,
  icon,
  tone = "blue",
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  caption?: string;
  icon: ReactNode;
  tone?: keyof typeof TONES;
  delay?: number;
}) {
  return (
    <motion.div variants={riseVariants} className={cn("card card-hover relative overflow-hidden p-5", TONES[tone].ring)}>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="font-display mt-1.5 text-[30px] leading-8 font-bold text-navy">
            <CountUp value={value} />
            {suffix && <span className="ml-0.5 text-base font-semibold text-slate-400">{suffix}</span>}
          </p>
          {caption && <p className="mt-2 text-xs leading-relaxed text-slate-500">{caption}</p>}
        </div>
        <span
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-150",
            TONES[tone].icon
          )}
          style={{ transitionDelay: `${delay}ms` }}
        >
          {icon}
        </span>
      </div>
    </motion.div>
  );
}

/* ---------------- form field ---------------- */

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-saffron">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ---------------- progress ---------------- */

export function ProgressBar({
  value,
  color = "#2563eb",
  track = "#e2e8f0",
  className,
  height = 8,
}: {
  value: number; // 0-100
  color?: string;
  track?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div className={cn("w-full overflow-hidden rounded-full", className)} style={{ backgroundColor: track, height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ---------------- empty state ---------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-full w-full max-w-md opacity-[0.5]"
        viewBox="0 0 400 200"
        fill="none"
      >
        <circle cx="200" cy="210" r="150" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 6" />
        <circle cx="200" cy="210" r="110" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 6" />
        <circle cx="200" cy="210" r="70" stroke="#cbd5e1" strokeWidth="1.5" />
      </svg>
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-brand">
        {icon ?? <Info className="h-6 w-6" />}
      </div>
      <h3 className="font-display relative mt-4 text-base font-bold text-navy">{title}</h3>
      {body && <p className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{body}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

/* ---------------- avatar ---------------- */

export function Avatar({
  initials,
  src,
  className,
}: {
  initials: string;
  src?: string | null;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <img
        src={src}
        alt={initials}
        onError={() => setErr(true)}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full object-cover ring-2 ring-white shadow-sm",
          className
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-white ring-2 ring-white shadow-sm",
        className
      )}
    >
      {initials}
    </span>
  );
}

/* ---------------- notification icon ---------------- */

export function NotifIcon({ type, className }: { type: NotificationType; className?: string }) {
  const map: Record<NotificationType, { Icon: typeof Info; bg: string; fg: string }> = {
    new: { Icon: FilePlus2, bg: "bg-mist", fg: "text-brand" },
    escalation: { Icon: AlertTriangle, bg: "bg-red-50", fg: "text-red-600" },
    overdue: { Icon: Clock3, bg: "bg-amber-50", fg: "text-amber-600" },
    resolved: { Icon: CheckCircle2, bg: "bg-emerald-50", fg: "text-emerald-600" },
    note: { Icon: MessageSquare, bg: "bg-teal-50", fg: "text-teal-600" },
    info: { Icon: Info, bg: "bg-slate-100", fg: "text-slate-500" },
  };
  const { Icon, bg, fg } = map[type];
  return (
    <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg, fg, className)}>
      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
    </span>
  );
}

/* ---------------- recharts tooltip ---------------- */

export function ChartTip({
  active,
  payload,
  label,
  suffix = "cases",
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-[0_10px_30px_-12px_rgb(24_49_83_/_0.3)] backdrop-blur">
      {label && <p className="mb-1.5 text-[11px] font-bold tracking-wide text-slate-400 uppercase">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? "#2563eb" }} />
            <span className="text-slate-500 capitalize">{String(p.name ?? p.dataKey)}</span>
            <span className="ml-auto pl-3 font-bold text-slate-800 tnum">
              {p.value} <span className="font-medium text-slate-400">{suffix}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
