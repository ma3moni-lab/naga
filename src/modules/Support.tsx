import { useState } from "react";
import { logActivity } from "../data/activityLog";
import { SHARED_SUPPORT_TICKETS, updateSupportTicket } from "../data/supportStore";

/* ─── TYPES ─── */
interface Message {
  from: string;
  role: string;
  text: string;
  timestamp: string;
  internal?: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  customerType: "Resident" | "Guest" | "Prospect";
  estate?: string;
  unit?: string;
  category: "Maintenance" | "Billing" | "Access" | "Amenity" | "Booking" | "General" | "Escalation";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Pending Customer" | "Escalated" | "Resolved" | "Closed";
  created: string;
  lastUpdated: string;
  assignedTo: string;
  slaHours: number;
  ageHours: number;
  messages: Message[];
  tags?: string[];
}

/* ─── DUMMY DATA (kept for NewTicketModal shape reference) ─── */
const _TICKETS_UNUSED: Ticket[] = [
  {
    id: "TKT-0041",
    subject: "Leaking pipe under kitchen sink — unit A7",
    customer: "Mr. Seun Adeleke",
    customerType: "Resident",
    estate: "Palm Estate",
    unit: "A7",
    category: "Maintenance",
    priority: "High",
    status: "In Progress",
    created: "2026-08-25",
    lastUpdated: "2026-08-28",
    assignedTo: "Ngozi Ibrahim",
    slaHours: 24,
    ageHours: 72,
    tags: ["plumbing", "urgent"],
    messages: [
      { from: "Mr. Seun Adeleke", role: "Resident", text: "There is water leaking under my kitchen sink since yesterday evening. The floor is getting wet and I'm worried about the cabinet below.", timestamp: "2026-08-25 18:42" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Thank you for reaching out, Mr. Adeleke. We have logged this as a high-priority maintenance issue and assigned it to our facilities team. An engineer will visit between 9am–12pm tomorrow (26 Aug).", timestamp: "2026-08-25 19:10" },
      { from: "Mr. Seun Adeleke", role: "Resident", text: "The engineer came but said he needs to order a replacement part. When will this be resolved?", timestamp: "2026-08-27 11:20" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "The replacement compression fitting has been ordered — ETA is 29 August. We will follow up with you as soon as the part arrives and schedule the final repair.", timestamp: "2026-08-27 14:05", internal: false },
      { from: "System", role: "System", text: "SLA breach — ticket exceeded 24-hour response target at 2026-08-26 18:42. Escalation flag raised.", timestamp: "2026-08-26 18:42", internal: true },
    ],
  },
  {
    id: "TKT-0042",
    subject: "Service charge invoice — incorrect amount",
    customer: "Mrs. Grace Okafor",
    customerType: "Resident",
    estate: "Sapphire Court",
    unit: "C3",
    category: "Billing",
    priority: "Medium",
    status: "Pending Customer",
    created: "2026-08-24",
    lastUpdated: "2026-08-27",
    assignedTo: "Chioma Ezinwa",
    slaHours: 48,
    ageHours: 96,
    tags: ["billing", "invoice"],
    messages: [
      { from: "Mrs. Grace Okafor", role: "Resident", text: "My August service charge invoice shows ₦145,000 but my lease agreement states ₦118,000 per quarter. Please clarify the discrepancy.", timestamp: "2026-08-24 09:15" },
      { from: "Chioma Ezinwa", role: "Finance", text: "Good morning Mrs. Okafor. I have pulled your contract and can see the discrepancy. The additional ₦27,000 relates to a generator fuel levy introduced in Q3. I will send you the estate circular that was distributed in July explaining this charge.", timestamp: "2026-08-24 11:40" },
      { from: "Mrs. Grace Okafor", role: "Resident", text: "I did not receive that circular. Please resend. Also, can the levy be paid separately or must it be bundled?", timestamp: "2026-08-25 08:30" },
      { from: "Chioma Ezinwa", role: "Finance", text: "Resent the July circular to your registered email. You can pay the levy as a separate line item — your account has been updated to reflect this split. Awaiting your confirmation that you have received the circular.", timestamp: "2026-08-25 10:15" },
    ],
  },
  {
    id: "TKT-0043",
    subject: "Early check-in request — apt 14B",
    customer: "Amina Suleiman",
    customerType: "Guest",
    category: "Booking",
    priority: "Low",
    status: "Resolved",
    created: "2026-08-22",
    lastUpdated: "2026-08-23",
    assignedTo: "Ngozi Ibrahim",
    slaHours: 12,
    ageHours: 8,
    tags: ["check-in", "stays"],
    messages: [
      { from: "Amina Suleiman", role: "Guest", text: "Hi, I have a booking for 14B from 24 Aug. Is it possible to check in at 11am instead of 2pm? My flight lands at 8am.", timestamp: "2026-08-22 14:05" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Hello Amina! I have confirmed with our housekeeping team — the unit will be ready by 11am on 24 Aug. We'll send your key code to this email by 9am that morning.", timestamp: "2026-08-22 15:22" },
      { from: "Amina Suleiman", role: "Guest", text: "That's perfect, thank you!", timestamp: "2026-08-22 15:30" },
    ],
  },
  {
    id: "TKT-0044",
    subject: "Pool access card not working",
    customer: "Mr. James Iyede",
    customerType: "Resident",
    estate: "Palm Estate",
    unit: "B12",
    category: "Access",
    priority: "Medium",
    status: "Open",
    created: "2026-08-28",
    lastUpdated: "2026-08-28",
    assignedTo: "Unassigned",
    slaHours: 24,
    ageHours: 4,
    tags: ["access", "amenity"],
    messages: [
      { from: "Mr. James Iyede", role: "Resident", text: "My pool access card has stopped working since this morning. I tried it 3 times. Other residents' cards seem to work fine.", timestamp: "2026-08-28 10:15" },
    ],
  },
  {
    id: "TKT-0045",
    subject: "Gym equipment out of service — elliptical machine",
    customer: "Mrs. Grace Okafor",
    customerType: "Resident",
    estate: "Sapphire Court",
    unit: "C3",
    category: "Amenity",
    priority: "Low",
    status: "Open",
    created: "2026-08-27",
    lastUpdated: "2026-08-27",
    assignedTo: "Ngozi Ibrahim",
    slaHours: 72,
    ageHours: 28,
    tags: ["gym", "facilities"],
    messages: [
      { from: "Mrs. Grace Okafor", role: "Resident", text: "The elliptical machine in the gym has had an 'out of service' sign on it for two weeks now. When will it be repaired or replaced?", timestamp: "2026-08-27 07:55" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Thank you for flagging this again. Our equipment service provider has been contacted and is scheduled to inspect on 2 September. We'll update you with the outcome.", timestamp: "2026-08-27 09:40" },
    ],
  },
  {
    id: "TKT-0046",
    subject: "Late checkout request — Apt 8A",
    customer: "Femi Adeyinka",
    customerType: "Guest",
    category: "Booking",
    priority: "Low",
    status: "Resolved",
    created: "2026-08-21",
    lastUpdated: "2026-08-21",
    assignedTo: "Ngozi Ibrahim",
    slaHours: 6,
    ageHours: 2,
    tags: ["checkout", "stays"],
    messages: [
      { from: "Femi Adeyinka", role: "Guest", text: "Can I have a late checkout (3pm) on 22 Aug? I have a late afternoon flight.", timestamp: "2026-08-21 19:00" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Hi Femi — 3pm late checkout is confirmed for 22 Aug. A ₦10,000 late checkout fee will be added to your final invoice. Please confirm you are happy with this.", timestamp: "2026-08-21 19:30" },
      { from: "Femi Adeyinka", role: "Guest", text: "That works, confirmed.", timestamp: "2026-08-21 19:45" },
    ],
  },
  {
    id: "TKT-0047",
    subject: "Noise complaint — neighbours in unit A6",
    customer: "Mr. Seun Adeleke",
    customerType: "Resident",
    estate: "Palm Estate",
    unit: "A7",
    category: "Escalation",
    priority: "Critical",
    status: "Escalated",
    created: "2026-08-26",
    lastUpdated: "2026-08-28",
    assignedTo: "Ngozi Ibrahim",
    slaHours: 8,
    ageHours: 52,
    tags: ["noise", "escalation", "community"],
    messages: [
      { from: "Mr. Seun Adeleke", role: "Resident", text: "This is now the fourth weekend with loud music from unit A6 past midnight. I have tried speaking to them myself but nothing has changed. This is now unacceptable.", timestamp: "2026-08-26 01:10" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Mr. Adeleke, we sincerely apologise. A formal warning notice has been issued to unit A6. Our estate manager has been informed and will personally follow up. This is now on escalation watch.", timestamp: "2026-08-26 09:05" },
      { from: "System", role: "System", text: "Ticket auto-escalated due to repeat complaint from same customer within 7 days.", timestamp: "2026-08-26 09:05", internal: true },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Update: Estate manager met with unit A6 occupant on 27 Aug. Written commitment received to observe quiet hours. We will monitor over the next two weekends.", timestamp: "2026-08-28 10:00" },
    ],
  },
  {
    id: "TKT-0048",
    subject: "Request for additional parking space",
    customer: "Mr. James Iyede",
    customerType: "Resident",
    estate: "Palm Estate",
    unit: "B12",
    category: "General",
    priority: "Low",
    status: "Closed",
    created: "2026-08-10",
    lastUpdated: "2026-08-15",
    assignedTo: "Ngozi Ibrahim",
    slaHours: 72,
    ageHours: 24,
    tags: ["parking", "lease"],
    messages: [
      { from: "Mr. James Iyede", role: "Resident", text: "My spouse recently got a second vehicle. Is there a second parking spot available for unit B12?", timestamp: "2026-08-10 14:30" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "We have one additional space available in Bay 3. The monthly fee is ₦25,000. Please confirm if you would like to proceed and we will update your lease addendum.", timestamp: "2026-08-11 10:00" },
      { from: "Mr. James Iyede", role: "Resident", text: "Yes, please proceed.", timestamp: "2026-08-11 14:15" },
      { from: "Ngozi Ibrahim", role: "Admin", text: "Parking addendum has been signed and Bay 3 access sticker issued. Your access card has been updated. Ticket closed.", timestamp: "2026-08-15 09:30" },
    ],
  },
];

/* ─── HELPERS ─── */
function fmt(n: number) {
  if (n >= 24) return `${Math.floor(n / 24)}d ${n % 24}h`;
  return `${n}h`;
}

function StatusBadge({ status }: { status: Ticket["status"] }) {
  const map: Record<string, string> = {
    Open: "bg-amber-50 text-amber-700 border-amber-200",
    "In Progress": "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    "Pending Customer": "bg-purple-50 text-purple-700 border-purple-200",
    Escalated: "bg-red-50 text-red-600 border-red-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Ticket["priority"] }) {
  const map: Record<string, string> = {
    Critical: "text-red-600 bg-red-50 border-red-200",
    High: "text-orange-600 bg-orange-50 border-orange-200",
    Medium: "text-amber-600 bg-amber-50 border-amber-200",
    Low: "text-gray-500 bg-gray-50 border-gray-200",
  };
  const dots: Record<string, string> = { Critical: "bg-red-500", High: "bg-orange-500", Medium: "bg-amber-500", Low: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[priority]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority]}`} />
      {priority}
    </span>
  );
}

function CategoryBadge({ cat }: { cat: Ticket["category"] }) {
  const icons: Record<string, string> = {
    Maintenance: "🔧",
    Billing: "💳",
    Access: "🔑",
    Amenity: "🏊",
    Booking: "📅",
    General: "📝",
    Escalation: "⚠️",
  };
  return (
    <span className="text-[11px] text-[#69707D] flex items-center gap-1">
      <span>{icons[cat] ?? "📝"}</span>{cat}
    </span>
  );
}

function SLABar({ ageHours, slaHours }: { ageHours: number; slaHours: number }) {
  const pct = Math.min((ageHours / slaHours) * 100, 100);
  const color = pct >= 100 ? "#dc2626" : pct >= 75 ? "#f97316" : "#6B9FE5";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#E8EAF0] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono shrink-0" style={{ color: pct >= 100 ? "#dc2626" : "#69707D" }}>
        {pct >= 100 ? "BREACHED" : `${fmt(slaHours - ageHours)} left`}
      </span>
    </div>
  );
}

/* ─── TICKET DETAIL ─── */
function TicketDetail({
  ticket,
  onBack,
  onUpdate,
}: {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Ticket>) => void;
}) {
  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const staffName: string = staffInfo.name ?? "Support Agent";
  const staffRole: string = staffInfo.role ?? "admin";

  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [localMessages, setLocalMessages] = useState(ticket.messages);

  const handleReply = () => {
    if (!reply.trim()) return;
    const msg: Message = {
      from: staffName,
      role: staffRole.toUpperCase(),
      text: reply,
      timestamp: new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", ""),
      internal: isInternal,
    };
    setLocalMessages((prev) => [...prev, msg]);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: staffName,
      role: staffRole.toUpperCase(),
      action: isInternal ? "Internal Note Added" : "Support Reply Sent",
      module: "Support",
      detail: `${isInternal ? "Internal note" : "Reply"} on ticket ${ticket.id} (${ticket.subject}) — ${reply.slice(0, 80)}${reply.length > 80 ? "…" : ""}`,
      ref: ticket.id,
      severity: "info",
    });
    setReply("");
    onUpdate(ticket.id, { lastUpdated: new Date().toISOString().slice(0, 10) });
  };

  const updateStatus = (status: Ticket["status"]) => {
    onUpdate(ticket.id, { status });
  };

  const visibleMessages = localMessages.filter((m) => {
    if (staffRole === "ceo" || staffRole === "admin") return true;
    return !m.internal;
  });

  return (
    <div className="p-4 md:p-6 max-w-[900px] space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="font-medium hover:underline" style={{ color: "#6B9FE5" }}>Customer Support</button>
        <span style={{ color: "#69707D" }}>/</span>
        <span className="font-mono font-semibold text-[13px]" style={{ color: "#252731" }}>{ticket.id}</span>
      </div>

      {/* Header card */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-6 py-5" style={{ background: "#1a1645" }}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-[#6B9FE5] text-xs font-mono font-semibold mb-1">{ticket.id}</div>
              <h2 className="text-white text-lg font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>{ticket.subject}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-[#6B9FE5] text-xs">{ticket.customer}</span>
                {ticket.estate && <span className="text-[rgba(255,255,255,0.35)] text-xs">{ticket.estate}{ticket.unit ? ` · Unit ${ticket.unit}` : ""}</span>}
                <span className="text-[rgba(255,255,255,0.35)] text-xs">Opened {ticket.created}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#F0F2F5] border-t border-[#E8EAF0]">
          {[
            { label: "Category", value: <CategoryBadge cat={ticket.category} /> },
            { label: "Assigned To", value: ticket.assignedTo },
            { label: "Age", value: fmt(ticket.ageHours) },
            { label: "SLA Target", value: `${ticket.slaHours}h response` },
          ].map((f) => (
            <div key={f.label} className="px-5 py-3">
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>{f.label}</div>
              <div className="text-[13px] font-medium" style={{ color: "#252731" }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* SLA bar */}
        <div className="px-5 py-3 border-t border-[#E8EAF0]">
          <div className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>SLA Progress</div>
          <SLABar ageHours={ticket.ageHours} slaHours={ticket.slaHours} />
        </div>
      </div>

      {/* Quick actions */}
      {ticket.status !== "Closed" && ticket.status !== "Resolved" && (
        <div className="flex flex-wrap gap-2">
          {ticket.status !== "In Progress" && ticket.status !== "Escalated" && (
            <button onClick={() => updateStatus("In Progress")} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#6B9FE5] text-[#6B9FE5] hover:bg-[#EAF2FC] transition-colors">
              Mark In Progress
            </button>
          )}
          {ticket.status !== "Pending Customer" && (
            <button onClick={() => updateStatus("Pending Customer")} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors">
              Await Customer Reply
            </button>
          )}
          {ticket.status !== "Escalated" && (
            <button onClick={() => updateStatus("Escalated")} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
              Escalate
            </button>
          )}
          <button onClick={() => updateStatus("Resolved")} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
            Mark Resolved
          </button>
        </div>
      )}

      {/* Conversation thread */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0]">
          <h3 className="font-semibold text-[14px]" style={{ color: "#252731" }}>Conversation</h3>
        </div>
        <div className="divide-y divide-[#F7F8FA]">
          {visibleMessages.map((msg, i) => {
            const isSystem = msg.role === "System";
            const isStaff = ["Admin", "Finance", "CEO", "ADMIN", "FINANCE", "CEO", "SUPERVISOR", "ESTATE", "PCO", "IVM"].some(r => msg.role.toUpperCase() === r || msg.role === "System");
            const isCustomer = !isStaff;
            return (
              <div key={i} className={`px-5 py-4 ${msg.internal ? "opacity-70" : ""} ${isSystem ? "bg-[#F7F8FA]" : ""}`}>
                {msg.internal && (
                  <div className="mb-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600">Internal Note</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${isSystem ? "bg-[#E8EAF0] text-[#69707D]" : isCustomer ? "bg-purple-100 text-purple-700" : "bg-[#EAF2FC] text-[#25205B]"}`}>
                    {isSystem ? "⚙" : msg.from.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[13px]" style={{ color: "#252731" }}>{msg.from}</span>
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

        {/* Reply box */}
        {ticket.status !== "Closed" && (
          <div className="px-5 py-4 border-t border-[#E8EAF0] bg-[#FAFBFC]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Reply</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="w-3.5 h-3.5 accent-amber-500" />
                <span className="text-[11px]" style={{ color: "#69707D" }}>Internal note only</span>
              </label>
            </div>
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your response…"
              className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
              style={{ border: "1px solid #E8EAF0", background: "#fff", color: "#252731" }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleReply}
                disabled={!reply.trim()}
                className="px-4 py-2 text-[13px] font-semibold rounded-xl text-white transition-colors disabled:opacity-40"
                style={{ background: "#25205B" }}
              >
                {isInternal ? "Add Note" : "Send Reply"} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── NEW TICKET MODAL ─── */
function NewTicketModal({ onClose, onSave }: { onClose: () => void; onSave: (t: Ticket) => void }) {
  const [subject, setSubject] = useState("");
  const [customer, setCustomer] = useState("");
  const [customerType, setCustomerType] = useState<Ticket["customerType"]>("Resident");
  const [category, setCategory] = useState<Ticket["category"]>("General");
  const [priority, setPriority] = useState<Ticket["priority"]>("Medium");
  const [message, setMessage] = useState("");

  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const staffName: string = staffInfo.name ?? "Support Agent";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket: Ticket = {
      id: `TKT-${(Math.floor(Math.random() * 900) + 100).toString()}`,
      subject, customer, customerType, category, priority,
      status: "Open",
      created: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10),
      assignedTo: staffName,
      slaHours: priority === "Critical" ? 4 : priority === "High" ? 24 : priority === "Medium" ? 48 : 72,
      ageHours: 0,
      messages: message.trim() ? [{ from: staffName, role: "Admin", text: message, timestamp: new Date().toLocaleString("en-GB") }] : [],
    };
    onSave(ticket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,13,46,0.6)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] mx-4 overflow-hidden" style={{ animation: "modalIn 0.2s ease" }}>
        <div className="px-6 py-5 border-b border-[#E8EAF0] flex items-center justify-between">
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>New Support Ticket</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[18px] leading-none hover:bg-[#F7F8FA] transition-colors" style={{ color: "#69707D" }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Subject <span style={{ color: "#dc2626" }}>*</span></label>
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of the issue" className="w-full px-4 py-3 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Customer Name <span style={{ color: "#dc2626" }}>*</span></label>
              <input required value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Customer Type</label>
              <select value={customerType} onChange={(e) => setCustomerType(e.target.value as Ticket["customerType"])} className="w-full px-3 py-3 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                <option>Resident</option>
                <option>Guest</option>
                <option>Prospect</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Ticket["category"])} className="w-full px-3 py-3 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                <option>Maintenance</option>
                <option>Billing</option>
                <option>Access</option>
                <option>Amenity</option>
                <option>Booking</option>
                <option>General</option>
                <option>Escalation</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Ticket["priority"])} className="w-full px-3 py-3 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Initial message (optional)</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue in detail…" className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-[13px] font-semibold border" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#25205B" }}>Create Ticket →</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function Support() {
  const suppStaffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const suppStaffName: string = suppStaffInfo.name ?? "Support Agent";
  const suppStaffRole: string = (suppStaffInfo.role ?? "admin").toUpperCase();

  const [tickets, setTickets] = useState<Ticket[]>([...SHARED_SUPPORT_TICKETS]);
  const [selected, setSelected] = useState<string | null>(null);
  const [customerTab, setCustomerTab] = useState<"Residents" | "Guests">("Residents");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const ticket = selected ? tickets.find((t) => t.id === selected) : null;

  const updateTicket = (id: string, patch: Partial<Ticket>) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
    updateSupportTicket(id, patch);
  };

  const refreshFromStore = () => {
    setTickets([...SHARED_SUPPORT_TICKETS]);
  };

  if (ticket) {
    return <TicketDetail ticket={ticket} onBack={() => { setSelected(null); refreshFromStore(); }} onUpdate={updateTicket} />;
  }

  const statuses = ["All", "Open", "In Progress", "Pending Customer", "Escalated", "Resolved", "Closed"];
  const categories = ["All", "Maintenance", "Billing", "Access", "Amenity", "Booking", "Escalation", "General"];

  const customerTypeFilter = customerTab === "Residents" ? "Resident" : "Guest";

  const filtered = tickets.filter((t) => {
    if (t.customerType !== customerTypeFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (catFilter !== "All" && t.category !== catFilter) return false;
    if (search.trim() && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.customer.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const residentTickets = tickets.filter(t => t.customerType === "Resident");
  const guestTickets = tickets.filter(t => t.customerType === "Guest");
  const openCount = filtered.filter((t) => t.status === "Open").length;
  const escalatedCount = filtered.filter((t) => t.status === "Escalated").length;
  const slaBreached = filtered.filter((t) => t.ageHours > t.slaHours && t.status !== "Closed" && t.status !== "Resolved").length;
  const resolvedToday = filtered.filter((t) => t.status === "Resolved" && t.lastUpdated === "2026-08-28").length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Customer Support</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Resident & guest support tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshFromStore} className="text-[12px] font-medium px-3 py-2 rounded-lg hover:bg-[#F7F8FA] transition-colors flex items-center gap-1.5" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6a5 5 0 005 5 5 5 0 004.3-2.5M11 6a5 5 0 00-5-5 5 5 0 00-4.3 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M1 2.5V6h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Refresh
          </button>
          <button onClick={() => setShowNew(true)} className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors">
            + New Ticket
          </button>
        </div>
      </div>

      {/* Customer Type Tabs */}
      <div className="flex gap-0" style={{ borderBottom: "1px solid #E8EAF0" }}>
        {(["Residents", "Guests"] as const).map((tab) => {
          const count = tab === "Residents" ? residentTickets.length : guestTickets.length;
          const openC = tab === "Residents" ? residentTickets.filter(t => t.status === "Open").length : guestTickets.filter(t => t.status === "Open").length;
          return (
            <button
              key={tab}
              onClick={() => { setCustomerTab(tab); setStatusFilter("All"); setCatFilter("All"); setSearch(""); }}
              className="flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 transition-all"
              style={{ borderColor: customerTab === tab ? "#25205B" : "transparent", color: customerTab === tab ? "#25205B" : "#69707D" }}
            >
              {tab === "Residents" ? "🏘" : "🛋"} {tab}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: customerTab === tab ? "#EAF2FC" : "#F7F8FA", color: customerTab === tab ? "#25205B" : "#9DA8C0" }}>
                {count}
              </span>
              {openC > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>
                  {openC} open
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: openCount, sub: customerTab === "Residents" ? "Resident tickets" : "Guest tickets", accent: "#D97706" },
          { label: "Escalated", value: escalatedCount, sub: "Needs attention", accent: "#DC2626" },
          { label: "SLA Breached", value: slaBreached, sub: "Overdue response", accent: "#EF4444" },
          { label: "Resolved Today", value: resolvedToday, sub: "28 August 2026", accent: "#059669" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.value > 0 ? s.accent : "#252731" }}>{s.value}</div>
            <div className="text-[#69707D] text-xs mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#9DA8C0" strokeWidth="1.4" />
            <path d="M10 10l2.5 2.5" stroke="#9DA8C0" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${customerTab.toLowerCase()} tickets…`}
            className="w-full pl-9 pr-4 py-2 text-[13px] rounded-xl outline-none"
            style={{ border: "1px solid #E8EAF0", background: "white", color: "#252731" }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                background: statusFilter === s ? "#25205B" : "white",
                color: statusFilter === s ? "white" : "#69707D",
                border: `1px solid ${statusFilter === s ? "#25205B" : "#E8EAF0"}`,
              }}
            >{s}</button>
          ))}
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-[12px] outline-none"
          style={{ border: "1px solid #E8EAF0", background: "white", color: "#252731" }}
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Ticket list */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                {["Ticket", "Customer", "Subject", "Category", "Priority", "Status", "SLA", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[13px]" style={{ color: "#9DA8C0" }}>No {customerTab.toLowerCase()} tickets match current filters.</td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-[#F7F8FA] cursor-pointer" onClick={() => setSelected(t.id)}>
                  <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: "#6B9FE5" }}>{t.id}</td>
                  <td className="px-5 py-3">
                    <div className="text-xs font-medium" style={{ color: "#252731" }}>{t.customer}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#9DA8C0" }}>{t.customerType}{t.estate ? ` · ${t.estate}` : ""}</div>
                  </td>
                  <td className="px-5 py-3 max-w-[240px]">
                    <div className="text-xs text-[#252731] truncate">{t.subject}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.tags?.map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#9DA8C0", border: "1px solid #E8EAF0" }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3"><CategoryBadge cat={t.category} /></td>
                  <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3 min-w-[130px]">
                    <SLABar ageHours={t.ageHours} slaHours={t.slaHours} />
                  </td>
                  <td className="px-5 py-3 text-xs font-medium" style={{ color: "#6B9FE5" }}>View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onSave={(t) => {
            setTickets((prev) => [t, ...prev]);
            logActivity({
              timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
              actor: suppStaffName,
              role: suppStaffRole,
              action: "Support Ticket Created",
              module: "Support",
              detail: `New ticket created: ${t.id} — "${t.subject}" for ${t.customer} (${t.customerType}).`,
              ref: t.id,
              severity: "info",
            });
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}
