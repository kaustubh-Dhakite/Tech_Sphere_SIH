import type {
  AppNotification,
  CaseNote,
  Complaint,
  Priority,
  Status,
  TimelineEvent,
} from "./types";
import { bureauById } from "./types";

const DAY = 86400000;

/** ISO timestamp `daysAgo` days in the past */
function at(daysAgo: number, h = 10, m = 14): string {
  const t = new Date(Date.now() - daysAgo * DAY);
  t.setHours(h, m, 0, 0);
  return t.toISOString();
}

/** ISO timestamp `days` after a given ISO date */
function shift(iso: string, days: number, h = 12): string {
  const t = new Date(new Date(iso).getTime() + days * DAY);
  t.setHours(h, 40, 0, 0);
  return t.toISOString();
}

interface SeedNote {
  author: string;
  role: string;
  text: string;
  day: number; // days after creation
  internal: boolean;
}

interface SeedRow {
  subject: string;
  description: string;
  complainantName: string;
  email: string;
  institution: string;
  category: string;
  bureau: string;
  priority: Priority;
  status: Status;
  daysAgo: number;
  resolvedAfter?: number;
  escalatedAfter?: number;
  attachments?: string[];
  notes?: SeedNote[];
}

const ROWS: SeedRow[] = [
  {
    subject: "Unapproved intake increase in B.Tech Computer Science",
    description:
      "The institute appears to have admitted nearly 180 students against the approved intake of 120 in the CSE programme without a visible extension of approval. Requesting verification of the sanctioned intake for AY 2025-26, as overcrowded sections are affecting lab rotations and project mentoring.",
    complainantName: "Rohit Verma",
    email: "rohit.verma.demo@example.in",
    institution: "Greenwood Institute of Technology, Pune",
    category: "Approvals & Recognition",
    bureau: "APR",
    priority: "High",
    status: "Escalated",
    daysAgo: 41,
    escalatedAfter: 12,
    notes: [
      {
        author: "R. Venkatesh",
        role: "Approval Bureau",
        text: "Records requested from the institute through the regional office. Awaiting the approved intake letter for AY 2025-26.",
        day: 8,
        internal: false,
      },
      {
        author: "R. Venkatesh",
        role: "Approval Bureau",
        text: "Escalated to headquarters — institute has not responded within the stipulated window despite two reminders.",
        day: 12,
        internal: true,
      },
    ],
  },
  {
    subject: "Clarification on re-submission of EOA documents",
    description:
      "Our institute re-uploaded the deficiency documents for Extension of Approval two weeks ago, but the portal still shows 'deficiency memo open'. Seeking confirmation that the compliance report has been received and is in queue for review.",
    complainantName: "Dr. Kavita Deshpande",
    email: "kavita.d.demosample@example.in",
    institution: "Blue Ridge College of Pharmacy, Hyderabad",
    category: "Approvals & Recognition",
    bureau: "APR",
    priority: "Medium",
    status: "Under Review",
    daysAgo: 9,
    notes: [
      {
        author: "R. Venkatesh",
        role: "Approval Bureau",
        text: "Documents located in the re-submission queue. Forwarded to the scrutiny officer for verification.",
        day: 5,
        internal: true,
      },
    ],
  },
  {
    subject: "Advertised intake does not match approved intake on website",
    description:
      "The admission brochure and website of the institute advertise 240 seats for the MBA programme, while the approval letter issued for the current year mentions 180. This mismatch may mislead applicants during counselling; requesting clarification and correction of the public disclosure.",
    complainantName: "Meghana Iyer",
    email: "meghana.iyer.demo@example.in",
    institution: "Kaveri Institute of Management, Bengaluru",
    category: "Approvals & Recognition",
    bureau: "APR",
    priority: "High",
    status: "In Progress",
    daysAgo: 33,
    notes: [
      {
        author: "R. Venkatesh",
        role: "Approval Bureau",
        text: "Primary verification complete — approval letter confirms 180 seats. Institute asked to correct disclosures within 10 working days.",
        day: 18,
        internal: false,
      },
    ],
  },
  {
    subject: "Approval renewal pending for PG pharmacy programme",
    description:
      "The renewal application for the M.Pharm programme was submitted well before the deadline with complete documents. The status has not moved from 'under scrutiny' for over a month, and the institute is unable to begin admission counselling for the PG batch.",
    complainantName: "Prof. Naveen Kulkarni",
    email: "naveen.k.demo@example.in",
    institution: "Blue Ridge College of Pharmacy, Hyderabad",
    category: "Admissions & Enrolment",
    bureau: "APR",
    priority: "Medium",
    status: "Submitted",
    daysAgo: 4,
  },
  {
    subject: "Status of new programme approval (AI & Data Science)",
    description:
      "Enquiry regarding the outcome of the application for starting a new B.Tech programme in Artificial Intelligence and Data Science from the coming academic session. All expert committee interactions have been completed.",
    complainantName: "Dr. Farida Ansari",
    email: "farida.a.demo@example.in",
    institution: "Mahanadi Institute of Technology, Raipur",
    category: "Approvals & Recognition",
    bureau: "APR",
    priority: "Low",
    status: "Resolved",
    daysAgo: 96,
    resolvedAfter: 11,
    notes: [
      {
        author: "R. Venkatesh",
        role: "Approval Bureau",
        text: "Approval letter has been generated and communicated to the institute. Closing the case.",
        day: 11,
        internal: false,
      },
    ],
  },
  {
    subject: "Revaluation result for semester examination pending",
    description:
      "I applied for revaluation of two answer scripts in the fifth semester examination and paid the prescribed fee. Eight weeks have passed but the revised result is still not published, which is blocking my internship joining formalities.",
    complainantName: "Aarav Sharma",
    email: "aarav.demo@example.in",
    institution: "Greenwood Institute of Technology, Pune",
    category: "Examinations & Results",
    bureau: "ACD",
    priority: "Medium",
    status: "Resolved",
    daysAgo: 68,
    resolvedAfter: 13,
    notes: [
      {
        author: "S. Bhattacharya",
        role: "Academic Bureau",
        text: "Controller of Examinations confirmed that the revaluation results were published on the institute portal on 12th of this month.",
        day: 12,
        internal: false,
      },
      {
        author: "S. Bhattacharya",
        role: "Academic Bureau",
        text: "Verified publication; institute advised to alert affected students by SMS. Marking resolved.",
        day: 13,
        internal: true,
      },
    ],
  },
  {
    subject: "Internship credits not reflected in grade sheet",
    description:
      "Completed a six-week industry internship as per the curriculum and submitted the evaluation report through the faculty coordinator, but the credits are missing in the provisional grade sheet. Examination cell says the entry was never received.",
    complainantName: "Sneha Kulkarni",
    email: "sneha.k.demo@example.in",
    institution: "Vindhya College of Engineering, Bhopal",
    category: "Examinations & Results",
    bureau: "ACD",
    priority: "Medium",
    status: "In Progress",
    daysAgo: 21,
    notes: [
      {
        author: "S. Bhattacharya",
        role: "Academic Bureau",
        text: "Asked the coordinator to route the evaluation report with due signatures. Awaiting confirmation from the exam cell.",
        day: 9,
        internal: true,
      },
    ],
  },
  {
    subject: "Request for transparent attendance policy publication",
    description:
      "Attendance shortage notices are being issued without the calculation method being published anywhere. Requesting that the institute publish the attendance policy, condonation rules and monthly attendance records for transparency.",
    complainantName: "Arjun Mehta",
    email: "arjun.m.demo@example.in",
    institution: "Northgate Technical University, Lucknow",
    category: "Other",
    bureau: "ACD",
    priority: "Low",
    status: "Resolved",
    daysAgo: 120,
    resolvedAfter: 16,
    notes: [
      {
        author: "S. Bhattacharya",
        role: "Academic Bureau",
        text: "Institute has published the attendance policy on its website and notice boards after our advisory. Resolved at bureau level.",
        day: 16,
        internal: false,
      },
    ],
  },
  {
    subject: "Severe faculty shortage in Civil Engineering department",
    description:
      "The Civil Engineering department is running third-year core subjects with only two regular faculty members. Guest lectures are irregular and CAD lab sessions have been cancelled repeatedly this semester, affecting project work.",
    complainantName: "Ishita Choudhary",
    email: "ishita.c.demo@example.in",
    institution: "Vindhya College of Engineering, Bhopal",
    category: "Faculty & Staff",
    bureau: "ACD",
    priority: "High",
    status: "In Progress",
    daysAgo: 27,
    notes: [
      {
        author: "S. Bhattacharya",
        role: "Academic Bureau",
        text: "Faculty cadre data sought from the institute. Preliminary look indicates 5 vacant posts against sanctioned strength.",
        day: 12,
        internal: true,
      },
      {
        author: "S. Bhattacharya",
        role: "Academic Bureau",
        text: "Institute informed that recruitment interviews are scheduled next month. Progress note shared with the complainant.",
        day: 20,
        internal: false,
      },
    ],
  },
  {
    subject: "Mid-semester examination timetable clash",
    description:
      "Two core papers in the EEE branch have been scheduled on the same morning in the upcoming mid-semester examination. Department office has not responded to representations from the class committee.",
    complainantName: "Aditya Rao",
    email: "aditya.rao.demo@example.in",
    institution: "Waltair Institute of Marine Engineering, Visakhapatnam",
    category: "Examinations & Results",
    bureau: "ACD",
    priority: "Low",
    status: "Submitted",
    daysAgo: 2,
  },
  {
    subject: "Ragging complaint by first-year student — inquiry pending",
    description:
      "A ragging incident involving first-year hostel residents was reported to the hostel warden and the anti-ragging squad last month. No inquiry committee meeting has been communicated so far and the affected students are anxious about their safety.",
    complainantName: "Parent of first-year student",
    email: "guardian.demo@example.in",
    institution: "Thar Desert College of Polytechnic, Jodhpur",
    category: "Ragging & Harassment",
    bureau: "GRV",
    priority: "High",
    status: "Escalated",
    daysAgo: 25,
    escalatedAfter: 9,
    notes: [
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Spoke to the nodal officer. Interim safety measures confirmed for the complainants; formal inquiry minutes awaited.",
        day: 6,
        internal: true,
      },
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Escalated to the regional office as the inquiry committee has not convened within the mandated period.",
        day: 9,
        internal: true,
      },
    ],
  },
  {
    subject: "Online fee payment not updated in student portal",
    description:
      "Semester fee was paid through the institute payment gateway and the bank reference shows a successful debit, but the student portal continues to display 'fee due'. The accounts section says reconciliation will take more time; meanwhile a late-fee notice has been generated.",
    complainantName: "Mohammed Faiz",
    email: "m.faiz.demo@example.in",
    institution: "Brahmaputra Valley University, Guwahati",
    category: "Fees & Refunds",
    bureau: "GRV",
    priority: "Medium",
    status: "Under Review",
    daysAgo: 16,
    attachments: ["bank-reference-88213.pdf"],
    notes: [
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Payment reference shared with the institute finance officer. Reconciliation expected this week; late fee to be waived once confirmed.",
        day: 11,
        internal: false,
      },
    ],
  },
  {
    subject: "Request for change of project supervisor",
    description:
      "My final-year project guide has been on extended leave and has not responded to review requests for over five weeks. The project mid-review is scheduled soon; requesting the department to allot an alternate supervisor so the timeline is not affected.",
    complainantName: "Priyanka Nair",
    email: "priyanka.n.demo@example.in",
      institution: "Backwater Institute of Hospitality Studies, Kochi",
      category: "Faculty & Staff",
    bureau: "GRV",
    priority: "Medium",
    status: "In Progress",
    daysAgo: 19,
    notes: [
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Department head has agreed in principle to map affected students to a co-guide. Written order awaited.",
        day: 8,
        internal: true,
      },
    ],
  },
  {
    subject: "Delay in issuance of migration certificate",
    description:
      "Applied for a migration certificate after completing the diploma programme, with all dues cleared and the application accepted at the counter. The certificate has not been issued even after the stated 15 working days, which is delaying my degree admission elsewhere.",
    complainantName: "Tanmoy Das",
    email: "tanmoy.d.demo@example.in",
    institution: "Thar Desert College of Polytechnic, Jodhpur",
    category: "Certificates & Documents",
    bureau: "GRV",
    priority: "Low",
    status: "Resolved",
    daysAgo: 74,
    resolvedAfter: 10,
    notes: [
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Certificate dispatched by speed post; tracking details shared with the complainant. Closing.",
        day: 10,
        internal: false,
      },
    ],
  },
  {
    subject: "Unprofessional conduct by administrative staff member",
    description:
      "During a document verification visit, a member of the administrative staff spoke to students and parents in an abusive manner and refused to accept a duly filled form without a 'facilitation' payment. Requesting an impartial review of the incident.",
    complainantName: "Sunita Pawar",
    email: "sunita.p.demo@example.in",
    institution: "Deccan College of Agriculture, Nashik",
    category: "Ragging & Harassment",
    bureau: "GRV",
    priority: "High",
    status: "Under Review",
    daysAgo: 11,
    notes: [
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Preliminary statements recorded. Matter is sensitive — restricting details to the investigating officers.",
        day: 6,
        internal: true,
      },
    ],
  },
  {
    subject: "Hostel mess food quality deteriorating",
    description:
      "Over the past two months the quality of food served in the boys' hostel mess has fallen sharply — stale items served at breakfast and repeated watery dal at dinner. The mess committee has not acted on the feedback register entries.",
    complainantName: "Raghav Menon",
    email: "raghav.m.demo@example.in",
    institution: "Eastern Ghat College of Engineering, Bhubaneswar",
    category: "Hostel & Student Welfare",
    bureau: "GRV",
    priority: "Medium",
    status: "Resolved",
    daysAgo: 52,
    resolvedAfter: 14,
    notes: [
      {
        author: "M. Krishnan",
        role: "Grievance Cell",
        text: "Institute constituted a new mess audit with student representatives; vendor issued a warning. Complainant confirmed improvement.",
        day: 14,
        internal: false,
      },
    ],
  },
  {
    subject: "Faculty recruitment norms not followed in recent appointments",
    description:
      "Recent appointments in the management department appear to have been made without public advertisement of vacancies and without the mandated selection committee composition. Requesting a review of the recruitment process followed for these posts.",
    complainantName: "Concerned Faculty Group",
    email: "faculty.group.demo@example.in",
    institution: "Kaveri Institute of Management, Bengaluru",
    category: "Faculty & Staff",
    bureau: "CMP",
    priority: "High",
    status: "In Progress",
    daysAgo: 30,
    notes: [
      {
        author: "A. Deshmukh",
        role: "Compliance Cell",
        text: "Called for the recruitment records and selection committee minutes for the relevant posts.",
        day: 10,
        internal: true,
      },
    ],
  },
  {
    subject: "CCTV coverage in examination halls — compliance query",
    description:
      "Seeking confirmation on whether CCTV recording is mandated in all examination halls during university examinations, as some halls in the old block do not appear to have coverage during the ongoing exams.",
    complainantName: "Nidhi Agarwal",
    email: "nidhi.a.demo@example.in",
    institution: "Northgate Technical University, Lucknow",
    category: "Examinations & Results",
    bureau: "CMP",
    priority: "Low",
    status: "Resolved",
    daysAgo: 88,
    resolvedAfter: 8,
    notes: [
      {
        author: "A. Deshmukh",
        role: "Compliance Cell",
        text: "Advisory on CCTV coverage shared with the institute; old block halls were added to the coverage plan the same week. Resolved.",
        day: 8,
        internal: false,
      },
    ],
  },
  {
    subject: "Anti-ragging committee constitution status requested",
    description:
      "The institute website's anti-ragging page has not been updated for two years and the committee composition is not displayed as required. Requesting that the current committee and squad details be published before the new session begins.",
    complainantName: "Student Council Representative",
    email: "council.demo@example.in",
    institution: "Chinar Valley Institute of Architecture, Srinagar",
    category: "Ragging & Harassment",
    bureau: "CMP",
    priority: "Medium",
    status: "Resolved",
    daysAgo: 110,
    resolvedAfter: 12,
    notes: [
      {
        author: "A. Deshmukh",
        role: "Compliance Cell",
        text: "Mandatory disclosure updated on the institute website. Verified by the cell. Closing.",
        day: 12,
        internal: false,
      },
    ],
  },
  {
    subject: "Mandatory disclosure page outdated on institute website",
    description:
      "The mandatory disclosure section still shows faculty data and approval letters from two academic sessions ago. Outdated disclosures may mislead prospective students during admissions.",
    complainantName: "Deepak Yadav",
    email: "deepak.y.demo@example.in",
    institution: "Doon Valley College of Education, Dehradun",
    category: "Other",
    bureau: "CMP",
    priority: "Medium",
    status: "Under Review",
    daysAgo: 7,
  },
  {
    subject: "Laboratory safety audit concerns in chemistry block",
    description:
      "Fume hoods in two chemistry laboratories are not functional and expired reagents are stored without proper labelling. Postgraduate students have raised this with the department twice; requesting a safety audit before the next practical examination cycle.",
    complainantName: "Ananya Bhatt",
    email: "ananya.b.demo@example.in",
    institution: "Devgiri Technical Institute, Aurangabad",
    category: "Infrastructure & Facilities",
    bureau: "CMP",
    priority: "Medium",
    status: "Submitted",
    daysAgo: 3,
  },
  {
    subject: "Merit-cum-means scholarship disbursement delayed",
    description:
      "Our scholarship applications were verified by the institute months ago, but the disbursement has not been credited to student accounts. Many of us rely on it for hostel fee payment, and the institute is issuing pending-fee reminders meanwhile.",
    complainantName: "Zoya Khan",
    email: "zoya.k.demo@example.in",
    institution: "Hooghly Institute of Design, Kolkata",
    category: "Scholarships & Financial Aid",
    bureau: "WEL",
    priority: "High",
    status: "In Progress",
    daysAgo: 35,
    notes: [
      {
        author: "P. Chatterjee",
        role: "Welfare Cell",
        text: "Batch file location identified at the institute level; re-validation pending due to three mismatched account numbers.",
        day: 15,
        internal: true,
      },
      {
        author: "P. Chatterjee",
        role: "Welfare Cell",
        text: "Students asked to verify account details on the portal by this Friday. Disbursement expected within 10 days of re-validation.",
        day: 24,
        internal: false,
      },
    ],
  },
  {
    subject: "Refund of caution money after course withdrawal",
    description:
      "I withdrew admission within the permitted window and submitted the refund application with bank details as per the fee refund policy. The caution deposit has still not been credited, and emails to the accounts office are unanswered.",
    complainantName: "Aarav Sharma",
    email: "aarav.demo@example.in",
    institution: "Greenwood Institute of Technology, Pune",
    category: "Fees & Refunds",
    bureau: "WEL",
    priority: "Medium",
    status: "Submitted",
    daysAgo: 5,
    attachments: ["withdrawal-ack.png"],
  },
  {
    subject: "Hostel Wi-Fi and water supply issues unresolved",
    description:
      "The hostel Wi-Fi has been down for three weeks and the morning water supply is irregular on upper floors. Warden says the vendor has been changed, but residents have received no timeline for service restoration.",
    complainantName: "Aarav Sharma",
    email: "aarav.demo@example.in",
    institution: "Greenwood Institute of Technology, Pune",
    category: "Hostel & Student Welfare",
    bureau: "WEL",
    priority: "High",
    status: "In Progress",
    daysAgo: 13,
    notes: [
      {
        author: "P. Chatterjee",
        role: "Welfare Cell",
        text: "Institute estates office confirms new ISP link commissioned on trial; geyser-water schedule revised. Monitoring for a week.",
        day: 8,
        internal: false,
      },
    ],
  },
  {
    subject: "Book bank shortage for core engineering titles",
    description:
      "The library book bank has run out of copies for two core titles needed by the entire second-year batch, and only a handful of reference copies remain. Requesting replenishment before sessional exams.",
    complainantName: "Library Committee, Student Chapter",
    email: "library.chapter.demo@example.in",
    institution: "Coromandel College of Arts & Science, Chennai",
    category: "Infrastructure & Facilities",
    bureau: "WEL",
    priority: "Low",
    status: "Resolved",
    daysAgo: 130,
    resolvedAfter: 18,
    notes: [
      {
        author: "P. Chatterjee",
        role: "Welfare Cell",
        text: "Institute procured 40 additional copies under the book bank scheme after our note. Resolved.",
        day: 18,
        internal: false,
      },
    ],
  },
  {
    subject: "Extension of health centre timings requested",
    description:
      "The campus health centre currently closes by early evening, and hostel residents needing attention at night must travel to the city clinic. Requesting extended timings or an on-call arrangement during night hours.",
    complainantName: "Shreya Pillai",
    email: "shreya.p.demo@example.in",
      institution: "Backwater Institute of Hospitality Studies, Kochi",
      category: "Hostel & Student Welfare",
    bureau: "WEL",
    priority: "Low",
    status: "Resolved",
    daysAgo: 150,
    resolvedAfter: 9,
    notes: [
      {
        author: "P. Chatterjee",
        role: "Welfare Cell",
        text: "Institute arranged an on-call nurse and MoU with a nearby clinic for night hours. Complainant informed; closing.",
        day: 9,
        internal: false,
      },
    ],
  },
];

