import { useState, useRef } from "react";
import { PROJECTS, MATERIAL_REQUESTS, DAILY_REPORTS, PROGRESS_REPORTS, DEPLOYMENT_RECORDS, EMPLOYEES, INVENTORY_ITEMS } from "../data/dummy";
import { LIVE_PROGRESS_REPORTS, EnhancedProgressReport, ReportComment, persistStore } from "../data/persistentStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { logActivity } from "../data/activityLog";

type Project = typeof PROJECTS[0];

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Near Completion": "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Completed: "bg-gray-50 text-gray-600 border-gray-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Disbursed: "bg-purple-50 text-purple-700 border-purple-200",
    Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Submitted: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    "Pending Supervisor": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

type ProgressReport = EnhancedProgressReport;
type DeploymentRecord = typeof DEPLOYMENT_RECORDS[0] & { [key: string]: unknown };
type InventoryItem = typeof INVENTORY_ITEMS[0] & { [key: string]: unknown };
type MRWithDelivery = {
  id: string; project: string; projectId: string; date: string; requestedBy: string; role: string;
  items?: { material: string; qty: number; unit: string; unitPrice: number; total: number }[];
  totalAmount: number; purpose: string; status: string;
  approvalChain?: { actor: string; role: string; action: string; date: string; time: string; note: string }[];
  supplier?: string | null; deliveryStatus: string; deliveryDate?: string;
  ivm?: string;
  ivmVerification?: { date?: string; status?: string; notes?: string; photos?: number; variance?: string; varianceAmount?: number };
  [key: string]: unknown;
};

/* ─── FILE UPLOAD HELPER ─── */
function FileUploadButton({ onFiles, multiple, label, accept }: {
  onFiles: (urls: string[], names: string[]) => void;
  multiple?: boolean;
  label?: string;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept ?? "image/*"} multiple={multiple} className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          onFiles(files.map((f) => URL.createObjectURL(f)), files.map((f) => f.name));
          e.target.value = "";
        }} />
      <button type="button" onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all hover:bg-[#EAF2FC]"
        style={{ border: "1px dashed #6B9FE5", color: "#6B9FE5" }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        {label ?? "Upload Image"}
      </button>
    </>
  );
}

