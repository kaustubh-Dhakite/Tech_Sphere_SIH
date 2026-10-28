import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Lock, Mail, Save, Settings2, ShieldCheck, User, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { riseVariants, staggerParent } from "../components/ui";

const ROLE_UI_LABELS: Record<string, string> = {
  system_administrator: "System Administrator",
  competent_authority: "Competent Authority",
  rb_officer: "Regulation Bureau Officer",
  pgrc_officer: "PGRC Officer",
  bureau_officer: "Bureau Officer",
  regional_officer: "Regional Officer",
  auditor: "Auditor",
};

export default function Settings() {
  const { profile, updateProfile, user } = useAuth();

  const [name, setName]       = useState(profile?.full_name ?? "");
  const [busy, setBusy]       = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setErr(null); setSuccess(false);
    const { error } = await updateProfile({ full_name: name.trim() });
    setBusy(false);
    if (error) setErr(error);
    else setSuccess(true);
  };

  const initials = (profile?.full_name ?? "U")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      {/* header */}
      <motion.div variants={riseVariants}>
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-brand">
            <Settings2 className="h-5 w-5" />
          </span>
          Account Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">Manage your profile and account preferences.</p>
      </motion.div>

      {/* profile card */}
      <motion.div variants={riseVariants} className="card overflow-hidden">
        {/* top accent */}
        <div className="h-1.5 w-full bg-brand" />

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-xl font-bold text-white ring-4 ring-navy/10">
              {initials}
            </span>
            <div>
              <p className="text-[17px] font-bold text-navy">{profile?.full_name ?? "—"}</p>
              <p className="text-sm text-slate-500">{ROLE_UI_LABELS[profile?.role ?? ""] ?? profile?.role ?? "—"}</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Verified Account
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* full name */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Full name <span className="text-saffron">*</span>
              </label>
              <div className="relative">
                <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErr(null); setSuccess(false); }}
                  placeholder="Enter your full name"
                  required
                  className="input has-left-icon pl-11"
                />
              </div>
            </div>

            {/* email — read-only */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={profile?.email ?? user?.email ?? ""}
                  readOnly
                  disabled
                  className="input has-left-icon pl-11 cursor-not-allowed bg-slate-50 text-slate-400"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Email cannot be changed. Contact admin for email updates.</p>
            </div>

            {/* role — read-only */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Role</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ROLE_UI_LABELS[profile?.role ?? ""] ?? profile?.role ?? "—"}
                  readOnly
                  disabled
                  className="input has-left-icon pl-11 cursor-not-allowed bg-slate-50 text-slate-400"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Role is assigned by the system administrator.</p>
            </div>

            {/* feedback */}
            {err && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[13px] font-medium text-red-700">{err}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-[13px] font-medium text-emerald-700">Profile updated successfully.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !name.trim() || name.trim() === profile?.full_name}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-navy px-6 text-[13px] font-semibold text-white shadow-[0_6px_18px_-6px_rgb(24_49_83_/_0.5)] transition-all hover:bg-navy-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save changes</>}
            </button>
          </form>
        </div>
      </motion.div>

      {/* account info card */}
      <motion.div variants={riseVariants} className="card p-6">
        <h2 className="font-display text-[15px] font-bold text-navy mb-4">Account information</h2>
        <div className="space-y-3">
          {[
            { label: "User ID", value: profile?.id ?? user?.id ?? "—" },
            { label: "Bureau", value: profile?.bureau_id ?? "Not assigned" },
            { label: "Regional Office", value: profile?.regional_office_id ?? "Not assigned" },
            { label: "Auth Provider", value: user?.app_metadata?.provider === "google" ? "Google OAuth" : "Email & Password" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-[12px] font-semibold text-slate-500">{row.label}</span>
              <span className="max-w-[60%] truncate text-right text-[12px] font-medium text-slate-700">{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
