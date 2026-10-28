import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  Eye,
  FilePlus2,
  Globe,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Tag,
  User,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { cn, daysSince, formatDate, formatDateTime, timeAgo } from "../lib/utils";
import { BUREAUS, ROLE_PERSONAS, SLA_DAYS, STATUSES, bureauById, type Status } from "../lib/types";
import {
  BureauIcon,
  Button,
  EmptyState,
  PriorityPill,
  StatusPill,
  riseVariants,
  staggerParent,
} from "../components/ui";

const STAGE_ICONS: Record<string, typeof CheckCircle2> = {
  Submitted: FilePlus2,
  Assigned: ClipboardCheck,
  "Under Review": Search,
  "In Progress": Loader2,
  Resolved: CheckCircle2,
  Escalated: AlertTriangle,
};

const STAGE_COLORS: Record<string, { bg: string; fg: string }> = {
  Submitted: { bg: "bg-mist", fg: "text-brand" },
  Assigned: { bg: "bg-indigo-50", fg: "text-indigo-600" },
  "Under Review": { bg: "bg-amber-50", fg: "text-amber-600" },
  "In Progress": { bg: "bg-peach", fg: "text-saffron" },
  Resolved: { bg: "bg-emerald-50", fg: "text-emerald-600" },
  Escalated: { bg: "bg-red-50", fg: "text-red-600" },
};

