import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type CircularCategory = "Maintenance" | "Finance" | "Security" | "General";
interface Circular {
  id: string;
  date: string;
  title: string;
  category: CircularCategory;
  estate: string;
  fileSize: string;
}

type DocType = "Lease Agreement" | "Title Deed" | "Addendum";
type DocStatus = "Active" | "Expired";
interface LeaseDoc {
  id: string;
  resident: string;
  unit: string;
  estate: string;
  docType: DocType;
  dateIssued: string;
  status: DocStatus;
}

type PayMethod = "Bank Transfer" | "Card" | "Cash" | "USSD";
interface PayReceipt {
  id: string;
  resident: string;
  estate: string;
  unit: string;
  amount: number;
  date: string;
  method: PayMethod;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const CIRCULARS: Circular[] = [
  { id: "CIR-001", date: "2026-08-22", title: "Q3 2026 Service Charge Notice — All Estates", category: "Finance", estate: "All Estates", fileSize: "142 KB" },
  { id: "CIR-002", date: "2026-08-18", title: "Generator Maintenance Schedule — September 2026", category: "Maintenance", estate: "Palm Estate", fileSize: "89 KB" },
  { id: "CIR-003", date: "2026-08-14", title: "Security Protocol Update: Visitor Access Policy", category: "Security", estate: "All Estates", fileSize: "215 KB" },
  { id: "CIR-004", date: "2026-08-09", title: "Pool Area Closure — Resurfacing Works 15–20 Aug", category: "Maintenance", estate: "Sapphire Court", fileSize: "67 KB" },
  { id: "CIR-005", date: "2026-07-30", title: "Annual General Meeting — Residents Notice", category: "General", estate: "All Estates", fileSize: "308 KB" },
  { id: "CIR-006", date: "2026-07-21", title: "Outstanding Service Charge Reminder — Q2 2026", category: "Finance", estate: "All Estates", fileSize: "174 KB" },
  { id: "CIR-007", date: "2026-07-10", title: "CCTV System Upgrade — Phase 2 Completion", category: "Security", estate: "Green Meadows", fileSize: "93 KB" },
  { id: "CIR-008", date: "2026-06-28", title: "Estate Landscaping & Road Repair — Works Notice", category: "Maintenance", estate: "Palm Estate", fileSize: "119 KB" },
];

const LEASE_DOCS: LeaseDoc[] = [
  { id: "DOC-001", resident: "Mr. Seun Adeleke", unit: "A7", estate: "Palm Estate", docType: "Lease Agreement", dateIssued: "2024-03-01", status: "Active" },
  { id: "DOC-002", resident: "Mrs. Grace Okafor", unit: "C3", estate: "Sapphire Court", docType: "Title Deed", dateIssued: "2023-11-15", status: "Active" },
  { id: "DOC-003", resident: "Mr. Emeka Chukwu", unit: "B12", estate: "Green Meadows", docType: "Lease Agreement", dateIssued: "2022-06-01", status: "Expired" },
  { id: "DOC-004", resident: "Mrs. Adaeze Ike", unit: "D2", estate: "Palm Estate", docType: "Addendum", dateIssued: "2025-01-10", status: "Active" },
  { id: "DOC-005", resident: "Mr. Tunde Fashola", unit: "E9", estate: "Sapphire Court", docType: "Title Deed", dateIssued: "2021-08-20", status: "Expired" },
  { id: "DOC-006", resident: "Ms. Ngozi Balogun", unit: "A1", estate: "Green Meadows", docType: "Lease Agreement", dateIssued: "2025-05-01", status: "Active" },
];

const RECEIPTS: PayReceipt[] = [
  { id: "RCT-0081", resident: "Mr. Seun Adeleke", estate: "Palm Estate", unit: "A7", amount: 450000, date: "2026-08-01", method: "Bank Transfer" },
  { id: "RCT-0082", resident: "Mrs. Grace Okafor", estate: "Sapphire Court", unit: "C3", amount: 520000, date: "2026-08-03", method: "Card" },
  { id: "RCT-0083", resident: "Ms. Ngozi Balogun", estate: "Green Meadows", unit: "A1", amount: 390000, date: "2026-08-05", method: "Bank Transfer" },
  { id: "RCT-0084", resident: "Mrs. Adaeze Ike", estate: "Palm Estate", unit: "D2", amount: 450000, date: "2026-08-08", method: "USSD" },
  { id: "RCT-0085", resident: "Mr. Tunde Fashola", estate: "Sapphire Court", unit: "E9", amount: 520000, date: "2026-08-10", method: "Bank Transfer" },
  { id: "RCT-0086", resident: "Mr. Emeka Chukwu", estate: "Green Meadows", unit: "B12", amount: 390000, date: "2026-08-14", method: "Card" },
  { id: "RCT-0087", resident: "Mr. Seun Adeleke", estate: "Palm Estate", unit: "A7", amount: 225000, date: "2026-08-20", method: "Bank Transfer" },
  { id: "RCT-0088", resident: "Mrs. Grace Okafor", estate: "Sapphire Court", unit: "C3", amount: 260000, date: "2026-08-25", method: "Cash" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function handleDownload(label: string) {
  alert(`Downloading: ${label}…`);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<CircularCategory, { bg: string; color: string }> = {
  Maintenance: { bg: "#FFF3CD", color: "#856404" },
  Finance:     { bg: "#D1ECF1", color: "#0C5460" },
  Security:    { bg: "#F8D7DA", color: "#721C24" },
  General:     { bg: "#E8EAF0", color: "#4A5568" },
};

function CategoryPill({ category }: { category: CircularCategory }) {
  const c = CATEGORY_COLORS[category];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color }}
    >
      {category}
    </span>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const active = status === "Active";
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: active ? "#D4EDDA" : "#F8D7DA",
        color: active ? "#155724" : "#721C24",
      }}
    >
      {status}
    </span>
  );
}

