import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import PaymentModal from "../components/PaymentModal";
import { addMaintenanceRequest, updateMaintenanceRequest, addResidentUpdate, submitResidentFeedback, SHARED_MAINTENANCE, SharedMaintRequest } from "../data/maintenanceStore";
import { addSupportTicket, SHARED_SUPPORT_TICKETS, addMessageToTicket } from "../data/supportStore";

interface ResidentAccount {
  name: string;
  unit: string;
  estate: string;
  type: string;
}

interface Props {
  onLogout: () => void;
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Paid: { bg: "#dcfce7", color: "#166534" },
    Partial: { bg: "#fef3c7", color: "#92400e" },
    Overdue: { bg: "#fee2e2", color: "#991b1b" },
    Open: { bg: "#fef3c7", color: "#92400e" },
    Assigned: { bg: "#EAF2FC", color: "#25205B" },
    "In Progress": { bg: "#fef3c7", color: "#92400e" },
    Resolved: { bg: "#dcfce7", color: "#166534" },
    New: { bg: "#f3f4f6", color: "#374151" },
  };
  const s = map[status] ?? { bg: "#F7F8FA", color: "#69707D" };
  return (
    <span className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={s}>{status}</span>
  );
}

function SupportStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Open: { bg: "#fef3c7", color: "#92400e" },
    "In Progress": { bg: "#EAF2FC", color: "#25205B" },
    "Pending Customer": { bg: "#f3e8ff", color: "#6b21a8" },
    Escalated: { bg: "#fee2e2", color: "#991b1b" },
    Resolved: { bg: "#dcfce7", color: "#166534" },
    Closed: { bg: "#f3f4f6", color: "#374151" },
  };
  const s = map[status] ?? { bg: "#F7F8FA", color: "#69707D" };
  return (
    <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase" style={{ background: s.bg, color: s.color, borderColor: `${s.color}30` }}>
      {status}
    </span>
  );
}

