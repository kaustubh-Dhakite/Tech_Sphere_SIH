import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  BUREAUS,
  DEMO_COMPLAINANT_EMAIL,
  OFFICER_BUREAU,
  SLA_DAYS,
  bureauById,
  type Complaint,
  type Role,
  type Status,
} from "./types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const STORAGE_VERSION = "casebridge-demo-v1";

/* ---------------- dates ---------------- */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)}, ${d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo / 12)} yr ago`;
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

/* ---------------- case helpers ---------------- */

export function nextCaseId(list: Complaint[]): string {
  const max = list.reduce((acc, c) => {
    const m = c.id.match(/(\d{4})$/);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 1040);
  return `CMP-${new Date().getFullYear()}-${max + 1}`;
}

export const isResolved = (c: Complaint) => c.status === "Resolved";

export function isOverdue(c: Complaint): boolean {
  return !isResolved(c) && daysSince(c.createdAt) > SLA_DAYS;
}

export function resolvedDate(c: Complaint): string | undefined {
  return c.timeline.find((t) => t.stage === "Resolved")?.date;
}

export function resolutionDays(c: Complaint): number | undefined {
  const rd = resolvedDate(c);
  if (!rd) return undefined;
  return Math.max(1, Math.round((new Date(rd).getTime() - new Date(c.createdAt).getTime()) / 86400000));
}

/** Cases visible to a role. Admin = all, Officer = own bureau, Complainant = own submissions. */
export function scopeComplaints(list: Complaint[], role: Role, userEmail?: string): Complaint[] {
  if (role === "admin") return list;
  if (role === "officer") return list.filter((c) => c.bureau === OFFICER_BUREAU);
  return list.filter((c) => 
    (userEmail && c.email.toLowerCase() === userEmail.toLowerCase()) || 
    c.email === DEMO_COMPLAINANT_EMAIL
  );
}

export interface Stats {
  total: number;
  pending: number; // submitted + under review + escalated
  inProgress: number;
  resolved: number;
  escalated: number;
  overdue: number;
  resolutionRate: number; // 0-100
  avgResolution: number; // days
  slaMet: number;
  slaTotal: number;
}

export function computeStats(list: Complaint[]): Stats {
  const resolved = list.filter((c) => c.status === "Resolved");
  const escalated = list.filter((c) => c.status === "Escalated");
  const pending = list.filter(
    (c) => c.status === "Submitted" || c.status === "Under Review" || c.status === "Escalated"
  );
  const inProgress = list.filter((c) => c.status === "In Progress");
  const overdue = list.filter(isOverdue);
  const times = resolved.map(resolutionDays).filter((n): n is number => n !== undefined);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const slaMet = times.filter((n) => n <= SLA_DAYS).length;
  return {
    total: list.length,
    pending: pending.length,
    inProgress: inProgress.length,
    resolved: resolved.length,
    escalated: escalated.length,
    overdue: overdue.length,
    resolutionRate: list.length ? Math.round((resolved.length / list.length) * 100) : 0,
    avgResolution: Math.round(avg * 10) / 10,
    slaMet,
    slaTotal: resolved.length,
  };
}

/* ---------------- chart aggregations ---------------- */

export interface MonthPoint {
  label: string;
  filed: number;
  resolved: number;
}

export function monthSeries(list: Complaint[], months = 8): MonthPoint[] {
  const now = new Date();
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      filed: 0,
      resolved: 0,
    });
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime();
  for (const c of list) {
    const idx = monthIndex(new Date(c.createdAt), now);
    if (new Date(c.createdAt).getTime() >= start && idx >= 0 && idx < months) out[idx].filed++;
    const rd = resolvedDate(c);
    if (rd) {
      const ri = monthIndex(new Date(rd), now);
      if (new Date(rd).getTime() >= start && ri >= 0 && ri < months) out[ri].resolved++;
    }
  }
  return out;
}

function monthIndex(d: Date, now: Date): number {
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + 7;
}

export const STATUS_COLORS: Record<Status, string> = {
  Submitted: "#2563eb",
  "Under Review": "#f59e0b",
  "In Progress": "#f97316",
  Resolved: "#16a34a",
  Escalated: "#dc2626",
};

export function statusBreakdown(list: Complaint[]) {
  return (Object.keys(STATUS_COLORS) as Status[])
    .map((s) => ({ name: s, value: list.filter((c) => c.status === s).length, color: STATUS_COLORS[s] }))
    .filter((d) => d.value > 0);
}

export function bureauBreakdown(list: Complaint[]) {
  return BUREAUS.map((b) => ({
    id: b.id,
    name: b.shortName,
    full: b.name,
    color: b.color,
    open: list.filter((c) => c.bureau === b.id && c.status !== "Resolved").length,
    resolved: list.filter((c) => c.bureau === b.id && c.status === "Resolved").length,
    total: list.filter((c) => c.bureau === b.id).length,
  }));
}

export function priorityBreakdown(list: Complaint[]) {
  const colors: Record<string, string> = { Low: "#94a3b8", Medium: "#2563eb", High: "#f97316" };
  return (["High", "Medium", "Low"] as const).map((p) => ({
    name: p,
    value: list.filter((c) => c.priority === p).length,
    color: colors[p],
  }));
}

/* ---------------- CSV export ---------------- */

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function exportComplaintsCSV(list: Complaint[]): void {
  const header = [
    "Case ID",
    "Subject",
    "Institution",
    "Category",
    "Bureau",
    "Priority",
    "Status",
    "Complainant",
    "Email",
    "Submitted On",
    "Last Updated",
  ];
  const rows = list.map((c) =>
    [
      c.id,
      c.subject,
      c.institution,
      c.category,
      bureauById(c.bureau).name,
      c.priority,
      c.status,
      c.complainantName,
      c.email,
      formatDate(c.createdAt),
      formatDate(c.updatedAt),
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casebridge-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
