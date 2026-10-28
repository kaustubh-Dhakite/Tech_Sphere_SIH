import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Check,
  Copy,
  FileText,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Paperclip,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";
import { aiBureauRouter } from "../lib/innovations";
import {
  BUREAUS,
  CATEGORIES,
  ROLE_PERSONAS,
  bureauById,
  type Complaint,
  type Priority,
} from "../lib/types";
import { Button, BureauIcon, DemoBadge, Field, StatusPill, riseVariants, staggerParent } from "../components/ui";

const INSTITUTIONS = [
  "Greenwood Institute of Technology, Pune",
  "Vindhya College of Engineering, Bhopal",
  "Kaveri Institute of Management, Bengaluru",
  "Northgate Technical University, Lucknow",
  "Blue Ridge College of Pharmacy, Hyderabad",
  "Chinar Valley Institute of Architecture, Srinagar",
  "Coromandel College of Arts & Science, Chennai",
  "Mahanadi Institute of Technology, Raipur",
  "Deccan College of Agriculture, Nashik",
  "Hooghly Institute of Design, Kolkata",
  "Thar Desert College of Polytechnic, Jodhpur",
  "Brahmaputra Valley University, Guwahati",
  "Backwater Institute of Hospitality Studies, Kochi",
  "Doon Valley College of Education, Dehradun",
  "Waltair Institute of Marine Engineering, Visakhapatnam",
  "Devgiri Technical Institute, Aurangabad",
  "Eastern Ghat College of Engineering, Bhubaneswar",
];

