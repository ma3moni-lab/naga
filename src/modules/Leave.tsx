import { useState, useMemo } from "react";
import { LIVE_LEAVE_REQUESTS, persistStore as _persistStore } from "../data/persistentStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRequest {
  id: string;
  staffName: string;
  staffRole: string;
  department: string;
  type: "Annual" | "Sick" | "Compassionate" | "Maternity/Paternity" | "Study";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  reliefContact: string;
  status: "Pending" | "Approved" | "Declined" | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedDate?: string;
}

// ─── Mutable store ────────────────────────────────────────────────────────────

const _LEAVE_SEED: LeaveRequest[] = [
  {
    id: "LV001",
    staffName: "Funke Adeyemi",
    staffRole: "estate",
    department: "Estates",
    type: "Annual",
    fromDate: "2026-07-14",
    toDate: "2026-07-25",
    days: 10,
    reason: "Family vacation — travelling to Abuja for two weeks with family.",
    reliefContact: "Chidi Obi",
    status: "Approved",
    appliedDate: "2026-07-01",
    reviewedBy: "General Manager",
    reviewNote: "Approved. Ensure handover notes are shared.",
    reviewedDate: "2026-07-03",
  },
  {
    id: "LV002",
    staffName: "Tunde Bakare",
    staffRole: "pco",
    department: "Operations",
    type: "Sick",
    fromDate: "2026-08-04",
    toDate: "2026-08-08",
    days: 5,
    reason: "Malaria and fever — medical certificate attached.",
    reliefContact: "Amaka Nwosu",
    status: "Approved",
    appliedDate: "2026-08-03",
    reviewedBy: "GM Office",
    reviewNote: "Approved. Get well soon.",
    reviewedDate: "2026-08-04",
  },
  {
    id: "LV003",
    staffName: "Ngozi Okafor",
    staffRole: "finance",
    department: "Finance",
    type: "Annual",
    fromDate: "2026-09-08",
    toDate: "2026-09-19",
    days: 10,
    reason: "Personal travel and rest after Q2 financial close.",
    reliefContact: "Bisi Adeleke",
    status: "Pending",
    appliedDate: "2026-08-25",
  },
  {
    id: "LV004",
    staffName: "Emeka Eze",
    staffRole: "pco",
    department: "Projects",
    type: "Compassionate",
    fromDate: "2026-08-18",
    toDate: "2026-08-22",
    days: 5,
    reason: "Bereavement — loss of a parent. Travelling to Enugu for burial.",
    reliefContact: "Kola Adebayo",
    status: "Approved",
    appliedDate: "2026-08-17",
    reviewedBy: "CEO",
    reviewNote: "Approved with condolences. Family first.",
    reviewedDate: "2026-08-17",
  },
  {
    id: "LV005",
    staffName: "Amaka Nwosu",
    staffRole: "admin",
    department: "Administration",
    type: "Maternity/Paternity",
    fromDate: "2026-09-15",
    toDate: "2026-12-15",
    days: 65,
    reason: "Maternity leave — expected delivery date 20th September 2026.",
    reliefContact: "Grace Okonkwo",
    status: "Approved",
    appliedDate: "2026-08-20",
    reviewedBy: "HR / CEO",
    reviewNote: "Approved per company policy. Best wishes.",
    reviewedDate: "2026-08-22",
  },
  {
    id: "LV006",
    staffName: "Chidi Obi",
    staffRole: "ivm",
    department: "Inventory",
    type: "Study",
    fromDate: "2026-10-05",
    toDate: "2026-10-10",
    days: 5,
    reason: "Professional certification exam — CIPS Level 4.",
    reliefContact: "Yemi Afolabi",
    status: "Pending",
    appliedDate: "2026-09-01",
  },
  {
    id: "LV007",
    staffName: "Bisi Adeleke",
    staffRole: "finance",
    department: "Finance",
    type: "Annual",
    fromDate: "2026-06-02",
    toDate: "2026-06-06",
    days: 5,
    reason: "Short break for personal rest and travel.",
    reliefContact: "Ngozi Okafor",
    status: "Declined",
    appliedDate: "2026-05-26",
    reviewedBy: "Finance Director",
    reviewNote: "Declined — Q1 audit period, cannot approve absence at this time.",
    reviewedDate: "2026-05-28",
  },
  {
    id: "LV008",
    staffName: "Yemi Afolabi",
    staffRole: "prm",
    department: "Property",
    type: "Annual",
    fromDate: "2026-09-22",
    toDate: "2026-09-26",
    days: 5,
    reason: "Family engagement — traditional marriage ceremony in Lagos.",
    reliefContact: "Chidi Obi",
    status: "Pending",
    appliedDate: "2026-09-01",
  },
];

