import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Tag,
  TrendingDown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { buildInstitutionProfiles } from "../lib/innovations";
import { cn, formatDate, daysSince } from "../lib/utils";
import { bureauById, SLA_DAYS } from "../lib/types";
import {
  BureauIcon,
  Button,
  EmptyState,
  PriorityPill,
  ProgressBar,
  StatusPill,
  riseVariants,
  staggerParent,
} from "../components/ui";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const RISK_CONFIG = {
  Low: { icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Low Risk" },
  Medium: { icon: Shield, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Moderate Risk" },
  High: { icon: ShieldAlert, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "High Risk" },
  Critical: { icon: ShieldX, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Critical" },
};

export default function InstitutionProfile() {
  const { name } = useParams<{ name: string }>();
  const { complaints } = useApp();
  const decodedName = decodeURIComponent(name ?? "");

  const profiles = useMemo(() => buildInstitutionProfiles(complaints), [complaints]);
  const profile = profiles.find((p) => p.name === decodedName);

  if (!profile) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
        title="Institution not found"
        body="This institution doesn't exist in the current database."
        action={
          <Link to="/institutions">
            <Button>Back to Directory</Button>
          </Link>
        }
      />
    );
  }

  const risk = RISK_CONFIG[profile.riskLevel];
  const RiskIcon = risk.icon;
  const resolutionRate = profile.totalCases > 0
    ? Math.round((profile.resolvedCases / profile.totalCases) * 100)
    : 0;

  const statusData = [
    { name: "Submitted", value: profile.complaints.filter((c) => c.status === "Submitted").length, color: "#2563eb" },
    { name: "Under Review", value: profile.complaints.filter((c) => c.status === "Under Review").length, color: "#f59e0b" },
    { name: "In Progress", value: profile.complaints.filter((c) => c.status === "In Progress").length, color: "#f97316" },
    { name: "Resolved", value: profile.complaints.filter((c) => c.status === "Resolved").length, color: "#16a34a" },
    { name: "Escalated", value: profile.complaints.filter((c) => c.status === "Escalated").length, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const bureauData = Object.entries(profile.bureauBreakdown).map(([id, count]) => ({
    name: bureauById(id).shortName,
    value: count,
    color: bureauById(id).color,
  }));

  const categoryData = Object.entries(profile.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      {/* breadcrumb */}
      <motion.div variants={riseVariants}>
        <Link to="/institutions" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Institution Directory
        </Link>
      </motion.div>

      {/* header card */}
      <motion.div variants={riseVariants} className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy text-white">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold text-navy leading-tight">{profile.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 rounded px-1.5 py-0.5 font-bold text-slate-600">{profile.aicteId}</span>
                <span>·</span>
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.city}, {profile.state}</span>
                <span>·</span>
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.type}</span>
              </div>
            </div>
          </div>

          {/* Risk badge */}
          <div className={cn("rounded-2xl border p-4 text-center min-w-[120px]", risk.bg, risk.border)}>
            <RiskIcon className={cn("h-6 w-6 mx-auto mb-1", risk.text)} />
            <p className={cn("font-display text-3xl font-extrabold", risk.text)}>{profile.riskScore}</p>
            <p className={cn("text-xs font-bold", risk.text)}>{risk.label}</p>
          </div>
        </div>

        {/* Approval status */}
        {profile.riskScore >= 45 && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">AICTE Approval Status</p>
              <p className="text-xs text-amber-700">{profile.approvalStatus}</p>
            </div>
          </div>
        )}

        {/* Metrics row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Cases", value: profile.totalCases, icon: FileText, color: "text-navy" },
            { label: "Open Cases", value: profile.openCases, icon: Clock3, color: "text-orange-600" },
            { label: "Escalated", value: profile.escalatedCases, icon: AlertTriangle, color: "text-red-600" },
            { label: "Overdue", value: profile.overdueCount, icon: TrendingDown, color: "text-red-500" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl bg-slate-50 p-3">
                <Icon className={cn("h-4 w-4 mb-1", m.color)} />
                <p className={cn("font-display text-2xl font-extrabold tnum", m.color)}>{m.value}</p>
                <p className="text-[10.5px] font-medium text-slate-500">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Resolution rate */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Resolution Rate</span>
            <span className="text-xs font-bold text-slate-700 tnum">{resolutionRate}% ({profile.resolvedCases}/{profile.totalCases})</span>
          </div>
          <ProgressBar
            value={resolutionRate}
            color={resolutionRate >= 70 ? "#16a34a" : resolutionRate >= 40 ? "#f97316" : "#ef4444"}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ── left: analytics ── */}
        <motion.div variants={staggerParent} className="space-y-5 xl:col-span-2">
          {/* status + bureau charts */}
          <motion.div variants={riseVariants} className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <h3 className="font-display text-sm font-bold text-navy mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {statusData.map((s) => (
                  <span key={s.name} className="flex items-center gap-1 text-[10.5px] text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-bold text-navy mb-4">Bureau Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bureauData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {bureauData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {bureauData.map((b) => (
                  <span key={b.name} className="flex items-center gap-1 text-[10.5px] text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.name} ({b.value})
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top categories */}
          <motion.div variants={riseVariants} className="card p-5">
            <h3 className="font-display text-sm font-bold text-navy mb-4">Top Grievance Categories</h3>
            <div className="space-y-3">
              {categoryData.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-slate-600 font-medium">{cat}</span>
                    <span className="font-bold text-slate-700 tnum">{count}</span>
                  </div>
                  <ProgressBar
                    value={(count / profile.totalCases) * 100}
                    color="#2563eb"
                    height={6}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* All cases */}
          <motion.div variants={riseVariants} className="card p-5">
            <h3 className="font-display text-sm font-bold text-navy mb-4">All Complaints ({profile.complaints.length})</h3>
            <div className="space-y-2">
              {profile.complaints.map((c) => {
                const days = daysSince(c.createdAt);
                const isOverdue = c.status !== "Resolved" && days > SLA_DAYS;
                return (
                  <Link
                    key={c.id}
                    to={`/complaints/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-cream p-3 hover:border-slate-200 hover:bg-white transition-colors"
                  >
                    <BureauIcon bureauId={c.bureau} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-navy truncate">{c.subject}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                        <StatusPill status={c.status} />
                        <PriorityPill priority={c.priority} />
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600">{days - SLA_DAYS}d overdue</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* ── right rail ── */}
        <motion.div variants={staggerParent} className="space-y-5">
          {/* risk factor breakdown */}
          <motion.div variants={riseVariants} className="card p-5">
            <h3 className="font-display text-sm font-bold text-navy mb-4">Risk Factor Analysis</h3>
            <div className="space-y-3">
              {[
                { label: "Escalated Cases", value: Math.min(40, profile.escalatedCases * 15), max: 40, color: "#ef4444" },
                { label: "Overdue Cases", value: Math.min(25, profile.overdueCount * 10), max: 25, color: "#f97316" },
                { label: "Open Cases", value: Math.min(20, profile.openCases * 4), max: 20, color: "#f59e0b" },
                { label: "Case Volume", value: Math.min(15, Math.round(profile.totalCases * 1.5)), max: 15, color: "#2563eb" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-slate-600">{f.label}</span>
                    <span className="font-bold tnum" style={{ color: f.color }}>{f.value}/{f.max}</span>
                  </div>
                  <ProgressBar value={(f.value / f.max) * 100} color={f.color} height={5} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* EOA blocker */}
          {profile.riskScore >= 70 && (
            <motion.div variants={riseVariants} className="card border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldX className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">EOA Recommendation</h3>
                  <p className="mt-1.5 text-xs text-red-700 leading-relaxed">
                    This institution has a Critical risk score ({profile.riskScore}/100). Recommend blocking
                    Extension of Approval (EOA) until all escalated cases are resolved.
                  </p>
                  <p className="mt-2 text-[10.5px] font-bold text-red-600">
                    {profile.escalatedCases} escalated · {profile.overdueCount} overdue SLA
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info card */}
          <motion.div variants={riseVariants} className="card p-5">
            <h3 className="font-display text-sm font-bold text-navy mb-3">Institution Details</h3>
            <div className="space-y-2.5">
              {[
                { label: "AICTE ID", value: profile.aicteId },
                { label: "Type", value: profile.type },
                { label: "State", value: profile.state },
                { label: "City", value: profile.city },
                { label: "Last Activity", value: formatDate(profile.lastActivity) },
              ].map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{d.label}</span>
                  <span className="font-semibold text-slate-700">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
