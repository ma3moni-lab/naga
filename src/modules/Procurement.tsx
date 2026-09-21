import { useState, useEffect } from "react";
import { PROJECTS } from "../data/dummy";
import { LIVE_MATERIAL_REQUESTS, persistStore } from "../data/persistentStore";
import { logActivity } from "../data/activityLog";
import { showToast } from "../utils/toast";
import { exportCSV } from "../utils/csvExport";

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  return `₦${n.toLocaleString()}`;
}

function fmtRaw(n: number) {
  return `₦${n.toLocaleString()}`;
}

// ── Staff directory & routing ─────────────────────────────────────────────────

export const STAFF_DIRECTORY = [
  { name: "Chukwuma Eze",   role: "howo",    title: "HOWO — Abuja",                area: "Abuja" },
  { name: "Emeka Okonkwo",  role: "ceo",     title: "MD / Chief Executive Officer", area: "HQ" },
  { name: "Ibrahim Lawal",  role: "admin",   title: "Deputy CEO / Administration", area: "HQ" },
  { name: "Lola Adebayo",   role: "finance", title: "Finance Manager",             area: "HQ" },
];

type StaffEntry = typeof STAFF_DIRECTORY[0];

const ADMIN_FINAL_THRESHOLD = 1_500_000;

function getNextApproverOptions(
  lastActorRole: string,
  amount: number,
  purchaseType: "construction" | "office" = "construction",
): StaffEntry[] {
  const r = lastActorRole.toLowerCase();

  if (purchaseType === "office") {
    // Office/non-construction: Admin or GM → CEO → Finance
    if (r === "admin" || r.includes("deputy ceo") || r.includes("howo")) {
      return STAFF_DIRECTORY.filter((s) => s.role === "ceo");
    }
    if (r === "ceo" || r.includes("ceo") || r.includes("md")) {
      return STAFF_DIRECTORY.filter((s) => s.role === "finance");
    }
    return [];
  }

  // Construction/building materials: IVM → HOWO → Admin → CEO (if >threshold) → Finance
  if (r === "ivm" || r.includes("ivm")) {
    return STAFF_DIRECTORY.filter((s) => s.role === "howo");
  }
  if (r === "howo" || r.includes("howo")) {
    return STAFF_DIRECTORY.filter((s) => s.role === "admin");
  }
  if (r === "admin" || r.includes("admin") || r.includes("deputy ceo")) {
    // Admin has final say for amounts at or below threshold; high-value goes to CEO
    if (amount > ADMIN_FINAL_THRESHOLD) {
      return STAFF_DIRECTORY.filter((s) => s.role === "ceo");
    }
    return STAFF_DIRECTORY.filter((s) => s.role === "finance");
  }
  if (r === "ceo" || r.includes("ceo") || r.includes("md")) {
    return STAFF_DIRECTORY.filter((s) => s.role === "finance");
  }
  return [];
}

// ── Invoice PDF generator ─────────────────────────────────────────────────────