// Use persisted data if available (cross-session 72hr store), else fall back to seed
let leaveStore: LeaveRequest[] =
  LIVE_LEAVE_REQUESTS.length > 0
    ? (LIVE_LEAVE_REQUESTS as unknown as LeaveRequest[])
    : [..._LEAVE_SEED];

function syncLeaveStore() {
  LIVE_LEAVE_REQUESTS.length = 0;
  LIVE_LEAVE_REQUESTS.push(...(leaveStore as unknown as typeof LIVE_LEAVE_REQUESTS));
  _persistStore();
}

let nextId = 9;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEAVE_TYPES: LeaveRequest["type"][] = [
  "Annual", "Sick", "Compassionate", "Maternity/Paternity", "Study",
];

const ANNUAL_ALLOWANCE = 20;
const SICK_ALLOWANCE = 10;
const COMPASSIONATE_ALLOWANCE = 5;
const MATERNITY_ALLOWANCE = 90;
const STUDY_ALLOWANCE = 10;

function allowanceFor(type: LeaveRequest["type"]): number {
  switch (type) {
    case "Annual": return ANNUAL_ALLOWANCE;
    case "Sick": return SICK_ALLOWANCE;
    case "Compassionate": return COMPASSIONATE_ALLOWANCE;
    case "Maternity/Paternity": return MATERNITY_ALLOWANCE;
    case "Study": return STUDY_ALLOWANCE;
  }
}

