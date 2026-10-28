/**
 * AICTE Complaint System — Innovation Engine
 * Provides: AI Bureau Routing, Overlap Detection, Risk Scoring, Audit Hashing
 */

import type { Complaint } from "./types";
import { BUREAUS } from "./types";

/* ────────────────────────────────────────────────
   1. AI SMART BUREAU ROUTER
   ──────────────────────────────────────────────── */

interface RoutingResult {
  bureauId: string;
  priority: "Low" | "Medium" | "High";
  confidence: number;
  isSOS: boolean;
  reason: string;
  suggestedCategory: string;
}

// Keyword maps for NLP-like bureau routing
const BUREAU_KEYWORDS: Record<string, string[]> = {
  APR: [
    "approval", "intake", "unapproved", "extension", "sanctioned", "recognition",
    "accreditation", "affiliation", "new programme", "new program", "seat increase",
    "excess admission", "regulation", "eoa", "letter of intent",
  ],
  ACD: [
    "exam", "examination", "result", "marks", "grade", "syllabus", "curriculum",
    "faculty", "professor", "teacher", "academic", "attendance", "lecture",
    "semester", "degree", "transcript", "certificate", "library",
  ],
  GRV: [
    "grievance", "harassment", "ragging", "bully", "discrimination", "complaint",
    "injustice", "unfair", "misconduct", "hostile", "threat", "mental",
    "emotional", "sexual", "abuse", "caste", "gender",
  ],
  CMP: [
    "compliance", "inspection", "norm", "mandatory disclosure", "infrastructure",
    "lab", "laboratory", "library books", "fire", "safety", "building",
    "hostel condition", "sanitation", "toilet", "water", "electricity",
  ],
  WEL: [
    "scholarship", "stipend", "financial aid", "fellowship", "welfare",
    "hostel", "canteen", "food", "medical", "health", "sports", "placement",
    "internship", "mental health", "counselling", "disability",
  ],
  PGRC: [
    "fee", "fees", "refund", "capitation", "overcharge", "donation",
    "admission fee", "tuition", "college fee", "excess collection",
  ],
};

const SOS_KEYWORDS = [
  "ragging", "sexual harassment", "suicide", "threat to life", "beaten",
  "assault", "physical abuse", "mental distress", "emergency", "urgent help",
  "blackmail", "extortion", "life threat", "dangerous",
];

export function aiBureauRouter(
  subject: string,
  description: string,
  category: string
): RoutingResult {
  const text = `${subject} ${description} ${category}`.toLowerCase();

  // SOS detection
  const sosHit = SOS_KEYWORDS.find((kw) => text.includes(kw));
  if (sosHit) {
    return {
      bureauId: "GRV",
      priority: "High",
      confidence: 98,
      isSOS: true,
      reason: `Emergency keyword detected: "${sosHit}". Routed to Grievance Cell with immediate escalation.`,
      suggestedCategory: "Ragging & Harassment",
    };
  }

  // Score each bureau
  const scores: Record<string, number> = {};
  for (const [id, keywords] of Object.entries(BUREAU_KEYWORDS)) {
    scores[id] = keywords.filter((kw) => text.includes(kw)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topId, topScore] = sorted[0];
  const [, secondScore] = sorted[1] ?? [null, 0];

  if (topScore === 0) {
    return {
      bureauId: "GRV",
      priority: "Medium",
      confidence: 40,
      isSOS: false,
      reason: "No specific bureau pattern detected. Defaulting to Grievance Cell for manual routing.",
      suggestedCategory: category || "Other",
    };
  }

  const confidence = Math.min(
    95,
    Math.round(50 + (topScore / (topScore + secondScore + 0.01)) * 45)
  );

  // Priority calculation
  const highPriorityHints = ["urgent", "emergency", "immediate", "critical", "serious", "violation"];
  const hasPriority = highPriorityHints.some((h) => text.includes(h));
  const priority = hasPriority ? "High" : topScore >= 3 ? "Medium" : "Low";

  const bureau = BUREAUS.find((b) => b.id === topId) ?? BUREAUS[0];
  const matchedKws = BUREAU_KEYWORDS[topId].filter((kw) => text.includes(kw)).slice(0, 3);

  // Suggested category
  const catMap: Record<string, string> = {
    APR: "Approvals & Recognition",
    ACD: "Examinations & Results",
    GRV: "Ragging & Harassment",
    CMP: "Infrastructure & Facilities",
    WEL: "Hostel & Student Welfare",
    PGRC: "Fees & Refunds",
  };

  return {
    bureauId: topId,
    priority,
    confidence,
    isSOS: false,
    reason: `Matched keywords: ${matchedKws.join(", ")}. Routed to ${bureau.name} (confidence: ${confidence}%).`,
    suggestedCategory: catMap[topId] ?? category,
  };
}

/* ────────────────────────────────────────────────
   2. OVERLAP DETECTION ENGINE
   ──────────────────────────────────────────────── */

export interface OverlapMatch {
  caseA: string;  // complaint ID
  caseB: string;
  score: number;  // 0–100
  reason: string;
  matchType: "exact_institution" | "subject_similarity" | "mass_grievance" | "institution_category";
  institution: string;
}

export function levenshteinSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDist = editDistance(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j - 1], dp[j]) + 1;
      prev = temp;
    }
  }
  return dp[b.length];
}

