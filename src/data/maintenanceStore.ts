// Shared mutable store for maintenance requests so ResidentPortal
// submissions are visible in the Estates admin module.

export interface ResidentUpdate {
  text: string;
  timestamp: string;
}

export interface ResidentFeedback {
  rating: number;
  comment: string;
  date: string;
}

export interface SharedMaintRequest {
  id: string;
  estate: string;
  unit: string;
  resident: string;
  type: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Assigned" | "In Progress" | "Completed" | "Closed";
  dateSubmitted: string;
  assignedTo: string;
  notes: string;
  completedDate?: string;
  source: "resident_portal" | "admin" | "staff";
  residentUpdates?: ResidentUpdate[];
  residentFeedback?: ResidentFeedback;
}

// Pre-seeded with the existing dummy maintenance requests (Estates already
// reads from MAINTENANCE_REQUESTS in dummy.ts — this store starts with the
// same data so Estates can switch to importing from here).
export const SHARED_MAINTENANCE: SharedMaintRequest[] = [
  {
    id: "MNT-001",
    estate: "Palm Estate",
    unit: "A7",
    resident: "Mr. Seun Adeleke",
    type: "Plumbing",
    description: "Leaking pipe under kitchen sink — water pooling under cabinet.",
    priority: "High",
    status: "In Progress",
    dateSubmitted: "2026-08-25",
    assignedTo: "Emeka Obi",
    notes: "Replacement compression fitting ordered, ETA 29 Aug. Resident notified.",
    source: "resident_portal",
    residentUpdates: [
      { text: "The engineer came on 26 Aug but said he needs to order a part. The leak is still dripping slowly — I've placed a bucket under the pipe for now.", timestamp: "2026-08-26 12:30" },
    ],
  },
  {
    id: "MNT-002",
    estate: "Sapphire Court",
    unit: "C3",
    resident: "Mrs. Grace Okafor",
    type: "Electrical",
    description: "Faulty light switch in master bedroom — switch plate sparks on contact.",
    priority: "Critical",
    status: "Assigned",
    dateSubmitted: "2026-08-27",
    assignedTo: "Chidi Nwosu",
    notes: "Electrician scheduled for 29 Aug morning.",
    source: "resident_portal",
  },
  {
    id: "MNT-003",
    estate: "Emerald Gardens",
    unit: "B2",
    resident: "Mr. Femi Adewale",
    type: "HVAC",
    description: "Air conditioning unit not cooling — room temperature remains at 31°C.",
    priority: "High",
    status: "Open",
    dateSubmitted: "2026-08-28",
    assignedTo: "Unassigned",
    notes: "",
    source: "resident_portal",
  },
  {
    id: "MNT-004",
    estate: "Palm Estate",
    unit: "B12",
    resident: "Mr. James Iyede",
    type: "Access",
    description: "Pool access card not working.",
    priority: "Medium",
    status: "Open",
    dateSubmitted: "2026-08-28",
    assignedTo: "Unassigned",
    notes: "",
    source: "resident_portal",
  },
  {
    id: "MNT-005",
    estate: "Sapphire Court",
    unit: "C3",
    resident: "Mrs. Grace Okafor",
    type: "Amenity",
    description: "Gym elliptical machine out of service for two weeks.",
    priority: "Low",
    status: "Assigned",
    dateSubmitted: "2026-08-27",
    assignedTo: "Equipment Services Ltd",
    notes: "Service provider inspection scheduled 2 September.",
    source: "admin",
  },
  {
    id: "MNT-006",
    estate: "Palm Estate",
    unit: "Block C",
    resident: "Common Area",
    type: "Electrical",
    description: "Power outage in Block C — generator transfer switch tripped.",
    priority: "Critical",
    status: "Completed",
    dateSubmitted: "2026-08-26",
    assignedTo: "Emeka Obi",
    notes: "Transfer switch replaced and tested. Power restored.",
    completedDate: "2026-08-27",
    source: "admin",
  },
  {
    id: "MNT-007",
    estate: "Palm Estate",
    unit: "A7",
    resident: "Mr. Seun Adeleke",
    type: "HVAC",
    description: "Air conditioning unit in master bedroom not cooling — room stays above 30°C even at lowest setting.",
    priority: "Medium",
    status: "Assigned",
    dateSubmitted: "2026-08-25",
    assignedTo: "Ekele Repairs Ltd",
    notes: "Technician scheduled for 30 Aug between 10am–1pm.",
    source: "resident_portal",
  },
  {
    id: "MNT-008",
    estate: "Sapphire Court",
    unit: "C3",
    resident: "Mrs. Grace Okafor",
    type: "Plumbing",
    description: "Water leakage from upstairs bathroom — seeping through ceiling into bedroom below.",
    priority: "High",
    status: "In Progress",
    dateSubmitted: "2026-08-22",
    assignedTo: "Aqua Fix Ltd",
    notes: "Source identified as cracked grout around shower tray. Remediation in progress.",
    source: "resident_portal",
    residentUpdates: [
      { text: "The ceiling stain is getting bigger. Please expedite this — my furniture is at risk.", timestamp: "2026-08-24 09:00" },
    ],
  },
  {
    id: "MNT-009",
    estate: "Sapphire Court",
    unit: "D2",
    resident: "Engr. James Iyede",
    type: "Electrical",
    description: "Gate intercom not working — cannot let visitors in remotely.",
    priority: "Low",
    status: "Completed",
    dateSubmitted: "2026-08-18",
    assignedTo: "ElectroFix",
    notes: "Intercom module replaced. System tested and confirmed working.",
    completedDate: "2026-08-20",
    source: "resident_portal",
    residentFeedback: {
      rating: 5,
      comment: "Fixed quickly and the engineer was very professional. Thank you.",
      date: "2026-08-21",
    },
  },
];

export function addMaintenanceRequest(req: Omit<SharedMaintRequest, "id">) {
  const id = `MNT-${String(SHARED_MAINTENANCE.length + 1).padStart(3, "0")}`;
  SHARED_MAINTENANCE.unshift({ id, ...req });
  return id;
}

export function updateMaintenanceRequest(id: string, patch: Partial<SharedMaintRequest>) {
  const idx = SHARED_MAINTENANCE.findIndex((r) => r.id === id);
  if (idx !== -1) Object.assign(SHARED_MAINTENANCE[idx], patch);
}

export function addResidentUpdate(id: string, text: string) {
  const req = SHARED_MAINTENANCE.find((r) => r.id === id);
  if (!req) return;
  const timestamp = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
  if (!req.residentUpdates) req.residentUpdates = [];
  req.residentUpdates.push({ text, timestamp });
}

export function submitResidentFeedback(id: string, rating: number, comment: string) {
  const req = SHARED_MAINTENANCE.find((r) => r.id === id);
  if (!req) return;
  req.residentFeedback = { rating, comment, date: new Date().toISOString().slice(0, 10) };
}
