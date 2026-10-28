export type Role = "complainant" | "officer" | "admin";

export type Status = "Submitted" | "Under Review" | "In Progress" | "Resolved" | "Escalated";

export type Priority = "Low" | "Medium" | "High";

export interface TimelineEvent {
  stage: string;
  label: string;
  date: string; // ISO
  detail?: string;
}

export interface CaseNote {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  date: string; // ISO
  internal: boolean;
}

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  complainantName: string;
  email: string;
  institution: string;
  category: string;
  bureau: string; // bureau id
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  timeline: TimelineEvent[];
  notes: CaseNote[];
}

export interface BureauDef {
  id: string;
  name: string;
  shortName: string;
  officer: string;
  email: string;
  color: string; // hex accent
  soft: string; // soft bg hex
  icon: "approval" | "academic" | "grievance" | "compliance" | "welfare";
  description: string;
}

export type NotificationType = "new" | "escalation" | "overdue" | "resolved" | "note" | "info";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
  complaintId?: string;
}

export interface NewComplaintInput {
  subject: string;
  description: string;
  complainantName: string;
  email: string;
  institution: string;
  category: string;
  bureau: string;
  priority: Priority;
  attachments: string[];
}

export interface Persona {
  name: string;
  title: string;
  email: string;
  initials: string;
}

export const BUREAUS: BureauDef[] = [
  {
    id: "APR",
    name: "Approval Bureau",
    shortName: "Approval",
    officer: "R. Venkatesh",
    email: "approval.desk@casebridge-demo.in",
    color: "#2563eb",
    soft: "#eff6ff",
    icon: "approval",
    description: "Extensions of approval, intake verification and new programme approvals.",
  },
  {
    id: "ACD",
    name: "Academic Bureau",
    shortName: "Academic",
    officer: "S. Bhattacharya",
    email: "academic.desk@casebridge-demo.in",
    color: "#0d9488",
    soft: "#f0fdfa",
    icon: "academic",
    description: "Curriculum, examinations, results, faculty strength and academic quality.",
  },
  {
    id: "GRV",
    name: "Grievance Cell",
    shortName: "Grievance",
    officer: "M. Krishnan",
    email: "grievance.desk@casebridge-demo.in",
    color: "#f97316",
    soft: "#fff3e8",
    icon: "grievance",
    description: "Student and staff grievances, conduct matters and fee disputes.",
  },
  {
    id: "CMP",
    name: "Compliance & Inspection Cell",
    shortName: "Compliance",
    officer: "A. Deshmukh",
    email: "compliance.desk@casebridge-demo.in",
    color: "#b45309",
    soft: "#fffbeb",
    icon: "compliance",
    description: "Norm adherence, mandatory disclosure and inspection follow-ups.",
  },
  {
    id: "WEL",
    name: "Student Welfare & Scholarship Cell",
    shortName: "Welfare",
    officer: "P. Chatterjee",
    email: "welfare.desk@casebridge-demo.in",
    color: "#16a34a",
    soft: "#f0fdf4",
    icon: "welfare",
    description: "Scholarships, hostel amenities, health services and student support.",
  },
];

export const CATEGORIES = [
  "Admissions & Enrolment",
  "Fees & Refunds",
  "Examinations & Results",
  "Scholarships & Financial Aid",
  "Faculty & Staff",
  "Infrastructure & Facilities",
  "Hostel & Student Welfare",
  "Ragging & Harassment",
  "Approvals & Recognition",
  "Certificates & Documents",
  "Other",
];

export const STATUSES: Status[] = ["Submitted", "Under Review", "In Progress", "Resolved", "Escalated"];

export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

export const ROLE_PERSONAS: Record<Role, Persona> = {
  complainant: {
    name: "Aarav Sharma",
    title: "Student Complainant",
    email: "aarav.demo@example.in",
    initials: "AS",
  },
  officer: {
    name: "Meera Krishnan",
    title: "Desk Officer · Grievance Cell",
    email: "grievance.desk@casebridge-demo.in",
    initials: "MK",
  },
  admin: {
    name: "Rohan Iyer",
    title: "System Administrator",
    email: "admin@casebridge-demo.in",
    initials: "RI",
  },
};

export const OFFICER_BUREAU = "GRV";

export const DEMO_COMPLAINANT_EMAIL = "aarav.demo@example.in";

/** SLA target used for demo stats (days) */
export const SLA_DAYS = 14;

export const bureauById = (id: string): BureauDef =>
  BUREAUS.find((b) => b.id === id) ?? BUREAUS[2];