function wordOverlap(a: string, b: string): number {
  const stopWords = new Set(["the", "a", "an", "in", "of", "to", "at", "by", "for", "and", "or", "is", "has"]);
  const wordsA = a.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !stopWords.has(w));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !stopWords.has(w)));
  if (wordsA.length === 0) return 0;
  const common = wordsA.filter((w) => wordsB.has(w)).length;
  return common / Math.max(wordsA.length, wordsB.size);
}

export function detectOverlaps(complaints: Complaint[]): OverlapMatch[] {
  const results: OverlapMatch[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < complaints.length; i++) {
    for (let j = i + 1; j < complaints.length; j++) {
      const a = complaints[i];
      const b = complaints[j];
      const pairKey = [a.id, b.id].sort().join("|");
      if (seen.has(pairKey)) continue;

      // Skip if both resolved
      if (a.status === "Resolved" && b.status === "Resolved") continue;

      const sameInst = a.institution.toLowerCase() === b.institution.toLowerCase();
      const sameCat = a.category === b.category;
      const sameBureau = a.bureau === b.bureau;

      let score = 0;
      let reason = "";
      let matchType: OverlapMatch["matchType"] = "subject_similarity";

      // Exact institution + category match
      if (sameInst && sameCat) {
        score += 40;
        matchType = "institution_category";
        reason = `Same institution and category (${a.category})`;
      }

      // Subject similarity
      const subjSim = wordOverlap(a.subject, b.subject);
      if (subjSim > 0.4) {
        score += Math.round(subjSim * 35);
        reason += (reason ? " + " : "") + `Subject overlap (${Math.round(subjSim * 100)}%)`;
        matchType = "subject_similarity";
      }

      // Description similarity
      const descSim = wordOverlap(a.description, b.description);
      if (descSim > 0.3) {
        score += Math.round(descSim * 20);
        reason += (reason ? " + " : "") + `Description overlap`;
      }

      // Same bureau assignment
      if (sameBureau && sameInst) {
        score += 15;
        reason += (reason ? " + " : "") + "Same bureau & institution";
        matchType = "exact_institution";
      }

      // Mass grievance detection: 3+ complaints from same institution same category
      const massCount = complaints.filter(
        (c) => c.institution === a.institution && c.category === a.category && c.id !== a.id && c.id !== b.id
      ).length;
      if (sameInst && sameCat && massCount >= 1) {
        score += 15;
        matchType = "mass_grievance";
        reason += (reason ? " + " : "") + `Mass grievance (${massCount + 2} cases from same institution)`;
      }

      if (score >= 45) {
        seen.add(pairKey);
        results.push({
          caseA: a.id,
          caseB: b.id,
          score: Math.min(100, score),
          reason: reason || "Similar pattern detected",
          matchType,
          institution: a.institution,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/* ────────────────────────────────────────────────
   3. INSTITUTIONAL RISK SCORING
   ──────────────────────────────────────────────── */

export interface InstitutionProfile {
  name: string;
  aicteId: string;
  state: string;
  city: string;
  type: string;
  totalCases: number;
  openCases: number;
  resolvedCases: number;
  escalatedCases: number;
  overdueCount: number;
  riskScore: number;        // 0–100 (higher = more risk)
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  approvalStatus: string;
  lastActivity: string;
  bureauBreakdown: Record<string, number>;
  categories: Record<string, number>;
  complaints: Complaint[];
}

// Static institution metadata (enhanced from seed data)
const INSTITUTION_META: Record<string, { aicteId: string; state: string; city: string; type: string }> = {
  "Greenwood Institute of Technology, Pune": {
    aicteId: "MH-PUN-E-0042",
    state: "Maharashtra",
    city: "Pune",
    type: "Engineering",
  },
  "Vindhya College of Engineering, Bhopal": {
    aicteId: "MP-BHO-E-0118",
    state: "Madhya Pradesh",
    city: "Bhopal",
    type: "Engineering",
  },
  "Kaveri Institute of Management, Bengaluru": {
    aicteId: "KA-BLR-M-0237",
    state: "Karnataka",
    city: "Bengaluru",
    type: "Management",
  },
  "Northgate Technical University, Lucknow": {
    aicteId: "UP-LKO-T-0091",
    state: "Uttar Pradesh",
    city: "Lucknow",
    type: "Technical University",
  },
  "Blue Ridge College of Pharmacy, Hyderabad": {
    aicteId: "TG-HYD-P-0304",
    state: "Telangana",
    city: "Hyderabad",
    type: "Pharmacy",
  },
  "Chinar Valley Institute of Architecture, Srinagar": {
    aicteId: "JK-SRG-A-0019",
    state: "Jammu & Kashmir",
    city: "Srinagar",
    type: "Architecture",
  },
  "Coromandel College of Arts & Science, Chennai": {
    aicteId: "TN-CHN-S-0156",
    state: "Tamil Nadu",
    city: "Chennai",
    type: "Arts & Science",
  },
  "Mahanadi Institute of Technology, Raipur": {
    aicteId: "CG-RAI-E-0073",
    state: "Chhattisgarh",
    city: "Raipur",
    type: "Engineering",
  },
  "Deccan College of Agriculture, Nashik": {
    aicteId: "MH-NSK-AG-0028",
    state: "Maharashtra",
    city: "Nashik",
    type: "Agriculture",
  },
  "Hooghly Institute of Design, Kolkata": {
    aicteId: "WB-KOL-D-0065",
    state: "West Bengal",
    city: "Kolkata",
    type: "Design",
  },
  "Thar Desert College of Polytechnic, Jodhpur": {
    aicteId: "RJ-JDH-P-0142",
    state: "Rajasthan",
    city: "Jodhpur",
    type: "Polytechnic",
  },
  "Brahmaputra Valley University, Guwahati": {
    aicteId: "AS-GUW-U-0031",
    state: "Assam",
    city: "Guwahati",
    type: "University",
  },
  "Backwater Institute of Hospitality Studies, Kochi": {
    aicteId: "KL-KOC-H-0087",
    state: "Kerala",
    city: "Kochi",
    type: "Hospitality",
  },
  "Doon Valley College of Education, Dehradun": {
    aicteId: "UK-DDN-ED-0054",
    state: "Uttarakhand",
    city: "Dehradun",
    type: "Education",
  },
  "Waltair Institute of Marine Engineering, Visakhapatnam": {
    aicteId: "AP-VZG-ME-0103",
    state: "Andhra Pradesh",
    city: "Visakhapatnam",
    type: "Marine Engineering",
  },
  "Devgiri Technical Institute, Aurangabad": {
    aicteId: "MH-AUR-E-0211",
    state: "Maharashtra",
    city: "Aurangabad",
    type: "Engineering",
  },
  "Eastern Ghat College of Engineering, Bhubaneswar": {
    aicteId: "OD-BHU-E-0078",
    state: "Odisha",
    city: "Bhubaneswar",
    type: "Engineering",
  },
};

const SLA_DAYS_CONST = 14;

export function buildInstitutionProfiles(complaints: Complaint[]): InstitutionProfile[] {
  const grouped = new Map<string, Complaint[]>();

  for (const c of complaints) {
    const existing = grouped.get(c.institution) ?? [];
    existing.push(c);
    grouped.set(c.institution, existing);
  }

  const profiles: InstitutionProfile[] = [];

  for (const [name, cases] of grouped) {
    const meta = INSTITUTION_META[name] ?? {
      aicteId: `IN-XXX-${name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 999)}`,
      state: "Unknown",
      city: "Unknown",
      type: "Technical",
    };

    const totalCases = cases.length;
    const openCases = cases.filter((c) => c.status !== "Resolved").length;
    const resolvedCases = cases.filter((c) => c.status === "Resolved").length;
    const escalatedCases = cases.filter((c) => c.status === "Escalated").length;
    const overdueCount = cases.filter(
      (c) => c.status !== "Resolved" &&
        Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000) > SLA_DAYS_CONST
    ).length;

    // Risk scoring algorithm
    let riskScore = 0;
    riskScore += Math.min(40, escalatedCases * 15);    // Escalated cases (max 40)
    riskScore += Math.min(25, overdueCount * 10);       // Overdue cases (max 25)
    riskScore += Math.min(20, openCases * 4);            // Open cases (max 20)
    riskScore += Math.min(15, totalCases * 1.5);         // Volume (max 15)

    const riskLevel: InstitutionProfile["riskLevel"] =
      riskScore >= 70 ? "Critical" :
      riskScore >= 45 ? "High" :
      riskScore >= 20 ? "Medium" : "Low";

    const approvalStatus =
      riskScore >= 70 ? "⚠️ On Hold — Pending Compliance Review" :
      riskScore >= 45 ? "⚠️ Conditional — Active Investigation" :
      escalatedCases > 0 ? "Under Scrutiny" : "Active";

    const bureauBreakdown: Record<string, number> = {};
    const categories: Record<string, number> = {};
    for (const c of cases) {
      bureauBreakdown[c.bureau] = (bureauBreakdown[c.bureau] ?? 0) + 1;
      categories[c.category] = (categories[c.category] ?? 0) + 1;
    }

    const lastActivity = cases.reduce(
      (latest, c) => (c.updatedAt > latest ? c.updatedAt : latest),
      cases[0].createdAt
    );

    profiles.push({
      name,
      aicteId: meta.aicteId,
      state: meta.state,
      city: meta.city,
      type: meta.type,
      totalCases,
      openCases,
      resolvedCases,
      escalatedCases,
      overdueCount,
      riskScore: Math.min(100, Math.round(riskScore)),
      riskLevel,
      approvalStatus,
      lastActivity,
      bureauBreakdown,
      categories,
      complaints: cases,
    });
  }

  return profiles.sort((a, b) => b.riskScore - a.riskScore);
}

/* ────────────────────────────────────────────────
   4. TAMPER-PROOF AUDIT HASH (SHA-256 chain)
   ──────────────────────────────────────────────── */

export async function computeAuditHash(data: string, prevHash?: string): Promise<string> {
  const payload = `${prevHash ?? "GENESIS"}|${data}`;
  try {
    const enc = new TextEncoder().encode(payload);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16); // shortened for display
  } catch {
    // Fallback for environments without crypto.subtle
    return btoa(payload).slice(0, 16).replace(/[^a-zA-Z0-9]/g, "0");
  }
}

export function buildHashChain(complaint: Complaint): Array<{ stage: string; hash: string; prev: string }> {
  const chain: Array<{ stage: string; hash: string; prev: string }> = [];
  let prev = "GENESIS";
  for (const event of complaint.timeline) {
    const payload = `${event.stage}|${event.date}|${complaint.id}`;
    // Synchronous pseudo-hash for display (actual SHA-256 used async in component)
    const hash = btoa(prev + payload).slice(0, 16).replace(/[^a-zA-Z0-9]/g, "0");
    chain.push({ stage: event.stage, hash, prev: prev.slice(0, 8) + "…" });
    prev = hash;
  }
  return chain;
}

/* ────────────────────────────────────────────────
   5. STATE-LEVEL COMPLAINT GEO DATA
   ──────────────────────────────────────────────── */

export interface StateComplaintData {
  state: string;
  code: string;
  count: number;
  resolved: number;
  escalated: number;
  resolutionRate: number;
}

const STATE_CODES: Record<string, string> = {
  "Maharashtra": "MH",
  "Madhya Pradesh": "MP",
  "Karnataka": "KA",
  "Uttar Pradesh": "UP",
  "Telangana": "TG",
  "Jammu & Kashmir": "JK",
  "Tamil Nadu": "TN",
  "Chhattisgarh": "CG",
  "West Bengal": "WB",
  "Rajasthan": "RJ",
  "Assam": "AS",
  "Kerala": "KL",
  "Uttarakhand": "UK",
  "Andhra Pradesh": "AP",
  "Odisha": "OD",
  "Gujarat": "GJ",
  "Delhi": "DL",
  "Punjab": "PB",
  "Haryana": "HR",
  "Bihar": "BR",
};

export function buildStateData(complaints: Complaint[]): StateComplaintData[] {
  const stateMap = new Map<string, { count: number; resolved: number; escalated: number }>();

  for (const c of complaints) {
    const instMeta = INSTITUTION_META[c.institution];
    const state = instMeta?.state ?? "Unknown";
    if (state === "Unknown") continue;

    const existing = stateMap.get(state) ?? { count: 0, resolved: 0, escalated: 0 };
    existing.count += 1;
    if (c.status === "Resolved") existing.resolved += 1;
    if (c.status === "Escalated") existing.escalated += 1;
    stateMap.set(state, existing);
  }

  return Array.from(stateMap.entries()).map(([state, data]) => ({
    state,
    code: STATE_CODES[state] ?? "XX",
    count: data.count,
    resolved: data.resolved,
    escalated: data.escalated,
    resolutionRate: data.count > 0 ? Math.round((data.resolved / data.count) * 100) : 0,
  })).sort((a, b) => b.count - a.count);
}

/* ────────────────────────────────────────────────
   6. AUTOMATED ESCALATION MATRIX CHECKER
   ──────────────────────────────────────────────── */

export interface EscalationAlert {
  complaintId: string;
  level: "L1" | "L2" | "L3";
  reason: string;
  daysOverdue: number;
  suggestedAction: string;
}

export function computeEscalationAlerts(complaints: Complaint[]): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];

  for (const c of complaints) {
    if (c.status === "Resolved") continue;
    const days = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000);

    if (days > 45 || c.status === "Escalated" && days > 30) {
      alerts.push({
        complaintId: c.id,
        level: "L3",
        reason: `Case open for ${days} days — requires Member Secretary intervention`,
        daysOverdue: days - SLA_DAYS_CONST,
        suggestedAction: "Escalate to Chairman/Member Secretary for final disposal order",
      });
    } else if (days > 25) {
      alerts.push({
        complaintId: c.id,
        level: "L2",
        reason: `SLA breach by ${days - SLA_DAYS_CONST} days — Bureau Head review required`,
        daysOverdue: days - SLA_DAYS_CONST,
        suggestedAction: "Assign to Bureau Head / Regional Director for immediate review",
      });
    } else if (days > SLA_DAYS_CONST) {
      alerts.push({
        complaintId: c.id,
        level: "L1",
        reason: `SLA exceeded — Desk Officer action pending`,
        daysOverdue: days - SLA_DAYS_CONST,
        suggestedAction: "Desk officer to update status and provide response to complainant",
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { L3: 0, L2: 1, L1: 2 };
    return order[a.level] - order[b.level] || b.daysOverdue - a.daysOverdue;
  });
}
