import { useState } from "react";
import { CUSTOMERS, PROPERTIES } from "../data/dummy";

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

type Payment = { ref: string; date: string; amount: number; type: string; status: string };
type Customer = {
  id: string; name: string; phone: string; email: string; location: string;
  property: string; purchasePrice: number; paymentPlan: string;
  totalPaid: number; outstanding: number; status: string;
  lastPayment?: string; nextPaymentDue?: string; nextPaymentAmount?: number;
  payments: Payment[];
};

const PAYMENT_TYPES = ["Initial Deposit", "Reservation Deposit", "Installment 1", "Installment 2", "Installment 3", "Full Payment", "Balance Payment"];
const PAYMENT_PLANS = ["Outright", "Installment", "Off-Plan Installment"];

/* ─── INQUIRY TYPES ─── */
type InquiryStatus = "New" | "Contacted" | "Followed Up" | "Converted" | "Closed";
type Inquiry = {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  source: "Referral" | "Walk-in" | "Website" | "Social Media";
  projectInterest: string;
  unitType: "1-Bed" | "2-Bed" | "3-Bed" | "Penthouse";
  status: InquiryStatus;
  assignedTo: string;
  date: string;
  notes: string;
};

const INQUIRY_STATUSES: InquiryStatus[] = ["New", "Contacted", "Followed Up", "Converted", "Closed"];

const SEED_INQUIRIES: Inquiry[] = [
  {
    id: "INQ-001",
    clientName: "Biodun Adewale",
    phone: "08031234567",
    email: "biodun@email.com",
    source: "Referral",
    projectInterest: "NAGA Palm Court",
    unitType: "2-Bed",
    status: "Followed Up",
    assignedTo: "Sola Adeyemi",
    date: "2026-09-05",
    notes: "Client is actively comparing with another development. Follow up before end of month.",
  },
  {
    id: "INQ-002",
    clientName: "Grace Obi",
    phone: "08057891234",
    email: "grace.obi@gmail.com",
    source: "Website",
    projectInterest: "Emerald Gardens",
    unitType: "3-Bed",
    status: "New",
    assignedTo: "Tunde Bello",
    date: "2026-09-10",
    notes: "Submitted enquiry form online. Has not been contacted yet.",
  },
  {
    id: "INQ-003",
    clientName: "Tolu Fasanya",
    phone: "08023456789",
    email: "tfasanya@corp.com",
    source: "Walk-in",
    projectInterest: "Granite Heights",
    unitType: "Penthouse",
    status: "Contacted",
    assignedTo: "Sola Adeyemi",
    date: "2026-09-12",
    notes: "Walked in on site visit day. Very interested in penthouse floor plan. Needs payment structure info.",
  },
  {
    id: "INQ-004",
    clientName: "Remi Dada",
    phone: "08098765432",
    email: "remi.d@yahoo.com",
    source: "Social Media",
    projectInterest: "NAGA Palm Court",
    unitType: "1-Bed",
    status: "Converted",
    assignedTo: "Tunde Bello",
    date: "2026-09-01",
    notes: "Converted to customer. Subscription signed and initial deposit paid.",
  },
  {
    id: "INQ-005",
    clientName: "Amara Nwachukwu",
    phone: "08012345678",
    email: "amara.n@email.com",
    source: "Referral",
    projectInterest: "Emerald Gardens",
    unitType: "2-Bed",
    status: "New",
    assignedTo: "Sola Adeyemi",
    date: "2026-09-18",
    notes: "Referred by existing client Mrs. Fashola. Prefers a ground-floor unit.",
  },
];

function inquiryStatusClass(status: InquiryStatus) {
  const map: Record<InquiryStatus, string> = {
    New: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Contacted: "bg-[#FDF4DC] text-[#7A5C0A] border-[#D4A843]/40",
    "Followed Up": "bg-purple-50 text-purple-700 border-purple-200",
    Converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return map[status];
}

/* ─── COMPLAINT TYPES ─── */
type ComplaintStatus = "Open" | "In Progress" | "Resolved";
type ComplaintPriority = "High" | "Medium" | "Low";
type Complaint = {
  id: string;
  customerId?: string;
  clientName: string;
  unit: string;
  estate: string;
  category: "Maintenance" | "Noise" | "Security" | "Billing" | "Other";
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  raisedDate: string;
  resolvedDate?: string;
  assignedTo: string;
  resolution?: string;
};

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "CMP-001",
    clientName: "Mrs. Funmi Adesanya",
    unit: "Unit 4A",
    estate: "Palm Estate",
    category: "Maintenance",
    description: "Faulty ceiling fan in master bedroom — fan stopped working completely and makes rattling noise.",
    status: "Open",
    priority: "High",
    raisedDate: "2026-09-14",
    assignedTo: "Facilities Team",
  },
  {
    id: "CMP-002",
    clientName: "Mr. Chidi Nwosu",
    unit: "Unit 12C",
    estate: "Emerald Court",
    category: "Billing",
    description: "Service charge statement incorrect — double charged for August and September billing cycle.",
    status: "In Progress",
    priority: "High",
    raisedDate: "2026-09-08",
    assignedTo: "Accounts Team",
  },
  {
    id: "CMP-003",
    clientName: "Dr. Yemi Okoye",
    unit: "Unit 7B",
    estate: "Palm Estate",
    category: "Noise",
    description: "Excessive construction noise on weekends disrupting residents and young children.",
    status: "Resolved",
    priority: "Medium",
    raisedDate: "2026-08-30",
    resolvedDate: "2026-09-02",
    assignedTo: "Estate Manager",
    resolution: "Construction hours restricted to Mon-Fri 8am-6pm per estate rules. Notice issued to contractor.",
  },
  {
    id: "CMP-004",
    clientName: "Ms. Kemi Ade",
    unit: "Unit 22A",
    estate: "Granite Residences",
    category: "Security",
    description: "Unauthorized persons seen loitering around block B on two separate evenings this week.",
    status: "In Progress",
    priority: "High",
    raisedDate: "2026-09-16",
    assignedTo: "Security Team",
  },
];

