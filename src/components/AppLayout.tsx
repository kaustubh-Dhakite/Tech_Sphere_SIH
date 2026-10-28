import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  CheckCheck,
  ChevronRight,
  FilePlus2,
  FileText,
  GitMerge,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  ShieldCheck,
  ClipboardCheck,
  GraduationCap,
  User,
  X,
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { cn, formatDate, timeAgo } from "../lib/utils";
import { type Role } from "../lib/types";
import { Avatar, DemoBadge, NotifIcon } from "./ui";
import LanguageSelector from "./LanguageSelector";

/* ── role display helpers ── */
const ROLE_UI_LABELS: Record<string, string> = {
  admin:                "System Administrator",
  officer:              "AICTE Bureau Officer",
  institute:            "Institute Representative",
  student:              "Student Grievant",
  complainant:          "Student Grievant",
  // DB roles fallback
  system_administrator: "System Administrator",
  competent_authority:  "Competent Authority",
  rb_officer:           "Regulation Bureau",
  pgrc_officer:         "PGRC Officer",
  bureau_officer:       "Bureau Officer",
  regional_officer:     "Regional Officer",
};

/* ── navigation ── */
const ALL_ROLES: Role[] = ["admin", "officer", "institute", "student", "complainant"];

const NAV_ITEMS: Array<{
  to: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
  labelKey: string;
  end?: boolean;
}> = [
  { to: "/",            icon: LayoutDashboard, roles: ALL_ROLES,                         labelKey: "nav.overview",           end: true },
  { to: "/complaints",  icon: FileText,        roles: ALL_ROLES,                         labelKey: "nav.allComplaints" },
  { to: "/register",    icon: FilePlus2,       roles: ALL_ROLES,                         labelKey: "nav.registerComplaint" },
  { to: "/overlaps",    icon: GitMerge,        roles: ["officer", "admin"],              labelKey: "nav.overlaps" },
  { to: "/institutions",icon: Building2,       roles: ["officer", "admin", "institute"], labelKey: "nav.institutions" },
  { to: "/analytics",   icon: BarChart3,       roles: ["officer", "admin", "institute"], labelKey: "nav.analytics" },
  { to: "/bureaus",     icon: Building2,       roles: ["admin"],                         labelKey: "nav.bureauManagement" },
  { to: "/settings",    icon: Settings2,       roles: ALL_ROLES,                         labelKey: "nav.settings" },
];

