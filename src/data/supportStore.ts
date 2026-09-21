export interface SupportMessage {
  from: string;
  role: string;
  text: string;
  timestamp: string;
  internal?: boolean;
}

export interface SupportTicket {
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
  messages: SupportMessage[];
  tags?: string[];
  source: "portal" | "staff";
}

export const SHARED_SUPPORT_TICKETS: SupportTicket[] = [
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
    assignedTo: "Ngozi Nwosu",
    slaHours: 24,
    ageHours: 72,
    tags: ["plumbing", "urgent"],
    source: "staff",
    messages: [
      { from: "Mr. Seun Adeleke", role: "Resident", text: "There is water leaking under my kitchen sink since yesterday evening. The floor is getting wet and I'm worried about the cabinet below.", timestamp: "2026-08-25 18:42" },
      { from: "Ngozi Nwosu", role: "Admin", text: "Thank you for reaching out, Mr. Adeleke. We have logged this as a high-priority maintenance issue and assigned it to our facilities team. An engineer will visit between 9am–12pm tomorrow (26 Aug).", timestamp: "2026-08-25 19:10" },
      { from: "Mr. Seun Adeleke", role: "Resident", text: "The engineer came but said he needs to order a replacement part. When will this be resolved?", timestamp: "2026-08-27 11:20" },
      { from: "Ngozi Nwosu", role: "Admin", text: "The replacement compression fitting has been ordered — ETA is 29 August. We will follow up with you as soon as the part arrives.", timestamp: "2026-08-27 14:05" },
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
    source: "staff",
    messages: [
      { from: "Mrs. Grace Okafor", role: "Resident", text: "My August service charge invoice shows ₦145,000 but my lease agreement states ₦118,000 per quarter. Please clarify the discrepancy.", timestamp: "2026-08-24 09:15" },
      { from: "Chioma Ezinwa", role: "Finance", text: "Good morning Mrs. Okafor. I have pulled your contract and can see the discrepancy. The additional ₦27,000 relates to a generator fuel levy introduced in Q3.", timestamp: "2026-08-24 11:40" },
      { from: "Mrs. Grace Okafor", role: "Resident", text: "I did not receive that circular. Please resend. Also, can the levy be paid separately or must it be bundled?", timestamp: "2026-08-25 08:30" },
      { from: "Chioma Ezinwa", role: "Finance", text: "Resent the July circular to your registered email. You can pay the levy as a separate line item — your account has been updated.", timestamp: "2026-08-25 10:15" },
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
    assignedTo: "Ngozi Nwosu",
    slaHours: 12,
    ageHours: 8,
    tags: ["check-in", "stays"],
    source: "portal",
    messages: [
      { from: "Amina Suleiman", role: "Guest", text: "Hi, I have a booking for 14B from 24 Aug. Is it possible to check in at 11am instead of 2pm? My flight lands at 8am.", timestamp: "2026-08-22 14:05" },
      { from: "Ngozi Nwosu", role: "Admin", text: "Hello Amina! I have confirmed with our housekeeping team — the unit will be ready by 11am on 24 Aug. We'll send your key code to this email by 9am that morning.", timestamp: "2026-08-22 15:22" },
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
    source: "staff",
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
    assignedTo: "Ngozi Nwosu",
    slaHours: 72,
    ageHours: 28,
    tags: ["gym", "facilities"],
    source: "staff",
    messages: [
      { from: "Mrs. Grace Okafor", role: "Resident", text: "The elliptical machine in the gym has had an 'out of service' sign on it for two weeks now. When will it be repaired or replaced?", timestamp: "2026-08-27 07:55" },
      { from: "Ngozi Nwosu", role: "Admin", text: "Thank you for flagging this again. Our equipment service provider has been contacted and is scheduled to inspect on 2 September.", timestamp: "2026-08-27 09:40" },
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
    assignedTo: "Ngozi Nwosu",
    slaHours: 6,
    ageHours: 2,
    tags: ["checkout", "stays"],
    source: "portal",
    messages: [
      { from: "Femi Adeyinka", role: "Guest", text: "Can I have a late checkout (3pm) on 22 Aug? I have a late afternoon flight.", timestamp: "2026-08-21 19:00" },
      { from: "Ngozi Nwosu", role: "Admin", text: "Hi Femi — 3pm late checkout is confirmed for 22 Aug. A ₦10,000 late checkout fee will be added to your final invoice.", timestamp: "2026-08-21 19:30" },
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
    assignedTo: "Ngozi Nwosu",
    slaHours: 8,
    ageHours: 52,
    tags: ["noise", "escalation", "community"],
    source: "staff",
    messages: [
      { from: "Mr. Seun Adeleke", role: "Resident", text: "This is now the fourth weekend with loud music from unit A6 past midnight. I have tried speaking to them myself but nothing has changed.", timestamp: "2026-08-26 01:10" },
      { from: "Ngozi Nwosu", role: "Admin", text: "Mr. Adeleke, we sincerely apologise. A formal warning notice has been issued to unit A6. Our estate manager has been informed and will personally follow up.", timestamp: "2026-08-26 09:05" },
      { from: "System", role: "System", text: "Ticket auto-escalated due to repeat complaint from same customer within 7 days.", timestamp: "2026-08-26 09:05", internal: true },
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
    assignedTo: "Ngozi Nwosu",
    slaHours: 72,
    ageHours: 24,
    tags: ["parking", "lease"],
    source: "staff",
    messages: [
      { from: "Mr. James Iyede", role: "Resident", text: "My spouse recently got a second vehicle. Is there a second parking spot available for unit B12?", timestamp: "2026-08-10 14:30" },
      { from: "Ngozi Nwosu", role: "Admin", text: "We have one additional space available in Bay 3. The monthly fee is ₦25,000. Please confirm if you would like to proceed.", timestamp: "2026-08-11 10:00" },
      { from: "Mr. James Iyede", role: "Resident", text: "Yes, please proceed.", timestamp: "2026-08-11 14:15" },
      { from: "Ngozi Nwosu", role: "Admin", text: "Parking addendum has been signed and Bay 3 access sticker issued. Ticket closed.", timestamp: "2026-08-15 09:30" },
    ],
  },
];

export function addSupportTicket(ticket: Omit<SupportTicket, "id">) {
  const id = `TKT-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
  const full: SupportTicket = { id, ...ticket };
  SHARED_SUPPORT_TICKETS.unshift(full);
  return id;
}

export function updateSupportTicket(id: string, patch: Partial<SupportTicket>) {
  const idx = SHARED_SUPPORT_TICKETS.findIndex((t) => t.id === id);
  if (idx !== -1) Object.assign(SHARED_SUPPORT_TICKETS[idx], patch);
}

export function addMessageToTicket(ticketId: string, msg: SupportMessage) {
  const ticket = SHARED_SUPPORT_TICKETS.find((t) => t.id === ticketId);
  if (ticket) {
    ticket.messages.push(msg);
    ticket.lastUpdated = new Date().toISOString().slice(0, 10);
  }
}