function IconHome() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 6.5L7.5 2l5.5 4.5V13a.75.75 0 01-.75.75H10V9.5H5v4.25H3.25A.75.75 0 012.5 13V6.5z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg>;
}
function IconCharges() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 6.5h12M4.5 9.5h3M4.5 11.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>;
}
function IconMaint() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12 3a2.5 2.5 0 01-3.5 3.5L3 12a1 1 0 01-1.4-1.4l5.5-5.5A2.5 2.5 0 0112 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>;
}
function IconNotices() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 5.5h6M4.5 7.5h6M4.5 9.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>;
}
function IconSupport() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M5.5 6c0-1.1.9-2 2-2s2 .9 2 2c0 1-.7 1.7-1.5 2V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="7.5" cy="11" r=".6" fill="currentColor" /></svg>;
}
function IconVisitor() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" /><path d="M3 13c0-2.5 2-4.5 4.5-4.5S12 10.5 12 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M10.5 9.5l1.5 1.5-1.5 1.5M12 11h-2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function ResidentPortal({ onLogout }: Props) {
  const raw = sessionStorage.getItem("naga_resident");
  const account: ResidentAccount = raw ? JSON.parse(raw) : { name: "Mr. Seun Adeleke", unit: "A7", estate: "Palm Estate", type: "Owner" };

  const isSeun = account.unit === "A7";
  const serviceCharge = account.estate === "Sapphire Court" ? 720_000 : 480_000;
  const basePaid = isSeun ? 240_000 : account.unit === "C3" ? 0 : 720_000;

  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [activeTab, setActiveTab] = useState<"home" | "charges" | "maintenance" | "visitors" | "notices" | "support">("home");

  // Maintenance state
  const [showMRForm, setShowMRForm] = useState(false);
  const [newIssue, setNewIssue] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [mrImageUrls, setMrImageUrls] = useState<string[]>([""]);
  const [mrSubmitted, setMrSubmitted] = useState(false);
  const [selectedMaintId, setSelectedMaintId] = useState<string | null>(null);
  const [maintView, setMaintView] = useState<"list" | "detail" | "edit">("list");
  const [localMaintItems, setLocalMaintItems] = useState<SharedMaintRequest[]>(() =>
    SHARED_MAINTENANCE.filter(r => r.unit === account.unit || r.resident === account.name)
  );
  const [updateText, setUpdateText] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const refreshMaint = () => {
    setLocalMaintItems(SHARED_MAINTENANCE.filter(r => r.unit === account.unit || r.resident === account.name));
  };

  const selectedMaint = selectedMaintId ? localMaintItems.find(r => r.id === selectedMaintId) : null;
  const [localPaid, setLocalPaid] = useState(basePaid);
  const [paymentModal, setPaymentModal] = useState<{ amount: number; desc: string } | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<{ ref: string; amount: number; method: string; date: string }[]>([]);

  // Support tab state
  const [supportView, setSupportView] = useState<"list" | "thread" | "new">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newSupportCategory, setNewSupportCategory] = useState("General");
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [threadReply, setThreadReply] = useState("");
  const [localTickets, setLocalTickets] = useState(() =>
    SHARED_SUPPORT_TICKETS.filter(t => t.customerType === "Resident" && (t.customer === account.name || t.unit === account.unit))
  );

  const refreshTickets = () => {
    setLocalTickets(
      SHARED_SUPPORT_TICKETS.filter(t => t.customerType === "Resident" && (t.customer === account.name || t.unit === account.unit))
    );
  };

  // Onboarding overlay state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !sessionStorage.getItem("naga_resident_onboarded");
  });

  // Visitor pass state
  const [visitors, setVisitors] = useState<{ id: string; name: string; phone: string; date: string; purpose: string; passCode: string; status: "Active" | "Expired" | "Used" }[]>([
    { id: "VP-001", name: "Mr. Tunde Bakare", phone: "+234 803 111 2233", date: "2026-08-29", purpose: "Family visit", passCode: "NGA-4821", status: "Active" },
    { id: "VP-002", name: "Dr. Chiamaka Obi", phone: "+234 805 222 3344", date: "2026-08-28", purpose: "Medical visit", passCode: "NGA-3392", status: "Expired" },
  ]);
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState("");
  const [newVisitorPhone, setNewVisitorPhone] = useState("");
  const [newVisitorPurpose, setNewVisitorPurpose] = useState("General visit");
  const [visitorDate, setVisitorDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitorSubmitted, setVisitorSubmitted] = useState(false);

  const paid = localPaid;
  const outstanding = serviceCharge - paid;
  const scStatus = outstanding === 0 ? "Paid" : paid > 0 ? "Partial" : "Overdue";
  const nextDue = outstanding === 0 ? "2026-01-01" : "2025-09-01";

  const notices = [
    { date: "2025-08-25", title: "Generator Maintenance — Saturday 30 Aug", body: "The estate generator will undergo scheduled maintenance on Saturday 30 August from 10am–2pm. Power will be unavailable during this period." },
    { date: "2025-08-20", title: "Service Charge Reminder", body: "Residents with outstanding service charge balances are reminded to settle before 1 September 2025 to avoid penalties." },
    { date: "2025-08-10", title: "New Security Protocols", body: "A new visitor registration system is now operational at the gate. All visitors must present a valid ID and be registered by residents before entry." },
  ];

  const submitMR = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    addMaintenanceRequest({
      estate: account.estate,
      unit: account.unit,
      resident: account.name,
      type: newCategory,
      description: newIssue,
      priority: "Medium",
      status: "Open",
      dateSubmitted: today,
      assignedTo: "Unassigned",
      notes: "",
      source: "resident_portal",
    });
    setMrSubmitted(true);
    setTimeout(() => { setMrSubmitted(false); setShowMRForm(false); setNewIssue(""); setMrImageUrls([""]); refreshMaint(); }, 3000);
  };

  const submitSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    addSupportTicket({
      subject: newSubject,
      customer: account.name,
      customerType: "Resident",
      estate: account.estate,
      unit: account.unit,
      category: newSupportCategory as "Maintenance" | "Billing" | "Access" | "Amenity" | "General" | "Escalation" | "Booking",
      priority: "Medium",
      status: "Open",
      created: today,
      lastUpdated: today,
      assignedTo: "Unassigned",
      slaHours: 48,
      ageHours: 0,
      source: "portal",
      messages: [{ from: account.name, role: "Resident", text: newMessage, timestamp: now }],
    });
    setNewSubject("");
    setNewMessage("");
    setNewSupportCategory("General");
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setSupportView("list");
      refreshTickets();
    }, 2500);
  };

  const submitThreadReply = (ticketId: string) => {
    if (!threadReply.trim()) return;
    const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    addMessageToTicket(ticketId, { from: account.name, role: "Resident", text: threadReply, timestamp: now });
    setThreadReply("");
    refreshTickets();
  };

  const addMrImage = () => { if (mrImageUrls.length < 4) setMrImageUrls([...mrImageUrls, ""]); };
  const removeMrImage = (i: number) => setMrImageUrls(mrImageUrls.filter((_, idx) => idx !== i));
  const updateMrImage = (i: number, val: string) => setMrImageUrls(mrImageUrls.map((u, idx) => idx === i ? val : u));

  const unreadSupportCount = localTickets.filter(t => t.messages.length > 0 && t.messages[t.messages.length - 1].role !== "Resident").length;

  const TABS = [
    { id: "home" as const, label: "Home", Icon: IconHome },
    { id: "charges" as const, label: "Service Charges", Icon: IconCharges },
    { id: "maintenance" as const, label: "Maintenance", Icon: IconMaint },
    { id: "visitors" as const, label: "Visitor Pass", Icon: IconVisitor },
    { id: "notices" as const, label: "Notices", Icon: IconNotices },
    { id: "support" as const, label: "Support", Icon: IconSupport, count: unreadSupportCount },
  ];

  const switchTab = (id: typeof activeTab) => {
    setActiveTab(id);
    if (id === "support") { setSupportView("list"); setSelectedTicketId(null); refreshTickets(); }
    if (id === "maintenance") { setMaintView("list"); setSelectedMaintId(null); setShowMRForm(false); refreshMaint(); }
    if (id === "visitors") { setShowVisitorForm(false); setVisitorSubmitted(false); }
  };

  const selectedTicket = selectedTicketId ? localTickets.find(t => t.id === selectedTicketId) : null;

  const downloadReceipt = (ref: string, amount: number, date: string) => {
    const content = `NAGA Hummingbird Properties\nPayment Receipt\n\nRef: ${ref}\nResident: ${account.name}\nUnit: ${account.unit} — ${account.estate}\nAmount: ₦${amount.toLocaleString()}\nDate: ${date}\nStatus: PAID\n\nThank you for your payment.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NAGA-Receipt-${ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadLease = () => {
    const today = new Date().toISOString().slice(0, 10);
    const content = `NAGA Hummingbird Properties\nLEASE AGREEMENT SUMMARY\n\nResident: ${account.name}\nUnit: ${account.unit}\nEstate: ${account.estate}\nTenancy Type: ${account.type}\nDocument Generated: ${today}\n\nThis document is a summary representation of your lease agreement.\nPlease contact your estate manager for the full executed copy.\n\nEstate Manager: Blessing Omosu\nContact: +234 803 000 0010\n\nNAGA Hummingbird Properties Limited.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NAGA-Lease-${account.unit}-${account.estate.replace(/\s/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitVisitorPass = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `NGA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPass = {
      id: `VP-${String(visitors.length + 1).padStart(3, "0")}`,
      name: newVisitorName,
      phone: newVisitorPhone,
      date: visitorDate,
      purpose: newVisitorPurpose,
      passCode: code,
      status: "Active" as const,
    };
    setVisitors((prev) => [newPass, ...prev]);
    setNewVisitorName("");
    setNewVisitorPhone("");
    setNewVisitorPurpose("General visit");
    setVisitorSubmitted(true);
    setTimeout(() => { setVisitorSubmitted(false); setShowVisitorForm(false); }, 3000);
  };

  const firstName = account.name.split(" ").slice(-1)[0];

  return (
    <>
    {showOnboarding && (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999] px-6" style={{ background: "#1a1645" }}>
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(107,159,229,0.15)", border: "1px solid rgba(107,159,229,0.3)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 8L9 2.5 16 8v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" stroke="#6B9FE5" strokeWidth="1.3" fill="none" /><rect x="6.5" y="10" width="5" height="6" rx="0.5" stroke="rgba(107,159,229,0.6)" strokeWidth="1.1" fill="none" /></svg>
            </div>
            <div className="text-left">
              <div className="text-white text-[16px] font-bold tracking-wide">NAGA</div>
              <div className="text-[11px]" style={{ color: "#6B9FE5" }}>Hummingbird Properties</div>
            </div>
          </div>

          <h1 className="text-white text-[26px] font-semibold leading-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Welcome to your<br />Resident Portal, {firstName}
          </h1>
          <p className="text-[14px] mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Here is everything you can do from your dashboard.</p>

          <div className="text-left space-y-3 mb-10">
            {[
              "Check your service charge balance and make payments",
              "Submit and track maintenance requests",
              "Register visitor passes for your guests",
              "Message our support team directly",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(107,159,229,0.15)" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5" style={{ background: "#6B9FE5", color: "#1a1645" }}>{i + 1}</span>
                <span className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{step}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { sessionStorage.setItem("naga_resident_onboarded", "1"); setShowOnboarding(false); }}
            className="w-full py-4 font-semibold text-[15px] rounded-xl transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: "#6B9FE5", color: "#1a1645" }}>
            Get Started →
          </button>
        </div>
      </div>
    )}
    <div className="h-full flex flex-col overflow-hidden" style={{ fontFamily: "var(--font-sans)", background: "#F7F8FA" }}>
      {/* Header */}
      <header className="shrink-0 bg-white flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #E8EAF0", minHeight: 54 }}>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2.5 pr-4 mr-1" style={{ borderRight: "1px solid #E8EAF0" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#25205B" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 5.5L6.5 1.5l5 4V12H1.5V5.5z" stroke="#6B9FE5" strokeWidth="1.1" fill="none" /><rect x="4.5" y="7.5" width="4" height="4.5" rx="0.5" stroke="rgba(107,159,229,0.6)" strokeWidth="0.9" fill="none" /></svg>
            </div>
            <div>
              <div className="text-[12px] font-bold leading-tight" style={{ color: "#25205B" }}>NAGA</div>
              <div className="text-[9px] leading-tight" style={{ color: "#69707D" }}>Resident Portal</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: "#EAF2FC", color: "#25205B" }}>
            {account.name.split(" ")[0][0]}{account.name.split(" ")[1]?.[0] ?? ""}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-[13px] font-semibold" style={{ color: "#252731" }}>{account.name}</div>
            <div className="text-[10px]" style={{ color: "#69707D" }}>Unit {account.unit} · {account.estate} · {account.type}</div>
          </div>
        </div>
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors hover:bg-[#F7F8FA]" style={{ border: "1px solid #E8EAF0" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#25205B", color: "white" }}>
              {account.name.split(" ")[0][0]}
            </div>
            <span className="text-[12px] font-medium hidden sm:inline" style={{ color: "#252731" }}>
              Welcome, <span style={{ color: "#25205B", fontWeight: 700 }}>{account.name.split(" ")[0]}</span>
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#69707D", transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50" style={{ background: "white", boxShadow: "0 8px 24px rgba(37,32,91,0.12)", border: "1px solid #E8EAF0" }}>
              <button onClick={() => { setUserMenuOpen(false); navigate("/"); }} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6B9FE5" }}><path d="M7 1L13 6v7H1V6L7 1z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                <span className="text-[13px]" style={{ color: "#252731" }}>Main Website</span>
              </button>
              <div style={{ borderTop: "1px solid #F0F2F5" }} />
              <button onClick={() => { setUserMenuOpen(false); onLogout(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F5] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#f87171" }}><path d="M5 2H2v10h3M9 10l4-3-4-3M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-[13px]" style={{ color: "#f87171" }}>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Sidebar — lg+ */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 bg-white py-5 px-3" style={{ borderRight: "1px solid #E8EAF0" }}>
          <div className="px-3 mb-4">
            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#B0B8C4" }}>Resident Menu</div>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-all"
                style={{ background: activeTab === t.id ? "#EAF2FC" : "transparent", color: activeTab === t.id ? "#25205B" : "#69707D" }}
              >
                <span className="shrink-0" style={{ color: activeTab === t.id ? "#25205B" : "#B0B8C4" }}><t.Icon /></span>
                <span className="flex-1">{t.label}</span>
                {(t as { count?: number }).count !== undefined && (t as { count?: number }).count! > 0 && (
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25205B", color: "white" }}>
                    {(t as { count?: number }).count}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="pt-4" style={{ borderTop: "1px solid #E8EAF0" }}>
            <div className="px-3 py-2 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#69707D" }}>Estate</div>
              <div className="text-[12px] font-semibold" style={{ color: "#25205B" }}>{account.estate}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>Unit {account.unit} · {account.type}</div>
            </div>
            <button onClick={() => navigate("/")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:bg-[#F7F8FA] mt-2" style={{ color: "#69707D" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "#B0B8C4" }}><path d="M6.5 1L12.5 5.5V12H0.5V5.5L6.5 1z" stroke="currentColor" strokeWidth="1.1" fill="none" /></svg>
              Main Website
            </button>
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:bg-red-50 mt-0.5" style={{ color: "#f87171" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 1.5H2v10h2.5M8 9l4-2.5L8 4M12 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile brand strip */}
          <div className="lg:hidden shrink-0 px-5 py-2.5 flex items-center gap-2" style={{ background: "#25205B" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 7L8 2l6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="#6B9FE5" strokeWidth="1.2" fill="none" /><rect x="5.5" y="9" width="5" height="6" rx="0.5" stroke="rgba(107,159,229,0.6)" strokeWidth="1" fill="none" /></svg>
            <span className="text-white text-[12px] font-semibold tracking-wide">NAGA</span>
            <span className="text-[11px]" style={{ color: "#6B9FE5" }}>· Resident Portal</span>
          </div>

          {/* Mobile tabs */}
          <div className="lg:hidden shrink-0 bg-white" style={{ borderBottom: "1px solid #E8EAF0" }}>
            <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TABS.map((t) => (
                <button key={t.id} onClick={() => switchTab(t.id)}
                  className="px-4 py-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 shrink-0"
                  style={{ borderColor: activeTab === t.id ? "#25205B" : "transparent", color: activeTab === t.id ? "#25205B" : "#69707D" }}>
                  {t.label}
                  {(t as { count?: number }).count !== undefined && (t as { count?: number }).count! > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{(t as { count?: number }).count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 lg:p-8 space-y-5">

              {/* HOME */}
              {activeTab === "home" && (
                <>
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#25205B" }}>
                    <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=320&fit=crop&auto=format" alt={account.estate} className="w-full h-44 object-cover opacity-60" />
                    <div className="px-4 sm:px-6 pb-6 -mt-2">
                      <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "#6B9FE5" }}>Your Home</div>
                      <h2 className="text-white text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>Unit {account.unit} — {account.estate}</h2>
                      <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{account.type} · NAGA Managed Estate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickCard icon="💳" label="Service Charge" value={scStatus}
                      sub={outstanding > 0 ? `₦${(outstanding / 1_000).toFixed(0)},000 outstanding` : "Fully paid"}
                      onClick={() => switchTab("charges")} urgent={outstanding > 0} />
                    <QuickCard icon="🔧" label="Open Requests" value={localMaintItems.filter(m => m.status !== "Completed" && m.status !== "Closed").length.toString()}
                      sub="Active maintenance" onClick={() => switchTab("maintenance")} />
                    <QuickCard icon="📢" label="Notices" value={notices.length.toString()}
                      sub="Recent estate notices" onClick={() => switchTab("notices")} />
                    <QuickCard icon="💬" label="Support" value={localTickets.filter(t => t.status === "Open").length.toString()}
                      sub="Open support tickets" onClick={() => switchTab("support")} />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                      <h3 className="font-semibold text-[14px] mb-4" style={{ color: "#252731" }}>Estate Manager Contact</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#EAF2FC", color: "#25205B" }}>BO</div>
                        <div>
                          <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>Blessing Omosu</div>
                          <div className="text-[12px]" style={{ color: "#69707D" }}>Estate Manager — {account.estate}</div>
                          <div className="text-[12px] font-medium mt-0.5" style={{ color: "#6B9FE5" }}>+234 803 000 0010</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F0F2F5" }}>
                        <button
                          onClick={downloadLease}
                          className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2.5 rounded-xl w-full justify-center transition-colors hover:bg-[#F7F8FA]"
                          style={{ border: "1px solid #25205B", color: "#25205B" }}>
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3.5 7l3 3 3-3M1.5 11.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          Download Lease Agreement
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                      <h3 className="font-semibold text-[14px] mb-4" style={{ color: "#252731" }}>Quick Actions</h3>
                      <div className="space-y-2.5">
                        <button onClick={() => switchTab("maintenance")} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors" style={{ border: "1px solid #E8EAF0" }}>
                          <span className="text-lg">🔧</span>
                          <span className="text-[13px] font-medium" style={{ color: "#252731" }}>Submit maintenance request</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0" style={{ color: "#B0B8C4" }}><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <button onClick={() => { switchTab("support"); setTimeout(() => setSupportView("new"), 50); }} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors" style={{ border: "1px solid #E8EAF0" }}>
                          <span className="text-lg">💬</span>
                          <span className="text-[13px] font-medium" style={{ color: "#252731" }}>Contact customer support</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0" style={{ color: "#B0B8C4" }}><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SERVICE CHARGES */}
              {activeTab === "charges" && (
                <>
                  <div className="rounded-2xl p-6" style={{ background: "#25205B" }}>
                    <div className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "#6B9FE5" }}>Annual Facility Management Fee</div>
                    <div className="text-white text-[36px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
                      ₦{(serviceCharge / 1_000).toFixed(0)},000
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge status={scStatus} />
                      <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>Next due: {nextDue}</span>
                    </div>
                    {outstanding > 0 && (
                      <div className="mt-5">
                        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(paid / serviceCharge) * 100}%`, background: "#6B9FE5" }} />
                        </div>
                        <div className="flex justify-between mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                          <span>Paid: ₦{(paid / 1_000).toFixed(0)},000</span>
                          <span>Outstanding: ₦{(outstanding / 1_000).toFixed(0)},000</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {outstanding > 0 && (
                    <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                      <h3 className="font-semibold text-[15px] mb-4" style={{ color: "#252731" }}>Make a Payment</h3>
                      <div className="space-y-3 mb-5">
                        {[
                          { label: "Pay Full Outstanding", amount: outstanding, recommended: true, sub: "Clears your balance in full" },
                          { label: "Pay Half", amount: Math.ceil(outstanding / 2), recommended: false, sub: "Partial payment towards your balance" },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => setPaymentModal({ amount: opt.amount, desc: `Service Charge — ${opt.label}` })}
                            className="w-full text-left px-5 py-4 rounded-xl flex items-center justify-between transition-all hover:shadow-sm active:scale-[0.99]"
                            style={{ border: opt.recommended ? "2px solid #25205B" : "1px solid #E8EAF0", background: opt.recommended ? "#F7F8FA" : "white" }}
                          >
                            <div>
                              <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{opt.label}</div>
                              <div className="text-[11px] mt-0.5" style={{ color: opt.recommended ? "#6B9FE5" : "#69707D" }}>{opt.sub}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-[18px]" style={{ color: "#25205B" }}>₦{(opt.amount / 1_000).toFixed(0)},000</div>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 8h6M8 5l3 3-3 3" stroke="#6B9FE5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-[11px]" style={{ color: "#69707D" }}>Secured payment via card, bank transfer, or USSD.</p>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                    <div className="px-5 py-4 border-b border-[#E8EAF0]">
                      <h3 className="font-semibold text-[14px]" style={{ color: "#252731" }}>Payment History</h3>
                    </div>
                    <div className="divide-y divide-[#F0F2F5]">
                      {basePaid > 0 && (
                        <div className="px-5 py-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-[13px]" style={{ color: "#252731" }}>Facility Management Fee — 2025</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>2025-01-15 · Bank Transfer</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[14px]" style={{ color: "#252731" }}>₦{(basePaid / 1_000).toFixed(0)},000</div>
                            <Badge status="Paid" />
                          </div>
                        </div>
                      )}
                      {paymentHistory.map((p) => (
                        <div key={p.ref} className="px-5 py-4 flex items-center justify-between">
                          <div>
                            <div className="font-mono text-[10px] font-semibold mb-0.5" style={{ color: "#6B9FE5" }}>{p.ref}</div>
                            <div className="font-medium text-[13px]" style={{ color: "#252731" }}>Service Charge Payment</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{p.date} · {p.method}</div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <div className="font-bold text-[14px]" style={{ color: "#252731" }}>₦{(p.amount / 1_000).toFixed(0)},000</div>
                            <Badge status="Paid" />
                            <button
                              onClick={() => downloadReceipt(p.ref, p.amount, p.date)}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded"
                              style={{ border: "1px solid #25205B", color: "#25205B", fontSize: 11 }}>
                              Download Receipt
                            </button>
                          </div>
                        </div>
                      ))}
                      {basePaid === 0 && paymentHistory.length === 0 && (
                        <div className="px-5 py-6 text-center text-[13px]" style={{ color: "#69707D" }}>No payments recorded yet.</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* MAINTENANCE */}
              {activeTab === "maintenance" && (
                <>
                  {/* New request form */}
                  {showMRForm ? (
                    <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                      {mrSubmitted ? (
                        <div className="text-center py-6">
                          <div className="text-3xl mb-3">✓</div>
                          <div className="font-semibold text-[15px] mb-1" style={{ color: "#25205B" }}>Request submitted</div>
                          <div className="text-[12px]" style={{ color: "#69707D" }}>Your estate manager has been notified. You'll receive an update within 24 hours.</div>
                        </div>
                      ) : (
                        <form onSubmit={submitMR} className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-[14px]" style={{ color: "#252731" }}>Submit Maintenance Request</h4>
                            <button type="button" onClick={() => setShowMRForm(false)} className="text-[13px]" style={{ color: "#69707D" }}>Cancel</button>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Category</label>
                            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                              {["Plumbing", "Electrical", "HVAC", "Structural", "Pest Control", "Security", "General"].map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Describe the Issue</label>
                            <textarea required rows={4} value={newIssue} onChange={(e) => setNewIssue(e.target.value)}
                              placeholder="Describe the problem in detail..."
                              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Attach Photos (optional)</label>
                              {mrImageUrls.length < 4 && (
                                <button type="button" onClick={addMrImage} className="text-[11px] font-semibold" style={{ color: "#6B9FE5" }}>+ Add photo</button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {mrImageUrls.map((url, i) => (
                                <div key={i} className="flex gap-2">
                                  <input type="url" value={url} onChange={(e) => updateMrImage(i, e.target.value)}
                                    placeholder={`Photo URL ${i + 1}`}
                                    className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
                                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                                  {url && <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E8EAF0]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                                  {mrImageUrls.length > 1 && (
                                    <button type="button" onClick={() => removeMrImage(i)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 shrink-0" style={{ border: "1px solid #fca5a5", color: "#dc2626" }}>
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#25205B" }}>Submit Request</button>
                            <button type="button" onClick={() => setShowMRForm(false)} className="px-5 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : maintView === "list" ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[15px]" style={{ color: "#252731" }}>My Maintenance Requests</h3>
                        <button
                          onClick={() => { setShowMRForm(true); setNewIssue(""); setNewCategory("General"); setMrImageUrls([""]); }}
                          className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white"
                          style={{ background: "#25205B" }}>
                          + New Request
                        </button>
                      </div>

                      {localMaintItems.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="text-4xl mb-3">🔧</div>
                          <div className="font-semibold text-[15px] mb-1" style={{ color: "#252731" }}>No maintenance requests yet</div>
                          <div className="text-[12px] mb-5" style={{ color: "#69707D" }}>Submit a request and our maintenance team will attend to it promptly.</div>
                          <button onClick={() => setShowMRForm(true)} className="px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>Submit First Request</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {localMaintItems.map((m) => {
                            const priorityColor = m.priority === "Critical" ? "#dc2626" : m.priority === "High" ? "#d97706" : m.priority === "Medium" ? "#6B9FE5" : "#69707D";
                            return (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedMaintId(m.id);
                                  setMaintView("detail");
                                  setUpdateText("");
                                  setFeedbackRating(m.residentFeedback?.rating ?? 0);
                                  setFeedbackComment(m.residentFeedback?.comment ?? "");
                                  setFeedbackSubmitted(!!m.residentFeedback);
                                }}
                                className="w-full text-left bg-white rounded-2xl p-5 transition-all hover:shadow-sm"
                                style={{ border: "1px solid #E8EAF0" }}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-mono text-[11px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{m.id}</div>
                                    <div className="font-semibold text-[14px] line-clamp-2" style={{ color: "#252731" }}>{m.description}</div>
                                  </div>
                                  <Badge status={m.status} />
                                </div>
                                <div className="flex flex-wrap gap-3 text-[11px] mt-1" style={{ color: "#69707D" }}>
                                  <span>Type: <b style={{ color: "#252731" }}>{m.type}</b></span>
                                  <span>Priority: <b style={{ color: priorityColor }}>{m.priority}</b></span>
                                  <span>Submitted: <b style={{ color: "#252731" }}>{m.dateSubmitted}</b></span>
                                  {m.assignedTo !== "Unassigned" && <span>Assigned: <b style={{ color: "#252731" }}>{m.assignedTo}</b></span>}
                                </div>
                                {m.residentUpdates && m.residentUpdates.length > 0 && (
                                  <div className="mt-2 text-[11px]" style={{ color: "#6B9FE5" }}>
                                    {m.residentUpdates.length} resident update{m.residentUpdates.length > 1 ? "s" : ""} · tap to view
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : maintView === "detail" && selectedMaint ? (
                    <>
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setMaintView("list"); setSelectedMaintId(null); refreshMaint(); }} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "#6B9FE5" }}>
                          ← Back
                        </button>
                        {selectedMaint.status === "Open" && (
                          <button
                            onClick={() => { setEditDesc(selectedMaint.description); setEditType(selectedMaint.type); setMaintView("edit"); }}
                            className="ml-auto text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                            style={{ border: "1px solid #E8EAF0", color: "#25205B" }}>
                            Edit Request
                          </button>
                        )}
                      </div>

                      <div className="rounded-2xl overflow-hidden" style={{ background: "#25205B" }}>
                        <div className="px-4 sm:px-6 py-5">
                          <div className="font-mono text-[11px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{selectedMaint.id}</div>
                          <h3 className="text-white text-[18px] font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>{selectedMaint.description}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <Badge status={selectedMaint.status} />
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Submitted {selectedMaint.dateSubmitted}</span>
                            {selectedMaint.completedDate && <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Completed {selectedMaint.completedDate}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                        <h4 className="font-semibold text-[13px] mb-4" style={{ color: "#252731" }}>Request Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-[12px]">
                          {([["Category", selectedMaint.type], ["Priority", selectedMaint.priority], ["Status", selectedMaint.status], ["Assigned To", selectedMaint.assignedTo]] as [string, string][]).map(([label, val]) => (
                            <div key={label}>
                              <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#B0B8C4" }}>{label}</div>
                              <div className="font-semibold" style={{ color: "#252731" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {selectedMaint.notes && (
                          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F0F2F5" }}>
                            <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "#B0B8C4" }}>Staff Notes</div>
                            <p className="text-[13px] leading-relaxed" style={{ color: "#252731" }}>{selectedMaint.notes}</p>
                          </div>
                        )}
                      </div>

                      {selectedMaint.residentUpdates && selectedMaint.residentUpdates.length > 0 && (
                        <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                          <h4 className="font-semibold text-[13px] mb-4" style={{ color: "#252731" }}>Your Updates</h4>
                          <div className="space-y-3">
                            {selectedMaint.residentUpdates.map((u, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="w-1.5 rounded-full shrink-0 mt-1" style={{ minHeight: 40, background: "#EAF2FC" }} />
                                <div className="pb-2">
                                  <div className="text-[10px] mb-0.5" style={{ color: "#B0B8C4" }}>{u.timestamp}</div>
                                  <p className="text-[13px] leading-relaxed" style={{ color: "#252731" }}>{u.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedMaint.status !== "Completed" && selectedMaint.status !== "Closed" && (
                        <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                          <h4 className="font-semibold text-[13px] mb-1" style={{ color: "#252731" }}>Add an Update</h4>
                          <p className="text-[12px] mb-3" style={{ color: "#69707D" }}>Provide additional context or follow-up information for the maintenance team.</p>
                          <textarea
                            rows={3}
                            value={updateText}
                            onChange={(e) => setUpdateText(e.target.value)}
                            placeholder="e.g. The issue has worsened, or there's additional detail..."
                            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none mb-3"
                            style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              disabled={!updateText.trim()}
                              onClick={() => {
                                addResidentUpdate(selectedMaint.id, updateText.trim());
                                setUpdateText("");
                                refreshMaint();
                                setSelectedMaintId(selectedMaint.id);
                              }}
                              className="px-4 py-2.5 text-[13px] font-semibold rounded-xl text-white disabled:opacity-40"
                              style={{ background: "#25205B" }}>
                              Post Update
                            </button>
                            {(selectedMaint.status === "Assigned" || selectedMaint.status === "In Progress") && (
                              <button
                                onClick={() => {
                                  updateMaintenanceRequest(selectedMaint.id, {
                                    status: "Completed",
                                    completedDate: new Date().toISOString().slice(0, 10),
                                  });
                                  refreshMaint();
                                  setSelectedMaintId(selectedMaint.id);
                                }}
                                className="px-4 py-2.5 text-[13px] font-semibold rounded-xl"
                                style={{ border: "1px solid #E8EAF0", color: "#252731", background: "white" }}>
                                ✓ Mark as Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedMaint.status === "Completed" && (
                        <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                          <h4 className="font-semibold text-[13px] mb-1" style={{ color: "#252731" }}>How was the service?</h4>
                          <p className="text-[12px] mb-4" style={{ color: "#69707D" }}>Your feedback helps us improve.</p>

                          {(feedbackSubmitted || selectedMaint.residentFeedback) ? (
                            <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: "#F7F8FA" }}>
                              <div>
                                <div className="flex gap-0.5 mb-2">
                                  {[1,2,3,4,5].map((s) => (
                                    <span key={s} className="text-[20px]" style={{ color: s <= (selectedMaint.residentFeedback?.rating ?? feedbackRating) ? "#F59E0B" : "#E8EAF0" }}>★</span>
                                  ))}
                                </div>
                                {(selectedMaint.residentFeedback?.comment || feedbackComment) && (
                                  <p className="text-[13px]" style={{ color: "#252731" }}>{selectedMaint.residentFeedback?.comment ?? feedbackComment}</p>
                                )}
                                <div className="text-[11px] mt-2" style={{ color: "#69707D" }}>Thank you for your feedback.</div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "#B0B8C4" }}>Rating</div>
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setFeedbackRating(s)}
                                      className="text-[32px] transition-transform hover:scale-110"
                                      style={{ color: s <= feedbackRating ? "#F59E0B" : "#E8EAF0", lineHeight: 1 }}>
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: "#B0B8C4" }}>Comment (optional)</div>
                                <textarea
                                  rows={3}
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="Tell us about your experience..."
                                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                                />
                              </div>
                              <button
                                disabled={feedbackRating === 0}
                                type="button"
                                onClick={() => {
                                  submitResidentFeedback(selectedMaint.id, feedbackRating, feedbackComment.trim());
                                  setFeedbackSubmitted(true);
                                  refreshMaint();
                                }}
                                className="px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white disabled:opacity-40"
                                style={{ background: "#25205B" }}>
                                Submit Feedback
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : maintView === "edit" && selectedMaint ? (
                    <>
                      <button onClick={() => setMaintView("detail")} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "#6B9FE5" }}>
                        ← Back to Request
                      </button>
                      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="font-mono text-[11px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{selectedMaint.id}</div>
                        <h4 className="font-semibold text-[15px] mb-5" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>Edit Request</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Category</label>
                            <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                              {["Plumbing", "Electrical", "HVAC", "Structural", "Pest Control", "Security", "General"].map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Description</label>
                            <textarea
                              rows={5}
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                              style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              disabled={!editDesc.trim()}
                              type="button"
                              onClick={() => {
                                updateMaintenanceRequest(selectedMaint.id, { description: editDesc.trim(), type: editType });
                                refreshMaint();
                                setMaintView("detail");
                              }}
                              className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white disabled:opacity-40"
                              style={{ background: "#25205B" }}>
                              Save Changes
                            </button>
                            <button type="button" onClick={() => setMaintView("detail")} className="px-5 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </>
              )}

              {/* VISITOR PASSES */}
              {activeTab === "visitors" && (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Visitor Access Passes</h3>
                      <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Register guests and share gate pass codes</p>
                    </div>
                    {!showVisitorForm && (
                      <button
                        onClick={() => { setShowVisitorForm(true); setVisitorSubmitted(false); }}
                        className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white flex items-center gap-2"
                        style={{ background: "#25205B" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        Register Visitor
                      </button>
                    )}
                  </div>

                  {showVisitorForm && (
                    <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                      {visitorSubmitted ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-3">✓</div>
                          <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Visitor pass registered</div>
                          <div className="text-[13px]" style={{ color: "#69707D" }}>Share the gate code with your guest before they arrive.</div>
                        </div>
                      ) : (
                        <form onSubmit={submitVisitorPass} className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-[14px]" style={{ color: "#252731" }}>Register a Visitor</h4>
                            <button type="button" onClick={() => setShowVisitorForm(false)} className="text-[13px]" style={{ color: "#69707D" }}>Cancel</button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Visitor Name</label>
                              <input required value={newVisitorName} onChange={(e) => setNewVisitorName(e.target.value)}
                                placeholder="Full name"
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Phone Number</label>
                              <input required value={newVisitorPhone} onChange={(e) => setNewVisitorPhone(e.target.value)}
                                placeholder="+234 800 000 0000"
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Visit Date</label>
                              <input required type="date" value={visitorDate} onChange={(e) => setVisitorDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Purpose</label>
                              <select value={newVisitorPurpose} onChange={(e) => setNewVisitorPurpose(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                                {["General visit", "Family", "Business", "Medical", "Delivery"].map(p => <option key={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#25205B" }}>Generate Pass</button>
                            <button type="button" onClick={() => setShowVisitorForm(false)} className="px-5 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {visitors.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #E8EAF0" }}>
                      <div className="text-4xl mb-3">🪪</div>
                      <div className="font-semibold text-[15px] mb-1" style={{ color: "#252731" }}>No visitor passes yet</div>
                      <div className="text-[12px] mb-5" style={{ color: "#69707D" }}>Register a visitor to generate a gate pass code for them.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visitors.map((v) => {
                        const statusStyle =
                          v.status === "Active" ? { bg: "#EAF2FC", color: "#25205B" } :
                          v.status === "Used" ? { bg: "#fef3c7", color: "#92400e" } :
                          { bg: "#f3f4f6", color: "#6b7280" };
                        return (
                          <div key={v.id} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[10px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{v.id}</div>
                                <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{v.name}</div>
                                <div className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>{v.phone} · {v.purpose} · {v.date}</div>
                              </div>
                              <span className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0" style={{ background: statusStyle.bg, color: statusStyle.color }}>{v.status}</span>
                            </div>
                            <div className="mt-4 pt-4 flex items-center justify-between gap-4" style={{ borderTop: "1px solid #F0F2F5" }}>
                              <div>
                                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#B0B8C4" }}>Gate Pass Code</div>
                                <div className="font-mono font-bold text-[22px] tracking-widest" style={{ color: "#25205B" }}>{v.passCode}</div>
                                {v.status === "Active" && (
                                  <div className="text-[11px] mt-1" style={{ color: "#69707D" }}>Show this code at the gate on arrival</div>
                                )}
                              </div>
                              {v.status === "Active" && (
                                <button
                                  onClick={() => alert(`Share code ${v.passCode} with ${v.name} for their visit on ${v.date}.`)}
                                  className="text-[12px] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shrink-0"
                                  style={{ border: "1px solid #25205B", color: "#25205B" }}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" /><circle cx="9.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" /><circle cx="2.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M4 5.3l4-2M4 6.7l4 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
                                  Share
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* NOTICES */}
              {activeTab === "notices" && (
                <div className="space-y-4">
                  {notices.map((n, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                      <div className="text-[11px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{n.date}</div>
                      <h3 className="font-semibold text-[15px] mb-2" style={{ color: "#252731" }}>{n.title}</h3>
                      <p className="text-[13px] leading-relaxed" style={{ color: "#69707D" }}>{n.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* SUPPORT */}
              {activeTab === "support" && (
                <>
                  {/* New ticket form */}
                  {supportView === "new" && (
                    <div className="max-w-[600px]">
                      <button onClick={() => setSupportView("list")} className="flex items-center gap-2 text-[13px] font-medium mb-5" style={{ color: "#6B9FE5" }}>
                        ← Back to support
                      </button>
                      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                        {supportSubmitted ? (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-3">✓</div>
                            <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Message sent to support</div>
                            <div className="text-[13px]" style={{ color: "#69707D" }}>Our team will respond within 24 hours. You can track it in your support history.</div>
                          </div>
                        ) : (
                          <form onSubmit={submitSupportTicket} className="space-y-4">
                            <h3 className="font-semibold text-[16px]" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>New Support Message</h3>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Subject</label>
                              <input required value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                                placeholder="Brief description of your issue"
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Category</label>
                              <select value={newSupportCategory} onChange={(e) => setNewSupportCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                                {["General", "Maintenance", "Billing", "Access", "Amenity", "Escalation"].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Your Message</label>
                              <textarea required rows={5} value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Describe your issue or query in detail..."
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                            <div className="flex gap-3">
                              <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#25205B" }}>Send to Support →</button>
                              <button type="button" onClick={() => setSupportView("list")} className="px-5 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thread view */}
                  {supportView === "thread" && selectedTicket && (
                    <div className="max-w-[700px]">
                      <button onClick={() => { setSupportView("list"); setSelectedTicketId(null); }} className="flex items-center gap-2 text-[13px] font-medium mb-5" style={{ color: "#6B9FE5" }}>
                        ← Back to support
                      </button>
                      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="px-6 py-5" style={{ background: "#1a1645" }}>
                          <div className="text-[#6B9FE5] text-[10px] font-mono font-semibold mb-1">{selectedTicket.id}</div>
                          <h3 className="text-white text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{selectedTicket.subject}</h3>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <SupportStatusBadge status={selectedTicket.status} />
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Opened {selectedTicket.created}</span>
                            {selectedTicket.assignedTo !== "Unassigned" && (
                              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Assigned to {selectedTicket.assignedTo}</span>
                            )}
                          </div>
                        </div>

                        <div className="divide-y divide-[#F7F8FA]">
                          {selectedTicket.messages.filter(m => !m.internal).map((msg, i) => {
                            const isMe = msg.role === "Resident";
                            const isSystem = msg.role === "System";
                            return (
                              <div key={i} className={`px-5 py-4 ${isSystem ? "bg-[#F7F8FA]" : ""}`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${isSystem ? "bg-[#E8EAF0] text-[#69707D]" : isMe ? "bg-[#EAF2FC] text-[#25205B]" : "bg-[#25205B] text-white"}`}>
                                    {isSystem ? "⚙" : msg.from.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className="font-semibold text-[13px]" style={{ color: "#252731" }}>{isMe ? "You" : msg.from}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#69707D" }}>{msg.role}</span>
                                      <span className="text-[11px]" style={{ color: "#9DA8C0" }}>{msg.timestamp}</span>
                                    </div>
                                    <p className="text-[13px] leading-relaxed" style={{ color: isSystem ? "#9DA8C0" : "#252731", fontStyle: isSystem ? "italic" : "normal" }}>{msg.text}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {selectedTicket.status !== "Closed" && selectedTicket.status !== "Resolved" && (
                          <div className="px-5 py-4 border-t border-[#E8EAF0]" style={{ background: "#FAFBFC" }}>
                            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#69707D" }}>Reply</label>
                            <textarea rows={3} value={threadReply} onChange={(e) => setThreadReply(e.target.value)}
                              placeholder="Type your message..."
                              className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                              style={{ border: "1px solid #E8EAF0", background: "white", color: "#252731" }} />
                            <div className="flex justify-end mt-2">
                              <button onClick={() => submitThreadReply(selectedTicket.id)} disabled={!threadReply.trim()}
                                className="px-4 py-2 text-[13px] font-semibold rounded-xl text-white disabled:opacity-40"
                                style={{ background: "#25205B" }}>
                                Send Reply →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ticket list */}
                  {supportView === "list" && (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Support History</h3>
                          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Your messages to the NAGA support team</p>
                        </div>
                        <button onClick={() => setSupportView("new")} className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white flex items-center gap-2" style={{ background: "#25205B" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                          New Message
                        </button>
                      </div>

                      {localTickets.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="text-4xl mb-3">💬</div>
                          <div className="font-semibold text-[15px] mb-1" style={{ color: "#252731" }}>No support messages yet</div>
                          <div className="text-[12px] mb-5" style={{ color: "#69707D" }}>Send us a message and our team will get back to you within 24 hours.</div>
                          <button onClick={() => setSupportView("new")} className="px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>
                            Start a Conversation
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {localTickets.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedTicketId(t.id); setSupportView("thread"); }}
                              className="w-full text-left bg-white rounded-2xl p-5 transition-all hover:shadow-sm"
                              style={{ border: "1px solid #E8EAF0" }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-[10px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{t.id}</div>
                                  <div className="font-semibold text-[14px] truncate" style={{ color: "#252731" }}>{t.subject}</div>
                                  <div className="text-[11px] mt-1 truncate" style={{ color: "#69707D" }}>
                                    {t.messages[t.messages.length - 1]?.text}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <SupportStatusBadge status={t.status} />
                                  <div className="text-[10px] mt-1.5" style={{ color: "#B0B8C4" }}>{t.lastUpdated}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2.5">
                                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#69707D" }}>{t.category}</span>
                                <span className="text-[10px]" style={{ color: "#B0B8C4" }}>{t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {paymentModal && (
        <PaymentModal
          amount={paymentModal.amount}
          description={paymentModal.desc}
          onSuccess={(ref, method) => {
            const now = new Date().toISOString().slice(0, 10);
            setPaymentHistory((prev) => [{ ref, amount: paymentModal.amount, method, date: now }, ...prev]);
            setLocalPaid((prev) => Math.min(serviceCharge, prev + paymentModal.amount));
            setPaymentModal(null);
            setActiveTab("charges");
          }}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
    </>
  );
}

function QuickCard({ icon, label, value, sub, onClick, urgent }: { icon: string; label: string; value: string; sub: string; onClick: () => void; urgent?: boolean }) {
  return (
    <button onClick={onClick} className="text-left p-5 rounded-2xl transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: "white", border: `1px solid ${urgent ? "#fca5a5" : "#E8EAF0"}` }}>
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-[11px] font-medium mb-1" style={{ color: "#69707D" }}>{label}</div>
      <div className="text-[20px] font-bold mb-0.5" style={{ color: urgent ? "#dc2626" : "#25205B" }}>{value}</div>
      <div className="text-[11px]" style={{ color: "#69707D" }}>{sub}</div>
    </button>
  );
}