function complaintStatusClass(status: ComplaintStatus) {
  const map: Record<ComplaintStatus, string> = {
    Open: "bg-red-50 text-red-700 border-red-200",
    "In Progress": "bg-[#FDF4DC] text-[#7A5C0A] border-[#D4A843]/40",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[status];
}

function priorityClass(priority: ComplaintPriority) {
  const map: Record<ComplaintPriority, string> = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-[#FDF4DC] text-[#7A5C0A] border-[#D4A843]/30",
    Low: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return map[priority];
}

/* ─── HANDOVER TYPES ─── */
type HandoverStatus = "Scheduled" | "Completed" | "Postponed";
type ChecklistItem = { item: string; done: boolean };
type Handover = {
  id: string;
  clientName: string;
  unit: string;
  project: string;
  scheduledDate: string;
  completedDate?: string;
  status: HandoverStatus;
  csoName: string;
  checklist: ChecklistItem[];
};

const DEFAULT_CHECKLIST_ITEMS = [
  "Keys handed over",
  "Meter readings recorded",
  "Defects noted",
  "Welcome pack given",
  "Payment confirmed",
  "Resident orientation done",
];

const SEED_HANDOVERS: Handover[] = [
  {
    id: "HOV-001",
    clientName: "Remi Dada",
    unit: "Unit 8A",
    project: "NAGA Palm Court",
    scheduledDate: "2026-09-03",
    completedDate: "2026-09-03",
    status: "Completed",
    csoName: "Tunde Bello",
    checklist: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ item, done: true })),
  },
  {
    id: "HOV-002",
    clientName: "Biodun Adewale",
    unit: "Unit 12B",
    project: "NAGA Palm Court",
    scheduledDate: "2026-09-25",
    status: "Scheduled",
    csoName: "Sola Adeyemi",
    checklist: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ item, done: false })),
  },
  {
    id: "HOV-003",
    clientName: "Ade Johnson",
    unit: "Unit 3C",
    project: "Emerald Gardens",
    scheduledDate: "2026-09-30",
    status: "Postponed",
    csoName: "Sola Adeyemi",
    checklist: DEFAULT_CHECKLIST_ITEMS.map((item, i) => ({ item, done: i < 2 })),
  },
];

