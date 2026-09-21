import { useState, useRef } from "react";
import { PROPERTIES, PROJECTS } from "../data/dummy";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { showToast } from "../utils/toast";
import { useCountUp } from "../hooks/useCountUp";
import { exportCSV } from "../utils/csvExport";

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Reserved: "bg-amber-50 text-amber-700 border-amber-200",
    Sold: "bg-[#25205B] text-white border-[#25205B]",
    "NAGA Stays": "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/40",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

const COMMON_FEATURES = [
  "Swimming Pool", "24/7 Security", "Backup Power", "Smart Home Ready",
  "Covered Parking", "Fitted Kitchen", "Rooftop Terrace", "Private Lift",
  "Gym", "Concierge", "CCTV", "Landscaped Garden",
];

const PROPERTY_TYPES = [
  "Studio Apartment", "1-Bedroom Apartment", "2-Bedroom Apartment",
  "3-Bedroom Apartment", "4-Bedroom Apartment", "4-Bedroom Penthouse",
  "5-Bedroom Duplex", "Commercial Space",
];

type Property = {
  id: string; name: string; project: string; location: string; type: string;
  bedrooms: number; size: string; floor: number; status: string; price: number;
  features: string[]; image: string; customer?: string;
  totalUnits?: number; availableUnits?: number;
  reservations?: Reservation[];
};

type Reservation = {
  id: string; propertyId: string; unitRef: string;
  customerName: string; customerEmail: string; customerPhone: string;
  customerNIN: string; customerAddress: string;
  accountCreated: boolean; accountEmail: string; accountPassword: string;
  commitmentAmount: number; receipts: string[];
  date: string; status: "Pending" | "Confirmed" | "Completed";
  madeBy: string;
};

