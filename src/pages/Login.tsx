import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck,
  AlertTriangle, User, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

/* ── GoI top bar component ── */
function GoITopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col bg-[#0b1c36] shadow-md border-b border-[#061224]">
      {/* official bar */}
      <div className="flex h-[38px] items-center justify-between px-3 sm:px-6 lg:px-8">
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
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10.5px] font-bold text-white/85">AICTE</span>
            <span className="text-[9px] text-white/50">All India Council for Technical Education</span>
          </div>
          <div className="h-4 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-300 border border-emerald-400/20">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Official Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── role cards for left panel ── */
const ROLE_CARDS = [
  { label: "System Administrator", icon: "⚙️" },
  { label: "Regulation Bureau", icon: "📋" },
  { label: "PGRC Officer", icon: "📨" },
  { label: "Regional Office", icon: "🗺️" },
  { label: "Auditor", icon: "🔍" },
  { label: "Competent Authority", icon: "🏛️" },
];

/* ── google button ── */
function GoogleButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      Continue with Google
    </button>
  );
}

/* ── divider ── */
function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <span className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">or</span>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

/* ── main component ── */
export default function Login() {
  const { signIn, signUp, signInWithGoogle, session, loading } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  const reset = () => { setErr(null); setSuccess(null); };

  /* ── sign in ── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true); reset();
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setErr(
        error.toLowerCase().includes("invalid")
          ? "Incorrect email or password. Please try again."
          : error.toLowerCase().includes("locked")
          ? "Account is locked. Contact system administrator."
          : error
      );
    }
  };

  /* ── sign up ── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    if (password !== confirmPw) { setErr("Passwords do not match."); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true); reset();
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setBusy(false);
    if (error) {
      setErr(error.toLowerCase().includes("already") ? "An account with this email already exists. Please sign in." : error);
    } else {
      setSuccess("Account created! Check your email for a confirmation link, then sign in.");
      setTab("signin");
      setPassword(""); setConfirmPw("");
    }
  };

  /* ── google ── */
  const handleGoogle = async () => {
    setGoogleBusy(true); reset();
    const { error } = await signInWithGoogle();
    if (error) { setErr(error); setGoogleBusy(false); }
    // on success, browser redirects — so no setGoogleBusy(false) needed
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fb] lg:flex-row">
      <GoITopBar />

      {/* ── left panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f1f3d] px-12 pb-12 pt-[90px] lg:flex lg:w-[44%]">
        {/* decorative */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 900" fill="none" aria-hidden>
          <circle cx="580" cy="-40" r="320" stroke="white" strokeOpacity="0.03" strokeWidth="1.5" />
          <circle cx="580" cy="-40" r="220" stroke="white" strokeOpacity="0.05" strokeWidth="1.5" strokeDasharray="4 8" />
          <circle cx="-40" cy="900" r="280" stroke="#f97316" strokeOpacity="0.08" strokeWidth="1.5" />
          <circle cx="300" cy="450" r="200" stroke="white" strokeOpacity="0.02" strokeWidth="1" />
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={320 + c * 36} cy={200 + r * 32} r="1.5" fill="white" fillOpacity="0.04" />
            ))
          )}
        </svg>

        {/* brand */}
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/10">
            <img src="/aicte-logo.png" alt="AICTE" className="h-10 w-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="font-display text-[22px] font-extrabold leading-6 tracking-tight text-white">AICTE</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">All India Council for Technical Education</p>
          </div>
        </div>

        {/* headline */}
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10.5px] font-semibold text-white/50 uppercase tracking-[0.1em]">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Official Portal
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-white lg:text-[42px]">
            Integrated<br />
            Complaint<br />
            <span className="text-[#FF9933]">Monitoring</span><br />
            System
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/45">
            A centralised platform for AICTE-authorised officials to monitor, coordinate and resolve institution-related complaints.
          </p>
        </div>

        {/* role cards */}
        <div className="relative">
          <p className="mb-3 text-[10px] font-bold tracking-[0.14em] text-white/30 uppercase">Authorised access roles</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_CARDS.map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm">
                <span className="text-sm">{r.icon}</span>
                <span className="text-[11px] font-medium text-white/50">{r.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[10px] text-white/20">© {new Date().getFullYear()} AICTE · Government of India</p>
        </div>
      </div>

      {/* ── right panel ── */}
      <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-[90px] sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* mobile logo */}
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <img src="/aicte-logo.png" alt="AICTE" className="h-11 w-11 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div>
              <p className="font-display text-[17px] font-extrabold text-[#0f1f3d]">AICTE Portal</p>
              <p className="text-[11px] text-slate-400">Complaint Monitoring System</p>
            </div>
          </div>

          {/* tab switcher */}
          <div className="mb-7 flex rounded-2xl border border-slate-200 bg-slate-100/70 p-1 shadow-inner">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); reset(); }}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200",
                  tab === t
                    ? "bg-white text-[#0f1f3d] shadow-[0_2px_8px_rgb(15_31_61_/_0.12)]"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* success banner */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-[13px] font-medium text-emerald-700">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google button */}
          <GoogleButton onClick={handleGoogle} busy={googleBusy} />

          <Divider />

          {/* ── SIGN IN form ── */}
          <AnimatePresence mode="wait">
            {tab === "signin" ? (
              <motion.form key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }} onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email address <span className="text-[#FF9933]">*</span></label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); reset(); }}
                      placeholder="you@aicte.in" required className="input has-left-icon pl-11" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password <span className="text-[#FF9933]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type={showPw ? "text" : "password"} autoComplete="current-password" value={password}
                      onChange={(e) => { setPassword(e.target.value); reset(); }} placeholder="••••••••" required className="input has-left-icon pl-11 pr-10" />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {err && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-[13px] font-medium text-red-700">{err}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={busy || !email || !password}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#0f1f3d] text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(15_31_61_/_0.5)] transition-all hover:bg-[#1a3260] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <><ShieldCheck className="h-4 w-4" /> Sign in securely</>}
                </button>

                <p className="text-center text-[12px] text-slate-400">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setTab("signup"); reset(); }} className="font-semibold text-[#0f1f3d] hover:underline">
                    Register here
                  </button>
                </p>
              </motion.form>
            ) : (
              /* ── SIGN UP form ── */
              <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }} onSubmit={handleSignUp} className="space-y-4" noValidate>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Full name <span className="text-[#FF9933]">*</span></label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" autoComplete="name" value={fullName} onChange={(e) => { setFullName(e.target.value); reset(); }}
                      placeholder="Dr. Priya Sharma" required className="input has-left-icon pl-11" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email address <span className="text-[#FF9933]">*</span></label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); reset(); }}
                      placeholder="you@aicte.in" required className="input has-left-icon pl-11" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password <span className="text-[#FF9933]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type={showPw ? "text" : "password"} autoComplete="new-password" value={password}
                      onChange={(e) => { setPassword(e.target.value); reset(); }} placeholder="Min. 8 characters" required className="input has-left-icon pl-11 pr-10" />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Confirm password <span className="text-[#FF9933]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type={showPw ? "text" : "password"} autoComplete="new-password" value={confirmPw}
                      onChange={(e) => { setConfirmPw(e.target.value); reset(); }} placeholder="Re-enter password" required className="input has-left-icon pl-11" />
                  </div>
                </div>

                <AnimatePresence>
                  {err && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-[13px] font-medium text-red-700">{err}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={busy || !fullName || !email || !password || !confirmPw}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#FF9933] text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(255_153_51_/_0.55)] transition-all hover:bg-[#e68a00] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                </button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <p className="text-[11.5px] font-semibold text-slate-500">After registration</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    A verification email will be sent. Your role will be assigned by the system administrator before you can access the portal.
                  </p>
                </div>

                <p className="text-center text-[12px] text-slate-400">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setTab("signin"); reset(); }} className="font-semibold text-[#0f1f3d] hover:underline">
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-7 text-center text-[11px] text-slate-400">
            🇮🇳 <span className="font-semibold">Government of India</span> · Ministry of Education · AICTE
          </p>
        </motion.div>
      </div>
    </div>
  );
}
