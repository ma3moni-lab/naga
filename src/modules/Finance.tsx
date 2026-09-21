import { useState, useRef, useEffect } from "react";
import { DISBURSEMENTS, BUDGET_SUMMARY, PENDING_APPROVALS, MATERIAL_REQUESTS, STAYS_BOOKINGS } from "../data/dummy";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { logActivity } from "../data/activityLog";
import { showToast } from "../utils/toast";
import { useCountUp } from "../hooks/useCountUp";
import { exportCSV } from "../utils/csvExport";

function fmt(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Disbursed: "bg-purple-50 text-purple-700 border-purple-200",
    Authorized: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    "Supervisor Review": "bg-amber-50 text-amber-700 border-amber-200",
    "Manager Approval": "bg-amber-50 text-amber-700 border-amber-200",
    Authorization: "bg-amber-50 text-amber-700 border-amber-200",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Deposit Paid": "bg-amber-50 text-amber-700 border-amber-200",
    Refunded: "bg-gray-50 text-gray-600 border-gray-200",
    "Awaiting Payment": "bg-red-50 text-red-700 border-red-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Upcoming: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
    "Express Approved": "bg-purple-50 text-purple-700 border-purple-200",
    Queried: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

/* ─── FILE UPLOAD RECEIPT CELL ─── */
function MultiReceiptCell({ disbId, receipts, onSave }: {
  disbId: string;
  receipts: Record<string, string[]>;
  onSave: (id: string, urls: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const existing = receipts[disbId] ?? [];

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newUrls = files.map((f) => URL.createObjectURL(f));
    onSave(disbId, [...existing, ...newUrls]);
    e.target.value = "";
  }

  function remove(i: number) {
    const updated = existing.filter((_, j) => j !== i);
    onSave(disbId, updated);
  }

  return (
    <div className="space-y-2">
      {existing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existing.map((url, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: "#EAF2FC", color: "#25205B" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <a href={url} target="_blank" rel="noreferrer" className="hover:underline">Receipt {i + 1}</a>
              <button onClick={() => remove(i)} className="ml-0.5 opacity-60 hover:opacity-100 text-[12px] leading-none">&times;</button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFiles} />
      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors hover:bg-[#F7F8FA]"
        style={{ border: "1px dashed #D3E3F9", color: "#6B9FE5" }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        {existing.length > 0 ? "Add More" : "Upload Receipt(s)"}
      </button>
    </div>
  );
}

/* ─── INVOICE MODAL ─── */
interface InvoiceData {
  id: string;
  date: string;
  to: string;
  toDetail?: string;
  from: string;
  items: { description: string; qty: number; unitPrice: number; total: number }[];
}

function InvoiceModal({ data, onClose }: { data: InvoiceData; onClose: () => void }) {
  const subtotal = data.items.reduce((a, i) => a + i.total, 0);
  const vat = subtotal * 0.075;
  const total = subtotal + vat;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`@media print{body *{visibility:hidden}#finance-print-target,#finance-print-target *{visibility:visible}#finance-print-target{position:fixed;top:0;left:0;width:100%;background:white}@page{margin:15mm}}`}</style>
      <div id="finance-print-target" className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <span className="font-semibold text-[14px]" style={{ color: "#252731" }}>Invoice Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg border transition-colors hover:bg-[#EAF2FC]"
              style={{ border: "1px solid #D3E3F9", color: "#25205B" }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 4V2h8v2M3 10H1V6h12v4h-2M3 8h8v4H3V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Print / Export PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        <div id="invoice-print-content" className="p-8 overflow-y-auto max-h-[72vh]">
          {/* Invoice header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <rect width="44" height="44" rx="10" fill="#EAF2FC"/>
                  <path d="M9 25L22 11L35 25" stroke="#25205B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 23v10h6v-7h4v7h6V23" stroke="#25205B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-[15px]" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>NAGA Hummingbird Properties</div>
                <div className="text-[11px]" style={{ color: "#69707D" }}>Plot 14, Maitama District, Abuja · naga.properties</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-[22px]" style={{ color: "#25205B" }}>INVOICE</div>
              <div className="font-mono text-[12px] font-semibold" style={{ color: "#6B9FE5" }}>INV-{data.id}</div>
              <div className="text-[11px] mt-1" style={{ color: "#69707D" }}>Date: {data.date}</div>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <div className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="text-[9px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "#69707D" }}>From</div>
              <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{data.from}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Plot 14, Maitama, Abuja · RC 1234567</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
              <div className="text-[9px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "#25205B" }}>Bill To</div>
              <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{data.to}</div>
              {data.toDetail && <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{data.toDetail}</div>}
            </div>
          </div>

          {/* Line items */}
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[500px] mb-6" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#25205B" }}>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white rounded-tl-lg">Description</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white">Qty</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white">Unit Price</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#F7F8FA", borderBottom: "1px solid #F0F2F5" }}>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#252731" }}>{item.description}</td>
                  <td className="px-4 py-3 text-right text-[12px]" style={{ color: "#69707D" }}>{item.qty}</td>
                  <td className="px-4 py-3 text-right text-[12px]" style={{ color: "#69707D" }}>{fmt(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[12px]" style={{ color: "#25205B" }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Totals block */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "#69707D" }}>Subtotal</span>
                <span style={{ color: "#252731" }}>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "#69707D" }}>VAT (7.5%)</span>
                <span style={{ color: "#252731" }}>{fmt(vat)}</span>
              </div>
              <div className="flex justify-between text-[14px] font-bold pt-2" style={{ borderTop: "2px solid #25205B" }}>
                <span style={{ color: "#25205B" }}>Total</span>
                <span style={{ color: "#25205B" }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] pt-4" style={{ borderTop: "1px solid #F0F2F5", color: "#B0B8C4" }}>
            NAGA Hummingbird Properties Ltd · RC 1234567 · VAT ID: 12345678-0001 · info@naga.properties
          </div>
        </div>

        <div className="px-6 py-4 flex justify-between items-center" style={{ borderTop: "1px solid #E8EAF0" }}>
          <button onClick={onClose} className="px-4 py-2 text-[13px] rounded-lg border border-[#E8EAF0] text-[#69707D] hover:bg-[#F7F8FA]">Close</button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 text-[13px] rounded-lg font-semibold text-white flex items-center gap-2"
            style={{ background: "#25205B" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4V2h8v2M3 10H1V6h12v4h-2M3 8h8v4H3V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── NAGA STAYS FINANCE ─── */
function NagaStaysFinance() {
  const bookings = STAYS_BOOKINGS;
  const [filterUnit, setFilterUnit] = useState<"All" | string>("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<typeof STAYS_BOOKINGS[0] | null>(null);
  const [staysInvoice, setStaysInvoice] = useState<InvoiceData | null>(null);

  const units = Array.from(new Set(bookings.map((b) => b.unit)));
  const statuses = ["All", "Active", "Upcoming", "Completed", "Cancelled", "Pending"];

  const filtered = bookings.filter((b) => {
    const matchUnit = filterUnit === "All" || b.unit === filterUnit;
    const matchStatus = filterStatus === "All" || b.status === filterStatus;
    return matchUnit && matchStatus;
  });

  const totalRevenue = bookings.filter((b) => b.paymentStatus === "Paid").reduce((a, b) => a + b.total, 0);
  const depositRevenue = bookings.filter((b) => b.paymentStatus === "Deposit Paid").reduce((a, b) => a + b.total * 0.5, 0);
  const pendingRevenue = bookings.filter((b) => b.paymentStatus === "Awaiting Payment").reduce((a, b) => a + b.total, 0);
  const refunded = bookings.filter((b) => b.paymentStatus === "Refunded").reduce((a, b) => a + b.total, 0);

  const monthlyRevenue = [
    { month: "Jun", revenue: 526_315 },
    { month: "Jul", revenue: 0 },
    { month: "Aug", revenue: 2_231_630 },
    { month: "Sep", revenue: 589_500 },
    { month: "Oct", revenue: 1_179_000 },
  ];

  const auditEvents = [
    { date: "2025-08-26", actor: "Amina Suleiman (Guest)", action: "Booking Confirmed + Full Payment", ref: "BK-0041", detail: "₦526,315 received. Palm Court Premium Suite · 26–30 Aug." },
    { date: "2025-09-12", actor: "Femi Adeyinka (Guest)", action: "Booking Upcoming · Deposit Paid", ref: "BK-0040", detail: "50% deposit received. Gwarimpa Penthouse · 12–16 Sep." },
    { date: "2025-08-18", actor: "Chisom Obi (Guest)", action: "Stay Completed — Full Payment", ref: "BK-0039", detail: "₦526,315. Palm Court Suite · 18–22 Aug." },
    { date: "2025-08-10", actor: "Senator Ade Williams (Guest)", action: "Stay Completed — Full Payment", ref: "BK-0038", detail: "₦1,179,000. Gwarimpa Penthouse · 10–14 Aug." },
    { date: "2025-07-01", actor: "Amina Suleiman (Guest)", action: "Booking Cancelled — Refund Issued", ref: "BK-0037", detail: "₦526,315 refunded. Change of travel plans." },
    { date: "2025-10-03", actor: "Femi Adeyinka (Guest)", action: "Booking Created — Payment Pending", ref: "BK-0042", detail: "₦1,179,000 awaiting. Gwarimpa Penthouse · 3–7 Oct." },
  ];

  function openStaysInvoice(b: typeof STAYS_BOOKINGS[0]) {
    setStaysInvoice({
      id: b.id,
      date: new Date().toISOString().split("T")[0],
      to: b.guest,
      toDetail: `${b.unit} · Check-in: ${b.checkIn} · Check-out: ${b.checkOut}`,
      from: "NAGA Hummingbird Properties",
      items: [
        { description: `Accommodation — ${b.unit} (${b.nights} night${b.nights !== 1 ? "s" : ""})`, qty: b.nights, unitPrice: b.nightly, total: b.amount },
        { description: "Service Fee (5%)", qty: 1, unitPrice: b.serviceFee, total: b.serviceFee },
      ],
    });
  }

  return (
    <div className="space-y-5">
      {/* Revenue summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Confirmed Revenue", value: fmt(totalRevenue), note: "Fully paid bookings", color: "indigo" },
          { label: "Deposits Held", value: fmt(depositRevenue), note: "50% deposits received", color: "blue" },
          { label: "Awaiting Payment", value: fmt(pendingRevenue), note: "Unpaid bookings", color: "amber" },
          { label: "Refunded", value: fmt(refunded), note: "Cancelled bookings", color: "gray" },
        ].map((s) => {
          const colorMap: Record<string, { bg: string; text: string; border: string; sub: string }> = {
            indigo: { bg: "bg-[#25205B]", text: "text-white", border: "border-[#312a72]", sub: "text-[#6B9FE5]" },
            blue: { bg: "bg-[#EAF2FC]", text: "text-[#25205B]", border: "border-[#6B9FE5]/30", sub: "text-[#69707D]" },
            amber: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", sub: "text-amber-600" },
            gray: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", sub: "text-gray-500" },
          };
          const c = colorMap[s.color];
          return (
            <div key={s.label} className={`rounded-xl border px-4 py-4 ${c.bg} ${c.border}`}>
              <div className={`text-[10px] font-medium mb-1 ${c.sub}`}>{s.label}</div>
              <div className={`text-[22px] font-bold ${c.text}`}>{s.value}</div>
              <div className={`text-[10px] mt-0.5 ${c.sub}`}>{s.note}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Line Chart */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
        <h3 className="text-[#252731] font-semibold text-sm mb-4">Monthly Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#69707D" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} width={60} />
            <Tooltip formatter={(v) => [fmt(Number(v)), "Revenue"]} contentStyle={{ borderRadius: 10, border: "1px solid #E8EAF0", fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#25205B" strokeWidth={2.5} dot={{ fill: "#6B9FE5", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#25205B" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide mr-2" style={{ color: "#69707D" }}>Unit</label>
          <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}
            className="text-[12px] px-3 py-1.5 rounded-lg outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            <option value="All">All Units</option>
            {units.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide mr-2" style={{ color: "#69707D" }}>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="text-[12px] px-3 py-1.5 rounded-lg outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-[11px]" style={{ color: "#69707D" }}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Booking table */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                {["Ref", "Guest", "Unit", "Check-in", "Check-out", "Nights", "Total", "Payment", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#6B9FE5] cursor-pointer" onClick={() => setSelectedBooking(b)}>{b.id}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                    <div className="text-xs font-medium text-[#252731]">{b.guest}</div>
                    <div className="text-[10px] text-[#69707D]">{b.guestPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#252731] max-w-[140px] truncate cursor-pointer" onClick={() => setSelectedBooking(b)}>{b.unit}</td>
                  <td className="px-4 py-3 text-xs text-[#69707D] cursor-pointer" onClick={() => setSelectedBooking(b)}>{b.checkIn}</td>
                  <td className="px-4 py-3 text-xs text-[#69707D] cursor-pointer" onClick={() => setSelectedBooking(b)}>{b.checkOut}</td>
                  <td className="px-4 py-3 text-xs text-[#252731] cursor-pointer" onClick={() => setSelectedBooking(b)}>{b.nights}</td>
                  <td className="px-4 py-3 text-xs font-bold text-[#25205B] cursor-pointer" onClick={() => setSelectedBooking(b)}>{fmt(b.total)}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedBooking(b)}><StatusBadge status={b.paymentStatus} /></td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedBooking(b)}><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openStaysInvoice(b)}
                      title="Generate Invoice"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors hover:bg-[#EAF2FC]"
                      style={{ border: "1px solid #D3E3F9", color: "#25205B" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 3V1.5h7V3M2 7.5H.5V4h10v3.5H9M2 6h7v3.5H2V6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking detail drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[200] flex justify-end" style={{ background: "rgba(15,13,46,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => e.target === e.currentTarget && setSelectedBooking(null)}>
          <div className="w-full max-w-[420px] h-full bg-white overflow-y-auto shadow-2xl" style={{ animation: "slideInRight 0.28s cubic-bezier(0.32,0.72,0,1)" }}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #E8EAF0" }}>
              <div>
                <div className="font-mono text-[10px] text-[#6B9FE5] font-semibold">{selectedBooking.id}</div>
                <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>{selectedBooking.guest}</div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Guest contact */}
              <div className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-2.5" style={{ color: "#69707D" }}>Guest Contact</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[12px]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h8a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#6B9FE5" strokeWidth="1.2"/><path d="M1 3l5 3.5L11 3" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{ color: "#252731" }}>{selectedBooking.guestEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 2h2l1 2.5-1.5 1c.7 1.4 1.5 2.3 3 3l1-1.5L10.5 8v2A1 1 0 019 11C4.6 11 1 7.4 1 3a1 1 0 011-1z" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ color: "#252731" }}>{selectedBooking.guestPhone}</span>
                  </div>
                </div>
              </div>

              {/* Next of kin */}
              <div className="grid grid-cols-2 gap-3">
                {selectedBooking.nextOfKin && (
                  <div className="rounded-xl p-3.5" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                    <div className="text-[9px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#25205B" }}>Next of Kin</div>
                    <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{selectedBooking.nextOfKin.name}</div>
                    <div className="text-[10px]" style={{ color: "#69707D" }}>{selectedBooking.nextOfKin.relationship}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#6B9FE5" }}>{selectedBooking.nextOfKin.phone}</div>
                  </div>
                )}
                {selectedBooking.emergencyContact && (
                  <div className="rounded-xl p-3.5" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                    <div className="text-[9px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#92400e" }}>Emergency Contact</div>
                    <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{selectedBooking.emergencyContact.name}</div>
                    <div className="text-[10px]" style={{ color: "#69707D" }}>{selectedBooking.emergencyContact.relationship}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#ea580c" }}>{selectedBooking.emergencyContact.phone}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Unit", value: selectedBooking.unit },
                  { label: "Location", value: selectedBooking.location },
                  { label: "Check-in", value: selectedBooking.checkIn },
                  { label: "Check-out", value: selectedBooking.checkOut },
                  { label: "Nights", value: `${selectedBooking.nights} nights` },
                  { label: "Nightly Rate", value: fmt(selectedBooking.nightly) },
                ].map((r) => (
                  <div key={r.label} className="rounded-xl px-4 py-3" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                    <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>{r.label}</div>
                    <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{r.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 space-y-2" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Revenue Breakdown</div>
                {[
                  { label: "Room rate", value: fmt(selectedBooking.amount) },
                  { label: "Service fee (5%)", value: fmt(selectedBooking.serviceFee) },
                  { label: "Total charged", value: fmt(selectedBooking.total), bold: true },
                ].map((r) => (
                  <div key={r.label} className={`flex justify-between text-[12px] ${r.bold ? "pt-2 border-t border-[#E8EAF0] font-bold" : ""}`}>
                    <span style={{ color: "#69707D" }}>{r.label}</span>
                    <span style={{ color: "#25205B" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="flex-1 rounded-xl px-4 py-3 text-center" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                  <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Booking Status</div>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                <div className="flex-1 rounded-xl px-4 py-3 text-center" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                  <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Payment Status</div>
                  <StatusBadge status={selectedBooking.paymentStatus} />
                </div>
              </div>

              {selectedBooking.assignedStaff && (
                <div className="rounded-xl p-4" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                  <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#25205B" }}>Assigned Host</div>
                  <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{selectedBooking.assignedStaff.name}</div>
                  <div className="text-[11px]" style={{ color: "#69707D" }}>{selectedBooking.assignedStaff.role}</div>
                  <div className="text-[11px] mt-1" style={{ color: "#6B9FE5" }}>{selectedBooking.assignedStaff.phone} · {selectedBooking.assignedStaff.email}</div>
                </div>
              )}
            </div>
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:none}}`}</style>
          </div>
        </div>
      )}

      {/* Audit trail */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0]">
          <h3 className="font-semibold text-[14px]" style={{ color: "#252731" }}>Audit Trail</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>All financial events across NAGA Stays bookings</p>
        </div>
        <div className="divide-y divide-[#F0F2F5]">
          {auditEvents.map((e, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#6B9FE5" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-mono text-[10px] text-[#6B9FE5] font-semibold">{e.ref}</span>
                  <span className="font-semibold text-[12px]" style={{ color: "#252731" }}>{e.action}</span>
                </div>
                <div className="text-[11px]" style={{ color: "#69707D" }}>{e.actor}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#B0B8C4" }}>{e.detail}</div>
              </div>
              <div className="text-[10px] shrink-0" style={{ color: "#B0B8C4" }}>{e.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stays invoice modal */}
      {staysInvoice && <InvoiceModal data={staysInvoice} onClose={() => setStaysInvoice(null)} />}
    </div>
  );
}

/* ─── CEO EXPRESS APPROVAL MODAL ─── */
interface ApprovalItem {
  id: string; type: string; project: string; amount: number | null; requestedBy: string; awaitingAction: string; date: string;
  ceoAction?: "Express Approved" | "Queried" | null;
  ceoNote?: string;
  queryRecipient?: string;
  approvalAction?: "Approved" | "Returned" | null;
  approvedByRole?: string;
  approvalNote?: string;
}

function ExpressApprovalModal({ item, onClose, onAction }: {
  item: ApprovalItem;
  onClose: () => void;
  onAction: (id: string, action: "Express Approved" | "Queried", note: string, recipient?: string) => void;
}) {
  const [mode, setMode] = useState<"express" | "query" | null>(null);
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState(item.requestedBy);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl">
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] text-[#6B9FE5] mb-0.5">{item.id}</div>
              <h3 className="font-semibold text-[15px]" style={{ color: "#252731" }}>CEO Express Action</h3>
              <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{item.type} · {item.project !== "—" ? item.project : "HR"}</p>
            </div>
            <button onClick={onClose} className="text-[#69707D] text-xl leading-none hover:text-[#252731]">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-xl p-3.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>Requested by</div>
              <div className="font-semibold" style={{ color: "#252731" }}>{item.requestedBy}</div>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>Awaiting</div>
              <div className="font-semibold" style={{ color: "#252731" }}>{item.awaitingAction}</div>
            </div>
            {item.amount && (
              <div className="col-span-2 rounded-xl p-3.5" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#25205B" }}>Amount</div>
                <div className="font-bold text-[18px]" style={{ color: "#25205B" }}>₦{item.amount.toLocaleString()}</div>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#92400e" }}>Approval Delay Notice</div>
            <p className="text-[12px]" style={{ color: "#92400e" }}>
              This request is pending {item.awaitingAction} and may be stalling. As CEO, you can express-approve it directly or query the responsible approver.
            </p>
          </div>

          {!mode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => setMode("express")}
                className="py-3 rounded-xl text-sm font-semibold transition-all border-2"
                style={{ background: "#25205B", color: "white", borderColor: "#25205B" }}>
                Express Approve
              </button>
              <button onClick={() => setMode("query")}
                className="py-3 rounded-xl text-sm font-semibold transition-all border-2"
                style={{ background: "#FFF7ED", color: "#92400e", borderColor: "#FED7AA" }}>
                Query Approver
              </button>
            </div>
          )}

          {mode === "express" && (
            <div className="space-y-3">
              <div className="rounded-xl p-3.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="text-[11px] font-semibold mb-0.5" style={{ color: "#166534" }}>Express approval bypasses the standard chain</div>
                <div className="text-[11px]" style={{ color: "#166534" }}>Your authorization will be logged permanently and the request will proceed immediately.</div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Authorization note (required)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                  placeholder="e.g. Approved due to project urgency — proceeding on CEO authority."
                  className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5] resize-none" style={{ color: "#252731" }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMode(null)} className="flex-1 py-2.5 rounded-xl border border-[#E8EAF0] text-sm text-[#69707D]">Back</button>
                <button disabled={!note.trim()}
                  onClick={() => { onAction(item.id, "Express Approved", note); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "#25205B" }}>
                  Confirm Express Approval
                </button>
              </div>
            </div>
          )}

          {mode === "query" && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Approver to query</label>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)}
                  className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5]" style={{ color: "#252731" }} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Your query / message</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                  placeholder="e.g. Why is this request still pending? Please action immediately or provide a reason for the delay."
                  className="w-full border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6B9FE5] resize-none" style={{ color: "#252731" }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMode(null)} className="flex-1 py-2.5 rounded-xl border border-[#E8EAF0] text-sm text-[#69707D]">Back</button>
                <button disabled={!note.trim()}
                  onClick={() => { onAction(item.id, "Queried", note, recipient); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "#ea580c" }}>
                  Send Query
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── RECEIVABLES HELPERS ─── */
const TODAY = new Date("2026-08-28");

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  return Math.max(0, Math.floor((TODAY.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

function ageBucket(days: number): "0-30" | "31-60" | "61-90" | "90+" {
  if (days > 90) return "90+";
  if (days > 60) return "61-90";
  if (days > 30) return "31-60";
  return "0-30";
}

const RESIDENT_RECEIVABLES = [
  { id: "RES-001", name: "Alhaji Musa Ibrahim", type: "Resident", unit: "Block A, Apt 12", ref: "SA-0012", amount: 1_250_000, dueDate: "2026-07-15" },
  { id: "RES-002", name: "Mrs. Ngozi Okonkwo", type: "Resident", unit: "Block C, Apt 5", ref: "SA-0015", amount: 875_000, dueDate: "2026-07-28" },
  { id: "RES-003", name: "Dr. Fatima Bello", type: "Resident", unit: "Block B, Apt 3", ref: "SA-0018", amount: 650_000, dueDate: "2026-08-15" },
  { id: "RES-004", name: "Chief Emeka Obi", type: "Resident", unit: "Penthouse 1", ref: "SA-0020", amount: 3_500_000, dueDate: "2026-05-15" },
  { id: "RES-005", name: "Ms. Amaka Nwosu", type: "Customer", unit: "N/A", ref: "SA-0021", amount: 526_315, dueDate: "2026-08-20" },
  { id: "RES-006", name: "Mr. Tunde Adesanya", type: "Customer", unit: "N/A", ref: "SA-0022", amount: 420_000, dueDate: "2026-06-10" },
];

/* ─── MAIN FINANCE COMPONENT ─── */
export default function Finance() {
  const staffRaw = sessionStorage.getItem("naga_staff");
  const staffParsed = staffRaw ? JSON.parse(staffRaw) : { role: "ceo", name: "CEO" };
  const staffRole = staffParsed.role;
  const staffName = staffParsed.name ?? "Staff";
  const isCEO = staffRole === "ceo";
  const isAdmin = staffRole === "admin";
  const canOverride = isCEO || isAdmin;
  const overrideRole = isCEO ? "CEO" : "Admin";
  const canAccessStays = ["ceo", "finance", "admin", "estate"].includes(staffRole);

  const [tab, setTab] = useState<"overview" | "disbursements" | "budget" | "approvals" | "stays" | "receivables">("overview");
  const [receipts, setReceipts] = useState<Record<string, string[]>>({});
  const [expandedDis, setExpandedDis] = useState<string | null>(null);
  type DisputeRecord = { reason: string; raisedBy: string; raisedByRole: string; date: string; resolved: boolean; resolvedNote?: string };
  const [disputes, setDisputes] = useState<Record<string, DisputeRecord>>({});
  const [disputeModal, setDisputeModal] = useState<{ disbId: string; mode: "raise" | "resolve" } | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [localApprovals, setLocalApprovals] = useState<ApprovalItem[]>(
    PENDING_APPROVALS.map((a) => ({ ...a, ceoAction: null, ceoNote: "" }))
  );
  const [expressModal, setExpressModal] = useState<ApprovalItem | null>(null);
  const [disbInvoice, setDisbInvoice] = useState<InvoiceData | null>(null);
  const [disbPage, setDisbPage] = useState(0);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const [bucketFilter, setBucketFilter] = useState<"All" | "0-30" | "31-60" | "61-90" | "90+">("All");
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());

  const ROWS_PER_PAGE = 5;
  const totalDisbPages = Math.ceil(DISBURSEMENTS.length / ROWS_PER_PAGE);
  const pagedDisbursements = DISBURSEMENTS.slice(disbPage * ROWS_PER_PAGE, (disbPage + 1) * ROWS_PER_PAGE);

  const totalDisbursed = DISBURSEMENTS.reduce((a, d) => a + d.amount, 0);
  const totalBudget = BUDGET_SUMMARY.reduce((a, b) => a + b.budget, 0);
  const totalSpent = BUDGET_SUMMARY.reduce((a, b) => a + b.spent, 0);
  const totalCommitted = BUDGET_SUMMARY.reduce((a, b) => a + b.committed, 0);

  const animBudget = useCountUp(totalBudget, { duration: 1000 });
  const animSpent = useCountUp(totalSpent, { duration: 1000 });
  const animCommitted = useCountUp(totalCommitted, { duration: 1000 });
  const animDisbursed = useCountUp(totalDisbursed, { duration: 1000 });

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    function handleMouseDown(e: MouseEvent) {
      const menu = document.getElementById("finance-ctx-menu");
      if (menu && !menu.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ctxMenu]);

  const spendingTrend = [
    { month: "Mar", spent: 45_000_000, budget: 75_000_000 },
    { month: "Apr", spent: 58_000_000, budget: 75_000_000 },
    { month: "May", spent: 71_000_000, budget: 75_000_000 },
    { month: "Jun", spent: 82_000_000, budget: 80_000_000 },
    { month: "Jul", spent: 91_000_000, budget: 80_000_000 },
    { month: "Aug", spent: totalSpent / 12, budget: totalBudget / 12 },
  ];

  const cashFlowData = [
    { month: "Sep", income: 8_200_000, outgoings: 5_100_000, net: 3_100_000 },
    { month: "Oct", income: 11_400_000, outgoings: 7_800_000, net: 3_600_000 },
    { month: "Nov", income: 6_900_000, outgoings: 4_200_000, net: 2_700_000 },
  ];

  /* Receivables data: hardcoded residents + overdue stays bookings */
  const overdueStays = STAYS_BOOKINGS
    .filter((b) => b.paymentStatus === "Awaiting Payment" && b.checkOut < "2026-08-28")
    .map((b) => ({
      id: b.id,
      name: b.guest,
      type: "Customer",
      unit: b.unit,
      ref: b.id,
      amount: b.total,
      dueDate: b.checkOut,
    }));

  const allReceivables = [...RESIDENT_RECEIVABLES, ...overdueStays].map((r) => {
    const days = daysOverdue(r.dueDate);
    return { ...r, daysOverdue: days, bucket: ageBucket(days) };
  });

  const filteredReceivables = bucketFilter === "All"
    ? allReceivables
    : allReceivables.filter((r) => r.bucket === bucketFilter);

  const totalOutstanding = allReceivables.reduce((a, r) => a + r.amount, 0);
  const criticallyOverdue = allReceivables.filter((r) => r.bucket === "90+").reduce((a, r) => a + r.amount, 0);

  const tabDefs = [
    { id: "overview" as const, label: "Overview" },
    { id: "disbursements" as const, label: "Disbursements" },
    { id: "budget" as const, label: "Budget" },
    { id: "approvals" as const, label: `Pending Approvals${localApprovals.filter((a) => !a.ceoAction).length > 0 ? ` (${localApprovals.filter((a) => !a.ceoAction).length})` : ""}` },
    { id: "receivables" as const, label: "Receivables" },
    ...(canAccessStays ? [{ id: "stays" as const, label: "NAGA Stays Finance" }] : []),
  ];

  function handleApprovalAction(id: string, action: "Express Approved" | "Queried", note: string, recipient?: string) {
    setLocalApprovals((prev) => prev.map((a) => a.id === id ? { ...a, ceoAction: action, ceoNote: note, queryRecipient: recipient } : a));
    const item = localApprovals.find((a) => a.id === id);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffName,
      role: overrideRole,
      action: action === "Express Approved" ? "Express Approved" : "Approval Queried",
      module: "Finance",
      detail: action === "Express Approved"
        ? `Express approved ${id}${item?.amount ? ` — ₦${item.amount.toLocaleString()}` : ""} (bypassing standard chain). Note: ${note}`
        : `Queried approval ${id} — sent to ${recipient ?? item?.requestedBy ?? "approver"}. Query: ${note}`,
      ref: id,
      severity: action === "Express Approved" ? "info" : "warning",
    });
  }

  function openDisbInvoice(d: typeof DISBURSEMENTS[0]) {
    setDisbInvoice({
      id: d.id,
      date: d.date,
      to: d.payee,
      toDetail: d.project,
      from: "NAGA Hummingbird Properties",
      items: [
        { description: `${d.project} — Procurement / Services`, qty: 1, unitPrice: d.amount, total: d.amount },
      ],
    });
  }

  function sendReminder(id: string, name: string, amount: number) {
    setRemindedIds((prev) => new Set(prev).add(id));
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffName,
      role: staffRole.toUpperCase(),
      action: "Payment Reminder Sent",
      module: "Finance",
      detail: `Payment reminder sent to ${name} — outstanding balance ₦${amount.toLocaleString()}.`,
      ref: id,
      severity: "info",
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Finance</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Budget, disbursements, approvals and revenue records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Project Budget" value={fmt(animBudget)} color="indigo" />
        <SummaryCard label="Total Spent" value={fmt(animSpent)} color="blue" note={`${Math.round((totalSpent / totalBudget) * 100)}% of budget`} />
        <SummaryCard label="Committed" value={fmt(animCommitted)} color="amber" />
        <SummaryCard label="Disbursements (Lifetime)" value={fmt(animDisbursed)} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg flex-wrap">
        {tabDefs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.id ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Budget vs Spent */}
            <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
              <h3 className="text-[#252731] font-semibold text-sm mb-4">Budget vs Expenditure by Project</h3>
              <div className="space-y-4">
                {BUDGET_SUMMARY.map((b) => {
                  const pct = Math.round((b.spent / b.budget) * 100);
                  return (
                    <div key={b.project}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#252731] font-medium">{b.project}</span>
                        <span className="text-[#69707D]">{fmt(b.spent)} / {fmt(b.budget)}</span>
                      </div>
                      <div className="h-2.5 bg-[#EAF2FC] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-[#6B9FE5]"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-1">
                        <span className="text-[#69707D]">Committed: {fmt(b.committed)}</span>
                        <span className={`font-semibold ${pct > 90 ? "text-red-600" : "text-[#69707D]"}`}>Remaining: {fmt(b.remaining)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spending Trend Line Chart */}
            <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
              <h3 className="text-[#252731] font-semibold text-sm mb-4">Monthly Spend vs Budget Allocation</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={spendingTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#69707D" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip formatter={(v) => [fmt(Number(v))]} contentStyle={{ borderRadius: 10, border: "1px solid #E8EAF0", fontSize: 12 }} />
                  <Line type="monotone" dataKey="budget" name="Budget Allocation" stroke="#EAF2FC" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="spent" name="Actual Spend" stroke="#25205B" strokeWidth={2.5} dot={{ fill: "#6B9FE5", r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#69707D" }}><div className="w-4 h-0.5" style={{ background: "#E8EAF0", borderTop: "2px dashed #6B9FE5" }} />Budget</div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#69707D" }}><div className="w-4 h-0.5 rounded" style={{ background: "#25205B" }} />Actual Spend</div>
              </div>
            </div>
          </div>

          {/* Recent Disbursements */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
            <h3 className="text-[#252731] font-semibold text-sm mb-4">Recent Disbursements</h3>
            <div className="space-y-3">
              {DISBURSEMENTS.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-start justify-between py-2.5 border-b border-[#F0F2F5] last:border-0">
                  <div>
                    <div className="font-mono text-[11px] text-[#6B9FE5] font-semibold">{d.id}</div>
                    <div className="text-[#252731] text-xs font-medium mt-0.5">{d.payee}</div>
                    <div className="text-[#69707D] text-[10px]">{d.project} · {d.date}</div>
                    {receipts[d.id]?.length > 0 && (
                      <span className="text-[10px] font-semibold" style={{ color: "#166534" }}>✓ {receipts[d.id].length} receipt{receipts[d.id].length > 1 ? "s" : ""} attached</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[#252731] font-bold text-sm">{fmt(d.amount)}</div>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3-Month Cash Flow Forecast ── */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[#252731] font-semibold text-sm">3-Month Cash Flow Forecast</h3>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#EAF2FC", color: "#25205B" }}>Sep – Nov 2026</span>
            </div>
            <p className="text-[11px] mb-4" style={{ color: "#69707D" }}>Projected income vs outgoings across bookings, service charges and project disbursements</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cashFlowData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#69707D" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  formatter={(v, name) => [fmt(Number(v)), name]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E8EAF0", fontSize: 12 }}
                />
                <Bar dataKey="income" name="Expected Income" fill="#6B9FE5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outgoings" name="Expected Outgoings" fill="#B8C4D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#25205B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#69707D" }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: "#6B9FE5" }} /> Expected Income
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#69707D" }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: "#B8C4D4" }} /> Expected Outgoings
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#69707D" }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: "#25205B" }} /> Net
              </div>
              <div className="ml-auto text-[11px] font-semibold" style={{ color: "#25205B" }}>
                Projected 3-month net: ₦9.4M
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DISBURSEMENTS TAB ── */}
      {tab === "disbursements" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#69707D]">{DISBURSEMENTS.length} disbursement{DISBURSEMENTS.length !== 1 ? "s" : ""}</span>
            <button
              onClick={() => exportCSV("finance-disbursements", ["ID", "Description", "Project", "Amount", "Date", "Status"],
                DISBURSEMENTS.map((d) => [d.id, d.payee, d.project, d.amount, d.date, d.status])
              )}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-[#25205B] hover:bg-[#EAF2FC]"
            >Export CSV</button>
          </div>
          {pagedDisbursements.map((d) => {
            const mr = MATERIAL_REQUESTS.find((m) => m.id === d.mrRef);
            const isExpanded = expandedDis === d.id;
            return (
              <div key={d.id} className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F7F8FA] transition-colors"
                  onClick={() => setExpandedDis(isExpanded ? null : d.id)}
                  onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, id: d.id }); }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <div className="font-mono text-xs font-semibold" style={{ color: "#6B9FE5" }}>{d.id}</div>
                      <div className="text-[12px] font-medium mt-0.5" style={{ color: "#252731" }}>{d.payee}</div>
                    </div>
                    <div className="hidden md:block text-[11px]" style={{ color: "#69707D" }}>{d.project} · {d.date}</div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#6B9FE5", border: "1px solid #E8EAF0" }}>MR: {d.mrRef}</span>
                    <StatusBadge status={d.status} />
                    {receipts[d.id]?.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "#dcfce7", color: "#166534" }}>✓ {receipts[d.id].length} receipt{receipts[d.id].length > 1 ? "s" : ""}</span>
                    )}
                    {disputes[d.id] && !disputes[d.id].resolved && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ background: "#FEF2F2", color: "#DC2626", borderColor: "#FCA5A5" }}>⚠ Disputed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openDisbInvoice(d); }}
                      title="Generate Invoice"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors hover:bg-[#EAF2FC]"
                      style={{ border: "1px solid #D3E3F9", color: "#25205B" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 3V1.5h7V3M2 7.5H.5V4h10v3.5H9M2 6h7v3.5H2V6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Invoice
                    </button>
                    <div className="text-right">
                      <div className="font-bold text-[15px]" style={{ color: "#25205B" }}>{fmt(d.amount)}</div>
                      <div className="text-[10px]" style={{ color: "#69707D" }}>{d.method}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <path d="M3 5l4 4 4-4" stroke="#69707D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#F0F2F5] px-5 py-4 space-y-4">
                    {mr && (
                      <div className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Linked Material Request</div>
                        <div className="flex items-start gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{mr.purpose}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Requested by {mr.requestedBy} · {mr.date}</div>
                            <div className="text-[11px]" style={{ color: "#69707D" }}>Supplier: {mr.supplier ?? "—"}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-[14px]" style={{ color: "#25205B" }}>{fmt(mr.totalAmount)}</div>
                            <StatusBadge status={mr.status} />
                          </div>
                        </div>
                        {mr.items && (
                          <div className="mt-3 space-y-1">
                            {mr.items.map((item) => (
                              <div key={item.material} className="flex justify-between text-[11px]">
                                <span style={{ color: "#69707D" }}>{item.material} × {item.qty} {item.unit}</span>
                                <span className="font-medium" style={{ color: "#252731" }}>{fmt(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Payment Receipt(s) / Evidence</div>
                        <div className="text-[11px]" style={{ color: "#B0B8C4" }}>Authorized by {d.authorizedBy} · Upload one or more files</div>
                      </div>
                      <MultiReceiptCell
                        disbId={d.id}
                        receipts={receipts}
                        onSave={(id, urls) => setReceipts((prev) => ({ ...prev, [id]: urls }))}
                      />
                    </div>

                    {receipts[d.id]?.length > 0 && (
                      <div className="rounded-xl p-3 text-[11px]" style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534" }}>
                        {receipts[d.id].length} receipt{receipts[d.id].length > 1 ? "s" : ""} uploaded and visible to CEO, Finance, and Admin.
                      </div>
                    )}

                    {/* Dispute section */}
                    {disputes[d.id] ? (
                      <div className={`rounded-xl p-4 space-y-2 ${disputes[d.id].resolved ? "bg-[#dcfce7] border border-[#bbf7d0]" : "bg-red-50 border border-red-200"}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${disputes[d.id].resolved ? "bg-[#bbf7d0] text-[#166534]" : "bg-red-100 text-red-700"}`}>
                              {disputes[d.id].resolved ? "Dispute Resolved" : "⚠ Payment Disputed"}
                            </span>
                          </div>
                          {canOverride && !disputes[d.id].resolved && (
                            <button
                              onClick={() => { setDisputeModal({ disbId: d.id, mode: "resolve" }); setDisputeReason(""); }}
                              className="text-[11px] font-semibold px-3 py-1 rounded-lg border border-[#166534] text-[#166534] hover:bg-[#dcfce7] transition-colors"
                            >Mark Resolved</button>
                          )}
                        </div>
                        <p className="text-[12px]" style={{ color: disputes[d.id].resolved ? "#166534" : "#991b1b" }}>
                          <strong>Reason:</strong> {disputes[d.id].reason}
                        </p>
                        <p className="text-[10px]" style={{ color: disputes[d.id].resolved ? "#166534" : "#b91c1c" }}>
                          Raised by {disputes[d.id].raisedBy} ({disputes[d.id].raisedByRole}) · {disputes[d.id].date}
                        </p>
                        {disputes[d.id].resolvedNote && (
                          <p className="text-[11px] text-[#166534] mt-1"><strong>Resolution note:</strong> {disputes[d.id].resolvedNote}</p>
                        )}
                      </div>
                    ) : (
                      canOverride && (
                        <button
                          onClick={() => { setDisputeModal({ disbId: d.id, mode: "raise" }); setDisputeReason(""); }}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                        >Raise Dispute</button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalDisbPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-[11px]" style={{ color: "#69707D" }}>
                Showing {disbPage * ROWS_PER_PAGE + 1}–{Math.min((disbPage + 1) * ROWS_PER_PAGE, DISBURSEMENTS.length)} of {DISBURSEMENTS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={disbPage === 0}
                  onClick={() => setDisbPage((p) => p - 1)}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-[#E8EAF0] disabled:opacity-40 hover:bg-[#F7F8FA] transition-colors"
                  style={{ color: "#25205B" }}
                >
                  ← Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalDisbPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDisbPage(i)}
                      className={`w-7 h-7 rounded-md text-[11px] font-semibold transition-colors ${disbPage === i ? "text-white" : "text-[#69707D] hover:bg-[#F7F8FA]"}`}
                      style={disbPage === i ? { background: "#25205B" } : {}}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={disbPage === totalDisbPages - 1}
                  onClick={() => setDisbPage((p) => p + 1)}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-[#E8EAF0] disabled:opacity-40 hover:bg-[#F7F8FA] transition-colors"
                  style={{ color: "#25205B" }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BUDGET TAB ── */}
      {tab === "budget" && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                    {["Project", "Budget", "Spent", "Committed", "Remaining", "Budget Used"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {BUDGET_SUMMARY.map((b) => {
                    const pct = Math.round((b.spent / b.budget) * 100);
                    return (
                      <tr key={b.project} className="hover:bg-[#F7F8FA]">
                        <td className="px-5 py-4 text-sm font-semibold text-[#252731]">{b.project}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#252731]">{fmt(b.budget)}</td>
                        <td className="px-5 py-4 text-sm text-[#252731]">{fmt(b.spent)}</td>
                        <td className="px-5 py-4 text-sm text-amber-600 font-medium">{fmt(b.committed)}</td>
                        <td className={`px-5 py-4 text-sm font-semibold ${b.remaining < 10_000_000 ? "text-red-600" : "text-emerald-600"}`}>{fmt(b.remaining)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-[#EAF2FC] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-[#6B9FE5]"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${pct > 90 ? "text-red-600" : "text-[#69707D]"}`}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVALS TAB ── */}
      {tab === "approvals" && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              onClick={() => exportCSV("finance-approvals", ["ID", "Type", "Project", "Amount", "Awaiting", "Status"],
                localApprovals.map((a) => [a.id, a.type, a.project, a.amount ?? "", a.awaitingAction, a.ceoAction ?? a.awaitingAction])
              )}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-[#25205B] hover:bg-[#EAF2FC]"
            >Export CSV</button>
          </div>
          {canOverride && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l2.5 5 5.5.8-4 3.9.9 5.5L9 13.5 4.1 16.2l.9-5.5L1 6.8l5.5-.8z" stroke="#25205B" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              <div>
                <div className="font-semibold text-[12px]" style={{ color: "#25205B" }}>{overrideRole} Override Available</div>
                <div className="text-[11px]" style={{ color: "#25205B" }}>As {overrideRole}, you can express-approve any stalling request or query the responsible approver directly using the action buttons.</div>
              </div>
            </div>
          )}
          {/* Select-all header row */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded accent-[#25205B]"
              checked={localApprovals.length > 0 && localApprovals.every((a) => selectedApprovals.has(a.id))}
              onChange={(e) => {
                setSelectedApprovals(e.target.checked ? new Set(localApprovals.map((a) => a.id)) : new Set());
              }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "#69707D" }}>
              {selectedApprovals.size > 0 ? `${selectedApprovals.size} of ${localApprovals.length} selected` : "Select all"}
            </span>
          </div>
          {localApprovals.map((item) => (
            <div key={item.id} className="bg-white border border-[#E8EAF0] rounded-xl p-5">
              <div className="flex items-start gap-4">
                {/* Row checkbox */}
                <div className="pt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer rounded accent-[#25205B]"
                    checked={selectedApprovals.has(item.id)}
                    onChange={(e) => {
                      setSelectedApprovals((prev) => {
                        const next = new Set(prev);
                        e.target.checked ? next.add(item.id) : next.delete(item.id);
                        return next;
                      });
                    }}
                  />
                </div>
              <div className="flex-1 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[#6B9FE5]">{item.id}</span>
                    <span className="text-[10px] bg-[#EAF2FC] text-[#25205B] border border-[#6B9FE5]/30 px-2 py-0.5 rounded font-semibold uppercase">{item.type}</span>
                    {item.ceoAction && <StatusBadge status={item.ceoAction} />}
                  </div>
                  <div className="text-[#252731] text-sm font-medium">{item.project !== "—" ? item.project : "HR"}</div>
                  <div className="text-[#69707D] text-xs mt-0.5">Requested by {item.requestedBy} · {item.date}</div>
                  {item.amount && (
                    <div className="text-[#25205B] font-bold text-base mt-2">{fmt(item.amount)}</div>
                  )}
                  {item.ceoNote && (
                    <div className="mt-2 text-[11px] p-2.5 rounded-lg" style={{ background: item.ceoAction === "Queried" ? "#FFF7ED" : "#dcfce7", color: item.ceoAction === "Queried" ? "#92400e" : "#166534" }}>
                      {item.ceoAction === "Queried" ? `Queried → ${item.queryRecipient}: ` : "CEO Note: "}{item.ceoNote}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {item.ceoAction ? (
                    <div className="text-right space-y-1">
                      <StatusBadge status={item.ceoAction} />
                      <div className="text-[10px]" style={{ color: "#69707D" }}>{overrideRole} override · {new Date().toLocaleDateString()}</div>
                    </div>
                  ) : item.approvalAction ? (
                    <div className="text-right space-y-1">
                      <StatusBadge status={item.approvalAction === "Approved" ? "Authorized" : "Queried"} />
                      <div className="text-[10px]" style={{ color: "#69707D" }}>
                        {item.approvalAction === "Approved" ? "Approved" : "Returned"} by {item.approvedByRole} · {new Date().toLocaleDateString()}
                      </div>
                      {item.approvalNote && (
                        <div className="text-[11px] px-2.5 py-1.5 rounded-lg text-left mt-1" style={{ background: item.approvalAction === "Returned" ? "#FFF7ED" : "#F0FDF4", color: item.approvalAction === "Returned" ? "#92400e" : "#166534" }}>
                          {item.approvalNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <StatusBadge status={item.awaitingAction} />
                      <div className="flex gap-2 mt-1 flex-wrap justify-end">
                        <button
                          onClick={() => {
                            setLocalApprovals(prev => prev.map(a => a.id === item.id ? { ...a, approvalAction: "Approved", approvedByRole: staffRole.toUpperCase(), approvalNote: `Approved by ${staffRole} on ${new Date().toLocaleDateString()}` } : a));
                            logActivity({
                              timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                              actor: staffName,
                              role: staffRole.toUpperCase(),
                              action: "Disbursement Approved",
                              module: "Finance",
                              detail: `Approved ${item.id}${item.amount ? ` — ₦${item.amount.toLocaleString()}` : ""} (${item.type}, ${item.project}).`,
                              ref: item.id,
                              severity: "info",
                            });
                          }}
                          className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt("Return reason (required):");
                            if (!reason) return;
                            setLocalApprovals(prev => prev.map(a => a.id === item.id ? { ...a, approvalAction: "Returned", approvedByRole: staffRole.toUpperCase(), approvalNote: reason } : a));
                            logActivity({
                              timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                              actor: staffName,
                              role: staffRole.toUpperCase(),
                              action: "Disbursement Returned",
                              module: "Finance",
                              detail: `Returned ${item.id} for revision — ${reason}`,
                              ref: item.id,
                              severity: "warning",
                            });
                          }}
                          className="px-4 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
                          Return
                        </button>
                        {canOverride && (
                          <button onClick={() => setExpressModal(item)}
                            className="px-4 py-1.5 border text-xs font-semibold rounded-lg transition-all"
                            style={{ background: "#25205B", color: "white", borderColor: "#25205B" }}>
                            {overrideRole} Override
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RECEIVABLES TAB ── */}
      {tab === "receivables" && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border px-5 py-4" style={{ background: "#25205B", borderColor: "#312a72" }}>
              <div className="text-[10px] font-medium mb-1" style={{ color: "#6B9FE5" }}>Total Outstanding</div>
              <div className="text-[24px] font-bold text-white">{fmt(totalOutstanding)}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#6B9FE5" }}>{allReceivables.length} accounts</div>
            </div>
            <div className="rounded-xl border px-5 py-4 bg-red-50 border-red-200">
              <div className="text-[10px] font-medium mb-1 text-red-500">Critically Overdue (90+ days)</div>
              <div className="text-[24px] font-bold text-red-700">{fmt(criticallyOverdue)}</div>
              <div className="text-[10px] mt-0.5 text-red-500">{allReceivables.filter((r) => r.bucket === "90+").length} account{allReceivables.filter((r) => r.bucket === "90+").length !== 1 ? "s" : ""}</div>
            </div>
            <div className="rounded-xl border px-5 py-4" style={{ background: "#EAF2FC", borderColor: "#D3E3F9" }}>
              <div className="text-[10px] font-medium mb-1" style={{ color: "#25205B" }}>Number of Accounts</div>
              <div className="text-[24px] font-bold" style={{ color: "#25205B" }}>{allReceivables.length}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>Residents &amp; customers</div>
            </div>
          </div>

          {/* Bucket filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wide mr-1" style={{ color: "#69707D" }}>Filter by age:</span>
            {(["All", "0-30", "31-60", "61-90", "90+"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBucketFilter(b)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${bucketFilter === b ? "text-white border-transparent" : "border-[#E8EAF0] hover:bg-[#F7F8FA]"}`}
                style={bucketFilter === b ? { background: "#25205B" } : { color: "#69707D" }}
              >
                {b === "All" ? "All buckets" : `${b} days`}
                {b !== "All" && (
                  <span className="ml-1.5 opacity-70">({allReceivables.filter((r) => r.bucket === b).length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Receivables table */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                    {["Name", "Type", "Unit / Ref", "Amount Owed", "Due Date", "Days Overdue", "Bucket", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {filteredReceivables.map((r) => {
                    const rowBg = r.bucket === "90+" ? "#FEF2F2" : r.bucket === "61-90" ? "#FFFBEB" : "#ffffff";
                    const reminded = remindedIds.has(r.id);
                    return (
                      <tr key={r.id} style={{ background: rowBg }}>
                        <td className="px-4 py-3">
                          <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>{r.name}</div>
                          <div className="font-mono text-[10px]" style={{ color: "#6B9FE5" }}>{r.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${r.type === "Resident" ? "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: "#69707D" }}>
                          <div>{r.unit}</div>
                          <div className="font-mono text-[10px]" style={{ color: "#6B9FE5" }}>{r.ref}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-[13px]" style={{ color: r.bucket === "90+" ? "#b91c1c" : "#25205B" }}>
                          {fmt(r.amount)}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: "#69707D" }}>{r.dueDate}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[12px] font-bold ${r.bucket === "90+" ? "text-red-700" : r.bucket === "61-90" ? "text-amber-700" : "text-[#252731]"}`}>
                            {r.daysOverdue}
                          </span>
                          <span className="text-[10px] ml-1" style={{ color: "#B0B8C4" }}>days</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            r.bucket === "90+" ? "bg-red-50 text-red-700 border-red-200" :
                            r.bucket === "61-90" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            r.bucket === "31-60" ? "bg-orange-50 text-orange-700 border-orange-200" :
                            "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30"
                          }`}>
                            {r.bucket} days
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => sendReminder(r.id, r.name, r.amount)}
                            disabled={reminded}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${reminded ? "opacity-60 cursor-default" : "hover:bg-[#EAF2FC]"}`}
                            style={reminded
                              ? { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
                              : { border: "1px solid #D3E3F9", color: "#25205B" }
                            }
                          >
                            {reminded ? (
                              <>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Sent
                              </>
                            ) : (
                              <>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 2h8l-1 5H2L1 2zM1 2L5 5.5M9 2L5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Send Reminder
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReceivables.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[12px]" style={{ color: "#B0B8C4" }}>
                        No receivables in this age bucket.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "stays" && canAccessStays && <NagaStaysFinance />}

      {/* ── BULK ACTION TOOLBAR (floats bottom-center on approvals tab) ── */}
      {tab === "approvals" && (
        <div
          className="fixed bottom-6 left-1/2 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
          style={{
            background: "white",
            border: "1px solid #E8EAF0",
            transform: `translateX(-50%) translateY(${selectedApprovals.size > 0 ? "0" : "80px"})`,
            transition: "transform 0.25s ease, opacity 0.25s ease",
            opacity: selectedApprovals.size > 0 ? 1 : 0,
            pointerEvents: selectedApprovals.size > 0 ? "auto" : "none",
          }}
        >
          {/* Count badge */}
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-semibold"
            style={{ background: "#EAF2FC", color: "#25205B" }}
          >
            {selectedApprovals.size} selected
          </span>

          {/* Express Approve */}
          <button
            onClick={() => {
              setLocalApprovals((prev) =>
                prev.map((a) =>
                  selectedApprovals.has(a.id) ? { ...a, awaitingAction: "Express Approved" } : a
                )
              );
              setSelectedApprovals(new Set());
            }}
            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
            style={{ background: "#25205B", color: "white" }}
          >
            Express Approve
          </button>

          {/* Query */}
          <button
            onClick={() => {
              setLocalApprovals((prev) =>
                prev.map((a) =>
                  selectedApprovals.has(a.id) ? { ...a, awaitingAction: "Queried" } : a
                )
              );
              setSelectedApprovals(new Set());
            }}
            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border bg-transparent transition-colors hover:bg-amber-50"
            style={{ border: "1px solid #f59e0b", color: "#f59e0b" }}
          >
            Query
          </button>

          {/* Clear */}
          <button
            onClick={() => setSelectedApprovals(new Set())}
            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg text-[#69707D] hover:bg-[#F7F8FA] transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {expressModal && (
        <ExpressApprovalModal
          item={expressModal}
          onClose={() => setExpressModal(null)}
          onAction={handleApprovalAction}
        />
      )}

      {ctxMenu && (() => {
        const ctxDisb = DISBURSEMENTS.find((d) => d.id === ctxMenu.id);
        return (
          <div
            id="finance-ctx-menu"
            style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 999 }}
            className="bg-white border border-[#E8EAF0] rounded-xl shadow-xl py-1 min-w-[160px]"
          >
            <div
              className="px-4 py-2 text-[12px] font-medium text-[#252731] hover:bg-[#F7F8FA] cursor-pointer"
              onClick={() => { navigator.clipboard.writeText(ctxMenu.id); showToast("ID copied", "success"); setCtxMenu(null); }}
            >
              Copy ID
            </div>
            <div
              className="px-4 py-2 text-[12px] font-medium text-[#252731] hover:bg-[#F7F8FA] cursor-pointer"
              onClick={() => {
                const idx = DISBURSEMENTS.findIndex((d) => d.id === ctxMenu.id);
                if (idx >= 0) setDisbPage(Math.floor(idx / ROWS_PER_PAGE));
                setExpandedDis(ctxMenu.id);
                setCtxMenu(null);
              }}
            >
              View Details
            </div>
            <div
              className="px-4 py-2 text-[12px] font-medium text-[#252731] hover:bg-[#F7F8FA] cursor-pointer"
              onClick={() => {
                if (ctxDisb) {
                  exportCSV("finance-disbursements", ["ID", "Description", "Project", "Amount", "Date", "Status"],
                    [[ctxDisb.id, ctxDisb.payee, ctxDisb.project, ctxDisb.amount, ctxDisb.date, ctxDisb.status]]
                  );
                }
                setCtxMenu(null);
              }}
            >
              Export Row
            </div>
            <div className="mx-3 border-t border-[#E8EAF0] my-1" />
            {ctxDisb && ctxDisb.status !== "Completed" && (
              <div
                className="px-4 py-2 text-[12px] font-medium text-[#252731] hover:bg-[#F7F8FA] cursor-pointer"
                onClick={() => { showToast("Marked as Completed", "success"); setCtxMenu(null); }}
              >
                Mark as Completed
              </div>
            )}
          </div>
        );
      })()}

      {disbInvoice && <InvoiceModal data={disbInvoice} onClose={() => setDisbInvoice(null)} />}

      {/* ── DISPUTE MODAL ── */}
      {disputeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,13,46,0.6)" }} onClick={() => setDisputeModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden" style={{ animation: "modalIn 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#E8EAF0] flex items-center justify-between" style={{ background: disputeModal.mode === "raise" ? "#FEF2F2" : "#f0fdf4" }}>
              <h3 className="font-semibold text-[15px]" style={{ color: disputeModal.mode === "raise" ? "#991b1b" : "#166534", fontFamily: "var(--font-display)" }}>
                {disputeModal.mode === "raise" ? "⚠ Raise Payment Dispute" : "✓ Resolve Dispute"}
              </h3>
              <button onClick={() => setDisputeModal(null)} className="text-[20px] leading-none opacity-50 hover:opacity-100">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[13px]" style={{ color: "#69707D" }}>
                {disputeModal.mode === "raise"
                  ? "Flagging this disbursement will alert Finance and Admin. Only the CEO can raise or resolve disputes."
                  : "Provide a resolution note to close this dispute. This action is permanent and will be logged."}
              </p>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>
                  {disputeModal.mode === "raise" ? "Reason for dispute *" : "Resolution note *"}
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder={disputeModal.mode === "raise" ? "Describe the discrepancy or concern…" : "Explain how the dispute was resolved…"}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDisputeModal(null)} className="flex-1 py-3 rounded-xl text-[13px] font-semibold border" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                <button
                  disabled={!disputeReason.trim()}
                  onClick={() => {
                    const staffRaw2 = sessionStorage.getItem("naga_staff");
                    const sf = staffRaw2 ? JSON.parse(staffRaw2) : { name: "CEO", role: "ceo" };
                    if (disputeModal.mode === "raise") {
                      setDisputes((prev) => ({
                        ...prev,
                        [disputeModal.disbId]: {
                          reason: disputeReason,
                          raisedBy: sf.name,
                          raisedByRole: sf.role.toUpperCase(),
                          date: new Date().toISOString().slice(0, 10),
                          resolved: false,
                        },
                      }));
                      logActivity({
                        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                        actor: sf.name,
                        role: sf.role.toUpperCase(),
                        action: "Payment Disputed",
                        module: "Finance",
                        detail: `Raised dispute on disbursement ${disputeModal.disbId} — ${disputeReason}`,
                        ref: disputeModal.disbId,
                        severity: "critical",
                      });
                    } else {
                      setDisputes((prev) => ({
                        ...prev,
                        [disputeModal.disbId]: {
                          ...prev[disputeModal.disbId],
                          resolved: true,
                          resolvedNote: disputeReason,
                        },
                      }));
                      logActivity({
                        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                        actor: sf.name,
                        role: sf.role.toUpperCase(),
                        action: "Dispute Resolved",
                        module: "Finance",
                        detail: `Resolved dispute on disbursement ${disputeModal.disbId} — ${disputeReason}`,
                        ref: disputeModal.disbId,
                        severity: "info",
                      });
                    }
                    setDisputeModal(null);
                    setDisputeReason("");
                  }}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: disputeModal.mode === "raise" ? "#dc2626" : "#166534" }}
                >
                  {disputeModal.mode === "raise" ? "Raise Dispute" : "Confirm Resolution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, note, color }: { label: string; value: string; note?: string; color: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: "bg-[#25205B]", text: "text-white", border: "border-[#312a72]" },
    blue: { bg: "bg-[#EAF2FC]", text: "text-[#25205B]", border: "border-[#6B9FE5]/30" },
    amber: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className={`rounded-xl border px-5 py-4 ${c.bg} ${c.border}`}>
      <div className={`text-xs font-medium mb-1 ${color === "indigo" ? "text-[#6B9FE5]" : "text-[#69707D]"}`}>{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${c.text}`}>{value}</div>
      {note && <div className={`text-xs mt-1 ${color === "indigo" ? "text-[#6B9FE5]/80" : "text-[#69707D]"}`}>{note}</div>}
    </div>
  );
}