function FileUploadBtn({ onFiles, multiple, label, accept }: {
  onFiles: (urls: string[], names: string[]) => void;
  multiple?: boolean; label?: string; accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:bg-[#EAF2FC]"
        style={{ border: "1.5px dashed #D3E3F9", color: "#25205B", background: "#F7F8FA" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 4L7 1l3 3M1 10v1.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {label ?? "Upload file"}
      </button>
      <input ref={ref} type="file" className="hidden" multiple={multiple} accept={accept}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          const urls = files.map((f) => URL.createObjectURL(f));
          const names = files.map((f) => f.name);
          onFiles(urls, names);
          e.target.value = "";
        }} />
    </>
  );
}

/* ─── NEW / EDIT PROPERTY FORM ─── */
function PropertyForm({
  initial, projects, onSave, onCancel,
}: {
  initial?: Partial<Property>;
  projects: typeof PROJECTS;
  onSave: (p: Property) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [project, setProject] = useState(initial?.project ?? (projects[0]?.name ?? ""));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [type, setType] = useState(initial?.type ?? PROPERTY_TYPES[2]);
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms ?? 3);
  const [size, setSize] = useState(initial?.size ?? "");
  const [floor, setFloor] = useState(initial?.floor ?? 1);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [status, setStatus] = useState(initial?.status ?? "Available");
  const [customer, setCustomer] = useState(initial?.customer ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image ?? "");
  const [imageName, setImageName] = useState("");
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [customFeature, setCustomFeature] = useState("");
  const [saved, setSaved] = useState(false);
  const [totalUnits, setTotalUnits] = useState(initial?.totalUnits ?? 1);
  const [availableUnits, setAvailableUnits] = useState(initial?.availableUnits ?? 1);

  const toggleFeature = (f: string) => {
    setFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };
  const addCustom = () => {
    if (customFeature.trim()) { setFeatures((prev) => [...prev, customFeature.trim()]); setCustomFeature(""); }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;
    setSaved(true);
    setTimeout(() => {
      onSave({
        id: initial?.id ?? "PROP-" + Date.now(),
        name, project, location, type, bedrooms, size, floor, status, price, features,
        image: imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop&auto=format",
        totalUnits, availableUnits,
        ...(customer ? { customer } : {}),
      });
    }, 900);
  };

  if (saved) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dcfce7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>{isEdit ? "Property updated" : "Property listed"}</div>
        <div className="text-[12px]" style={{ color: "#69707D" }}>{name} has been {isEdit ? "updated" : "added to the portfolio"}.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>{isEdit ? "Edit Property" : "List New Property"}</h3>
          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Fill in the details below to {isEdit ? "update this listing" : "add it to the portfolio"}.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-[#F7F8FA]" style={{ color: "#69707D", border: "1px solid #E8EAF0" }}>
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Property Name <span style={{ color: "#dc2626" }}>*</span></label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Palm Court — Unit C1"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none focus:border-[#6B9FE5] transition-colors"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Project</label>
          <select value={project} onChange={(e) => setProject(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            {projects.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Maitama, Abuja"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
            {["Available", "Reserved", "Sold", "NAGA Stays"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Bedrooms</label>
          <input type="number" min={0} max={10} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Size</label>
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 185 sqm"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Floor</label>
          <input type="number" min={0} max={30} value={floor} onChange={(e) => setFloor(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Listed Price (₦) <span style={{ color: "#dc2626" }}>*</span></label>
          <input required type="number" min={0} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} placeholder="e.g. 85000000"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          {price > 0 && <div className="text-[11px] mt-1" style={{ color: "#6B9FE5" }}>{fmt(price)}</div>}
        </div>

        {(status === "Reserved" || status === "Sold") && (
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>{status === "Sold" ? "Sold To" : "Reserved By"}</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        )}

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Total Units in Development</label>
          <input type="number" min={1} value={totalUnits} onChange={(e) => { const v = Number(e.target.value); setTotalUnits(v); setAvailableUnits(Math.min(availableUnits, v)); }}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Units Available</label>
          <input type="number" min={0} max={totalUnits} value={availableUnits} onChange={(e) => setAvailableUnits(Math.min(Number(e.target.value), totalUnits))}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Property Image (optional)</label>
          <div className="flex items-center gap-3 flex-wrap">
            <FileUploadBtn label="Upload Image" accept="image/*" onFiles={(urls, names) => { setImageUrl(urls[0]); setImageName(names[0]); }} />
            {imageName && <span className="text-[11px] font-medium" style={{ color: "#69707D" }}>{imageName}</span>}
            {imageUrl && <img src={imageUrl} alt="preview" className="h-16 rounded-lg object-cover" />}
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Features & Amenities</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_FEATURES.map((f) => (
            <button
              key={f} type="button" onClick={() => toggleFeature(f)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all"
              style={{
                background: features.includes(f) ? "#EAF2FC" : "white",
                color: features.includes(f) ? "#25205B" : "#69707D",
                border: features.includes(f) ? "1.5px solid #D3E3F9" : "1px solid #E8EAF0",
              }}
            >
              {features.includes(f) ? "✓ " : ""}{f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customFeature} onChange={(e) => setCustomFeature(e.target.value)} placeholder="Add custom feature..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          <button type="button" onClick={addCustom} className="px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#EAF2FC", color: "#25205B" }}>Add</button>
        </div>
        {features.filter((f) => !COMMON_FEATURES.includes(f)).map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5 mt-2 mr-2 text-[11px] font-medium px-3 py-1.5 rounded-lg" style={{ background: "#EAF2FC", color: "#25205B", border: "1.5px solid #D3E3F9" }}>
            {f}
            <button type="button" onClick={() => toggleFeature(f)} style={{ color: "#6B9FE5" }}>×</button>
          </span>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-5 py-3 font-semibold text-[13px] rounded-xl transition-colors hover:bg-[#F7F8FA]"
          style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}>
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: "#25205B" }}>
          {isEdit ? "Save Changes" : "List Property"}
        </button>
      </div>
    </form>
  );
}

/* ─── RESERVATION MODAL ─── */
function ReservationModal({ prop, onConfirm, onClose }: {
  prop: Property;
  onConfirm: (res: Omit<Reservation, "id" | "propertyId">) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Step 1 — customer details
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cNIN, setCNIN] = useState("");
  const [cAddress, setCAddress] = useState("");
  // Account creation
  const [acctEmail, setAcctEmail] = useState("");
  const [acctPassword, setAcctPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  // Step 2 — payment
  const commitPct = 0.30;
  const commitAmt = Math.round(prop.price * commitPct);
  const [paidAmt, setPaidAmt] = useState(String(commitAmt));
  const [receipts, setReceipts] = useState<{ url: string; name: string }[]>([]);
  const [unitRef, setUnitRef] = useState("Unit A1");

  const step1Valid = cName.trim() && cEmail.trim() && cPhone.trim() && acctEmail.trim() && acctPassword.length >= 6;
  const step2Valid = receipts.length > 0;

  const handleConfirm = () => {
    onConfirm({
      unitRef, customerName: cName, customerEmail: cEmail, customerPhone: cPhone,
      customerNIN: cNIN, customerAddress: cAddress,
      accountCreated: true, accountEmail: acctEmail, accountPassword: acctPassword,
      commitmentAmount: parseFloat(paidAmt) || commitAmt,
      receipts: receipts.map((r) => r.url),
      date: new Date().toISOString().slice(0, 10),
      status: "Confirmed", madeBy: "Admin",
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,13,46,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[560px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8EAF0]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Create Reservation</h3>
              <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{prop.name} · {fmt(prop.price)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[{ n: 1, label: "Customer" }, { n: 2, label: "Payment" }, { n: 3, label: "Confirm" }].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-8" style={{ background: step >= s.n ? "#25205B" : "#E8EAF0" }} />}
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: step >= s.n ? "#25205B" : "#F7F8FA", color: step >= s.n ? "white" : "#B0B8C4", border: `1px solid ${step >= s.n ? "#25205B" : "#E8EAF0"}` }}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: step >= s.n ? "#25205B" : "#B0B8C4" }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* ── STEP 1: Customer details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#69707D" }}>Customer Information</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
                  <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Mrs. Aisha Bello"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Email <span style={{ color: "#dc2626" }}>*</span></label>
                  <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="customer@email.com"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Phone <span style={{ color: "#dc2626" }}>*</span></label>
                  <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="+234 xxx xxx xxxx"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>NIN / ID Number</label>
                  <input value={cNIN} onChange={(e) => setCNIN(e.target.value)} placeholder="National ID number"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Unit Reference</label>
                  <input value={unitRef} onChange={(e) => setUnitRef(e.target.value)} placeholder="e.g. Unit B3"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Residential Address</label>
                  <input value={cAddress} onChange={(e) => setCAddress(e.target.value)} placeholder="Current address"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8EAF0]">
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#25205B" }}>Create Portal Account</div>
                <div className="rounded-xl p-3 mb-3 text-[11px]" style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}>
                  An account will be created for the customer to track their reservation, make payments, and receive documents.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Account Email <span style={{ color: "#dc2626" }}>*</span></label>
                    <input type="email" value={acctEmail} onChange={(e) => setAcctEmail(e.target.value)} placeholder="Login email for portal"
                      className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Temporary Password <span style={{ color: "#dc2626" }}>*</span></label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={acctPassword} onChange={(e) => setAcctPassword(e.target.value)} placeholder="Min. 6 characters"
                        className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                        style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "#69707D" }}>
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Payment commitment ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#69707D" }}>Payment Commitment — 30%</div>
              <div className="rounded-xl p-4 space-y-2" style={{ background: "#25205B", color: "white" }}>
                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-60">Property Price</div>
                <div className="text-[22px] font-bold">{fmt(prop.price)}</div>
                <div className="h-px opacity-20 bg-white" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] opacity-60">30% Commitment Required</div>
                    <div className="text-[18px] font-bold" style={{ color: "#6B9FE5" }}>{fmt(commitAmt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] opacity-60">Balance on Completion</div>
                    <div className="text-[14px] font-semibold opacity-80">{fmt(prop.price - commitAmt)}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Amount Paid (₦)</label>
                <input type="number" value={paidAmt} onChange={(e) => setPaidAmt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                {parseFloat(paidAmt) < commitAmt && paidAmt !== "" && (
                  <div className="text-[11px] mt-1" style={{ color: "#f59e0b" }}>Amount is below the 30% minimum of {fmt(commitAmt)}</div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#69707D" }}>Payment Receipts <span style={{ color: "#dc2626" }}>*</span></label>
                <FileUploadBtn label="Upload Receipt(s)" multiple accept="image/*,application/pdf"
                  onFiles={(urls, names) => setReceipts((prev) => [...prev, ...urls.map((url, i) => ({ url, name: names[i] }))])} />
                {receipts.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {receipts.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 1h8v10H2V1z" stroke="#166534" strokeWidth="1.2" strokeLinecap="round" /><path d="M4 4h4M4 6h4M4 8h2" stroke="#166534" strokeWidth="1" strokeLinecap="round" /></svg>
                        <span className="flex-1 truncate" style={{ color: "#166534" }}>{r.name}</span>
                        <button type="button" onClick={() => setReceipts((prev) => prev.filter((_, j) => j !== i))} style={{ color: "#dc2626" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Summary ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 space-y-3" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#69707D" }}>Reservation Summary</div>
                {[
                  { label: "Property", value: prop.name },
                  { label: "Unit Ref", value: unitRef },
                  { label: "Customer", value: cName },
                  { label: "Contact", value: `${cEmail} · ${cPhone}` },
                  { label: "Account Email", value: acctEmail },
                  { label: "Commitment Paid", value: fmt(parseFloat(paidAmt) || commitAmt) },
                  { label: "Receipts Uploaded", value: `${receipts.length} document(s)` },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-3 text-[12px]">
                    <span style={{ color: "#69707D" }}>{r.label}</span>
                    <span className="font-semibold text-right" style={{ color: "#252731" }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3.5 text-[11px]" style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534" }}>
                Upon confirmation, the unit will be marked as Reserved and the customer account will be activated. The balance of {fmt(prop.price - (parseFloat(paidAmt) || commitAmt))} remains due.
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 border-t border-[#E8EAF0] pt-4">
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>← Back</button>
          ) : (
            <button onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>Cancel</button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : false}
              className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white disabled:opacity-40"
              style={{ background: "#25205B" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleConfirm} className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#25205B" }}>
              Confirm Reservation
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ─── COMPARISON DRAWER ─── */
function ComparisonDrawer({
  properties,
  onRemove,
  onClear,
}: {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const visible = properties.length >= 2;

  // Compute shared features (all selected properties have them) vs unique per property
  const allFeatureSets = properties.map((p) => new Set(p.features));
  const sharedFeatures = properties.length > 0
    ? properties[0].features.filter((f) => allFeatureSets.every((s) => s.has(f)))
    : [];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-[#E8EAF0] shadow-2xl"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8EAF0]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#69707D" }}>
            Comparing
          </span>
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
            style={{ background: "#25205B" }}
          >
            {properties.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-[#F7F8FA] transition-colors"
          style={{ color: "#69707D", border: "1px solid #E8EAF0" }}
        >
          Clear All
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "280px" }}>
        <div className="flex gap-0 min-w-0" style={{ minHeight: "220px" }}>
          {properties.map((p) => {
            const uniqueFeatures = p.features.filter((f) => !sharedFeatures.includes(f));
            return (
              <div
                key={p.id}
                className="flex-1 min-w-[200px] max-w-[360px] border-r border-[#E8EAF0] last:border-r-0 px-4 py-3 flex flex-col gap-2"
              >
                {/* Image + remove button */}
                <div className="relative h-24 rounded-lg overflow-hidden bg-[#EAF2FC] flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemove(p.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: "rgba(255,255,255,0.9)", color: "#252731", border: "1px solid #E8EAF0" }}
                    title="Remove from comparison"
                  >
                    ×
                  </button>
                </div>

                {/* Property name + location */}
                <div>
                  <div className="text-[13px] font-semibold leading-tight" style={{ color: "#252731" }}>{p.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>{p.location}</div>
                </div>

                {/* Price */}
                <div className="text-[15px] font-bold" style={{ color: "#25205B" }}>{fmt(p.price)}</div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  {[
                    { label: "Type", value: p.type },
                    { label: "Beds", value: `${p.bedrooms}` },
                    { label: "Size", value: p.size },
                    { label: "Floor", value: `${p.floor}` },
                  ].map((s) => (
                    <div key={s.label}>
                      <span style={{ color: "#B0B8C4" }}>{s.label} </span>
                      <span className="font-semibold" style={{ color: "#252731" }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Status badge */}
                <div><StatusBadge status={p.status} /></div>

                {/* Feature overlap */}
                <div className="border-t border-[#E8EAF0] pt-2 mt-1 space-y-1">
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#B0B8C4" }}>Features</div>
                  {sharedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sharedFeatures.map((f) => (
                        <span
                          key={f}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {uniqueFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {uniqueFeatures.map((f) => (
                        <span
                          key={f}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: "#F7F8FA", color: "#B0B8C4", border: "1px solid #E8EAF0" }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.features.length === 0 && (
                    <span className="text-[9px]" style={{ color: "#B0B8C4" }}>No features listed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN MODULE ─── */
export default function RealEstate() {
  const [localProperties, setLocalProperties] = useState<Property[]>(
    (PROPERTIES as Property[]).map((p) => ({
      ...p,
      totalUnits: p.totalUnits ?? Math.floor(Math.random() * 8) + 4,
      availableUnits: p.availableUnits ?? (p.status === "Available" ? Math.floor(Math.random() * 4) + 1 : 0),
      reservations: p.reservations ?? [],
    }))
  );
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reservationTarget, setReservationTarget] = useState<Property | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; propId: string } | null>(null);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const filters = ["All", "Available", "Reserved", "Sold", "NAGA Stays"];
  const filtered = filter === "All" ? localProperties : localProperties.filter((p) => p.status === filter);
  const prop = selected ? localProperties.find((p) => p.id === selected) : null;

  const handleSaveProperty = (p: Property) => {
    setLocalProperties((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      if (exists) return prev.map((x) => x.id === p.id ? p : x);
      return [p, ...prev];
    });
    setShowNewForm(false);
    setEditingId(null);
    setSelected(p.id);
    showToast(editingId ? "Property updated successfully." : "New property listed.", "success");
  };

  const handleReservation = (res: Omit<Reservation, "id" | "propertyId">) => {
    if (!reservationTarget) return;
    const newRes: Reservation = { ...res, id: "RES-" + Date.now(), propertyId: reservationTarget.id };
    setLocalProperties((prev) => prev.map((p) => {
      if (p.id !== reservationTarget.id) return p;
      const newAvail = Math.max(0, (p.availableUnits ?? 1) - 1);
      return {
        ...p,
        status: newAvail === 0 ? "Reserved" : p.status,
        availableUnits: newAvail,
        customer: res.customerName,
        reservations: [...(p.reservations ?? []), newRes],
      };
    }));
    setReservationTarget(null);
    showToast(`${reservationTarget.name} — ${res.unitRef} reserved for ${res.customerName}.`, "success");
  };

  const handleStatusChange = (propId: string, newStatus: string) => {
    setLocalProperties((prev) => prev.map((p) => p.id === propId ? { ...p, status: newStatus } : p));
    setSelected(null);
    showToast("Property status updated.", "success");
  };

  const chartData = [
    { status: "Available", count: localProperties.filter((p) => p.status === "Available").length },
    { status: "Reserved", count: localProperties.filter((p) => p.status === "Reserved").length },
    { status: "Sold", count: localProperties.filter((p) => p.status === "Sold").length },
    { status: "NAGA Stays", count: localProperties.filter((p) => p.status === "NAGA Stays").length },
  ];

  const totalUnitsAvailable = localProperties.reduce((acc, p) => acc + (p.availableUnits ?? 0), 0);
  const totalUnits = localProperties.reduce((acc, p) => acc + (p.totalUnits ?? 1), 0);

  const availCount = useCountUp(localProperties.filter((p) => p.status === "Available").length, { duration: 900 });
  const reservedCount = useCountUp(localProperties.filter((p) => p.status === "Reserved").length, { duration: 900 });
  const soldCount = useCountUp(localProperties.filter((p) => p.status === "Sold").length, { duration: 900 });
  const nagaCount = useCountUp(localProperties.filter((p) => p.status === "NAGA Stays").length, { duration: 900 });
  const totalUnitsAvailableAnimated = useCountUp(totalUnitsAvailable, { duration: 900 });
  const totalUnitsAnimated = useCountUp(totalUnits, { duration: 900 });

  const statusCounts: Record<string, number> = {
    Available: availCount,
    Reserved: reservedCount,
    Sold: soldCount,
    "NAGA Stays": nagaCount,
  };

  // Property detail view
  if (prop && !editingId) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-[1000px]">
        {reservationTarget && (
          <ReservationModal prop={reservationTarget} onConfirm={handleReservation} onClose={() => setReservationTarget(null)} />
        )}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setSelected(null)} className="text-[#6B9FE5] hover:underline font-medium">Real Estate</button>
            <span className="text-[#69707D]">/</span>
            <span className="text-[#252731] font-medium">{prop.name}</span>
          </div>
          <button
            onClick={() => setEditingId(prop.id)}
            className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-[#EAF2FC]"
            style={{ border: "1px solid #D3E3F9", color: "#25205B" }}>
            Edit Property
          </button>
        </div>

        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          {/* Hero image */}
          <div className="relative h-64 bg-[#EAF2FC]">
            <img src={prop.image} alt={prop.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <div>
                <h2 className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{prop.name}</h2>
                <p className="text-white/80 text-sm">{prop.location}</p>
              </div>
              <StatusBadge status={prop.status} />
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Key Facts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Type", value: prop.type },
                { label: "Size", value: prop.size },
                { label: "Floor", value: `Floor ${prop.floor}` },
                { label: "Bedrooms", value: `${prop.bedrooms} Bedrooms` },
              ].map((f) => (
                <div key={f.label} className="bg-[#F7F8FA] rounded-lg px-4 py-3 border border-[#E8EAF0]">
                  <div className="text-[#69707D] text-[10px] font-semibold uppercase tracking-wide">{f.label}</div>
                  <div className="text-[#252731] font-semibold text-sm mt-0.5">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Unit availability */}
            {(prop.totalUnits ?? 1) > 1 && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Unit Availability</div>
                  <div className="text-[12px] font-semibold" style={{ color: "#25205B" }}>
                    {prop.availableUnits} of {prop.totalUnits} available
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8EAF0" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${((prop.availableUnits ?? 0) / (prop.totalUnits ?? 1)) * 100}%`, background: (prop.availableUnits ?? 0) === 0 ? "#dc2626" : "#25205B" }} />
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span style={{ color: "#166534" }}>{prop.availableUnits} available</span>
                  <span style={{ color: "#69707D" }}>·</span>
                  <span style={{ color: "#92400e" }}>{(prop.totalUnits ?? 1) - (prop.availableUnits ?? 0)} reserved/sold</span>
                  <span style={{ color: "#69707D" }}>·</span>
                  <span style={{ color: "#69707D" }}>{prop.totalUnits} total units</span>
                </div>
              </div>
            )}

            {/* Price + CTA */}
            <div className="flex items-center justify-between p-4 bg-[#25205B] rounded-xl gap-3 flex-wrap">
              <div>
                <div className="text-[#6B9FE5] text-xs font-medium">Listed Price per Unit</div>
                <div className="text-white text-2xl font-bold mt-0.5">{fmt(prop.price)}</div>
                <div className="text-[#6B9FE5] text-[10px] mt-0.5">30% commitment = {fmt(Math.round(prop.price * 0.3))}</div>
              </div>
              {prop.customer && (
                <div className="text-right">
                  <div className="text-[#6B9FE5] text-xs font-medium">{prop.status === "Sold" ? "Sold to" : "Reserved by"}</div>
                  <div className="text-white font-semibold">{prop.customer}</div>
                </div>
              )}
              {(prop.availableUnits ?? 0) > 0 && (
                <button
                  onClick={() => setReservationTarget(prop)}
                  className="bg-[#6B9FE5] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#8eb6ec] transition-colors">
                  Create Reservation
                </button>
              )}
            </div>

            {/* Reservations list */}
            {(prop.reservations?.length ?? 0) > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Reservations ({prop.reservations!.length})</div>
                <div className="space-y-2">
                  {prop.reservations!.map((r) => (
                    <div key={r.id} className="rounded-xl p-4 space-y-2" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[13px]" style={{ color: "#252731" }}>{r.customerName}</span>
                          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#166534" }}>{r.status}</span>
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: "#6B9FE5" }}>{r.unitRef} · {r.id}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-[11px]" style={{ color: "#69707D" }}>
                        <span>{r.customerEmail}</span>
                        <span>{r.customerPhone}</span>
                        <span>Account: {r.accountEmail}</span>
                        <span className="font-semibold" style={{ color: "#166534" }}>Paid: {fmt(r.commitmentAmount)}</span>
                      </div>
                      {r.receipts.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {r.receipts.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                              style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                              Receipt {i + 1} ↗
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px]" style={{ color: "#B0B8C4" }}>Made {r.date} by {r.madeBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status management */}
            <div className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>Update Status</div>
              <div className="flex flex-wrap gap-2">
                {["Available", "Reserved", "Sold", "NAGA Stays"].filter((s) => s !== prop.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(prop.id, s)}
                    className="text-[12px] font-semibold px-4 py-2 rounded-lg border transition-all hover:shadow-sm"
                    style={{ border: "1px solid #E8EAF0", background: "white", color: "#252731" }}
                  >
                    Mark as {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-[#252731] font-semibold text-sm mb-3">Features & Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {prop.features.map((f) => (
                  <span key={f} className="px-3 py-1.5 bg-[#EAF2FC] text-[#25205B] border border-[#6B9FE5]/30 rounded-lg text-xs font-medium">{f}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[#E8EAF0] text-sm">
              <span className="text-[#69707D]">Project</span>
              <span className="text-[#252731] font-semibold">{prop.project}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit form view
  if (editingId) {
    const editing = localProperties.find((p) => p.id === editingId);
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-[900px]">
        <div className="flex items-center gap-2 text-sm mb-2">
          <button onClick={() => setEditingId(null)} className="text-[#6B9FE5] hover:underline font-medium">← Back</button>
        </div>
        <PropertyForm
          initial={editing}
          projects={PROJECTS}
          onSave={handleSaveProperty}
          onCancel={() => setEditingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Real Estate</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Property portfolio — {localProperties.length} units across all projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(
              "real-estate-portfolio",
              ["ID", "Name", "Project", "Location", "Type", "Bedrooms", "Size", "Floor", "Status", "Price", "Customer"],
              filtered.map((p) => [p.id, p.name, p.project, p.location, p.type, p.bedrooms, p.size, p.floor, p.status, p.price, p.customer ?? ""])
            )}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-[#25205B] hover:bg-[#EAF2FC]"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors"
          >
            + List New Property
          </button>
        </div>
      </div>

      {showNewForm && (
        <PropertyForm
          projects={PROJECTS}
          onSave={handleSaveProperty}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Unit availability overview */}
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>Portfolio at a Glance</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{totalUnitsAvailableAnimated} of {totalUnitsAnimated} total units available across all developments</div>
          </div>
          <div className="flex gap-4 text-[12px]">
            {chartData.map((d) => (
              <div key={d.status} className="text-center">
                <div className="text-[20px] font-bold" style={{ color: "#25205B" }}>{d.count}</div>
                <div style={{ color: "#69707D" }}>{d.status}</div>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E8EAF0" }} />
            <Bar dataKey="count" fill="#25205B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available", color: "emerald" },
          { label: "Reserved", color: "amber" },
          { label: "Sold", color: "indigo" },
          { label: "NAGA Stays", color: "blue" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.label)}
            className={`text-left rounded-xl border px-5 py-4 transition-all hover:shadow-sm bg-white border-[#E8EAF0] ${filter === s.label ? "ring-2 ring-[#6B9FE5]" : ""}`}
          >
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-[#252731] text-3xl font-bold mt-1">{statusCounts[s.label]}</div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg w-fit">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Property Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5${compareIds.length >= 2 ? " pb-[340px]" : ""}`}>
        {filtered.map((p) => {
          const isComparing = compareIds.includes(p.id);
          const canAdd = !isComparing && compareIds.length < 3;
          return (
            <div
              key={p.id}
              className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group${isComparing ? " border-[#6B9FE5] ring-2 ring-[#6B9FE5]/40" : " border-[#E8EAF0] hover:border-[#6B9FE5]/30"}`}
              onClick={() => setSelected(p.id)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, propId: p.id }); }}
            >
              <div className="relative h-44 bg-[#EAF2FC] overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3"><StatusBadge status={p.status} /></div>
              </div>
              <div className="p-4">
                <h3 className="text-[#252731] font-semibold text-sm">{p.name}</h3>
                <p className="text-[#69707D] text-xs mt-0.5">{p.location}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#69707D]">
                  <span>{p.bedrooms} bed</span>
                  <span>·</span>
                  <span>{p.size}</span>
                  <span>·</span>
                  <span>Floor {p.floor}</span>
                </div>
                {(p.totalUnits ?? 1) > 1 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span style={{ color: "#69707D" }}>Units</span>
                      <span className="font-semibold" style={{ color: (p.availableUnits ?? 0) === 0 ? "#dc2626" : "#25205B" }}>
                        {p.availableUnits} / {p.totalUnits} available
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EAF0" }}>
                      <div className="h-full rounded-full" style={{ width: `${((p.availableUnits ?? 0) / (p.totalUnits ?? 1)) * 100}%`, background: (p.availableUnits ?? 0) === 0 ? "#dc2626" : "#25205B" }} />
                    </div>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Compare toggle button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isComparing || canAdd) toggleCompare(p.id); }}
                      disabled={!isComparing && !canAdd}
                      className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        border: isComparing ? "1.5px solid #6B9FE5" : "1.5px solid #D3E3F9",
                        background: isComparing ? "#EAF2FC" : "white",
                        color: isComparing ? "#25205B" : "#6B9FE5",
                      }}
                      title={isComparing ? "Remove from comparison" : canAdd ? "Add to comparison" : "Max 3 properties"}
                    >
                      {isComparing ? "✓ Added" : "⊕ Compare"}
                    </button>
                    <div className="text-[#25205B] font-bold text-base truncate">{fmt(p.price)}</div>
                  </div>
                  {p.customer && <div className="text-[#69707D] text-xs truncate max-w-[80px]">{p.customer}</div>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-[13px]" style={{ color: "#69707D" }}>
            No properties match this filter.
          </div>
        )}
      </div>

      {/* Context Menu */}
      {ctxMenu && (() => {
        const ctxProp = localProperties.find((p) => p.id === ctxMenu.propId);
        if (!ctxProp) return null;
        const menuItemCls = "w-full text-left px-4 py-2 text-[12px] hover:bg-[#F7F8FA] transition-colors";
        const close = () => setCtxMenu(null);
        return (
          <>
            <div className="fixed inset-0 z-[998]" onClick={close} onContextMenu={(e) => { e.preventDefault(); close(); }} />
            <div
              style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 999 }}
              className="bg-white border border-[#E8EAF0] rounded-xl shadow-xl py-1 min-w-[180px] text-[12px]"
            >
              <button className={menuItemCls} style={{ color: "#252731" }} onClick={() => { setSelected(ctxMenu.propId); close(); }}>
                View Details
              </button>
              <button className={menuItemCls} style={{ color: "#252731" }} onClick={() => { navigator.clipboard.writeText(ctxMenu.propId); showToast("Copied", "success"); close(); }}>
                Copy Property ID
              </button>
              <button
                className={menuItemCls}
                style={{ color: compareIds.includes(ctxMenu.propId) ? "#25205B" : (compareIds.length >= 3 && !compareIds.includes(ctxMenu.propId) ? "#B0B8C4" : "#252731") }}
                onClick={() => { toggleCompare(ctxMenu.propId); close(); }}
                disabled={compareIds.length >= 3 && !compareIds.includes(ctxMenu.propId)}
              >
                {compareIds.includes(ctxMenu.propId) ? "Remove from Compare" : "Add to Compare"}
              </button>
              <div className="my-1 border-t border-[#E8EAF0]" />
              {["Available", "Reserved", "Sold", "NAGA Stays"]
                .filter((s) => s !== ctxProp.status)
                .map((s) => (
                  <button
                    key={s}
                    className={menuItemCls}
                    style={{ color: "#252731" }}
                    onClick={() => { handleStatusChange(ctxProp.id, s); close(); }}
                  >
                    Mark as {s}
                  </button>
                ))}
            </div>
          </>
        );
      })()}

      {/* Comparison Drawer */}
      <ComparisonDrawer
        properties={localProperties.filter((p) => compareIds.includes(p.id))}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        onClear={() => setCompareIds([])}
      />
    </div>
  );
}