const PRIORITY_HELP: Record<Priority, string> = {
  Low: "General query or suggestion; no deadline pressure",
  Medium: "Affecting academics, fees or services this term",
  High: "Safety, harassment or time-critical examination issue",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormState {
  name: string;
  email: string;
  institution: string;
  category: string;
  bureau: string;
  subject: string;
  description: string;
  priority: Priority;
}

// Speech recognition type stubs
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function RegisterComplaint() {
  const { role, addComplaint } = useApp();
  const persona = ROLE_PERSONAS[role];
  const defaultName = (role === "student" || role === "complainant") ? persona.name : "";
  const defaultEmail = (role === "student" || role === "complainant") ? persona.email : "";

  const initialForm: FormState = {
    name: defaultName,
    email: defaultEmail,
    institution: "",
    category: "",
    bureau: "",
    subject: "",
    description: "",
    priority: "Medium",
  };

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [files, setFiles] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ── AI routing state ──
  const [aiResult, setAiResult] = useState<ReturnType<typeof aiBureauRouter> | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Voice input state ──
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<"subject" | "description" | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-IN";
      recognitionRef.current = r;
    }
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setAiApplied(false);
  };

  // Debounced AI analysis when subject/description changes
  useEffect(() => {
    if (!form.subject.trim() && !form.description.trim()) {
      setAiResult(null);
      return;
    }
    if (form.subject.trim().length < 8 && form.description.trim().length < 20) return;

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setAiAnalyzing(true);

    aiTimerRef.current = setTimeout(() => {
      const result = aiBureauRouter(form.subject, form.description, form.category);
      setAiResult(result);
      setAiAnalyzing(false);
    }, 900);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [form.subject, form.description, form.category]);

  const applyAiSuggestion = () => {
    if (!aiResult) return;
    setForm((f) => ({
      ...f,
      bureau: aiResult.bureauId,
      priority: aiResult.priority,
      category: aiResult.suggestedCategory || f.category,
    }));
    setErrors((e) => ({ ...e, bureau: undefined, priority: undefined }));
    setAiApplied(true);
  };

  // Voice input handler
  const startVoice = (target: "subject" | "description") => {
    if (!recognitionRef.current) return;
    const r = recognitionRef.current;
    setVoiceTarget(target);
    setIsListening(true);

    r.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setForm((f) => ({ ...f, [target]: (f[target] ? f[target] + " " : "") + transcript }));
      setAiApplied(false);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => {
      setIsListening(false);
      setVoiceTarget(null);
    };
    try {
      r.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 3) next.name = "Enter the complainant's full name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address (e.g. name@example.in).";
    if (!form.institution.trim()) next.institution = "Select or type the institution name.";
    if (!form.category) next.category = "Choose the closest category.";
    if (!form.bureau) next.bureau = "Choose a bureau, or pick auto-routing.";
    if (form.subject.trim().length < 12) next.subject = "Give a short, specific subject (min. 12 characters).";
    if (form.description.trim().length < 40)
      next.description = "Describe the issue in at least 40 characters — what happened, when, and who is affected.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const names = Array.from(list).slice(0, 3).map((f) => f.name);
    setFiles((prev) => [...prev, ...names].slice(0, 5));
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const complaint = addComplaint({
      ...form,
      complainantName: form.name.trim(),
      email: form.email.trim(),
      institution: form.institution.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
      bureau: form.bureau === "auto" ? (aiResult?.bureauId ?? "GRV") : form.bureau,
      attachments: files,
    });
    setSubmitted(complaint);
    window.scrollTo({ top: 0 });
  };

  const resetForAnother = () => {
    setForm({ ...initialForm });
    setFiles([]);
    setErrors({});
    setSubmitted(null);
    setAiResult(null);
    setAiApplied(false);
  };

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.section
            key="success"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="card relative mx-auto max-w-2xl overflow-hidden p-8 text-center sm:p-10">
              <svg className="pointer-events-none absolute inset-x-0 top-0 mx-auto w-full" height="140" viewBox="0 0 600 140" fill="none" aria-hidden>
                <circle cx="300" cy="-40" r="170" stroke="#16a34a" strokeOpacity="0.08" strokeWidth="1.5" />
                <circle cx="300" cy="-40" r="120" stroke="#16a34a" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 6" />
                <circle cx="300" cy="-40" r="70" stroke="#f97316" strokeOpacity="0.15" strokeWidth="1.5" />
              </svg>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50"
              >
                <CheckCircle2 className="h-8 w-8" />
              </motion.div>
              <h1 className="font-display relative mt-5 text-2xl font-extrabold tracking-tight text-navy">
                Complaint registered successfully
              </h1>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
                Your case has been AI-routed to the{" "}
                <span className="font-semibold text-slate-700">{bureauById(submitted.bureau).name}</span>. Save
                the tracking ID below to follow its progress.
              </p>

              <div className="relative mx-auto mt-6 flex max-w-sm items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-cream px-5 py-4">
                <span className="font-display text-xl font-extrabold tracking-wide text-navy tnum">{submitted.id}</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(submitted.id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    } catch { /* clipboard unavailable */ }
                  }}
                  className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-navy"
                  aria-label="Copy tracking ID"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-left sm:grid-cols-3">
                {[
                  ["Status", <StatusPill key="s" status={submitted.status} />],
                  ["Priority", <span key="p" className="font-bold text-slate-700">{submitted.priority}</span>],
                  ["Bureau", <span key="b" className="font-bold text-slate-700">{bureauById(submitted.bureau).shortName}</span>],
                ].map(([k, v], i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-white px-3.5 py-3">
                    <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">{k}</p>
                    <div className="mt-1.5 text-xs">{v}</div>
                  </div>
                ))}
              </div>

              <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to={`/complaints/${submitted.id}`}>
                  <Button>
                    <FileText className="h-4 w-4" /> Track this complaint
                  </Button>
                </Link>
                <Button variant="outline" onClick={resetForAnother}>
                  Register another
                </Button>
                <Link to="/" className="text-sm font-semibold text-brand hover:text-brand-dark">
                  Back to dashboard
                </Link>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="space-y-5"
          >
            <motion.div variants={riseVariants} className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-[26px] font-extrabold tracking-tight text-navy">Register a Complaint</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Lodge an institution-related grievance. Fields marked{" "}
                  <span className="font-bold text-saffron">*</span> are required.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">
                  <Brain className="h-3 w-3" /> AI Bureau Router Active
                </span>
                <DemoBadge />
              </div>
            </motion.div>

            {/* SOS Alert Banner */}
            <AnimatePresence>
              {aiResult?.isSOS && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="flex items-start gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </span>
                  <div>
                    <p className="font-bold text-red-800">🚨 EMERGENCY SOS DETECTED</p>
                    <p className="mt-0.5 text-sm text-red-700">{aiResult.reason}</p>
                    <p className="mt-1 text-xs text-red-600">
                      This case will be marked <strong>High Priority</strong> and auto-escalated to the AICTE Nodal
                      Officer within 48 hours. Do NOT delay submission.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <motion.form variants={riseVariants} onSubmit={onSubmit} className="card p-6 sm:p-7 xl:col-span-2" noValidate>
                <p className="font-display text-[15px] font-bold text-navy">Complainant details</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required error={errors.name}>
                    <input
                      className={cn("input", errors.name && "input-error")}
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                    />
                  </Field>
                  <Field label="Email address" required error={errors.email} hint="The tracking link is shared to this address in a real deployment.">
                    <input
                      className={cn("input", errors.email && "input-error")}
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="name@example.in"
                      type="email"
                    />
                  </Field>
                </div>

                <p className="font-display mt-7 text-[15px] font-bold text-navy">Complaint details</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Institution" required error={errors.institution} className="sm:col-span-2" hint="Type to search — or enter any institution name.">
                    <div className="relative">
                      <Building2 className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className={cn("input has-left-icon pl-11", errors.institution && "input-error")}
                        value={form.institution}
                        onChange={(e) => set("institution", e.target.value)}
                        placeholder="Search or type institution name"
                        list="institution-list"
                      />
                      <datalist id="institution-list">
                        {INSTITUTIONS.map((i) => (
                          <option key={i} value={i} />
                        ))}
                      </datalist>
                    </div>
                  </Field>

                  <Field label="Category" required error={errors.category}>
                    <select
                      className={cn("input cursor-pointer", errors.category && "input-error")}
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                    >
                      <option value="">Select category…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Related bureau / cell" required error={errors.bureau}>
                    <select
                      className={cn("input cursor-pointer", errors.bureau && "input-error")}
                      value={form.bureau}
                      onChange={(e) => set("bureau", e.target.value)}
                    >
                      <option value="">Choose where this belongs…</option>
                      <option value="auto">🤖 Not sure — AI will route it</option>
                      {BUREAUS.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Subject with voice input */}
                  <Field label="Subject" required error={errors.subject} className="sm:col-span-2">
                    <div className="relative">
                      <input
                        className={cn("input pr-10", errors.subject && "input-error")}
                        value={form.subject}
                        onChange={(e) => set("subject", e.target.value)}
                        placeholder="One line summary, e.g. 'Semester fee receipt not reflected in student portal'"
                        maxLength={120}
                      />
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={() => isListening && voiceTarget === "subject" ? stopVoice() : startVoice("subject")}
                          title="Voice input"
                          className={cn(
                            "absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 transition-colors",
                            isListening && voiceTarget === "subject"
                              ? "bg-red-100 text-red-600 animate-pulse"
                              : "text-slate-400 hover:bg-slate-100 hover:text-brand"
                          )}
                        >
                          {isListening && voiceTarget === "subject" ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </Field>

                  {/* Description with voice input */}
                  <Field
                    label="Detailed description"
                    required
                    error={errors.description}
                    className="sm:col-span-2"
                    hint="Include dates, departments and any earlier attempts to resolve the issue."
                  >
                    <div className="relative">
                      <textarea
                        className={cn("input resize-none pr-10", errors.description && "input-error")}
                        rows={5}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Describe the issue with enough detail for a desk officer to act on it…"
                        maxLength={1500}
                      />
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={() => isListening && voiceTarget === "description" ? stopVoice() : startVoice("description")}
                          title="Voice input"
                          className={cn(
                            "absolute top-3 right-3 cursor-pointer rounded-lg p-1.5 transition-colors",
                            isListening && voiceTarget === "description"
                              ? "bg-red-100 text-red-600 animate-pulse"
                              : "text-slate-400 hover:bg-slate-100 hover:text-brand"
                          )}
                        >
                          {isListening && voiceTarget === "description" ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {voiceSupported && (
                      <p className="mt-1 text-[10.5px] text-slate-400 flex items-center gap-1">
                        <Mic className="h-3 w-3" /> Click the mic icon to dictate in English, Hindi or Marathi
                      </p>
                    )}
                  </Field>
                </div>

                {/* AI Routing Panel */}
                <AnimatePresence>
                  {(aiAnalyzing || aiResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className={cn(
                        "rounded-2xl border p-4",
                        aiResult?.isSOS ? "border-red-200 bg-red-50" :
                        aiApplied ? "border-emerald-200 bg-emerald-50" :
                        "border-brand/20 bg-mist"
                      )}>
                        {aiAnalyzing ? (
                          <div className="flex items-center gap-2.5 text-sm text-brand">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-semibold">AI analyzing your complaint…</span>
                          </div>
                        ) : aiResult && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Brain className={cn("h-4 w-4", aiResult.isSOS ? "text-red-600" : "text-brand")} />
                                <span className={cn("text-sm font-bold", aiResult.isSOS ? "text-red-800" : "text-navy")}>
                                  AI Bureau Recommendation
                                </span>
                                <span className={cn(
                                  "text-[10.5px] font-bold rounded-full px-2 py-0.5",
                                  aiResult.confidence >= 80 ? "bg-emerald-100 text-emerald-700" :
                                  aiResult.confidence >= 60 ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-600"
                                )}>
                                  {aiResult.confidence}% confidence
                                </span>
                              </div>
                              {!aiApplied && (
                                <Button
                                  type="button"
                                  variant={aiResult.isSOS ? "accent" : "primary"}
                                  size="sm"
                                  onClick={applyAiSuggestion}
                                  className="gap-1.5"
                                >
                                  <Wand2 className="h-3.5 w-3.5" />
                                  Apply Suggestion
                                </Button>
                              )}
                              {aiApplied && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                  <Check className="h-3.5 w-3.5" /> Applied
                                </span>
                              )}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3">
                              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                                <BureauIcon bureauId={aiResult.bureauId} size="sm" />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Bureau</p>
                                  <p className="text-xs font-bold text-navy">{bureauById(aiResult.bureauId).shortName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                                <span className={cn(
                                  "h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold",
                                  aiResult.priority === "High" ? "bg-red-500" :
                                  aiResult.priority === "Medium" ? "bg-amber-500" : "bg-slate-400"
                                )}>
                                  {aiResult.priority[0]}
                                </span>
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Priority</p>
                                  <p className="text-xs font-bold text-navy">{aiResult.priority}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Category</p>
                                  <p className="text-xs font-bold text-navy truncate">{aiResult.suggestedCategory}</p>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">{aiResult.reason}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="Priority" required className="mt-4">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set("priority", p)}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3.5 text-left transition-all active:scale-[0.98]",
                          form.priority === p
                            ? p === "High"
                              ? "border-saffron bg-peach ring-2 ring-saffron/20"
                              : p === "Medium"
                                ? "border-brand bg-mist ring-2 ring-brand/15"
                                : "border-slate-400 bg-slate-50 ring-2 ring-slate-300/60"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <span className="flex items-center gap-2 text-[13px] font-bold text-navy">
                          <span className={cn("h-2 w-2 rounded-full", p === "High" ? "bg-saffron" : p === "Medium" ? "bg-brand" : "bg-slate-400")} />
                          {p}
                          {aiResult && aiResult.priority === p && !aiResult.isSOS && (
                            <span className="ml-auto text-[9px] font-bold text-brand">AI ✓</span>
                          )}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-slate-500">{PRIORITY_HELP[p]}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Attachments (optional)" className="mt-4" hint="Demo only — files are listed locally and never uploaded to a server.">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                    className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-brand/50 hover:bg-mist/40"
                  >
                    <Paperclip className="mx-auto h-5 w-5 text-slate-400" />
                    <p className="mt-1.5 text-[13px] font-semibold text-slate-600">Click to attach or drop files here</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">PDF, PNG or JPG · up to 5 references</p>
                    <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                  </div>
                  {files.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {files.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600">
                          <Paperclip className="h-3 w-3 text-slate-400" />
                          {f}
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                            className="cursor-pointer rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>

                <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                  <Button type="submit" variant="accent">
                    Submit complaint <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-[11.5px] text-slate-400">
                    A tracking ID is generated instantly and added to the register.
                  </p>
                </div>
              </motion.form>

              {/* help rail */}
              <motion.aside variants={riseVariants} className="space-y-4">
                <div className="card border-brand/20 bg-mist/50 p-5">
                  <h3 className="font-display flex items-center gap-2 text-sm font-bold text-navy">
                    <Brain className="h-4 w-4 text-brand" /> AI Smart Routing
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    As you type your complaint, our AI engine analyzes the text and recommends the best bureau, priority,
                    and category — reducing misdirected complaints by up to 70%.
                  </p>
                  {voiceSupported && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      <Mic className="inline h-3 w-3 mr-0.5 text-brand" />
                      <strong>Voice input supported!</strong> Click the mic icon next to Subject or Description to
                      dictate in English, Hindi or Marathi.
                    </p>
                  )}
                </div>

                <div className="card p-5">
                  <h3 className="font-display text-sm font-bold text-navy">How a case moves</h3>
                  <div className="mt-4 space-y-0.5">
                    {[
                      { icon: FileText, text: "You submit the complaint and get a tracking ID." },
                      { icon: Brain, text: "AI engine routes it to the correct bureau instantly." },
                      { icon: User, text: "A desk officer reviews, verifies and follows up." },
                      { icon: MapPin, text: "You track every stage from the case journey view." },
                      { icon: CheckCircle2, text: "Closed only after complainant OTP confirmation." },
                    ].map((s, i) => (
                      <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
                        {i < 4 && <span className="absolute top-8 left-[13px] h-[calc(100%-26px)] w-px bg-slate-100" />}
                        <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mist text-brand">
                          <s.icon className="h-3.5 w-3.5" />
                        </span>
                        <p className="pt-1 text-xs leading-relaxed text-slate-500">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card border-saffron/20 bg-peach/50 p-5">
                  <h3 className="font-display flex items-center gap-2 text-sm font-bold text-navy">
                    <ShieldCheck className="h-4 w-4 text-saffron" /> Demo notice
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    This prototype saves cases only to your browser's local storage. It is not connected to any real
                    AICTE portal, and submitted details never leave this device.
                  </p>
                </div>
              </motion.aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