function DownloadBtn({ label }: { label: string }) {
  return (
    <button
      onClick={() => handleDownload(label)}
      className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-opacity hover:opacity-80 whitespace-nowrap"
      style={{ background: "#25205B", color: "white" }}
    >
      Download PDF
    </button>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        width="13" height="13" viewBox="0 0 12 12" fill="none"
        style={{ color: "#B0B8C4" }}
      >
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 text-[12px] rounded-lg outline-none transition-colors"
        style={{
          background: "white",
          border: "1px solid #E8EAF0",
          color: "#252731",
        }}
      />
    </div>
  );
}

// ── Tab: Circulars ─────────────────────────────────────────────────────────────

function CircularsTab() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<CircularCategory | "All">("All");

  const filtered = useMemo(() => {
    return CIRCULARS.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || c.title.toLowerCase().includes(q) || c.estate.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const matchCat = catFilter === "All" || c.category === catFilter;
      return matchQ && matchCat;
    });
  }, [search, catFilter]);

  const cats: Array<CircularCategory | "All"> = ["All", "Maintenance", "Finance", "Security", "General"];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search circulars by title or estate…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: catFilter === c ? "#25205B" : "white",
                color: catFilter === c ? "white" : "#69707D",
                border: "1px solid " + (catFilter === c ? "#25205B" : "#E8EAF0"),
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
              {["Date", "Title", "Category", "Estate", "Size", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold" style={{ color: "#69707D" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px]" style={{ color: "#B0B8C4" }}>No circulars found</td>
              </tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-[#FAFBFF] transition-colors">
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                <td className="px-4 py-3">
                  <div className="text-[13px] font-medium" style={{ color: "#252731" }}>{c.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{c.id}</div>
                </td>
                <td className="px-4 py-3"><CategoryPill category={c.category} /></td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D" }}>{c.estate}</td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#B0B8C4" }}>{c.fileSize}</td>
                <td className="px-4 py-3 text-right"><DownloadBtn label={`${c.id} — ${c.title}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-[13px]" style={{ color: "#B0B8C4" }}>No circulars found</div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-4" style={{ border: "1px solid #E8EAF0" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold leading-snug" style={{ color: "#252731" }}>{c.title}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{c.id} · {c.estate}</div>
              </div>
              <CategoryPill category={c.category} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px]" style={{ color: "#69707D" }}>{fmtDate(c.date)} · {c.fileSize}</span>
              <DownloadBtn label={`${c.id} — ${c.title}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Lease & Title Documents ──────────────────────────────────────────────

function LeaseDocsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "All">("All");

  const filtered = useMemo(() => {
    return LEASE_DOCS.filter(d => {
      const q = search.toLowerCase();
      const matchQ = !q || d.resident.toLowerCase().includes(q) || d.unit.toLowerCase().includes(q) || d.estate.toLowerCase().includes(q) || d.docType.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || d.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by resident, unit, or estate…" />
        </div>
        <div className="flex gap-2">
          {(["All", "Active", "Expired"] as Array<DocStatus | "All">).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: statusFilter === s ? "#25205B" : "white",
                color: statusFilter === s ? "white" : "#69707D",
                border: "1px solid " + (statusFilter === s ? "#25205B" : "#E8EAF0"),
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
              {["Resident", "Unit", "Estate", "Document Type", "Date Issued", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold" style={{ color: "#69707D" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: "#B0B8C4" }}>No documents found</td>
              </tr>
            )}
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-[#FAFBFF] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-[13px] font-medium" style={{ color: "#252731" }}>{d.resident}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{d.id}</div>
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D" }}>{d.unit}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D" }}>{d.estate}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#252731" }}>{d.docType}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D", whiteSpace: "nowrap" }}>{fmtDate(d.dateIssued)}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-right"><DownloadBtn label={`${d.id} — ${d.resident} ${d.docType}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-[13px]" style={{ color: "#B0B8C4" }}>No documents found</div>
        )}
        {filtered.map(d => (
          <div key={d.id} className="bg-white rounded-xl p-4" style={{ border: "1px solid #E8EAF0" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: "#252731" }}>{d.resident}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{d.docType} · {d.unit} · {d.estate}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{d.id}</div>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px]" style={{ color: "#69707D" }}>Issued {fmtDate(d.dateIssued)}</span>
              <DownloadBtn label={`${d.id} — ${d.resident} ${d.docType}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Payment Receipts ─────────────────────────────────────────────────────

function PayReceiptsTab() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return RECEIPTS;
    return RECEIPTS.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.resident.toLowerCase().includes(q) ||
      r.estate.toLowerCase().includes(q) ||
      r.unit.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div>
      {/* Search */}
      <div className="mb-5 max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by resident, estate, or receipt ID…" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
              {["Receipt ID", "Resident", "Estate", "Unit", "Amount", "Date", "Method", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold" style={{ color: "#69707D" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px]" style={{ color: "#B0B8C4" }}>No receipts found</td>
              </tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-[#FAFBFF] transition-colors">
                <td className="px-4 py-3">
                  <span className="text-[12px] font-mono font-semibold" style={{ color: "#25205B" }}>{r.id}</span>
                </td>
                <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "#252731" }}>{r.resident}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D" }}>{r.estate}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D" }}>{r.unit}</td>
                <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#252731" }}>{fmtAmount(r.amount)}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "#69707D", whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{r.method}</span>
                </td>
                <td className="px-4 py-3 text-right"><DownloadBtn label={`${r.id} — ${r.resident}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-[13px]" style={{ color: "#B0B8C4" }}>No receipts found</div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4" style={{ border: "1px solid #E8EAF0" }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-mono font-semibold" style={{ color: "#25205B" }}>{r.id}</span>
                <div className="text-[13px] font-semibold mt-0.5" style={{ color: "#252731" }}>{r.resident}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{r.unit} · {r.estate}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold" style={{ color: "#252731" }}>{fmtAmount(r.amount)}</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{r.method}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px]" style={{ color: "#69707D" }}>{fmtDate(r.date)}</span>
              <DownloadBtn label={`${r.id} — ${r.resident}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Tab = "circulars" | "lease" | "receipts";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "circulars", label: "Circulars & Notices" },
  { id: "lease", label: "Lease & Title Documents" },
  { id: "receipts", label: "Payment Receipts" },
];

export default function DocumentCentre() {
  const [activeTab, setActiveTab] = useState<Tab>("circulars");

  return (
    <div className="p-4 md:p-8" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[22px] md:text-[26px] font-bold leading-tight" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>
          Document Centre
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "#69707D" }}>
          Estate circulars, resident lease documents, and payment receipts — all in one place.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#F0F2F5" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-all"
            style={{
              background: activeTab === tab.id ? "white" : "transparent",
              color: activeTab === tab.id ? "#25205B" : "#69707D",
              boxShadow: activeTab === tab.id ? "0 1px 4px rgba(37,32,91,0.10)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — white card */}
      <div className="bg-white rounded-2xl p-4 md:p-6" style={{ border: "1px solid #E8EAF0", boxShadow: "0 1px 6px rgba(37,32,91,0.05)" }}>
        {activeTab === "circulars" && <CircularsTab />}
        {activeTab === "lease" && <LeaseDocsTab />}
        {activeTab === "receipts" && <PayReceiptsTab />}
      </div>
    </div>
  );
}
