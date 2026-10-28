import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedComplaints, seedNotifications } from "../lib/seed";
import { STORAGE_VERSION, nextCaseId, scopeComplaints, uid } from "../lib/utils";
import {
  BUREAUS,
  ROLE_PERSONAS,
  bureauById,
  type AppNotification,
  type Complaint,
  type NewComplaintInput,
  type Priority,
  type Role,
  type Status,
  type TimelineEvent,
} from "../lib/types";
import { useAuth } from "./AuthContext";
import { supabase, type UserRole } from "../lib/supabase";

/** Map Supabase DB roles → app Role for UI scoping */
export function mapUserRole(dbRole: UserRole | null | undefined): Role {
  if (!dbRole) return "student";
  if (dbRole === "system_administrator" || dbRole === "competent_authority") return "admin";
  return "officer";
}

const KEYS = {
  complaints: "casebridge.complaints",
  notifications: "casebridge.notifications",
  role: "casebridge.role",
  version: "casebridge.version",
};

export interface ToastMsg {
  id: string;
  title: string;
  body?: string;
  variant: "success" | "info" | "warning";
}

interface AppContextValue {
  complaints: Complaint[];
  visibleComplaints: Complaint[];
  role: Role;
  setRole: (r: Role) => void;
  notifications: AppNotification[];
  unreadCount: number;
  toasts: ToastMsg[];
  pushToast: (t: Omit<ToastMsg, "id">) => void;
  dismissToast: (id: string) => void;
  addComplaint: (input: NewComplaintInput) => Complaint;
  deleteComplaint: (id: string) => void;
  updateStatus: (id: string, status: Status, note?: string) => void;
  assignBureau: (id: string, bureauId: string) => void;
  addNote: (id: string, text: string, internal: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function initialState(): { complaints: Complaint[]; notifications: AppNotification[] } {
  const version = localStorage.getItem(KEYS.version);
  const stored = loadJSON<Complaint[]>(KEYS.complaints);
  if (version === STORAGE_VERSION && Array.isArray(stored) && stored.length > 0) {
    return {
      complaints: stored,
      notifications: loadJSON<AppNotification[]>(KEYS.notifications) ?? [],
    };
  }
  const complaints = seedComplaints();
  return { complaints, notifications: seedNotifications(complaints) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  // Derive role from real auth profile; fall back to stored demo role
  const authRole = useMemo(() => mapUserRole(profile?.role), [profile]);

  // Initialize with stored state or seed data so the dashboard is immediately populated
  const [{ complaints, notifications }, setData] = useState(() => initialState());

  // Fetch real cases from Supabase database
  useEffect(() => {
    async function syncCasesFromDb() {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const statusMap: Record<string, Status> = {
            received: "Submitted",
            pending: "Under Review",
            under_process: "In Progress",
            disposed: "Resolved",
            escalated: "Escalated",
          };
          const priorityMap: Record<string, Priority> = {
            low: "Low",
            medium: "Medium",
            high: "High",
            urgent: "High",
          };

          const mapped: Complaint[] = data.map((row: any) => {
            const bId = row.bureau_id ? (BUREAUS.find((b) => b.id === row.bureau_id)?.id || "PGRC") : "PGRC";
            const bDef = bureauById(bId);
            return {
              id: row.case_number || row.id,
              subject: row.subject,
              description: row.description,
              complainantName: row.complainant_name,
              email: row.complainant_email,
              institution: row.institution_name,
              category: row.category,
              bureau: bDef.id,
              priority: priorityMap[row.priority?.toLowerCase()] || "Medium",
              status: statusMap[row.status?.toLowerCase()] || "Submitted",
              createdAt: row.created_at,
              updatedAt: row.updated_at || row.created_at,
              attachments: [],
              timeline: [
                {
                  stage: "Submitted",
                  label: "Complaint registered in database",
                  date: row.created_at,
                  detail: "Stored in AICTE Central Database",
                },
              ],
              notes: [],
            };
          });

          setData((prev) => {
            const byId = new Map<string, Complaint>();
            mapped.forEach((c) => byId.set(c.id, c));
            prev.complaints.forEach((c) => {
              if (!byId.has(c.id)) byId.set(c.id, c);
            });
            const merged = Array.from(byId.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            return { ...prev, complaints: merged };
          });
        }
      } catch (err) {
        console.warn("[AICTE] Database sync skipped:", err);
      }
    }

    syncCasesFromDb();
  }, [profile]);

  const [role, setRoleState] = useState<Role>(() => {
    if (profile) return mapUserRole(profile.role);
    const r = localStorage.getItem(KEYS.role);
    return r === "officer" || r === "admin" || r === "complainant" ? (r as Role) : "admin";
  });

  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Keep role in sync with auth profile whenever it changes
  useEffect(() => {
    if (profile) setRoleState(mapUserRole(profile.role));
  }, [profile]);

  // Persist complaints and state across refreshes
  useEffect(() => {
    localStorage.setItem(KEYS.version, STORAGE_VERSION);
    localStorage.setItem(KEYS.complaints, JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(KEYS.role, role);
  }, [role]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback(
    (t: Omit<ToastMsg, "id">) => {
      const id = uid("toast");
      setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismissToast(id), 4600);
    },
    [dismissToast]
  );

  const pushNotification = useCallback(
    (n: Omit<AppNotification, "id" | "date" | "read">) => {
      setData((prev) => ({
        ...prev,
        notifications: [
          { ...n, id: uid("ntf"), date: new Date().toISOString(), read: false },
          ...prev.notifications,
        ],
      }));
    },
    []
  );

  const setRole = useCallback(
    (r: Role) => {
      setRoleState(r);
      pushToast({
        title: `Viewing as ${ROLE_PERSONAS[r].name}`,
        body: `${ROLE_PERSONAS[r].title} · role switched`,
        variant: "info",
      });
    },
    [pushToast]
  );

  const addComplaint = useCallback(
    (input: NewComplaintInput): Complaint => {
      const now = new Date().toISOString();
      const bureau = bureauById(input.bureau);
      const complaint: Complaint = {
        id: nextCaseId(complaints),
        subject: input.subject,
        description: input.description,
        complainantName: input.complainantName,
        email: input.email,
        institution: input.institution,
        category: input.category,
        bureau: bureau.id,
        priority: input.priority,
        status: "Submitted",
        createdAt: now,
        updatedAt: now,
        attachments: input.attachments,
        timeline: [
          {
            stage: "Submitted",
            label: "Complaint submitted",
            date: now,
            detail: "Lodged through the CaseBridge citizen portal",
          },
          {
            stage: "Assigned",
            label: `Assigned to ${bureau.name}`,
            date: now,
            detail: `Auto-routed · desk officer ${bureau.officer}`,
          },
        ],
        notes: [],
      };

      // 1. Immediately update UI state and persistent storage
      setData((prev) => ({ ...prev, complaints: [complaint, ...prev.complaints] }));

      // Save locally to my_complaints so student/complainant view always retains it
      try {
        const raw = localStorage.getItem("casebridge.my_complaints");
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(complaint.id)) {
          list.unshift(complaint.id);
          localStorage.setItem("casebridge.my_complaints", JSON.stringify(list));
        }
      } catch (err) {
        console.warn("Could not save to my_complaints:", err);
      }

      // 2. Persist to Supabase Database
      (async () => {
        try {
          let dbBureauId: string | null = null;
          const { data: bData } = await supabase
            .from("bureaus")
            .select("id")
            .eq("code", bureau.id)
            .maybeSingle();
          if (bData?.id) dbBureauId = bData.id;

          const pMap: Record<string, string> = { Low: "low", Medium: "medium", High: "high" };
          const { error: dbError } = await supabase.from("cases").insert({
            case_number: complaint.id,
            subject: complaint.subject,
            description: complaint.description,
            complainant_name: complaint.complainantName,
            complainant_email: complaint.email,
            institution_name: complaint.institution,
            category: complaint.category,
            bureau_id: dbBureauId,
            status: "received",
            priority: pMap[complaint.priority] || "medium",
            receipt_date: now,
            last_action_date: now,
            is_demo: false,
          });

          if (dbError) {
            console.warn("[AICTE] Database sync notice:", dbError.message);
          } else {
            console.log("[AICTE] Complaint synced to Supabase database:", complaint.id);
          }
        } catch (e) {
          console.warn("[AICTE] Database insert error:", e);
        }
      })();

      pushNotification({
        title: "Complaint registered",
        message: `${complaint.id} routed to the ${bureau.name} desk.`,
        type: "new",
        complaintId: complaint.id,
      });
      return complaint;
    },
    [complaints, pushNotification]
  );

  const deleteComplaint = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        complaints: prev.complaints.filter((c) => c.id !== id),
        notifications: prev.notifications.filter((n) => n.complaintId !== id),
      }));

      // Remove from local my_complaints
      try {
        const raw = localStorage.getItem("casebridge.my_complaints");
        if (raw) {
          const list: string[] = JSON.parse(raw);
          localStorage.setItem(
            "casebridge.my_complaints",
            JSON.stringify(list.filter((x) => x !== id))
          );
        }
      } catch (err) {
        console.warn("Could not update my_complaints:", err);
      }

      // Delete from Supabase if connected
      (async () => {
        try {
          const { error } = await supabase.from("cases").delete().eq("case_number", id);
          if (error) {
            console.warn("[AICTE] Database delete notice:", error.message);
          } else {
            console.log("[AICTE] Case removed from database:", id);
          }
        } catch (e) {
          console.warn("[AICTE] Database delete error:", e);
        }
      })();

      pushToast({
        title: "Complaint Deleted",
        body: `Complaint ${id} has been permanently deleted.`,
        variant: "warning",
      });
    },
    [pushToast]
  );

  const updateStatus = useCallback(
    (id: string, status: Status, note?: string) => {
      const now = new Date().toISOString();
      const actor = ROLE_PERSONAS[role];
      let changed: Complaint | undefined;
      setData((prev) => ({
        ...prev,
        complaints: prev.complaints.map((c) => {
          if (c.id !== id) return c;
          const label =
            status === "Submitted"
              ? "Returned to submitted queue"
              : status === "Resolved"
                ? "Resolved"
                : status === "Escalated"
                  ? "Escalated to regional office"
                  : status === "Under Review"
                    ? "Under review"
                    : "Processing in progress";
          const event: TimelineEvent = {
            stage: status,
            label,
            date: now,
            detail: note || `Status updated by ${actor.name} (${actor.title})`,
          };
          const next: Complaint = {
            ...c,
            status,
            updatedAt: now,
            timeline: [...c.timeline, event],
            notes: note
              ? [
                  ...c.notes,
                  {
                    id: uid("note"),
                    author: actor.name,
                    authorRole: actor.title,
                    text: note,
                    date: now,
                    internal: false,
                  },
                ]
              : c.notes,
          };
          changed = next;
          return next;
        }),
      }));
      if (changed) {
        pushNotification({
          title: status === "Resolved" ? "Case resolved" : status === "Escalated" ? "Case escalated" : "Status updated",
          message: `${id} moved to "${status}".`,
          type: status === "Resolved" ? "resolved" : status === "Escalated" ? "escalation" : "info",
          complaintId: id,
        });
        pushToast({
          title: `Case ${id} updated`,
          body: `Status set to "${status}". All statistics refreshed.`,
          variant: status === "Resolved" ? "success" : "info",
        });
      }
    },
    [role, pushNotification, pushToast]
  );

  const assignBureau = useCallback(
    (id: string, bureauId: string) => {
      const now = new Date().toISOString();
      const actor = ROLE_PERSONAS[role];
      const bureau = bureauById(bureauId);
      setData((prev) => ({
        ...prev,
        complaints: prev.complaints.map((c) =>
          c.id === id
            ? {
                ...c,
                bureau: bureau.id,
                updatedAt: now,
                timeline: [
                  ...c.timeline,
                  {
                    stage: "Assigned",
                    label: `Reassigned to ${bureau.name}`,
                    date: now,
                    detail: `Reassigned by ${actor.name}`,
                  },
                ],
              }
            : c
        ),
      }));
      pushNotification({
        title: "Case reassigned",
        message: `${id} moved to the ${bureau.name}.`,
        type: "new",
        complaintId: id,
      });
      pushToast({
        title: "Case reassigned",
        body: `${id} now belongs to the ${bureau.name}.`,
        variant: "info",
      });
    },
    [role, pushNotification, pushToast]
  );

  const addNote = useCallback(
    (id: string, text: string, internal: boolean) => {
      const now = new Date().toISOString();
      const actor = ROLE_PERSONAS[role];
      setData((prev) => ({
        ...prev,
        complaints: prev.complaints.map((c) =>
          c.id === id
            ? {
                ...c,
                updatedAt: now,
                notes: [
                  ...c.notes,
                  {
                    id: uid("note"),
                    author: actor.name,
                    authorRole: actor.title,
                    text,
                    date: now,
                    internal,
                  },
                ],
              }
            : c
        ),
      }));
      pushToast({
        title: internal ? "Internal note saved" : "Public update posted",
        body: `Added to ${id}.`,
        variant: "success",
      });
    },
    [role, pushToast]
  );

  const markRead = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    if (profile) {
      pushToast({ title: "Not available", body: "Reset is only available in demo mode.", variant: "warning" });
      return;
    }
    const fresh = seedComplaints();
    setData({ complaints: fresh, notifications: seedNotifications(fresh) });
    pushToast({
      title: "Demo data restored",
      body: "All sample cases, notes and notifications have been reset.",
      variant: "success",
    });
  }, [pushToast, profile]);

  // Use auth-derived role for scoping when real profile exists
  const effectiveRole = profile ? authRole : role;
  const userEmail = profile?.email;
  const visibleComplaints = useMemo(
    () => scopeComplaints(complaints, effectiveRole, userEmail),
    [complaints, effectiveRole, userEmail]
  );
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value: AppContextValue = {
    complaints,
    visibleComplaints,
    role: effectiveRole,
    setRole,
    notifications,
    unreadCount,
    toasts,
    pushToast,
    dismissToast,
    addComplaint,
    deleteComplaint,
    updateStatus,
    assignBureau,
    addNote,
    markRead,
    markAllRead,
    resetDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