function buildInvoiceHTML(mr: Record<string, unknown>): string {
  type Item  = { material: string; qty: number; unit: string; unitPrice: number; total: number };
  type Step  = { actor: string; role: string; action: string; date: string; time?: string; note?: string };
  const items   = (mr.items  as Item[])  ?? [];
  const chain   = (mr.approvalChain as Step[]) ?? [];
  const signers = chain.filter((s) => ["Approved", "Authorized", "Disbursed", "Work Confirmed"].includes(s.action));
  const isFullyAuthorized = ["Disbursed", "Verified", "Work Confirmed"].includes(mr.status as string);

  const watermarkColor = isFullyAuthorized ? "rgba(16,185,129,0.04)" : "rgba(245,158,11,0.05)";
  const watermarkText  = isFullyAuthorized ? "AUTHORISED" : "PENDING APPROVAL";

  const sigBlocks = signers.map((s) => `
    <div style="min-width:190px;margin-right:40px;margin-bottom:8px;">
      <div style="font-family:'Brush Script MT',cursive;font-size:36px;color:#0f0d2e;line-height:1.1;">${s.actor}</div>
      <div style="border-bottom:1.5px solid #25205B;margin:4px 0 8px;"></div>
      <div style="font-size:12px;font-weight:700;color:#252731;letter-spacing:-0.2px;">${s.actor}</div>
      <div style="font-size:11px;color:#555;margin-top:1px;">${s.role}</div>
      <div style="font-size:10px;color:#999;margin-top:3px;">${s.action} · ${s.date}${s.time ? " · " + s.time : ""}</div>
    </div>`).join("");

  const itemRows = items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#FAFBFC"};">
      <td style="padding:11px 16px;font-size:13px;border-bottom:1px solid #eee;">${item.material}</td>
      <td style="padding:11px 16px;font-size:13px;border-bottom:1px solid #eee;text-align:center;">${(item.qty ?? 0).toLocaleString()}</td>
      <td style="padding:11px 16px;font-size:13px;border-bottom:1px solid #eee;color:#666;">${item.unit}</td>
      <td style="padding:11px 16px;font-size:13px;border-bottom:1px solid #eee;color:#666;text-align:right;">${fmtRaw(item.unitPrice)}</td>
      <td style="padding:11px 16px;font-size:13px;border-bottom:1px solid #eee;font-weight:600;text-align:right;">${fmtRaw(item.total)}</td>
    </tr>`).join("");

  const chainRows = chain.map((step, i) => {
    const isCompleted = ["Approved", "Authorized", "Disbursed", "Work Confirmed", "Submitted"].includes(step.action);
    const isReturned  = step.action === "Returned";
    const dot = isCompleted ? "background:#10B981" : isReturned ? "background:#EF4444" : "background:#F59E0B";
    return `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:${i < chain.length - 1 ? "1px dashed #eee" : "none"}">
      <div style="width:10px;height:10px;border-radius:50%;margin-top:4px;flex-shrink:0;${dot}"></div>
      <div>
        <span style="font-size:12px;font-weight:700;color:#252731;">${step.actor}</span>
        <span style="font-size:11px;color:#666;margin-left:6px;">(${step.role})</span>
        <span style="margin-left:8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:2px 8px;border-radius:4px;
          background:${isCompleted ? "#dcfce7" : isReturned ? "#fee2e2" : "#fef3c7"};
          color:${isCompleted ? "#166534" : isReturned ? "#991b1b" : "#92400e"}">
          ${step.action}
        </span>
        ${step.date ? `<span style="font-size:10px;color:#999;margin-left:6px;">${step.date}${step.time ? " · " + step.time : ""}</span>` : ""}
        ${step.note ? `<div style="font-size:11px;color:#555;font-style:italic;margin-top:3px;">"${step.note}"</div>` : ""}
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Invoice INV-${mr.id} — NAGA Properties</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',system-ui,Arial,sans-serif; color:#1a1a1a; background:#f1f3f6; }
    .page { max-width:880px; margin:32px auto; background:#fff; box-shadow:0 2px 20px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden; }
    .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-28deg);
      font-size:80px; font-weight:900; color:${watermarkColor}; white-space:nowrap; pointer-events:none; z-index:0; letter-spacing:8px; }
    .content { position:relative; z-index:1; }
    .inv-header { padding:40px 48px 32px; background:linear-gradient(135deg,#0f0d2e 0%,#25205B 100%); }
    .inv-body { padding:0 48px 48px; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:28px; padding:28px 0; border-bottom:1px solid #eee; }
    .meta-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#9DA8C0; margin-bottom:6px; }
    .meta-value { font-size:15px; font-weight:700; color:#1a1a1a; }
    .meta-sub { font-size:11px; color:#666; margin-top:2px; line-height:1.5; }
    .section-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#9DA8C0; padding:24px 0 12px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#0f0d2e; color:#fff; padding:10px 16px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
    th:last-child, td:last-child { text-align:right; }
    th:nth-child(2), td:nth-child(2) { text-align:center; }
    .total-row td { padding:14px 16px; font-weight:700; font-size:14px; background:#EAF2FC; color:#25205B; border-top:2px solid #0f0d2e; }
    .purpose-box { background:#F7F8FA; border:1px solid #E8EAF0; border-radius:8px; padding:16px 20px; margin:20px 0; }
    .sig-section { padding-top:24px; border-top:1px solid #eee; margin-top:24px; }
    .pending-notice { background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:14px 18px; margin-top:20px; }
    footer { padding:20px 48px; border-top:1px solid #eee; display:flex; justify-content:space-between; background:#FAFBFC; }
    .print-btn { display:block; margin:24px auto; padding:12px 36px; background:#25205B; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; letter-spacing:0.3px; }
    @media print {
      body { background:#fff; }
      .page { margin:0; box-shadow:none; border-radius:0; }
      .no-print { display:none !important; }
      @page { margin:1.2cm; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="watermark">${watermarkText}</div>
  <div class="content">

  <!-- Header -->
  <div class="inv-header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">NAGA Properties</div>
        <div style="font-size:11px;color:rgba(107,159,229,0.8);margin-top:6px;line-height:1.8;">
          Real Estate &amp; Property Management<br>
          Abuja, Nigeria &nbsp;·&nbsp; info@naga.com
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-1px;">PURCHASE INVOICE</div>
        <div style="font-family:monospace;font-size:14px;color:#6B9FE5;margin-top:6px;">INV-${mr.id}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Date: ${mr.date}</div>
        <div style="margin-top:10px;">
          <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
            background:${isFullyAuthorized ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"};
            color:${isFullyAuthorized ? "#6ee7b7" : "#fcd34d"};">
            ${mr.status}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="inv-body">
    <!-- Meta grid -->
    <div class="meta-grid">
      <div>
        <div class="meta-label">Project / Bill To</div>
        <div class="meta-value">${mr.project}</div>
        <div class="meta-sub">Project ID: ${mr.projectId ?? "N/A"}</div>
        ${mr.supplier ? `<div class="meta-sub">Supplier: ${mr.supplier}</div>` : ""}
      </div>
      <div>
        <div class="meta-label">Requested By</div>
        <div class="meta-value">${mr.requestedBy}</div>
        <div class="meta-sub">${mr.role ?? ""}</div>
        <div class="meta-sub">Submitted: ${mr.date}</div>
      </div>
      <div>
        <div class="meta-label">Invoice Total</div>
        <div style="font-size:26px;font-weight:900;color:#25205B;">${fmtRaw((mr.totalAmount as number) ?? 0)}</div>
        <div class="meta-sub">${items.length} line item${items.length !== 1 ? "s" : ""}</div>
      </div>
    </div>

    <!-- Line items -->
    <div class="section-label">Materials / Line Items</div>
    <table>
      <thead>
        <tr>
          <th>Description / Material</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Unit Price</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="4" style="text-align:right;letter-spacing:0.5px;">GRAND TOTAL</td>
          <td style="font-size:16px;">${fmtRaw((mr.totalAmount as number) ?? 0)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Purpose -->
    <div class="purpose-box" style="margin-top:20px;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9DA8C0;margin-bottom:6px;">Purpose / Description</div>
      <div style="font-size:13px;color:#252731;line-height:1.6;">${mr.purpose}</div>
    </div>

    <!-- Approval chain log -->
    <div class="section-label">Approval Routing Log</div>
    <div style="background:#FAFBFC;border:1px solid #E8EAF0;border-radius:8px;padding:16px 20px;">
      ${chain.length > 0 ? chainRows : `<div style="font-size:12px;color:#999;">No approval actions recorded yet.</div>`}
    </div>

    <!-- Signatures -->
    ${signers.length > 0 ? `
    <div class="sig-section">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9DA8C0;margin-bottom:20px;">Authorisation Signatures</div>
      <div style="display:flex;flex-wrap:wrap;">${sigBlocks}</div>
    </div>` : `
    <div class="pending-notice">
      <div style="font-size:12px;font-weight:700;color:#92400e;">Awaiting Authorisation</div>
      <div style="font-size:11px;color:#b45309;margin-top:3px;">Signatures will appear here once the required approvals are completed.</div>
    </div>`}
  </div>

  <footer>
    <div style="font-size:10px;color:#999;">System-generated invoice · NAGA Property Management Platform</div>
    <div style="font-size:10px;color:#999;">INV-${mr.id} · Generated ${new Date().toLocaleString("en-NG")}</div>
  </footer>
</div>

<div class="no-print" style="text-align:center;padding:24px 0 32px;">
  <button class="print-btn" onclick="window.print()">Save / Print as PDF</button>
  <p style="margin-top:8px;font-size:11px;color:#999;">Choose "Save as PDF" in your browser print dialog.</p>
</div>

</div>
</body>
</html>`;
}

function openInvoice(mr: Record<string, unknown>) {
  const html = buildInvoiceHTML(mr);
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to open the invoice."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ── UI sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Disbursed:           "bg-purple-50 text-purple-700 border-purple-200",
    Verified:            "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Pending Supervisor":"bg-amber-50 text-amber-700 border-amber-200",
    "Pending Admin":     "bg-orange-50 text-orange-700 border-orange-200",
    Pending:             "bg-amber-50 text-amber-700 border-amber-200",
    Delivered:           "bg-emerald-50 text-emerald-700 border-emerald-200",
    Approved:            "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Authorized:          "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    "Pending CEO":       "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Returned:            "bg-red-50 text-red-700 border-red-200",
    "Work Confirmed":    "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

interface ChainStep {
  actor: string;
  role: string;
  action: string;
  date: string;
  time: string;
  note: string;
}

function ApprovalStepRow({
  step,
  index,
  isLast,
  actionSlot,
}: {
  step: ChainStep;
  index: number;
  isLast: boolean;
  actionSlot?: React.ReactNode;
}) {
  const isCompleted = ["Submitted", "Approved", "Authorized", "Disbursed", "Work Confirmed"].includes(step.action);
  const isReturned  = step.action === "Returned";
  const isPending   = step.action === "Pending";

  const dotBg   = isCompleted ? "bg-emerald-500" : isReturned ? "bg-red-500" : isPending ? "bg-amber-400 animate-pulse" : "bg-[#6B9FE5]";
  const numBg   = isCompleted ? "bg-emerald-500 text-white" : isReturned ? "bg-red-500 text-white" : isPending ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-[#EAF2FC] text-[#25205B] border border-[#6B9FE5]/30";

  return (
    <div className="flex gap-4">
      {/* Column: step number + connecting line */}
      <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${numBg}`}>
          {isCompleted ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 my-1" style={{ background: "#E8EAF0", minHeight: 24 }} />}
      </div>

      {/* Column: content */}
      <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isPending && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Awaiting Review</span>
              )}
              <span className="text-[#252731] font-semibold text-sm">{step.actor}</span>
              <span className="text-[#69707D] text-xs">({step.role})</span>
              <StatusBadge status={step.action} />
            </div>
            {step.date && (
              <div className="text-[#B0B8C4] text-[10px] mt-0.5">{step.date}{step.time ? ` · ${step.time}` : ""}</div>
            )}
            {step.note && (
              <div className="text-[#69707D] text-xs mt-1.5 italic bg-[#F7F8FA] border border-[#E8EAF0] rounded px-3 py-2 leading-relaxed">
                "{step.note}"
              </div>
            )}
            {/* Signature for completed steps */}
            {isCompleted && step.action !== "Submitted" && (
              <div className="mt-3 pt-3 border-t border-dashed border-[#E8EAF0] inline-block">
                <div className="text-[#0f0d2e]" style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 28, lineHeight: 1.1 }}>{step.actor}</div>
                <div className="border-b border-[#9DA8C0] mb-1.5 w-40" />
                <div className="text-[10px] text-[#9DA8C0]">{step.actor} · {step.role}</div>
              </div>
            )}
          </div>
        </div>
        {/* Inline action slot for the current pending step */}
        {isPending && actionSlot && (
          <div className="mt-3">{actionSlot}</div>
        )}
      </div>
    </div>
  );
}

// ── New Material Request / Invoice Modal ──────────────────────────────────────

interface LineItem {
  material: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

// ── Staff Requisition (non-IVM → IVM workflow) ────────────────────────────────

interface StaffRequisition {
  id: string;
  submittedBy: string;
  submitterRole: string;
  project: string;
  purpose: string;
  notes: string;
  items: LineItem[];
  totalEstimate: number;
  date: string;
  status: "Pending IVM Review" | "Issued as Invoice" | "Declined";
  ivmNote?: string;
  issuedInvoiceId?: string;
}

const SEED_REQUISITIONS: StaffRequisition[] = [
  {
    id: "REQ-001",
    submittedBy: "Adewale Okonkwo",
    submitterRole: "howo",
    project: "NAGA Palm Court",
    purpose: "Foundation reinforcement bars — Block C ground floor columns",
    notes: "Urgent — on the critical path. Further delay risks slab schedule by 3+ days.",
    items: [
      { material: "Steel Rebar Y16", qty: 200, unit: "Lengths", unitPrice: 4500, total: 900000 },
      { material: "Binding Wire", qty: 10, unit: "Rolls", unitPrice: 2500, total: 25000 },
      { material: "Column Formwork Panels", qty: 24, unit: "Sheets", unitPrice: 18000, total: 432000 },
    ],
    totalEstimate: 1357000,
    date: "2026-01-10",
    status: "Pending IVM Review",
  },
  {
    id: "REQ-002",
    submittedBy: "Fatima Al-Amin",
    submitterRole: "howo",
    project: "Emerald Gardens",
    purpose: "Electrical conduit and junction boxes — Floors 3–5",
    notes: "Required before electrical rough-in begins next week.",
    items: [
      { material: "PVC Conduit Pipe 20mm", qty: 150, unit: "Lengths", unitPrice: 1200, total: 180000 },
      { material: "Junction Box 4-way", qty: 40, unit: "Units", unitPrice: 850, total: 34000 },
    ],
    totalEstimate: 214000,
    date: "2026-01-08",
    status: "Issued as Invoice",
    ivmNote: "Items verified against site plan. Converted to formal purchase invoice.",
    issuedInvoiceId: "MR-54321",
  },
];

interface NewMRModalProps {
  onClose: () => void;
  onSave: (newMR: Record<string, unknown>) => void;
  submitterName?: string;
  submitterRole?: string;
  purchaseType?: "construction" | "office";
  prefill?: { project?: string; purpose?: string; items?: LineItem[]; notes?: string };
  prefillReqId?: string;
}

function NewMRModal({ onClose, onSave, submitterName = "", submitterRole = "PCO", purchaseType = "construction", prefill, prefillReqId }: NewMRModalProps) {
  const [project,          setProject]          = useState(prefill?.project ?? "NAGA Palm Court");
  const [requestedBy,      setRequestedBy]      = useState(submitterName);
  const [purpose,          setPurpose]          = useState(prefill?.purpose ?? "");
  const [deliveryDate,     setDeliveryDate]     = useState("");
  const [notes,            setNotes]            = useState(prefill?.notes ?? "");
  const [initialApprover,  setInitialApprover]  = useState(() =>
    purchaseType === "office" ? (STAFF_DIRECTORY.find((s) => s.role === "ceo")?.name ?? "") : ""
  );
  const [lineItems,        setLineItems]        = useState<LineItem[]>(
    prefill?.items && prefill.items.length > 0
      ? prefill.items
      : [{ material: "", qty: 0, unit: "", unitPrice: 0, total: 0 }]
  );

  const howos = STAFF_DIRECTORY.filter((s) => s.role === "howo");
  const ceoEntry    = STAFF_DIRECTORY.find((s) => s.role === "ceo");

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value };
        next.total = next.qty * next.unitPrice;
        return next;
      })
    );
  };

  const addItem = () =>
    setLineItems((prev) => [...prev, { material: "", qty: 0, unit: "", unitPrice: 0, total: 0 }]);

  const removeItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  const canSubmit =
    requestedBy.trim() !== "" &&
    purpose.trim() !== "" &&
    (purchaseType === "office" || initialApprover !== "") &&
    lineItems.some((i) => i.material.trim() !== "" && i.total > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const projectId =
      project === "NAGA Palm Court" ? "PRJ-001" :
      project === "Emerald Gardens" ? "PRJ-002" : "PRJ-003";
    const now  = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString();

    const firstApprover    = purchaseType === "office" ? (ceoEntry?.name ?? "") : initialApprover;
    const firstApproverObj = STAFF_DIRECTORY.find((s) => s.name === firstApprover);
    const initialStatus    = purchaseType === "office" ? "Pending CEO" : "Pending Supervisor";
    const submitNote       = purchaseType === "office"
      ? "Office purchase request submitted. Pending CEO authorization."
      : prefillReqId
      ? `Invoice raised from staff requisition ${prefillReqId}. Submitted for approval.`
      : "Invoice raised and submitted for approval.";

    onSave({
      id:           `MR-${String(Date.now()).slice(-5)}`,
      project,
      projectId,
      date,
      requestedBy,
      role:         submitterRole.toUpperCase(),
      items:        lineItems.filter((i) => i.material.trim() !== ""),
      totalAmount,
      purpose,
      purchaseType,
      status:       initialStatus,
      approvalChain: [
        { actor: requestedBy, role: submitterRole.toUpperCase(), action: "Submitted", date, time, note: submitNote },
        { actor: firstApprover, role: firstApproverObj?.title ?? (purchaseType === "office" ? "CEO" : "Supervisor"), action: "Pending", date: "", time: "", note: "" },
      ],
      supplier:        null,
      deliveryStatus:  "Pending",
      ...(prefillReqId ? { sourceReqId: prefillReqId } : {}),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(notes        ? { notes }        : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }`}</style>
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{ animation: "modalIn 0.2s ease-out both" }}
      >
        {/* Modal header */}
        <div style={{ background: purchaseType === "office" ? "linear-gradient(135deg,#1a1033,#312a72)" : "linear-gradient(135deg,#0f0d2e,#25205B)" }} className="px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            {prefillReqId && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">From Staff Requisition {prefillReqId}</div>
            )}
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                purchaseType === "office"
                  ? "bg-[#6B9FE5]/20 text-[#6B9FE5]"
                  : "bg-amber-400/20 text-amber-300"
              }`}>{purchaseType === "office" ? "Office & General Purchase" : "Construction / Site Materials"}</span>
            </div>
            <h2 className="text-white font-semibold text-base">
              {purchaseType === "office" ? "New Office Purchase Request" : "New Purchase Invoice"}
            </h2>
            <p className="text-[#6B9FE5] text-xs mt-0.5">
              {purchaseType === "office"
                ? "Office/general purchases go directly to CEO for authorization — IVM and HOWO are not in this chain."
                : "Construction materials invoice — routed through IVM → Supervisor → Admin → CEO chain."}
            </p>
          </div>
          <button onClick={onClose} className="text-[#6B9FE5] hover:text-white transition-colors text-2xl font-light leading-none">×</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
              >
                <option>NAGA Palm Court</option>
                <option>Emerald Gardens</option>
                <option>Granite Heights</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Requested By <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5]"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Purpose <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Superstructure slab — Floors 4–6 casting"
              className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5]"
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D]">Materials &amp; Quantities</label>
              <div className="text-[10px] text-[#69707D] font-medium">All prices in Naira (₦)</div>
            </div>
            {/* Column headers */}
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="min-w-[480px]">
            <div className="grid grid-cols-[2fr_64px_80px_100px_80px_20px] gap-2 mb-1.5 px-0.5">
              {["Material", "Qty", "Unit", "Unit Price", "Total", ""].map((h) => (
                <div key={h} className="text-[9px] font-bold uppercase tracking-wide text-[#9DA8C0]">{h}</div>
              ))}
            </div>
            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[2fr_64px_80px_100px_80px_20px] gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Material description"
                    value={item.material}
                    onChange={(e) => updateItem(i, "material", e.target.value)}
                    className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5]"
                  />
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={item.qty || ""}
                    onChange={(e) => updateItem(i, "qty", parseFloat(e.target.value) || 0)}
                    className="border border-[#E8EAF0] rounded-lg px-2 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] w-full text-center"
                  />
                  <input
                    type="text"
                    placeholder="e.g. Bags"
                    value={item.unit}
                    onChange={(e) => updateItem(i, "unit", e.target.value)}
                    className="border border-[#E8EAF0] rounded-lg px-2 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] w-full"
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    min={0}
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="border border-[#E8EAF0] rounded-lg px-2 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] w-full"
                  />
                  <div className="text-xs font-semibold text-[#25205B] text-right pr-1">
                    {item.total > 0 ? `₦${item.total.toLocaleString()}` : "—"}
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    disabled={lineItems.length === 1}
                    className="text-[#B0B5BF] hover:text-red-500 font-bold text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >×</button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addItem} className="text-xs text-[#6B9FE5] font-semibold hover:text-[#25205B] transition-colors">+ Add item</button>
              {totalAmount > 0 && (
                <div className="bg-[#EAF2FC] px-4 py-2 rounded-lg">
                  <span className="text-xs text-[#69707D]">Invoice Total: </span>
                  <span className="text-sm font-bold text-[#25205B]">₦{totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            </div>
            </div>
          </div>

          {/* Delivery date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Required Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Additional Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5]"
              />
            </div>
          </div>

          {/* Approver routing — varies by purchase type */}
          {purchaseType === "office" ? (
            <div className="border border-[#6B9FE5]/30 rounded-xl overflow-hidden bg-[#EAF2FC]">
              <div className="px-4 py-3 flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0"><circle cx="8" cy="8" r="7" stroke="#3B6BA5" strokeWidth="1.4"/><path d="M8 5v3.5M8 10.5v.5" stroke="#3B6BA5" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#25205B]">Routing: Office Purchase</div>
                  <div className="text-xs text-[#25205B]/70 mt-0.5">
                    This request will go directly to <strong>{ceoEntry?.name ?? "CEO"}</strong> ({ceoEntry?.title ?? "Chief Executive Officer"}) for authorization.
                    IVM and HOWO are not part of this chain.
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#25205B] font-medium">
                    <span className="bg-white border border-[#6B9FE5]/30 rounded px-2 py-1">{submitterRole.toUpperCase()}</span>
                    <span className="text-[#6B9FE5]">→</span>
                    <span className="bg-white border border-[#6B9FE5]/30 rounded px-2 py-1">CEO</span>
                    <span className="text-[#6B9FE5]">→</span>
                    <span className="bg-white border border-[#6B9FE5]/30 rounded px-2 py-1">Finance</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-[#E8EAF0] rounded-xl overflow-hidden">
              <div className="bg-[#F7F8FA] px-4 py-3 border-b border-[#E8EAF0]">
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#69707D]">Submit to HOWO <span className="text-red-500">*</span></div>
                <div className="text-[11px] text-[#9DA8C0] mt-0.5">Select the HOWO for first review. Chain: IVM → HOWO → Admin → CEO → Finance.</div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {howos.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setInitialApprover(s.name)}
                    className={`text-left px-4 py-3 rounded-lg border transition-all ${
                      initialApprover === s.name
                        ? "bg-[#25205B] border-[#25205B] text-white"
                        : "bg-white border-[#E8EAF0] text-[#252731] hover:border-[#6B9FE5] hover:bg-[#EAF2FC]"
                    }`}
                  >
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className={`text-[11px] mt-0.5 ${initialApprover === s.name ? "text-[#6B9FE5]" : "text-[#69707D]"}`}>{s.title} · {s.area}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#E8EAF0] flex-shrink-0 bg-white">
          <div className="text-[11px] text-[#9DA8C0]">
            {canSubmit
              ? purchaseType === "office"
                ? "Ready — will be sent to CEO for authorization."
                : "Ready to submit — will be routed to HOWO for review."
              : "Complete all required fields to submit."}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#69707D] font-medium hover:text-[#252731] transition-colors"
            >Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 bg-[#25205B] text-white text-sm font-semibold rounded-lg hover:bg-[#312a72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >{purchaseType === "office" ? "Submit to CEO for Authorization" : "Submit Invoice for Approval"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff Requisition Modal (PCO / Supervisor / PRM / Estate → IVM) ──────────

interface StaffRequisitionModalProps {
  onClose: () => void;
  onSave: (req: StaffRequisition) => void;
  submitterName?: string;
  submitterRole?: string;
}

function StaffRequisitionModal({ onClose, onSave, submitterName = "", submitterRole = "pco" }: StaffRequisitionModalProps) {
  const [project,   setProject]   = useState("NAGA Palm Court");
  const [purpose,   setPurpose]   = useState("");
  const [notes,     setNotes]     = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { material: "", qty: 0, unit: "", unitPrice: 0, total: 0 },
  ]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value };
        next.total = next.qty * next.unitPrice;
        return next;
      })
    );
  };

  const addItem = () =>
    setLineItems((prev) => [...prev, { material: "", qty: 0, unit: "", unitPrice: 0, total: 0 }]);

  const removeItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const totalEstimate = lineItems.reduce((sum, item) => sum + item.total, 0);
  const canSubmit = purpose.trim() !== "" && lineItems.some((i) => i.material.trim() !== "");

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now  = new Date();
    const date = now.toISOString().split("T")[0];
    onSave({
      id:            `REQ-${String(Date.now()).slice(-4)}`,
      submittedBy:   submitterName,
      submitterRole,
      project,
      purpose,
      notes,
      items:         lineItems.filter((i) => i.material.trim() !== ""),
      totalEstimate,
      date,
      status:        "Pending IVM Review",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{ animation: "modalIn 0.2s ease-out both" }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 border-b border-[#E8EAF0] bg-[#F7F8FA]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Routed to IVM — not to management</span>
            </div>
            <h2 className="text-[#252731] font-semibold text-base">Submit Material Requisition to IVM</h2>
            <p className="text-[#69707D] text-xs mt-0.5">IVM will review, verify stock, and issue a formal purchase invoice if approved.</p>
          </div>
          <button onClick={onClose} className="text-[#9DA8C0] hover:text-[#252731] transition-colors text-2xl font-light leading-none ml-4">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
              <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.4"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your requisition goes to <strong>IVM only</strong>. IVM will decide whether to issue a formal purchase invoice through the proper approval chain. You will be notified when IVM acts on your request.
            </p>
          </div>

          {/* Project + submitter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
              >
                <option>NAGA Palm Court</option>
                <option>Emerald Gardens</option>
                <option>Granite Heights</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Submitted By</label>
              <div className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] bg-[#F7F8FA] flex items-center justify-between">
                <span>{submitterName || "—"}</span>
                <span className="text-[10px] font-bold text-[#9DA8C0] uppercase tracking-wide">{submitterRole}</span>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Purpose / Need Description <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Slab casting materials — Ground Floor, Block A"
              className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5]"
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D]">Materials Required <span className="text-red-500">*</span></label>
              <div className="text-[10px] text-[#69707D] font-medium">Estimated prices in ₦ (optional)</div>
            </div>
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="min-w-[480px]">
            <div className="grid grid-cols-[2fr_64px_80px_100px_80px_20px] gap-2 mb-1.5 px-0.5">
              {["Material", "Qty", "Unit", "Est. Price", "Total", ""].map((h) => (
                <div key={h} className="text-[9px] font-bold uppercase tracking-wide text-[#9DA8C0]">{h}</div>
              ))}
            </div>
            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[2fr_64px_80px_100px_80px_20px] gap-2 items-center">
                  <input type="text" placeholder="Material description" value={item.material}
                    onChange={(e) => updateItem(i, "material", e.target.value)}
                    className="border border-[#E8EAF0] rounded-lg px-3 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5]" />
                  <input type="number" placeholder="0" min={0} value={item.qty || ""}
                    onChange={(e) => updateItem(i, "qty", parseFloat(e.target.value) || 0)}
                    className="border border-[#E8EAF0] rounded-lg px-2 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] w-full text-center" />
                  <input type="text" placeholder="Bags" value={item.unit}
                    onChange={(e) => updateItem(i, "unit", e.target.value)}
                    className="border border-[#E8EAF0] rounded-lg px-2 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] w-full" />
                  <input type="number" placeholder="0.00" min={0} value={item.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="border border-[#E8EAF0] rounded-lg px-2 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] w-full" />
                  <div className="text-xs font-semibold text-[#25205B] text-right pr-1">
                    {item.total > 0 ? `₦${item.total.toLocaleString()}` : "—"}
                  </div>
                  <button onClick={() => removeItem(i)} disabled={lineItems.length === 1}
                    className="text-[#B0B5BF] hover:text-red-500 font-bold text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed transition-colors">×</button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addItem} className="text-xs text-[#6B9FE5] font-semibold hover:text-[#25205B] transition-colors">+ Add item</button>
              {totalEstimate > 0 && (
                <div className="bg-[#EAF2FC] px-4 py-2 rounded-lg">
                  <span className="text-xs text-[#69707D]">Estimated Total: </span>
                  <span className="text-sm font-bold text-[#25205B]">₦{totalEstimate.toLocaleString()}</span>
                </div>
              )}
            </div>
            </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-1.5">Notes for IVM</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Urgency, site conditions, alternatives considered, preferred suppliers, etc."
              rows={3}
              className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-[#6B9FE5] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#E8EAF0] flex-shrink-0 bg-white">
          <div className="text-[11px] text-[#9DA8C0]">Sent to IVM only — not routed to management.</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#69707D] font-medium hover:text-[#252731] transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canSubmit ? "#D4A843" : "#D4A843" }}
            >Submit Requisition to IVM</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Procurement() {
  const staffInfo      = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const staffRole: string = staffInfo.role ?? "ceo";
  const staffName: string = staffInfo.name ?? "";
  const isIVM        = staffRole === "ivm";
  const isHOWO       = staffRole === "howo";
  const isCEO        = staffRole === "ceo";
  const isAdmin      = staffRole === "admin";
  const isPRM        = staffRole === "prm";
  const isPCO        = staffRole === "pco";
  const howoCoverage: string = staffInfo.location ?? "";
  const canAuthorize = isCEO || isAdmin;
  const canSubmitRequisition = ["pco", "prm", "estate", "cso"].includes(staffRole);

  const getProjectLocation = (projectName: string) =>
    PROJECTS.find((p) => p.name === projectName)?.location ?? "";
  const canActOnProject = (projectName: string) =>
    !isHOWO || getProjectLocation(projectName) === howoCoverage;

  const [localMRs,          setLocalMRs]          = useState(() => [...LIVE_MATERIAL_REQUESTS]);
  const [selected,          setSelected]          = useState<string | null>(null);
  const [showNewMR,         setShowNewMR]         = useState(false);
  const [ivmForm,           setIvmForm]           = useState<{ variantNotes: string; photos: string; hasVariance: boolean; varianceNotes: string; varianceAmt: string } | null>(null);
  const [workConfirms,      setWorkConfirms]      = useState<Record<string, { by: string; date: string }>>({});
  const [forwardTo,         setForwardTo]         = useState<Record<string, string>>({});
  const [returnReason,      setReturnReason]      = useState<Record<string, string>>({});
  const [showReturn,        setShowReturn]        = useState<Record<string, boolean>>({});
  const [bulkSelected,      setBulkSelected]      = useState<string[]>([]);
  const [fileStore,         setFileStore]         = useState<Record<string, { name: string; url: string; size: string }[]>>({});
  const [requisitions,      setRequisitions]      = useState<StaffRequisition[]>(SEED_REQUISITIONS);
  const [showReqModal,      setShowReqModal]      = useState(false);
  const [prefilledReq,      setPrefilledReq]      = useState<StaffRequisition | null>(null);
  const [declineReqId,      setDeclineReqId]      = useState<string | null>(null);
  const [declineNote,       setDeclineNote]       = useState("");
  const [purchaseTypeForModal, setPurchaseTypeForModal] = useState<"construction" | "office">("construction");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ctxMenu]);

  useEffect(() => {
    LIVE_MATERIAL_REQUESTS.length = 0;
    LIVE_MATERIAL_REQUESTS.push(...localMRs);
    persistStore();
  }, [localMRs]);

  const mr = selected ? localMRs.find((m) => m.id === selected) : null;

  const actorRole =
    isHOWO  ? `HOWO (${howoCoverage})` :
    isAdmin ? "Admin" :
    isCEO   ? "CEO" :
    isIVM   ? "IVM" :
    "HOWO";

  const canActOnMR = (m: typeof localMRs[0]) =>
    (m.status === "Pending Supervisor" && (isHOWO && canActOnProject(m.project)) || canAuthorize) ||
    (m.status === "Pending Admin"      && (isAdmin || isCEO)) ||
    (m.status === "Pending CEO"        && (canAuthorize || (isHOWO && canActOnProject(m.project))));

  const handleBulkApprove = () => {
    const now  = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toLocaleTimeString();
    const ids  = [...bulkSelected];
    setLocalMRs((prev) => prev.map((m) => {
      if (!ids.includes(m.id) || !canActOnMR(m)) return m;
      const chain = (m.approvalChain ?? []) as ChainStep[];
      const norm: ChainStep[] = chain[0]?.action === "Submitted" ? chain : [
        { actor: m.requestedBy, role: m.role, action: "Submitted", date: m.date, time: "", note: "" },
        ...chain,
      ];
      const mPurchaseType = ((m as unknown as Record<string, string>).purchaseType ?? "construction") as "construction" | "office";
      const amt = m.totalAmount ?? 0;
      let action: string;
      let nextStatus: string;
      if (m.status === "Pending CEO") {
        action = "Authorized"; nextStatus = "Disbursed";
      } else if (m.status === "Pending Admin") {
        const adminFinal = amt <= ADMIN_FINAL_THRESHOLD;
        action = adminFinal ? "Authorized" : "Approved";
        nextStatus = adminFinal ? "Disbursed" : "Pending CEO";
      } else {
        action = "Approved";
        nextStatus = mPurchaseType === "office" ? "Pending CEO" : "Pending Admin";
      }
      const nextOpts = getNextApproverOptions(actorRole, amt, mPurchaseType);
      const nextP    = nextOpts[0];
      const newChain = norm.map((s) =>
        s.action === "Pending"
          ? { ...s, actor: staffName || actorRole, role: actorRole, action, date, time, note: `${action} via bulk action.` }
          : s
      );
      if (nextP) {
        newChain.push(
          nextStatus === "Disbursed"
            ? { actor: nextP.name, role: nextP.title, action: "Disbursed", date, time, note: `₦${amt.toLocaleString()} authorized for disbursement.` }
            : { actor: nextP.name, role: nextP.title, action: "Pending",   date: "",   time: "",   note: "" }
        );
      }
      return { ...m, status: nextStatus, approvalChain: newChain };
    }));
    logActivity({
      timestamp: now.toISOString().slice(0, 16).replace("T", " "),
      actor:     staffName || actorRole,
      role:      actorRole,
      action:    "Bulk Invoice Approval",
      module:    "Procurement",
      detail:    `Bulk approved ${ids.length} invoice(s): ${ids.join(", ")}.`,
      ref:       ids[0],
      severity:  "info",
    });
    setBulkSelected([]);
  };

  const handleFileAttach = (mrId: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).map((f) => ({
      name: f.name,
      url:  URL.createObjectURL(f),
      size: f.size > 1_000_000 ? `${(f.size / 1_000_000).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
    }));
    setFileStore((prev) => ({ ...prev, [mrId]: [...(prev[mrId] ?? []), ...newFiles] }));
  };

  // ── Invoice detail view ───────────────────────────────────────────────────

  if (mr) {
    const chain: ChainStep[] = (mr.approvalChain ?? []) as ChainStep[];

    // Synthesise a "Submitted" first step if the chain doesn't have one
    const normalised: ChainStep[] = chain[0]?.action === "Submitted"
      ? chain
      : [
          { actor: mr.requestedBy, role: mr.role, action: "Submitted", date: mr.date, time: "", note: "Invoice raised." },
          ...chain,
        ];

    // Find the pending step index
    const pendingIdx = normalised.findIndex((s) => s.action === "Pending");
    const pendingStep = pendingIdx >= 0 ? normalised[pendingIdx] : null;

    // Who can action this step?
    const canActNow =
      (mr.status === "Pending Supervisor" && (isHOWO && canActOnProject(mr.project) || canAuthorize)) ||
      (mr.status === "Pending Admin"      && (isAdmin || isCEO)) ||
      (mr.status === "Pending CEO"        && (canAuthorize || (isHOWO && canActOnProject(mr.project))));

    const mrPurchaseType = ((mr as unknown as Record<string, string>).purchaseType ?? "construction") as "construction" | "office";
    const nextOptions = getNextApproverOptions(actorRole, mr.totalAmount ?? 0, mrPurchaseType);
    const currentForwardTo = forwardTo[mr.id] ?? (nextOptions.length === 1 ? nextOptions[0].name : "");

    const handleApprove = () => {
      const now    = new Date();
      const date   = now.toISOString().slice(0, 10);
      const time   = now.toLocaleTimeString();
      const amt    = mr.totalAmount ?? 0;

      // Determine action label and next status based on current stage
      let action: string;
      let nextStatus: string;
      if (mr.status === "Pending CEO") {
        action = "Authorized";
        nextStatus = "Disbursed";
      } else if (mr.status === "Pending Admin") {
        // Admin has final say at or below threshold; otherwise escalate to CEO
        const adminFinal = amt <= ADMIN_FINAL_THRESHOLD;
        action = adminFinal ? "Authorized" : "Approved";
        nextStatus = adminFinal ? "Disbursed" : "Pending CEO";
      } else {
        // Pending Supervisor or Pending (office initial) → next stage
        action = "Approved";
        nextStatus = mrPurchaseType === "office" ? "Pending CEO" : "Pending Admin";
      }

      const nextNote =
        mr.status === "Pending CEO"
          ? `Authorized by CEO. Approved for disbursement.`
          : mr.status === "Pending Admin" && amt <= ADMIN_FINAL_THRESHOLD
          ? `Authorized by Admin. Amount ₦${amt.toLocaleString()} within Admin approval threshold — cleared for disbursement.`
          : mr.status === "Pending Admin"
          ? `Reviewed by Admin. Amount ₦${amt.toLocaleString()} exceeds Admin threshold — forwarding to CEO for final authorization.`
          : isHOWO
          ? `Approved by HOWO. Forwarding to ${currentForwardTo}.`
          : `Approved by ${actorRole}. Forwarding to ${currentForwardTo} for review.`;

      const forwardPerson = STAFF_DIRECTORY.find((s) => s.name === currentForwardTo);

      const newChain = normalised.map((s) =>
        s.action === "Pending"
          ? { ...s, actor: staffName || pendingStep?.actor || actorRole, role: actorRole, action, date, time, note: nextNote }
          : s
      );

      if (nextStatus === "Disbursed" && forwardPerson) {
        newChain.push({ actor: forwardPerson.name, role: forwardPerson.title, action: "Disbursed", date, time, note: `₦${amt.toLocaleString()} authorized for disbursement.` });
      } else if (nextStatus !== "Disbursed" && forwardPerson) {
        newChain.push({ actor: forwardPerson.name, role: forwardPerson.title, action: "Pending", date: "", time: "", note: "" });
      }

      setLocalMRs((prev) => prev.map((m) => m.id === mr.id ? { ...m, status: nextStatus, approvalChain: newChain } : m));
      logActivity({
        timestamp: now.toISOString().slice(0, 16).replace("T", " "),
        actor:     staffName || actorRole,
        role:      actorRole,
        action:    `Invoice ${action}`,
        module:    "Procurement",
        detail:    `${action} invoice INV-${mr.id} (${mr.project}) — ₦${amt.toLocaleString()}. ${nextStatus === "Disbursed" ? "Disbursement authorized." : `Forwarded to ${currentForwardTo}.`}`,
        ref:       mr.id,
        severity:  "info",
      });
    };

    const handleReturn = () => {
      const reason = returnReason[mr.id]?.trim();
      if (!reason) return;
      const now  = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toLocaleTimeString();
      const newChain = normalised.map((s) =>
        s.action === "Pending"
          ? { ...s, actor: staffName || actorRole, role: actorRole, action: "Returned", date, time, note: reason }
          : s
      );
      setLocalMRs((prev) => prev.map((m) => m.id === mr.id ? { ...m, status: "Returned", approvalChain: newChain } : m));
      setShowReturn((p) => ({ ...p, [mr.id]: false }));
      setReturnReason((p) => ({ ...p, [mr.id]: "" }));
      logActivity({
        timestamp: now.toISOString().slice(0, 16).replace("T", " "),
        actor:     staffName || actorRole,
        role:      actorRole,
        action:    "Invoice Returned",
        module:    "Procurement",
        detail:    `Returned invoice INV-${mr.id} — ${reason}`,
        ref:       mr.id,
        severity:  "warning",
      });
    };

    return (
      <>
        {/* Print styles — hides everything except the invoice when printing */}
        <style>{`@media print { body > * { display: none !important; } #procurement-print-target { display: block !important; } }`}</style>
        <div id="procurement-print-target" className="p-4 md:p-6 max-w-[900px] space-y-4">
        {/* Breadcrumb + actions row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setSelected(null)} className="text-[#6B9FE5] hover:underline font-medium">Procurement</button>
            <span className="text-[#B0B8C4]">/</span>
            <span className="font-mono font-semibold text-[#252731]">INV-{mr.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={mr.status} />
            {/* Print / Export PDF button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#25205B] text-[#25205B] text-xs font-semibold rounded-lg hover:bg-[#EAF2FC] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4V2.5h7V4M2.5 8.5H1.5V5.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v3H9.5M2.5 7h7v3h-7V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Print / Export PDF
            </button>
            <button
              onClick={() => openInvoice({ ...mr, approvalChain: normalised } as unknown as Record<string, unknown>)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25205B] text-white text-xs font-semibold rounded-lg hover:bg-[#312a72] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9.5h8M6 7.5V1.5M3.5 4l2.5-2.5L8.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* ── INVOICE DOCUMENT ── */}
        <div className="bg-white rounded-xl border border-[#E8EAF0] overflow-hidden shadow-sm">

          {/* Document header */}
          <div style={{ background: "linear-gradient(135deg,#0f0d2e 0%,#25205B 100%)" }} className="px-4 sm:px-7 py-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white font-bold text-xl tracking-tight">NAGA Properties</div>
                <div className="text-[#6B9FE5] text-xs mt-1.5 leading-relaxed">Real Estate &amp; Property Management · Abuja, Nigeria</div>
              </div>
              <div className="text-right">
                <div className="text-white font-black text-2xl tracking-tighter">PURCHASE INVOICE</div>
                <div className="font-mono text-[#6B9FE5] text-sm mt-1">INV-{mr.id}</div>
                <div className="text-white/50 text-xs mt-0.5">Date: {mr.date}</div>
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAF0] border-b border-[#E8EAF0] bg-[#F7F8FA]">
            {[
              {
                label: "Project / Bill To",
                primary: mr.project,
                subs: [mr.projectId, getProjectLocation(mr.project), mr.supplier ? `Supplier: ${mr.supplier}` : null].filter(Boolean) as string[],
              },
              {
                label: "Requested By",
                primary: mr.requestedBy,
                subs: [mr.role, `Submitted: ${mr.date}`],
              },
              {
                label: "Invoice Total",
                primary: fmtRaw(mr.totalAmount ?? 0),
                subs: [`${(mr.items as unknown[])?.length ?? 0} line items`],
                large: true,
              },
            ].map((col) => (
              <div key={col.label} className="px-6 py-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#9DA8C0] mb-1.5">{col.label}</div>
                <div className={`font-bold ${col.large ? "text-[#25205B] text-xl" : "text-[#252731] text-sm"}`}>{col.primary}</div>
                {col.subs.map((s, i) => <div key={i} className="text-[#69707D] text-xs mt-0.5">{s}</div>)}
              </div>
            ))}
          </div>

          {/* Line items table */}
          <div className="border-b border-[#E8EAF0] overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr style={{ background: "#0f0d2e" }}>
                  {[
                    { label: "Description / Material", cls: "text-left" },
                    { label: "Quantity",                cls: "text-center" },
                    { label: "Unit",                    cls: "text-left" },
                    { label: "Unit Price",              cls: "text-right" },
                    { label: "Line Total",              cls: "text-right" },
                  ].map((h) => (
                    <th key={h.label} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white ${h.cls}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(mr.items ?? []).map((item: { material: string; qty: number; unit: string; unitPrice: number; total: number }, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}>
                    <td className="px-5 py-3 text-[#252731] font-medium">{item.material}</td>
                    <td className="px-5 py-3 text-[#252731] text-center">{item.qty.toLocaleString()}</td>
                    <td className="px-5 py-3 text-[#69707D]">{item.unit}</td>
                    <td className="px-5 py-3 text-[#69707D] text-right">{fmtRaw(item.unitPrice)}</td>
                    <td className="px-5 py-3 font-semibold text-[#252731] text-right">{fmtRaw(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#EAF2FC", borderTop: "2px solid #0f0d2e" }}>
                  <td colSpan={4} className="px-5 py-3 text-right text-sm font-bold text-[#25205B] uppercase tracking-wide">Grand Total</td>
                  <td className="px-5 py-3 text-right text-xl font-black text-[#25205B]">{fmtRaw(mr.totalAmount ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Purpose */}
          <div className="px-4 sm:px-7 py-5 border-b border-[#E8EAF0]">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#9DA8C0] mb-2">Purpose / Description</div>
            <div className="text-[#252731] text-sm leading-relaxed">{mr.purpose}</div>
            {Boolean((mr as Record<string, unknown>).notes) && (
              <div className="mt-2 text-[#69707D] text-xs italic">{String((mr as Record<string, unknown>).notes)}</div>
            )}
          </div>

          {/* Attachments */}
          <div className="px-4 sm:px-7 py-5 border-b border-[#E8EAF0]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#9DA8C0]">Supporting Documents &amp; Photos</div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8EAF0] rounded-lg text-xs font-medium text-[#252731] hover:bg-[#F7F8FA] cursor-pointer transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3.5 5L6 2.5 8.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Attach Files
                <input type="file" multiple className="hidden" onChange={(e) => handleFileAttach(mr.id, e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
              </label>
            </div>
            {(fileStore[mr.id] ?? []).length === 0 ? (
              <div className="text-center py-5 border border-dashed border-[#E8EAF0] rounded-lg">
                <div className="text-[#B0B8C4] text-xs">No attachments yet — upload receipts, delivery notes, or photos.</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(fileStore[mr.id] ?? []).map((f, i) => {
                  const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);
                  return (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 border border-[#E8EAF0] rounded-lg hover:border-[#6B9FE5] hover:bg-[#EAF2FC] transition-all group">
                      <div className="w-8 h-8 rounded bg-[#EAF2FC] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#25205B] overflow-hidden">
                        {isImg
                          ? <img src={f.url} alt="" className="w-full h-full object-cover rounded" />
                          : f.name.split(".").pop()?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-[#252731] truncate group-hover:text-[#25205B]">{f.name}</div>
                        <div className="text-[10px] text-[#9DA8C0]">{f.size}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approval routing chain */}
          <div className="px-4 sm:px-7 py-6">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#9DA8C0] mb-5">Approval Routing Chain</div>
            <div>
              {normalised.map((step, i) => {
                const isThePendingStep = i === pendingIdx || (normalised.indexOf(step) === pendingIdx);

                const actionSlot = isThePendingStep && canActNow ? (
                  <div className="space-y-3">
                    {/* Forward-to selector */}
                    {nextOptions.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-[#69707D] mb-2">
                          {mr.status === "Pending CEO" ? "Authorize & forward to Finance" : "Approve & forward to"}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {nextOptions.map((opt) => (
                            <button
                              key={opt.name}
                              onClick={() => setForwardTo((p) => ({ ...p, [mr.id]: opt.name }))}
                              className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                                currentForwardTo === opt.name
                                  ? "bg-[#25205B] border-[#25205B] text-white"
                                  : "bg-white border-[#E8EAF0] text-[#252731] hover:border-[#6B9FE5]"
                              }`}
                            >
                              <div className="font-semibold">{opt.name}</div>
                              <div className={`text-[10px] mt-0.5 ${currentForwardTo === opt.name ? "text-[#6B9FE5]" : "text-[#69707D]"}`}>{opt.title}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={nextOptions.length > 0 && !currentForwardTo}
                        className="flex items-center gap-1.5 px-5 py-2 bg-[#25205B] text-white text-sm font-semibold rounded-lg hover:bg-[#312a72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {mr.status === "Pending CEO" ? "Authorize & Disburse" : "Approve & Forward"}
                      </button>
                      <button
                        onClick={() => setShowReturn((p) => ({ ...p, [mr.id]: !p[mr.id] }))}
                        className="px-4 py-2 bg-white border border-[#E8EAF0] text-[#69707D] text-sm font-medium rounded-lg hover:border-red-300 hover:text-red-600 transition-colors"
                      >Return for Revision</button>
                    </div>

                    {/* Inline return reason input */}
                    {showReturn[mr.id] && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-700 text-xs font-semibold mb-2">Reason for returning this invoice</div>
                        <textarea
                          rows={2}
                          value={returnReason[mr.id] ?? ""}
                          onChange={(e) => setReturnReason((p) => ({ ...p, [mr.id]: e.target.value }))}
                          placeholder="Describe what needs to be corrected..."
                          className="w-full border border-red-200 rounded px-3 py-2 text-xs text-[#252731] focus:outline-none focus:border-red-400 resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleReturn}
                            disabled={!returnReason[mr.id]?.trim()}
                            className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >Confirm Return</button>
                          <button
                            onClick={() => setShowReturn((p) => ({ ...p, [mr.id]: false }))}
                            className="px-4 py-1.5 text-[#69707D] text-xs hover:text-[#252731] transition-colors"
                          >Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isThePendingStep && !canActNow ? (
                  <div className="text-xs text-[#69707D] bg-[#F7F8FA] border border-[#E8EAF0] rounded-lg px-3 py-2 mt-1">
                    This invoice is in {step.actor}&apos;s queue. Waiting for their review.
                  </div>
                ) : undefined;

                return (
                  <ApprovalStepRow
                    key={i}
                    step={step}
                    index={i}
                    isLast={i === normalised.length - 1}
                    actionSlot={actionSlot}
                  />
                );
              })}
            </div>
          </div>

          {/* Delivery verification (IVM) */}
          {Boolean(mr.ivmVerification) && (() => {
            const ivm = mr.ivmVerification as unknown as Record<string, unknown>;
            const mrX = mr as unknown as Record<string, unknown>;
            return (
              <div className="mx-3 sm:mx-7 mb-6 border border-[#E8EAF0] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E8EAF0] bg-[#F7F8FA]">
                  <div className="text-xs font-semibold text-[#252731]">Delivery &amp; Inventory Verification</div>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {[
                      { label: "Supplier",         value: mrX.supplier },
                      { label: "Invoice Ref",      value: mrX.supplierRef },
                      { label: "Delivery Date",    value: mrX.deliveryDate },
                      { label: "IVM Officer",      value: mrX.ivm },
                      { label: "Verification Date",value: ivm.date },
                    ].map((f) => (
                      <div key={f.label} className="flex justify-between text-xs">
                        <span className="text-[#69707D]">{f.label}</span>
                        <span className="text-[#252731] font-medium">{String(f.value ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    {ivm.variance ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                        <div className="font-semibold mb-1">Variance noted</div>
                        <div>{String(ivm.variance)}</div>
                        {ivm.varianceAmount != null && (
                          <div className="mt-1">Amount: <span className="font-bold">{fmt(Number(ivm.varianceAmount))}</span></div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 font-semibold">
                        {String(ivm.status ?? "Verified — No Variance")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* IVM action */}
          {mr.status === "Disbursed" && !(mr as Record<string, unknown>).ivmVerification && (isIVM || (isHOWO && canActOnProject(mr.project))) && (
            <div className="mx-3 sm:mx-7 mb-6 border border-[#E8EAF0] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E8EAF0] bg-[#F7F8FA]">
                <div className="text-xs font-semibold text-[#252731]">Record Delivery Verification</div>
              </div>
              <div className="p-5">
                {!ivmForm ? (
                  <button
                    onClick={() => setIvmForm({ variantNotes: "", photos: "0", hasVariance: false, varianceNotes: "", varianceAmt: "" })}
                    className="px-4 py-2 bg-[#25205B] text-white text-sm font-semibold rounded-lg hover:bg-[#312a72] transition-colors"
                  >Start Verification</button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wide font-semibold text-[#69707D] block mb-1">General Notes</label>
                        <textarea rows={2} value={ivmForm.variantNotes} onChange={(e) => setIvmForm((f) => f ? { ...f, variantNotes: e.target.value } : f)} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none border border-[#E8EAF0]" placeholder="Delivery condition notes..." />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide font-semibold text-[#69707D] block mb-1">Photos Taken</label>
                        <input type="number" min={0} value={ivmForm.photos} onChange={(e) => setIvmForm((f) => f ? { ...f, photos: e.target.value } : f)} className="w-full px-3 py-2 rounded-lg text-xs outline-none border border-[#E8EAF0]" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#252731]">
                      <input type="checkbox" checked={ivmForm.hasVariance} onChange={(e) => setIvmForm((f) => f ? { ...f, hasVariance: e.target.checked } : f)} className="w-4 h-4 accent-[#25205B]" />
                      There is a quantity or quality variance
                    </label>
                    {ivmForm.hasVariance && (
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div>
                          <label className="text-[10px] uppercase tracking-wide font-semibold text-amber-800 block mb-1">Variance Description</label>
                          <input value={ivmForm.varianceNotes} onChange={(e) => setIvmForm((f) => f ? { ...f, varianceNotes: e.target.value } : f)} className="w-full px-3 py-2 rounded text-xs outline-none border border-amber-200 bg-amber-50" placeholder="e.g. 5 bags cement short" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wide font-semibold text-amber-800 block mb-1">Variance Amount (₦)</label>
                          <input type="number" min={0} value={ivmForm.varianceAmt} onChange={(e) => setIvmForm((f) => f ? { ...f, varianceAmt: e.target.value } : f)} className="w-full px-3 py-2 rounded text-xs outline-none border border-amber-200 bg-amber-50" placeholder="0" />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().slice(0, 10);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          setLocalMRs((prev) => prev.map((m) => m.id === mr.id ? {
                            ...m, status: "Verified", ivm: staffName, deliveryDate: today,
                            ivmVerification: {
                              date: today,
                              status: ivmForm.hasVariance ? "Variance Noted" : "Verified",
                              photos: parseInt(ivmForm.photos, 10) || 0,
                              notes: ivmForm.variantNotes || "Delivery confirmed.",
                              ...(ivmForm.hasVariance ? { variance: ivmForm.varianceNotes, varianceAmount: parseFloat(ivmForm.varianceAmt) || 0 } : {}),
                            },
                          } : m) as any);
                          setIvmForm(null);
                        }}
                        className="px-4 py-2 bg-[#25205B] text-white text-sm font-semibold rounded-lg hover:bg-[#312a72] transition-colors"
                      >Submit Verification</button>
                      <button onClick={() => setIvmForm(null)} className="px-4 py-2 text-[#69707D] text-sm rounded-lg border border-[#E8EAF0] hover:bg-white transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Record in Inventory shortcut — shown on Disbursed MRs for IVM/HOWO */}
          {mr.status === "Disbursed" && (isIVM || isHOWO) && (
            <div className="mx-3 sm:mx-7 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: "rgba(107,159,229,0.08)", border: "1px solid rgba(107,159,229,0.25)" }}
              onClick={() => { alert(`Go to Inventory → Stock Movement → select Add → link to ${mr.id} for ${mr.project}`); }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="1.5" stroke="#6B9FE5" strokeWidth="1.2"/><path d="M5 4V3a2 2 0 0 1 4 0v1M8 8v3M6.5 9.5h3" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold" style={{ color: "#25205B" }}>Record delivery in Inventory</div>
                <div className="text-[11px]" style={{ color: "#69707D" }}>This MR ({mr.id}) has been disbursed. Open Inventory → Stock Movement → Add stock and link to {mr.id}.</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}

          {/* PCO Work Confirmation */}
          {mr.status === "Verified" && !workConfirms[mr.id] && (isPCO || (isHOWO && canActOnProject(mr.project))) && (
            <div className="mx-3 sm:mx-7 mb-6 border border-[#6B9FE5]/30 rounded-xl overflow-hidden" style={{ background: "#EAF2FC" }}>
              <div className="px-5 py-4">
                <div className="text-[#25205B] text-sm font-semibold mb-1">Confirm Work Completion</div>
                <p className="text-[#25205B]/70 text-xs mb-3">Materials delivered and verified by IVM. Confirm they have been put to use and the designated work is complete on site.</p>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setWorkConfirms((prev) => ({ ...prev, [mr.id]: { by: staffName, date: today } }));
                    setLocalMRs((prev) => prev.map((m) => m.id === mr.id ? {
                      ...m, status: "Work Confirmed",
                      approvalChain: [...(m.approvalChain ?? []), { actor: staffName, role: isPCO ? "PCO" : `HOWO (${howoCoverage})`, action: "Work Confirmed", date: today, time: new Date().toLocaleTimeString(), note: "Confirmed materials utilised and work completed on site." }],
                    } : m));
                  }}
                  className="px-5 py-2 bg-[#25205B] text-white text-sm font-semibold rounded-lg hover:bg-[#312a72] transition-colors"
                >✓ Confirm Work Done</button>
              </div>
            </div>
          )}

          {workConfirms[mr.id] && (
            <div className="mx-3 sm:mx-7 mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="#166834" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-800">Work Confirmed</div>
                <div className="text-xs text-emerald-600 mt-0.5">Confirmed by {workConfirms[mr.id].by} on {workConfirms[mr.id].date}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  // ── Invoice list view ─────────────────────────────────────────────────────

  const visibleMRs = localMRs;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Procurement &amp; Invoicing</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Material purchase invoices, approval routing, and supplier disbursements</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* IVM: create formal construction purchase invoice */}
          {isIVM && (
            <button
              onClick={() => { setPurchaseTypeForModal("construction"); setShowNewMR(true); }}
              className="flex items-center gap-2 bg-[#25205B] text-white text-sm px-4 py-2.5 rounded-lg font-semibold hover:bg-[#312a72] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              New Construction Invoice
            </button>
          )}
          {/* Admin: office/general purchases go directly to CEO */}
          {isAdmin && (
            <button
              onClick={() => { setPurchaseTypeForModal("office"); setShowNewMR(true); }}
              className="flex items-center gap-2 bg-[#312a72] text-white text-sm px-4 py-2.5 rounded-lg font-semibold hover:bg-[#25205B] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              New Office Purchase
            </button>
          )}
          {/* PCO/Supervisor/PRM/Estate: submit a requisition to IVM */}
          {canSubmitRequisition && (
            <button
              onClick={() => setShowReqModal(true)}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg font-semibold transition-colors border border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843] hover:text-white"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Request Materials (→ IVM)
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices",     value: localMRs.length,                                                          sub: "All time" },
          { label: "Awaiting Approval",  value: localMRs.filter((m) => ["Pending Supervisor", "Pending Admin", "Pending CEO"].includes(m.status)).length, sub: "Pending review" },
          { label: "Disbursed",          value: localMRs.filter((m) => m.status === "Disbursed").length,                  sub: "In delivery" },
          { label: "Fully Verified",     value: localMRs.filter((m) => ["Verified", "Work Confirmed"].includes(m.status)).length, sub: "Completed" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-[#252731] text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-[#69707D] text-xs mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Floating bulk-action toolbar — fixed bottom-center */}
      <style>{`
        @keyframes bulkBarIn {
          from { opacity: 0; transform: translateX(-50%) translateY(100%); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      {bulkSelected.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            animation: "bulkBarIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
            minWidth: 360,
          }}
          className="bg-[#25205B] text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-2xl gap-4"
        >
          {/* Count badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-full bg-[#6B9FE5]/30 flex items-center justify-center text-xs font-bold tabular-nums">
              {bulkSelected.length}
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {bulkSelected.length} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Approve All */}
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#25205B] text-xs font-bold rounded-lg hover:bg-[#EAF2FC] transition-colors whitespace-nowrap"
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Approve All
            </button>

            {/* Export */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-white/40 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9.5h8M6 7.5V1.5M3.5 4l2.5-2.5L8.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export
            </button>

            {/* Clear */}
            <button
              onClick={() => setBulkSelected([])}
              className="px-3 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10 whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* IVM: Staff Requisitions Inbox ─────────────────────────────────────── */}
      {isIVM && (() => {
        const pending = requisitions.filter((r) => r.status === "Pending IVM Review");
        const processed = requisitions.filter((r) => r.status !== "Pending IVM Review");
        return (
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-[#252731] font-semibold text-sm">Staff Material Requisitions</h3>
                {pending.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{pending.length} pending review</span>
                )}
              </div>
              <p className="text-[11px] text-[#9DA8C0]">Review requests from site staff — issue a purchase invoice or decline</p>
            </div>

            {pending.length === 0 && processed.length === 0 && (
              <div className="px-5 py-8 text-center text-[#9DA8C0] text-sm">No staff requisitions yet.</div>
            )}

            {pending.length > 0 && (
              <div className="divide-y divide-[#F0F2F5]">
                {pending.map((req) => (
                  <div key={req.id} className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-[#6B9FE5]">{req.id}</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pending IVM Review</span>
                          <span className="text-[11px] text-[#9DA8C0]">{req.date}</span>
                        </div>
                        <div className="text-sm font-semibold text-[#252731] mb-0.5">{req.purpose}</div>
                        <div className="text-xs text-[#69707D] mb-2">
                          {req.project} · Submitted by <span className="font-medium text-[#252731]">{req.submittedBy}</span> ({req.submitterRole.toUpperCase()})
                        </div>
                        {req.notes && (
                          <div className="text-xs text-[#69707D] italic bg-[#F7F8FA] border border-[#E8EAF0] rounded-lg px-3 py-2 mb-2">"{req.notes}"</div>
                        )}
                        <div className="space-y-1">
                          {req.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs text-[#252731]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6B9FE5] shrink-0" />
                              <span className="flex-1">{item.material}</span>
                              <span className="text-[#69707D]">{item.qty} {item.unit}</span>
                              {item.total > 0 && <span className="font-semibold">₦{item.total.toLocaleString()}</span>}
                            </div>
                          ))}
                        </div>
                        {req.totalEstimate > 0 && (
                          <div className="mt-2 text-xs text-[#69707D]">
                            Estimated total: <span className="font-bold text-[#25205B]">₦{req.totalEstimate.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setPrefilledReq(req);
                            setShowNewMR(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#25205B] text-white text-xs font-semibold rounded-lg hover:bg-[#312a72] transition-colors whitespace-nowrap"
                        >
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                          Issue Purchase Invoice
                        </button>
                        <button
                          onClick={() => { setDeclineReqId(req.id); setDeclineNote(""); }}
                          className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                        >Decline Request</button>
                      </div>
                    </div>
                    {/* Inline decline form */}
                    {declineReqId === req.id && (
                      <div className="mt-4 border border-red-200 rounded-xl bg-red-50 p-4">
                        <div className="text-xs font-semibold text-red-700 mb-2">Reason for declining this requisition</div>
                        <input
                          type="text"
                          value={declineNote}
                          onChange={(e) => setDeclineNote(e.target.value)}
                          placeholder="e.g. Material already in stock, insufficient budget allocation, duplicate request…"
                          className="w-full border border-red-200 rounded-lg px-3 py-2 text-xs text-[#252731] placeholder-[#B0B5BF] focus:outline-none focus:border-red-400 bg-white mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeclineReqId(null)}
                            className="px-4 py-1.5 text-xs text-[#69707D] font-medium hover:text-[#252731] transition-colors"
                          >Cancel</button>
                          <button
                            disabled={declineNote.trim() === ""}
                            onClick={() => {
                              setRequisitions((prev) => prev.map((r) =>
                                r.id === req.id ? { ...r, status: "Declined" as const, ivmNote: declineNote.trim() } : r
                              ));
                              setDeclineReqId(null);
                              setDeclineNote("");
                            }}
                            className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >Confirm Decline</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {processed.length > 0 && (
              <div className="border-t border-[#E8EAF0]">
                <div className="px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAF0]">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#9DA8C0]">Previously Processed</span>
                </div>
                <div className="divide-y divide-[#F0F2F5]">
                  {processed.map((req) => (
                    <div key={req.id} className="px-5 py-4 flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${req.status === "Issued as Invoice" ? "bg-[#6B9FE5]" : "bg-red-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-bold text-[#9DA8C0]">{req.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            req.status === "Issued as Invoice"
                              ? "text-[#25205B] bg-[#EAF2FC] border-[#6B9FE5]/30"
                              : "text-red-700 bg-red-50 border-red-200"
                          }`}>{req.status}</span>
                        </div>
                        <div className="text-xs font-medium text-[#252731]">{req.purpose}</div>
                        <div className="text-[11px] text-[#9DA8C0] mt-0.5">{req.project} · {req.submittedBy}</div>
                        {req.ivmNote && <div className="text-[11px] text-[#69707D] italic mt-1">IVM: "{req.ivmNote}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Non-IVM staff: My Requisitions ────────────────────────────────────── */}
      {canSubmitRequisition && (() => {
        const mine = requisitions.filter((r) => r.submittedBy === staffName || staffName === "");
        return (
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[#252731] font-semibold text-sm">My Material Requisitions</h3>
                {mine.filter((r) => r.status === "Pending IVM Review").length > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {mine.filter((r) => r.status === "Pending IVM Review").length} awaiting IVM
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowReqModal(true)}
                className="text-xs font-semibold text-[#D4A843] hover:text-[#c49530] transition-colors"
              >+ New Requisition</button>
            </div>

            {mine.length === 0 && (
              <div className="px-5 py-10 text-center">
                <div className="text-[#9DA8C0] text-sm mb-3">No requisitions submitted yet.</div>
                <button
                  onClick={() => setShowReqModal(true)}
                  className="px-5 py-2 text-sm font-semibold rounded-lg border border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843] hover:text-white transition-colors"
                >Submit Material Requisition to IVM</button>
              </div>
            )}

            {mine.length > 0 && (
              <div className="divide-y divide-[#F0F2F5]">
                {mine.map((req) => (
                  <div key={req.id} className="px-5 py-4 flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      req.status === "Pending IVM Review" ? "bg-amber-400 animate-pulse" :
                      req.status === "Issued as Invoice" ? "bg-[#6B9FE5]" : "bg-red-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-mono text-xs font-bold text-[#9DA8C0]">{req.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          req.status === "Pending IVM Review"
                            ? "text-amber-700 bg-amber-50 border-amber-200"
                            : req.status === "Issued as Invoice"
                            ? "text-[#25205B] bg-[#EAF2FC] border-[#6B9FE5]/30"
                            : "text-red-700 bg-red-50 border-red-200"
                        }`}>{req.status}</span>
                        <span className="text-[11px] text-[#9DA8C0]">{req.date}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#252731]">{req.purpose}</div>
                      <div className="text-[11px] text-[#9DA8C0] mt-0.5">{req.project} · {req.totalEstimate > 0 ? `Est. ₦${req.totalEstimate.toLocaleString()}` : `${req.items.length} item(s)`}</div>
                      {req.ivmNote && (
                        <div className={`text-[11px] italic mt-1 ${req.status === "Declined" ? "text-red-600" : "text-[#69707D]"}`}>
                          IVM: "{req.ivmNote}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Invoice list ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
          <h3 className="text-[#252731] font-semibold text-sm">All Purchase Invoices</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#9DA8C0] font-medium">{visibleMRs.length} invoices</span>
            <button
              onClick={() => exportCSV(
                "procurement-material-requests",
                ["ID", "Project", "Requested By", "Date", "Total Amount", "Status", "Priority"],
                visibleMRs.map((mr) => [
                  mr.id,
                  mr.project,
                  mr.requestedBy,
                  mr.date,
                  mr.totalAmount,
                  mr.status,
                  (mr as unknown as Record<string, unknown>).priority as string ?? "Normal",
                ])
              )}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#E8EAF0] text-[#25205B] rounded-lg hover:bg-[#EAF2FC] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 9.5h8M6 7.5V1.5M3.5 4l2.5-2.5L8.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#25205B] cursor-pointer"
                    checked={bulkSelected.length > 0 && bulkSelected.length === localMRs.filter(canActOnMR).length}
                    onChange={(e) => setBulkSelected(e.target.checked ? localMRs.filter(canActOnMR).map((m) => m.id) : [])}
                  />
                </th>
                {["Invoice Ref", "Project", "Date", "Submitted By", "Purpose", "Amount", "Current Holder", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {visibleMRs.map((m) => {
                const chain = (m.approvalChain ?? []) as ChainStep[];
                const pending = chain.find((s) => s.action === "Pending");
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-[#F7F8FA]"
                    onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, id: m.id }); }}
                  >
                    <td className="px-4 py-3 w-10">
                      {canActOnMR(m) && (
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#25205B] cursor-pointer"
                          checked={bulkSelected.includes(m.id)}
                          onChange={(e) => setBulkSelected((p) => e.target.checked ? [...p, m.id] : p.filter((id) => id !== m.id))}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#6B9FE5] cursor-pointer" onClick={() => setSelected(m.id)}>INV-{m.id}</td>
                    <td className="px-4 py-3 text-xs font-medium text-[#252731] cursor-pointer" onClick={() => setSelected(m.id)}>{m.project}</td>
                    <td className="px-4 py-3 text-xs text-[#69707D] cursor-pointer" onClick={() => setSelected(m.id)}>{m.date}</td>
                    <td className="px-4 py-3 text-xs text-[#252731] cursor-pointer" onClick={() => setSelected(m.id)}>{m.requestedBy}</td>
                    <td className="px-4 py-3 text-xs text-[#69707D] max-w-[180px] truncate cursor-pointer" onClick={() => setSelected(m.id)}>{m.purpose}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#252731] cursor-pointer" onClick={() => setSelected(m.id)}>{fmt(m.totalAmount)}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(m.id)}>
                      {pending ? (
                        <div>
                          <div className="text-[11px] font-semibold text-[#252731]">{pending.actor}</div>
                          <div className="text-[10px] text-[#69707D]">{pending.role}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9DA8C0]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(m.id)}><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-[#6B9FE5] font-semibold hover:underline whitespace-nowrap" onClick={() => setSelected(m.id)}>Open →</button>
                        <span className="text-[#E8EAF0]">|</span>
                        <button
                          className="text-xs text-[#69707D] hover:text-[#25205B] transition-colors whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); openInvoice(m as unknown as Record<string, unknown>); }}
                        >PDF</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context menu ──────────────────────────────────────────────────────── */}
      {ctxMenu && (() => {
        const ctxMR = localMRs.find((m) => m.id === ctxMenu.id);
        return (
          <div
            style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 999 }}
            className="bg-white border border-[#E8EAF0] rounded-xl shadow-xl py-1 min-w-[180px] text-[12px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 text-[#252731] hover:bg-[#F7F8FA] transition-colors"
              onClick={() => { setSelected(ctxMenu.id); setCtxMenu(null); }}
            >View Details</button>
            <button
              className="w-full text-left px-4 py-2 text-[#252731] hover:bg-[#F7F8FA] transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(ctxMenu.id);
                showToast("Copied", "success");
                setCtxMenu(null);
              }}
            >Copy MR ID</button>
            {ctxMR && (
              <button
                className="w-full text-left px-4 py-2 text-[#252731] hover:bg-[#F7F8FA] transition-colors"
                onClick={() => {
                  exportCSV(
                    `mr-${ctxMR.id}`,
                    ["ID", "Project", "Requested By", "Date", "Total Amount", "Status", "Priority"],
                    [[
                      ctxMR.id,
                      ctxMR.project,
                      ctxMR.requestedBy,
                      ctxMR.date,
                      ctxMR.totalAmount,
                      ctxMR.status,
                      (ctxMR as unknown as Record<string, unknown>).priority as string ?? "Normal",
                    ]]
                  );
                  setCtxMenu(null);
                }}
              >Export Row</button>
            )}
            <div className="border-t border-[#E8EAF0] my-1" />
            {ctxMR && canActOnMR(ctxMR) && (
              <button
                className="w-full text-left px-4 py-2 text-[#252731] hover:bg-[#F7F8FA] transition-colors"
                onClick={() => {
                  const now  = new Date();
                  const date = now.toISOString().slice(0, 10);
                  const time = now.toLocaleTimeString();
                  const chain = (ctxMR.approvalChain ?? []) as ChainStep[];
                  const norm: ChainStep[] = chain[0]?.action === "Submitted" ? chain : [
                    { actor: ctxMR.requestedBy, role: ctxMR.role, action: "Submitted", date: ctxMR.date, time: "", note: "" },
                    ...chain,
                  ];
                  const mPurchaseType = ((ctxMR as unknown as Record<string, string>).purchaseType ?? "construction") as "construction" | "office";
                  const amt = ctxMR.totalAmount ?? 0;
                  let action: string;
                  let nextStatus: string;
                  if (ctxMR.status === "Pending CEO") {
                    action = "Authorized"; nextStatus = "Disbursed";
                  } else if (ctxMR.status === "Pending Admin") {
                    const adminFinal = amt <= ADMIN_FINAL_THRESHOLD;
                    action = adminFinal ? "Authorized" : "Approved";
                    nextStatus = adminFinal ? "Disbursed" : "Pending CEO";
                  } else {
                    action = "Approved";
                    nextStatus = mPurchaseType === "office" ? "Pending CEO" : "Pending Admin";
                  }
                  const nextOpts = getNextApproverOptions(actorRole, amt, mPurchaseType);
                  const nextP    = nextOpts[0];
                  const newChain = norm.map((s) =>
                    s.action === "Pending"
                      ? { ...s, actor: staffName || actorRole, role: actorRole, action, date, time, note: `${action} via context menu.` }
                      : s
                  );
                  if (nextP) {
                    newChain.push(
                      nextStatus === "Disbursed"
                        ? { actor: nextP.name, role: nextP.title, action: "Disbursed", date, time, note: `₦${amt.toLocaleString()} authorized for disbursement.` }
                        : { actor: nextP.name, role: nextP.title, action: "Pending",   date: "",   time: "",   note: "" }
                    );
                  }
                  setLocalMRs((prev) => prev.map((m) => m.id === ctxMenu.id ? { ...m, status: nextStatus, approvalChain: newChain } : m));
                  showToast(`Invoice ${action}`, "success");
                  setCtxMenu(null);
                }}
              >Approve</button>
            )}
          </div>
        );
      })()}

      {/* Modals ─────────────────────────────────────────────────────────────── */}
      {showNewMR && (
        <NewMRModal
          onClose={() => { setShowNewMR(false); setPrefilledReq(null); }}
          submitterName={staffName}
          submitterRole={isHOWO ? `HOWO (${howoCoverage})` : isAdmin ? "Admin" : "IVM"}
          purchaseType={purchaseTypeForModal}
          prefill={prefilledReq ? {
            project: prefilledReq.project,
            purpose: prefilledReq.purpose,
            items:   prefilledReq.items,
            notes:   prefilledReq.notes,
          } : undefined}
          prefillReqId={prefilledReq?.id}
          onSave={(newMR) => {
            setLocalMRs((prev) => [...prev, newMR as typeof prev[0]]);
            if (prefilledReq) {
              const invoiceId = (newMR as Record<string, string>).id;
              setRequisitions((prev) => prev.map((r) =>
                r.id === prefilledReq.id
                  ? { ...r, status: "Issued as Invoice" as const, ivmNote: `Converted to purchase invoice INV-${invoiceId}.`, issuedInvoiceId: invoiceId }
                  : r
              ));
            }
            logActivity({
              timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
              actor:     staffName,
              role:      isHOWO ? `HOWO (${howoCoverage})` : "IVM",
              action:    "Purchase Invoice Submitted",
              module:    "Procurement",
              detail:    `Invoice raised for ${(newMR as Record<string, string>).project} — ₦${((newMR as Record<string, number>).totalAmount ?? 0).toLocaleString()}. Forwarded for approval.${prefilledReq ? ` Originated from staff requisition ${prefilledReq.id}.` : ""}`,
              ref:       (newMR as Record<string, string>).id,
              severity:  "info",
            });
            setShowNewMR(false);
            setPrefilledReq(null);
          }}
        />
      )}

      {showReqModal && (
        <StaffRequisitionModal
          onClose={() => setShowReqModal(false)}
          submitterName={staffName}
          submitterRole={staffRole}
          onSave={(req) => {
            setRequisitions((prev) => [req, ...prev]);
            setShowReqModal(false);
          }}
        />
      )}
    </div>
  );
}