function handoverStatusClass(status: HandoverStatus) {
  const map: Record<HandoverStatus, string> = {
    Scheduled: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Postponed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return map[status];
}

/* ─── SHARED FIELD COMPONENTS ─── */
function FieldInput({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
        style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
        style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
        style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
      />
    </div>
  );
}

/* ─── MODAL SHELL ─── */
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,13,46,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[480px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{ animation: "modalIn 0.25s ease-out" }}>
        <div className="px-6 py-5 border-b border-[#E8EAF0]">
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>{title}</h3>
          {subtitle && <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{subtitle}</p>}
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ─── ADD CUSTOMER FORM ─── */
function CustomerForm({ onSave, onCancel }: {
  onSave: (c: Customer) => void; onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [property, setProperty] = useState(PROPERTIES[0]?.name ?? "");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [paymentPlan, setPaymentPlan] = useState("Installment");
  const [initialDeposit, setInitialDeposit] = useState(0);
  const [depositType, setDepositType] = useState("Initial Deposit");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || purchasePrice <= 0) return;
    setSaved(true);
    const payments: Payment[] = initialDeposit > 0 ? [{
      ref: "PAY-" + (Math.floor(Math.random() * 9000) + 1000),
      date: new Date().toISOString().slice(0, 10),
      amount: initialDeposit,
      type: depositType,
      status: "Confirmed",
    }] : [];
    const outstanding = purchasePrice - initialDeposit;
    setTimeout(() => {
      onSave({
        id: "CUST-" + Date.now(),
        name, email, phone, location,
        property, purchasePrice, paymentPlan,
        totalPaid: initialDeposit, outstanding,
        lastPayment: initialDeposit > 0 ? new Date().toISOString().slice(0, 10) : undefined,
        status: outstanding === 0 ? "Completed" : "Active",
        payments,
      });
    }, 900);
  };

  if (saved) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dcfce7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Customer added</div>
        <div className="text-[12px]" style={{ color: "#69707D" }}>{name} has been registered and their purchase file opened.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Add New Customer</h3>
          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Register a customer and open their purchase file.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#F7F8FA]"
          style={{ color: "#69707D", border: "1px solid #E8EAF0" }}>Cancel</button>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Personal Details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chidi Nwosu"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Location / City</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Abuja"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Purchase Details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Property</label>
            <select value={property} onChange={(e) => setProperty(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
              {PROPERTIES.map((p) => <option key={p.id}>{p.name} — {p.location} ({fmt(p.price)})</option>)}
              <option value="Other">Other / Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Purchase Price (₦) <span style={{ color: "#dc2626" }}>*</span></label>
            <input required type="number" min={0} value={purchasePrice || ""} onChange={(e) => setPurchasePrice(Number(e.target.value))} placeholder="e.g. 85000000"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
            {purchasePrice > 0 && <div className="text-[11px] mt-1" style={{ color: "#6B9FE5" }}>{fmt(purchasePrice)}</div>}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Payment Plan</label>
            <select value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
              {PAYMENT_PLANS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Initial Payment (optional)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Amount Paid (₦)</label>
            <input type="number" min={0} max={purchasePrice} value={initialDeposit || ""} onChange={(e) => setInitialDeposit(Number(e.target.value))} placeholder="0"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Payment Type</label>
            <select value={depositType} onChange={(e) => setDepositType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
              {PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {initialDeposit > 0 && purchasePrice > 0 && (
          <div className="mt-3 rounded-xl p-3 text-[12px]" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
            <span className="font-semibold" style={{ color: "#25205B" }}>Outstanding: {fmt(purchasePrice - initialDeposit)}</span>
            <span style={{ color: "#69707D" }}> · {Math.round((initialDeposit / purchasePrice) * 100)}% paid</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-5 py-3 font-semibold text-[13px] rounded-xl hover:bg-[#F7F8FA] transition-colors"
          style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
        <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white hover:opacity-90"
          style={{ background: "#25205B" }}>Add Customer</button>
      </div>
    </form>
  );
}

/* ─── RECORD PAYMENT MODAL ─── */
function RecordPaymentModal({ customer, onSave, onClose }: {
  customer: Customer; onSave: (p: Payment) => void; onClose: () => void;
}) {
  const [amount, setAmount] = useState(customer.nextPaymentAmount ?? 0);
  const [type, setType] = useState("Installment");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,13,46,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        <div className="px-6 py-5 border-b border-[#E8EAF0]">
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Record Payment</h3>
          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{customer.name} · Outstanding: {fmt(customer.outstanding)}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Amount (₦) <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="number" min={1} max={customer.outstanding} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
            {amount > 0 && <div className="text-[11px] mt-1" style={{ color: "#6B9FE5" }}>{fmt(amount)}</div>}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Payment Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
              {PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Payment Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>Cancel</button>
          <button
            onClick={() => amount > 0 && onSave({ ref: "PAY-" + (Math.floor(Math.random() * 9000) + 1000), date, amount, type, status: "Confirmed" })}
            disabled={amount <= 0}
            className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white disabled:opacity-40"
            style={{ background: "#25205B" }}>
            Record Payment
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ─── LOG INQUIRY MODAL ─── */
function LogInquiryModal({ onSave, onClose }: { onSave: (i: Inquiry) => void; onClose: () => void }) {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<Inquiry["source"]>("Referral");
  const [projectInterest, setProjectInterest] = useState("NAGA Palm Court");
  const [unitType, setUnitType] = useState<Inquiry["unitType"]>("2-Bed");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    onSave({
      id: "INQ-" + String(Math.floor(Math.random() * 900) + 100),
      clientName, phone, email, source, projectInterest, unitType,
      status: "New",
      assignedTo: "Unassigned",
      date: new Date().toISOString().slice(0, 10),
      notes,
    });
  };

  return (
    <Modal title="Log Inquiry" subtitle="Record a new client lead or enquiry." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FieldInput label="Client Name" value={clientName} onChange={setClientName} placeholder="e.g. Emeka Obi" required />
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="Phone" value={phone} onChange={setPhone} placeholder="0803 000 0000" />
          <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" />
        </div>
        <FieldSelect label="Source" value={source} onChange={(v) => setSource(v as Inquiry["source"])} options={["Referral", "Walk-in", "Website", "Social Media"]} />
        <FieldSelect label="Project Interest" value={projectInterest} onChange={setProjectInterest} options={["NAGA Palm Court", "Emerald Gardens", "Granite Heights", "Other"]} />
        <FieldSelect label="Unit Type" value={unitType} onChange={(v) => setUnitType(v as Inquiry["unitType"])} options={["1-Bed", "2-Bed", "3-Bed", "Penthouse"]} />
        <FieldTextarea label="Notes" value={notes} onChange={setNotes} placeholder="Any relevant context about this enquiry..." />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl"
            style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
          <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white hover:opacity-90"
            style={{ background: "#25205B" }}>Log Inquiry</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── LOG COMPLAINT MODAL ─── */
function LogComplaintModal({ onSave, onClose }: { onSave: (c: Complaint) => void; onClose: () => void }) {
  const [clientName, setClientName] = useState("");
  const [unit, setUnit] = useState("");
  const [estate, setEstate] = useState("");
  const [category, setCategory] = useState<Complaint["category"]>("Maintenance");
  const [priority, setPriority] = useState<ComplaintPriority>("Medium");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("Facilities Team");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !description.trim()) return;
    onSave({
      id: "CMP-" + String(Math.floor(Math.random() * 900) + 100),
      clientName, unit, estate, category, priority, description,
      status: "Open",
      raisedDate: new Date().toISOString().slice(0, 10),
      assignedTo,
    });
  };

  return (
    <Modal title="Log Complaint" subtitle="Record a client complaint or service issue." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FieldInput label="Client Name" value={clientName} onChange={setClientName} placeholder="e.g. Mrs. Adesanya" required />
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="Unit" value={unit} onChange={setUnit} placeholder="e.g. Unit 4A" />
          <FieldInput label="Estate / Project" value={estate} onChange={setEstate} placeholder="e.g. Palm Estate" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FieldSelect label="Category" value={category} onChange={(v) => setCategory(v as Complaint["category"])} options={["Maintenance", "Noise", "Security", "Billing", "Other"]} />
          <FieldSelect label="Priority" value={priority} onChange={(v) => setPriority(v as ComplaintPriority)} options={["High", "Medium", "Low"]} />
        </div>
        <FieldTextarea label="Description" value={description} onChange={setDescription} placeholder="Describe the issue in detail..." required />
        <FieldInput label="Assigned To" value={assignedTo} onChange={setAssignedTo} placeholder="e.g. Facilities Team" />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl"
            style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
          <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white hover:opacity-90"
            style={{ background: "#25205B" }}>Log Complaint</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── RESOLVE COMPLAINT MODAL ─── */
function ResolveComplaintModal({ complaint, onResolve, onClose }: {
  complaint: Complaint; onResolve: (resolution: string) => void; onClose: () => void;
}) {
  const [resolution, setResolution] = useState(complaint.resolution ?? "");

  return (
    <Modal title="Resolve Complaint" subtitle={`${complaint.id} · ${complaint.clientName}`} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="rounded-xl p-4 text-[13px]" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
          <div className="font-semibold mb-1" style={{ color: "#252731" }}>{complaint.category} — {complaint.unit}</div>
          <div style={{ color: "#69707D" }}>{complaint.description}</div>
        </div>
        <FieldTextarea label="Resolution Note" value={resolution} onChange={setResolution}
          placeholder="Describe how this complaint was resolved..." />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl"
            style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
          <button
            onClick={() => onResolve(resolution)}
            className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white hover:opacity-90"
            style={{ background: "#25205B" }}>
            Mark Resolved
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── SCHEDULE HANDOVER MODAL ─── */
function ScheduleHandoverModal({ onSave, onClose }: { onSave: (h: Handover) => void; onClose: () => void }) {
  const [clientName, setClientName] = useState("");
  const [unit, setUnit] = useState("");
  const [project, setProject] = useState("NAGA Palm Court");
  const [scheduledDate, setScheduledDate] = useState("");
  const [csoName, setCsoName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !scheduledDate) return;
    onSave({
      id: "HOV-" + String(Math.floor(Math.random() * 900) + 100),
      clientName, unit, project, scheduledDate,
      status: "Scheduled",
      csoName: csoName || "Unassigned",
      checklist: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ item, done: false })),
    });
  };

  return (
    <Modal title="Schedule Handover" subtitle="Set up a unit handover session for a client." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FieldInput label="Client Name" value={clientName} onChange={setClientName} placeholder="e.g. Chidi Nwosu" required />
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="Unit" value={unit} onChange={setUnit} placeholder="e.g. Unit 5B" />
          <FieldSelect label="Project" value={project} onChange={setProject} options={["NAGA Palm Court", "Emerald Gardens", "Granite Heights", "Other"]} />
        </div>
        <FieldInput label="Scheduled Date" type="date" value={scheduledDate} onChange={setScheduledDate} required />
        <FieldInput label="CSO Name" value={csoName} onChange={setCsoName} placeholder="e.g. Sola Adeyemi" />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl"
            style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
          <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white hover:opacity-90"
            style={{ background: "#25205B" }}>Schedule Handover</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── INQUIRIES TAB ─── */
function InquiriesTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(SEED_INQUIRIES);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const cycleStatus = (id: string) => {
    setInquiries((prev) => prev.map((inq) => {
      if (inq.id !== id) return inq;
      const idx = INQUIRY_STATUSES.indexOf(inq.status);
      const next = INQUIRY_STATUSES[(idx + 1) % INQUIRY_STATUSES.length];
      return { ...inq, status: next };
    }));
  };

  const handleAdd = (inq: Inquiry) => {
    setInquiries((prev) => [inq, ...prev]);
    setShowModal(false);
    showToast(`Inquiry logged for ${inq.clientName}.`);
  };

  const counts = {
    New: inquiries.filter((i) => i.status === "New").length,
    Converted: inquiries.filter((i) => i.status === "Converted").length,
    Active: inquiries.filter((i) => i.status !== "Closed" && i.status !== "Converted").length,
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl text-[13px] font-medium shadow-lg" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>Saved. {toast}</div>}
      {showModal && <LogInquiryModal onSave={handleAdd} onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Inquiries</h2>
          <p className="text-[#69707D] text-sm mt-0.5">{inquiries.length} total leads tracked</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors">
          + Log Inquiry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "New Inquiries", value: counts.New },
          { label: "Active / In Progress", value: counts.Active },
          { label: "Converted", value: counts.Converted },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-[#252731] text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {inquiries.map((inq) => (
          <div key={inq.id} className="bg-white border border-[#E8EAF0] rounded-xl p-5 hover:border-[#6B9FE5]/40 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#252731]">{inq.clientName}</span>
                  <span className="font-mono text-[10px] text-[#69707D]">{inq.id}</span>
                </div>
                <div className="text-xs text-[#69707D] mt-0.5">{inq.phone} · {inq.email}</div>
              </div>
              <button
                onClick={() => cycleStatus(inq.id)}
                title="Click to advance status"
                className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase cursor-pointer hover:opacity-75 transition-opacity ${inquiryStatusClass(inq.status)}`}>
                {inq.status}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="text-xs">
                <div className="text-[#69707D]">Project</div>
                <div className="text-[#252731] font-semibold mt-0.5">{inq.projectInterest}</div>
              </div>
              <div className="text-xs">
                <div className="text-[#69707D]">Unit Type</div>
                <div className="text-[#252731] font-semibold mt-0.5">{inq.unitType}</div>
              </div>
              <div className="text-xs">
                <div className="text-[#69707D]">Source</div>
                <div className="text-[#252731] font-semibold mt-0.5">{inq.source}</div>
              </div>
              <div className="text-xs">
                <div className="text-[#69707D]">Date</div>
                <div className="text-[#252731] font-semibold mt-0.5">{inq.date}</div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="text-xs text-[#69707D] flex-1">
                <span className="font-medium text-[#252731]">CSO: </span>{inq.assignedTo}
                {inq.notes && (
                  <span> · <span className="italic">{inq.notes.length > 80 ? inq.notes.slice(0, 80) + "..." : inq.notes}</span></span>
                )}
              </div>
            </div>
          </div>
        ))}
        {inquiries.length === 0 && (
          <div className="py-16 text-center text-[13px]" style={{ color: "#69707D" }}>No inquiries yet. Log the first one above.</div>
        )}
      </div>
    </div>
  );
}

/* ─── COMPLAINTS TAB ─── */
function ComplaintsTab() {
  const [complaints, setComplaints] = useState<Complaint[]>(SEED_COMPLAINTS);
  const [showLogModal, setShowLogModal] = useState(false);
  const [resolving, setResolving] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleAdd = (c: Complaint) => {
    setComplaints((prev) => [c, ...prev]);
    setShowLogModal(false);
    showToast(`Complaint ${c.id} logged.`);
  };

  const handleResolve = (id: string, resolution: string) => {
    setComplaints((prev) => prev.map((c) =>
      c.id !== id ? c : {
        ...c, status: "Resolved",
        resolvedDate: new Date().toISOString().slice(0, 10),
        resolution,
      }
    ));
    setResolving(null);
    showToast("Complaint marked as resolved.");
  };

  const counts = {
    Open: complaints.filter((c) => c.status === "Open").length,
    InProgress: complaints.filter((c) => c.status === "In Progress").length,
    Resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl text-[13px] font-medium shadow-lg" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>Saved. {toast}</div>}
      {showLogModal && <LogComplaintModal onSave={handleAdd} onClose={() => setShowLogModal(false)} />}
      {resolving && (
        <ResolveComplaintModal
          complaint={resolving}
          onResolve={(r) => handleResolve(resolving.id, r)}
          onClose={() => setResolving(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Complaints</h2>
          <p className="text-[#69707D] text-sm mt-0.5">{complaints.length} complaint{complaints.length !== 1 ? "s" : ""} on record</p>
        </div>
        <button onClick={() => setShowLogModal(true)} className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors">
          + Log Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Open", value: counts.Open, accent: "#dc2626" },
          { label: "In Progress", value: counts.InProgress, accent: "#D4A843" },
          { label: "Resolved", value: counts.Resolved, accent: "#166534" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {complaints.map((c) => (
          <div key={c.id} className="bg-white border border-[#E8EAF0] rounded-xl p-5 hover:border-[#6B9FE5]/40 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#252731]">{c.clientName}</span>
                  <span className="font-mono text-[10px] text-[#69707D]">{c.id}</span>
                </div>
                <div className="text-xs text-[#69707D] mt-0.5">{c.unit} · {c.estate}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${priorityClass(c.priority)}`}>
                  {c.priority}
                </span>
                <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${complaintStatusClass(c.status)}`}>
                  {c.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="text-xs">
                <div className="text-[#69707D]">Category</div>
                <div className="text-[#252731] font-semibold mt-0.5">{c.category}</div>
              </div>
              <div className="text-xs">
                <div className="text-[#69707D]">Raised</div>
                <div className="text-[#252731] font-semibold mt-0.5">{c.raisedDate}</div>
              </div>
              {c.resolvedDate && (
                <div className="text-xs">
                  <div className="text-[#69707D]">Resolved</div>
                  <div className="text-[#252731] font-semibold mt-0.5">{c.resolvedDate}</div>
                </div>
              )}
              <div className="text-xs">
                <div className="text-[#69707D]">Assigned To</div>
                <div className="text-[#252731] font-semibold mt-0.5">{c.assignedTo}</div>
              </div>
            </div>

            <p className="text-[13px] text-[#252731] mb-2 leading-snug">{c.description}</p>

            {c.resolution && (
              <div className="mt-2 rounded-lg p-3 text-xs" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
                <span className="font-semibold">Resolution: </span>{c.resolution}
              </div>
            )}

            {c.status !== "Resolved" && (
              <button
                onClick={() => setResolving(c)}
                className="mt-3 text-[12px] font-semibold px-4 py-1.5 rounded-lg transition-colors hover:bg-[#EAF2FC]"
                style={{ border: "1px solid #D3E3F9", color: "#25205B" }}>
                Resolve
              </button>
            )}
          </div>
        ))}
        {complaints.length === 0 && (
          <div className="py-16 text-center text-[13px]" style={{ color: "#69707D" }}>No complaints on record.</div>
        )}
      </div>
    </div>
  );
}

/* ─── HANDOVERS TAB ─── */
function HandoversTab() {
  const [handovers, setHandovers] = useState<Handover[]>(SEED_HANDOVERS);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleAdd = (h: Handover) => {
    setHandovers((prev) => [h, ...prev]);
    setShowModal(false);
    showToast(`Handover ${h.id} scheduled for ${h.clientName}.`);
  };

  const toggleItem = (handoverId: string, itemIndex: number) => {
    setHandovers((prev) => prev.map((h) => {
      if (h.id !== handoverId) return h;
      const checklist = h.checklist.map((ci, i) => i === itemIndex ? { ...ci, done: !ci.done } : ci);
      const allDone = checklist.every((ci) => ci.done);
      return {
        ...h, checklist,
        status: allDone && h.status === "Scheduled" ? "Completed" : h.status,
        completedDate: allDone && h.status === "Scheduled" ? new Date().toISOString().slice(0, 10) : h.completedDate,
      };
    }));
  };

  const counts = {
    Scheduled: handovers.filter((h) => h.status === "Scheduled").length,
    Completed: handovers.filter((h) => h.status === "Completed").length,
    Postponed: handovers.filter((h) => h.status === "Postponed").length,
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl text-[13px] font-medium shadow-lg" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>Saved. {toast}</div>}
      {showModal && <ScheduleHandoverModal onSave={handleAdd} onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Handovers</h2>
          <p className="text-[#69707D] text-sm mt-0.5">{handovers.length} handover records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors">
          + Schedule Handover
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Scheduled", value: counts.Scheduled },
          { label: "Completed", value: counts.Completed },
          { label: "Postponed", value: counts.Postponed },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-[#252731] text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {handovers.map((h) => {
          const doneCount = h.checklist.filter((ci) => ci.done).length;
          const total = h.checklist.length;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
          const isOpen = expanded === h.id;

          return (
            <div key={h.id} className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden hover:border-[#6B9FE5]/40 transition-all">
              <button
                className="w-full text-left p-5"
                onClick={() => setExpanded(isOpen ? null : h.id)}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#252731]">{h.clientName}</span>
                      <span className="font-mono text-[10px] text-[#69707D]">{h.id}</span>
                    </div>
                    <div className="text-xs text-[#69707D] mt-0.5">{h.unit} · {h.project}</div>
                  </div>
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${handoverStatusClass(h.status)}`}>
                    {h.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <div className="text-xs">
                    <div className="text-[#69707D]">Scheduled Date</div>
                    <div className="text-[#252731] font-semibold mt-0.5">{h.scheduledDate}</div>
                  </div>
                  {h.completedDate && (
                    <div className="text-xs">
                      <div className="text-[#69707D]">Completed</div>
                      <div className="text-[#252731] font-semibold mt-0.5">{h.completedDate}</div>
                    </div>
                  )}
                  <div className="text-xs">
                    <div className="text-[#69707D]">CSO</div>
                    <div className="text-[#252731] font-semibold mt-0.5">{h.csoName}</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-[#69707D] mb-1">
                    <span>Checklist Progress</span>
                    <span className="font-semibold">{doneCount}/{total} items done · {pct}%</span>
                  </div>
                  <div className="h-2 bg-[#EAF2FC] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#6B9FE5" }}
                    />
                  </div>
                </div>

                <div className="mt-2 text-right text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>
                  {isOpen ? "Hide checklist" : "View checklist"}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[#E8EAF0] px-5 pb-5 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Handover Checklist</div>
                  <div className="space-y-2">
                    {h.checklist.map((ci, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); toggleItem(h.id, i); }}
                        className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg hover:bg-[#F7F8FA] transition-colors"
                      >
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${ci.done ? "border-[#25205B] bg-[#25205B]" : "border-[#D1D5DB] bg-white"}`}>
                          {ci.done && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[13px] ${ci.done ? "line-through text-[#69707D]" : "text-[#252731]"}`}>{ci.item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {handovers.length === 0 && (
          <div className="py-16 text-center text-[13px]" style={{ color: "#69707D" }}>No handovers scheduled yet.</div>
        )}
      </div>
    </div>
  );
}

/* ─── CUSTOMERS TAB ─── */
function CustomersTab() {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(CUSTOMERS as Customer[]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [recordPaymentFor, setRecordPaymentFor] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const customer = selected ? localCustomers.find((c) => c.id === selected) : null;

  const handleAddCustomer = (c: Customer) => {
    setLocalCustomers((prev) => [c, ...prev]);
    setShowNewForm(false);
    setSelected(c.id);
    showToast(`${c.name} registered successfully.`);
  };

  const handleRecordPayment = (cId: string, payment: Payment) => {
    setLocalCustomers((prev) => prev.map((c) => {
      if (c.id !== cId) return c;
      const newTotal = c.totalPaid + payment.amount;
      const newOutstanding = Math.max(0, c.outstanding - payment.amount);
      return {
        ...c,
        totalPaid: newTotal,
        outstanding: newOutstanding,
        lastPayment: payment.date,
        status: newOutstanding === 0 ? "Completed" : "Active",
        payments: [...c.payments, payment],
      };
    }));
    setRecordPaymentFor(null);
    showToast(`Payment of ${fmt(payment.amount)} recorded.`);
  };

  if (customer) {
    const progress = Math.round((customer.totalPaid / customer.purchasePrice) * 100);
    return (
      <div className="space-y-5 max-w-[900px]">
        {toast && <div className="fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl text-[13px] font-medium shadow-lg" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>Saved. {toast}</div>}
        {recordPaymentFor && (
          <RecordPaymentModal
            customer={recordPaymentFor}
            onSave={(p) => handleRecordPayment(recordPaymentFor.id, p)}
            onClose={() => setRecordPaymentFor(null)}
          />
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setSelected(null)} className="text-[#6B9FE5] hover:underline font-medium">Customers</button>
            <span className="text-[#69707D]">/</span>
            <span className="text-[#252731] font-medium">{customer.name}</span>
          </div>
          {customer.outstanding > 0 && (
            <button
              onClick={() => setRecordPaymentFor(customer)}
              className="text-[13px] font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "#25205B" }}>
              + Record Payment
            </button>
          )}
        </div>

        <div className="bg-[#25205B] rounded-xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="w-12 h-12 rounded-full bg-[#6B9FE5]/20 border border-[#6B9FE5]/40 flex items-center justify-center text-white text-lg font-bold mb-3">
                {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <h2 className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{customer.name}</h2>
              <p className="text-[#6B9FE5] text-sm mt-0.5">{customer.email} · {customer.phone}</p>
              <p className="text-[#EAF2FC]/70 text-xs mt-1">{customer.location}</p>
            </div>
            <StatusBadge status={customer.status} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Property", value: customer.property },
              { label: "Purchase Price", value: fmt(customer.purchasePrice) },
              { label: "Total Paid", value: fmt(customer.totalPaid) },
              { label: "Outstanding", value: fmt(customer.outstanding) },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-lg px-4 py-3">
                <div className="text-[#6B9FE5] text-[10px] font-medium">{s.label}</div>
                <div className="text-white font-semibold text-sm mt-0.5 leading-tight">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#6B9FE5] mb-1">
              <span>Payment Progress</span>
              <span>{progress}% paid</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#6B9FE5]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {customer.outstanding > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-amber-800 font-semibold text-sm">
                {customer.nextPaymentDue ? `Next Payment Due — ${customer.nextPaymentDue}` : "Outstanding Balance"}
              </div>
              <div className="text-amber-700 text-xs mt-0.5">
                {customer.nextPaymentAmount ? fmt(customer.nextPaymentAmount) : fmt(customer.outstanding)} · {customer.paymentPlan}
              </div>
            </div>
            <button onClick={() => setRecordPaymentFor(customer)} className="text-[12px] font-semibold px-4 py-2 rounded-lg" style={{ background: "#92400e", color: "white" }}>
              Record Payment
            </button>
          </div>
        )}

        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
            <h3 className="text-[#252731] font-semibold text-sm">Payment History</h3>
            <span className="text-[11px]" style={{ color: "#69707D" }}>{customer.payments.length} payment{customer.payments.length !== 1 ? "s" : ""}</span>
          </div>
          {customer.payments.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: "#69707D" }}>No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                    {["Payment Ref", "Date", "Amount", "Type", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {customer.payments.map((p) => (
                    <tr key={p.ref} className="hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-[#6B9FE5]">{p.ref}</td>
                      <td className="px-5 py-3 text-xs text-[#69707D]">{p.date}</td>
                      <td className="px-5 py-3 text-sm font-bold text-[#252731]">{fmt(p.amount)}</td>
                      <td className="px-5 py-3 text-xs text-[#252731]">{p.type}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
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

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl text-[13px] font-medium shadow-lg" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>Saved. {toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Customers</h2>
          <p className="text-[#69707D] text-sm mt-0.5">{localCustomers.length} registered customers</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors">
          + Add Customer
        </button>
      </div>

      {showNewForm && (
        <CustomerForm onSave={handleAddCustomer} onCancel={() => setShowNewForm(false)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Customers", value: localCustomers.filter((c) => c.status === "Active").length },
          { label: "Completed Purchases", value: localCustomers.filter((c) => c.status === "Completed").length },
          { label: "Total Collected", value: `₦${(localCustomers.reduce((a, c) => a + c.totalPaid, 0) / 1_000_000).toFixed(1)}M` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-[#252731] text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {localCustomers.map((c) => {
          const progress = Math.round((c.totalPaid / c.purchasePrice) * 100);
          return (
            <div
              key={c.id}
              className="bg-white border border-[#E8EAF0] rounded-xl p-5 hover:border-[#6B9FE5]/40 hover:shadow-sm cursor-pointer transition-all"
              onClick={() => setSelected(c.id)}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF2FC] border border-[#6B9FE5]/30 flex items-center justify-center text-[#25205B] text-xs font-bold">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-[#252731] font-semibold">{c.name}</div>
                    <div className="text-[#69707D] text-xs mt-0.5">{c.property}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.outstanding > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRecordPaymentFor(c); }}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[#EAF2FC]"
                      style={{ border: "1px solid #D3E3F9", color: "#25205B" }}>
                      + Payment
                    </button>
                  )}
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div className="text-xs">
                  <div className="text-[#69707D]">Purchase Price</div>
                  <div className="text-[#252731] font-semibold mt-0.5">{fmt(c.purchasePrice)}</div>
                </div>
                <div className="text-xs">
                  <div className="text-[#69707D]">Total Paid</div>
                  <div className="text-emerald-600 font-semibold mt-0.5">{fmt(c.totalPaid)}</div>
                </div>
                <div className="text-xs">
                  <div className="text-[#69707D]">Outstanding</div>
                  <div className={`font-semibold mt-0.5 ${c.outstanding > 0 ? "text-amber-600" : "text-[#252731]"}`}>{fmt(c.outstanding)}</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-[#69707D] mb-1">
                  <span>{c.paymentPlan}</span>
                  <span className="font-semibold">{progress}% paid</span>
                </div>
                <div className="h-1.5 bg-[#EAF2FC] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6B9FE5] rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        {localCustomers.length === 0 && (
          <div className="py-16 text-center text-[13px]" style={{ color: "#69707D" }}>No customers yet. Add the first one above.</div>
        )}
      </div>

      {recordPaymentFor && (
        <RecordPaymentModal
          customer={recordPaymentFor}
          onSave={(p) => handleRecordPayment(recordPaymentFor.id, p)}
          onClose={() => setRecordPaymentFor(null)}
        />
      )}
    </div>
  );
}

/* ─── MAIN MODULE ─── */
type TabId = "customers" | "inquiries" | "complaints" | "handovers";

const TABS: { id: TabId; label: string }[] = [
  { id: "customers", label: "Customers" },
  { id: "inquiries", label: "Inquiries" },
  { id: "complaints", label: "Complaints" },
  { id: "handovers", label: "Handovers" },
];

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<TabId>("customers");

  return (
    <div className="p-4 md:p-6 max-w-[1100px]">
      {/* Tab bar */}
      <div className="mb-6">
        <div className="flex items-center gap-1 border-b border-[#E8EAF0]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-[#25205B] text-[#25205B]"
                  : "border-transparent text-[#69707D] hover:text-[#252731]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "customers" && <CustomersTab />}
      {activeTab === "inquiries" && <InquiriesTab />}
      {activeTab === "complaints" && <ComplaintsTab />}
      {activeTab === "handovers" && <HandoversTab />}
    </div>
  );
}