const CRUMBS: Array<[RegExp, string[]]> = [
  [/^\/$/,              ["Overview"]],
  [/^\/complaints$/,    ["Complaints", "Case Register"]],
  [/^\/complaints\//,  ["Complaints", "Case Details"]],
  [/^\/register$/,      ["Complaints", "Register Complaint"]],
  [/^\/analytics$/,     ["Reports", "Analytics"]],
  [/^\/bureaus$/,       ["Administration", "Bureau Management"]],
  [/^\/settings$/,      ["Account", "Profile & Settings"]],
  [/^\/notifications$/, ["Notifications"]],
  [/^\/overlaps$/,      ["Intelligence", "Overlap Detection"]],
  [/^\/institutions$/, ["Intelligence", "Institution Directory"]],
  [/^\/institutions\//, ["Institution Directory", "360° Profile"]],
];

function breadcrumb(pathname: string) {
  for (const [re, crumbs] of CRUMBS) if (re.test(pathname)) return crumbs;
  return ["Overview"];
}

/* ── standard role switcher: Single Admin, Officer, Institute, Student ── */
const DEMO_ROLE_UI: Array<{ role: Role; label: string; icon: typeof User }> = [
  { role: "admin",     label: "Admin",     icon: ShieldCheck },
  { role: "officer",   label: "Officer",   icon: ClipboardCheck },
  { role: "institute", label: "Institute", icon: Building2 },
  { role: "student",   label: "Student",   icon: GraduationCap },
];

function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useApp();
  const { profile } = useAuth();
  const { t } = useTranslation();
  // Hide switcher for real authenticated users
  if (profile) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgb(24_49_83_/_0.06)]",
        compact && "w-full"
      )}
      role="tablist"
      aria-label="Demo role switcher"
    >
      {DEMO_ROLE_UI.map(({ role: r, label: fallbackLabel, icon: Icon }) => {
        const label = t(`roles.${r}`, fallbackLabel);
        return (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => setRole(r)}
            title={`Switch to ${label} view`}
            className={cn(
              "relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150",
              compact && "flex-1",
              role === r ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className={compact ? "inline" : "hidden xl:inline"}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── click outside hook ── */
function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [cb]);
  return ref;
}

/* ── notifications dropdown ── */
function NotificationsMenu({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-18px_rgb(24_49_83_/_0.35)]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="font-display text-sm font-bold text-navy">{t("notifications.title")}</p>
        <button onClick={markAllRead} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
          <CheckCheck className="h-3.5 w-3.5" /> {t("notifications.markAllRead")}
        </button>
      </div>
      <div className="max-h-[340px] overflow-y-auto">
        {notifications.slice(0, 6).map((n) => (
          <button key={n.id} onClick={() => { markRead(n.id); onClose(); if (n.complaintId) navigate(`/complaints/${n.complaintId}`); }}
            className={cn("flex w-full cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50", !n.read && "bg-mist/50")}>
            <NotifIcon type={n.type} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-slate-800">{n.title}</span>
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">{n.message}</span>
              <span className="mt-1 block text-[11px] font-medium text-slate-400">{timeAgo(n.date)}</span>
            </span>
          </button>
        ))}
      </div>
      <Link to="/notifications" onClick={onClose} className="flex items-center justify-center gap-1 bg-slate-50 py-2.5 text-xs font-bold text-brand transition-colors hover:bg-mist">
        {t("dashboard.viewAllNotifications")} <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}

/* ── profile dropdown ── */
function ProfileMenu({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { pushToast } = useApp();
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();

  // Always use real profile info when available
  const name      = profile?.full_name ?? "User";
  const roleLabel = profile?.role
    ? (ROLE_UI_LABELS[profile.role] ?? profile.role)
    : "Portal User";
  const email     = profile?.email ?? "";
  const initials  = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const isDemo    = !profile;

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-18px_rgb(24_49_83_/_0.35)]"
    >
      <div className="border-b border-slate-100 bg-cream px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar initials={initials} src={profile?.avatar_url} className="h-9 w-9 text-[11px]" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy truncate">{name}</p>
            <p className="mt-0.5 text-xs text-slate-500 truncate">{roleLabel}</p>
            <p className="mt-0.5 text-[10.5px] text-slate-400 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* language picker inside profile menu */}
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Display Language</p>
        <LanguageSelector compact />
      </div>

      {/* Demo-only options */}
      {isDemo && (
        <div className="p-1.5">
          <button onClick={() => { onReset(); onClose(); }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy">
            <RotateCcw className="h-4 w-4 text-slate-400" /> Reset demo data
          </button>
          <button onClick={() => { pushToast({ title: "About this system", body: "AICTE Integrated Complaint Monitoring System · SIH 2026 prototype.", variant: "info" }); onClose(); }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy">
            <Info className="h-4 w-4 text-slate-400" /> About this prototype
          </button>
        </div>
      )}

      <div className="border-t border-slate-100 p-1.5 space-y-0.5">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-navy"
        >
          <Settings2 className="h-4 w-4 text-slate-400" /> Profile & Settings
        </Link>
        <button onClick={handleSignOut}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50">
          <LogOut className="h-4 w-4" /> {t("nav.logout", "Sign Out")}
        </button>
      </div>
      <p className="border-t border-slate-100 px-4 py-2.5 text-[10.5px] leading-relaxed text-slate-400">
        AICTE Complaint Monitoring System · Government of India
      </p>
    </motion.div>
  );
}

/* ── sidebar content ── */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, resetDemo, visibleComplaints } = useApp();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const open = visibleComplaints.filter((c) => c.status !== "Resolved").length;
  const isDemo = !profile;

  return (
    <div className="flex h-full flex-col">
      {/* ── logo + branding ── */}
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <img
          src="/aicte-logo.png"
          alt="AICTE"
          className="h-11 w-11 shrink-0 object-contain drop-shadow"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/aicte-logo.svg";
          }}
        />
        {/* fallback icon (hidden by default, shown if image errors) */}
        <span
          className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white shadow-[0_8px_18px_-6px_rgb(24_49_83_/_0.5)]"
          aria-hidden
        >
          <ShieldCheck className="h-6 w-6" strokeWidth={2} />
        </span>
        <span>
          <span className="font-display block text-[17px] leading-5 font-extrabold tracking-tight text-navy">
            AICTE
          </span>
          <span className="mt-0.5 block text-[9.5px] leading-tight font-semibold tracking-[0.06em] text-slate-400 uppercase">
            Complaint Monitoring Portal
          </span>
        </span>
      </Link>

      {/* nav */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pt-1">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
          {t("nav.workspace", "Workspace")}
        </p>
        {NAV_ITEMS.filter((i) => i.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-150",
                isActive ? "bg-mist text-brand-dark" : "text-slate-500 hover:bg-slate-100 hover:text-navy"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute left-0 h-5 w-1 rounded-r-full bg-brand"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <item.icon
                  className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-500")}
                  strokeWidth={2.1}
                />
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.to === "/complaints" && open > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-500 tnum group-hover:bg-white">
                    {open}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* demo sandbox notice — only shown in demo mode */}
      {isDemo && (
        <div className="space-y-3 p-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-cream p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em]">
              <Info className="h-3.5 w-3.5" /> Demo sandbox
            </p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
              Simulated cases stored locally. No real AICTE records.
            </p>
            <button
              onClick={() => { if (window.confirm("Restore the original sample dataset? Your changes will be discarded.")) resetDemo(); }}
              className="mt-2.5 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
            </button>
          </div>
        </div>
      )}

      {/* GoI footer in sidebar */}
      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[9.5px] font-semibold tracking-[0.07em] text-slate-400 uppercase">Government of India</p>
        <p className="mt-0.5 text-[9px] text-slate-300">Ministry of Education · AICTE</p>
      </div>
    </div>
  );
}

/* ── main layout ── */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { role, unreadCount, toasts, dismissToast, resetDemo } = useApp();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [notifOpen,  setNotifOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location  = useLocation();
  const crumbs    = breadcrumb(location.pathname);

  // Always derive display name from real profile
  const displayName = profile?.full_name ?? "User";
  const initials    = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel   = profile?.role
    ? (ROLE_UI_LABELS[profile.role] ?? profile.role)
    : ROLE_UI_LABELS[role] ?? role;

  const notifRef   = useClickOutside(() => setNotifOpen(false));
  const profileRef = useClickOutside(() => setProfileOpen(false));

  useEffect(() => { setMobileOpen(false); setNotifOpen(false); setProfileOpen(false); }, [location.pathname]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Official Government of India Top Banner ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col bg-[#0b1c36] shadow-sm border-b border-[#061224]">
        {/* Bilingual Government of India Bar */}
        <div className="flex h-[38px] w-full items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Left: National Flag + Official Dual-Language Text */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[17px] leading-none select-none shrink-0" aria-label="National Flag">🇮🇳</span>
            <div className="flex items-center gap-2 truncate">
              <span className="text-[11.5px] font-black tracking-wide text-white whitespace-nowrap">
                भारत सरकार
              </span>
              <span className="text-[10px] text-white/40 select-none">|</span>
              <span className="text-[11px] font-extrabold tracking-wider text-white whitespace-nowrap">
                GOVERNMENT OF INDIA
              </span>
              <span className="hidden md:inline-block text-[10px] text-white/30 select-none">·</span>
              <span className="hidden md:inline-block text-[10.5px] font-medium text-amber-300 whitespace-nowrap">
                शिक्षा मंत्रालय (Ministry of Education)
              </span>
            </div>
          </div>

          {/* Right: AICTE + Portal Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-right">
              <span className="text-[10.5px] font-semibold text-white/85">
                अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE)
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-1.5 rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/20">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span className="hidden sm:inline">CPGRAMS Integrated</span>
              <span className="sm:hidden">Govt Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* desktop sidebar */}
      <aside className="fixed left-0 top-[42px] bottom-0 z-40 hidden w-[268px] border-r border-slate-200/80 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl lg:hidden">
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-4 cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[268px] pt-[42px]">
        {/* header */}
        <header className="sticky top-[42px] z-30 border-b border-slate-200/80 bg-cream/95 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)}
              className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>

            {/* breadcrumb */}
            <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex" aria-label="Breadcrumb">
              <span className="font-medium text-slate-400">AICTE</span>
              {crumbs.slice(0, -1).map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="font-medium text-slate-400">{c}</span>
                </span>
              ))}
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="truncate font-bold text-navy">{crumbs[crumbs.length - 1]}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {!profile && <DemoBadge className="hidden md:inline-flex" />}

              {/* ── Language selector (always visible in header) ── */}
              <LanguageSelector />

              {/* ── Demo role switcher (hidden on mobile, replaced by profile menu compact view) ── */}
              <div className="hidden sm:block">
                <RoleSwitcher />
              </div>

              {/* notifications bell */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen((v) => !v)}
                  className="relative cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-[0_1px_2px_rgb(24_49_83_/_0.06)] transition-colors hover:text-navy"
                  aria-label={t("notifications.title")}>
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-saffron px-1 text-[9.5px] font-bold text-white ring-2 ring-cream tnum">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>{notifOpen && <NotificationsMenu onClose={() => setNotifOpen(false)} />}</AnimatePresence>
              </div>

              {/* profile button */}
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen((v) => !v)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-1.5 shadow-[0_1px_2px_rgb(24_49_83_/_0.06)] transition-colors hover:border-slate-300">
                  <Avatar initials={initials} src={profile?.avatar_url} className="h-7 w-7 text-[10px]" />
                  <span className="hidden text-left md:block">
                    <span className="block text-xs leading-4 font-bold text-navy">{displayName.split(" ")[0]}</span>
                    <span className="block text-[10px] leading-3 font-medium text-slate-400">{roleLabel}</span>
                  </span>
                </button>
                <AnimatePresence>
                  {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} onReset={resetDemo} />}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* mobile role + language row */}
          <div className="border-t border-slate-100 px-4 py-2 sm:hidden">
            <div className="flex items-center gap-2">
              <RoleSwitcher compact />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="px-6 pb-8 text-center text-[11px] text-slate-400 lg:px-8">
          <span className="font-semibold text-slate-500">Government of India</span> · AICTE Complaint Monitoring System · Ministry of Education ·{" "}
          {formatDate(new Date().toISOString())}
        </footer>
      </div>

      {/* toasts */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_20px_50px_-16px_rgb(24_49_83_/_0.4)]">
              <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                t.variant === "success" && "bg-emerald-50 text-emerald-600",
                t.variant === "info"    && "bg-mist text-brand",
                t.variant === "warning" && "bg-amber-50 text-amber-600")}>
                {t.variant === "success" ? <CheckCircle2 className="h-4 w-4" />
                  : t.variant === "warning" ? <AlertTriangle className="h-4 w-4" />
                  : <Info className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-navy">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.body}</p>}
              </div>
              <button onClick={() => dismissToast(t.id)}
                className="cursor-pointer rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
