import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Info, ShieldCheck, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import { bureauBreakdown, cn } from "../lib/utils";
import { BUREAUS } from "../lib/types";
import { BureauIcon, ProgressBar, StatusPill, riseVariants, staggerParent } from "../components/ui";

export default function Bureaus() {
  const { complaints, role } = useApp();
  const data = useMemo(() => bureauBreakdown(complaints), [complaints]);
  const maxOpen = Math.max(1, ...data.map((d) => d.open));

  if (role !== "admin") {
    return (
      <motion.div variants={staggerParent} initial="hidden" animate="show">
        <motion.div variants={riseVariants} className="card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-brand">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display mt-4 text-xl font-bold text-navy">Bureau Management is an admin view</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Switch to the <span className="font-semibold">Admin</span> role from the header switcher to view bureau
            workloads and reassign cases.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={riseVariants}>
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">Bureau Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Workload distribution and routing health across demo bureaus and cells.
        </p>
      </motion.div>

      <motion.div
        variants={riseVariants}
        className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3.5"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-bold text-slate-700">Illustrative demo structure.</span> These bureau names and officers
          are simulated for the prototype and simplified for demonstration — they do not represent the official AICTE
          organisational structure. Reassign a case from any case details page and counts here update instantly.
        </p>
      </motion.div>

      <motion.section variants={staggerParent} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((d) => {
          const bureau = BUREAUS.find((b) => b.id === d.id)!;
          const openCases = complaints
            .filter((c) => c.bureau === d.id && c.status !== "Resolved")
            .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
            .slice(0, 3);
          return (
            <motion.div key={d.id} variants={riseVariants} className="card card-hover flex flex-col p-5">
              <div className="flex items-start gap-3.5">
                <BureauIcon bureauId={d.id} size="lg" />
                <div className="min-w-0">
                  <h2 className="font-display text-[15px] leading-snug font-bold text-navy">{bureau.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <User className="h-3 w-3 text-slate-400" /> {bureau.officer}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{bureau.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Open", d.open, "text-saffron"],
                  ["Resolved", d.resolved, "text-emerald-600"],
                  ["Total", d.total, "text-navy"],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                    <p className={cn("font-display text-lg font-extrabold tnum", color)}>{value}</p>
                    <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Workload</span>
                  <span className="font-bold text-slate-600 tnum">{d.open} open</span>
                </div>
                <ProgressBar value={(d.open / maxOpen) * 100} color={bureau.color} height={7} />
              </div>

              {openCases.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3.5">
                  <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">Longest open</p>
                  {openCases.map((c) => (
                    <Link
                      key={c.id}
                      to={`/complaints/${c.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0 truncate text-xs font-medium text-slate-600">{c.subject}</span>
                      <StatusPill status={c.status} />
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to={`/complaints?bureau=${d.id}`}
                className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-brand transition-colors hover:text-brand-dark"
              >
                View all cases <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          );
        })}
      </motion.section>
    </motion.div>
  );
}