function buildTimeline(row: SeedRow, created: string): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      stage: "Submitted",
      label: "Complaint submitted",
      date: created,
      detail: "Lodged through the CaseBridge citizen portal",
    },
  ];
  if (row.status === "Submitted") return events;

  events.push({
    stage: "Assigned",
    label: `Assigned to ${bureauById(row.bureau).name}`,
    date: shift(created, 1, 11),
    detail: `Auto-routed · desk officer ${bureauById(row.bureau).officer}`,
  });
  events.push({
    stage: "Under Review",
    label: "Under review",
    date: shift(created, 3, 14),
    detail: "Preliminary verification of documents initiated",
  });

  if (row.status === "Escalated") {
    events.push({
      stage: "Escalated",
      label: "Escalated to regional office",
      date: shift(created, row.escalatedAfter ?? 8, 15),
      detail: "No response from institute within the mandated window",
    });
    return events;
  }
  if (row.status === "Under Review") return events;

  events.push({
    stage: "In Progress",
    label: "Processing in progress",
    date: shift(created, 6, 12),
    detail: "Institute response sought · follow-up scheduled",
  });
  if (row.status === "In Progress") return events;

  events.push({
    stage: "Resolved",
    label: "Resolved",
    date: shift(created, row.resolvedAfter ?? 14, 16),
    detail: "Complainant informed of the outcome",
  });
  return events;
}

