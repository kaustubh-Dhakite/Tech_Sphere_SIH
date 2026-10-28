import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronsRight,
  Clock3,
  FileText,
  Activity,
  FilePlus2,
  BarChart3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { computeStats, daysSince, formatDate, isOverdue, monthSeries, statusBreakdown } from "../lib/utils";
import { bureauById, ROLE_PERSONAS, SLA_DAYS } from "../lib/types";
import {
  BureauIcon,
  ChartTip,
  DemoBadge,
  PriorityPill,
  ProgressBar,
  StatusPill,
  StatTile,
  riseVariants,
  staggerParent,
} from "../components/ui";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const SUBTITLES: Record<string, string> = {
  admin: "System-wide view of complaint flow, priorities and escalations across all bureaus and institutions.",
  officer: "Central queue monitor for AICTE Grievance bureaus. Priority and overdue items surface first.",
  institute: "Institution compliance monitor. Manage grievances lodged against your institution.",
  student: "Track your submitted grievances and follow each stage of their review and resolution.",
  complainant: "Track your submissions and follow every stage of their review across bureaus.",
};

export default function Dashboard() {
  const { role, visibleComplaints } = useApp();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Use real name from profile when logged in, otherwise fall back to demo persona
  const persona = ROLE_PERSONAS[role];
  const firstName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : persona.name.split(" ")[0];
  const isDemo = !profile;

  const stats = useMemo(() => computeStats(visibleComplaints), [visibleComplaints]);
  const series = useMemo(() => monthSeries(visibleComplaints), [visibleComplaints]);
  const statusData = useMemo(() => statusBreakdown(visibleComplaints), [visibleComplaints]);

  const recent = useMemo(
    () =>
      [...visibleComplaints]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6),
    [visibleComplaints]
  );

  const attention = useMemo(
    () =>
      visibleComplaints
        .filter((c) => c.status === "Escalated" || isOverdue(c))
        .sort((a, b) => {
          const w = (c: typeof a) => (c.status === "Escalated" ? 1e6 : 0) + daysSince(c.createdAt);
          return w(b) - w(a);
        })
        .slice(0, 5),
    [visibleComplaints]
  );

  const slaPct = stats.slaTotal ? Math.round((stats.slaMet / stats.slaTotal) * 100) : 0;

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-6">
      {/* ---------------- welcome banner ---------------- */}
      <motion.section
        variants={riseVariants}
        className="card relative overflow-hidden p-6 sm:p-8"
      >
        <svg
          className="pointer-events-none absolute top-0 right-0 h-full w-[420px] max-w-[60%]"
          viewBox="0 0 420 220"
          fill="none"
          aria-hidden
        >
          <circle cx="380" cy="20" r="150" stroke="#183153" strokeOpacity="0.07" strokeWidth="1.5" />
          <circle cx="380" cy="20" r="110" stroke="#183153" strokeOpacity="0.09" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="380" cy="20" r="70" stroke="#f97316" strokeOpacity="0.16" strokeWidth="1.5" />
          <path
            d="M120 190 L180 150 L230 168 L290 118 L340 132 L400 84"
            stroke="#f97316"
            strokeOpacity="0.22"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 7 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={250 + c * 26} cy={130 + r * 18} r="1.6" fill="#183153" fillOpacity="0.08" />
            ))
          )}
        </svg>

        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {isDemo && <DemoBadge />}
            <span className="text-xs font-medium text-slate-400">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <h1 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-navy sm:text-[32px] sm:leading-10">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">{SUBTITLES[role]}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/register">
              <motion.span
                whileTap={{ scale: 0.97 }}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-saffron px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(249_115_22_/_0.7)] transition-colors hover:bg-saffron-dark"
              >
                <FilePlus2 className="h-4 w-4" /> Register Complaint
              </motion.span>
            </Link>
            <Link to="/analytics">
              <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50">
                <BarChart3 className="h-4 w-4 text-slate-400" /> View analytics
              </span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ---------------- KPI cards ---------------- */}
      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total Complaints"
          value={stats.total}
          caption={`Across ${role === "admin" ? "all five bureaus" : role === "officer" ? "your bureau queue" : "your submissions"}`}
          icon={<FileText className="h-5 w-5" />}
          tone="navy"
        />
        <StatTile
          label="Pending Action"
          value={stats.pending}
          caption={`${stats.escalated} escalated · ${stats.overdue} overdue > ${SLA_DAYS}d`}
          icon={<Clock3 className="h-5 w-5" />}
          tone="blue"
        />
        <StatTile
          label="In Progress"
          value={stats.inProgress}
          caption="Actively being processed by desk officers"
          icon={<Activity className="h-5 w-5" />}
          tone="orange"
        />
        <StatTile
          label="Resolved"
          value={stats.resolved}
          caption={`${stats.resolutionRate}% resolution rate overall`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="green"
        />
      </motion.section>

      {/* ---------------- charts ---------------- */}
      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={riseVariants} className="card p-5 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[15px] font-bold text-navy">Complaint trend</h2>
              <p className="mt-0.5 text-xs text-slate-400">Filed vs resolved · last 8 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Filed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#e8edf3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="filed" name="Filed" stroke="#2563eb" strokeWidth={2.5} fill="url(#gFiled)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={2} fill="url(#gResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={riseVariants} className="card p-5 sm:p-6">
          <h2 className="font-display text-[15px] font-bold text-navy">Status distribution</h2>
          <p className="mt-0.5 text-xs text-slate-400">Current caseload by stage</p>
          <div className="relative mx-auto mt-2 h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={78}
                  paddingAngle={3}
                  cornerRadius={5}
                  strokeWidth={0}
                >
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-extrabold text-navy tnum">{stats.total}</span>
              <span className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Cases</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-500">{d.name}</span>
                <span className="ml-auto font-bold text-slate-700 tnum">{d.value}</span>
                <span className="w-9 text-right text-slate-400 tnum">
                  {stats.total ? Math.round((d.value / stats.total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* ---------------- tables + side panel ---------------- */}
      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={riseVariants} className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <h2 className="font-display text-[15px] font-bold text-navy">
                {role === "complainant" ? "My recent complaints" : "Recent complaints"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">Latest submissions across the caseload</p>
            </div>
            <Link
              to="/complaints"
              className="flex items-center gap-1 text-xs font-bold text-brand transition-colors hover:text-brand-dark"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] font-bold tracking-[0.06em] text-slate-400 uppercase">
                  <th className="px-5 py-2.5 font-bold">Case</th>
                  <th className="px-3 py-2.5 font-bold">Bureau</th>
                  <th className="px-3 py-2.5 font-bold">Priority</th>
                  <th className="px-3 py-2.5 font-bold">Status</th>
                  <th className="hidden px-3 py-2.5 font-bold sm:table-cell">Submitted</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-mist/40"
                  >
                    <td className="px-5 py-3.5">
                      <p className="max-w-[280px] truncate text-[13px] font-semibold text-slate-800">{c.subject}</p>
                      <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-slate-400 tnum">{c.id}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <BureauIcon bureauId={c.bureau} size="sm" />
                        <span className="hidden lg:inline">{bureauById(c.bureau).shortName}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <PriorityPill priority={c.priority} />
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="hidden px-3 py-3.5 text-xs whitespace-nowrap text-slate-500 sm:table-cell">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <ChevronsRight className="ml-auto h-4 w-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* right column */}
        <div className="space-y-4">
          <motion.div variants={riseVariants} className="card p-5">
            <h2 className="font-display text-[15px] font-bold text-navy">Resolution health</h2>
            <p className="mt-0.5 text-xs text-slate-400">Derived live from the current caseload</p>
            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-600">Resolution rate</span>
                  <span className="font-bold text-emerald-600 tnum">{stats.resolutionRate}%</span>
                </div>
                <ProgressBar value={stats.resolutionRate} color="#16a34a" />
                <p className="mt-1.5 text-[11px] text-slate-400 tnum">
                  {stats.resolved} of {stats.total} cases closed
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-600">Resolved within {SLA_DAYS}-day SLA</span>
                  <span className="font-bold text-brand tnum">{slaPct}%</span>
                </div>
                <ProgressBar value={slaPct} color="#2563eb" />
                <p className="mt-1.5 text-[11px] text-slate-400 tnum">
                  {stats.slaMet} of {stats.slaTotal} resolved cases met SLA · avg {stats.avgResolution} days
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={riseVariants} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                Needs attention
              </h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 tnum">
                {attention.length}
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {attention.length === 0 && (
                <p className="rounded-xl bg-emerald-50/70 px-3.5 py-3 text-xs leading-relaxed text-emerald-700">
                  All clear — no escalated or overdue cases in this scope right now.
                </p>
              )}
              {attention.map((c) => (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  className="group block rounded-xl border border-slate-100 p-3 transition-all hover:border-orange-200 hover:bg-peach/40"
                >
                  <p className="line-clamp-1 text-[13px] font-semibold text-slate-700 group-hover:text-navy">
                    {c.subject}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 tnum">{c.id}</span>
                    {c.status === "Escalated" ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        Escalated
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 tnum">
                        {daysSince(c.createdAt)} days open
                      </span>
                    )}
                    <PriorityPill priority={c.priority} />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}
