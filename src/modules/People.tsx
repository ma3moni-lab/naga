import { useState, useEffect } from "react";
import { EMPLOYEES, LEAVE_REQUESTS, DEPLOYMENT_RECORDS, PROJECTS, STAYS_BOOKINGS } from "../data/dummy";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { logActivity } from "../data/activityLog";
import { showToast } from "../utils/toast";
import { useCountUp } from "../hooks/useCountUp";
import { exportCSV } from "../utils/csvExport";

type Employee = typeof EMPLOYEES[0] & {
  suspensionReason?: string;
  salary?: number;
  phone?: string;
  email?: string;
  grade?: string;
  contractType?: string;
  terminated?: boolean;
  promotionHistory?: { from: string; to: string; date: string }[];
};
type LeaveRequest = {
  id: string; employee: string; empId: string; role: string; department: string;
  type: string; startDate: string; endDate: string; days: number; reason: string;
  status: string; approvedBy: string | null; approvedDays: number | null; submittedDate: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "#dcfce7", color: "#166534" },
    "On Leave": { bg: "#EAF2FC", color: "#25205B" },
    Suspended: { bg: "#fee2e2", color: "#991b1b" },
    Approved: { bg: "#dcfce7", color: "#166534" },
    Pending: { bg: "#fef3c7", color: "#92400e" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
    Modified: { bg: "#f3e8ff", color: "#7c3aed" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>{status}</span>
  );
}

const GRADES = ["Officer", "Senior Officer", "Manager", "Senior Manager", "Director", "Executive Director"];