export default function ComplaintDetails() {
  const { id } = useParams();
  const { role, complaints, updateStatus, assignBureau, addNote, pushToast } = useApp();
  const complaint = complaints.find((c) => c.id === id);

  const [copied, setCopied] = useState(false);
  const [statusChoice, setStatusChoice] = useState<Status | "">("");
  const [bureauChoice, setBureauChoice] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteInternal, setNoteInternal] = useState(false);

  const visibleNotes = useMemo(() => {
    if (!complaint) return [];
    return complaint.notes.filter((n) => role !== "complainant" || !n.internal);
  }, [complaint, role]);

  if (!complaint) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="Case not found"
        body="This tracking ID does not exist in the demo dataset. It may have been cleared by a demo reset."
        action={
          <Link to="/complaints">
            <Button>Back to case register</Button>
          </Link>
        }
      />
    );
  }

  const bureau = bureauById(complaint.bureau);
  const isStaff = role !== "complainant";
  const openDays = daysSince(complaint.createdAt);
  const isOpen = complaint.status !== "Resolved";

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(complaint.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast({ title: "Copy failed", body: "Your browser blocked clipboard access.", variant: "warning" });
    }
  };

  const doUpdateStatus = () => {
    if (!statusChoice) return;
    updateStatus(complaint.id, statusChoice, statusNote.trim() || undefined);
    setStatusChoice("");
    setStatusNote("");
  };

  const doAddNote = () => {
    if (!noteText.trim()) return;
    addNote(complaint.id, noteText.trim(), noteInternal);
    setNoteText("");
    setNoteInternal(false);
  };

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={riseVariants}>
        <Link
          to="/complaints"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back to case register
        </Link>
      </motion.div>

      {/* ------- header ------- */}
      <motion.div variants={riseVariants} className="card relative overflow-hidden p-6">
        <div
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: bureau.color }}
          aria-hidden
        />
        <div className="flex flex-wrap items-start justify-between gap-4 pl-2">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={doCopy}
                title="Copy tracking ID"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold tracking-wide text-slate-600 transition-colors hover:bg-slate-200 tnum"
              >
                {complaint.id}
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
              </button>
              <StatusPill status={complaint.status} />
              <PriorityPill priority={complaint.priority} />
              {isOpen && openDays > SLA_DAYS && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 tnum">
                  <Clock3 className="h-3 w-3" /> {openDays - SLA_DAYS}d past SLA
                </span>
              )}
            </div>
            <h1 className="font-display mt-3 text-xl leading-snug font-extrabold tracking-tight text-navy sm:text-2xl">
              {complaint.subject}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" /> {complaint.institution}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-400" /> {complaint.category}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> Filed {formatDate(complaint.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" /> Updated {timeAgo(complaint.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-cream px-4 py-3">
            <BureauIcon bureauId={complaint.bureau} size="lg" />
            <div>
              <p className="text-[10.5px] font-bold tracking-[0.08em] text-slate-400 uppercase">Handling bureau</p>
              <p className="text-sm font-bold text-navy">{bureau.name}</p>
              <p className="text-[11px] text-slate-400">Desk officer · {bureau.officer}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ------- left rail ------- */}
        <motion.div variants={staggerParent} className="space-y-5 xl:col-span-2">
          <motion.section variants={riseVariants} className="card p-6">
            <h2 className="font-display text-[15px] font-bold text-navy">Complaint description</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{complaint.description}</p>
            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <User className="h-4 w-4 text-slate-400" />
                <span>
                  <span className="font-semibold text-slate-700">{complaint.complainantName}</span>
                  <span className="block text-slate-400">Complainant</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>
                  <span className="font-semibold text-slate-700">{complaint.email}</span>
                  <span className="block text-slate-400">Registered email</span>
                </span>
              </div>
            </div>
            {complaint.attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                {complaint.attachments.map((a) => (
                  <span
                    key={a}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {a}
                  </span>
                ))}
                <span className="text-[10.5px] text-slate-400">(demo references — files are not uploaded)</span>
              </div>
            )}
          </motion.section>

          {/* ------- timeline ------- */}
          <motion.section variants={riseVariants} className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold text-navy">Case journey</h2>
              <span className="text-[11px] font-semibold text-slate-400 tnum">
                {isOpen ? `${openDays} days since filing` : "Closed"}
              </span>
            </div>
            <div className="mt-6">
              {complaint.timeline.map((t, i) => {
                const Icon = STAGE_ICONS[t.stage] ?? ClipboardCheck;
                const colors = STAGE_COLORS[t.stage] ?? STAGE_COLORS.Assigned;
                const isCurrent = i === complaint.timeline.length - 1;
                const isLast = isCurrent && !isOpen;
                return (
                  <div key={`${t.stage}-${t.date}-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
                    {(!isLast || isOpen) && (
                      <span className="absolute top-9 left-[15px] h-[calc(100%-28px)] w-px bg-slate-200" aria-hidden />
                    )}
                    <motion.span
                      animate={isCurrent && isOpen ? { scale: [1, 1.09, 1] } : { scale: 1 }}
                      transition={isCurrent && isOpen ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" } : undefined}
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        colors.bg,
                        colors.fg,
                        isCurrent && "ring-4 ring-brand/10"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", t.stage === "In Progress" && isCurrent && isOpen && "animate-[spin_3.2s_linear_infinite]")} />
                    </motion.span>
                    <div className="min-w-0 pt-0.5">
                      <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-navy">
                        {t.label}
                        {isCurrent && (
                          <span className="rounded-full bg-navy px-2 py-0.5 text-[9.5px] font-bold tracking-[0.08em] text-white uppercase">
                            {isOpen ? "Current stage" : "Final stage"}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11.5px] font-medium text-slate-400 tnum">{formatDateTime(t.date)}</p>
                      {t.detail && <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.detail}</p>}
                    </div>
                  </div>
                );
              })}
              {isOpen && (
                <div className="relative flex gap-4">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-200 bg-white text-slate-300">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="pt-0.5">
                    <p className="text-[13.5px] font-semibold text-slate-400">Resolution</p>
                    <p className="mt-0.5 text-[11.5px] text-slate-400">Awaiting closure by the {bureau.shortName} desk</p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* ------- notes ------- */}
          <motion.section variants={riseVariants} className="card p-6">
            <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy">
              <MessageSquare className="h-4 w-4 text-slate-400" /> Updates & notes
            </h2>
            <div className="mt-4 space-y-3">
              {visibleNotes.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-4 py-3.5 text-xs leading-relaxed text-slate-500">
                  No updates posted yet. Desk officers add progress notes here as the case moves.
                </p>
              )}
              {[...visibleNotes]
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/[0.06] text-[10px] font-bold text-navy">
                        {n.author
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <p className="text-xs font-bold text-slate-700">{n.author}</p>
                      <span className="text-[11px] text-slate-400">{n.authorRole}</span>
                      {n.internal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          <Lock className="h-2.5 w-2.5" /> Internal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold text-brand">
                          <Globe className="h-2.5 w-2.5" /> Public update
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-slate-400 tnum">{timeAgo(n.date)}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{n.text}</p>
                  </div>
                ))}
            </div>

            {isStaff && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder={`Post an update as ${ROLE_PERSONAS[role].name}…`}
                  className="input resize-none"
                />
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={noteInternal}
                      onClick={() => setNoteInternal((v) => !v)}
                      className={cn(
                        "relative h-5.5 w-10 cursor-pointer rounded-full transition-colors",
                        noteInternal ? "bg-navy" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-all",
                          noteInternal ? "left-5" : "left-0.5"
                        )}
                      />
                    </button>
                    Internal note (not visible to complainant)
                  </label>
                  <Button size="sm" onClick={doAddNote} disabled={!noteText.trim()}>
                    <Send className="h-3.5 w-3.5" /> Post {noteInternal ? "internal note" : "public update"}
                  </Button>
                </div>
              </div>
            )}
          </motion.section>
        </motion.div>

        {/* ------- right rail ------- */}
        <motion.div variants={staggerParent} className="space-y-5">
          <motion.section variants={riseVariants} className="card p-5">
            <h2 className="font-display text-[15px] font-bold text-navy">Case summary</h2>
            <dl className="mt-4 space-y-3.5 text-xs">
              {[
                ["Tracking ID", complaint.id],
                ["Bureau", bureau.name],
                ["Desk officer", bureau.officer],
                ["Category", complaint.category],
                ["Priority", complaint.priority],
                ["Filed on", formatDate(complaint.createdAt)],
                ["Last updated", formatDateTime(complaint.updatedAt)],
                ["Open for", isOpen ? `${openDays} days` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className="text-right font-semibold text-slate-700 tnum">{v}</dd>
                </div>
              ))}
            </dl>
          </motion.section>

          {isStaff ? (
            <motion.section variants={riseVariants} className="card border-brand/15 p-5">
              <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-navy">
                <Eye className="h-4 w-4 text-brand" /> Officer actions
              </h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
                Changes save instantly to this browser and refresh every KPI, chart and list.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Update status</label>
                  <div className="flex gap-2">
                    <select
                      value={statusChoice}
                      onChange={(e) => setStatusChoice(e.target.value as Status)}
                      className="input flex-1 cursor-pointer py-2 text-[13px]"
                    >
                      <option value="">Choose status…</option>
                      {STATUSES.filter((s) => s !== complaint.status).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={doUpdateStatus} disabled={!statusChoice} className="h-[38px]">
                      Apply
                    </Button>
                  </div>
                  <input
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional public note with this update…"
                    className="input mt-2 py-2 text-[13px]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Reassign bureau</label>
                  <div className="flex gap-2">
                    <select
                      value={bureauChoice}
                      onChange={(e) => setBureauChoice(e.target.value)}
                      className="input flex-1 cursor-pointer py-2 text-[13px]"
                    >
                      <option value="">Choose bureau…</option>
                      {BUREAUS.filter((b) => b.id !== complaint.bureau).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-[38px]"
                      disabled={!bureauChoice}
                      onClick={() => {
                        assignBureau(complaint.id, bureauChoice);
                        setBureauChoice("");
                      }}
                    >
                      Move
                    </Button>
                  </div>
                </div>

                {complaint.status !== "Resolved" ? (
                  <Button
                    variant="accent"
                    className="w-full"
                    onClick={() => updateStatus(complaint.id, "Resolved", "Case closed after verification and complainant intimation.")}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as resolved
                  </Button>
                ) : (
                  <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> This case is closed. Reopen it by choosing a status above.
                  </p>
                )}
              </div>
            </motion.section>
          ) : (
            <motion.section variants={riseVariants} className="card p-5">
              <h2 className="font-display text-[15px] font-bold text-navy">What happens next?</h2>
              <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-slate-500">
                <li className="flex gap-2.5">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  Cases are normally acknowledged within 2 working days and target closure within {SLA_DAYS} days.
                </li>
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  Every status change is recorded in the case journey and fires a notification in this demo.
                </li>
                <li className="flex gap-2.5">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  You are viewing the citizen track — officer actions are hidden for this role.
                </li>
              </ul>
            </motion.section>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
