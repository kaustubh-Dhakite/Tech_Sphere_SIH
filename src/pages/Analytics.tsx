import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Clock3,
  Download,
  Flag,
  Globe2,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import {
  bureauBreakdown,
  computeStats,
  exportComplaintsCSV,
  monthSeries,
  priorityBreakdown,
  statusBreakdown,
} from "../lib/utils";
import { buildStateData, computeEscalationAlerts } from "../lib/innovations";
import { BUREAUS } from "../lib/types";
import { ChartTip, ProgressBar, StatTile, riseVariants, staggerParent } from "../components/ui";

type Range = "all" | "30" | "90";

export default function Analytics() {
  const { visibleComplaints, role, pushToast } = useApp();
  const [range, setRange] = useState<Range>("all");

  const filtered = useMemo(() => {
    if (range === "all") return visibleComplaints;
    const cutoff = Date.now() - Number(range) * 86400000;
    return visibleComplaints.filter((c) => +new Date(c.createdAt) >= cutoff);
  }, [visibleComplaints, range]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const series = useMemo(() => monthSeries(filtered), [filtered]);
  const statusData = useMemo(() => statusBreakdown(filtered), [filtered]);
  const bureauData = useMemo(() => bureauBreakdown(filtered), [filtered]);
  const priorityData = useMemo(() => priorityBreakdown(filtered), [filtered]);
  const stateData = useMemo(() => buildStateData(visibleComplaints), [visibleComplaints]);
  const escalationAlerts = useMemo(() => computeEscalationAlerts(visibleComplaints), [visibleComplaints]);
  const l3Count = escalationAlerts.filter((a) => a.level === "L3").length;
  const l2Count = escalationAlerts.filter((a) => a.level === "L2").length;
  const l1Count = escalationAlerts.filter((a) => a.level === "L1").length;

  const mostActive = useMemo(
    () => [...bureauData].sort((a, b) => b.total - a.total)[0],
    [bureauData]
  );

  const resByBureau = useMemo(
    () =>
      bureauData.map((b) => ({
        ...b,
        rate: b.total ? Math.round((b.resolved / b.total) * 100) : 0,
      })),
    [bureauData]
  );

  const priorityTotal = priorityData.reduce((a, b) => a + b.value, 0) || 1;
  const scopeNote =
    role === "admin"
      ? "all bureaus"
      : role === "officer"
        ? "your bureau queue"
        : "your submissions";

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={riseVariants} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Derived live from the current demo caseload · scope: {scopeNote}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                ["all", "All time"],
                ["90", "90 days"],
                ["30", "30 days"],
              ] as Array<[Range, string]>
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setRange(v)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  range === v ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              exportComplaintsCSV(filtered);
              pushToast({
                title: "CSV exported",
                body: `${filtered.length} records downloaded — generated entirely in your browser.`,
                variant: "success",
              });
            }}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_-8px_rgb(37_99_235_/_0.7)] transition-colors hover:bg-brand-dark active:scale-[0.97]"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* insight tiles */}
      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Most active bureau"
          value={mostActive?.total ?? 0}
          caption={mostActive ? `${mostActive.full} · highest caseload` : "No data"}
          icon={<Building2 className="h-5 w-5" />}
          tone="navy"
        />
        <StatTile
          label="Avg. resolution time"
          value={Math.round(stats.avgResolution)}
          suffix="days"
          caption="Mean days from filing to closure (derived)"
          icon={<Clock3 className="h-5 w-5" />}
          tone="blue"
        />
        <StatTile
          label="Overdue cases"
          value={stats.overdue}
          caption="Open beyond the 14-day demo SLA"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="orange"
        />
        <StatTile
          label="Escalations"
          value={stats.escalated}
          caption="Sent to the regional office for intervention"
          icon={<Flag className="h-5 w-5" />}
          tone="orange"
        />
      </motion.section>

      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* monthly composed chart */}
        <motion.div variants={riseVariants} className="card p-5 sm:p-6 xl:col-span-2">
          <h2 className="font-display text-[15px] font-bold text-navy">Monthly volume</h2>
          <p className="mt-0.5 text-xs text-slate-400">Cases filed (bars) against closures (line) · last 8 months</p>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#e8edf3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgb(37 99 235 / 0.05)" }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
                />
                <Bar dataKey="filed" name="Filed" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* status donut */}
        <motion.div variants={riseVariants} className="card p-5 sm:p-6">
          <h2 className="font-display text-[15px] font-bold text-navy">Status breakdown</h2>
          <p className="mt-0.5 text-xs text-slate-400">Share of cases by current stage</p>
          <div className="relative mx-auto mt-2 h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
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
        </motion.div>
      </motion.section>

      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* bureau bars */}
        <motion.div variants={riseVariants} className="card p-5 sm:p-6 xl:col-span-1">
          <h2 className="font-display text-[15px] font-bold text-navy">Bureau-wise caseload</h2>
          <p className="mt-0.5 text-xs text-slate-400">Open vs resolved per desk</p>
          <div className="mt-3 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bureauData} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#e8edf3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={82}
                />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgb(37 99 235 / 0.05)" }} />
                <Bar dataKey="open" name="Open" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} barSize={16} />
                <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#16a34a" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* priority distribution */}
        <motion.div variants={riseVariants} className="card p-5 sm:p-6">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy">
            <TrendingUp className="h-4 w-4 text-slate-400" /> Priority mix
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">How severe the current caseload is</p>
          <div className="mt-5 space-y-4">
            {priorityData.map((p) => (
              <div key={p.name}>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-600">{p.name} priority</span>
                  <span className="font-bold text-slate-700 tnum">
                    {p.value} <span className="font-medium text-slate-400">({Math.round((p.value / priorityTotal) * 100)}%)</span>
                  </span>
                </div>
                <ProgressBar value={(p.value / priorityTotal) * 100} color={p.color} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* resolution by bureau */}
        <motion.div variants={riseVariants} className="card p-5 sm:p-6">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy">
            <BarChart3 className="h-4 w-4 text-slate-400" /> Resolution rate by bureau
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Closed cases as a share of each desk's load</p>
          <div className="mt-5 space-y-4">
            {resByBureau.map((b) => (
              <div key={b.id}>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-600">{BUREAUS.find((x) => x.id === b.id)?.shortName}</span>
                  <span className="font-bold text-slate-700 tnum">
                    {b.rate}% <span className="font-medium text-slate-400">({b.resolved}/{b.total})</span>
                  </span>
                </div>
                <ProgressBar value={b.rate} color={b.color} />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* ── GIS Regional Heatmap ── */}
      <motion.section variants={riseVariants} className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy">
              <Globe2 className="h-4 w-4 text-slate-400" /> Regional Complaint Heatmap
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">State-wise grievance density across India</p>
          </div>
        </div>

        {stateData.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No state-level data available in current filter</p>
        ) : (
          <div className="space-y-4">
            {/* Bar heatmap */}
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 min-w-0 pb-2" style={{ minHeight: 160 }}>
                {stateData.map((s) => {
                  const maxCount = stateData[0]?.count ?? 1;
                  const heightPct = Math.max(15, (s.count / maxCount) * 100);
                  const bgColor = s.escalated > 0 ? `#ef4444` :
                    s.resolutionRate >= 70 ? `#16a34a` :
                    s.resolutionRate >= 40 ? `#f97316` : `#2563eb`;
                  return (
                    <div key={s.state} className="flex flex-col items-center gap-1 min-w-[52px]" title={`${s.state}: ${s.count} cases`}>
                      <span className="text-[9px] font-bold text-slate-500 tnum">{s.count}</span>
                      <div
                        className="w-10 rounded-t-lg transition-all duration-500 cursor-pointer hover:opacity-80 relative group"
                        style={{ height: `${heightPct}px`, backgroundColor: bgColor }}
                      >
                        {/* tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-left min-w-[140px]">
                            <p className="text-[10.5px] font-bold text-navy">{s.state}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Total: {s.count} · Resolved: {s.resolved}</p>
                            <p className="text-[10px] text-slate-500">Escalated: {s.escalated} · Rate: {s.resolutionRate}%</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 text-center">{s.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
              {[
                { color: "#ef4444", label: "Has Escalations" },
                { color: "#2563eb", label: "Low Resolution (<40%)" },
                { color: "#f97316", label: "Medium (40–70%)" },
                { color: "#16a34a", label: "High Resolution (>70%)" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[10.5px] text-slate-600">
                  <span className="h-3 w-3 rounded" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>

            {/* State breakdown table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["State", "Code", "Total", "Resolved", "Escalated", "Resolution Rate"].map((h) => (
                      <th key={h} className="pb-2 text-left font-bold text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stateData.map((s) => (
                    <tr key={s.state} className="hover:bg-slate-50">
                      <td className="py-2 font-semibold text-slate-700">{s.state}</td>
                      <td className="py-2 font-mono text-slate-500">{s.code}</td>
                      <td className="py-2 font-bold text-navy tnum">{s.count}</td>
                      <td className="py-2 text-emerald-600 font-semibold tnum">{s.resolved}</td>
                      <td className="py-2 text-red-600 font-semibold tnum">{s.escalated}</td>
                      <td className="py-2">
                        <span className={`font-bold tnum ${
                          s.resolutionRate >= 70 ? "text-emerald-600" :
                          s.resolutionRate >= 40 ? "text-amber-600" : "text-red-600"
                        }`}>{s.resolutionRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.section>

      {/* ── Escalation Matrix ── */}
      <motion.section variants={riseVariants} className="card p-5 sm:p-6">
        <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy mb-1">
          <Zap className="h-4 w-4 text-slate-400" /> Automated Escalation Matrix
        </h2>
        <p className="text-xs text-slate-400 mb-4">L1–L3 case escalation alerts based on SLA breach severity</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { level: "L1", label: "Desk Officer Action", count: l1Count, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            { level: "L2", label: "Bureau Head Review", count: l2Count, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
            { level: "L3", label: "Secretary Intervention", count: l3Count, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
          ].map((e) => (
            <div key={e.level} className={`rounded-xl border p-4 text-center ${e.bg} ${e.border}`}>
              <p className={`font-display text-2xl font-extrabold tnum ${e.color}`}>{e.count}</p>
              <p className={`text-[10.5px] font-bold mt-1 ${e.color}`}>{e.level}</p>
              <p className="text-[9.5px] text-slate-500 mt-0.5">{e.label}</p>
            </div>
          ))}
        </div>

        {escalationAlerts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">✓ All cases within SLA — no escalations required</p>
        ) : (
          <div className="space-y-2">
            {escalationAlerts.slice(0, 8).map((alert) => (
              <div
                key={alert.complaintId}
                className={`flex items-start gap-3 rounded-xl border p-3 text-xs ${
                  alert.level === "L3" ? "border-red-200 bg-red-50" :
                  alert.level === "L2" ? "border-orange-200 bg-orange-50" :
                  "border-amber-200 bg-amber-50"
                }`}
              >
                  <span className={`font-bold rounded-full px-2 py-0.5 text-[10px] shrink-0 ${
                    alert.level === "L3" ? "bg-red-200 text-red-800" :
                    alert.level === "L2" ? "bg-orange-200 text-orange-800" :
                    "bg-amber-200 text-amber-800"
                  }`}>{alert.level}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10.5px] text-slate-600">{alert.complaintId}</p>
                    <p className="font-semibold text-slate-700">{alert.reason}</p>
                    <p className="text-slate-500 mt-0.5">{alert.suggestedAction}</p>
                  </div>
                  <span className={`shrink-0 font-bold tnum text-[10.5px] ${
                    alert.level === "L3" ? "text-red-600" : alert.level === "L2" ? "text-orange-600" : "text-amber-600"
                  }`}>
                    +{alert.daysOverdue}d
                  </span>
                </div>
            ))}
            {escalationAlerts.length > 8 && (
              <p className="text-center text-xs text-slate-400 pt-1">
                + {escalationAlerts.length - 8} more escalation alerts
              </p>
            )}
          </div>
        )}

        {/* Predictive note */}
        <div className="mt-4 rounded-xl border border-brand/20 bg-mist/50 p-3">
          <p className="text-[10.5px] font-bold text-brand mb-1">📊 Predictive Insight</p>
          <p className="text-[10.5px] text-slate-600">
            Based on historical patterns, fee-related complaints spike 60% in August (admissions season) and
            examination grievances peak in December–January. Proactive deployment of inspection teams recommended.
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}