/* ─── STAFF DETAIL DRAWER ───────────────────────────────────────── */
function StaffDrawer({
  emp, onClose, onSuspend, isCEO, canManageStaff,
  onPromote, onSalaryChange, onAssignProject, onAssignGuest, onTerminate,
}: {
  emp: Employee; onClose: () => void; onSuspend: (e: Employee) => void; isCEO: boolean; canManageStaff?: boolean;
  onPromote: (empId: string, newGrade: string, newRole: string, newSalary: number) => void;
  onSalaryChange: (empId: string, newSalary: number, reason: string) => void;
  onAssignProject: (empId: string, projectId: string, projectName: string) => void;
  onAssignGuest: (empId: string, bookingId: string) => void;
  onTerminate: (empId: string, reason: string) => void;
}) {
  const empDeployments = DEPLOYMENT_RECORDS.filter((d) => d.empId === emp.id);
  const empLeave = LEAVE_REQUESTS.filter((l) => l.empId === emp.id);
  const [activeAction, setActiveAction] = useState<"promote" | "salary" | "assign-project" | "assign-guest" | "terminate" | null>(null);

  // Promote state
  const [newGrade, setNewGrade] = useState(emp.grade ?? "Officer");
  const [newRole, setNewRole] = useState(emp.role);
  const [promoteSalary, setPromoteSalary] = useState(String(emp.salary ?? 0));

  // Salary state
  const [salaryMode, setSalaryMode] = useState<"increase" | "decrease">("increase");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryType, setSalaryType] = useState<"fixed" | "percent">("fixed");
  const [salaryReason, setSalaryReason] = useState("");

  // Assign project state
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Assign guest state
  const [selectedBookingId, setSelectedBookingId] = useState("");

  // Terminate state
  const [terminateReason, setTerminateReason] = useState("");
  const [terminateConfirm, setTerminateConfirm] = useState("");

  const fmtSalary = (v: number) => "₦" + v.toLocaleString("en-NG");

  const computedSalary = (() => {
    const base = emp.salary ?? 0;
    const n = parseFloat(salaryAmount) || 0;
    if (salaryType === "percent") {
      return salaryMode === "increase" ? Math.round(base * (1 + n / 100)) : Math.round(base * (1 - n / 100));
    }
    return salaryMode === "increase" ? base + n : base - n;
  })();

  const closeAction = () => setActiveAction(null);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" style={{ background: "rgba(15,13,46,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[500px] h-full bg-white overflow-y-auto shadow-2xl" style={{ animation: "slideInRight 0.28s cubic-bezier(0.32,0.72,0,1)" }}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#69707D" }}>Staff Profile</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar + identity */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold shrink-0" style={{ background: "#25205B", color: "white" }}>
              {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-semibold text-[18px]" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>{emp.name}</h2>
                <StatusBadge status={emp.status} />
                {emp.terminated && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>TERMINATED</span>}
              </div>
              <div className="text-[13px]" style={{ color: "#69707D" }}>{emp.role}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#6B9FE5" }}>{emp.department} · {emp.location}</div>
              {emp.grade && <div className="text-[11px] mt-0.5 font-semibold" style={{ color: "#25205B" }}>Grade: {emp.grade}</div>}
            </div>
          </div>

          {/* Extended details grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quick contact buttons */}
          {(emp.phone || emp.email) && (
            <div className="flex gap-2">
              {emp.phone && (
                <a
                  href={`tel:${emp.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                  style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 1h3l1.5 3.5-1.5 1.5A8 8 0 008 9l1.5-1.5L13 9v3c-6.5 1-12-4.5-11-11z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  Call
                </a>
              )}
              {emp.email && (
                <a
                  href={`mailto:${emp.email}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                  style={{ background: "#F7F8FA", color: "#252731", border: "1px solid #E8EAF0" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Email
                </a>
              )}
            </div>
          )}

          {([
              { label: "Employee ID", value: emp.id },
              { label: "Join Date", value: emp.joinDate },
              { label: "Contract", value: emp.contractType ?? "—" },
              { label: "Grade", value: emp.grade ?? "—" },
              { label: "Phone", value: emp.phone ?? "—" },
              { label: "Email", value: emp.email ?? "—" },
              ...(isCEO || canManageStaff ? [{ label: "Monthly Salary", value: emp.salary ? fmtSalary(emp.salary) : "—" }] : []),
            ] as { label: string; value: string }[]).map((r) => (
              <div key={r.label} className={`rounded-xl px-4 py-3${r.label === "Email" || r.label === "Monthly Salary" ? " col-span-2" : ""}`} style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>{r.label}</div>
                <div className="font-semibold text-[13px] truncate" style={{ color: r.label === "Monthly Salary" ? "#25205B" : "#252731" }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Promotion history */}
          {emp.promotionHistory && emp.promotionHistory.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Promotion History</div>
              <div className="space-y-1.5">
                {emp.promotionHistory.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                    <span style={{ color: "#69707D" }}>{p.from}</span>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M0 4h10M7 1l3 3-3 3" stroke="#6B9FE5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="font-semibold" style={{ color: "#25205B" }}>{p.to}</span>
                    <span className="ml-auto" style={{ color: "#B0B8C4" }}>{p.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspension info */}
          {emp.status === "Suspended" && emp.suspensionReason && (
            <div className="rounded-xl p-4" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#991b1b" }}>Under Suspension</div>
              <div className="text-[12px]" style={{ color: "#7f1d1d" }}>{emp.suspensionReason}</div>
            </div>
          )}

          {/* Deployment history */}
          {empDeployments.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>Deployment History</div>
              <div className="space-y-3">
                {empDeployments.map((d) => (
                  <div key={d.id} className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-mono text-[10px]" style={{ color: "#6B9FE5" }}>{d.id}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{d.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] flex-wrap">
                      <span style={{ color: "#69707D" }}>{d.fromProject} ({d.fromLocation})</span>
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h12M9 1l4 4-4 4" stroke="#6B9FE5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span className="font-semibold" style={{ color: "#252731" }}>{d.toProject} ({d.toLocation})</span>
                    </div>
                    <div className="text-[11px] mt-1.5" style={{ color: "#69707D" }}>{d.reason}</div>
                    <div className="text-[10px] mt-1" style={{ color: "#B0B8C4" }}>Effective {d.effectiveDate} · Authorized by {d.authorizedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave history */}
          {empLeave.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>Leave History</div>
              <div className="space-y-2">
                {empLeave.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>{l.type} · {l.days} days</div>
                      <div className="text-[11px]" style={{ color: "#69707D" }}>{l.startDate} → {l.endDate}</div>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!emp.terminated && (
            <div className="pt-2 border-t border-[#E8EAF0] space-y-3">
              <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Actions</div>

              {/* Standard action — suspend */}
              {emp.status !== "Suspended" && (
                <button onClick={() => { onSuspend(emp); onClose(); }}
                  className="w-full py-2.5 text-[13px] font-semibold rounded-xl transition-all hover:bg-red-50"
                  style={{ border: "1.5px solid #fca5a5", color: "#dc2626" }}>
                  Issue Suspension
                </button>
              )}

              {/* Privileged staff actions — salary/terminate are CEO-only; promote/assign available to admin */}
              {(isCEO || canManageStaff) && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "promote" as const, label: "Promote Staff", icon: "↑", color: "#25205B", bg: "#EAF2FC", border: "#D3E3F9", ceoOnly: false },
                      { id: "salary" as const, label: "Adjust Salary", icon: "₦", color: "#7c3aed", bg: "#f3e8ff", border: "#e9d5ff", ceoOnly: true },
                      { id: "assign-project" as const, label: "Assign to Project", icon: "⬡", color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", ceoOnly: false },
                      { id: "assign-guest" as const, label: "Assign to Guest", icon: "🛎", color: "#92400e", bg: "#fef3c7", border: "#fde68a", ceoOnly: false },
                    ].filter(a => !a.ceoOnly || isCEO).map((a) => (
                      <button key={a.id} onClick={() => setActiveAction(activeAction === a.id ? null : a.id)}
                        className="py-2.5 px-3 text-[12px] font-semibold rounded-xl transition-all text-left flex items-center gap-2"
                        style={{ background: activeAction === a.id ? a.bg : "#F7F8FA", border: `1.5px solid ${activeAction === a.id ? a.border : "#E8EAF0"}`, color: activeAction === a.id ? a.color : "#252731" }}>
                        <span>{a.icon}</span>{a.label}
                      </button>
                    ))}
                  </div>

                  {/* PROMOTE PANEL */}
                  {activeAction === "promote" && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#25205B" }}>Promote {emp.name}</div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#25205B" }}>New Grade</label>
                        <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ border: "1px solid #D3E3F9", background: "white", color: "#252731" }}>
                          {GRADES.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#25205B" }}>New Title / Role</label>
                        <input value={newRole} onChange={(e) => setNewRole(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ border: "1px solid #D3E3F9", background: "white", color: "#252731" }} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#25205B" }}>New Monthly Salary (₦)</label>
                        <input type="number" value={promoteSalary} onChange={(e) => setPromoteSalary(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ border: "1px solid #D3E3F9", background: "white", color: "#252731" }} />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={closeAction} className="flex-1 py-2 rounded-lg text-[12px] font-semibold" style={{ border: "1px solid #D3E3F9", color: "#25205B" }}>Cancel</button>
                        <button onClick={() => { onPromote(emp.id, newGrade, newRole, parseFloat(promoteSalary) || 0); closeAction(); }}
                          className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#25205B" }}>
                          Confirm Promotion
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SALARY ADJUST PANEL */}
                  {activeAction === "salary" && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "#f3e8ff", border: "1px solid #e9d5ff" }}>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#7c3aed" }}>Salary Adjustment</div>
                        <span className="text-[11px] font-semibold" style={{ color: "#7c3aed" }}>Current: {emp.salary ? fmtSalary(emp.salary) : "—"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["increase", "decrease"] as const).map((m) => (
                          <button key={m} onClick={() => setSalaryMode(m)}
                            className="py-2 rounded-lg text-[12px] font-semibold capitalize"
                            style={{ background: salaryMode === m ? (m === "increase" ? "#dcfce7" : "#fee2e2") : "white", color: salaryMode === m ? (m === "increase" ? "#166534" : "#991b1b") : "#69707D", border: `1.5px solid ${salaryMode === m ? (m === "increase" ? "#bbf7d0" : "#fca5a5") : "#E8EAF0"}` }}>
                            {m === "increase" ? "↑ Increase" : "↓ Decrease"}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="number" placeholder="Amount" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ border: "1px solid #e9d5ff", background: "white", color: "#252731" }} />
                        <select value={salaryType} onChange={(e) => setSalaryType(e.target.value as "fixed" | "percent")}
                          className="px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ border: "1px solid #e9d5ff", background: "white", color: "#252731" }}>
                          <option value="fixed">₦ Fixed</option>
                          <option value="percent">% Rate</option>
                        </select>
                      </div>
                      {salaryAmount && (
                        <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: "white", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                          New salary: <strong>{fmtSalary(computedSalary)}</strong>
                          {emp.salary ? ` (${salaryMode === "increase" ? "+" : "-"}${fmtSalary(Math.abs(computedSalary - emp.salary))})` : ""}
                        </div>
                      )}
                      <textarea rows={2} placeholder="Reason for adjustment..." value={salaryReason} onChange={(e) => setSalaryReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                        style={{ border: "1px solid #e9d5ff", background: "white", color: "#252731" }} />
                      <div className="flex gap-2 pt-1">
                        <button onClick={closeAction} className="flex-1 py-2 rounded-lg text-[12px] font-semibold" style={{ border: "1px solid #e9d5ff", color: "#7c3aed" }}>Cancel</button>
                        <button onClick={() => { if (salaryAmount && salaryReason.trim()) { onSalaryChange(emp.id, computedSalary, salaryReason); closeAction(); } }}
                          disabled={!salaryAmount || !salaryReason.trim()}
                          className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40" style={{ background: "#7c3aed" }}>
                          Apply Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ASSIGN PROJECT PANEL */}
                  {activeAction === "assign-project" && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#0369a1" }}>Assign to Project</div>
                      <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none"
                        style={{ border: "1px solid #bae6fd", background: "white", color: "#252731" }}>
                        <option value="">— Select project —</option>
                        {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.location})</option>)}
                      </select>
                      <div className="flex gap-2 pt-1">
                        <button onClick={closeAction} className="flex-1 py-2 rounded-lg text-[12px] font-semibold" style={{ border: "1px solid #bae6fd", color: "#0369a1" }}>Cancel</button>
                        <button onClick={() => { if (selectedProjectId) { const p = PROJECTS.find((x) => x.id === selectedProjectId); onAssignProject(emp.id, selectedProjectId, p?.name ?? ""); closeAction(); } }}
                          disabled={!selectedProjectId}
                          className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40" style={{ background: "#0369a1" }}>
                          Assign
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ASSIGN GUEST PANEL */}
                  {activeAction === "assign-guest" && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#92400e" }}>Assign as Guest Attendant</div>
                      <select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none"
                        style={{ border: "1px solid #fde68a", background: "white", color: "#252731" }}>
                        <option value="">— Select active booking —</option>
                        {STAYS_BOOKINGS.filter((b) => b.status === "Active" || b.status === "Confirmed").map((b) => (
                          <option key={b.id} value={b.id}>{b.guest} — {b.unit}</option>
                        ))}
                      </select>
                      <div className="flex gap-2 pt-1">
                        <button onClick={closeAction} className="flex-1 py-2 rounded-lg text-[12px] font-semibold" style={{ border: "1px solid #fde68a", color: "#92400e" }}>Cancel</button>
                        <button onClick={() => { if (selectedBookingId) { onAssignGuest(emp.id, selectedBookingId); closeAction(); } }}
                          disabled={!selectedBookingId}
                          className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40" style={{ background: "#92400e" }}>
                          Assign
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TERMINATE PANEL — CEO only */}
                  {isCEO && (
                    <>
                      <button onClick={() => setActiveAction(activeAction === "terminate" ? null : "terminate")}
                        className="w-full py-2.5 text-[13px] font-semibold rounded-xl transition-all"
                        style={{ background: activeAction === "terminate" ? "#fee2e2" : "transparent", border: "1.5px solid #fca5a5", color: "#dc2626" }}>
                        Terminate Employment
                      </button>
                      {activeAction === "terminate" && (
                        <div className="rounded-xl p-4 space-y-3" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                          <div className="text-[12px] font-semibold" style={{ color: "#991b1b" }}>This action is permanent and will be recorded in the audit trail.</div>
                          <textarea rows={3} placeholder="State reason for termination..." value={terminateReason} onChange={(e) => setTerminateReason(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                            style={{ border: "1px solid #fca5a5", background: "white", color: "#252731" }} />
                          <div>
                            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#991b1b" }}>
                              Type employee name to confirm: <strong>{emp.name}</strong>
                            </label>
                            <input value={terminateConfirm} onChange={(e) => setTerminateConfirm(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                              style={{ border: "1px solid #fca5a5", background: "white", color: "#252731" }} />
                          </div>
                          <button onClick={() => { if (terminateConfirm === emp.name && terminateReason.trim()) { onTerminate(emp.id, terminateReason); closeAction(); } }}
                            disabled={terminateConfirm !== emp.name || !terminateReason.trim()}
                            className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
                            style={{ background: "#dc2626" }}>
                            Confirm Termination
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:none}}`}</style>
    </div>
  );
}

/* ─── LEAVE APPROVAL MODAL ───────────────────────────────────────── */
function LeaveApprovalModal({ leave, onClose, onApprove, onReject }: {
  leave: LeaveRequest; onClose: () => void;
  onApprove: (id: string, days: number, note: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [approvedDays, setApprovedDays] = useState(leave.days);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const modified = approvedDays !== leave.days;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,13,46,0.65)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[480px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] mb-0.5" style={{ color: "#6B9FE5" }}>{leave.id}</div>
              <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Leave Request — {leave.employee}</h3>
              <div className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{leave.role} · {leave.type}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Request summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Start Date", value: leave.startDate },
              { label: "End Date", value: leave.endDate },
              { label: "Days Requested", value: `${leave.days} days` },
            ].map((r) => (
              <div key={r.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>{r.label}</div>
                <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{r.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Reason</div>
            <div className="text-[13px]" style={{ color: "#252731" }}>{leave.reason}</div>
          </div>

          {/* Approve with modification */}
          {!action && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
              <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#25205B" }}>Approve — with optional day adjustment</div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#25205B" }}>Days to approve</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setApprovedDays(Math.max(1, approvedDays - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[16px]" style={{ background: "rgba(37,32,91,0.1)", color: "#25205B" }}>-</button>
                    <span className="w-12 text-center font-bold text-[18px]" style={{ color: "#25205B" }}>{approvedDays}</span>
                    <button onClick={() => setApprovedDays(Math.min(leave.days, approvedDays + 1))} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[16px]" style={{ background: "rgba(37,32,91,0.1)", color: "#25205B" }}>+</button>
                  </div>
                </div>
                {modified && (
                  <div className="text-[11px] p-2.5 rounded-lg" style={{ background: "#f3e8ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                    Reduced from {leave.days} to {approvedDays} days
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Note (optional)</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note to the approval or rejection..." className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={() => onReject(leave.id, note)} className="flex-1 py-3 font-semibold text-[13px] rounded-xl transition-all hover:bg-red-50"
            style={{ border: "1.5px solid #fca5a5", color: "#dc2626" }}>Reject</button>
          <button onClick={() => onApprove(leave.id, approvedDays, note)} className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white"
            style={{ background: "#25205B" }}>
            {modified ? `Approve (${approvedDays} days)` : "Approve"}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ─── SUSPENSION MODAL ───────────────────────────────────────────── */
function SuspensionModal({ emp, onClose, onConfirm }: {
  emp: Employee; onClose: () => void;
  onConfirm: (empId: string, days: number, withPay: boolean, reason: string) => void;
}) {
  const [days, setDays] = useState(3);
  const [withPay, setWithPay] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,13,46,0.65)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[440px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Issue Suspension</h3>
          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>
            <span className="font-semibold">{emp.name}</span> · {emp.role}
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-xl text-[12px]" style={{ background: "#FEF2F2", border: "1px solid #fca5a5", color: "#991b1b" }}>
            A suspension is a serious action and will be logged in the audit trail. The employee will be notified automatically.
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Duration</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setDays(Math.max(1, days - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[18px]" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0", color: "#252731" }}>-</button>
              <div className="flex-1 text-center">
                <span className="font-bold text-[28px]" style={{ color: "#25205B" }}>{days}</span>
                <span className="text-[13px] ml-1.5" style={{ color: "#69707D" }}>working day{days !== 1 ? "s" : ""}</span>
              </div>
              <button onClick={() => setDays(days + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[18px]" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0", color: "#252731" }}>+</button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Pay during suspension</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: "Without pay", val: false }, { label: "With pay", val: true }].map((opt) => (
                <button key={String(opt.val)} onClick={() => setWithPay(opt.val)}
                  className="py-3 rounded-xl text-[13px] font-semibold transition-all"
                  style={{ background: withPay === opt.val ? (opt.val ? "#EAF2FC" : "#fee2e2") : "#F7F8FA", color: withPay === opt.val ? (opt.val ? "#25205B" : "#991b1b") : "#69707D", border: `1.5px solid ${withPay === opt.val ? (opt.val ? "#D3E3F9" : "#fca5a5") : "#E8EAF0"}` }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Reason for suspension <span style={{ color: "#dc2626" }}>*</span></label>
            <textarea required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the reason for this suspension..." className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(emp.id, days, withPay, reason)} disabled={!reason.trim()}
            className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white disabled:opacity-40" style={{ background: "#dc2626" }}>
            Suspend {days} day{days !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ─── ROLE ASSIGNMENT (CEO only) ─────────────────────────────────── */
const ALL_ROLES = [
  "MD / CEO", "Finance Manager", "PCO — Palm Court", "PCO — Emerald Gardens",
  "PCO — Granite Heights", "General Supervisor — Abuja", "General Supervisor — Lagos",
  "General Supervisor — Benin City", "Inventory Manager", "Estate Manager — Palm Estate",
  "Estate Manager — Abuja", "Admin Officer", "PRM",
];

const PLATFORM_ROLES: Record<string, string> = {
  "MD / CEO": "ceo",
  "Finance Manager": "finance",
  "Admin Officer": "admin",
  "Inventory Manager": "ivm",
  "Estate Manager — Palm Estate": "estate",
  "Estate Manager — Abuja": "estate",
};

interface RoleLog {
  id: string; actor: string; target: string; from: string; to: string; date: string;
}

function RoleAssignment({ employees, onUpdate }: { employees: Employee[]; onUpdate: (empId: string, newRole: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState("");
  const [log, setLog] = useState<RoleLog[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setPendingRole(emp.role);
    setConfirmId(null);
  };

  const confirmChange = (emp: Employee) => {
    const newLog: RoleLog = {
      id: "RA-" + Date.now(),
      actor: "Emeka Okonkwo (CEO)",
      target: emp.name,
      from: emp.role,
      to: pendingRole,
      date: new Date().toISOString().slice(0, 10),
    };
    setLog((prev) => [newLog, ...prev]);
    onUpdate(emp.id, pendingRole);
    setEditingId(null);
    setConfirmId(null);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 text-[12px]" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9", color: "#25205B" }}>
        <span className="font-semibold">Super Admin mode active.</span> As CEO, you can reassign roles and responsibilities to any staff member. All changes are logged in the audit trail below.
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8EAF0]">
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Staff Role Assignments</div>
        </div>
        <div className="divide-y divide-[#F0F2F5]">
          {employees.filter((e) => e.id !== "EMP-001").map((e) => {
            const isEditing = editingId === e.id;
            const platformRole = PLATFORM_ROLES[e.role];
            return (
              <div key={e.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#EAF2FC", color: "#25205B" }}>
                  {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{e.name}</div>
                  <div className="text-[11px]" style={{ color: "#69707D" }}>{e.department} · {e.location}</div>
                </div>
                {platformRole && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#6B9FE5", border: "1px solid #E8EAF0" }}>
                    Platform: {platformRole}
                  </span>
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={pendingRole} onChange={(ev) => setPendingRole(ev.target.value)}
                      className="text-[12px] px-3 py-2 rounded-xl outline-none"
                      style={{ border: "1px solid #D3E3F9", background: "#F7F8FA", color: "#252731", minWidth: "220px" }}>
                      {ALL_ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    {pendingRole !== e.role ? (
                      <button onClick={() => setConfirmId(e.id)}
                        className="px-3 py-1.5 text-[12px] font-semibold rounded-lg text-white"
                        style={{ background: "#25205B" }}>Confirm</button>
                    ) : null}
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[12px] font-semibold rounded-lg"
                      style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                    {confirmId === e.id && pendingRole !== e.role && (
                      <div className="w-full mt-2 p-3 rounded-xl text-[12px]" style={{ background: "#FEF9EC", border: "1px solid #fcd34d" }}>
                        <div className="font-semibold mb-2" style={{ color: "#92400e" }}>
                          Confirm role change for {e.name}?
                        </div>
                        <div className="text-[11px] mb-3" style={{ color: "#b45309" }}>
                          From: <b>{e.role}</b> → To: <b>{pendingRole}</b>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => confirmChange(e)}
                            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg text-white"
                            style={{ background: "#25205B" }}>Apply Change</button>
                          <button onClick={() => setConfirmId(null)} className="px-4 py-1.5 text-[12px] font-semibold rounded-lg"
                            style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[12px]" style={{ color: "#252731" }}>{e.role}</span>
                    <button onClick={() => startEdit(e)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[#EAF2FC]"
                      style={{ border: "1px solid #D3E3F9", color: "#25205B" }}>
                      Edit Role
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8EAF0]">
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Role Change Audit Log</div>
        </div>
        {log.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: "#69707D" }}>No role changes recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#F0F2F5]">
            {log.map((l) => (
              <div key={l.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#6B9FE5" }} />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>
                    {l.target} — role updated to <span style={{ color: "#25205B" }}>{l.to}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>
                    From: {l.from} · Authorized by {l.actor}
                  </div>
                </div>
                <div className="text-[10px] shrink-0" style={{ color: "#B0B8C4" }}>{l.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN MODULE ────────────────────────────────────────────────── */
export default function People() {
  const staffRaw = sessionStorage.getItem("naga_staff");
  const staffRole = staffRaw ? JSON.parse(staffRaw).role : "ceo";
  const isCEO = staffRole === "ceo";
  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const staffActorName: string = staffInfo.name ?? "Admin";
  const staffActorRole: string = (staffInfo.role ?? "admin").toUpperCase();
  const isAdmin = staffRole === "admin";
  // HR admin can promote, assign, and manage roles — but salary changes and termination remain CEO-only
  const canDoHRActions = isCEO || isAdmin;

  const [tab, setTab] = useState<"employees" | "leave" | "deployments" | "roles">("employees");
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Employee | null>(null);
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(LEAVE_REQUESTS);
  const [actionLog, setActionLog] = useState<{ id: string; text: string; date: string }[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; empId: string } | null>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => setCtxMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [ctxMenu]);

  const handleSuspend = (empId: string, days: number, withPay: boolean, reason: string) => {
    setEmployees((prev) => prev.map((e) => e.id === empId ? {
      ...e, status: "Suspended",
      suspensionReason: `${reason} · ${days} working day${days !== 1 ? "s" : ""}${withPay ? " with pay" : " without pay"}.`,
    } : e));
    setSuspendTarget(null);
    setSelectedEmp(null);
    showToast(`Suspension issued for ${days} day${days !== 1 ? "s" : ""} ${withPay ? "with pay" : "without pay"}.`);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffActorName,
      role: staffActorRole,
      action: "Employee Suspended",
      module: "People",
      detail: `Suspended ${employees.find(e => e.id === empId)?.name ?? empId} for ${days} day(s) ${withPay ? "with pay" : "without pay"} — ${reason}`,
      severity: "warning",
    });
  };

  const handleApproveLeave = (id: string, days: number, note: string) => {
    setLeaveRequests((prev) => prev.map((l) => l.id === id ? {
      ...l, status: days < l.days ? "Modified" : "Approved", approvedDays: days, approvedBy: "Emeka Okonkwo",
    } : l));
    setApproveTarget(null);
    showToast(days < LEAVE_REQUESTS.find((l) => l.id === id)!.days ? `Leave approved with modification — ${days} days granted.` : "Leave request approved.");
    const lv = LEAVE_REQUESTS.find((l) => l.id === id);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffActorName,
      role: staffActorRole,
      action: "Leave Approved",
      module: "People",
      detail: `Leave request approved for ${lv?.employee ?? id} — ${days} day(s) granted.`,
      ref: id,
      severity: "info",
    });
  };

  const handleRejectLeave = (id: string, _note: string) => {
    setLeaveRequests((prev) => prev.map((l) => l.id === id ? { ...l, status: "Rejected", approvedBy: "Emeka Okonkwo" } : l));
    setApproveTarget(null);
    showToast("Leave request rejected.", "error");
    const lv2 = LEAVE_REQUESTS.find((l) => l.id === id);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffActorName,
      role: staffActorRole,
      action: "Leave Rejected",
      module: "People",
      detail: `Leave request rejected for ${lv2?.employee ?? id}.`,
      ref: id,
      severity: "warning",
    });
  };

  const logAction = (text: string) => {
    setActionLog((prev) => [{ id: "AL-" + Date.now(), text, date: new Date().toISOString().slice(0, 10) }, ...prev]);
  };

  const handlePromote = (empId: string, newGrade: string, newRole: string, newSalary: number) => {
    setEmployees((prev) => prev.map((e) => {
      if (e.id !== empId) return e;
      return {
        ...e, role: newRole, grade: newGrade, salary: newSalary,
        promotionHistory: [
          ...(e.promotionHistory ?? []),
          { from: e.grade ?? e.role, to: newGrade, date: new Date().toISOString().slice(0, 10) },
        ],
      };
    }));
    const emp = employees.find((e) => e.id === empId);
    logAction(`${emp?.name} promoted to ${newGrade} (${newRole}) — salary set to ₦${newSalary.toLocaleString()}`);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffActorName,
      role: staffActorRole,
      action: "Staff Promoted",
      module: "People",
      detail: `Promoted ${emp?.name ?? empId} to ${newGrade} (${newRole}) — salary set to ₦${newSalary.toLocaleString()}.`,
      ref: empId,
      severity: "info",
    });
    setSelectedEmp(null);
    showToast(`${emp?.name} has been promoted to ${newGrade}.`);
  };

  const handleSalaryChange = (empId: string, newSalary: number, reason: string) => {
    const emp = employees.find((e) => e.id === empId);
    const old = emp?.salary ?? 0;
    setEmployees((prev) => prev.map((e) => e.id === empId ? { ...e, salary: newSalary } : e));
    logAction(`${emp?.name} salary ${newSalary > old ? "increased" : "decreased"} from ₦${old.toLocaleString()} to ₦${newSalary.toLocaleString()} — ${reason}`);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffActorName,
      role: staffActorRole,
      action: "Salary Updated",
      module: "People",
      detail: `${emp?.name ?? empId} salary ${newSalary > old ? "increased" : "decreased"} to ₦${newSalary.toLocaleString()} — ${reason}`,
      ref: empId,
      severity: "info",
    });
    setSelectedEmp(null);
    showToast(`Salary updated to ₦${newSalary.toLocaleString("en-NG")}.`);
  };

  const handleAssignProject = (empId: string, _projectId: string, projectName: string) => {
    const emp = employees.find((e) => e.id === empId);
    logAction(`${emp?.name} assigned to project: ${projectName}`);
    setSelectedEmp(null);
    showToast(`${emp?.name} assigned to ${projectName}.`);
  };

  const handleAssignGuest = (empId: string, bookingId: string) => {
    const emp = employees.find((e) => e.id === empId);
    const booking = STAYS_BOOKINGS.find((b) => b.id === bookingId);
    logAction(`${emp?.name} assigned as attendant for guest ${booking?.guest ?? bookingId}`);
    setSelectedEmp(null);
    showToast(`${emp?.name} assigned to guest ${booking?.guest ?? bookingId}.`);
  };

  const handleTerminate = (empId: string, reason: string) => {
    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.map((e) => e.id === empId ? { ...e, status: "Inactive" as typeof e.status, terminated: true } : e));
    logAction(`${emp?.name} (${emp?.role}) employment terminated — ${reason}`);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffActorName,
      role: staffActorRole,
      action: "Employee Terminated",
      module: "People",
      detail: `Terminated ${emp?.name ?? empId} (${emp?.role ?? ""}) — ${reason}`,
      ref: empId,
      severity: "critical",
    });
    setSelectedEmp(null);
    showToast(`${emp?.name}'s employment has been terminated.`, "error");
  };

  const handleRoleUpdate = (empId: string, newRole: string) => {
    setEmployees((prev) => prev.map((e) => e.id === empId ? { ...e, role: newRole } : e));
    showToast(`Role updated successfully.`);
  };

  const countTotal = useCountUp(employees.length, { duration: 900 });
  const countActive = useCountUp(employees.filter((e) => e.status === "Active").length, { duration: 900 });
  const countOnLeave = useCountUp(employees.filter((e) => e.status === "On Leave").length, { duration: 900 });
  const countSuspended = useCountUp(employees.filter((e) => e.status === "Suspended").length, { duration: 900 });

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const pendingLeave = leaveRequests.filter((l) => l.status === "Pending");

  const headcountData = [
    { month: "Jan", staff: 7 }, { month: "Feb", staff: 7 }, { month: "Mar", staff: 8 },
    { month: "Apr", staff: 8 }, { month: "May", staff: 9 }, { month: "Jun", staff: 9 },
    { month: "Jul", staff: 10 }, { month: "Aug", staff: employees.filter((e) => !e.terminated).length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px]">
      {selectedEmp && <StaffDrawer
        emp={selectedEmp}
        onClose={() => setSelectedEmp(null)}
        onSuspend={(e) => setSuspendTarget(e)}
        isCEO={isCEO}
        canManageStaff={canDoHRActions}
        onPromote={handlePromote}
        onSalaryChange={handleSalaryChange}
        onAssignProject={handleAssignProject}
        onAssignGuest={handleAssignGuest}
        onTerminate={handleTerminate}
      />}
      {suspendTarget && <SuspensionModal emp={suspendTarget} onClose={() => setSuspendTarget(null)} onConfirm={handleSuspend} />}
      {approveTarget && <LeaveApprovalModal leave={approveTarget} onClose={() => setApproveTarget(null)} onApprove={handleApproveLeave} onReject={handleRejectLeave} />}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>People</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Staff records, leave management, and deployment history</p>
        </div>
        {pendingLeave.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }} onClick={() => setTab("leave")}>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {pendingLeave.length} leave request{pendingLeave.length > 1 ? "s" : ""} awaiting action
          </div>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: countTotal, style: { background: "#25205B" }, textStyle: { color: "white" }, subStyle: { color: "#6B9FE5" } },
          { label: "Active", value: countActive, style: { background: "white", border: "1px solid #E8EAF0" }, textStyle: { color: "#252731" }, subStyle: { color: "#69707D" } },
          { label: "On Leave", value: countOnLeave, style: { background: "white", border: "1px solid #E8EAF0" }, textStyle: { color: "#25205B" }, subStyle: { color: "#69707D" } },
          { label: "Suspended", value: countSuspended, style: { background: "#fee2e2", border: "1px solid #fca5a5" }, textStyle: { color: "#991b1b" }, subStyle: { color: "#991b1b" } },
        ].map((s) => (
          <div key={s.label} className="rounded-xl px-5 py-4" style={s.style}>
            <div className="text-xs font-medium mb-1" style={s.subStyle}>{s.label}</div>
            <div className="text-2xl font-bold" style={s.textStyle}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Suspended alert */}
      {employees.some((e) => e.status === "Suspended") && (
        <div className="rounded-xl p-4" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
          <div className="text-[12px] font-semibold mb-2" style={{ color: "#991b1b" }}>Staff currently under suspension</div>
          {employees.filter((e) => e.status === "Suspended").map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-[12px]" style={{ color: "#7f1d1d" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="font-semibold">{e.name}</span> ({e.role}){e.suspensionReason ? ` — ${e.suspensionReason}` : ""}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-xl flex-wrap">
        {([
          { id: "employees" as const, label: "All Staff" },
          { id: "leave" as const, label: `Leave Requests${pendingLeave.length > 0 ? ` (${pendingLeave.length})` : ""}` },
          { id: "deployments" as const, label: "Deployments" },
          ...(canDoHRActions ? [{ id: "roles" as const, label: "Role Assignment" }] : []),
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${tab === t.id ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* EMPLOYEES TAB */}
      {tab === "employees" && (
        <>
          {/* Headcount trend chart */}
          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>Headcount Trend</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Active staff over the past 8 months</div>
              </div>
              <div className="text-[22px] font-bold" style={{ color: "#25205B" }}>{employees.filter((e) => !e.terminated).length}</div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={headcountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} domain={[0, 15]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E8EAF0" }} />
                <Line type="monotone" dataKey="staff" stroke="#25205B" strokeWidth={2.5} dot={{ r: 3, fill: "#25205B" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <input type="text" placeholder="Search by name, role, or department..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 text-sm bg-white border border-[#E8EAF0] rounded-xl outline-none focus:border-[#6B9FE5] transition-colors" />
            <button
              onClick={() => exportCSV(
                "people-employees",
                ["ID", "Name", "Role", "Department", "Status", "Start Date", "Phone", "Email"],
                employees.map((e) => [e.id, e.name, e.role ?? "", e.department ?? "", e.status ?? "", e.joinDate ?? "", e.phone ?? "", e.email ?? ""])
              )}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-[#25205B] hover:bg-[#EAF2FC] transition-colors whitespace-nowrap"
            >
              Export CSV
            </button>
          </div>
          {/* Mobile: card grid */}
          <div className="grid grid-cols-1 sm:hidden gap-3">
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEmp(e)}
                className="w-full text-left bg-white rounded-2xl border border-[#E8EAF0] p-4 flex items-start gap-3 transition-all hover:shadow-md active:scale-[0.99]"
                style={{ borderLeft: `3px solid ${e.status === "Suspended" ? "#EF4444" : e.status === "On Leave" ? "#6B9FE5" : "#25205B"}` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[14px] font-bold shrink-0" style={{ background: "#25205B" }}>
                  {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[13.5px] truncate" style={{ color: "#252731" }}>{e.name}</p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "#6B9FE5" }}>{e.role}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "#69707D" }}>
                    <span>{e.department}</span>
                    <span style={{ color: "#E8EAF0" }}>·</span>
                    <span>{e.location}</span>
                    {(isCEO || canDoHRActions) && e.salary && (
                      <>
                        <span style={{ color: "#E8EAF0" }}>·</span>
                        <span className="font-semibold" style={{ color: "#25205B" }}>₦{(e.salary / 1000).toFixed(0)}k</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {e.phone && (
                      <a
                        href={`tel:${e.phone}`}
                        className="flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: "#EAF2FC", color: "#25205B" }}
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2 1h3l1.5 3.5-1.5 1.5A8 8 0 008 9l1.5-1.5L13 9v3c-6.5 1-12-4.5-11-11z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                        Call
                      </a>
                    )}
                    <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#F7F8FA", color: "#69707D", border: "1px solid #E8EAF0" }}>
                      View profile →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                    {["Employee", "Role / Grade", "Department", "Location", ...(canDoHRActions || isCEO ? ["Salary"] : []), "Status", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => setSelectedEmp(e)} onContextMenu={(evt) => { evt.preventDefault(); setCtxMenu({ x: evt.clientX, y: evt.clientY, empId: e.id }); }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#25205B] text-xs font-bold shrink-0" style={{ background: "#EAF2FC", border: "1px solid rgba(107,159,229,0.2)" }}>
                            {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-[#252731] font-semibold text-[13px]">{e.name}</div>
                            {e.phone && <div className="text-[10px]" style={{ color: "#B0B8C4" }}>{e.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-[12px] text-[#252731]">{e.role}</div>
                        {e.grade && <div className="text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{e.grade}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-[#69707D]">{e.department}</td>
                      <td className="px-5 py-3.5 text-[12px] text-[#69707D]">{e.location}</td>
                      {(canDoHRActions || isCEO) && (
                        <td className="px-5 py-3.5 text-[12px] font-semibold whitespace-nowrap" style={{ color: "#25205B" }}>
                          {e.salary ? `₦${e.salary.toLocaleString("en-NG")}` : "—"}
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={e.status} />
                          {e.terminated && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>TERMINATED</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#EAF2FC", color: "#25205B" }}>View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HR action log */}
          {canDoHRActions && actionLog.length > 0 && (
            <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E8EAF0] flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>HR Action Log</div>
                <div className="text-[11px]" style={{ color: "#B0B8C4" }}>{actionLog.length} actions</div>
              </div>
              <div className="divide-y divide-[#F0F2F5]">
                {actionLog.map((l) => (
                  <div key={l.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#6B9FE5" }} />
                    <div className="flex-1 text-[12px]" style={{ color: "#252731" }}>{l.text}</div>
                    <div className="text-[10px] shrink-0" style={{ color: "#B0B8C4" }}>{l.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LEAVE TAB */}
      {tab === "leave" && (
        <div className="space-y-3">
          {leaveRequests.map((l) => (
            <div key={l.id} className="bg-white border border-[#E8EAF0] rounded-2xl p-5 transition-all hover:shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{l.id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}>{l.type}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <h3 className="font-semibold text-[14px]" style={{ color: "#252731" }}>{l.employee}</h3>
                  <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{l.role} · {l.department}</p>
                  <div className="flex items-center flex-wrap gap-3 mt-2.5 text-[12px]" style={{ color: "#69707D" }}>
                    <span>{l.startDate} → {l.endDate}</span>
                    <span className="font-semibold" style={{ color: "#252731" }}>{l.days} days requested</span>
                    {l.approvedDays !== null && l.approvedDays !== l.days && (
                      <span className="font-semibold px-2 py-0.5 rounded" style={{ background: "#f3e8ff", color: "#7c3aed" }}>{l.approvedDays} days granted</span>
                    )}
                  </div>
                  <div className="text-[11px] mt-1.5 italic" style={{ color: "#69707D" }}>"{l.reason}"</div>
                  {l.approvedBy && <div className="text-[11px] mt-1" style={{ color: "#B0B8C4" }}>Handled by {l.approvedBy}</div>}
                </div>

                {l.status === "Pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setApproveTarget(l)} className="px-4 py-2 text-[12px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>
                      Review & Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DEPLOYMENTS TAB */}
      {tab === "deployments" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E8EAF0] flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>All Deployment Records</div>
              <div className="text-[11px]" style={{ color: "#B0B8C4" }}>{DEPLOYMENT_RECORDS.length} records</div>
            </div>
            <div className="divide-y divide-[#F0F2F5]">
              {DEPLOYMENT_RECORDS.map((d) => (
                <div key={d.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-[12px]" style={{ background: "#EAF2FC", color: "#25205B" }}>
                        {d.employee.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{d.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{d.status}</span>
                        </div>
                        <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{d.employee}</div>
                      </div>
                    </div>
                    <div className="text-[11px]" style={{ color: "#B0B8C4" }}>Effective {d.effectiveDate}</div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 rounded-lg px-3 py-2.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                      <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>From</div>
                      <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{d.fromProject}</div>
                      <div className="text-[11px]" style={{ color: "#69707D" }}>{d.fromLocation}</div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-8">
                      <svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M0 6h18M14 1l5 5-5 5" stroke="#6B9FE5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div className="flex-1 min-w-0 rounded-lg px-3 py-2.5" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                      <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#25205B" }}>To</div>
                      <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{d.toProject}</div>
                      <div className="text-[11px]" style={{ color: "#25205B" }}>{d.toLocation}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 text-[12px] italic" style={{ color: "#69707D" }}>"{d.reason}"</div>
                  <div className="mt-1 text-[11px]" style={{ color: "#B0B8C4" }}>Authorized by {d.authorizedBy}</div>
                </div>
              ))}
            </div>
          </div>

          {/* New deployment CTA */}
          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>Deploy a staff member</div>
              <div className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Move a team member to a different project or location. All actions are logged and auditable.</div>
            </div>
            <button className="shrink-0 px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white whitespace-nowrap" style={{ background: "#25205B" }} onClick={() => setTab("employees")}>
              Select Staff →
            </button>
          </div>
        </div>
      )}

      {/* ROLE ASSIGNMENT TAB */}
      {tab === "roles" && canDoHRActions && (
        <RoleAssignment employees={employees} onUpdate={handleRoleUpdate} />
      )}

      {/* RIGHT-CLICK CONTEXT MENU */}
      {ctxMenu && (() => {
        const ctxEmp = employees.find((e) => e.id === ctxMenu.empId);
        if (!ctxEmp) return null;
        const menuItem = (label: string, onClick: () => void, danger = false) => (
          <button
            key={label}
            className="w-full text-left px-4 py-2 hover:bg-[#F7F8FA] transition-colors"
            style={{ color: danger ? "#dc2626" : "#252731" }}
            onClick={(e) => { e.stopPropagation(); onClick(); setCtxMenu(null); }}
          >
            {label}
          </button>
        );
        return (
          <div
            className="fixed bg-white border border-[#E8EAF0] rounded-xl shadow-xl py-1 z-[999] min-w-[180px] text-[12px] font-medium"
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItem("View Profile", () => setSelectedEmp(ctxEmp))}
            {menuItem("Copy Employee ID", () => {
              navigator.clipboard.writeText(ctxEmp.id);
              showToast(`Copied ${ctxEmp.id} to clipboard`, "info");
            })}
            {menuItem("Export Row", () => exportCSV(
              `people-employee-${ctxEmp.id}`,
              ["ID", "Name", "Role", "Department", "Status", "Start Date", "Phone", "Email"],
              [[ctxEmp.id, ctxEmp.name, ctxEmp.role ?? "", ctxEmp.department ?? "", ctxEmp.status ?? "", ctxEmp.joinDate ?? "", ctxEmp.phone ?? "", ctxEmp.email ?? ""]]
            ))}
            <div className="my-1 border-t border-[#E8EAF0]" />
            {menuItem("Mark On Leave", () => {
              setEmployees((prev) => prev.map((e) => e.id === ctxEmp.id ? { ...e, status: "On Leave" as typeof e.status } : e));
              showToast(`${ctxEmp.name} marked as On Leave`, "info");
            }, false)}
          </div>
        );
      })()}
    </div>
  );
}
