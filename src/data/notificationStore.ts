// Live notification store — derives role-aware notifications from all live data stores.

import { LIVE_MATERIAL_REQUESTS, LIVE_PROGRESS_REPORTS } from "./persistentStore";
import { movementStore } from "./stockMovementStore";
import { payrollStore } from "../modules/Payroll";

export type LiveNotification = {
  id: string;
  type: "approval" | "report" | "payroll" | "stock" | "leave" | "task" | "alert";
  title: string;
  body: string;
  time: string;
  module: string;
  priority: "high" | "normal";
  read: boolean;
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso.replace(" ", "T")).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getLiveNotifications(
  staffRole: string,
  staffName: string,
  staffLocation?: string
): LiveNotification[] {
  const notes: LiveNotification[] = [];

  // ── Procurement MRs ───────────────────────────────────────────────────────
  const myMRs = LIVE_MATERIAL_REQUESTS.filter((mr) => {
    if (staffRole === "howo") return mr.status === "Pending Supervisor" && (!staffLocation || mr.project?.includes(staffLocation) || true);
    if (staffRole === "admin" || staffRole === "ceo") return ["Pending Admin", "Pending CEO", "Pending Supervisor"].includes(mr.status ?? "");
    if (staffRole === "pco") return mr.requestedBy === staffName && mr.status !== "Disbursed";
    return false;
  });
  if (myMRs.length > 0 && ["howo", "admin", "ceo"].includes(staffRole)) {
    notes.push({
      id: "notif-mr-pending",
      type: "approval",
      title: `${myMRs.length} procurement request${myMRs.length > 1 ? "s" : ""} awaiting review`,
      body: myMRs.slice(0, 2).map((mr) => `${mr.id} — ${mr.project}`).join(" · "),
      time: "Now",
      module: "procurement",
      priority: myMRs.length >= 2 ? "high" : "normal",
      read: false,
    });
  }

  // ── Site progress reports (CEO / Admin / HOWO) ────────────────────────────
  const pendingReports = LIVE_PROGRESS_REPORTS.filter((r) => {
    if (!["ceo", "admin", "howo"].includes(staffRole)) return false;
    if (r.reviewStatus !== "Pending") return false;
    if (staffRole === "howo" && staffLocation) {
      // Only show reports from their state's projects
      return true; // already filtered at Construction level; show all pending for dashboard
    }
    return true;
  });
  if (pendingReports.length > 0) {
    notes.push({
      id: "notif-reports-pending",
      type: "report",
      title: `${pendingReports.length} site report${pendingReports.length > 1 ? "s" : ""} pending review`,
      body: pendingReports.slice(0, 2).map((r) => `${r.id} — ${r.project}`).join(" · "),
      time: relTime(pendingReports[0].date ?? "2026-09-01"),
      module: "construction",
      priority: "normal",
      read: false,
    });
  }

  // ── Stock movements (HOWO / Admin / CEO) ──────────────────────────────────
  const pendingMoves = movementStore.filter(
    (m) => m.status === "Pending Approval" && m.authorisedBy === staffName
  );
  if (pendingMoves.length > 0) {
    notes.push({
      id: "notif-stock-pending",
      type: "stock",
      title: `${pendingMoves.length} stock movement${pendingMoves.length > 1 ? "s" : ""} need your approval`,
      body: pendingMoves.slice(0, 2).map((m) => `${m.itemName} — ${m.project}`).join(" · "),
      time: relTime(pendingMoves[0].requestedAt),
      module: "inventory",
      priority: pendingMoves.length >= 2 ? "high" : "normal",
      read: false,
    });
  }
  // IVM/PCO see their own submitted pending movements
  if (["ivm", "pco"].includes(staffRole)) {
    const myPending = movementStore.filter(
      (m) => m.status === "Pending Approval" && m.requestedBy === staffName
    );
    if (myPending.length > 0) {
      notes.push({
        id: "notif-mystock-pending",
        type: "stock",
        title: `${myPending.length} of your stock requests pending approval`,
        body: myPending.slice(0, 2).map((m) => `${m.itemName} (${m.type})`).join(" · "),
        time: relTime(myPending[0].requestedAt),
        module: "inventory",
        priority: "normal",
        read: false,
      });
    }
  }

  // ── Payroll (Finance / CEO / Admin) ───────────────────────────────────────
  if (["finance", "ceo", "admin"].includes(staffRole)) {
    const submittedSchedules = payrollStore.filter((s) => s.status === "Submitted");
    if (submittedSchedules.length > 0) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      notes.push({
        id: "notif-payroll-submitted",
        type: "payroll",
        title: `${submittedSchedules.length} payroll schedule${submittedSchedules.length > 1 ? "s" : ""} awaiting disbursement`,
        body: submittedSchedules.map((s) => `${months[s.month]} ${s.year}`).join(", "),
        time: "Now",
        module: "payroll",
        priority: "high",
        read: false,
      });
    }
  }

  // ── Finance disbursement queue — pending MRs ──────────────────────────────
  if (staffRole === "finance") {
    const pendingDisbursement = LIVE_MATERIAL_REQUESTS.filter((mr) => mr.status === "Pending Finance");
    if (pendingDisbursement.length > 0) {
      notes.push({
        id: "notif-finance-mrs",
        type: "approval",
        title: `${pendingDisbursement.length} material request${pendingDisbursement.length > 1 ? "s" : ""} awaiting disbursement`,
        body: pendingDisbursement.slice(0, 2).map((mr) => `${mr.id} — ${mr.project}`).join(" · "),
        time: "Now",
        module: "procurement",
        priority: "high",
        read: false,
      });
    }
  }

  // ── General alerts ────────────────────────────────────────────────────────
  // Returned site reports (PCO / HOWO)
  if (["pco", "howo"].includes(staffRole)) {
    const returned = LIVE_PROGRESS_REPORTS.filter(
      (r) => r.reviewStatus === "Returned" && r.submittedBy === staffName
    );
    if (returned.length > 0) {
      notes.push({
        id: "notif-report-returned",
        type: "alert",
        title: `${returned.length} site report${returned.length > 1 ? "s" : ""} returned for revision`,
        body: returned.slice(0, 2).map((r) => `${r.id} — ${r.project}`).join(" · "),
        time: "Recent",
        module: "construction",
        priority: "high",
        read: false,
      });
    }
  }

  // ── Stock movement approved/declined notifications ────────────────────────
  const recentDeclined = movementStore.filter(
    (m) => m.status === "Declined" && m.requestedBy === staffName && m.reviewedAt
  );
  if (recentDeclined.length > 0) {
    notes.push({
      id: "notif-stock-declined",
      type: "alert",
      title: `Stock movement declined`,
      body: recentDeclined.slice(0, 1).map((m) => `${m.itemName}: ${m.reviewNote ?? "see inventory for details"}`).join(""),
      time: relTime(recentDeclined[0].reviewedAt ?? "2026-09-01"),
      module: "inventory",
      priority: "high",
      read: false,
    });
  }

  return notes;
}
