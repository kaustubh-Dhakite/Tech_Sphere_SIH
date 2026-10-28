import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Clock3,
  Download,
  Flag,
  TrendingUp,
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
    </motion.div>
  );
}