function calcWorkingDays(from: string, to: string): number {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end = new Date(to);
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const SUPERVISOR_ROLES = new Set(["howo", "ceo", "admin", "prm"]);

function canManageTeam(role: string): boolean {
  return SUPERVISOR_ROLES.has(role);
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

const PERSON_COLORS = [
  "#6B9FE5", "#D4A843", "#8B5CF6", "#EC4899", "#14B8A6",
  "#F97316", "#84CC16", "#06B6D4", "#A855F7", "#EF4444",
];
const colorCache: Record<string, string> = {};
function personColor(name: string): string {
  if (!colorCache[name]) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
    colorCache[name] = PERSON_COLORS[hash % PERSON_COLORS.length];
  }
  return colorCache[name];
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  const map: Record<LeaveRequest["status"], { bg: string; color: string }> = {
    Pending: { bg: "#FEF3C7", color: "#92400E" },
    Approved: { bg: "#EAF2FC", color: "#25205B" },
    Declined: { bg: "#FEE2E2", color: "#991B1B" },
    Cancelled: { bg: "#F3F4F6", color: "#4B5563" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: LeaveRequest["type"] }) {
  return (
    <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F0F3FA] text-[#25205B]">
      {type}
    </span>
  );
}

function BalanceBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = Math.min(100, total > 0 ? (used / total) * 100 : 0);
  const remaining = Math.max(0, total - used);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-[#69707D]">
        <span className="font-medium text-[#252731]">{label}</span>
        <span>
          <span className="font-semibold text-[#252731]">{remaining}</span>
          <span className="text-[#B0B8C4]"> / {total} days left</span>
        </span>
      </div>
      <div className="h-2 bg-[#E8EAF0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────

function ApplyModal({
  staffName, onClose, onSubmit,
}: {
  staffName: string;
  onClose: () => void;
  onSubmit: (req: Omit<LeaveRequest, "id" | "staffRole" | "department" | "status" | "appliedDate">) => void;
}) {
  const [type, setType] = useState<LeaveRequest["type"]>("Annual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [reliefContact, setReliefContact] = useState("");
  const [error, setError] = useState("");

  const days = calcWorkingDays(fromDate, toDate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromDate || !toDate) { setError("Please select both dates."); return; }
    if (new Date(toDate) < new Date(fromDate)) { setError("End date must be after start date."); return; }
    if (!reason.trim()) { setError("Please provide a reason."); return; }
    if (!reliefContact.trim()) { setError("Please provide a relief contact."); return; }
    setError("");
    onSubmit({ staffName, type, fromDate, toDate, days, reason: reason.trim(), reliefContact: reliefContact.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E8EAF0]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E8EAF0]">
          <div>
            <h2 className="text-base font-bold text-[#0f0d2e]">Apply for Leave</h2>
            <p className="text-xs text-[#69707D] mt-0.5">{staffName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#69707D] transition-colors text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#252731]">Leave Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as LeaveRequest["type"])} className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]">
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t} (max {allowanceFor(t)} days/year)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#252731]">From Date</label>
              <input type="date" value={fromDate} min={today()} onChange={(e) => setFromDate(e.target.value)} className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#252731]">To Date</label>
              <input type="date" value={toDate} min={fromDate || today()} onChange={(e) => setToDate(e.target.value)} className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]" />
            </div>
          </div>
          {fromDate && toDate && days >= 0 && (
            <div className="flex items-center gap-2 bg-[#EAF2FC] rounded-lg px-4 py-2.5">
              <span className="text-2xl font-bold text-[#25205B]">{days}</span>
              <span className="text-sm text-[#25205B]">working day{days !== 1 ? "s" : ""} selected</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#252731]">Relief Contact</label>
            <input type="text" placeholder="Name of colleague covering during your absence" value={reliefContact} onChange={(e) => setReliefContact(e.target.value)} className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#252731]">Reason</label>
            <textarea placeholder="Brief description of your leave reason..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5] resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#E8EAF0] text-sm font-semibold text-[#69707D] hover:bg-[#F3F4F6] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg bg-[#25205B] text-white text-sm font-semibold hover:bg-[#0f0d2e] transition-colors">Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Month Calendar (shared) ──────────────────────────────────────────────────

function MonthCalendar({
  year, month, approvedLeaves, highlightFrom, highlightTo, compact,
}: {
  year: number;
  month: number;
  approvedLeaves: LeaveRequest[];
  highlightFrom?: string;
  highlightTo?: string;
  compact?: boolean;
}) {
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const leaveMap: Record<number, LeaveRequest[]> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().split("T")[0];
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    approvedLeaves.forEach((req) => {
      if (iso >= req.fromDate && iso <= req.toDate) {
        if (!leaveMap[d]) leaveMap[d] = [];
        leaveMap[d].push(req);
      }
    });
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;
  const todayDay = isCurrentMonth ? todayDate.getDate() : -1;

  function isHighlighted(d: number): boolean {
    if (!highlightFrom || !highlightTo) return false;
    const iso = new Date(year, month, d).toISOString().split("T")[0];
    return iso >= highlightFrom && iso <= highlightTo;
  }

  return (
    <div className={`bg-white border border-[#E8EAF0] rounded-xl overflow-hidden flex-1 min-w-0 ${compact ? "" : ""}`}>
      <div className="px-4 py-3 border-b border-[#E8EAF0] bg-[#F8F9FC]">
        <h3 className={`font-bold text-[#0f0d2e] ${compact ? "text-xs" : "text-sm"}`}>{MONTH_NAMES[month]} {year}</h3>
      </div>
      <div className={compact ? "p-2" : "p-4"}>
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className={`text-center font-bold text-[#B0B8C4] py-0.5 ${compact ? "text-[9px]" : "text-[10px]"}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const onLeave = leaveMap[day] ?? [];
            const isToday = day === todayDay;
            const highlighted = isHighlighted(day);
            return (
              <div
                key={day}
                className={`relative flex flex-col items-center justify-start rounded-lg transition-colors ${compact ? "py-0.5 min-h-[28px]" : "py-1 min-h-[42px]"} ${
                  isToday ? "bg-[#25205B]" :
                  highlighted ? "bg-[#D4A843]/20 ring-1 ring-[#D4A843]/50" :
                  onLeave.length > 0 ? "bg-[#EAF2FC]" : "hover:bg-[#F8F9FC]"
                }`}
              >
                <span className={`font-semibold leading-none mb-0.5 ${compact ? "text-[9px]" : "text-xs"} ${isToday ? "text-white" : highlighted ? "text-[#92400E]" : "text-[#252731]"}`}>
                  {day}
                </span>
                {!compact && (
                  <div className="flex flex-wrap justify-center gap-0.5 max-w-[36px]">
                    {onLeave.slice(0, 3).map((req) => (
                      <span key={req.id} title={`${req.staffName} (${req.type})`}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white leading-none"
                        style={{ background: personColor(req.staffName) }}
                      >
                        {initials(req.staffName)}
                      </span>
                    ))}
                    {onLeave.length > 3 && <span className="text-[8px] text-[#6B9FE5] font-bold">+{onLeave.length - 3}</span>}
                  </div>
                )}
                {compact && onLeave.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: personColor(onLeave[0].staffName) }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Conflict Calendar Panel (inside approval modal) ──────────────────────────

function ConflictCalendarPanel({
  request, allRequests,
}: {
  request: LeaveRequest;
  allRequests: LeaveRequest[];
}) {
  const approved = allRequests.filter((r) => r.status === "Approved" && r.id !== request.id);

  // Who else is on leave during the requested period
  const conflicts = approved.filter(
    (r) => r.fromDate <= request.toDate && r.toDate >= request.fromDate
  );

  // Determine which months to show (month of fromDate, and optionally toDate if different)
  const from = new Date(request.fromDate);
  const to = new Date(request.toDate);
  const m1Year = from.getFullYear();
  const m1Month = from.getMonth();
  const m2Year = to.getFullYear();
  const m2Month = to.getMonth();
  const showSecond = m1Month !== m2Month || m1Year !== m2Year;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold text-[#252731] uppercase tracking-wide mb-0.5">Leave Period Overlap</p>
        <p className="text-[11px] text-[#69707D]">
          Staff on approved leave between {formatDate(request.fromDate)} – {formatDate(request.toDate)}
        </p>
      </div>

      {conflicts.length === 0 ? (
        <div className="flex items-center gap-2.5 bg-[#F0FDF4] border border-emerald-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#16a34a" strokeWidth="1.3" />
            <path d="M5 8.5l2 2L11 6" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-semibold text-emerald-700">No conflicts — all clear for this period</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conflicts.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 bg-[#FEF3C7] border border-amber-200 rounded-xl px-3 py-2.5">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: personColor(c.staffName) }}
              >
                {initials(c.staffName)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#252731]">{c.staffName}</p>
                <p className="text-[10px] text-[#69707D] truncate">
                  {c.type} · {formatDate(c.fromDate)} – {formatDate(c.toDate)} ({c.days}d)
                </p>
              </div>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">OVERLAP</span>
            </div>
          ))}
        </div>
      )}

      {/* Mini calendars for the requested period */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <MonthCalendar
          year={m1Year} month={m1Month}
          approvedLeaves={approved}
          highlightFrom={request.fromDate}
          highlightTo={request.toDate}
          compact
        />
        {showSecond && (
          <MonthCalendar
            year={m2Year} month={m2Month}
            approvedLeaves={approved}
            highlightFrom={request.fromDate}
            highlightTo={request.toDate}
            compact
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-[#69707D]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#D4A843]/25 border border-[#D4A843]/50" />
          Requested period
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#EAF2FC]" />
          Other staff on leave
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#25205B]" />
          Today
        </div>
      </div>
    </div>
  );
}

// ─── Leave Detail Modal ───────────────────────────────────────────────────────

function LeaveDetailModal({
  request, allRequests, reviewerName, onApprove, onDecline, onClose,
}: {
  request: LeaveRequest;
  allRequests: LeaveRequest[];
  reviewerName: string;
  onApprove: (id: string, approvedDays: number, note: string) => void;
  onDecline: (id: string, note: string) => void;
  onClose: () => void;
}) {
  const [approvedDays, setApprovedDays] = useState(request.days);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"approve" | "decline" | null>(null);
  const [noteError, setNoteError] = useState("");

  const isDaysModified = approvedDays !== request.days;
  const dailyRate = (1 / request.days);

  function handleApprove() {
    onApprove(request.id, approvedDays, note.trim());
  }

  function handleDecline() {
    if (!note.trim()) { setNoteError("A reason is required when declining."); return; }
    setNoteError("");
    onDecline(request.id, note.trim());
  }

  const isPending = request.status === "Pending";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-[#E8EAF0] my-8">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E8EAF0]">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: personColor(request.staffName) }}
            >
              {initials(request.staffName)}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#0f0d2e]">{request.staffName}</h2>
                <span className="text-[10px] text-[#69707D] uppercase tracking-wide font-medium">{request.department}</span>
                <TypeBadge type={request.type} />
                <StatusBadge status={request.status} />
              </div>
              <p className="text-xs text-[#69707D] mt-0.5 font-mono">{request.id} · Applied {formatDate(request.appliedDate)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#69707D] transition-colors text-xl leading-none flex-shrink-0">×</button>
        </div>

        {/* Two-panel body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#E8EAF0]">

          {/* ── LEFT: Request details + approval actions ── */}
          <div className="p-6 flex flex-col gap-5">

            {/* Leave period */}
            <div className="bg-[#F8F9FC] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide font-bold text-[#69707D]">Leave Period</span>
                <TypeBadge type={request.type} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <p className="text-[10px] text-[#69707D] font-medium">From</p>
                  <p className="text-sm font-bold text-[#252731]">{formatDate(request.fromDate)}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#B0B8C4] flex-shrink-0">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[10px] text-[#69707D] font-medium">To</p>
                  <p className="text-sm font-bold text-[#252731]">{formatDate(request.toDate)}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-[#69707D] font-medium">Requested</p>
                  <p className="text-xl font-bold text-[#25205B]">{request.days}<span className="text-xs font-normal text-[#69707D] ml-1">days</span></p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-[#69707D] font-semibold uppercase mb-1">Relief Contact</p>
                <p className="text-sm font-medium text-[#252731]">{request.reliefContact}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#69707D] font-semibold uppercase mb-1">Allowance</p>
                <p className="text-sm font-medium text-[#252731]">{allowanceFor(request.type)} days / year</p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-[10px] text-[#69707D] font-semibold uppercase mb-1.5">Reason for Leave</p>
              <p className="text-sm text-[#252731] leading-relaxed bg-[#F8F9FC] rounded-xl px-4 py-3 border border-[#E8EAF0]">
                {request.reason}
              </p>
            </div>

            {/* Review note (if already actioned) */}
            {!isPending && request.reviewNote && (
              <div className="bg-[#EAF2FC] border border-[#6B9FE5]/30 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-[#25205B] uppercase mb-1">Reviewer Note — {request.reviewedBy}</p>
                <p className="text-xs text-[#252731] leading-relaxed">{request.reviewNote}</p>
                {request.reviewedDate && (
                  <p className="text-[10px] text-[#69707D] mt-1.5">{formatDate(request.reviewedDate)}</p>
                )}
              </div>
            )}

            {/* ── Approval section (pending only) ── */}
            {isPending && (
              <div className="flex flex-col gap-4 pt-1 border-t border-[#E8EAF0]">
                {/* Modify days */}
                <div>
                  <p className="text-xs font-bold text-[#252731] mb-2">Adjust Approved Days</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setApprovedDays(Math.max(1, approvedDays - 1))}
                      className="w-9 h-9 rounded-lg border border-[#E8EAF0] flex items-center justify-center text-lg text-[#25205B] font-bold hover:bg-[#EAF2FC] transition-colors"
                    >−</button>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-[#25205B]">{approvedDays}</span>
                      <span className="text-[10px] text-[#69707D]">days</span>
                    </div>
                    <button
                      onClick={() => setApprovedDays(Math.min(request.days, approvedDays + 1))}
                      className="w-9 h-9 rounded-lg border border-[#E8EAF0] flex items-center justify-center text-lg text-[#25205B] font-bold hover:bg-[#EAF2FC] transition-colors"
                    >+</button>
                    {isDaysModified && (
                      <div className="ml-2 flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-1 bg-[#FEF3C7] text-amber-800 rounded-full font-semibold">
                          Modified from {request.days} → {approvedDays} days
                        </span>
                        <button onClick={() => setApprovedDays(request.days)} className="text-[10px] text-[#69707D] hover:text-[#252731] underline">Reset</button>
                      </div>
                    )}
                  </div>
                  {isDaysModified && (
                    <p className="text-[11px] text-[#69707D] mt-1.5">
                      Staff will be notified of the adjusted leave duration.
                    </p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-bold text-[#252731] block mb-1.5">
                    {action === "decline" ? "Reason for Declining *" : "Note to Staff (optional)"}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => { setNote(e.target.value); setNoteError(""); }}
                    placeholder={action === "decline" ? "Provide a clear reason for declining..." : "Optional message to the staff member..."}
                    rows={3}
                    className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm text-[#252731] placeholder-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5] resize-none"
                  />
                  {noteError && <p className="text-xs text-red-600 mt-1">{noteError}</p>}
                </div>

                {/* Action buttons */}
                {action === null ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAction("approve")}
                      className="flex-1 py-2.5 rounded-xl bg-[#25205B] text-white text-sm font-semibold hover:bg-[#0f0d2e] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setAction("decline")}
                      className="flex-1 py-2.5 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-sm font-semibold hover:bg-[#FECACA] transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={action === "approve" ? handleApprove : handleDecline}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors text-white ${
                        action === "approve" ? "bg-[#25205B] hover:bg-[#0f0d2e]" : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      Confirm {action === "approve" ? (isDaysModified ? `Approve (${approvedDays}d)` : "Approval") : "Decline"}
                    </button>
                    <button
                      onClick={() => setAction(null)}
                      className="px-5 py-2.5 rounded-xl border border-[#E8EAF0] text-sm font-semibold text-[#69707D] hover:bg-[#F3F4F6] transition-colors"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Conflict calendar ── */}
          <div className="p-6 bg-[#FAFBFD] flex flex-col gap-4">
            <ConflictCalendarPanel request={request} allRequests={allRequests} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── My Leave Tab ─────────────────────────────────────────────────────────────

function MyLeaveTab({
  staffName, staffRole, department, requests, onApply,
}: {
  staffName: string;
  staffRole: string;
  department: string;
  requests: LeaveRequest[];
  onApply: () => void;
}) {
  const year = new Date().getFullYear();
  const approved = requests.filter((r) => r.status === "Approved" && r.fromDate.startsWith(String(year)));

  function usedDays(type: LeaveRequest["type"]): number {
    return approved.filter((r) => r.type === type).reduce((s, r) => s + r.days, 0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0f0d2e]">My Leave</h2>
          <p className="text-xs text-[#69707D] mt-0.5">Your leave history and balances for {year}</p>
        </div>
        <button onClick={onApply} className="flex items-center gap-2 px-4 py-2.5 bg-[#25205B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f0d2e] transition-colors shadow-sm">
          <span className="text-base leading-none">+</span>
          Apply for Leave
        </button>
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[#0f0d2e]">Leave Balance — {year}</h3>
        <div className="grid grid-cols-1 gap-3">
          <BalanceBar label="Annual Leave" used={usedDays("Annual")} total={ANNUAL_ALLOWANCE} color="#6B9FE5" />
          <BalanceBar label="Sick Leave" used={usedDays("Sick")} total={SICK_ALLOWANCE} color="#D4A843" />
          <BalanceBar label="Compassionate" used={usedDays("Compassionate")} total={COMPASSIONATE_ALLOWANCE} color="#8B5CF6" />
          <BalanceBar label="Study Leave" used={usedDays("Study")} total={STUDY_ALLOWANCE} color="#14B8A6" />
        </div>
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0]">
          <h3 className="text-sm font-bold text-[#0f0d2e]">Leave Requests</h3>
        </div>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EAF2FC] flex items-center justify-center mb-3 text-2xl">📋</div>
            <p className="text-sm font-semibold text-[#252731]">No leave requests yet</p>
            <p className="text-xs text-[#69707D] mt-1">Click "Apply for Leave" to submit your first request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E8EAF0]">
                  {["Type", "From", "To", "Days", "Relief", "Applied", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#69707D]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.slice().sort((a, b) => (a.appliedDate < b.appliedDate ? 1 : -1)).map((req, i) => (
                  <tr key={req.id} className={`border-b border-[#E8EAF0] hover:bg-[#F8F9FC] transition-colors ${i % 2 === 0 ? "" : "bg-[#FAFBFD]"}`}>
                    <td className="px-4 py-3"><TypeBadge type={req.type} /></td>
                    <td className="px-4 py-3 text-[#252731] text-xs font-medium">{formatDate(req.fromDate)}</td>
                    <td className="px-4 py-3 text-[#252731] text-xs font-medium">{formatDate(req.toDate)}</td>
                    <td className="px-4 py-3 text-[#252731] text-xs font-semibold">{req.days}d</td>
                    <td className="px-4 py-3 text-[#69707D] text-xs">{req.reliefContact}</td>
                    <td className="px-4 py-3 text-[#69707D] text-xs">{formatDate(req.appliedDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={req.status} />
                        {req.reviewNote && <span className="text-[10px] text-[#69707D] max-w-[180px] truncate" title={req.reviewNote}>{req.reviewNote}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team Requests Tab ────────────────────────────────────────────────────────

function TeamRequestsTab({
  allRequests, reviewerName, onReview,
}: {
  allRequests: LeaveRequest[];
  reviewerName: string;
  onReview: (id: string, action: "Approved" | "Declined", note: string, approvedDays?: number) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Declined">("Pending");
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);

  const filtered = useMemo(() => {
    return allRequests
      .filter((r) => (filter === "All" ? true : r.status === filter))
      .sort((a, b) => (a.appliedDate < b.appliedDate ? 1 : -1));
  }, [allRequests, filter]);

  const pendingCount = allRequests.filter((r) => r.status === "Pending").length;

  function handleApprove(id: string, approvedDays: number, note: string) {
    onReview(id, "Approved", note, approvedDays);
    setDetailRequest(null);
  }

  function handleDecline(id: string, note: string) {
    onReview(id, "Declined", note);
    setDetailRequest(null);
  }

  return (
    <>
      {detailRequest && (
        <LeaveDetailModal
          request={detailRequest}
          allRequests={allRequests}
          reviewerName={reviewerName}
          onApprove={handleApprove}
          onDecline={handleDecline}
          onClose={() => setDetailRequest(null)}
        />
      )}

      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0f0d2e]">Team Leave Requests</h2>
            <p className="text-xs text-[#69707D] mt-0.5">{pendingCount} pending approval · Click any request to review</p>
          </div>
          <div className="flex bg-[#F0F3FA] rounded-xl p-1 gap-1">
            {(["Pending", "Approved", "Declined", "All"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}
              >
                {f}
                {f === "Pending" && pendingCount > 0 && (
                  <span className="ml-1.5 bg-[#D4A843] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E8EAF0] rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-[#252731]">No {filter.toLowerCase()} requests</p>
            <p className="text-xs text-[#69707D] mt-1">All clear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((req) => (
              <button
                key={req.id}
                onClick={() => setDetailRequest(req)}
                className={`w-full text-left bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                  req.status === "Pending" ? "border-[#D4A843] shadow-sm" : "border-[#E8EAF0] hover:border-[#6B9FE5]/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: personColor(req.staffName) }}
                  >
                    {initials(req.staffName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#252731]">{req.staffName}</span>
                      <span className="text-[10px] text-[#69707D] uppercase tracking-wide font-medium">{req.department}</span>
                      <TypeBadge type={req.type} />
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#69707D]">
                      <span>
                        <span className="font-medium text-[#252731]">{formatDate(req.fromDate)}</span>
                        {" → "}
                        <span className="font-medium text-[#252731]">{formatDate(req.toDate)}</span>
                      </span>
                      <span><span className="font-semibold text-[#25205B]">{req.days}</span> working day{req.days !== 1 ? "s" : ""}</span>
                      <span>Relief: <span className="text-[#252731] font-medium">{req.reliefContact}</span></span>
                    </div>
                    <p className="text-xs text-[#69707D] mt-1.5 leading-relaxed line-clamp-1">{req.reason}</p>
                    {req.reviewNote && req.status !== "Pending" && (
                      <div className="mt-2 bg-[#F8F9FC] border border-[#E8EAF0] rounded-lg px-3 py-1.5 text-xs text-[#69707D] text-left">
                        <span className="font-semibold text-[#252731]">{req.reviewedBy}</span>: {req.reviewNote}
                      </div>
                    )}
                  </div>

                  {/* Right meta + CTA */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-[#B0B8C4]">Applied</p>
                      <p className="text-xs font-medium text-[#69707D]">{formatDate(req.appliedDate)}</p>
                    </div>
                    {req.status === "Pending" && (
                      <span className="text-[11px] font-semibold text-[#25205B] bg-[#EAF2FC] px-3 py-1.5 rounded-lg">
                        Review →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Leave Calendar Tab ───────────────────────────────────────────────────────

function LeaveCalendarTab({ allRequests }: { allRequests: LeaveRequest[] }) {
  const approved = allRequests.filter((r) => r.status === "Approved");
  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];

  // Navigation: show 2 months at a time, starting from monthOffset
  const [monthOffset, setMonthOffset] = useState(0);

  const baseMonth = now.getMonth() + monthOffset * 2;
  const m1Year = now.getFullYear() + Math.floor(baseMonth / 12);
  const m1Month = ((baseMonth % 12) + 12) % 12;
  const m2Raw = baseMonth + 1;
  const m2Year = now.getFullYear() + Math.floor(m2Raw / 12);
  const m2Month = ((m2Raw % 12) + 12) % 12;

  // Currently on leave (as of today)
  const onLeaveNow = approved.filter((r) => r.fromDate <= todayIso && r.toDate >= todayIso);

  // Starting leave soon (within the displayed months)
  const m1Start = new Date(m1Year, m1Month, 1).toISOString().split("T")[0];
  const m2End = new Date(m2Year, m2Month + 1, 0).toISOString().split("T")[0];
  const upcoming = approved
    .filter((r) => r.fromDate > todayIso && r.fromDate <= m2End)
    .sort((a, b) => (a.fromDate < b.fromDate ? -1 : 1));

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-[#0f0d2e]">Leave Calendar</h2>
        <p className="text-xs text-[#69707D] mt-0.5">All approved leave across the organisation — showing 2 months at a time</p>
      </div>

      {/* Currently on leave banner */}
      <div className={`rounded-xl p-4 border ${onLeaveNow.length > 0 ? "bg-[#EAF2FC] border-[#6B9FE5]/30" : "bg-[#F8F9FC] border-[#E8EAF0]"}`}>
        <p className="text-xs font-bold text-[#25205B] mb-2 uppercase tracking-wide">
          {onLeaveNow.length > 0 ? `${onLeaveNow.length} Staff Currently on Leave` : "No staff currently on leave"}
        </p>
        {onLeaveNow.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {onLeaveNow.map((r) => (
              <div key={r.id} className="flex items-center gap-2 bg-white border border-[#E8EAF0] rounded-full pl-1 pr-3 py-1">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ background: personColor(r.staffName) }}
                >
                  {initials(r.staffName)}
                </span>
                <div>
                  <span className="text-xs font-semibold text-[#252731]">{r.staffName}</span>
                  <span className="text-[10px] text-[#69707D] ml-1.5">{r.type}</span>
                </div>
                <span className="text-[10px] text-[#69707D] ml-1">→ {formatDate(r.toDate)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#69707D]">All staff are present today.</p>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-xs font-semibold text-[#69707D] hover:bg-[#F3F4F6] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Prev
        </button>
        <div className="text-sm font-bold text-[#252731]">
          {MONTH_NAMES[m1Month]} – {MONTH_NAMES[m2Month]} {m2Year}
        </div>
        <button
          onClick={() => setMonthOffset((o) => o + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-xs font-semibold text-[#69707D] hover:bg-[#F3F4F6] transition-colors"
        >
          Next
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* Calendars */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <MonthCalendar year={m1Year} month={m1Month} approvedLeaves={approved} />
        <MonthCalendar year={m2Year} month={m2Month} approvedLeaves={approved} />
      </div>

      {/* Upcoming leaves within the displayed range */}
      {upcoming.length > 0 && (
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0]">
            <h3 className="text-sm font-bold text-[#0f0d2e]">
              Approved Leaves — {MONTH_NAMES[m1Month]} & {MONTH_NAMES[m2Month]}
            </h3>
          </div>
          <div className="divide-y divide-[#E8EAF0]">
            {upcoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: personColor(r.staffName) }}
                >
                  {initials(r.staffName)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#252731]">{r.staffName}</p>
                  <p className="text-xs text-[#69707D]">
                    {r.type} · {formatDate(r.fromDate)} – {formatDate(r.toDate)}
                    <span className="ml-1 text-[#25205B] font-medium">({r.days}d)</span>
                  </p>
                </div>
                <TypeBadge type={r.type} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Array.from(new Set(approved.map((r) => r.staffName))).map((name) => (
          <div key={name} className="flex items-center gap-1.5 text-xs text-[#69707D]">
            <span className="w-3 h-3 rounded-full" style={{ background: personColor(name) }} />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Leave() {
  const session = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}") as {
        name?: string; role?: string; coverage?: string;
      };
    } catch {
      return {};
    }
  })();

  const staffName = session.name ?? "Funke Adeyemi";
  const staffRole = (session.role ?? "estate").toLowerCase();
  const department = session.coverage ?? "Estates";

  const isManager = canManageTeam(staffRole);

  type Tab = "my" | "team" | "calendar";
  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [, forceUpdate] = useState(0);

  const myRequests = leaveStore.filter((r) => r.staffName === staffName);

  function handleApply(data: Omit<LeaveRequest, "id" | "staffRole" | "department" | "status" | "appliedDate">) {
    const newReq: LeaveRequest = {
      ...data,
      id: `LV${String(nextId++).padStart(3, "0")}`,
      staffRole,
      department,
      status: "Pending",
      appliedDate: today(),
    };
    leaveStore = [newReq, ...leaveStore];
    syncLeaveStore();
    setShowApplyModal(false);
    forceUpdate((n) => n + 1);
  }

  function handleReview(id: string, action: "Approved" | "Declined", note: string, approvedDays?: number) {
    leaveStore = leaveStore.map((r) =>
      r.id === id
        ? {
            ...r,
            days: action === "Approved" && approvedDays !== undefined ? approvedDays : r.days,
            status: action,
            reviewedBy: staffName,
            reviewNote: note || undefined,
            reviewedDate: today(),
          }
        : r
    );
    syncLeaveStore();
    forceUpdate((n) => n + 1);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "my", label: "My Leave" },
    ...(isManager ? [{ id: "team" as Tab, label: "Team Requests" }] : []),
    { id: "calendar", label: "Leave Calendar" },
  ];

  const pendingCount = leaveStore.filter((r) => r.status === "Pending").length;

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <div className="bg-white border-b border-[#E8EAF0] px-6 pt-6 pb-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#0f0d2e]">Leave Management</h1>
          <p className="text-sm text-[#69707D] mt-0.5">Manage staff leave requests and approvals</p>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab.id ? "border-[#25205B] text-[#25205B]" : "border-transparent text-[#69707D] hover:text-[#252731]"
              }`}
            >
              {tab.label}
              {tab.id === "team" && pendingCount > 0 && (
                <span className="ml-1.5 bg-[#D4A843] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {activeTab === "my" && (
          <MyLeaveTab staffName={staffName} staffRole={staffRole} department={department} requests={myRequests} onApply={() => setShowApplyModal(true)} />
        )}
        {activeTab === "team" && isManager && (
          <TeamRequestsTab allRequests={leaveStore} reviewerName={staffName} onReview={handleReview} />
        )}
        {activeTab === "calendar" && <LeaveCalendarTab allRequests={leaveStore} />}
      </div>

      {showApplyModal && (
        <ApplyModal staffName={staffName} onClose={() => setShowApplyModal(false)} onSubmit={handleApply} />
      )}
    </div>
  );
}
