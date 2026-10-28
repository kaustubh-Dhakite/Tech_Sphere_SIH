import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileText,
  GitMerge,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unlink2,
  Users,
  Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { detectOverlaps, type OverlapMatch } from "../lib/innovations";
import { cn } from "../lib/utils";
import {
  BureauIcon,
  Button,
  EmptyState,
  StatusPill,
  riseVariants,
  staggerParent,
} from "../components/ui";

const MATCH_TYPE_LABELS: Record<OverlapMatch["matchType"], { label: string; color: string; bg: string }> = {
  exact_institution: { label: "Same Institution", color: "text-blue-700", bg: "bg-blue-50" },
  subject_similarity: { label: "Subject Similarity", color: "text-purple-700", bg: "bg-purple-50" },
  mass_grievance: { label: "Mass Grievance", color: "text-red-700", bg: "bg-red-50" },
  institution_category: { label: "Institution + Category", color: "text-orange-700", bg: "bg-orange-50" },
};

interface ReviewedPair {
  key: string;
  action: "confirmed" | "dismissed" | "linked";
}

export default function Overlaps() {
  const { complaints } = useApp();
  const navigate = useNavigate();
  const [reviewed, setReviewed] = useState<ReviewedPair[]>([]);
  const [filter, setFilter] = useState<"all" | OverlapMatch["matchType"] | "high">("all");
  const [expandedPair, setExpandedPair] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const overlaps = useMemo(() => detectOverlaps(complaints), [complaints]);

  const reviewedKeys = useMemo(() => new Set(reviewed.map((r) => r.key)), [reviewed]);

  const filtered = useMemo(() => {
    return overlaps.filter((o) => {
      const key = [o.caseA, o.caseB].sort().join("|");
      if (reviewedKeys.has(key)) return false;
      if (filter === "high") return o.score >= 70;
      if (filter === "all") return true;
      return o.matchType === filter;
    });
  }, [overlaps, filter, reviewedKeys]);

  const massGrievances = useMemo(() => {
    const instCat = new Map<string, string[]>();
    for (const o of overlaps) {
      if (o.matchType === "mass_grievance") {
        const key = o.institution;
        const existing = instCat.get(key) ?? [];
        if (!existing.includes(o.caseA)) existing.push(o.caseA);
        if (!existing.includes(o.caseB)) existing.push(o.caseB);
        instCat.set(key, existing);
      }
    }
    return instCat;
  }, [overlaps]);

  const doAction = (caseA: string, caseB: string, action: ReviewedPair["action"]) => {
    const key = [caseA, caseB].sort().join("|");
    setReviewed((prev) => [...prev, { key, action }]);
    setExpandedPair(null);
  };

  const copyId = async (id: string) => {
    await navigator.clipboard.writeText(id).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const confirmedCount = reviewed.filter((r) => r.action === "confirmed").length;
  const dismissedCount = reviewed.filter((r) => r.action === "dismissed").length;

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      {/* ── header ── */}
      <motion.div variants={riseVariants} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">
              Overlap Detection
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-bold text-saffron">
              <Zap className="h-3 w-3" /> AI Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Cross-bureau duplicate and mass grievance detection · {overlaps.length} potential overlaps found
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {massGrievances.size > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              <Users className="h-3.5 w-3.5" />
              {massGrievances.size} Mass Grievance Cluster{massGrievances.size > 1 ? "s" : ""} Detected
            </span>
          )}
        </div>
      </motion.div>

      {/* ── stats row ── */}
      <motion.div variants={riseVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Overlaps", value: overlaps.length, color: "text-navy", bg: "bg-mist" },
          { label: "High Risk (≥70%)", value: overlaps.filter((o) => o.score >= 70).length, color: "text-red-700", bg: "bg-red-50" },
          { label: "Confirmed Linked", value: confirmedCount, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Dismissed", value: dismissedCount, color: "text-slate-600", bg: "bg-slate-100" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl p-4", s.bg)}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={cn("font-display mt-1 text-2xl font-bold tnum", s.color)}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* ── mass grievance banners ── */}
      {massGrievances.size > 0 && (
        <motion.div variants={riseVariants} className="space-y-2">
          {Array.from(massGrievances.entries()).map(([inst, ids]) => (
            <div key={inst} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-red-800 truncate">
                    Mass Grievance Cluster: {inst}
                  </p>
                  <p className="text-xs text-red-600">
                    {ids.length} related cases · Consider creating a Master Case for consolidated resolution
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/institutions`)}
                className="shrink-0 border-red-200 text-red-700 hover:bg-red-100"
              >
                <Building2 className="h-3.5 w-3.5" /> View Institution
              </Button>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── filter tabs ── */}
      <motion.div variants={riseVariants} className="flex flex-wrap items-center gap-2">
        {([
          ["all", "All Overlaps"],
          ["high", "High Risk"],
          ["mass_grievance", "Mass Grievances"],
          ["exact_institution", "Same Institution"],
          ["subject_similarity", "Subject Similarity"],
          ["institution_category", "Inst + Category"],
        ] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cn(
              "cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              filter === v
                ? "bg-navy text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} pending review
        </span>
      </motion.div>

      {/* ── overlap cards ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="No overlaps in this filter"
          body="All detected overlaps have been reviewed, or no cases match this filter."
        />
      ) : (
        <motion.div variants={staggerParent} className="space-y-3">
          {filtered.map((overlap) => {
            const pairKey = [overlap.caseA, overlap.caseB].sort().join("|");
            const isExpanded = expandedPair === pairKey;
            const cA = complaints.find((c) => c.id === overlap.caseA);
            const cB = complaints.find((c) => c.id === overlap.caseB);
            const matchStyle = MATCH_TYPE_LABELS[overlap.matchType];

            if (!cA || !cB) return null;

            return (
              <motion.div
                key={pairKey}
                variants={riseVariants}
                className={cn(
                  "card overflow-hidden transition-shadow duration-200",
                  isExpanded && "shadow-lift"
                )}
              >
                {/* Score indicator bar */}
                <div
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(to right, ${
                      overlap.score >= 70 ? "#ef4444" : overlap.score >= 55 ? "#f97316" : "#2563eb"
                    } ${overlap.score}%, #e2e8f0 ${overlap.score}%)`,
                  }}
                />

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Match badge + reason */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", matchStyle.bg, matchStyle.color)}>
                        <GitMerge className="h-3 w-3" />
                        {matchStyle.label}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                        overlap.score >= 70 ? "bg-red-50 text-red-700" :
                        overlap.score >= 55 ? "bg-orange-50 text-orange-700" :
                        "bg-blue-50 text-blue-700"
                      )}>
                        {overlap.score}% match
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-xs">{overlap.reason}</span>
                    </div>
                    <button
                      onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                      className="cursor-pointer text-xs font-semibold text-brand hover:underline shrink-0"
                    >
                      {isExpanded ? "Collapse" : "Review Details"}
                    </button>
                  </div>

                  {/* Case pair summary */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[cA, cB].map((c) => (
                      <div key={c.id} className="flex gap-3 rounded-xl border border-slate-100 bg-cream p-3">
                        <BureauIcon bureauId={c.bureau} size="sm" className="shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => copyId(c.id)}
                              className="cursor-pointer font-mono text-[10.5px] font-bold text-slate-500 hover:text-navy"
                            >
                              {c.id}
                              {copied === c.id ? <Check className="ml-1 inline h-3 w-3 text-emerald-500" /> : <Copy className="ml-1 inline h-3 w-3" />}
                            </button>
                            <StatusPill status={c.status} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{c.subject}</p>
                          <p className="mt-0.5 text-[10.5px] text-slate-400">{c.institution}</p>
                        </div>
                        <Link to={`/complaints/${c.id}`} className="shrink-0 text-slate-400 hover:text-brand mt-0.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Comparison</p>
                          <div className="grid gap-2 sm:grid-cols-2 text-xs">
                            {[
                              ["Institution", cA.institution === cB.institution ? "✓ Same" : "Different", cA.institution === cB.institution],
                              ["Category", cA.category === cB.category ? "✓ Same" : "Different", cA.category === cB.category],
                              ["Bureau", cA.bureau === cB.bureau ? "✓ Same" : "Different", cA.bureau === cB.bureau],
                              ["Priority", `${cA.priority} / ${cB.priority}`, cA.priority === cB.priority],
                            ].map(([label, value, match]) => (
                              <div key={String(label)} className="flex items-center justify-between rounded-lg bg-white border border-slate-100 px-3 py-2">
                                <span className="text-slate-500">{label}</span>
                                <span className={cn("font-semibold", match ? "text-emerald-600" : "text-slate-700")}>
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-[10.5px] font-bold text-slate-400 mb-1">Case A Subject</p>
                              <p className="text-xs text-slate-700">{cA.subject}</p>
                            </div>
                            <div>
                              <p className="text-[10.5px] font-bold text-slate-400 mb-1">Case B Subject</p>
                              <p className="text-xs text-slate-700">{cB.subject}</p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => doAction(cA.id, cB.id, "confirmed")}
                              className="gap-1.5"
                            >
                              <Link2 className="h-3.5 w-3.5" /> Confirm & Link Cases
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => doAction(cA.id, cB.id, "dismissed")}
                              className="gap-1.5"
                            >
                              <Unlink2 className="h-3.5 w-3.5" /> Dismiss (Not Related)
                            </Button>
                            <Link
                              to={`/complaints/${cA.id}`}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white h-9 px-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Case A
                            </Link>
                            <Link
                              to={`/complaints/${cB.id}`}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white h-9 px-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Case B
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── reviewed log ── */}
      {reviewed.length > 0 && (
        <motion.div variants={riseVariants} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-navy">Session Review Log</h2>
            <button
              onClick={() => setReviewed([])}
              className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>
          <div className="space-y-1.5">
            {reviewed.map((r) => (
              <div key={r.key} className="flex items-center gap-2 text-xs text-slate-600">
                {r.action === "confirmed" ? (
                  <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : r.action === "dismissed" ? (
                  <Unlink2 className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <GitMerge className="h-3.5 w-3.5 text-blue-500" />
                )}
                <span className="font-mono text-[10.5px]">{r.key.split("|").join(" ↔ ")}</span>
                <span className={cn(
                  "ml-auto font-semibold capitalize",
                  r.action === "confirmed" ? "text-emerald-600" :
                  r.action === "dismissed" ? "text-slate-400" : "text-blue-600"
                )}>
                  {r.action}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