function buildNotes(row: SeedRow, created: string): CaseNote[] {
  return (row.notes ?? []).map((n, i) => ({
    id: `note_${i}_${row.subject.length}_${n.day}`,
    author: n.author,
    authorRole: n.role,
    text: n.text,
    date: shift(created, n.day, 15),
    internal: n.internal,
  }));
}

export function seedComplaints(): Complaint[] {
  const sorted = [...ROWS].sort((a, b) => b.daysAgo - a.daysAgo); // oldest first
  let serial = 968;
  return sorted.map((row) => {
    const created = at(row.daysAgo, 9 + (serial % 6), (serial * 7) % 60);
    const timeline = buildTimeline(row, created);
    const year = new Date(created).getFullYear();
    const complaint: Complaint = {
      id: `CMP-${year}-${serial++}`,
      subject: row.subject,
      description: row.description,
      complainantName: row.complainantName,
      email: row.email,
      institution: row.institution,
      category: row.category,
      bureau: row.bureau,
      priority: row.priority,
      status: row.status,
      createdAt: created,
      updatedAt: timeline[timeline.length - 1].date,
      attachments: row.attachments ?? [],
      timeline,
      notes: buildNotes(row, created),
    };
    return complaint;
  });
}

export function seedNotifications(complaints: Complaint[]): AppNotification[] {
  const find = (needle: string) => complaints.find((c) => c.subject.includes(needle))?.id;
  const items: AppNotification[] = [
    {
      id: "n1",
      title: "New complaint in your queue",
      message: "Mid-semester examination timetable clash was filed and routed to the Academic Bureau.",
      type: "new",
      date: at(0, 9, 45),
      read: false,
      complaintId: find("timetable clash"),
    },
    {
      id: "n2",
      title: "Case escalated",
      message: "Ragging complaint by first-year student has been escalated to the regional office.",
      type: "escalation",
      date: at(1, 16),
      read: false,
      complaintId: find("Ragging complaint"),
    },
    {
      id: "n3",
      title: "SLA breach risk",
      message: "Unapproved intake increase case is 27 days old and still unresolved.",
      type: "overdue",
      date: at(1, 10),
      read: false,
      complaintId: find("Unapproved intake"),
    },
    {
      id: "n4",
      title: "Case resolved",
      message: "Caution money and two other welfare cases were closed this week with complainant confirmation.",
      type: "resolved",
      date: at(2, 17),
      read: false,
      complaintId: find("Hostel mess"),
    },
    {
      id: "n5",
      title: "Institute response received",
      message: "Greenwood Institute responded on the hostel Wi-Fi restoration timeline.",
      type: "note",
      date: at(3, 12),
      read: true,
      complaintId: find("Hostel Wi-Fi"),
    },
    {
      id: "n6",
      title: "New complaint assigned",
      message: "Laboratory safety audit concerns routed to the Compliance & Inspection Cell.",
      type: "new",
      date: at(3, 10),
      read: true,
      complaintId: find("Laboratory safety"),
    },
    {
      id: "n7",
      title: "Weekly SLA digest ready",
      message: "Your weekly resolution summary across all bureaus is available under Analytics & Reports.",
      type: "info",
      date: at(4, 8),
      read: true,
    },
  ];
  return items;
}
