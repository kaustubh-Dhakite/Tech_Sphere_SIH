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
  ROLE_PERSONAS,
  bureauById,
  type AppNotification,
  type Complaint,
  type NewComplaintInput,
  type Role,
  type Status,
  type TimelineEvent,
} from "../lib/types";
import { useAuth } from "./AuthContext";
import type { UserRole } from "../lib/supabase";

/** Map Supabase DB roles → legacy app Role for UI scoping */
export function mapUserRole(dbRole: UserRole | null | undefined): Role {
  if (!dbRole) return "complainant";
  if (dbRole === "system_administrator" || dbRole === "competent_authority") return "admin";
  if (dbRole === "auditor") return "admin";
  // rb_officer, pgrc_officer, bureau_officer, regional_officer → officer
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

  // When a real user is logged in we start with empty data (no seed).
  // When there's no real profile (shouldn't happen inside ProtectedApp but just in case)
  // we fall back to the stored demo state.
  const [{ complaints, notifications }, setData] = useState(() => {
    if (profile) {
      // Real user — no demo data
      return { complaints: [] as Complaint[], notifications: [] as AppNotification[] };
    }
    return initialState();
  });

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

  useEffect(() => {
    if (!profile) {
      localStorage.setItem(KEYS.version, STORAGE_VERSION);
      localStorage.setItem(KEYS.complaints, JSON.stringify(complaints));
    }
  }, [complaints, profile]);

  useEffect(() => {
    if (!profile) localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
  }, [notifications, profile]);

  useEffect(() => {
    if (!profile) localStorage.setItem(KEYS.role, role);
  }, [role, profile]);

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
      // Only allow switching in demo mode (no real profile)
      if (profile) return;
      setRoleState(r);
      pushToast({
        title: `Viewing as ${ROLE_PERSONAS[r].name}`,
        body: `${ROLE_PERSONAS[r].title} · demo role switched`,
        variant: "info",
      });
    },
    [pushToast, profile]
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
      setData((prev) => ({ ...prev, complaints: [complaint, ...prev.complaints] }));
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
  const visibleComplaints = useMemo(() => scopeComplaints(complaints, effectiveRole), [complaints, effectiveRole]);
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
