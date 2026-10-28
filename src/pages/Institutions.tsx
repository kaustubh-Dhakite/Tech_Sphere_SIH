import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  MapPin,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { buildInstitutionProfiles, type InstitutionProfile } from "../lib/innovations";
import { cn } from "../lib/utils";
import {
  EmptyState,
  ProgressBar,
  riseVariants,
  staggerParent,
} from "../components/ui";

const RISK_CONFIG = {
  Low: { icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Low Risk" },
  Medium: { icon: Shield, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Moderate Risk" },
  High: { icon: ShieldAlert, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "High Risk" },
  Critical: { icon: ShieldX, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Critical" },
};

export default function Institutions() {
  const { complaints } = useApp();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | InstitutionProfile["riskLevel"]>("all");
  const [sort, setSort] = useState<"risk" | "cases" | "name">("risk");

  const profiles = useMemo(() => buildInstitutionProfiles(complaints), [complaints]);

  const filtered = useMemo(() => {
    let list = profiles;
    if (riskFilter !== "all") list = list.filter((p) => p.riskLevel === riskFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.aicteId.toLowerCase().includes(q) || p.state.toLowerCase().includes(q)
      );
    }
    if (sort === "risk") return [...list].sort((a, b) => b.riskScore - a.riskScore);
    if (sort === "cases") return [...list].sort((a, b) => b.totalCases - a.totalCases);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles, search, riskFilter, sort]);

  const criticalCount = profiles.filter((p) => p.riskLevel === "Critical").length;
  const highCount = profiles.filter((p) => p.riskLevel === "High").length;

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      {/* header */}
      <motion.div variants={riseVariants} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">
            Institution Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            360° compliance profiles · AICTE Permanent ID · Institution Risk Index
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">
              <ShieldX className="h-3.5 w-3.5" /> {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-700">
              <ShieldAlert className="h-3.5 w-3.5" /> {highCount} High Risk
            </span>
          )}
        </div>
      </motion.div>

      {/* filters */}
      <motion.div variants={riseVariants} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input has-left-icon pl-11"
            placeholder="Search by name, AICTE ID or state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1">
          {(["all", "Critical", "High", "Medium", "Low"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                riskFilter === r ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="input w-auto cursor-pointer text-xs"
        >
          <option value="risk">Sort: Risk Score</option>
          <option value="cases">Sort: Case Count</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </motion.div>

      {/* count */}
      <motion.p variants={riseVariants} className="text-xs text-slate-400">
        Showing {filtered.length} of {profiles.length} institutions
      </motion.p>

      {/* cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No institutions found"
          body="Try adjusting your search or filter criteria."
        />
      ) : (
        <motion.div variants={staggerParent} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((profile) => (
            <InstitutionCard key={profile.name} profile={profile} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function InstitutionCard({ profile }: { profile: InstitutionProfile }) {
  const navigate = useNavigate();
  const risk = RISK_CONFIG[profile.riskLevel];
  const RiskIcon = risk.icon;
  const resolutionRate = profile.totalCases > 0
    ? Math.round((profile.resolvedCases / profile.totalCases) * 100)
    : 0;

  return (
    <motion.div
      variants={riseVariants}
      className="card card-hover p-5 flex flex-col gap-4 cursor-pointer"
      onClick={() => navigate(`/institutions/${encodeURIComponent(profile.name)}`)}
    >
      {/* top */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold border", risk.bg, risk.text, risk.border)}>
              <RiskIcon className="h-3 w-3" />
              {risk.label}
            </span>
            {profile.escalatedCases > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-bold text-red-600">
                <AlertTriangle className="h-3 w-3" /> {profile.escalatedCases} Escalated
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-navy leading-snug line-clamp-2">{profile.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-[10.5px] text-slate-400">
            <span className="font-mono">{profile.aicteId}</span>
            <span>·</span>
            <MapPin className="h-3 w-3" />
            <span>{profile.city}, {profile.state}</span>
          </div>
        </div>
        {/* Risk donut score */}
        <div className="shrink-0 flex flex-col items-center">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2", risk.border)}>
            <span className={cn("font-display text-base font-extrabold", risk.text)}>{profile.riskScore}</span>
          </div>
          <p className="mt-0.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Risk</p>
        </div>
      </div>

      {/* approval status */}
      {profile.riskScore >= 45 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
          {profile.approvalStatus}
        </div>
      )}

      {/* metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total", value: profile.totalCases, color: "text-navy" },
          { label: "Open", value: profile.openCases, color: "text-orange-600" },
          { label: "Overdue", value: profile.overdueCount, color: "text-red-600" },
        ].map((m) => (
          <div key={m.label} className="text-center rounded-lg bg-slate-50 py-2">
            <p className={cn("font-display text-lg font-extrabold tnum", m.color)}>{m.value}</p>
            <p className="text-[10px] font-medium text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>

      {/* resolution bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10.5px] text-slate-500">Resolution Rate</span>
          <span className="text-[10.5px] font-bold text-slate-600 tnum">{resolutionRate}%</span>
        </div>
        <ProgressBar
          value={resolutionRate}
          color={resolutionRate >= 70 ? "#16a34a" : resolutionRate >= 40 ? "#f97316" : "#ef4444"}
          height={6}
        />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="text-[10.5px] text-slate-400">{profile.type}</span>
        <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-brand">
          View Profile <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}
