import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BellOff, CheckCheck, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { cn, timeAgo } from "../lib/utils";
import { EmptyState, NotifIcon, riseVariants, staggerParent } from "../components/ui";

export default function Notifications() {
  const { notifications, markRead, markAllRead, unreadCount } = useApp();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const list = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={riseVariants} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Demo alerts for new cases, escalations, overdue items and closures.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                ["all", `All (${notifications.length})`],
                ["unread", `Unread (${unreadCount})`],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  tab === v ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.97]"
          >
            <CheckCheck className="h-4 w-4 text-slate-400" /> Mark all read
          </button>
        </div>
      </motion.div>

      <motion.div variants={riseVariants}>
        {list.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-6 w-6" />}
            title={tab === "unread" ? "You're all caught up" : "No notifications yet"}
            body="Demo alerts will appear here as cases are filed, escalated, updated and resolved."
          />
        ) : (
          <div className="card divide-y divide-slate-50 overflow-hidden">
            {list.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.complaintId) navigate(`/complaints/${n.complaintId}`);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-slate-50",
                  !n.read && "bg-mist/40"
                )}
              >
                <NotifIcon type={n.type} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-navy">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-slate-500">{n.message}</span>
                  <span className="mt-1 block text-[11px] font-medium text-slate-400 tnum">{timeAgo(n.date)}</span>
                </span>
                {n.complaintId && <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" />}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
