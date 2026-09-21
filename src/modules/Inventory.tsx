import { useState } from "react";
import { INVENTORY_ITEMS, PROJECTS } from "../data/dummy";
import { LIVE_MATERIAL_REQUESTS } from "../data/persistentStore";
import { movementStore, StockMovement, MovementType, MovementStatus, bumpMovementId } from "../data/stockMovementStore";
import * as MovementStoreModule from "../data/stockMovementStore";
import { logActivity } from "../data/activityLog";

type InventoryItem = typeof INVENTORY_ITEMS[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStatus(qty: number, reorderLevel: number): InventoryItem["status"] {
  if (qty === 0) return "Out of Stock";
  if (qty <= reorderLevel) return "Low";
  return "Adequate";
}

function today() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Adequate: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Low: "bg-amber-50 text-amber-700 border-amber-200",
    "Out of Stock": "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

function MovementBadge({ status }: { status: MovementStatus }) {
  const map: Record<MovementStatus, { bg: string; color: string }> = {
    "Pending Approval": { bg: "rgba(212,168,67,0.12)", color: "#b07e0f" },
    Approved: { bg: "rgba(22,163,74,0.1)", color: "#15803d" },
    Declined: { bg: "rgba(220,38,38,0.1)", color: "#dc2626" },
  };
  const s = map[status];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

const LOCATIONS = ["Palm Court Site", "Emerald Gardens Site", "Granite Heights Site", "Central Store"];
const REASONS_ADD = ["Delivery", "Transfer In", "Return to Store", "Other"];
const REASONS_REMOVE = ["Project Allocation", "Transfer Out", "Damage / Wastage", "Correction", "Other"];
const REASONS_SET = ["Recount", "Audit Correction", "Other"];

const AUTHORISED_ROLES = ["ceo", "admin", "howo"];

// ─── Stock Movement Modal ─────────────────────────────────────────────────────

function StockMovementModal({
  items,
  prefillItem,
  staffName,
  staffRole,
  onClose,
  onSubmit,
}: {
  items: InventoryItem[];
  prefillItem: InventoryItem | null;
  staffName: string;
  staffRole: string;
  onClose: () => void;
  onSubmit: (movement: StockMovement, updatedItems: InventoryItem[]) => void;
}) {
  const canDirectApprove = AUTHORISED_ROLES.includes(staffRole);

  const [selectedId, setSelectedId] = useState(prefillItem?.id ?? items[0]?.id ?? "");
  const [type, setType] = useState<MovementType>("remove");
  const [qty, setQty] = useState("");
  const [project, setProject] = useState(PROJECTS[0]?.name ?? "");
  const [authorisedBy, setAuthorisedBy] = useState(canDirectApprove ? staffName : "Chukwuma Eze");
  const [reason, setReason] = useState("Project Allocation");
  const [notes, setNotes] = useState("");
  const [linkedMR, setLinkedMR] = useState("");
  const [error, setError] = useState("");

  const item = items.find((i) => i.id === selectedId) ?? items[0];
  const parsedQty = Number(qty);

  const reasonOptions = type === "add" ? REASONS_ADD : type === "remove" ? REASONS_REMOVE : REASONS_SET;

  function previewQty() {
    if (!item || isNaN(parsedQty) || parsedQty < 0) return item?.qty ?? 0;
    if (type === "add") return item.qty + parsedQty;
    if (type === "remove") return item.qty - parsedQty;
    return parsedQty;
  }

  const preview = previewQty();
  const previewNegative = qty !== "" && !isNaN(parsedQty) && preview < 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qty || isNaN(parsedQty) || parsedQty <= 0) {
      setError("Enter a valid quantity greater than 0."); return;
    }
    if (previewNegative) {
      setError(`Cannot remove more than current stock (${item?.qty ?? 0} ${item?.unit ?? "units"}).`); return;
    }
    if (!project) { setError("Select a target project."); return; }

    const isDirectApproval = canDirectApprove;
    const qtyAfter = preview;
    const movement: StockMovement = {
      id: (() => { const id = `SM-${String(MovementStoreModule.nextMovementId).padStart(3, "0")}`; bumpMovementId(); return id; })(),
      itemId: item.id,
      itemName: item.material,
      itemUnit: item.unit,
      location: item.location,
      type,
      qty: parsedQty,
      qtyBefore: item.qty,
      qtyAfter,
      project,
      requestedBy: staffName,
      requestedByRole: staffRole.toUpperCase(),
      authorisedBy: isDirectApproval ? staffName : authorisedBy,
      reason,
      notes,
      linkedMR,
      status: isDirectApproval ? "Approved" : "Pending Approval",
      requestedAt: today(),
      ...(isDirectApproval ? { reviewedAt: today() } : {}),
    };

    let updatedItems = items;
    if (isDirectApproval) {
      updatedItems = items.map((i) => {
        if (i.id !== item.id) return i;
        const status = calcStatus(qtyAfter, i.reorderLevel);
        return { ...i, qty: qtyAfter, status, lastUpdated: new Date().toISOString().slice(0, 10) };
      });
    }

    onSubmit(movement, updatedItems);
  }

  const availableMRs = LIVE_MATERIAL_REQUESTS.filter(
    (mr) => mr.project === project || !project
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(-16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        .modal-card { animation: modalIn 0.18s ease forwards; }
      `}</style>
      <div className="modal-card bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: "#25205B" }}>
          <div>
            <h3 className="text-white font-semibold text-base">Stock Movement Request</h3>
            <p className="text-[#a78bfa] text-[11px] mt-0.5">
              {canDirectApprove ? "Your approval will be applied immediately" : "Requires authorisation before taking effect"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Item */}
          <div>
            <label className="block text-xs font-semibold text-[#252731] mb-1">Inventory Item <span className="text-red-500">*</span></label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]">
              {items.map((i) => <option key={i.id} value={i.id}>{i.material} ({i.location}) — {i.qty} {i.unit}</option>)}
            </select>
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#252731] mb-2">Movement Type <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {(["add", "remove", "set"] as const).map((t) => {
                const labels = { add: "+ Add (Delivery)", remove: "- Remove (Allocation)", set: "= Set Exact" };
                const colors = { add: "#16a34a", remove: "#dc2626", set: "#6B9FE5" };
                const active = type === t;
                return (
                  <button key={t} type="button"
                    onClick={() => { setType(t); setReason(t === "add" ? "Delivery" : t === "remove" ? "Project Allocation" : "Recount"); setError(""); }}
                    className="flex-1 text-xs font-semibold py-2 px-1 rounded-lg border transition-colors"
                    style={active ? { background: colors[t], color: "#fff", borderColor: colors[t] } : { background: "#F7F8FA", color: "#252731", borderColor: "#E8EAF0" }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qty + Preview row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#252731] mb-1">
                Quantity ({item?.unit ?? "units"}) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="1" value={qty} onChange={(e) => { setQty(e.target.value); setError(""); }}
                placeholder="0"
                className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252731] mb-1">Resulting Stock</label>
              <div className={`rounded-lg px-3 py-2 text-sm font-semibold flex items-center h-[38px] ${previewNegative ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#EAF2FC] text-[#25205B] border border-[#D3E3F9]"}`}>
                {qty !== "" && !isNaN(parsedQty)
                  ? `${preview < 0 ? "−" : ""}${Math.abs(preview)} ${item?.unit ?? ""}`
                  : <span className="text-[#B0B8C4] font-normal">Enter qty</span>}
              </div>
            </div>
          </div>

          {/* Target Project */}
          <div>
            <label className="block text-xs font-semibold text-[#252731] mb-1">Target Project <span className="text-red-500">*</span></label>
            <select value={project} onChange={(e) => { setProject(e.target.value); setLinkedMR(""); }}
              className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]">
              {PROJECTS.map((p) => <option key={p.id} value={p.name}>{p.name} — {p.location}</option>)}
              <option value="Central Store">Central Store (Internal)</option>
            </select>
          </div>

          {/* Linked MR — only for additions */}
          {type === "add" && (
            <div>
              <label className="block text-xs font-semibold text-[#252731] mb-1">
                Linked Procurement Request <span className="text-[#69707D] font-normal">(optional)</span>
              </label>
              <select value={linkedMR} onChange={(e) => setLinkedMR(e.target.value)}
                className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]">
                <option value="">— None —</option>
                {availableMRs.map((mr) => (
                  <option key={mr.id} value={mr.id}>{mr.id} · {mr.project} · {mr.requestedBy}</option>
                ))}
              </select>
              {linkedMR && (
                <p className="text-[11px] mt-1" style={{ color: "#6B9FE5" }}>
                  Linked to {linkedMR} — delivery will be traceable to this procurement record.
                </p>
              )}
            </div>
          )}

          {/* Authorised By — only for non-authorised roles */}
          {!canDirectApprove && (
            <div>
              <label className="block text-xs font-semibold text-[#252731] mb-1">Authorised By <span className="text-red-500">*</span></label>
              <input type="text" value={authorisedBy} onChange={(e) => setAuthorisedBy(e.target.value)}
                placeholder="e.g. Chukwuma Eze (HOWO)"
                className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]" />
              <p className="text-[10px] mt-1" style={{ color: "#B0B8C4" }}>
                This movement will be pending until the named officer approves it.
              </p>
            </div>
          )}
          {canDirectApprove && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#16a34a" strokeWidth="1.2" /><path d="M4 6.5l1.8 1.8L9 5" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="text-[11px] font-semibold" style={{ color: "#15803d" }}>You are an authorised officer — this will be applied immediately upon submission.</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#252731] mb-1">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]">
              {reasonOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#252731] mb-1">Notes <span className="text-[#69707D] font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional context, phase details, instructions…"
              className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]" />
          </div>

          {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-[#D3E3F9] text-[#25205B] text-sm font-semibold py-2.5 rounded-lg hover:bg-[#EAF2FC] transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors" style={{ backgroundColor: "#25205B" }}>
              {canDirectApprove ? "Apply Movement" : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────

function ApprovalsTab({
  movements,
  items,
  staffName,
  onApprove,
  onDecline,
}: {
  movements: StockMovement[];
  items: InventoryItem[];
  staffName: string;
  onApprove: (id: string) => void;
  onDecline: (id: string, note: string) => void;
}) {
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  const pending = movements.filter((m) => m.status === "Pending Approval");
  const mine = pending.filter((m) => m.authorisedBy === staffName);
  const others = pending.filter((m) => m.authorisedBy !== staffName);

  function typeIcon(t: MovementType) {
    if (t === "add") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}>+ ADD</span>;
    if (t === "remove") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>− REMOVE</span>;
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(107,159,229,0.12)", color: "#25205B" }}>=&nbsp;SET</span>;
  }

  function MovementCard({ m, actionable }: { m: StockMovement; actionable: boolean }) {
    const currentQty = items.find((i) => i.id === m.itemId)?.qty ?? m.qtyBefore;
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[11px] shrink-0" style={{ background: "#EAF2FC", color: "#25205B" }}>
                {m.requestedBy.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{m.id}</span>
                  {typeIcon(m.type)}
                </div>
                <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{m.itemName}</div>
                <div className="text-[11px]" style={{ color: "#69707D" }}>
                  {m.location} · Submitted by <strong>{m.requestedBy}</strong> ({m.requestedByRole}) · {m.requestedAt}
                </div>
              </div>
            </div>
            <MovementBadge status={m.status} />
          </div>

          {/* Movement detail pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Quantity", value: `${m.type === "add" ? "+" : m.type === "remove" ? "−" : "="}${m.qty} ${m.itemUnit}` },
              { label: "Current Stock", value: `${currentQty} ${m.itemUnit}` },
              { label: "Result if Approved", value: `${m.qtyAfter} ${m.itemUnit}` },
              { label: "Target Project", value: m.project },
            ].map((d) => (
              <div key={d.label} className="rounded-xl px-3 py-2.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>{d.label}</div>
                <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>{d.value}</div>
              </div>
            ))}
          </div>

          {m.linkedMR && (
            <div className="flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg" style={{ background: "rgba(107,159,229,0.08)", border: "1px solid rgba(107,159,229,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ color: "#25205B" }}>Linked to procurement request <strong>{m.linkedMR}</strong></span>
            </div>
          )}

          {m.notes && (
            <p className="text-[12px] italic" style={{ color: "#69707D" }}>"{m.notes}"</p>
          )}

          <div className="text-[11px]" style={{ color: "#B0B8C4" }}>Reason: {m.reason}</div>
        </div>

        {actionable && (
          <div style={{ borderTop: "1px solid #F0F2F5" }} className="px-5 py-3">
            {declineId === m.id ? (
              <div className="flex items-center gap-2">
                <input value={declineNote} onChange={(e) => setDeclineNote(e.target.value)}
                  placeholder="Reason for declining…"
                  className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none"
                  style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#252731" }} />
                <button onClick={() => { if (!declineNote.trim()) return; onDecline(m.id, declineNote.trim()); setDeclineId(null); setDeclineNote(""); }}
                  disabled={!declineNote.trim()}
                  className="text-[12px] font-semibold px-3 py-2 rounded-xl disabled:opacity-40"
                  style={{ background: "#dc2626", color: "#fff" }}>Confirm</button>
                <button onClick={() => { setDeclineId(null); setDeclineNote(""); }}
                  className="text-[12px] px-3 py-2 rounded-xl" style={{ background: "#F7F8FA", color: "#252731", border: "1px solid #E8EAF0" }}>Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => onApprove(m.id)} className="text-[12px] font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ background: "#16a34a", color: "#fff" }}>
                  Approve
                </button>
                <button onClick={() => setDeclineId(m.id)} className="text-[12px] font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity" style={{ background: "#dc2626", color: "#fff" }}>
                  Decline
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(22,163,74,0.1)" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l3.5 3.5L15 7" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="font-semibold text-[14px]" style={{ color: "#252731" }}>All clear</p>
        <p className="text-[12px] mt-1" style={{ color: "#B0B8C4" }}>No pending stock movements awaiting your approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mine.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#a78bfa" }}>
            Awaiting your approval ({mine.length})
          </div>
          {mine.map((m) => <MovementCard key={m.id} m={m} actionable />)}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>
            Other pending movements ({others.length})
          </div>
          {others.map((m) => <MovementCard key={m.id} m={m} actionable={false} />)}
        </div>
      )}
    </div>
  );
}

// ─── Movement Log Tab ─────────────────────────────────────────────────────────

function MovementLogTab({ movements }: { movements: StockMovement[] }) {
  const sorted = [...movements].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  function typeColor(t: MovementType) {
    return t === "add" ? "#16a34a" : t === "remove" ? "#dc2626" : "#6B9FE5";
  }
  function typeLabel(t: MovementType, qty: number, unit: string) {
    const prefix = t === "add" ? "+" : t === "remove" ? "−" : "=";
    return `${prefix}${qty} ${unit}`;
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F0F2F5" }}>
        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>All Stock Movements</div>
        <div className="text-[11px]" style={{ color: "#B0B8C4" }}>{movements.length} records</div>
      </div>
      {sorted.length === 0 ? (
        <div className="p-8 text-center text-[13px]" style={{ color: "#B0B8C4" }}>No movements recorded yet.</div>
      ) : (
        <div className="divide-y divide-[#F7F8FA]">
          {sorted.map((m) => (
            <div key={m.id} className="px-5 py-4 flex items-start gap-4 flex-wrap hover:bg-[#FAFBFC] transition-colors">
              <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-[13px]"
                style={{ background: `${typeColor(m.type)}18`, color: typeColor(m.type) }}>
                {m.type === "add" ? "+" : m.type === "remove" ? "−" : "="}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{m.id}</span>
                  <span className="text-[12px] font-semibold" style={{ color: typeColor(m.type) }}>
                    {typeLabel(m.type, m.qty, m.itemUnit)}
                  </span>
                  <MovementBadge status={m.status} />
                </div>
                <div className="font-semibold text-[13px] truncate" style={{ color: "#252731" }}>{m.itemName}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>
                  {m.location} · {m.project}
                  {m.linkedMR && <> · Linked: <span style={{ color: "#6B9FE5" }}>{m.linkedMR}</span></>}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "#B0B8C4" }}>
                  By {m.requestedBy} ({m.requestedByRole}) · Authorised: {m.authorisedBy} · {m.requestedAt}
                  {m.reviewedAt && ` · Reviewed ${m.reviewedAt}`}
                </div>
                {m.notes && <p className="text-[11px] italic mt-0.5" style={{ color: "#69707D" }}>"{m.notes}"</p>}
                {m.reviewNote && <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#dc2626" }}>Declined: {m.reviewNote}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>{m.qtyBefore} → {m.qtyAfter}</div>
                <div className="text-[10px]" style={{ color: "#B0B8C4" }}>{m.itemUnit}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Inventory Component ─────────────────────────────────────────────────

export default function Inventory() {
  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const staffName: string = staffInfo.name ?? "Sola Ogunlola";
  const staffRole: string = staffInfo.role ?? "ivm";
  const canApprove = AUTHORISED_ROLES.includes(staffRole);

  const [items, setItems] = useState([...INVENTORY_ITEMS]);
  const [movements, setMovements] = useState<StockMovement[]>([...movementStore]);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"stock" | "approvals" | "log">("stock");

  const pendingCount = movements.filter((m) => m.status === "Pending Approval" && m.authorisedBy === staffName).length;

  function handleMovementSubmit(movement: StockMovement, updatedItems: InventoryItem[]) {
    const updated = [movement, ...movements];
    MovementStoreModule.movementStore.length = 0; MovementStoreModule.movementStore.push(...updated);
    setMovements(updated);
    setItems(updatedItems);

    logActivity({
      timestamp: today(),
      actor: staffName,
      role: staffRole.toUpperCase(),
      action: movement.status === "Approved" ? "Stock Movement Applied" : "Stock Movement Requested",
      module: "Inventory",
      detail: `${movement.type.toUpperCase()} ${movement.qty} ${movement.itemUnit} of ${movement.itemName} (${movement.location}) for ${movement.project}${movement.linkedMR ? ` — linked to ${movement.linkedMR}` : ""}.`,
      ref: movement.id,
      severity: "info",
    });
    setShowMovementModal(false);
    setAdjustItem(null);
  }

  function handleApprove(id: string) {
    const m = movements.find((mv) => mv.id === id);
    if (!m) return;

    const updatedItems = items.map((i) => {
      if (i.id !== m.itemId) return i;
      const newQty = m.qtyAfter;
      return { ...i, qty: newQty, status: calcStatus(newQty, i.reorderLevel), lastUpdated: new Date().toISOString().slice(0, 10) };
    });

    const updated = movements.map((mv) => mv.id !== id ? mv : { ...mv, status: "Approved" as MovementStatus, reviewedAt: today() });
    MovementStoreModule.movementStore.length = 0; MovementStoreModule.movementStore.push(...updated);
    setMovements(updated);
    setItems(updatedItems);

    logActivity({
      timestamp: today(), actor: staffName, role: staffRole.toUpperCase(),
      action: "Stock Movement Approved", module: "Inventory",
      detail: `Approved ${m.id}: ${m.type} ${m.qty} ${m.itemUnit} ${m.itemName} — ${m.project}.`,
      ref: m.id, severity: "info",
    });
  }

  function handleDecline(id: string, note: string) {
    const m = movements.find((mv) => mv.id === id);
    const updated = movements.map((mv) => mv.id !== id ? mv : { ...mv, status: "Declined" as MovementStatus, reviewedAt: today(), reviewNote: note });
    MovementStoreModule.movementStore.length = 0; MovementStoreModule.movementStore.push(...updated);
    setMovements(updated);

    logActivity({
      timestamp: today(), actor: staffName, role: staffRole.toUpperCase(),
      action: "Stock Movement Declined", module: "Inventory",
      detail: `Declined ${m?.id ?? id}: ${note}`,
      ref: id, severity: "warning",
    });
  }

  const tabs = [
    { id: "stock" as const, label: "Stock Levels" },
    { id: "approvals" as const, label: "Approvals", count: canApprove ? pendingCount : 0, show: canApprove || movements.some((m) => m.requestedBy === staffName) },
    { id: "log" as const, label: "Movement Log" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Inventory</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Site store stock levels and material tracking</p>
        </div>
        <button onClick={() => { setAdjustItem(null); setShowMovementModal(true); }}
          className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors shrink-0">
          + Stock Movement
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E8EAF0]">
        {tabs.filter((t) => t.show !== false).map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-[13px] font-medium flex items-center gap-1.5 transition-colors border-b-2 -mb-px ${activeTab === t.id ? "border-[#25205B] text-[#25205B]" : "border-transparent text-[#69707D] hover:text-[#252731]"}`}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#a78bfa", color: "#fff" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "stock" && (
        <>
          {/* Alerts */}
          {items.some((i) => i.status === "Low" || i.status === "Out of Stock") && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="text-amber-800 font-semibold text-sm mb-1">Stock Alerts</div>
              <div className="space-y-1">
                {items.filter((i) => i.status !== "Adequate").map((item) => (
                  <div key={item.id} className="text-amber-700 text-xs">
                    <span className="font-semibold">{item.material}</span> at {item.location} —{" "}
                    {item.status === "Out of Stock" ? "OUT OF STOCK" : `Low stock (${item.qty} ${item.unit} remaining, reorder at ${item.reorderLevel})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total SKUs Tracked", value: items.length, color: "indigo" },
              { label: "Low Stock Items", value: items.filter((i) => i.status === "Low").length, color: "amber" },
              { label: "Out of Stock", value: items.filter((i) => i.status === "Out of Stock").length, color: "red" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border px-5 py-4 ${s.color === "indigo" ? "bg-[#25205B] border-[#312a72]" : s.color === "amber" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                <div className={`text-xs font-medium mb-1 ${s.color === "indigo" ? "text-[#6B9FE5]" : s.color === "amber" ? "text-amber-700" : "text-red-600"}`}>{s.label}</div>
                <div className={`text-3xl font-bold ${s.color === "indigo" ? "text-white" : s.color === "amber" ? "text-amber-800" : "text-red-700"}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                    {["Item ID", "Material", "Location", "Qty on Hand", "Unit", "Reorder Level", "Last Updated", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3 font-mono text-xs text-[#6B9FE5] font-semibold">{item.id}</td>
                      <td className="px-5 py-3 text-sm text-[#252731] font-medium">{item.material}</td>
                      <td className="px-5 py-3 text-xs text-[#69707D]">{item.location}</td>
                      <td className={`px-5 py-3 text-sm font-bold ${item.status === "Out of Stock" ? "text-red-600" : item.status === "Low" ? "text-amber-600" : "text-[#252731]"}`}>
                        {item.qty.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#69707D]">{item.unit}</td>
                      <td className="px-5 py-3 text-xs text-[#69707D]">{item.reorderLevel}</td>
                      <td className="px-5 py-3 text-xs text-[#69707D]">{item.lastUpdated}</td>
                      <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-3">
                        <button onClick={() => { setAdjustItem(item); setShowMovementModal(true); }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-[#EAF2FC]"
                          style={{ color: "#6B9FE5", border: "1px solid #D3E3F9" }}>
                          Adjust →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "approvals" && (
        <ApprovalsTab movements={movements} items={items} staffName={staffName} onApprove={handleApprove} onDecline={handleDecline} />
      )}

      {activeTab === "log" && <MovementLogTab movements={movements} />}

      {/* Modal */}
      {showMovementModal && (
        <StockMovementModal
          items={items}
          prefillItem={adjustItem}
          staffName={staffName}
          staffRole={staffRole}
          onClose={() => { setShowMovementModal(false); setAdjustItem(null); }}
          onSubmit={handleMovementSubmit}
        />
      )}
    </div>
  );
}
