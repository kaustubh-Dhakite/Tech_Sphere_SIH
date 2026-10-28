import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  Download,
  FilePlus2,
  Filter,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { cn, exportComplaintsCSV, formatDate } from "../lib/utils";
import { BUREAUS, PRIORITIES, STATUSES, bureauById, type Complaint } from "../lib/types";
import { BureauIcon, EmptyState, PriorityPill, StatusPill, riseVariants, staggerParent } from "../components/ui";

const PRIORITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

const SCOPE_LABEL: Record<string, { title: string; sub: string }> = {
  admin:       { title: "All Complaints", sub: "Complete central register across all AICTE bureaus and institutions" },
  officer:     { title: "All Complaints & Grievance Register", sub: "Monitoring and resolution queue across all bureaus" },
  institute:   { title: "Institution Grievances", sub: "Complaints lodged concerning your institution" },
  student:     { title: "My Grievances & Queries", sub: "Track and manage your submitted complaints" },
  complainant: { title: "My Grievances & Queries", sub: "Track and manage your submitted complaints" },
};

export default function Complaints() {
  const { role, visibleComplaints, deleteComplaint, pushToast } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [bureau, setBureau] = useState(params.get("bureau") ?? "all");
  const [sort, setSort] = useState<"newest" | "oldest" | "priority">("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = visibleComplaints.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (priority !== "all" && c.priority !== priority) return false;
      if (bureau !== "all" && c.bureau !== bureau) return false;
      if (
        q &&
        ![c.id, c.subject, c.institution, c.complainantName, c.category].some((f) =>
          f.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === "priority") {
        const d = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        return d !== 0 ? d : +new Date(b.createdAt) - +new Date(a.createdAt);
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [visibleComplaints, query, status, priority, bureau, sort]);

  const meta = SCOPE_LABEL[role];
  const hasFilters = query !== "" || status !== "all" || priority !== "all" || bureau !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setPriority("all");
    setBureau("all");
    setParams({}, { replace: true });
  };

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      {/* header */}
      <motion.div variants={riseVariants} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.sub}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              exportComplaintsCSV(filtered);
              pushToast({
                title: "CSV exported",
                body: `${filtered.length} record${filtered.length === 1 ? "" : "s"} downloaded for offline review.`,
                variant: "success",
              });
            }}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
          >
            <Download className="h-4 w-4 text-slate-400" /> Export CSV
          </button>
          <Link
            to="/register"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-saffron px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_-8px_rgb(249_115_22_/_0.7)] transition-colors hover:bg-saffron-dark"
          >
            <FilePlus2 className="h-4 w-4" /> New complaint
          </Link>
        </div>
      </motion.div>

      {/* toolbar */}
      <motion.div variants={riseVariants} className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by case ID, subject, institution or complainant…"
            className="input has-left-icon pl-11"
            aria-label="Search complaints"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Filter className="hidden h-4 w-4 text-slate-400 lg:block" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={cn("input w-auto cursor-pointer pr-8", "min-w-[130px]")}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input w-auto min-w-[120px] cursor-pointer pr-8">
            <option value="all">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {role !== "officer" && (
            <select
              value={bureau}
              onChange={(e) => {
                setBureau(e.target.value);
                setParams(e.target.value === "all" ? {} : { bureau: e.target.value }, { replace: true });
              }}
              className="input w-auto min-w-[170px] cursor-pointer pr-8"
            >
              <option value="all">All bureaus</option>
              {BUREAUS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="input w-auto min-w-[130px] cursor-pointer pr-8"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority: high → low</option>
          </select>
        </div>
      </motion.div>

      {/* results */}
      <motion.div variants={riseVariants} className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="font-bold text-navy tnum">{filtered.length}</span> of{" "}
          <span className="tnum">{visibleComplaints.length}</span> cases
          {hasFilters && (
            <button onClick={clearFilters} className="ml-3 cursor-pointer font-bold text-brand hover:text-brand-dark">
              Clear filters
            </button>
          )}
        </p>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={riseVariants}>
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No cases match your filters"
            body="Try widening the search or clearing active filters. Demo cases span approvals, academics, grievances, compliance and welfare."
            action={
              <button
                onClick={clearFilters}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Clear all filters
              </button>
            }
          />
        </motion.div>
      ) : (
        <>
          {/* desktop table */}
          <motion.div variants={riseVariants} className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold tracking-[0.06em] text-slate-400 uppercase">
                    <th className="px-5 py-3 font-bold">Case</th>
                    <th className="hidden px-3 py-3 font-bold xl:table-cell">Institution</th>
                    <th className="px-3 py-3 font-bold">Bureau</th>
                    <th className="px-3 py-3 font-bold">Priority</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 font-bold">Submitted</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-mist/40"
                    >
                      <td className="px-5 py-3.5">
                        <p className="max-w-[340px] truncate text-[13px] font-semibold text-slate-800">{c.subject}</p>
                        <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-slate-400 tnum">
                          {c.id} · {c.complainantName}
                        </p>
                      </td>
                      <td className="hidden max-w-[220px] truncate px-3 py-3.5 text-xs text-slate-500 xl:table-cell">
                        {c.institution}
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
                      <td className="px-3 py-3.5 text-xs whitespace-nowrap text-slate-500">{formatDate(c.createdAt)}</td>
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {(role === "admin" || role === "student" || role === "complainant") && (
                            <button
                              onClick={() => {
                                const isStudent = role === "student" || role === "complainant";
                                const msg = isStudent
                                  ? `Delete/withdraw query ${c.id}? This cannot be undone.`
                                  : `Permanently delete complaint ${c.id}?`;
                                if (window.confirm(msg)) {
                                  deleteComplaint(c.id);
                                }
                              }}
                              title="Delete complaint / query"
                              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* mobile cards */}
          <motion.div variants={staggerParent} className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="card card-hover block p-4 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/complaints/${c.id}`} className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-snug font-semibold text-slate-800 hover:text-brand">{c.subject}</p>
                    <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-400 tnum">{c.id}</p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    {(role === "admin" || role === "student" || role === "complainant") && (
                      <button
                        onClick={() => {
                          const isStudent = role === "student" || role === "complainant";
                          const msg = isStudent
                            ? `Delete/withdraw query ${c.id}? This cannot be undone.`
                            : `Permanently delete complaint ${c.id}?`;
                          if (window.confirm(msg)) {
                            deleteComplaint(c.id);
                          }
                        }}
                        title="Delete complaint / query"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <Link to={`/complaints/${c.id}`}>
                      <ChevronRight className="mt-0.5 h-4 w-4 text-slate-300" />
                    </Link>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <StatusPill status={c.status} />
                  <PriorityPill priority={c.priority} />
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-slate-50 pt-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <BureauMark id={c.bureau} /> {bureauById(c.bureau).shortName}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {formatDate(c.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

function BureauMark({ id }: { id: Complaint["bureau"] }) {
  const b = bureauById(id);
  return <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />;
}
