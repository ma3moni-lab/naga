// Shared stock movement store — imported by Inventory.tsx and notificationStore.ts

export type MovementType = "add" | "remove" | "set";
export type MovementStatus = "Pending Approval" | "Approved" | "Declined";

export type StockMovement = {
  id: string;
  itemId: string;
  itemName: string;
  itemUnit: string;
  location: string;
  type: MovementType;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  project: string;
  requestedBy: string;
  requestedByRole: string;
  authorisedBy: string;
  reason: string;
  notes: string;
  linkedMR: string;
  status: MovementStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export let movementStore: StockMovement[] = [
  {
    id: "SM-001",
    itemId: "INV-003",
    itemName: "Binding Wire",
    itemUnit: "Rolls",
    location: "Palm Court Site",
    type: "remove",
    qty: 12,
    qtyBefore: 48,
    qtyAfter: 36,
    project: "NAGA Palm Court",
    requestedBy: "Sola Ogunlola",
    requestedByRole: "IVM",
    authorisedBy: "Chukwuma Eze",
    reason: "Project Allocation",
    notes: "Floors 4–6 reinforcement works",
    linkedMR: "",
    status: "Approved",
    requestedAt: "2026-09-10 09:15",
    reviewedAt: "2026-09-10 11:30",
  },
  {
    id: "SM-002",
    itemId: "INV-001",
    itemName: "Portland Cement (42.5R)",
    itemUnit: "Bags",
    location: "Palm Court Site",
    type: "add",
    qty: 500,
    qtyBefore: 240,
    qtyAfter: 740,
    project: "NAGA Palm Court",
    requestedBy: "Sola Ogunlola",
    requestedByRole: "IVM",
    authorisedBy: "Chukwuma Eze",
    reason: "Delivery",
    notes: "Supplier delivery from StrongBuild — linked to MR-00245",
    linkedMR: "MR-00245",
    status: "Approved",
    requestedAt: "2026-09-12 08:00",
    reviewedAt: "2026-09-12 09:45",
  },
  {
    id: "SM-003",
    itemId: "INV-002",
    itemName: "High Yield Steel Bars",
    itemUnit: "Tons",
    location: "Emerald Gardens Site",
    type: "remove",
    qty: 8,
    qtyBefore: 35,
    qtyAfter: 27,
    project: "Emerald Gardens",
    requestedBy: "Chidi Obi",
    requestedByRole: "IVM",
    authorisedBy: "Ibrahim Lawal",
    reason: "Project Allocation",
    notes: "Columns A3–D3 casting",
    linkedMR: "",
    status: "Pending Approval",
    requestedAt: "2026-09-20 14:00",
  },
  {
    id: "SM-004",
    itemId: "INV-004",
    itemName: "Roofing Sheets (0.55mm)",
    itemUnit: "Sheets",
    location: "Granite Heights Site",
    type: "add",
    qty: 200,
    qtyBefore: 85,
    qtyAfter: 285,
    project: "Granite Heights",
    requestedBy: "Kola Adekunle",
    requestedByRole: "PCO",
    authorisedBy: "Chukwuma Eze",
    reason: "Delivery",
    notes: "Delivery from BuildMart — MR-00246 partially fulfilled",
    linkedMR: "MR-00246",
    status: "Pending Approval",
    requestedAt: "2026-09-21 08:30",
  },
  {
    id: "SM-005",
    itemId: "INV-005",
    itemName: "Paint (Dulux Weathershield)",
    itemUnit: "Litres",
    location: "Palm Court Site",
    type: "remove",
    qty: 120,
    qtyBefore: 400,
    qtyAfter: 280,
    project: "NAGA Palm Court",
    requestedBy: "Abiodun Fashola",
    requestedByRole: "PCO",
    authorisedBy: "Chukwuma Eze",
    reason: "Project Allocation",
    notes: "External finishing — blocks 1 and 2",
    linkedMR: "",
    status: "Approved",
    requestedAt: "2026-09-15 10:00",
    reviewedAt: "2026-09-15 13:20",
  },
];

export let nextMovementId = 6;

export function bumpMovementId(): void {
  nextMovementId++;
}