/* ─── RECORD DELIVERY MODAL ─── */
function RecordDeliveryModal({ mr, onClose, onSave }: {
  mr: MRWithDelivery;
  onClose: () => void;
  onSave: (mrId: string, data: { status: string; notes: string; variance: string; photos: string[] }) => void;
}) {
  const [notes, setNotes] = useState("");
  const [variance, setVariance] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const hasVariance = variance.trim().length > 0;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave(mr.id, {
        status: hasVariance ? "Variance Noted" : "Verified — No Variance",
        notes: notes.trim() || "Delivery received and verified.",
        variance: variance.trim(),
        photos: photoUrls,
      });
      setSaving(false);
      setDone(true);
      setTimeout(onClose, 1200);
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#E8EAF0] flex items-center justify-between z-10">
          <div>
            <div className="font-mono text-[10px] text-[#6B9FE5]">{mr.id}</div>
            <h3 className="font-semibold text-[15px]" style={{ color: "#252731" }}>Record Delivery</h3>
          </div>
          <button onClick={onClose} className="text-[#69707D] text-xl">&times;</button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#dcfce7" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>Delivery recorded</div>
            <div className="text-[12px] mt-1" style={{ color: "#69707D" }}>IVM verification logged in the audit trail.</div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="font-semibold text-[13px] mb-1" style={{ color: "#252731" }}>{mr.purpose}</div>
              <div className="text-[11px]" style={{ color: "#69707D" }}>Supplier: {mr.supplier ?? "TBD"} · Requested: {mr.date}</div>
              <div className="mt-2 space-y-1">
                {mr.items?.map((item, i) => (
                  <div key={i} className="text-[11px] flex justify-between">
                    <span style={{ color: "#69707D" }}>{item.material}</span>
                    <span className="font-semibold" style={{ color: "#252731" }}>Expected: {item.qty} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Delivery Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Describe what was delivered, condition, any observations..."
                className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5] resize-none" style={{ color: "#252731" }} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Variance / Shortfall (leave blank if none)</label>
              <input value={variance} onChange={(e) => setVariance(e.target.value)}
                placeholder="e.g. 5 tons steel short-delivered"
                className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
              {hasVariance && (
                <div className="mt-1.5 text-[11px] rounded-lg px-3 py-1.5" style={{ background: "#FFF7ED", color: "#92400e", border: "1px solid #FED7AA" }}>
                  Variance noted — a credit note or resolution should be requested from the supplier.
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Delivery Photos (optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8EAF0] bg-[#F7F8FA]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotoUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] flex items-center justify-center">&times;</button>
                  </div>
                ))}
              </div>
              <FileUploadButton multiple label="Upload Photos" onFiles={(urls) => setPhotoUrls((p) => [...p, ...urls])} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E8EAF0] text-sm text-[#69707D]">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#25205B" }}>
                {saving ? "Recording…" : "Record Delivery →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── INVENTORY MANAGEMENT ─── */
function InventoryTab({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const [items, setItems] = useState<InventoryItem[]>(
    projectId ? INVENTORY_ITEMS.filter((i) => i.location.toLowerCase().includes((projectName ?? "").toLowerCase().split(" ")[0].toLowerCase())) : INVENTORY_ITEMS
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const statusColor: Record<string, string> = {
    Adequate: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Low: "bg-amber-50 text-amber-700 border-amber-200",
    "Out of Stock": "bg-red-50 text-red-600 border-red-200",
  };

  function handleAdjust(item: InventoryItem) {
    const delta = parseInt(adjustQty);
    if (isNaN(delta)) return;
    const newQty = Math.max(0, item.qty + delta);
    const newStatus = newQty === 0 ? "Out of Stock" : newQty <= item.reorderLevel ? "Low" : "Adequate";
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, qty: newQty, status: newStatus, lastUpdated: new Date().toISOString().split("T")[0] } : i));
    setAdjustItem(null);
    setAdjustQty("");
    setAdjustNote("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px]" style={{ color: "#69707D" }}>{items.length} item{items.length !== 1 ? "s" : ""} in inventory{projectName ? ` — ${projectName}` : ""}</div>
        <button onClick={() => setShowAddForm(true)}
          className="text-sm px-4 py-2 rounded-lg font-medium text-white transition-colors"
          style={{ background: "#25205B" }}>
          + Add Item
        </button>
      </div>

      {/* Low stock warnings */}
      {items.some((i) => i.status !== "Adequate") && (
        <div className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 7v3M8 12v.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <div className="font-semibold text-[11px]" style={{ color: "#92400e" }}>Stock Alert</div>
            <div className="text-[11px]" style={{ color: "#92400e" }}>
              {items.filter((i) => i.status === "Out of Stock").length > 0 && `${items.filter((i) => i.status === "Out of Stock").length} item(s) out of stock. `}
              {items.filter((i) => i.status === "Low").length > 0 && `${items.filter((i) => i.status === "Low").length} item(s) running low.`}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
              {["Item", "Location", "Qty", "Unit", "Reorder Level", "Status", "Last Updated", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[#F7F8FA] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-mono text-[10px] text-[#6B9FE5] font-semibold">{item.id}</div>
                  <div className="font-medium text-[12px]" style={{ color: "#252731" }}>{item.material}</div>
                </td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#69707D" }}>{item.location}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold text-sm ${item.status === "Out of Stock" ? "text-red-600" : item.status === "Low" ? "text-amber-600" : "text-[#25205B]"}`}>
                    {item.qty.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#69707D" }}>{item.unit}</td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#69707D" }}>{item.reorderLevel.toLocaleString()} {item.unit}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${statusColor[item.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#B0B8C4" }}>{item.lastUpdated}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setAdjustItem(item); setAdjustQty(""); }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all hover:bg-[#EAF2FC]"
                    style={{ border: "1px solid #E8EAF0", color: "#25205B" }}>
                    Adjust Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Item Form inline */}
      {showAddForm && (
        <AddInventoryItemForm
          onSubmit={(item) => { setItems((prev) => [item, ...prev]); setShowAddForm(false); }}
          onCancel={() => setShowAddForm(false)}
          projectName={projectName}
        />
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={(e) => e.target === e.currentTarget && setAdjustItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[400px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>Adjust Stock</div>
                <div className="text-[12px]" style={{ color: "#69707D" }}>{adjustItem.material}</div>
              </div>
              <button onClick={() => setAdjustItem(null)} className="text-[#69707D] text-xl">&times;</button>
            </div>
            <div className="rounded-xl p-3.5 flex justify-between items-center" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <span className="text-[12px]" style={{ color: "#69707D" }}>Current Stock</span>
              <span className="font-bold text-[15px]" style={{ color: "#252731" }}>{adjustItem.qty.toLocaleString()} {adjustItem.unit}</span>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Adjustment (use + or - value)</label>
              <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. +50 to add, -10 to remove"
                className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
              {adjustQty && !isNaN(parseInt(adjustQty)) && (
                <div className="mt-1.5 text-[11px]" style={{ color: "#69707D" }}>
                  New qty: <span className="font-bold" style={{ color: "#25205B" }}>{Math.max(0, adjustItem.qty + parseInt(adjustQty)).toLocaleString()} {adjustItem.unit}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Reason / Note</label>
              <input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="e.g. Received delivery from MR-00245"
                className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAdjustItem(null)} className="flex-1 py-2.5 rounded-xl border border-[#E8EAF0] text-sm text-[#69707D]">Cancel</button>
              <button onClick={() => handleAdjust(adjustItem)} disabled={!adjustQty || isNaN(parseInt(adjustQty))}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "#25205B" }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddInventoryItemForm({ onSubmit, onCancel, projectName }: {
  onSubmit: (item: InventoryItem) => void;
  onCancel: () => void;
  projectName?: string;
}) {
  const [form, setForm] = useState({ material: "", location: projectName ? `${projectName} Site Store` : "", qty: "", unit: "Units", reorderLevel: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const item: InventoryItem = {
      id: `INV-${Math.floor(Math.random() * 900 + 100)}`,
      material: form.material,
      location: form.location,
      qty: parseInt(form.qty) || 0,
      unit: form.unit,
      reorderLevel: parseInt(form.reorderLevel) || 10,
      lastUpdated: new Date().toISOString().split("T")[0],
      status: parseInt(form.qty) === 0 ? "Out of Stock" : parseInt(form.qty) <= parseInt(form.reorderLevel) ? "Low" : "Adequate",
    };
    onSubmit(item);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8EAF0] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>Add Inventory Item</div>
        <button type="button" onClick={onCancel} className="text-[#69707D] text-lg">&times;</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["material", "location"] as const).map((key) => (
          <div key={key}>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>{key === "material" ? "Material Name" : "Storage Location"}</label>
            <input required value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
          </div>
        ))}
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Initial Quantity</label>
          <input required type="number" min="0" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Unit</label>
          <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }}>
            {["Units", "Bags", "Tons", "m²", "m³", "Rolls", "Sets", "Pcs"].map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Reorder Level</label>
          <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-[#E8EAF0] text-sm text-[#69707D]">Cancel</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#25205B" }}>Add to Inventory</button>
      </div>
    </form>
  );
}

const PROJECT_TYPES = ["Residential", "Commercial", "Mixed Use", "Industrial", "Retail", "Hospitality"];
const PROJECT_STATUSES = ["Active", "Pending", "Near Completion", "Completed", "On Hold"];
const DEFAULT_PHASES = ["Foundation", "Structural", "Roofing", "Mechanical/Electrical", "Finishing", "Handover"];

function NewProjectForm({ onSubmit, onCancel }: { onSubmit: (p: Project) => void; onCancel: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    type: "Residential",
    units: "",
    budget: "",
    targetDate: "",
    pco: "",
    supervisor: "",
    description: "",
    status: "Active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phases, setPhases] = useState<string[]>([...DEFAULT_PHASES]);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [editingPhaseIdx, setEditingPhaseIdx] = useState<number | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState("");

  function addPhase() {
    const name = newPhaseName.trim();
    if (!name || phases.includes(name)) return;
    setPhases((prev) => [...prev, name]);
    setNewPhaseName("");
  }
  function removePhase(i: number) { setPhases((prev) => prev.filter((_, idx) => idx !== i)); }
  function movePhase(i: number, dir: -1 | 1) {
    setPhases((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function startEdit(i: number) { setEditingPhaseIdx(i); setEditingPhaseName(phases[i]); }
  function saveEdit() {
    if (editingPhaseIdx === null) return;
    const name = editingPhaseName.trim();
    if (name) setPhases((prev) => prev.map((p, i) => i === editingPhaseIdx ? name : p));
    setEditingPhaseIdx(null);
  }

  const howos = EMPLOYEES.filter((e) => e.role?.toLowerCase().startsWith("howo"));
  const pcos = EMPLOYEES.filter((e) => e.role === "pco");

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Project name is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.budget || isNaN(Number(form.budget))) e.budget = "Valid budget is required";
    if (!form.targetDate) e.targetDate = "Target date is required";
    if (!form.units || isNaN(Number(form.units))) e.units = "Valid unit count is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const id = "PRJ-" + Math.floor(Math.random() * 9000 + 1000);
      const newProject: Project = {
        id,
        name: form.name.trim(),
        location: form.location.trim(),
        type: form.type,
        units: parseInt(form.units),
        budget: parseFloat(form.budget.replace(/,/g, "")),
        spent: 0,
        completion: 0,
        status: form.status,
        startDate: new Date().toISOString().split("T")[0],
        targetDate: form.targetDate,
        pco: form.pco || "Unassigned",
        supervisor: form.supervisor || "Unassigned",
        description: form.description.trim() || `${form.type} project in ${form.location}.`,
        phases: (phases.length > 0 ? phases : DEFAULT_PHASES).map((name) => ({ name, completion: 0, status: "Pending" })),
      };
      setSaving(false);
      setStep("success");
      setTimeout(() => onSubmit(newProject), 1200);
    }, 900);
  }

  if (step === "success") {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Project Created</h3>
        <p className="text-[#69707D] text-sm mt-1">{form.name} has been added to your project portfolio.</p>
      </div>
    );
  }

  const field = (key: keyof typeof form, label: string, type: string = "text", placeholder: string = "") => (
    <div>
      <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none transition-all ${errors[key] ? "border-red-400 bg-red-50" : "border-[#E8EAF0] focus:border-[#6B9FE5]"}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#E8EAF0]">
        <h3 className="font-semibold text-[#252731]" style={{ fontFamily: "var(--font-display)" }}>New Construction Project</h3>
        <button type="button" onClick={onCancel} className="text-[#69707D] hover:text-[#252731] text-xl leading-none">&times;</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("name", "Project Name", "text", "e.g. Lekki Heights Phase 2")}
        {field("location", "Location", "text", "e.g. Lekki, Lagos")}
        <div>
          <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Project Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]">
            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]">
            {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {field("units", "Number of Units", "number", "e.g. 24")}
        {field("budget", "Total Budget (₦)", "text", "e.g. 500000000")}
        {field("targetDate", "Target Completion Date", "date")}
        <div>
          <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Project Control Officer (PCO)</label>
          <select value={form.pco} onChange={(e) => setForm((f) => ({ ...f, pco: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]">
            <option value="">Select PCO</option>
            {pcos.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
            {EMPLOYEES.filter((e) => !["pco"].includes(e.role)).slice(0, 4).map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">HOWO (Head of Works and Operations)</label>
          <select value={form.supervisor} onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))}
            className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]">
            <option value="">Select HOWO</option>
            {howos.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Project Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Brief description of the project scope and objectives..."
          rows={3} className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5] resize-none" />
      </div>
      {/* Phases editor */}
      <div className="rounded-xl border border-[#E8EAF0] overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Development Phases</div>
            <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>Add, remove, rename, or reorder phases for this project</div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{phases.length} phases</span>
        </div>
        <div className="divide-y divide-[#F0F2F5]">
          {phases.map((phase, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button type="button" onClick={() => movePhase(i, -1)} disabled={i === 0}
                  className="w-5 h-4 flex items-center justify-center rounded disabled:opacity-30 hover:bg-[#EAF2FC] transition-colors"
                  style={{ color: "#6B9FE5" }}>
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M4 1L7 5H1L4 1z" fill="currentColor" /></svg>
                </button>
                <button type="button" onClick={() => movePhase(i, 1)} disabled={i === phases.length - 1}
                  className="w-5 h-4 flex items-center justify-center rounded disabled:opacity-30 hover:bg-[#EAF2FC] transition-colors"
                  style={{ color: "#6B9FE5" }}>
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M4 5L1 1H7L4 5z" fill="currentColor" /></svg>
                </button>
              </div>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: "#EAF2FC", color: "#25205B" }}>{i + 1}</span>
              {editingPhaseIdx === i ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={editingPhaseName}
                    onChange={(e) => setEditingPhaseName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditingPhaseIdx(null); }}
                    className="flex-1 px-2 py-1 text-[12px] rounded outline-none border"
                    style={{ borderColor: "#6B9FE5", background: "#F7F8FA", color: "#252731" }}
                    autoFocus
                  />
                  <button type="button" onClick={saveEdit} className="text-[11px] font-semibold px-2 py-1 rounded" style={{ background: "#EAF2FC", color: "#25205B" }}>Save</button>
                  <button type="button" onClick={() => setEditingPhaseIdx(null)} className="text-[11px]" style={{ color: "#69707D" }}>Cancel</button>
                </div>
              ) : (
                <span className="flex-1 text-[13px] font-medium" style={{ color: "#252731" }}>{phase}</span>
              )}
              {editingPhaseIdx !== i && (
                <button type="button" onClick={() => startEdit(i)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded transition-colors hover:bg-[#EAF2FC]"
                  style={{ color: "#6B9FE5", border: "1px solid #D3E3F9" }}>Edit</button>
              )}
              <button type="button" onClick={() => removePhase(i)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-red-50 shrink-0"
                style={{ color: "#fca5a5" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
          {phases.length === 0 && (
            <div className="px-4 py-4 text-[12px] text-center" style={{ color: "#B0B8C4" }}>No phases defined. Add at least one below.</div>
          )}
        </div>
        {/* Add phase */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#FAFAFA", borderTop: "1px solid #E8EAF0" }}>
          <input
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhase(); } }}
            placeholder="Add a phase (e.g. Piling, MEP, Landscaping)…"
            className="flex-1 px-3 py-2 text-[12px] rounded-lg outline-none border"
            style={{ borderColor: "#E8EAF0", background: "white", color: "#252731" }}
          />
          <button type="button" onClick={addPhase} disabled={!newPhaseName.trim()}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-40 transition-all"
            style={{ background: "#25205B", color: "white" }}>
            + Add
          </button>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[#E8EAF0] text-sm font-medium text-[#69707D] hover:bg-[#F7F8FA]">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60" style={{ background: "#25205B" }}>
          {saving ? "Creating Project…" : "Create Project →"}
        </button>
      </div>
    </form>
  );
}

type ChangeLogEntry = { date: string; actor: string; role: string; reason: string; summary: string };

function EditProjectModal({ project, onSave, onClose }: { project: Project & { changeLog?: ChangeLogEntry[] }; onSave: (updated: Project & { changeLog: ChangeLogEntry[] }) => void; onClose: () => void }) {
  const _pStaff = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const [form, setForm] = useState({
    name: project.name,
    location: project.location,
    type: project.type,
    units: String(project.units),
    budget: String(project.budget),
    targetDate: project.targetDate,
    pco: project.pco,
    supervisor: project.supervisor,
    description: project.description,
    status: project.status,
    completion: String(project.completion),
  });
  const [changeReason, setChangeReason] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!changeReason.trim()) return;
    setSaving(true);
    const newCompletion = Math.min(100, Math.max(0, parseInt(form.completion) || project.completion));
    const changes: string[] = [];
    if (form.status !== project.status) changes.push(`Status: ${project.status} → ${form.status}`);
    if (newCompletion !== project.completion) changes.push(`Completion: ${project.completion}% → ${newCompletion}%`);
    if (form.name !== project.name) changes.push(`Name updated`);
    const logEntry: ChangeLogEntry = {
      date: new Date().toISOString().slice(0, 10),
      actor: _pStaff.name ?? "Unknown",
      role: (_pStaff.role ?? "staff").toUpperCase(),
      reason: changeReason,
      summary: changes.length > 0 ? changes.join("; ") : "Minor edits applied",
    };
    setTimeout(() => {
      onSave({
        ...project,
        name: form.name,
        location: form.location,
        type: form.type,
        units: parseInt(form.units) || project.units,
        budget: parseFloat(form.budget.replace(/,/g, "")) || project.budget,
        targetDate: form.targetDate,
        pco: form.pco,
        supervisor: form.supervisor,
        description: form.description,
        status: form.status,
        completion: newCompletion,
        changeLog: [...(project.changeLog ?? []), logEntry],
      });
      setSaving(false);
      onClose();
    }, 700);
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#E8EAF0] flex items-center justify-between z-10 rounded-t-2xl">
          <h3 className="font-semibold text-[#252731]" style={{ fontFamily: "var(--font-display)" }}>Edit Project</h3>
          <button onClick={onClose} className="text-[#69707D] hover:text-[#252731] text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["name", "location"] as const).map((key) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">{key === "name" ? "Project Name" : "Location"}</label>
                <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]">
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]">
                {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Units</label>
              <input type="number" value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Budget (₦)</label>
              <input type="text" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Target Date</label>
              <input type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">PCO</label>
              <input value={form.pco} onChange={(e) => setForm((f) => ({ ...f, pco: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">HOWO</label>
              <input value={form.supervisor} onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Overall Completion (%)</label>
              <input type="number" min="0" max="100" value={form.completion} onChange={(e) => setForm((f) => ({ ...f, completion: e.target.value }))}
                className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#69707D] uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] outline-none focus:border-[#6B9FE5] resize-none" />
          </div>
          {/* Change reason — required for audit trail */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 3v3.5L9 9" stroke="#25205B" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <div className="text-[11px] font-semibold" style={{ color: "#25205B" }}>Change Justification — Required</div>
            </div>
            <textarea
              required
              rows={2}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Describe why this change is being made (e.g. Phase 2 slab completed, contractor delay resolved, budget revised by CEO directive…)"
              className="w-full border border-[#D3E3F9] rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: "white", color: "#252731" }}
            />
            <div className="text-[10px]" style={{ color: "#6B9FE5" }}>This reason will be logged permanently in the project audit trail and is visible to the CEO.</div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E8EAF0] text-sm font-medium text-[#69707D] hover:bg-[#F7F8FA]">Cancel</button>
            <button type="submit" disabled={saving || !changeReason.trim()} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#25205B" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── VIDEO UPLOAD SECTION ─── */
function VideoUploadSection({ videoUrl, setVideoUrl }: { videoUrl: string | null; setVideoUrl: (url: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    e.target.value = "";
  }
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Site Video (optional)</label>
      {videoUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-[#E8EAF0] bg-[#F7F8FA]">
          <video src={videoUrl} controls className="w-full max-h-48 object-contain" />
          <button type="button" onClick={() => setVideoUrl(null)}
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-semibold bg-black/60 text-white hover:bg-black/80">
            Remove
          </button>
        </div>
      ) : (
        <>
          <input ref={ref} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          <button type="button" onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all hover:bg-[#EAF2FC]"
            style={{ border: "1px dashed #6B9FE5", color: "#6B9FE5" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Upload Video
          </button>
          <span className="ml-2 text-[10px]" style={{ color: "#9DA8C0" }}>MP4, MOV, WebM — max 500MB</span>
        </>
      )}
    </div>
  );
}

function ProgressReportForm({ projectId, projectName, onSubmit, onCancel }: {
  projectId: string; projectName: string;
  onSubmit: (r: ProgressReport) => void; onCancel: () => void;
}) {
  const _staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const _staffName: string = _staffInfo.name ?? "Abiodun Fashola";
  const _staffRole: string = _staffInfo.role?.toUpperCase() ?? "PCO";
  const project = PROJECTS.find((p) => p.id === projectId);
  const phases = project?.phases.map((p) => p.name) ?? [];
  const [phase, setPhase] = useState(phases[0] ?? "");
  const [percentBefore, setPercentBefore] = useState(project?.completion ?? 0);
  const [percentAfter, setPercentAfter] = useState(project?.completion ?? 0);
  const [summary, setSummary] = useState("");
  const [challenges, setChallenges] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    const report: ProgressReport = {
      id: `PR-${Date.now().toString().slice(-4)}`,
      project: projectName, projectId, submittedBy: _staffName, role: _staffRole,
      date: new Date().toISOString().slice(0, 10),
      phase, percentBefore, percentAfter, summary, challenges,
      images: imageUrls.filter((u) => u.trim()),
      reviewedBy: null, reviewStatus: "Pending",
    };
    setSubmitted(true);
    setTimeout(() => onSubmit(report), 1800);
  };

  if (submitted) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dcfce7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Report submitted</div>
        <div className="text-[12px]" style={{ color: "#69707D" }}>Your progress report is pending CEO review.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-[16px]" style={{ color: "#252731" }}>Submit Progress Report</div>
          <div className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{projectName}</div>
        </div>
        <button type="button" onClick={onCancel} className="text-[12px] font-medium" style={{ color: "#69707D" }}>Cancel</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Phase</label>
          <select value={phase} onChange={(e) => setPhase(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            {phases.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Progress before (%)</label>
            <input type="number" min={0} max={100} value={percentBefore} onChange={(e) => setPercentBefore(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Progress after (%)</label>
            <input type="number" min={percentBefore} max={100} value={percentAfter} onChange={(e) => setPercentAfter(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>
      </div>

      {percentAfter > percentBefore && (
        <div className="rounded-xl p-3 text-[12px] font-semibold flex items-center gap-2" style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Progress increase: +{percentAfter - percentBefore}%
        </div>
      )}

      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Summary of work done <span style={{ color: "#dc2626" }}>*</span></label>
        <textarea required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Describe what was accomplished during this period..." className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Challenges or issues (optional)</label>
        <textarea rows={2} value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="Any delays, shortages or problems encountered..." className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Site Photos (optional — multiple)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {imageUrls.filter((u) => u).map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8EAF0] bg-[#F7F8FA]">
              <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] flex items-center justify-center">&times;</button>
            </div>
          ))}
        </div>
        <FileUploadButton multiple label="Upload Site Photos" accept="image/*" onFiles={(urls) => setImageUrls((prev) => [...prev.filter((u) => u), ...urls])} />
      </div>

      <VideoUploadSection videoUrl={videoUrl} setVideoUrl={setVideoUrl} />

      <button type="submit" className="w-full py-3.5 font-semibold text-[14px] rounded-xl text-white" style={{ background: "#25205B" }}>Submit Report →</button>
    </form>
  );
}

function DeploymentForm({ onSubmit, onCancel }: { onSubmit: (d: DeploymentRecord) => void; onCancel: () => void }) {
  const _staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const _ceoName: string = _staffInfo.role === "ceo" ? (_staffInfo.name ?? "Emeka Okonkwo") : "Emeka Okonkwo";
  const [empId, setEmpId] = useState("");
  const [fromProject, setFromProject] = useState("");
  const [toProject, setToProject] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = EMPLOYEES.find((e) => e.id === empId);
    if (!emp) return;
    const fromP = PROJECTS.find((p) => p.name === fromProject);
    const toP = PROJECTS.find((p) => p.name === toProject);
    const record: DeploymentRecord = {
      id: `DEP-${Date.now().toString().slice(-3)}`,
      employee: emp.name, empId, fromProject, fromLocation: fromP?.location ?? emp.location,
      toProject, toLocation: toP?.location ?? toLocation, effectiveDate, reason,
      authorizedBy: _ceoName, status: "Active",
    };
    setSubmitted(true);
    setTimeout(() => onSubmit(record), 1800);
  };

  if (submitted) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#EAF2FC" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25205B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Deployment recorded</div>
        <div className="text-[12px]" style={{ color: "#69707D" }}>The deployment has been logged and is now auditable.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>New Staff Deployment</div>
        <button type="button" onClick={onCancel} className="text-[12px] font-medium" style={{ color: "#69707D" }}>Cancel</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Staff Member <span style={{ color: "#dc2626" }}>*</span></label>
          <select required value={empId} onChange={(e) => setEmpId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: empId ? "#252731" : "#9CA3AF" }}>
            <option value="">Select staff member</option>
            {EMPLOYEES.filter((e) => e.status === "Active").map((e) => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Effective Date <span style={{ color: "#dc2626" }}>*</span></label>
          <input required type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>From Project</label>
          <select value={fromProject} onChange={(e) => setFromProject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: fromProject ? "#252731" : "#9CA3AF" }}>
            <option value="">— current project</option>
            {PROJECTS.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>To Project <span style={{ color: "#dc2626" }}>*</span></label>
          <select required value={toProject} onChange={(e) => setToProject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: toProject ? "#252731" : "#9CA3AF" }}>
            <option value="">Select destination project</option>
            {PROJECTS.map((p) => <option key={p.id} value={p.name}>{p.name} — {p.location}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Reason for deployment <span style={{ color: "#dc2626" }}>*</span></label>
        <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="State the reason for this deployment..." className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
      </div>

      <div className="p-3.5 rounded-xl text-[11px]" style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}>
        This deployment will be authorized under <strong>{_ceoName} (CEO)</strong> and logged permanently in the audit trail.
      </div>

      <button type="submit" className="w-full py-3.5 font-semibold text-[14px] rounded-xl text-white" style={{ background: "#25205B" }}>Record Deployment →</button>
    </form>
  );
}

/* ─── DAILY REPORTS — interface, seed data, components ─── */

interface DailyReport {
  id: string;
  date: string;
  project: string;
  submittedBy: string;
  submitterRole: string;
  weather: "Sunny" | "Cloudy" | "Rainy" | "Windy" | "Stormy";
  workersOnSite: number;
  supervisorsOnSite: number;
  activities: string[];
  issues: string[];
  materialsUsed: string[];
  progress: string;
  safetyIncidents: number;
  photos: { name: string; url: string }[];
  status: "Submitted" | "Reviewed";
}

const WEATHER_EMOJI: Record<DailyReport["weather"], string> = {
  Sunny: "☀️",
  Cloudy: "☁️",
  Rainy: "🌧️",
  Windy: "💨",
  Stormy: "⛈️",
};

const DR_STORE: DailyReport[] = [
  {
    id: "DR-001",
    date: "2026-08-18",
    project: "NAGA Palm Court",
    submittedBy: "Emeka Obi",
    submitterRole: "pco",
    weather: "Sunny",
    workersOnSite: 42,
    supervisorsOnSite: 3,
    activities: [
      "Superstructure slab casting — Block C Level 3",
      "Formwork erection — Block D Level 2",
      "Reinforcement bar placement",
    ],
    issues: [],
    materialsUsed: [
      "Concrete (Ready-Mix) — 18 cubic metres",
      "Steel reinforcement bars — 2.4 tonnes",
    ],
    progress: "Block C Level 3 slab casting completed ahead of schedule. Block D formwork 70% done.",
    safetyIncidents: 0,
    photos: [],
    status: "Reviewed",
  },
  {
    id: "DR-002",
    date: "2026-08-19",
    project: "NAGA Palm Court",
    submittedBy: "Fatima Al-Amin",
    submitterRole: "howo",
    weather: "Cloudy",
    workersOnSite: 38,
    supervisorsOnSite: 2,
    activities: [
      "Foundation excavation — East wing extension",
      "Concrete blinding — East wing",
    ],
    issues: ["Excavator breakdown delayed east wing by 3 hours — awaiting technician"],
    materialsUsed: [
      "Concrete (Blinding) — 6 cubic metres",
      "Shuttering boards — 40 pieces",
    ],
    progress: "East wing excavation 60% complete. Blinding poured in completed sections.",
    safetyIncidents: 0,
    photos: [],
    status: "Submitted",
  },
  {
    id: "DR-003",
    date: "2026-08-20",
    project: "Emerald Gardens",
    submittedBy: "Tunde Martins",
    submitterRole: "pco",
    weather: "Rainy",
    workersOnSite: 22,
    supervisorsOnSite: 2,
    activities: [
      "Electrical conduit installation — Floors 1–3",
      "Plastering — Ground floor apartments",
    ],
    issues: ["Rain stopped outdoor activities from 14:00 — workers moved to interior finishing"],
    materialsUsed: [
      "PVC conduit pipes — 120 lengths",
      "Cement plaster — 30 bags",
    ],
    progress: "Electrical rough-in 50% complete. Ground floor plastering progressing well despite rain.",
    safetyIncidents: 0,
    photos: [],
    status: "Reviewed",
  },
  {
    id: "DR-004",
    date: "2026-08-22",
    project: "Granite Heights",
    submittedBy: "Emeka Obi",
    submitterRole: "pco",
    weather: "Sunny",
    workersOnSite: 55,
    supervisorsOnSite: 4,
    activities: [
      "Column casting — Tower A floors 5–6",
      "Block work — Tower B floors 3–4",
      "Staircase construction — Tower A",
    ],
    issues: [],
    materialsUsed: [
      "Ready-mix concrete — 24 cubic metres",
      "Sandcrete blocks — 1,800 units",
      "Steel bars — 3.1 tonnes",
    ],
    progress: "Tower A column casting on floors 5–6 completed. Block work on Tower B progressing at expected pace.",
    safetyIncidents: 0,
    photos: [],
    status: "Reviewed",
  },
  {
    id: "DR-005",
    date: "2026-08-25",
    project: "Emerald Gardens",
    submittedBy: "Fatima Al-Amin",
    submitterRole: "howo",
    weather: "Windy",
    workersOnSite: 30,
    supervisorsOnSite: 2,
    activities: [
      "Tiling — Bathrooms Block A",
      "Ceiling board installation — Block A Floors 1–2",
      "Painting — Exterior facade primer coat",
    ],
    issues: ["High winds prevented crane operation — crane works postponed to tomorrow"],
    materialsUsed: [
      "Ceramic tiles — 400 sq metres",
      "Ceiling boards — 200 sheets",
      "Primer paint — 60 litres",
    ],
    progress: "Finishing works on Block A progressing well. Crane delay will not impact critical path.",
    safetyIncidents: 1,
    photos: [],
    status: "Submitted",
  },
  {
    id: "DR-006",
    date: "2026-08-27",
    project: "Granite Heights",
    submittedBy: "Tunde Martins",
    submitterRole: "pco",
    weather: "Cloudy",
    workersOnSite: 48,
    supervisorsOnSite: 3,
    activities: [
      "Roofing works — Tower A penthouse level",
      "Waterproofing membrane installation — Tower A roof",
      "Window frame installation — Tower B floors 1–4",
    ],
    issues: ["Waterproofing materials delivery 2 days delayed — partial works done with existing stock"],
    materialsUsed: [
      "Roofing sheets — 80 units",
      "Waterproofing membrane — 300 sq metres",
      "Aluminium window frames — 32 units",
    ],
    progress: "Tower A roofing 70% complete pending material delivery. Tower B window installation ahead of schedule.",
    safetyIncidents: 0,
    photos: [],
    status: "Reviewed",
  },
  {
    id: "DR-007",
    date: "2026-08-29",
    project: "NAGA Palm Court",
    submittedBy: "Emeka Obi",
    submitterRole: "pco",
    weather: "Sunny",
    workersOnSite: 44,
    supervisorsOnSite: 3,
    activities: [
      "Internal partition walls — Floors 4–5 all blocks",
      "Plumbing rough-in — Block A Floors 3–4",
      "Electrical first fix — Block B Floors 1–3",
    ],
    issues: [],
    materialsUsed: [
      "Sandcrete blocks — 2,200 units",
      "PVC pipes — 90 lengths",
      "Wire cables — 500 metres",
    ],
    progress: "MEP first-fix works advancing simultaneously across blocks. Partition walls on track with programme.",
    safetyIncidents: 0,
    photos: [],
    status: "Submitted",
  },
  {
    id: "DR-008",
    date: "2026-08-31",
    project: "Emerald Gardens",
    submittedBy: "Tunde Martins",
    submitterRole: "pco",
    weather: "Stormy",
    workersOnSite: 12,
    supervisorsOnSite: 2,
    activities: [
      "Indoor finishing works — Kitchens Block B",
      "Door installation — Block A Ground floor",
    ],
    issues: [
      "Storm conditions from 08:00 — only essential indoor works carried out",
      "Scaffolding on east face requires inspection before resumption",
    ],
    materialsUsed: [
      "Kitchen cabinet units — 8 sets",
      "Interior doors — 12 units",
    ],
    progress: "Reduced productivity due to storm. Indoor works continued where safe. Full team expected tomorrow.",
    safetyIncidents: 0,
    photos: [],
    status: "Submitted",
  },
];

function DailyReportForm({ staffName, staffRole, onSubmit, onCancel }: {
  staffName: string;
  staffRole: string;
  onSubmit: (data: Omit<DailyReport, "id" | "status">) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [project, setProject] = useState("");
  const [weather, setWeather] = useState<DailyReport["weather"]>("Sunny");
  const [workersOnSite, setWorkersOnSite] = useState(0);
  const [supervisorsOnSite, setSupervisorsOnSite] = useState(1);
  const [activities, setActivities] = useState<string[]>([""]);
  const [issues, setIssues] = useState<string[]>([]);
  const [materialsUsed, setMaterialsUsed] = useState<string[]>([]);
  const [progress, setProgress] = useState("");
  const [safetyIncidents, setSafetyIncidents] = useState(0);
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project || activities.filter((a) => a.trim()).length === 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({
        date, project,
        submittedBy: staffName,
        submitterRole: staffRole,
        weather,
        workersOnSite,
        supervisorsOnSite,
        activities: activities.filter((a) => a.trim()),
        issues: issues.filter((i) => i.trim()),
        materialsUsed: materialsUsed.filter((m) => m.trim()),
        progress: progress.trim(),
        safetyIncidents,
        photos,
      });
    }, 900);
  }

  if (submitted) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#EAF2FC" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25205B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Daily report submitted</div>
        <div className="text-[12px]" style={{ color: "#69707D" }}>Your report has been recorded and is available for review.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[16px]" style={{ color: "#252731" }}>Submit Daily Report</div>
        <button type="button" onClick={onCancel} className="text-[12px] font-medium" style={{ color: "#69707D" }}>Cancel</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Date <span style={{ color: "#dc2626" }}>*</span></label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Project <span style={{ color: "#dc2626" }}>*</span></label>
          <select required value={project} onChange={(e) => setProject(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: project ? "#252731" : "#9CA3AF" }}>
            <option value="">Select project</option>
            {PROJECTS.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Weather Condition</label>
          <select value={weather} onChange={(e) => setWeather(e.target.value as DailyReport["weather"])}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            {(["Sunny", "Cloudy", "Rainy", "Windy", "Stormy"] as const).map((w) => (
              <option key={w} value={w}>{WEATHER_EMOJI[w]} {w}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Workers on Site</label>
            <input type="number" min={0} value={workersOnSite} onChange={(e) => setWorkersOnSite(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Supervisors</label>
            <input type="number" min={0} value={supervisorsOnSite} onChange={(e) => setSupervisorsOnSite(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>
          Work Activities <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <div className="space-y-2">
          {activities.map((act, i) => (
            <div key={i} className="flex gap-2">
              <input value={act}
                onChange={(e) => setActivities((prev) => prev.map((a, j) => j === i ? e.target.value : a))}
                placeholder={`Activity ${i + 1}`}
                className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
              {activities.length > 1 && (
                <button type="button" onClick={() => setActivities((prev) => prev.filter((_, j) => j !== i))}
                  className="px-2.5 py-1.5 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 text-sm transition-colors">&times;</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setActivities((prev) => [...prev, ""])}
          className="mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-[#EAF2FC]"
          style={{ border: "1px dashed #6B9FE5", color: "#6B9FE5" }}>
          + Add Activity
        </button>
      </div>

      {/* Issues */}
      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>
          Issues / Blockers <span className="font-normal normal-case" style={{ color: "#B0B8C4" }}>(optional)</span>
        </label>
        <div className="space-y-2">
          {issues.map((iss, i) => (
            <div key={i} className="flex gap-2">
              <input value={iss}
                onChange={(e) => setIssues((prev) => prev.map((a, j) => j === i ? e.target.value : a))}
                placeholder={`Issue ${i + 1}`}
                className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ border: "1px solid #FED7AA", background: "#FFF7ED", color: "#92400e" }} />
              <button type="button" onClick={() => setIssues((prev) => prev.filter((_, j) => j !== i))}
                className="px-2.5 py-1.5 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 text-sm transition-colors">&times;</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setIssues((prev) => [...prev, ""])}
          className="mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-amber-50"
          style={{ border: "1px dashed #d97706", color: "#d97706" }}>
          + Add Issue
        </button>
      </div>

      {/* Materials */}
      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>
          Materials Used <span className="font-normal normal-case" style={{ color: "#B0B8C4" }}>(optional)</span>
        </label>
        <div className="space-y-2">
          {materialsUsed.map((mat, i) => (
            <div key={i} className="flex gap-2">
              <input value={mat}
                onChange={(e) => setMaterialsUsed((prev) => prev.map((a, j) => j === i ? e.target.value : a))}
                placeholder="e.g. Ready-mix concrete — 12 cubic metres"
                className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
              <button type="button" onClick={() => setMaterialsUsed((prev) => prev.filter((_, j) => j !== i))}
                className="px-2.5 py-1.5 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 text-sm transition-colors">&times;</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setMaterialsUsed((prev) => [...prev, ""])}
          className="mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-[#EAF2FC]"
          style={{ border: "1px dashed #6B9FE5", color: "#6B9FE5" }}>
          + Add Material
        </button>
      </div>

      {/* Progress note */}
      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Overall Progress Note</label>
        <textarea value={progress} onChange={(e) => setProgress(e.target.value)} rows={3}
          placeholder="Describe overall progress today..."
          className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5] resize-none" style={{ color: "#252731" }} />
      </div>

      {/* Safety & Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Safety Incidents</label>
          <input type="number" min={0} value={safetyIncidents} onChange={(e) => setSafetyIncidents(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          {safetyIncidents > 0 && (
            <div className="mt-1.5 text-[11px] rounded-lg px-3 py-1.5" style={{ background: "#FEF2F2", color: "#991b1b", border: "1px solid #FECACA" }}>
              Incidents must be reported to the Safety Officer immediately.
            </div>
          )}
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>
            Site Photos <span className="font-normal normal-case" style={{ color: "#B0B8C4" }}>(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8EAF0] bg-[#F7F8FA]">
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] flex items-center justify-center">&times;</button>
              </div>
            ))}
          </div>
          <FileUploadButton multiple label="Upload Photos"
            onFiles={(urls, names) => setPhotos((prev) => [...prev, ...urls.map((url, i) => ({ url, name: names[i] }))])} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[#E8EAF0] text-sm" style={{ color: "#69707D" }}>Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#25205B" }}>
          Submit Report →
        </button>
      </div>
    </form>
  );
}

// ─── Site Reports Review Tab ──────────────────────────────────────────────────

type SiteReportsProps = {
  staffRole: string;
  staffName: string;
  staffLocation: string | undefined;
  isStateScopedRole: boolean;
  localProgress: EnhancedProgressReport[];
  onApprove: (id: string) => void;
  onReturn: (id: string, reason?: string) => void;
  onAddComment: (reportId: string, text: string, rating?: number) => void;
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          disabled={!onChange}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5l2.09 4.24 4.67.68-3.38 3.3.8 4.66L9 11.77l-4.18 2.21.8-4.66L2.24 6.42l4.67-.68z"
              fill={(hover || value) >= s ? "#D4A843" : "none"}
              stroke={(hover || value) >= s ? "#D4A843" : "#B0B8C4"}
              strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function SiteReportCard({
  report,
  staffRole,
  staffName,
  onApprove,
  onReturn,
  onAddComment,
}: {
  report: EnhancedProgressReport;
  staffRole: string;
  staffName: string;
  onApprove: (id: string) => void;
  onReturn: (id: string, reason?: string) => void;
  onAddComment: (reportId: string, text: string, rating?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingRating, setPendingRating] = useState(0);
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const canAct = ["ceo", "admin"].includes(staffRole);
  const isPending = report.reviewStatus === "Pending";

  const statusColor: Record<string, string> = {
    Approved: "#16a34a",
    Returned: "#dc2626",
    Pending: "#D4A843",
  };

  function submitComment() {
    if (!comment.trim()) return;
    onAddComment(report.id, comment.trim(), pendingRating || undefined);
    setComment("");
    setPendingRating(0);
  }

  function submitReturn() {
    if (!returnReason.trim()) return;
    onReturn(report.id, returnReason.trim());
    setShowReturn(false);
    setReturnReason("");
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header row */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-[11px]"
            style={{ background: "rgba(107,159,229,0.12)", color: "#25205B" }}>
            {report.submittedBy.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{report.id}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${statusColor[report.reviewStatus] ?? "#D4A843"}18`, color: statusColor[report.reviewStatus] ?? "#D4A843" }}>
                {report.reviewStatus}
              </span>
              {report.rating !== undefined && (
                <span className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} width="12" height="12" viewBox="0 0 18 18" fill="none">
                      <path d="M9 1.5l2.09 4.24 4.67.68-3.38 3.3.8 4.66L9 11.77l-4.18 2.21.8-4.66L2.24 6.42l4.67-.68z"
                        fill={s <= report.rating! ? "#D4A843" : "none"} stroke={s <= report.rating! ? "#D4A843" : "#B0B8C4"} strokeWidth="1.3" />
                    </svg>
                  ))}
                </span>
              )}
            </div>
            <div className="font-semibold text-[14px] truncate" style={{ color: "#252731" }}>{report.project}</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>
              {report.phase} · {report.submittedBy} · {report.date}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>
            {report.percentBefore}% → {report.percentAfter}%
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path d="M4 6l4 4 4-4" stroke="#B0B8C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F0F2F5" }}>
          {/* Report body */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-[13px]" style={{ color: "#252731" }}>{report.summary}</p>
            {report.challenges && <p className="text-[12px] italic" style={{ color: "#69707D" }}>Challenges: {report.challenges}</p>}

            {/* Photos */}
            {report.images && report.images.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Site Photos ({report.images.length})</div>
                <div className="flex gap-2 flex-wrap">
                  {report.images.map((ph: string, i: number) => (
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#E8EAF0] flex items-center justify-center" style={{ background: "#F7F8FA" }}>
                      <img src={ph} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {report.videoUrl && (
              <div>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Site Video</div>
                <video src={report.videoUrl} controls className="rounded-xl max-h-48 w-full" style={{ background: "#000" }} />
              </div>
            )}

            {/* Review note (if returned) */}
            {report.reviewNote && (
              <div className="px-3 py-2.5 rounded-xl text-[12px]" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#dc2626" }}>
                <span className="font-semibold">Returned note:</span> {report.reviewNote}
              </div>
            )}

            {/* Reviewed by */}
            {report.reviewedBy && (
              <div className="text-[11px]" style={{ color: "#B0B8C4" }}>Reviewed by {report.reviewedBy}</div>
            )}
          </div>

          {/* Comments thread */}
          {((report.comments ?? []).length > 0 || true) && (
            <div style={{ borderTop: "1px solid #F0F2F5" }}>
              <div className="px-5 pt-3 pb-2">
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>
                  Comments {(report.comments ?? []).length > 0 ? `(${report.comments!.length})` : ""}
                </div>
                {(report.comments ?? []).length === 0 && (
                  <p className="text-[12px]" style={{ color: "#B0B8C4" }}>No comments yet. Be the first to comment.</p>
                )}
                <div className="space-y-3">
                  {(report.comments ?? []).map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px]"
                        style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                        {c.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-semibold" style={{ color: "#252731" }}>{c.author}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(107,159,229,0.1)", color: "#25205B" }}>{c.role}</span>
                          <span className="text-[10px]" style={{ color: "#B0B8C4" }}>{c.date}</span>
                        </div>
                        <p className="text-[12px]" style={{ color: "#252731" }}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: "#69707D" }}>Your rating:</span>
                    <StarRating value={pendingRating} onChange={setPendingRating} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                      placeholder="Add a comment…"
                      className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none transition-colors"
                      style={{ background: "#F7F8FA", border: "1px solid #E8EAF0", color: "#252731" }}
                    />
                    <button
                      onClick={submitComment}
                      disabled={!comment.trim()}
                      className="text-[12px] font-semibold px-4 py-2 rounded-xl transition-opacity disabled:opacity-40"
                      style={{ background: "#25205B", color: "#fff" }}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {canAct && isPending && (
            <div style={{ borderTop: "1px solid #F0F2F5" }} className="px-5 py-3 space-y-2">
              {showReturn ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Reason for returning…"
                    className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#252731" }}
                  />
                  <button onClick={submitReturn} disabled={!returnReason.trim()} className="text-[12px] font-semibold px-3 py-2 rounded-xl transition-opacity disabled:opacity-40" style={{ background: "#dc2626", color: "#fff" }}>
                    Confirm
                  </button>
                  <button onClick={() => setShowReturn(false)} className="text-[12px] px-3 py-2 rounded-xl" style={{ background: "#F7F8FA", color: "#252731", border: "1px solid #E8EAF0" }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => onApprove(report.id)} className="text-[12px] font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90" style={{ background: "#16a34a", color: "#fff" }}>
                    Approve Report
                  </button>
                  <button onClick={() => setShowReturn(true)} className="text-[12px] font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90" style={{ background: "#dc2626", color: "#fff" }}>
                    Return for Review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SiteReportsGlobalTab({ staffRole, staffName, staffLocation, isStateScopedRole, localProgress, onApprove, onReturn, onAddComment }: SiteReportsProps) {
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Returned">("all");
  const [search, setSearch] = useState("");

  const visible = localProgress
    .filter((r) => filter === "all" || r.reviewStatus === filter)
    .filter((r) => !search || r.project.toLowerCase().includes(search.toLowerCase()) || r.submittedBy.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: localProgress.length,
    Pending: localProgress.filter((r) => r.reviewStatus === "Pending").length,
    Approved: localProgress.filter((r) => r.reviewStatus === "Approved").length,
    Returned: localProgress.filter((r) => r.reviewStatus === "Returned").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-[15px]" style={{ color: "#252731" }}>Site Progress Reports</h3>
          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>
            {isStateScopedRole && staffLocation ? `Showing reports for ${staffLocation}` : "All submitted progress reports"}
            {" · "}{visible.length} report{visible.length !== 1 ? "s" : ""}
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project or submitter…"
          className="text-[12px] px-3 py-2 rounded-xl outline-none w-56 transition-colors"
          style={{ background: "#F7F8FA", border: "1px solid #E8EAF0", color: "#252731" }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "Pending", "Approved", "Returned"] as const).map((f) => {
          const dotColor: Record<string, string> = { all: "#6B9FE5", Pending: "#D4A843", Approved: "#16a34a", Returned: "#dc2626" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: filter === f ? dotColor[f] + "18" : "#F7F8FA",
                color: filter === f ? dotColor[f] : "#69707D",
                border: `1px solid ${filter === f ? dotColor[f] + "40" : "#E8EAF0"}`,
              }}
            >
              {f !== "all" && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor[f] }} />}
              {f === "all" ? "All Reports" : f} <span className="font-bold">{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* Report cards */}
      {visible.length === 0 ? (
        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
          <p className="text-[13px]" style={{ color: "#B0B8C4" }}>No reports match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <SiteReportCard
              key={r.id}
              report={r}
              staffRole={staffRole}
              staffName={staffName}
              onApprove={onApprove}
              onReturn={onReturn}
              onAddComment={onAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DailyReportsGlobalTab({ staffRole, staffName }: { staffRole: string; staffName: string }) {
  const [reports, setReports] = useState<DailyReport[]>([...DR_STORE]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canSubmit = ["pco", "howo", "admin", "ceo"].includes(staffRole);
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const thisMonthReports = reports.filter((r) => r.date.startsWith(thisMonth));
  const projectsCovered = new Set(reports.map((r) => r.project)).size;
  const todayReport = reports.find((r) => r.date === today);
  const workersToday = todayReport?.workersOnSite ?? 0;
  const openIssues = reports.reduce((acc, r) => acc + r.issues.length, 0);

  function handleSubmit(data: Omit<DailyReport, "id" | "status">) {
    const newReport: DailyReport = {
      ...data,
      id: `DR-${String(DR_STORE.length + 1).padStart(3, "0")}`,
      status: "Submitted",
    };
    DR_STORE.unshift(newReport);
    setReports([...DR_STORE]);
    setShowForm(false);
  }

  if (showForm) {
    return (
      <DailyReportForm
        staffName={staffName}
        staffRole={staffRole}
        onSubmit={handleSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-[13px]" style={{ color: "#69707D" }}>
          {reports.length} report{reports.length !== 1 ? "s" : ""} on file
        </div>
        {canSubmit && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm px-4 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ background: "#25205B" }}
          >
            + Submit New Report
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Reports This Month", value: thisMonthReports.length },
          { label: "Projects Covered", value: projectsCovered },
          { label: "Workers on Site Today", value: workersToday },
          { label: "Open Issues", value: openIssues },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>{s.label}</div>
            <div className="text-[22px] font-bold" style={{ color: "#25205B" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Report list */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8EAF0]">
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>All Daily Reports</div>
        </div>
        {reports.length === 0 ? (
          <div className="p-10 text-center text-[13px]" style={{ color: "#69707D" }}>No daily reports yet. Submit the first one above.</div>
        ) : (
          <div className="divide-y divide-[#F0F2F5]">
            {reports.map((r) => (
              <div key={r.id}>
                {/* Row — click to expand */}
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="w-full text-left px-5 py-4 hover:bg-[#F7F8FA] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="text-xl leading-none select-none">{WEATHER_EMOJI[r.weather]}</div>
                      <div>
                        <div className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{r.id}</div>
                        <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>
                          {r.date} · {r.project}
                        </div>
                        <div className="text-[11px]" style={{ color: "#69707D" }}>
                          {r.submittedBy} ({r.submitterRole.toUpperCase()}) · {r.workersOnSite} workers
                          {r.issues.length > 0 && (
                            <span className="ml-2 font-semibold" style={{ color: "#d97706" }}>
                              {r.issues.length} issue{r.issues.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        className={`transition-transform duration-200 ${expanded === r.id ? "rotate-180" : ""}`}>
                        <path d="M3 5l4 4 4-4" stroke="#69707D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === r.id && (
                  <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid #F0F2F5", background: "#F7F8FA" }}>
                    {/* Stat strip */}
                    <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2.5">
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>Weather</div>
                        <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{WEATHER_EMOJI[r.weather]} {r.weather}</div>
                      </div>
                      <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2.5">
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>Workers</div>
                        <div className="font-bold text-[20px]" style={{ color: "#25205B" }}>{r.workersOnSite}</div>
                      </div>
                      <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2.5">
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>Supervisors</div>
                        <div className="font-bold text-[20px]" style={{ color: "#25205B" }}>{r.supervisorsOnSite}</div>
                      </div>
                      <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2.5">
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>Safety Incidents</div>
                        <div className={`font-bold text-[15px] ${r.safetyIncidents === 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {r.safetyIncidents === 0 ? "✓ No incidents" : `${r.safetyIncidents} incident${r.safetyIncidents !== 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>

                    {/* Activities */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Work Activities</div>
                      <div className="space-y-1.5">
                        {r.activities.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#252731" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6B9FE5] mt-1.5 shrink-0" />
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues */}
                    {r.issues.length > 0 && (
                      <div className="rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#92400e" }}>Issues / Blockers</div>
                        <div className="space-y-1.5">
                          {r.issues.map((iss, i) => (
                            <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#92400e" }}>
                              <span className="shrink-0 mt-0.5">⚠</span>{iss}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Materials */}
                    {r.materialsUsed.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Materials Used</div>
                        <div className="space-y-1.5">
                          {r.materialsUsed.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#252731" }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#D4A843" }} />
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress note */}
                    {r.progress && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Overall Progress Note</div>
                        <p className="text-[12px] leading-relaxed" style={{ color: "#252731" }}>{r.progress}</p>
                      </div>
                    )}

                    {/* Photo gallery */}
                    {r.photos.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Photos ({r.photos.length})</div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {r.photos.map((photo, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-[#E8EAF0] bg-[#F7F8FA]">
                              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Construction() {
  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const staffName: string = staffInfo.name ?? "Emeka Okonkwo";
  const staffRole: string = staffInfo.role ?? "ceo";
  const staffLocation: string | undefined = staffInfo.location;
  const isCEO = staffRole === "ceo";
  // State-scoped roles: filter to their assigned state only
  const isStateScopedRole = ["howo", "pco", "ivm", "prm"].includes(staffRole);

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "materials" | "reports" | "progress" | "inventory" | "deployments" | "dailyreports" | "sitereports">("overview");
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [localProgress, setLocalProgress] = useState<ProgressReport[]>(() => {
    if (isStateScopedRole && staffLocation) {
      const stateProjectNames = PROJECTS.filter((p) => p.location === staffLocation).map((p) => p.name);
      return LIVE_PROGRESS_REPORTS.filter((r) => stateProjectNames.includes(r.project));
    }
    return [...LIVE_PROGRESS_REPORTS];
  });
  const [localDeployments, setLocalDeployments] = useState<DeploymentRecord[]>(DEPLOYMENT_RECORDS);
  const [localProjects, setLocalProjects] = useState<Project[]>(() =>
    isStateScopedRole && staffLocation
      ? PROJECTS.filter((p) => p.location === staffLocation)
      : PROJECTS
  );

  const handleApproveReport = (id: string) => {
    const r = localProgress.find((p) => p.id === id);
    setLocalProgress((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, reviewedBy: staffName, reviewStatus: "Approved" } : p);
      LIVE_PROGRESS_REPORTS.length = 0; LIVE_PROGRESS_REPORTS.push(...updated); persistStore();
      return updated;
    });
    logActivity({ timestamp: new Date().toISOString().slice(0, 16).replace("T", " "), actor: staffName, role: staffRole.toUpperCase(), action: "Progress Report Approved", module: "Construction", detail: `Approved ${id} for ${r?.project ?? "project"} — ${r?.phase ?? ""}. ${r?.percentBefore ?? 0}% → ${r?.percentAfter ?? 0}%.`, ref: id, severity: "info" });
  };

  const handleReturnReport = (id: string, reason?: string) => {
    const note = reason ?? window.prompt("Reason for returning this report (required):");
    if (!note) return;
    const r = localProgress.find((p) => p.id === id);
    setLocalProgress((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, reviewedBy: staffName, reviewStatus: "Returned", reviewNote: note } : p);
      LIVE_PROGRESS_REPORTS.length = 0; LIVE_PROGRESS_REPORTS.push(...updated); persistStore();
      return updated;
    });
    logActivity({ timestamp: new Date().toISOString().slice(0, 16).replace("T", " "), actor: staffName, role: staffRole.toUpperCase(), action: "Progress Report Returned", module: "Construction", detail: `Returned ${id} for ${r?.project ?? "project"} — ${note}`, ref: id, severity: "warning" });
  };

  const handleAddReportComment = (reportId: string, text: string, rating?: number) => {
    setLocalProgress((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== reportId) return p;
        const comment: ReportComment = { id: Date.now().toString(), author: staffName, role: staffRole.toUpperCase(), text, date: new Date().toISOString().slice(0, 10) };
        return { ...p, comments: [...(p.comments ?? []), comment], ...(rating !== undefined ? { rating } : {}) };
      });
      LIVE_PROGRESS_REPORTS.length = 0; LIVE_PROGRESS_REPORTS.push(...updated); persistStore();
      return updated;
    });
  };
  const [localMRs, setLocalMRs] = useState<MRWithDelivery[]>(MATERIAL_REQUESTS as MRWithDelivery[]);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deliveryModal, setDeliveryModal] = useState<MRWithDelivery | null>(null);

  const project = selectedProject ? localProjects.find((p) => p.id === selectedProject) : null;
  const projectMRs = selectedProject ? localMRs.filter((mr) => mr.projectId === selectedProject) : [];
  const projectReports = selectedProject ? DAILY_REPORTS.filter((r) => r.project === project?.name) : [];

  if (project) {
    return (
      <>
      <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setSelectedProject(null)} className="text-[#6B9FE5] hover:underline font-medium">
            Construction & Projects
          </button>
          <span className="text-[#69707D]">/</span>
          <span className="text-[#252731] font-medium">{project.name}</span>
        </div>

        {/* Project Header */}
        <div className="bg-[#25205B] rounded-xl p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{project.name}</h2>
              <p className="text-[#6B9FE5] text-sm mt-1">{project.location} · {project.type} · {project.units} Units</p>
              <p className="text-[#EAF2FC]/70 text-xs mt-2">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <button onClick={() => setEditingProject(project)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all text-white/80 hover:text-white border border-white/20 hover:border-white/40">
                Edit Project
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Budget", value: fmt(project.budget) },
              { label: "Spent", value: fmt(project.spent) },
              { label: "Remaining", value: fmt(project.budget - project.spent) },
              { label: "Completion", value: `${project.completion}%` },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-lg px-4 py-3">
                <div className="text-[#6B9FE5] text-xs font-medium">{s.label}</div>
                <div className="text-white text-lg font-bold mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#6B9FE5] mb-1">
              <span>Overall Construction Progress</span>
              <span>{project.completion}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#6B9FE5] rounded-full" style={{ width: `${project.completion}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg flex-wrap">
          {([
            { id: "overview", label: "Overview" },
            { id: "materials", label: "Material Requests" },
            { id: "inventory", label: "Inventory" },
            { id: "reports", label: "Daily Reports" },
            { id: "progress", label: "Progress Reports" },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setShowProgressForm(false); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.id ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phase Progress */}
            <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
              <h3 className="text-[#252731] font-semibold text-sm mb-4">Phase Progress</h3>
              <div className="space-y-3">
                {project.phases.map((phase) => (
                  <div key={phase.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#252731] font-medium">{phase.name}</span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={phase.status} />
                        <span className="text-[#69707D] font-semibold">{phase.completion}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#EAF2FC] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#6B9FE5]" style={{ width: `${phase.completion}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team & Info */}
            <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 space-y-4">
              <h3 className="text-[#252731] font-semibold text-sm">Project Team</h3>
              <div className="space-y-3">
                {[
                  { label: "Project Chartered Officer", value: project.pco },
                  { label: "HOWO", value: project.supervisor },
                  { label: "Start Date", value: project.startDate },
                  { label: "Target Completion", value: project.targetDate },
                  { label: "Project ID", value: project.id },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between items-center py-2 border-b border-[#F0F2F5] last:border-0">
                    <span className="text-[#69707D] text-xs">{f.label}</span>
                    <span className="text-[#252731] text-xs font-semibold">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Change Log */}
            {(() => {
              const cl = (project as Project & { changeLog?: ChangeLogEntry[] }).changeLog ?? [];
              return (
                <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden md:col-span-2">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8EAF0]">
                    <h3 className="text-[#252731] font-semibold text-sm">Project Change Log</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "#EAF2FC", color: "#25205B" }}>{cl.length} {cl.length === 1 ? "entry" : "entries"}</span>
                  </div>
                  {cl.length === 0 ? (
                    <div className="px-5 py-6 text-[12px] text-center" style={{ color: "#9DA8C0" }}>No changes recorded yet. Every edit to this project will appear here.</div>
                  ) : (
                    <div className="divide-y divide-[#F7F8FA]">
                      {[...cl].reverse().map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#6B9FE5]" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] font-semibold" style={{ color: "#252731" }}>{entry.actor}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EAF2FC] text-[#25205B]">{entry.role}</span>
                              <span className="text-[10px]" style={{ color: "#9DA8C0" }}>{entry.date}</span>
                            </div>
                            {entry.summary && <p className="text-[11px] mt-0.5" style={{ color: "#252731" }}>{entry.summary}</p>}
                            <p className="text-[11px] mt-0.5 italic" style={{ color: "#69707D" }}>"{entry.reason}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {tab === "materials" && (
          <div className="space-y-4">
            {projectMRs.length === 0 && (
              <div className="bg-white border border-[#E8EAF0] rounded-xl p-10 text-center text-[#69707D] text-sm">
                No material requests for this project.
              </div>
            )}
            {projectMRs.map((mr) => (
              <div key={mr.id} className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#6B9FE5]">{mr.id}</span>
                    <span className="text-[#69707D] text-xs ml-3">{mr.date} · Requested by {mr.requestedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={mr.status} />
                    {mr.status === "Disbursed" && mr.deliveryStatus !== "Delivered" && mr.deliveryStatus !== "Verified" && mr.deliveryStatus !== "Variance Noted" && mr.deliveryStatus !== "Variance Noted — Resolved" && (
                      <button onClick={() => setDeliveryModal(mr)}
                        className="text-[11px] px-3 py-1 rounded-lg font-semibold transition-all text-white"
                        style={{ background: "#6B9FE5" }}>
                        Record Delivery
                      </button>
                    )}
                    {(mr.deliveryStatus === "Delivered" || mr.deliveryStatus === "Verified" || mr.deliveryStatus === "Variance Noted" || mr.deliveryStatus === "Variance Noted — Resolved") && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                        ✓ {mr.deliveryStatus}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 border-b border-[#F0F2F5]">
                  <div className="text-[#69707D] text-xs font-medium mb-2">Purpose: <span className="text-[#252731]">{mr.purpose}</span></div>
                  <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                  <table className="w-full min-w-[400px] text-xs">
                    <thead>
                      <tr className="text-[#69707D]">
                        <th className="text-left py-1.5 font-medium">Material</th>
                        <th className="text-right py-1.5 font-medium">Qty</th>
                        <th className="text-right py-1.5 font-medium">Unit Price</th>
                        <th className="text-right py-1.5 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                      {mr.items?.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 text-[#252731] font-medium">{item.material}</td>
                          <td className="py-2 text-right text-[#252731]">{item.qty.toLocaleString()} {item.unit}</td>
                          <td className="py-2 text-right text-[#69707D]">{fmt(item.unitPrice)}</td>
                          <td className="py-2 text-right text-[#252731] font-semibold">{fmt(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#E8EAF0]">
                        <td colSpan={3} className="py-2 text-right font-semibold text-[#252731]">Total</td>
                        <td className="py-2 text-right font-bold text-[#25205B]">{fmt(mr.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  </div>
                </div>
                {/* Approval Chain */}
                {mr.approvalChain && (
                  <div className="px-5 py-3 bg-[#F7F8FA]">
                    <div className="text-[#69707D] text-[10px] font-semibold uppercase tracking-wide mb-2">Approval Chain</div>
                    <div className="flex flex-wrap gap-3">
                      {mr.approvalChain.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${step.action === "Pending" ? "bg-amber-400" : step.action === "Approved" || step.action === "Authorized" ? "bg-[#6B9FE5]" : "bg-purple-400"}`} />
                          <span className="text-[#252731] text-xs font-medium">{step.actor}</span>
                          <span className="text-[#69707D] text-[10px]">({step.role})</span>
                          <span className={`text-[10px] font-semibold ${step.action === "Pending" ? "text-amber-600" : "text-[#25205B]"}`}>{step.action}</span>
                          {i < (mr.approvalChain?.length ?? 0) - 1 && <span className="text-[#E8EAF0]">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* IVM Verification details */}
                {mr.ivmVerification && (
                  <div className="px-5 py-3 border-t border-[#F0F2F5]" style={{ background: mr.ivmVerification.status?.includes("Variance") ? "#FFF7ED" : "#f0fdf4" }}>
                    <div className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: mr.ivmVerification.status?.includes("Variance") ? "#92400e" : "#166534" }}>
                      IVM Verification · {mr.ivm}
                    </div>
                    <div className="text-[12px]" style={{ color: "#252731" }}>{mr.ivmVerification.notes as string}</div>
                    {mr.ivmVerification.variance && (
                      <div className="mt-1 text-[11px]" style={{ color: "#92400e" }}>Variance: {mr.ivmVerification.variance as string}</div>
                    )}
                    <div className="text-[10px] mt-1" style={{ color: "#B0B8C4" }}>{mr.ivmVerification.date as string} · {mr.ivmVerification.photos as number} photos</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "inventory" && (
          <InventoryTab projectId={selectedProject ?? undefined} projectName={project?.name} />
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            {projectReports.length === 0 && (
              <div className="bg-white border border-[#E8EAF0] rounded-xl p-10 text-center text-[#69707D] text-sm">No daily reports submitted yet.</div>
            )}
            {projectReports.map((r) => (
              <div key={r.id} className="bg-white border border-[#E8EAF0] rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-[#6B9FE5] text-xs font-semibold">{r.id}</div>
                    <div className="text-[#252731] font-semibold text-sm mt-0.5">{r.date} Daily Site Report</div>
                    <div className="text-[#69707D] text-xs">PCO: {r.pco} · {r.workersOnSite} workers · {r.weatherCondition}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-[#252731] text-sm mb-3">{r.summary}</p>
                <div className="space-y-1">
                  <div className="text-[#69707D] text-xs font-semibold uppercase tracking-wide mb-1">Activities</div>
                  {r.activities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#252731]">
                      <span className="w-1 h-1 rounded-full bg-[#6B9FE5]" />{a}
                    </div>
                  ))}
                </div>
                {r.issues && r.issues !== "None." && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <span className="font-semibold">Issue: </span>{r.issues}
                  </div>
                )}
                <div className="mt-3 text-[#69707D] text-xs">{r.mediaCount} media files attached</div>
              </div>
            ))}
          </div>
        )}

        {tab === "progress" && (
          <div className="space-y-4">
            {!showProgressForm ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-[13px]" style={{ color: "#69707D" }}>
                    {localProgress.filter((r) => r.projectId === selectedProject).length} progress reports on file
                  </div>
                  <button onClick={() => setShowProgressForm(true)} className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>
                    + Submit Progress Report
                  </button>
                </div>
                {localProgress.filter((r) => r.projectId === selectedProject).length === 0 ? (
                  <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
                    <div className="text-3xl mb-3">📊</div>
                    <div className="text-[14px] font-medium mb-1" style={{ color: "#252731" }}>No progress reports yet</div>
                    <div className="text-[12px]" style={{ color: "#69707D" }}>Submit your first report to document this project's progress.</div>
                  </div>
                ) : (
                  localProgress.filter((r) => r.projectId === selectedProject).map((r) => (
                    <div key={r.id} className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid #F0F2F5" }}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{r.id}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.reviewStatus === "Approved" ? "#dcfce7" : "#fef3c7", color: r.reviewStatus === "Approved" ? "#166534" : "#92400e" }}>{r.reviewStatus}</span>
                          </div>
                          <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{r.date} · {r.phase}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Submitted by {r.submittedBy} ({r.role}){r.reviewedBy ? ` · Reviewed by ${r.reviewedBy}` : ""}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[11px] font-medium" style={{ color: "#69707D" }}>Progress</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-[13px]" style={{ color: "#252731" }}>{r.percentBefore}%</span>
                            <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h12M9 1l4 4-4 4" stroke="#6B9FE5" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            <span className="font-bold text-[14px]" style={{ color: "#25205B" }}>{r.percentAfter}%</span>
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EAF2FC", color: "#25205B" }}>+{r.percentAfter - r.percentBefore}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <p className="text-[13px] leading-relaxed" style={{ color: "#252731" }}>{r.summary}</p>
                        {r.challenges && r.challenges !== "None." && (
                          <div className="px-3 py-2.5 rounded-xl text-[12px]" style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" }}>
                            <span className="font-semibold">Challenge: </span>{r.challenges}
                          </div>
                        )}
                        {r.images && r.images.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Site photos</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {r.images.map((img, i) => (
                                <div key={i} className="rounded-xl overflow-hidden aspect-video bg-[#EAF2FC]">
                                  <img src={img} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {isCEO && r.reviewStatus === "Pending" && (
                        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderTop: "1px solid #F0F2F5", background: "#EAF2FC" }}>
                          <div>
                            <div className="text-[11px] font-semibold" style={{ color: "#25205B" }}>Awaiting CEO review</div>
                            <div className="text-[10px] mt-0.5" style={{ color: "#6B9FE5" }}>Submitted by {r.submittedBy}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveReport(r.id)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors"
                              style={{ background: "#25205B" }}
                            >Approve Report</button>
                            <button
                              onClick={() => handleReturnReport(r.id)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:bg-amber-100"
                              style={{ background: "white", color: "#92400e", border: "1px solid #FDE68A" }}
                            >Request Revision</button>
                          </div>
                        </div>
                      )}
                      {r.reviewStatus !== "Pending" && r.reviewedBy && (
                        <div className="px-5 py-2.5 flex items-center gap-2 text-[11px]" style={{ borderTop: "1px solid #F0F2F5", background: r.reviewStatus === "Approved" ? "#f0fdf4" : "#fff7ed" }}>
                          <span style={{ color: r.reviewStatus === "Approved" ? "#166534" : "#92400e" }}>
                            {r.reviewStatus === "Approved" ? "✓ Approved" : "↩ Returned"} by {r.reviewedBy}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            ) : (
              <ProgressReportForm
                projectId={selectedProject!}
                projectName={project!.name}
                onSubmit={(r) => { setLocalProgress((prev) => [r, ...prev]); setShowProgressForm(false); }}
                onCancel={() => setShowProgressForm(false)}
              />
            )}
          </div>
        )}
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={(updated) => {
            setLocalProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            setEditingProject(null);
          }}
          onClose={() => setEditingProject(null)}
        />
      )}
      {deliveryModal && (
        <RecordDeliveryModal
          mr={deliveryModal}
          onClose={() => setDeliveryModal(null)}
          onSave={(mrId, data) => {
            setLocalMRs((prev) => prev.map((m) => m.id === mrId ? {
              ...m,
              deliveryStatus: data.status,
              ivmVerification: { date: new Date().toISOString().split("T")[0], status: data.status, notes: data.notes, variance: data.variance, photos: data.photos.length },
              ivm: "Sola Ogunlola",
            } : m));
            setDeliveryModal(null);
          }}
        />
      )}
      </>
  );
  }

  // Project list view
  const globalTab = tab === "deployments" ? "deployments" : tab === "inventory" ? "inventory" : tab === "dailyreports" ? "dailyreports" : tab === "sitereports" ? "sitereports" : "projects";
  const canViewSiteReports = ["ceo", "admin", "howo"].includes(staffRole);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Construction & Projects</h2>
          <p className="text-[#69707D] text-sm mt-0.5">
            {isStateScopedRole && staffLocation
              ? `${localProjects.length} project${localProjects.length !== 1 ? "s" : ""} in ${staffLocation}`
              : `${localProjects.length} active projects across Nigeria`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab(tab === "inventory" ? "overview" : "inventory")}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${globalTab === "inventory" ? "bg-[#25205B] text-white" : "bg-white border border-[#E8EAF0] text-[#25205B]"}`}>
            {globalTab === "inventory" ? "← Projects" : "Inventory"}
          </button>
          <button onClick={() => setTab(tab === "dailyreports" ? "overview" : "dailyreports")}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${globalTab === "dailyreports" ? "bg-[#25205B] text-white" : "bg-white border border-[#E8EAF0] text-[#25205B]"}`}>
            {globalTab === "dailyreports" ? "← Projects" : "Daily Reports"}
          </button>
          {canViewSiteReports && (
            <button onClick={() => setTab(tab === "sitereports" ? "overview" : "sitereports")}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${globalTab === "sitereports" ? "text-white" : "bg-white border text-white"}`}
              style={globalTab === "sitereports" ? { background: "#a78bfa" } : { background: "#a78bfa", borderColor: "#a78bfa", opacity: 0.88 }}>
              {globalTab === "sitereports" ? "← Projects" : "Site Reports"}
            </button>
          )}
          <button onClick={() => setTab(globalTab === "projects" || globalTab === "inventory" || globalTab === "dailyreports" || globalTab === "sitereports" ? "deployments" : "overview")}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${globalTab === "deployments" ? "bg-[#25205B] text-white" : "bg-white border border-[#E8EAF0] text-[#25205B]"}`}>
            {globalTab === "deployments" ? "← Projects" : "Staff Deployments"}
          </button>
          {globalTab === "projects" && (
            <button onClick={() => setShowNewProjectForm(true)} className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors">+ New Project</button>
          )}
          {globalTab === "deployments" && (
            <button onClick={() => setShowDeployForm(!showDeployForm)} className="bg-[#6B9FE5] text-white text-sm px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              {showDeployForm ? "Cancel" : "+ New Deployment"}
            </button>
          )}
        </div>
      </div>

      {/* State scope banner */}
      {isStateScopedRole && staffLocation && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.15)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" stroke="#a78bfa" strokeWidth="1.3" fill="none"/><circle cx="7" cy="5" r="1.5" stroke="#a78bfa" strokeWidth="1.2" fill="none"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-semibold" style={{ color: "#a78bfa" }}>State-scoped view</span>
            <span className="text-[12px] ml-1.5" style={{ color: "#69707D" }}>You are viewing data for <strong style={{ color: "#252731" }}>{staffLocation}</strong> only</span>
          </div>
        </div>
      )}

      {/* DEPLOYMENTS GLOBAL VIEW */}
      {tab === "deployments" && (
        <div className="space-y-4">
          {showDeployForm && (
            <DeploymentForm
              onSubmit={(d) => { setLocalDeployments((prev) => [d, ...prev]); setShowDeployForm(false); }}
              onCancel={() => setShowDeployForm(false)}
            />
          )}

          {!showDeployForm && (
            <>
              <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E8EAF0" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Deployment Audit Trail</div>
                  <div className="text-[11px]" style={{ color: "#B0B8C4" }}>{localDeployments.length} records — all changes logged and permanent</div>
                </div>
                <div className="divide-y divide-[#F0F2F5]">
                  {localDeployments.map((d) => (
                    <div key={d.id} className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-[12px]" style={{ background: "#EAF2FC", color: "#25205B" }}>
                            {(d.employee as string).split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{d.id}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{d.status}</span>
                            </div>
                            <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{d.employee}</div>
                          </div>
                        </div>
                        <div className="text-[11px]" style={{ color: "#B0B8C4" }}>Effective {d.effectiveDate}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-0 rounded-xl px-3 py-2.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                          <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>From</div>
                          <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{d.fromProject}</div>
                          <div className="text-[11px]" style={{ color: "#69707D" }}>{d.fromLocation}</div>
                        </div>
                        <div className="shrink-0">
                          <svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M0 6h18M14 1l5 5-5 5" stroke="#6B9FE5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <div className="flex-1 min-w-0 rounded-xl px-3 py-2.5" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
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
            </>
          )}
        </div>
      )}

      {/* NEW PROJECT FORM */}
      {/* GLOBAL INVENTORY TAB */}
      {tab === "inventory" && <InventoryTab />}

      {/* GLOBAL DAILY REPORTS TAB */}
      {tab === "dailyreports" && <DailyReportsGlobalTab staffRole={staffRole} staffName={staffName} />}

      {/* SITE REPORTS REVIEW TAB */}
      {tab === "sitereports" && (
        <SiteReportsGlobalTab
          staffRole={staffRole}
          staffName={staffName}
          staffLocation={staffLocation}
          isStateScopedRole={isStateScopedRole}
          localProgress={localProgress}
          onApprove={handleApproveReport}
          onReturn={handleReturnReport}
          onAddComment={handleAddReportComment}
        />
      )}

      {showNewProjectForm && tab !== "deployments" && tab !== "inventory" && tab !== "dailyreports" && tab !== "sitereports" && (
        <NewProjectForm
          onSubmit={(p) => { setLocalProjects((prev) => [p, ...prev]); setShowNewProjectForm(false); }}
          onCancel={() => setShowNewProjectForm(false)}
        />
      )}

      {/* PROJECTS LIST */}
      {tab !== "deployments" && tab !== "inventory" && tab !== "dailyreports" && tab !== "sitereports" && !showNewProjectForm && (
        <div className="grid grid-cols-1 gap-4">
          {localProjects.map((p) => (
            <div key={p.id} className="bg-white border border-[#E8EAF0] rounded-xl p-5 hover:border-[#6B9FE5]/40 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setSelectedProject(p.id); setTab("overview"); }}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h3 className="text-[#252731] font-semibold">{p.name}</h3>
                  <p className="text-[#69707D] text-sm mt-0.5">{p.location} · {p.type} · {p.units} units · PCO: {p.pco}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <button onClick={(e) => { e.stopPropagation(); setEditingProject(p); }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#E8EAF0] text-[#69707D] hover:text-[#25205B] hover:border-[#6B9FE5]/40 transition-all">
                    Edit
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[{ label: "Budget", value: fmt(p.budget) }, { label: "Spent", value: fmt(p.spent) }, { label: "Remaining", value: fmt(p.budget - p.spent) }, { label: "Target Date", value: p.targetDate }].map((s) => (
                  <div key={s.label} className="bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                    <div className="text-[#69707D] text-[10px] font-semibold uppercase tracking-wide">{s.label}</div>
                    <div className="text-[#252731] font-semibold text-sm mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs text-[#69707D] mb-1.5">
                  <span>Construction Progress</span>
                  <span className="font-semibold text-[#252731]">{p.completion}%</span>
                </div>
                <div className="h-2 bg-[#EAF2FC] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.completion}%`, background: p.completion >= 80 ? "#10b981" : "#6B9FE5" }} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                {p.phases.map((ph) => (
                  <div key={ph.name} className="text-center">
                    <div className={`h-1 rounded-full mb-1 ${ph.completion === 100 ? "bg-emerald-400" : ph.completion > 0 ? "bg-[#6B9FE5]" : "bg-[#E8EAF0]"}`} />
                    <div className="text-[10px] text-[#69707D] leading-tight">{ph.name}</div>
                    <div className={`text-[10px] font-semibold ${ph.completion === 100 ? "text-emerald-600" : ph.completion > 0 ? "text-[#25205B]" : "text-[#E8EAF0]"}`}>{ph.completion}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={(updated) => {
            setLocalProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            setEditingProject(null);
          }}
          onClose={() => setEditingProject(null)}
        />
      )}

      {/* RECORD DELIVERY MODAL (global) */}
      {deliveryModal && (
        <RecordDeliveryModal
          mr={deliveryModal}
          onClose={() => setDeliveryModal(null)}
          onSave={(mrId, data) => {
            setLocalMRs((prev) => prev.map((m) => m.id === mrId ? {
              ...m,
              deliveryStatus: data.status,
              ivmVerification: { date: new Date().toISOString().split("T")[0], status: data.status, notes: data.notes, variance: data.variance, photos: data.photos.length },
              ivm: "Sola Ogunlola",
            } : m));
            setDeliveryModal(null);
          }}
        />
      )}
    </div>
  );
}
