import { useState } from "react";
import { EMPLOYEES } from "../data/dummy";
import { exportCSV } from "../utils/csvExport";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollLineItem {
  empId: string;
  empName: string;
  department: string;
  grade: string;
  baseSalary: number;
  workingDays: number;
  autoAbsentDays: number;
  manualAbsentDays: number;
  note: string;
  status: string;
}

interface PayrollSchedule {
  id: string;
  month: number;
  year: number;
  status: "Submitted" | "Approved";
  preparedBy: string;
  preparedDate: string;
  submittedDate: string;
  disbursedBy?: string;
  disbursedDate?: string;
  lineItems: PayrollLineItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKING_DAYS = 26;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Calculation helpers ──────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function totalAbsent(item: PayrollLineItem): number {
  return item.autoAbsentDays + item.manualAbsentDays;
}

function dailyRate(item: PayrollLineItem): number {
  return item.baseSalary / WORKING_DAYS;
}

function deduction(item: PayrollLineItem): number {
  return dailyRate(item) * totalAbsent(item);
}

function netPay(item: PayrollLineItem): number {
  return Math.max(0, item.baseSalary - deduction(item));
}

function buildLineItems(): PayrollLineItem[] {
  return EMPLOYEES.map((emp) => ({
    empId: emp.id,
    empName: emp.name,
    department: emp.department,
    grade: emp.grade,
    baseSalary: emp.salary,
    workingDays: WORKING_DAYS,
    autoAbsentDays: emp.status === "Suspended" ? 5 : 0,
    manualAbsentDays: 0,
    note: emp.status === "Suspended"
      ? (emp as { suspensionReason?: string }).suspensionReason ?? "Suspended"
      : "",
    status: emp.status,
  }));
}

function buildLineItemsWithOverrides(
  overrides: Record<string, Partial<PayrollLineItem>>
): PayrollLineItem[] {
  return EMPLOYEES.map((emp) => {
    const base: PayrollLineItem = {
      empId: emp.id,
      empName: emp.name,
      department: emp.department,
      grade: emp.grade,
      baseSalary: emp.salary,
      workingDays: WORKING_DAYS,
      autoAbsentDays: emp.status === "Suspended" ? 5 : 0,
      manualAbsentDays: 0,
      note: emp.status === "Suspended"
        ? (emp as { suspensionReason?: string }).suspensionReason ?? "Suspended"
        : "",
      status: emp.status,
    };
    const override = overrides[emp.id];
    return override ? { ...base, ...override } : base;
  });
}

// ─── Shared mutable store — seeded with demo schedules ───────────────────────

export let payrollStore: PayrollSchedule[] = [
  // August 2026 — Submitted
  {
    id: "PAY-003",
    month: 7,
    year: 2026,
    status: "Submitted",
    preparedBy: "Ibrahim Lawal",
    preparedDate: "2026-08-26",
    submittedDate: "2026-08-26",
    lineItems: buildLineItemsWithOverrides({
      "EMP-010": { note: "Suspension pending disciplinary review" },
      "EMP-005": { manualAbsentDays: 5, note: "Sick leave approved (LV002)" },
    }),
  },
  // July 2026 — Approved
  {
    id: "PAY-002",
    month: 6,
    year: 2026,
    status: "Approved",
    preparedBy: "Ibrahim Lawal",
    preparedDate: "2026-07-25",
    submittedDate: "2026-07-25",
    disbursedBy: "Lola Adebayo",
    disbursedDate: "2026-07-29",
    lineItems: buildLineItemsWithOverrides({
      "EMP-010": { note: "Suspension pending disciplinary review" },
      "EMP-005": { manualAbsentDays: 3, note: "Sick leave (unrecorded)" },
    }),
  },
  // June 2026 — Approved
  {
    id: "PAY-001",
    month: 5,
    year: 2026,
    status: "Approved",
    preparedBy: "Ibrahim Lawal",
    preparedDate: "2026-06-25",
    submittedDate: "2026-06-25",
    disbursedBy: "Lola Adebayo",
    disbursedDate: "2026-06-28",
    lineItems: buildLineItemsWithOverrides({
      "EMP-010": { note: "Suspension pending disciplinary review" },
    }),
  },
];

let scheduleIdCounter = 4;

// ─── PDF generation ───────────────────────────────────────────────────────────

function generatePDF(schedule: PayrollSchedule) {
  const totalBase = schedule.lineItems.reduce((s, i) => s + i.baseSalary, 0);
  const totalNet = schedule.lineItems.reduce((s, i) => s + netPay(i), 0);
  const totalDed = schedule.lineItems.reduce((s, i) => s + deduction(i), 0);
  const monthLabel = `${MONTH_NAMES[schedule.month]} ${schedule.year}`;

  const rows = schedule.lineItems.map((item, idx) => {
    const absent = totalAbsent(item);
    const ded = deduction(item);
    const net = netPay(item);
    const autoTag = item.autoAbsentDays > 0 ? " <span class='auto-tag'>AUTO</span>" : "";
    return `
      <tr class="${idx % 2 === 0 ? "row-even" : "row-odd"} ${absent > 0 ? "row-deducted" : ""}">
        <td class="td-name">
          <div class="staff-name">${item.empName}</div>
          <div class="staff-id">${item.empId}</div>
        </td>
        <td>${item.department}</td>
        <td>${item.grade}</td>
        <td class="td-status status-${item.status.toLowerCase().replace(/\s/g, "-")}">${item.status}</td>
        <td class="td-num">${fmtCurrency(item.baseSalary)}</td>
        <td class="td-center">${WORKING_DAYS}</td>
        <td class="td-center ${absent > 0 ? "absent-red" : ""}">${absent > 0 ? absent + autoTag : "—"}</td>
        <td class="td-num ${absent > 0 ? "deduct-red" : "grey"}">${ded > 0 ? "−" + fmtCurrency(ded) : "—"}</td>
        <td class="td-num td-net">${fmtCurrency(net)}</td>
        <td class="td-note">${item.note || "—"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NAGA Group — Payroll Schedule ${monthLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Inter", sans-serif; font-size: 11px; color: #252731; background: #fff; }

    /* ── Letterhead ── */
    .letterhead {
      background: #1a1645;
      color: white;
      padding: 24px 32px 20px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }
    .letterhead-brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 20px; font-weight: 700; letter-spacing: 0.04em; color: white; }
    .brand-tag { font-size: 10px; color: rgba(211,227,249,0.7); letter-spacing: 0.08em; text-transform: uppercase; }
    .gold-bar { height: 3px; background: linear-gradient(90deg,#D4A843 0%,rgba(212,168,67,0.2) 100%); }
    .doc-meta { text-align: right; }
    .doc-title { font-size: 14px; font-weight: 700; color: #D4A843; text-transform: uppercase; letter-spacing: 0.06em; }
    .doc-sub { font-size: 10px; color: rgba(211,227,249,0.7); margin-top: 3px; }

    /* ── Page body ── */
    .page { padding: 24px 32px; }

    /* ── Schedule info ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-card {
      border: 1px solid #E8EAF0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .info-card.primary { background: #1a1645; border-color: #312a72; }
    .info-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #69707D; margin-bottom: 4px; }
    .info-card.primary .info-label { color: #6B9FE5; }
    .info-value { font-size: 14px; font-weight: 700; color: #252731; }
    .info-card.primary .info-value { color: white; }
    .info-value.deduct { color: #DC2626; }

    /* ── Section title ── */
    .section-title {
      font-size: 11px; font-weight: 700; color: #0f0d2e;
      text-transform: uppercase; letter-spacing: 0.08em;
      border-bottom: 2px solid #1a1645;
      padding-bottom: 6px; margin-bottom: 12px;
    }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead tr { background: #1a1645; color: white; }
    thead th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
    thead th.td-num, thead th.td-center { text-align: right; }
    .row-even { background: #ffffff; }
    .row-odd { background: #F9FAFB; }
    .row-deducted { background: #FFFBF0 !important; }
    td { padding: 7px 10px; border-bottom: 1px solid #F0F2F5; vertical-align: middle; }
    .td-name { min-width: 130px; }
    .staff-name { font-weight: 600; color: #252731; }
    .staff-id { font-size: 9px; color: #B0B8C4; font-family: monospace; margin-top: 1px; }
    .td-num { text-align: right; white-space: nowrap; font-weight: 600; }
    .td-center { text-align: center; }
    .td-note { max-width: 120px; color: #69707D; font-size: 9px; }
    .td-net { color: #25205B; font-size: 11px; }
    .absent-red { color: #DC2626; font-weight: 700; }
    .deduct-red { color: #DC2626; }
    .grey { color: #B0B8C4; }
    .auto-tag { display: inline-block; font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 3px; background: #FEE2E2; color: #991B1B; vertical-align: middle; margin-left: 4px; }
    .td-status { font-size: 9px; font-weight: 700; }
    .status-active { color: #166534; }
    .status-suspended { color: #991B1B; }
    .status-on-leave { color: #25205B; }

    /* ── Totals row ── */
    tfoot tr { background: #F0F3FA; border-top: 2px solid #1a1645; }
    tfoot td { padding: 9px 10px; font-weight: 700; font-size: 11px; color: #252731; }

    /* ── Signatures ── */
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #E8EAF0;
    }
    .sig-block { display: flex; flex-direction: column; gap: 28px; }
    .sig-line { border-bottom: 1px solid #252731; margin-bottom: 4px; }
    .sig-label { font-size: 9px; color: #69707D; font-weight: 600; text-transform: uppercase; }
    .sig-name { font-size: 10px; color: #252731; font-weight: 600; }

    /* ── Footer ── */
    .footer {
      margin-top: 20px; text-align: center;
      font-size: 9px; color: #B0B8C4;
      border-top: 1px solid #E8EAF0;
      padding-top: 10px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
      .page { padding: 16px 24px; }
      .letterhead { padding: 16px 24px; }
    }
  </style>
</head>
<body>

  <!-- Letterhead -->
  <div class="letterhead">
    <div class="letterhead-brand">
      <div class="brand-name">NAGA GROUP</div>
      <div class="brand-tag">Real Estate · Construction · Property Management</div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Salary Schedule</div>
      <div class="doc-sub">${monthLabel} · Ref: ${schedule.id} · ${schedule.status === "Approved" ? "APPROVED & DISBURSED" : "SUBMITTED FOR DISBURSEMENT"}</div>
    </div>
  </div>
  <div class="gold-bar"></div>

  <div class="page">

    <!-- Info grid -->
    <div class="info-grid">
      <div class="info-card primary">
        <div class="info-label">Net Payroll</div>
        <div class="info-value">${fmtCurrency(totalNet)}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Staff Count</div>
        <div class="info-value">${schedule.lineItems.length}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Total Deductions</div>
        <div class="info-value deduct">${totalDed > 0 ? fmtCurrency(totalDed) : "None"}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Gross Payroll</div>
        <div class="info-value">${fmtCurrency(totalBase)}</div>
      </div>
    </div>

    <!-- Meta row -->
    <div style="display:flex;gap:24px;margin-bottom:16px;font-size:10px;color:#69707D;">
      <span>Prepared by: <strong style="color:#252731">${schedule.preparedBy}</strong></span>
      <span>Submitted: <strong style="color:#252731">${schedule.submittedDate}</strong></span>
      ${schedule.disbursedDate ? `<span>Disbursed: <strong style="color:#252731">${schedule.disbursedDate}</strong> by <strong style="color:#252731">${schedule.disbursedBy}</strong></span>` : ""}
      <span>Working days: <strong style="color:#252731">${WORKING_DAYS}</strong> (Mon–Sat)</span>
    </div>

    <!-- Table -->
    <div class="section-title">Staff Salary Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Staff</th>
          <th>Department</th>
          <th>Grade</th>
          <th>Status</th>
          <th class="td-num">Base Salary</th>
          <th class="td-center">Work Days</th>
          <th class="td-center">Absent Days</th>
          <th class="td-num">Deduction</th>
          <th class="td-num">Net Pay</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4">Totals — ${schedule.lineItems.length} staff</td>
          <td class="td-num">${fmtCurrency(totalBase)}</td>
          <td></td>
          <td></td>
          <td class="td-num" style="color:#DC2626">${totalDed > 0 ? "−" + fmtCurrency(totalDed) : "—"}</td>
          <td class="td-num" style="color:#25205B;font-size:13px">${fmtCurrency(totalNet)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <!-- Signature blocks -->
    <div class="signatures">
      <div class="sig-block">
        <div>
          <div class="sig-line"></div>
          <div class="sig-label">Prepared by</div>
          <div class="sig-name">${schedule.preparedBy}</div>
          <div class="sig-label" style="margin-top:2px">Admin / HR Officer</div>
        </div>
      </div>
      <div class="sig-block">
        <div>
          <div class="sig-line"></div>
          <div class="sig-label">Finance Confirmation</div>
          <div class="sig-name">${schedule.disbursedBy ?? "Pending"}</div>
          <div class="sig-label" style="margin-top:2px">Finance Manager</div>
        </div>
      </div>
      <div class="sig-block">
        <div>
          <div class="sig-line"></div>
          <div class="sig-label">Approved by</div>
          <div class="sig-name">________________</div>
          <div class="sig-label" style="margin-top:2px">CEO / Management</div>
        </div>
      </div>
    </div>

    <div class="footer">
      NAGA Group · ${monthLabel} Payroll Schedule · ${schedule.id} · Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} ·
      CONFIDENTIAL — For internal use only
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function downloadCSV(schedule: PayrollSchedule) {
  const monthLabel = `${MONTH_NAMES[schedule.month]}-${schedule.year}`;
  exportCSV(
    `NAGA-Payroll-${monthLabel}-${schedule.id}`,
    ["Emp ID", "Staff Name", "Department", "Grade", "Status", "Base Salary (₦)", "Working Days", "Auto Absent", "Manual Absent", "Total Absent", "Daily Rate (₦)", "Deduction (₦)", "Net Pay (₦)", "Notes"],
    schedule.lineItems.map((item) => [
      item.empId,
      item.empName,
      item.department,
      item.grade,
      item.status,
      Math.round(item.baseSalary),
      WORKING_DAYS,
      item.autoAbsentDays,
      item.manualAbsentDays,
      totalAbsent(item),
      Math.round(dailyRate(item)),
      Math.round(deduction(item)),
      Math.round(netPay(item)),
      item.note,
    ])
  );
}

// ─── Status badges ────────────────────────────────────────────────────────────

function ScheduleStatusBadge({ status }: { status: PayrollSchedule["status"] }) {
  const map = {
    Submitted: { bg: "#FEF3C7", color: "#92400E", label: "Pending Disbursement" },
    Approved: { bg: "#F0FDF4", color: "#166534", label: "Disbursed & Approved" },
  };
  const s = map[status];
  return (
    <span className="inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function EmpStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "#F0FDF4", color: "#166534" },
    "On Leave": { bg: "#EAF2FC", color: "#25205B" },
    Suspended: { bg: "#FEE2E2", color: "#991B1B" },
    Resigned: { bg: "#F3F4F6", color: "#4B5563" },
  };
  const s = map[status] ?? { bg: "#F3F4F6", color: "#4B5563" };
  return (
    <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ─── Shared empty state ───────────────────────────────────────────────────────

function EmptyState({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-xl flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[#EAF2FC] flex items-center justify-center mb-3">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="4" width="18" height="16" rx="2" stroke="#6B9FE5" strokeWidth="1.5" />
          <path d="M6 9h10M6 13h7" stroke="#6B9FE5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#252731]">{label}</p>
      <p className="text-xs text-[#69707D] mt-1">{sublabel ?? "Schedules will appear here once available."}</p>
    </div>
  );
}

// ─── Confirm Send Modal ───────────────────────────────────────────────────────

function ConfirmSendModal({
  schedule, monthLabel, onConfirm, onClose,
}: {
  schedule: PayrollLineItem[];
  monthLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const totalNet = schedule.reduce((s, i) => s + netPay(i), 0);
  const totalDed = schedule.reduce((s, i) => s + deduction(i), 0);
  const staffWithDeductions = schedule.filter((i) => totalAbsent(i) > 0).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E8EAF0]">
        <div className="px-6 pt-6 pb-4 border-b border-[#E8EAF0]">
          <h2 className="text-base font-bold text-[#0f0d2e]">Send to Finance?</h2>
          <p className="text-xs text-[#69707D] mt-0.5">{monthLabel} payroll schedule will be submitted for disbursement.</p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#25205B] rounded-xl p-4">
              <p className="text-[10px] text-[#6B9FE5] font-semibold uppercase mb-1">Net Payroll</p>
              <p className="text-lg font-bold text-white">{fmtCurrency(totalNet)}</p>
            </div>
            <div className="bg-[#FEF3C7] rounded-xl p-4 border border-amber-200">
              <p className="text-[10px] text-amber-700 font-semibold uppercase mb-1">Deductions</p>
              <p className="text-lg font-bold text-amber-800">{totalDed > 0 ? fmtCurrency(totalDed) : "None"}</p>
            </div>
          </div>
          {staffWithDeductions > 0 && (
            <div className="flex items-start gap-2.5 bg-[#FEF3C7] border border-amber-200 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0">
                <path d="M7 1L1 13h12L7 1z" stroke="#92400E" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M7 5.5v3M7 10v.5" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <p className="text-xs text-amber-800">
                <strong>{staffWithDeductions} staff</strong> have salary deductions. Finance will see the full breakdown.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#E8EAF0] text-sm font-semibold text-[#69707D] hover:bg-[#F3F4F6] transition-colors">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-[#25205B] text-white text-sm font-semibold hover:bg-[#0f0d2e] transition-colors flex items-center justify-center gap-2">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5l3 3L11 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirm & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Summary Card ────────────────────────────────────────────────────

function ScheduleCard({
  schedule, expanded, onToggle, onMarkDisbursed, disbursedByName, isFinance,
}: {
  schedule: PayrollSchedule;
  expanded: boolean;
  onToggle: () => void;
  onMarkDisbursed?: () => void;
  disbursedByName: string;
  isFinance: boolean;
}) {
  const totalNet = schedule.lineItems.reduce((s, i) => s + netPay(i), 0);
  const totalBase = schedule.lineItems.reduce((s, i) => s + i.baseSalary, 0);
  const totalDed = schedule.lineItems.reduce((s, i) => s + deduction(i), 0);
  const monthLabel = `${MONTH_NAMES[schedule.month]} ${schedule.year}`;

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left min-w-0 hover:opacity-80 transition-opacity">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#252731]">{monthLabel} Payroll</span>
              <ScheduleStatusBadge status={schedule.status} />
            </div>
            <p className="text-[11px] text-[#69707D] mt-0.5">
              {schedule.id} · Prepared by {schedule.preparedBy} · Submitted {schedule.submittedDate}
              {schedule.disbursedDate ? ` · Disbursed ${schedule.disbursedDate} by ${schedule.disbursedBy}` : ""}
            </p>
          </div>
        </button>

        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <div className="text-right">
            <p className="text-[9px] text-[#69707D] uppercase tracking-wide">Net Payroll</p>
            <p className="text-sm font-bold text-[#25205B]">{fmtCurrency(totalNet)}</p>
          </div>
          {totalDed > 0 && (
            <div className="text-right">
              <p className="text-[9px] text-[#69707D] uppercase tracking-wide">Deductions</p>
              <p className="text-sm font-bold text-red-600">{fmtCurrency(totalDed)}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {isFinance && schedule.status === "Submitted" && onMarkDisbursed && (
              <button
                onClick={onMarkDisbursed}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[#25205B] text-white hover:bg-[#0f0d2e] transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 5.5l2.5 2.5L9.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mark Disbursed
              </button>
            )}

            {/* PDF button */}
            <button
              onClick={() => generatePDF(schedule)}
              title="Download PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[#E8EAF0] text-[#252731] hover:bg-[#EAF2FC] hover:border-[#6B9FE5]/40 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 5.5h5M4 7.5h3.5M4 3.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                <path d="M8.5 9l1.5 1.5M10 9L8.5 10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              PDF
            </button>

            {/* CSV button */}
            <button
              onClick={() => downloadCSV(schedule)}
              title="Export CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[#E8EAF0] text-[#252731] hover:bg-[#EAF2FC] hover:border-[#6B9FE5]/40 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5v7M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.5 10.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              CSV
            </button>

            {/* Expand chevron */}
            <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#69707D] hover:bg-[#F3F4F6] transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded table */}
      {expanded && (
        <div className="border-t border-[#E8EAF0] px-5 pb-5 pt-4">
          {/* Mini summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-[#25205B] rounded-xl px-4 py-3">
              <p className="text-[9px] text-[#6B9FE5] font-semibold uppercase mb-0.5">Net Payroll</p>
              <p className="text-base font-bold text-white">{fmtCurrency(totalNet)}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-[#E8EAF0]">
              <p className="text-[9px] text-[#69707D] font-semibold uppercase mb-0.5">Gross Payroll</p>
              <p className="text-base font-bold text-[#252731]">{fmtCurrency(totalBase)}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-[#E8EAF0]">
              <p className="text-[9px] text-[#69707D] font-semibold uppercase mb-0.5">Deductions</p>
              <p className={`text-base font-bold ${totalDed > 0 ? "text-red-600" : "text-[#252731]"}`}>{totalDed > 0 ? fmtCurrency(totalDed) : "None"}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-[#E8EAF0]">
              <p className="text-[9px] text-[#69707D] font-semibold uppercase mb-0.5">Staff</p>
              <p className="text-base font-bold text-[#252731]">{schedule.lineItems.length}</p>
            </div>
          </div>

          {/* Detail table */}
          <div className="overflow-x-auto rounded-xl border border-[#E8EAF0]" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <table className="w-full text-sm" style={{ minWidth: "680px" }}>
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E8EAF0]">
                  {["Staff", "Department", "Status", "Base Salary", "Absent Days", "Deduction", "Net Pay", "Notes"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[#69707D] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {schedule.lineItems.map((item) => {
                  const absent = totalAbsent(item);
                  const ded = deduction(item);
                  const net = netPay(item);
                  return (
                    <tr key={item.empId} className={`${absent > 0 ? "bg-[#FFFBF0] hover:bg-[#FEF9E8]" : "hover:bg-[#F8F9FC]"} transition-colors`}>
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-semibold text-[#252731]">{item.empName}</p>
                        <p className="text-[10px] font-mono text-[#B0B8C4]">{item.empId}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#69707D]">{item.department}</td>
                      <td className="px-4 py-2.5"><EmpStatusBadge status={item.status} /></td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-[#252731] whitespace-nowrap">{fmtCurrency(item.baseSalary)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {absent > 0 ? (
                            <>
                              <span className="text-xs font-bold text-red-600">{absent}</span>
                              {item.autoAbsentDays > 0 && <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B]">AUTO</span>}
                            </>
                          ) : <span className="text-xs text-[#B0B8C4]">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${ded > 0 ? "text-red-600" : "text-[#B0B8C4]"}`}>
                          {ded > 0 ? `−${fmtCurrency(ded)}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#252731]">{fmtCurrency(net)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#69707D] max-w-[140px] truncate">{item.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Salary Prep Table ────────────────────────────────────────────────────────

function SalaryPrepTable({
  lineItems, onChange,
}: {
  lineItems: PayrollLineItem[];
  onChange: (id: string, field: "manualAbsentDays" | "note", value: number | string) => void;
}) {
  const totalBase = lineItems.reduce((s, i) => s + i.baseSalary, 0);
  const totalDed = lineItems.reduce((s, i) => s + deduction(i), 0);
  const totalNet = lineItems.reduce((s, i) => s + netPay(i), 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E8EAF0] bg-white" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <table className="w-full text-sm" style={{ minWidth: "960px" }}>
        <thead>
          <tr className="bg-[#F8F9FC] border-b border-[#E8EAF0]">
            {["Staff", "Dept", "Grade", "Status", "Base Salary", "Work Days", "Auto Absent", "Manual Absent", "Total Absent", "Daily Rate", "Deduction", "Net Pay", "Notes"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#69707D] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F2F5]">
          {lineItems.map((item) => {
            const absent = totalAbsent(item);
            const ded = deduction(item);
            const net = netPay(item);
            return (
              <tr key={item.empId} className={`hover:bg-[#F8F9FC] transition-colors ${absent > 0 ? "bg-[#FFFBF0]" : ""}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-xs font-semibold text-[#252731]">{item.empName}</p>
                  <p className="text-[10px] font-mono text-[#B0B8C4]">{item.empId}</p>
                </td>
                <td className="px-4 py-3 text-xs text-[#69707D] whitespace-nowrap">{item.department}</td>
                <td className="px-4 py-3 text-xs text-[#69707D] whitespace-nowrap">{item.grade}</td>
                <td className="px-4 py-3"><EmpStatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-xs font-semibold text-[#252731] whitespace-nowrap">{fmtCurrency(item.baseSalary)}</td>
                <td className="px-4 py-3 text-xs text-center text-[#69707D]">{WORKING_DAYS}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-semibold text-[#252731]">{item.autoAbsentDays}</span>
                    {item.autoAbsentDays > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B]">AUTO</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number" min={0} max={WORKING_DAYS - item.autoAbsentDays}
                    value={item.manualAbsentDays}
                    onChange={(e) => onChange(item.empId, "manualAbsentDays", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 text-center border border-[#E8EAF0] rounded-lg px-2 py-1 text-xs text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-bold ${absent > 0 ? "text-red-600" : "text-[#252731]"}`}>{absent}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#69707D] whitespace-nowrap">{fmtCurrency(dailyRate(item))}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs font-semibold ${ded > 0 ? "text-red-600" : "text-[#B0B8C4]"}`}>
                    {ded > 0 ? `−${fmtCurrency(ded)}` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-[#252731]">{fmtCurrency(net)}</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text" value={item.note}
                    onChange={(e) => onChange(item.empId, "note", e.target.value)}
                    placeholder="Optional note..."
                    className="w-36 border border-[#E8EAF0] rounded-lg px-2 py-1 text-xs text-[#252731] placeholder-[#B0B8C4] focus:outline-none focus:ring-1 focus:ring-[#6B9FE5]"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-[#F0F3FA] border-t-2 border-[#25205B]">
            <td className="px-4 py-3 text-xs font-bold text-[#252731]" colSpan={4}>Totals — {lineItems.length} staff</td>
            <td className="px-4 py-3 text-xs font-bold text-[#252731] whitespace-nowrap">{fmtCurrency(totalBase)}</td>
            <td /><td /><td /><td />
            <td className="px-4 py-3 text-xs text-[#69707D] whitespace-nowrap">÷ {WORKING_DAYS} days</td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-xs font-bold text-red-600">{totalDed > 0 ? `−${fmtCurrency(totalDed)}` : "—"}</span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-base font-bold text-[#25205B]">{fmtCurrency(totalNet)}</span>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── My Payslip Tab ───────────────────────────────────────────────────────────

function MyPayslipTab({ staffName }: { staffName: string }) {
  // Approved schedules sorted newest first
  const approved = [...payrollStore]
    .filter((s) => s.status === "Approved")
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

  // Find this staff member across all approved schedules
  const myHistory = approved
    .map((s) => {
      const item = s.lineItems.find((i) => i.empName === staffName);
      return item ? { schedule: s, item } : null;
    })
    .filter((x): x is { schedule: PayrollSchedule; item: PayrollLineItem } => x !== null);

  const latest = myHistory[0];

  if (!latest) {
    return (
      <EmptyState
        label="No payslip available yet"
        sublabel="Your payslip will appear here once the month is approved by Finance"
      />
    );
  }

  const { schedule, item } = latest;
  const monthLabel = `${MONTH_NAMES[schedule.month]} ${schedule.year}`;
  const absent = totalAbsent(item);
  const ded = deduction(item);
  const net = netPay(item);

  return (
    <div className="flex flex-col gap-6 items-center">
      {/* ── Payslip document card ── */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E8EAF0] shadow-sm w-full max-w-lg">
        {/* Letterhead */}
        <div style={{ background: "#0f0d2e" }} className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-bold text-base tracking-wide">NAGA GROUP</p>
              <p style={{ color: "rgba(211,227,249,0.6)" }} className="text-[10px] uppercase tracking-widest mt-0.5">
                Real Estate · Construction · Property Management
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p style={{ color: "#D4A843" }} className="text-xs font-bold uppercase tracking-wider">Pay Slip</p>
              <p style={{ color: "rgba(211,227,249,0.55)" }} className="text-[10px] font-mono mt-0.5">{schedule.id}</p>
            </div>
          </div>
          <div
            style={{ height: "2px", background: "linear-gradient(90deg,#D4A843 0%,rgba(212,168,67,0.12) 100%)" }}
            className="mt-4 rounded-full"
          />
          <p style={{ color: "#D4A843" }} className="text-sm font-semibold mt-3">{monthLabel}</p>
        </div>

        {/* Staff identity */}
        <div className="px-6 py-5 border-b border-[#E8EAF0]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-[10px] text-[#69707D] uppercase tracking-wide font-semibold mb-0.5">Staff Name</p>
              <p className="text-sm font-bold text-[#0f0d2e]">{item.empName}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#69707D] uppercase tracking-wide font-semibold mb-0.5">Employee ID</p>
              <p className="text-sm font-mono font-semibold text-[#252731]">{item.empId}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#69707D] uppercase tracking-wide font-semibold mb-0.5">Department</p>
              <p className="text-sm font-semibold text-[#252731]">{item.department}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#69707D] uppercase tracking-wide font-semibold mb-0.5">Grade</p>
              <p className="text-sm font-semibold text-[#252731]">{item.grade}</p>
            </div>
          </div>
        </div>

        {/* Pay breakdown */}
        <div className="px-6 py-5 flex flex-col gap-0">
          {/* Base salary row */}
          <div className="flex items-center justify-between py-3 border-b border-[#F0F2F5]">
            <p className="text-sm text-[#69707D]">Base Salary</p>
            <p className="text-sm font-semibold text-[#252731]">{fmtCurrency(item.baseSalary)}</p>
          </div>

          {/* Working days row */}
          <div className="flex items-center justify-between py-3 border-b border-[#F0F2F5]">
            <p className="text-sm text-[#69707D]">Working Days</p>
            <p className="text-sm font-semibold text-[#252731]">{WORKING_DAYS}</p>
          </div>

          {/* Absent days row */}
          <div className="flex items-center justify-between py-3 border-b border-[#F0F2F5]">
            <p className="text-sm text-[#69707D]">Absent Days</p>
            <div className="flex items-center gap-1.5">
              {absent > 0 ? (
                <>
                  <span className="text-sm font-semibold text-red-600">{absent}</span>
                  {item.autoAbsentDays > 0 && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B]">AUTO</span>
                  )}
                </>
              ) : (
                <span className="text-sm font-semibold text-[#252731]">—</span>
              )}
            </div>
          </div>

          {/* Deduction row — amber highlight when > 0 */}
          {ded > 0 ? (
            <div className="flex items-center justify-between py-3 border-b border-amber-200 bg-[#FFFBF0] -mx-6 px-6">
              <div>
                <p className="text-sm font-semibold text-amber-800">Deduction</p>
                {item.note ? (
                  <p className="text-[10px] text-amber-700 mt-0.5">{item.note}</p>
                ) : null}
              </div>
              <p className="text-sm font-bold text-amber-700">−{fmtCurrency(ded)}</p>
            </div>
          ) : null}

          {/* Net pay — navy bar */}
          <div
            className="flex items-center justify-between mt-4 rounded-xl px-5 py-4"
            style={{ background: "#0f0d2e" }}
          >
            <p style={{ color: "#D4A843" }} className="text-sm font-bold uppercase tracking-wider">Net Pay</p>
            <p className="text-xl font-bold text-white">{fmtCurrency(net)}</p>
          </div>
        </div>

        {/* Disbursement footer */}
        <div className="px-6 pb-5 pt-1">
          <p className="text-[10px] text-[#B0B8C4]">
            Disbursed {schedule.disbursedDate} by {schedule.disbursedBy} · Ref: {schedule.id} · CONFIDENTIAL
          </p>
        </div>
      </div>

      {/* ── Payslip history table ── */}
      <div className="w-full max-w-lg">
        <h3 className="text-[10px] font-bold text-[#69707D] uppercase tracking-widest mb-3 px-1">Payslip History</h3>
        <div className="bg-white rounded-xl border border-[#E8EAF0] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E8EAF0]">
                {["Month", "Gross", "Deduction", "Net Pay"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[#69707D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {myHistory.slice(0, 3).map(({ schedule: s, item: i }) => {
                const d = deduction(i);
                const n = netPay(i);
                return (
                  <tr key={s.id} className="hover:bg-[#F8F9FC] transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-[#252731]">
                      {MONTH_NAMES[s.month]} {s.year}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#69707D]">{fmtCurrency(i.baseSalary)}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: d > 0 ? "#D97706" : "#B0B8C4" }}>
                      {d > 0 ? `−${fmtCurrency(d)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[#25205B]">{fmtCurrency(n)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Payroll() {
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}") as { name?: string; role?: string }; }
    catch { return {}; }
  })();

  const staffName = session.name ?? "Admin Officer";
  const staffRole = (session.role ?? "admin").toLowerCase();
  const isFinance = staffRole === "finance";
  const canPrepare = staffRole === "admin" || staffRole === "ceo";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [lineItems, setLineItems] = useState<PayrollLineItem[]>(buildLineItems);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const defaultTab: "prepare" | "submitted" | "approved" | "payslip" =
    canPrepare ? "prepare" : isFinance ? "submitted" : "payslip";
  const [activeTab, setActiveTab] = useState<"prepare" | "submitted" | "approved" | "payslip">(defaultTab);

  const submittedSchedules = payrollStore.filter((s) => s.status === "Submitted");
  const approvedSchedules = payrollStore.filter((s) => s.status === "Approved");

  const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  const existingSchedule = payrollStore.find((s) => s.month === selectedMonth && s.year === selectedYear);

  const totalNet = lineItems.reduce((s, i) => s + netPay(i), 0);
  const totalDed = lineItems.reduce((s, i) => s + deduction(i), 0);
  const staffWithDeductions = lineItems.filter((i) => totalAbsent(i) > 0).length;

  function handleLineItemChange(empId: string, field: "manualAbsentDays" | "note", value: number | string) {
    setLineItems((prev) => prev.map((item) => item.empId === empId ? { ...item, [field]: value } : item));
  }

  function handleSendToFinance() {
    const schedule: PayrollSchedule = {
      id: `PAY-${String(scheduleIdCounter++).padStart(3, "0")}`,
      month: selectedMonth,
      year: selectedYear,
      status: "Submitted",
      preparedBy: staffName,
      preparedDate: today(),
      submittedDate: today(),
      lineItems: lineItems.map((i) => ({ ...i })),
    };
    payrollStore = [schedule, ...payrollStore];
    setShowConfirm(false);
    setActiveTab("submitted");
    setExpandedId(schedule.id);
    forceUpdate((n) => n + 1);
  }

  function handleMarkDisbursed(id: string) {
    payrollStore = payrollStore.map((s) =>
      s.id === id
        ? { ...s, status: "Approved" as const, disbursedBy: staffName, disbursedDate: today() }
        : s
    );
    setActiveTab("approved");
    setExpandedId(id);
    forceUpdate((n) => n + 1);
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const tabs: { id: "prepare" | "submitted" | "approved" | "payslip"; label: string }[] = [
    ...(canPrepare ? [{ id: "prepare" as const, label: "Prepare Schedule" }] : []),
    { id: "submitted" as const, label: `Submitted${submittedSchedules.length > 0 ? ` (${submittedSchedules.length})` : ""}` },
    { id: "approved" as const, label: `Approved${approvedSchedules.length > 0 ? ` (${approvedSchedules.length})` : ""}` },
    { id: "payslip" as const, label: "My Payslip" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {showConfirm && (
        <ConfirmSendModal
          schedule={lineItems}
          monthLabel={monthLabel}
          onConfirm={handleSendToFinance}
          onClose={() => setShowConfirm(false)}
        />
      )}

      {/* Page header */}
      <div className="bg-white border-b border-[#E8EAF0] px-6 pt-6 pb-0">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#0f0d2e]">Payroll Schedule</h1>
            <p className="text-sm text-[#69707D] mt-0.5">Monthly salary preparation, disbursement and records</p>
          </div>
          {activeTab === "prepare" && canPrepare && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-[#EAF2FC] border border-[#6B9FE5]/30 rounded-xl px-4 py-2">
                <p className="text-[10px] text-[#25205B] font-semibold uppercase">Net Payroll</p>
                <p className="text-sm font-bold text-[#25205B]">{fmtCurrency(totalNet)}</p>
              </div>
              {totalDed > 0 && (
                <div className="bg-[#FEF3C7] border border-amber-200 rounded-xl px-4 py-2">
                  <p className="text-[10px] text-amber-700 font-semibold uppercase">Deductions</p>
                  <p className="text-sm font-bold text-amber-800">{fmtCurrency(totalDed)}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === t.id ? "border-[#25205B] text-[#25205B]" : "border-transparent text-[#69707D] hover:text-[#252731]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 max-w-[1200px] w-full mx-auto flex flex-col gap-6">

        {/* ── Prepare tab ── */}
        {activeTab === "prepare" && canPrepare && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-[#E8EAF0] rounded-xl px-4 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#69707D]">
                    <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 1v2M10 1v2M1 5.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="text-sm font-semibold text-[#252731] bg-transparent focus:outline-none">
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="text-sm font-semibold text-[#252731] bg-transparent focus:outline-none">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <span className="text-xs text-[#69707D]">
                  <span className="font-semibold text-[#252731]">{EMPLOYEES.length}</span> staff ·{" "}
                  <span className="font-semibold text-[#252731]">{WORKING_DAYS}</span> working days/month ·{" "}
                  {staffWithDeductions > 0
                    ? <span className="text-amber-700 font-semibold">{staffWithDeductions} with deductions</span>
                    : <span>No deductions</span>}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {existingSchedule ? (
                  <div className="flex items-center gap-2 text-xs bg-[#EAF2FC] border border-[#6B9FE5]/30 rounded-xl px-3 py-2">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5.5" stroke="#25205B" strokeWidth="1.2" />
                      <path d="M4 6.5l2 2L9 4" stroke="#25205B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-semibold text-[#25205B]">Already submitted for {monthLabel}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#25205B] text-white text-sm font-semibold rounded-xl hover:bg-[#0f0d2e] transition-colors shadow-sm"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5h7M6.5 3l3.5 3.5L6.5 10" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Send to Finance
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[#EAF2FC] border border-[#6B9FE5]/25 rounded-xl px-4 py-3">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="#6B9FE5" strokeWidth="1.2" />
                <path d="M7.5 6.5v4M7.5 5v-.5" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <p className="text-xs text-[#25205B] leading-relaxed">
                Monthly salary is based on <strong>26 working days</strong> (Monday–Saturday).
                Deduction = <strong>(Base Salary ÷ 26) × Absent Days</strong>.
                Suspended staff are pre-filled with 5 absent days (<span className="font-mono text-[10px] bg-[#FEE2E2] text-[#991B1B] px-1 rounded">AUTO</span>).
                Use <em>Manual Absent</em> for any unreflected absences.
              </p>
            </div>

            <SalaryPrepTable lineItems={lineItems} onChange={handleLineItemChange} />
          </>
        )}

        {/* ── Submitted tab ── */}
        {activeTab === "submitted" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f0d2e]">Submitted Schedules</h2>
                <p className="text-xs text-[#69707D] mt-0.5">
                  {isFinance
                    ? "Review schedules and mark as disbursed once salary has been paid"
                    : "Schedules sent to Finance — awaiting disbursement confirmation"}
                </p>
              </div>
            </div>
            {submittedSchedules.length === 0
              ? <EmptyState label="No submitted schedules yet" />
              : (
                <div className="flex flex-col gap-4">
                  {submittedSchedules.map((s) => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      onMarkDisbursed={isFinance ? () => handleMarkDisbursed(s.id) : undefined}
                      disbursedByName={staffName}
                      isFinance={isFinance}
                    />
                  ))}
                </div>
              )}
          </>
        )}

        {/* ── Approved tab ── */}
        {activeTab === "approved" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f0d2e]">Approved Schedules</h2>
                <p className="text-xs text-[#69707D] mt-0.5">Confirmed and disbursed salary schedules — available for PDF or CSV download</p>
              </div>
            </div>
            {approvedSchedules.length === 0
              ? <EmptyState label="No approved schedules yet" />
              : (
                <div className="flex flex-col gap-4">
                  {approvedSchedules.map((s) => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      disbursedByName={staffName}
                      isFinance={isFinance}
                    />
                  ))}
                </div>
              )}
          </>
        )}

        {/* ── My Payslip tab ── */}
        {activeTab === "payslip" && (
          <>
            <div>
              <h2 className="text-base font-bold text-[#0f0d2e]">My Payslip</h2>
              <p className="text-xs text-[#69707D] mt-0.5">Your most recent approved salary statement</p>
            </div>
            <MyPayslipTab staffName={staffName} />
          </>
        )}
      </div>
    </div>
  );
}
