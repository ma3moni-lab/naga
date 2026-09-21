// NAGA Unified Platform — Dummy Data

export const CURRENT_USER = {
  id: "u001",
  name: "Emeka Okonkwo",
  role: "MD / CEO",
  initials: "EO",
  location: "Benin City HQ",
  avatar: null,
};

export const LOCATIONS = ["Benin City", "Lagos", "Abuja"];

// ─────────────── PROJECTS ───────────────
export const PROJECTS = [
  {
    id: "PRJ-001",
    name: "NAGA Palm Court",
    location: "Abuja",
    type: "Residential",
    units: 24,
    completion: 68,
    status: "Active",
    startDate: "2024-03-01",
    targetDate: "2025-12-31",
    budget: 420_000_000,
    spent: 285_600_000,
    pco: "Abiodun Fashola",
    supervisor: "Chukwuma Eze",
    description: "24-unit luxury residential development in Maitama, Abuja.",
    phases: [
      { name: "Foundation", completion: 100, status: "Completed" },
      { name: "Substructure", completion: 100, status: "Completed" },
      { name: "Superstructure", completion: 85, status: "Active" },
      { name: "MEP", completion: 40, status: "Active" },
      { name: "Finishes", completion: 10, status: "Pending" },
      { name: "Landscaping", completion: 0, status: "Pending" },
    ],
  },
  {
    id: "PRJ-002",
    name: "Emerald Gardens",
    location: "Lagos",
    type: "Mixed Use",
    units: 16,
    completion: 42,
    status: "Active",
    startDate: "2024-07-15",
    targetDate: "2026-06-30",
    budget: 310_000_000,
    spent: 130_200_000,
    pco: "Ngozi Adeyemi",
    supervisor: "Chukwuma Eze",
    description: "16-unit mixed-use development in Lekki Phase 1, Lagos.",
    phases: [
      { name: "Foundation", completion: 100, status: "Completed" },
      { name: "Substructure", completion: 100, status: "Completed" },
      { name: "Superstructure", completion: 30, status: "Active" },
      { name: "MEP", completion: 0, status: "Pending" },
      { name: "Finishes", completion: 0, status: "Pending" },
      { name: "Landscaping", completion: 0, status: "Pending" },
    ],
  },
  {
    id: "PRJ-003",
    name: "Granite Heights",
    location: "Benin City",
    type: "Residential",
    units: 12,
    completion: 91,
    status: "Near Completion",
    startDate: "2023-09-01",
    targetDate: "2025-09-30",
    budget: 185_000_000,
    spent: 168_350_000,
    pco: "Tunde Bakare",
    supervisor: "Chukwuma Eze",
    description: "12-unit premium residential estate in GRA, Benin City.",
    phases: [
      { name: "Foundation", completion: 100, status: "Completed" },
      { name: "Substructure", completion: 100, status: "Completed" },
      { name: "Superstructure", completion: 100, status: "Completed" },
      { name: "MEP", completion: 95, status: "Active" },
      { name: "Finishes", completion: 88, status: "Active" },
      { name: "Landscaping", completion: 60, status: "Active" },
    ],
  },
];

// ─────────────── MATERIAL REQUESTS ───────────────
export const MATERIAL_REQUESTS = [
  {
    id: "MR-00245",
    project: "NAGA Palm Court",
    projectId: "PRJ-001",
    date: "2025-08-14",
    requestedBy: "Abiodun Fashola",
    role: "PCO",
    items: [
      { material: "Reinforced Steel Bars (12mm)", qty: 200, unit: "Tons", unitPrice: 12_000, total: 2_400_000 },
      { material: "Ready-Mix Concrete (Grade 35)", qty: 80, unit: "m³", unitPrice: 4_800, total: 384_000 },
      { material: "Binding Wire", qty: 50, unit: "Rolls", unitPrice: 9_200, total: 460_000 },
    ],
    totalAmount: 3_244_000,
    purpose: "Superstructure — Floors 4–6 slab casting",
    status: "Disbursed",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Approved", date: "2025-08-15", time: "09:14", note: "Quantities verified against BOQ." },
      { actor: "Emeka Okonkwo", role: "MD / CEO", action: "Authorized", date: "2025-08-16", time: "11:02", note: "Approved. Proceed immediately." },
      { actor: "Lola Adebayo", role: "Finance Manager", action: "Disbursed", date: "2025-08-17", time: "14:30", note: "₦3,244,000 transferred to supplier account." },
    ],
    supplier: "StrongBuild Materials Ltd",
    supplierRef: "INV-SB-4421",
    deliveryDate: "2025-08-20",
    deliveryStatus: "Delivered",
    ivm: "Sola Ogunlola",
    ivmVerification: {
      date: "2025-08-21",
      steelReceived: 195,
      steelExpected: 200,
      concreteReceived: 80,
      concreteExpected: 80,
      wireReceived: 48,
      wireExpected: 50,
      variance: "5 tons steel short, 2 rolls wire short",
      varianceAmount: 264_400,
      notes: "Supplier confirmed shortfall. Credit note CN-SB-0091 issued.",
      photos: 6,
      status: "Variance Noted — Resolved",
    },
  },
  {
    id: "MR-00246",
    project: "Emerald Gardens",
    projectId: "PRJ-002",
    date: "2025-08-18",
    requestedBy: "Ngozi Adeyemi",
    role: "PCO",
    items: [
      { material: "Hollow Sandcrete Blocks (9-inch)", qty: 12_000, unit: "Units", unitPrice: 480, total: 5_760_000 },
      { material: "Cement (Dangote 42.5)", qty: 300, unit: "Bags", unitPrice: 9_200, total: 2_760_000 },
    ],
    totalAmount: 8_520_000,
    purpose: "Block laying — Ground floor walls",
    status: "Pending Supervisor",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Pending", date: "", time: "", note: "" },
    ],
    supplier: null,
    deliveryStatus: "Pending",
  },
  {
    id: "MR-00244",
    project: "Granite Heights",
    projectId: "PRJ-003",
    date: "2025-08-10",
    requestedBy: "Tunde Bakare",
    role: "PCO",
    items: [
      { material: "Porcelain Floor Tiles (600x600)", qty: 2_800, unit: "m²", unitPrice: 6_500, total: 18_200_000 },
      { material: "Wall Tiles (300x600)", qty: 1_200, unit: "m²", unitPrice: 4_800, total: 5_760_000 },
      { material: "Tile Adhesive", qty: 500, unit: "Bags", unitPrice: 2_100, total: 1_050_000 },
    ],
    totalAmount: 25_010_000,
    purpose: "Tiling — All 12 units",
    status: "Verified",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Approved", date: "2025-08-11", time: "10:22", note: "Verified against finishing schedule." },
      { actor: "Emeka Okonkwo", role: "MD / CEO", action: "Authorized", date: "2025-08-12", time: "08:47", note: "Approved." },
      { actor: "Lola Adebayo", role: "Finance Manager", action: "Disbursed", date: "2025-08-13", time: "15:15", note: "₦25,010,000 transferred." },
    ],
    supplier: "TileWorld Nigeria",
    supplierRef: "INV-TW-0882",
    deliveryDate: "2025-08-16",
    deliveryStatus: "Verified",
    ivm: "Sola Ogunlola",
    ivmVerification: {
      date: "2025-08-17",
      status: "Verified — No Variance",
      notes: "Full delivery confirmed.",
      photos: 4,
    },
  },
  {
    id: "MR-00247",
    project: "NAGA Palm Court",
    projectId: "PRJ-001",
    date: "2026-09-10",
    requestedBy: "Abiodun Fashola",
    role: "PCO",
    items: [
      { material: "Aluminium Window Frames (1200×1500)", qty: 48, unit: "Units", unitPrice: 85_000, total: 4_080_000 },
      { material: "Float Glass (6mm tinted)", qty: 120, unit: "m²", unitPrice: 18_500, total: 2_220_000 },
      { material: "Silicone Sealant", qty: 60, unit: "Tubes", unitPrice: 2_800, total: 168_000 },
    ],
    totalAmount: 6_468_000,
    purpose: "Window & glazing installation — Floors 7–10",
    status: "Pending CEO",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Approved", date: "2026-09-11", time: "10:15", note: "Quantities verified against drawings." },
      { actor: "Ibrahim Lawal", role: "Deputy CEO / Admin", action: "Approved", date: "2026-09-12", time: "09:30", note: "Within budget. Forwarding to CEO." },
      { actor: "Emeka Okonkwo", role: "MD / CEO", action: "Pending", date: "", time: "", note: "" },
    ],
    supplier: null,
    deliveryStatus: "Pending",
  },
  {
    id: "MR-00248",
    project: "Emerald Gardens",
    projectId: "PRJ-002",
    date: "2026-09-15",
    requestedBy: "Ngozi Adeyemi",
    role: "PCO",
    items: [
      { material: "Electrical Conduit Pipes (20mm)", qty: 500, unit: "Lengths", unitPrice: 1_400, total: 700_000 },
      { material: "MCB Circuit Breakers (63A)", qty: 24, unit: "Units", unitPrice: 8_500, total: 204_000 },
      { material: "PVC Wire (2.5mm²)", qty: 10, unit: "Rolls", unitPrice: 48_000, total: 480_000 },
    ],
    totalAmount: 1_384_000,
    purpose: "Electrical roughing — Blocks C & D",
    status: "Pending Admin",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Approved", date: "2026-09-16", time: "08:45", note: "In line with electrical BOQ." },
      { actor: "Ibrahim Lawal", role: "Deputy CEO / Admin", action: "Pending", date: "", time: "", note: "" },
    ],
    supplier: null,
    deliveryStatus: "Pending",
  },
  {
    id: "MR-00249",
    project: "Granite Heights",
    projectId: "PRJ-003",
    date: "2026-09-18",
    requestedBy: "Tunde Bakare",
    role: "PCO",
    items: [
      { material: "Sanitary Ware — WC Set", qty: 12, unit: "Sets", unitPrice: 95_000, total: 1_140_000 },
      { material: "Bath Tubs (1500mm)", qty: 6, unit: "Units", unitPrice: 145_000, total: 870_000 },
      { material: "Shower Enclosures", qty: 6, unit: "Units", unitPrice: 78_000, total: 468_000 },
    ],
    totalAmount: 2_478_000,
    purpose: "Plumbing fixtures — Units 7–12 bathrooms",
    status: "Pending Supervisor",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Pending", date: "", time: "", note: "" },
    ],
    supplier: null,
    deliveryStatus: "Pending",
  },
  {
    id: "MR-00243",
    project: "NAGA Palm Court",
    projectId: "PRJ-001",
    date: "2026-08-28",
    requestedBy: "Abiodun Fashola",
    role: "PCO",
    items: [
      { material: "Anti-Rust Paint (Grey Primer)", qty: 200, unit: "Litres", unitPrice: 3_200, total: 640_000 },
      { material: "Paint Brushes (Assorted)", qty: 50, unit: "Pieces", unitPrice: 850, total: 42_500 },
    ],
    totalAmount: 682_500,
    purpose: "Steel protection coating — Roof truss structure",
    status: "Pending Finance",
    approvalChain: [
      { actor: "Chukwuma Eze", role: "HOWO", action: "Approved", date: "2026-08-29", time: "09:10", note: "Approved." },
      { actor: "Ibrahim Lawal", role: "Deputy CEO / Admin", action: "Approved", date: "2026-08-30", time: "14:22", note: "Below threshold. Forwarding to Finance." },
      { actor: "Lola Adebayo", role: "Finance Manager", action: "Pending", date: "", time: "", note: "" },
    ],
    supplier: "NigerPaint Distributors",
    deliveryStatus: "Pending",
  },
];

// ─────────────── DAILY REPORTS ───────────────
export const DAILY_REPORTS = [
  {
    id: "DR-0814-PC",
    project: "NAGA Palm Court",
    date: "2025-08-27",
    pco: "Abiodun Fashola",
    weatherCondition: "Clear",
    workersOnSite: 42,
    summary: "Steel fixing for Level 5 slab progressing well. Two slab panels completed. Concrete pour scheduled for tomorrow pending final inspection.",
    activities: ["Steel fixing — Level 5 slab", "Formwork striking — Level 3 columns", "MEP conduit routing — Level 2"],
    issues: "Minor delay due to reinforcement delivery arriving 2 hours late.",
    mediaCount: 8,
    status: "Submitted",
  },
  {
    id: "DR-0814-EG",
    project: "Emerald Gardens",
    date: "2025-08-27",
    pco: "Ngozi Adeyemi",
    weatherCondition: "Partly Cloudy",
    workersOnSite: 28,
    summary: "Block laying progressing on north and east elevations. Ground floor exterior walls 60% complete.",
    activities: ["Block laying — Ground floor N/E walls", "Mortar mixing and curing", "Foundation waterproofing — final coat"],
    issues: "None.",
    mediaCount: 5,
    status: "Submitted",
  },
];

// ─────────────── FINANCE ───────────────
export const DISBURSEMENTS = [
  { id: "DIS-0082", date: "2025-08-17", mrRef: "MR-00245", project: "NAGA Palm Court", payee: "StrongBuild Materials Ltd", amount: 3_244_000, method: "Bank Transfer", authorizedBy: "Emeka Okonkwo", status: "Completed" },
  { id: "DIS-0081", date: "2025-08-13", mrRef: "MR-00244", project: "Granite Heights", payee: "TileWorld Nigeria", amount: 25_010_000, method: "Bank Transfer", authorizedBy: "Emeka Okonkwo", status: "Completed" },
  { id: "DIS-0080", date: "2025-07-30", mrRef: "MR-00239", project: "NAGA Palm Court", payee: "AlumiPro Supplies", amount: 8_400_000, method: "Bank Transfer", authorizedBy: "Emeka Okonkwo", status: "Completed" },
  { id: "DIS-0079", date: "2025-07-22", mrRef: "MR-00236", project: "Emerald Gardens", payee: "Lagos Concrete Ltd", amount: 6_720_000, method: "Bank Transfer", authorizedBy: "Emeka Okonkwo", status: "Completed" },
];

export const BUDGET_SUMMARY = [
  { project: "NAGA Palm Court", budget: 420_000_000, spent: 285_600_000, committed: 42_000_000, remaining: 92_400_000 },
  { project: "Emerald Gardens", budget: 310_000_000, spent: 130_200_000, committed: 38_000_000, remaining: 141_800_000 },
  { project: "Granite Heights", budget: 185_000_000, spent: 168_350_000, committed: 12_000_000, remaining: 4_650_000 },
];

export const PENDING_APPROVALS = [
  { id: "MR-00246", type: "Material Request", project: "Emerald Gardens", amount: 8_520_000, requestedBy: "Ngozi Adeyemi", awaitingAction: "Supervisor Review", date: "2025-08-18" },
  { id: "LV-0044", type: "Leave Request", project: "—", amount: null, requestedBy: "Yetunde Afolabi", awaitingAction: "Manager Approval", date: "2025-08-26" },
  { id: "MNT-0028", type: "Maintenance Request", project: "Palm Estate", amount: 450_000, requestedBy: "Estate Manager", awaitingAction: "Authorization", date: "2025-08-25" },
];

// ─────────────── PROPERTIES ───────────────
export const PROPERTIES = [
  {
    id: "PROP-001",
    name: "Palm Court — Unit A4",
    project: "NAGA Palm Court",
    location: "Maitama, Abuja",
    type: "3-Bedroom Apartment",
    bedrooms: 3,
    size: "210 sqm",
    floor: 2,
    status: "Available",
    price: 95_000_000,
    features: ["Swimming Pool", "24/7 Security", "Backup Power", "Smart Home Ready", "Covered Parking"],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop&auto=format",
  },
  {
    id: "PROP-002",
    name: "Palm Court — Unit B2",
    project: "NAGA Palm Court",
    location: "Maitama, Abuja",
    type: "4-Bedroom Penthouse",
    bedrooms: 4,
    size: "310 sqm",
    floor: 5,
    status: "Reserved",
    price: 145_000_000,
    customer: "Chidi Nwosu",
    features: ["Rooftop Terrace", "Swimming Pool", "24/7 Security", "Private Lift", "Smart Home"],
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop&auto=format",
  },
  {
    id: "PROP-003",
    name: "Granite Heights — Unit 7",
    project: "Granite Heights",
    location: "GRA, Benin City",
    type: "3-Bedroom Apartment",
    bedrooms: 3,
    size: "185 sqm",
    floor: 3,
    status: "Sold",
    price: 65_000_000,
    customer: "Adaeze Eze-Obi",
    features: ["Fitted Kitchen", "Backup Power", "Security Post", "Parking"],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop&auto=format",
  },
  {
    id: "PROP-004",
    name: "Granite Heights — Unit 11",
    project: "Granite Heights",
    location: "GRA, Benin City",
    type: "2-Bedroom Apartment",
    bedrooms: 2,
    size: "135 sqm",
    floor: 4,
    status: "Available",
    price: 48_000_000,
    features: ["Fitted Kitchen", "Backup Power", "Security Post"],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop&auto=format",
  },
  {
    id: "PROP-005",
    name: "Granite Heights — Unit 3",
    project: "Granite Heights",
    location: "GRA, Benin City",
    type: "3-Bedroom Apartment",
    bedrooms: 3,
    size: "185 sqm",
    floor: 1,
    status: "NAGA Stays",
    price: 65_000_000,
    features: ["Fitted Kitchen", "Backup Power", "Security Post", "Parking"],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop&auto=format",
  },
];

// ─────────────── CUSTOMERS ───────────────
export const CUSTOMERS = [
  {
    id: "CUST-001",
    name: "Chidi Nwosu",
    phone: "0803 456 7890",
    email: "chidi.nwosu@gmail.com",
    location: "Abuja",
    property: "Palm Court — Unit B2",
    purchasePrice: 145_000_000,
    paymentPlan: "Installment",
    totalPaid: 87_000_000,
    outstanding: 58_000_000,
    lastPayment: "2025-07-15",
    nextPaymentDue: "2025-10-15",
    nextPaymentAmount: 20_000_000,
    status: "Active",
    payments: [
      { ref: "PAY-0041", date: "2024-12-01", amount: 45_000_000, type: "Initial Deposit", status: "Confirmed" },
      { ref: "PAY-0067", date: "2025-03-15", amount: 22_000_000, type: "Installment 1", status: "Confirmed" },
      { ref: "PAY-0089", date: "2025-07-15", amount: 20_000_000, type: "Installment 2", status: "Confirmed" },
    ],
  },
  {
    id: "CUST-002",
    name: "Adaeze Eze-Obi",
    phone: "0812 345 6789",
    email: "adaeze.ezebi@yahoo.com",
    location: "Benin City",
    property: "Granite Heights — Unit 7",
    purchasePrice: 65_000_000,
    paymentPlan: "Outright",
    totalPaid: 65_000_000,
    outstanding: 0,
    lastPayment: "2025-01-20",
    status: "Completed",
    payments: [
      { ref: "PAY-0038", date: "2025-01-20", amount: 65_000_000, type: "Full Payment", status: "Confirmed" },
    ],
  },
  {
    id: "CUST-003",
    name: "Biodun Salami",
    phone: "0701 234 5678",
    email: "b.salami@outlook.com",
    location: "Lagos",
    property: "Emerald Gardens — Unit 4B (Pre-sale)",
    purchasePrice: 85_000_000,
    paymentPlan: "Off-Plan Installment",
    totalPaid: 25_500_000,
    outstanding: 59_500_000,
    lastPayment: "2025-06-01",
    nextPaymentDue: "2025-09-01",
    nextPaymentAmount: 15_000_000,
    status: "Active",
    payments: [
      { ref: "PAY-0055", date: "2024-09-15", amount: 17_000_000, type: "Reservation Deposit", status: "Confirmed" },
      { ref: "PAY-0074", date: "2025-06-01", amount: 8_500_000, type: "Installment 1", status: "Confirmed" },
    ],
  },
];

// ─────────────── ESTATES ───────────────
export const ESTATES = [
  {
    id: "EST-001",
    name: "Palm Estate",
    location: "Benin City",
    units: 48,
    occupiedUnits: 41,
    manager: "Blessing Omosu",
    annualServiceCharge: 480_000,
    serviceChargeCollection: 85,
    residents: 41,
    maintenanceOpen: 3,
    status: "Active",
  },
  {
    id: "EST-002",
    name: "Sapphire Court",
    location: "Abuja",
    units: 24,
    occupiedUnits: 18,
    manager: "Emeka Nzekwe",
    annualServiceCharge: 720_000,
    serviceChargeCollection: 72,
    residents: 18,
    maintenanceOpen: 1,
    status: "Active",
  },
];

export const RESIDENTS = [
  { id: "RES-001", name: "Dr. Kemi Bankole", unit: "B12", estate: "Palm Estate", phone: "0803 111 2222", serviceCharge: 480_000, paid: 480_000, outstanding: 0, status: "Paid", nextDue: "2026-01-01" },
  { id: "RES-002", name: "Mr. Seun Adeleke", unit: "A7", estate: "Palm Estate", phone: "0815 333 4444", serviceCharge: 480_000, paid: 240_000, outstanding: 240_000, status: "Partial", nextDue: "2025-09-01" },
  { id: "RES-003", name: "Mrs. Grace Okafor", unit: "C3", estate: "Palm Estate", phone: "0901 555 6666", serviceCharge: 480_000, paid: 0, outstanding: 480_000, status: "Overdue", nextDue: "2025-07-01" },
  { id: "RES-004", name: "Engr. James Iyede", unit: "D2", estate: "Sapphire Court", phone: "0812 777 8888", serviceCharge: 720_000, paid: 720_000, outstanding: 0, status: "Paid", nextDue: "2026-01-01" },
];

export const MAINTENANCE_REQUESTS = [
  { id: "MNT-0028", resident: "Mr. Seun Adeleke", unit: "A7", estate: "Palm Estate", issue: "Air conditioning unit not cooling", category: "HVAC", priority: "Medium", status: "Assigned", assignedTo: "Ekele Repairs", reportedDate: "2025-08-25", targetDate: "2025-08-29" },
  { id: "MNT-0027", resident: "Mrs. Grace Okafor", unit: "C3", estate: "Palm Estate", issue: "Water leakage from upstairs bathroom", category: "Plumbing", priority: "High", status: "In Progress", assignedTo: "Aqua Fix Ltd", reportedDate: "2025-08-22", targetDate: "2025-08-27" },
  { id: "MNT-0026", resident: "Engr. James Iyede", unit: "D2", estate: "Sapphire Court", issue: "Gate intercom not working", category: "Electrical", priority: "Low", status: "Resolved", assignedTo: "ElectroFix", reportedDate: "2025-08-18", resolvedDate: "2025-08-20" },
];

// ─────────────── NAGA STAYS ───────────────
export const NAGA_STAYS_UNITS = [
  {
    id: "NS-001",
    name: "Palm Court Premium Suite",
    property: "Granite Heights — Unit 3",
    location: "GRA, Benin City",
    type: "3-Bedroom Apartment",
    nightly_rate: 125_000,
    status: "Occupied",
    rating: 4.8,
    totalBookings: 34,
    totalRevenue: 14_875_000,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop&auto=format",
    amenities: ["WiFi", "Smart TV", "Washer/Dryer", "Fully Equipped Kitchen", "Backup Power", "Parking"],
  },
  {
    id: "NS-002",
    name: "The Maitama Penthouse",
    property: "Palm Court — Unit A1",
    location: "Maitama, Abuja",
    type: "4-Bedroom Penthouse",
    nightly_rate: 280_000,
    status: "Available",
    rating: 4.9,
    totalBookings: 22,
    totalRevenue: 24_640_000,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop&auto=format",
    amenities: ["WiFi", "Smart TV", "Pool Access", "Rooftop Terrace", "Concierge", "Backup Power"],
  },
];

export const STAYS_BOOKINGS = [
  { id: "BK-0041", unit: "Palm Court Premium Suite", unitId: "NS-001", guest: "Dr. Amina Suleiman", guestPhone: "+234 803 445 6611", guestEmail: "amina.suleiman@med.ng", checkIn: "2025-08-26", checkOut: "2025-08-30", nights: 4, nightly: 125_000, amount: 500_000, serviceFee: 26_315, total: 526_315, status: "Active", paymentStatus: "Paid", location: "GRA, Benin City", assignedStaff: { name: "Blessing Omosu", role: "Estate Manager", phone: "+234 802 000 0008", email: "b.omosu@naga.com" }, nextOfKin: { name: "Prof. Bashir Suleiman", relationship: "Husband", phone: "+234 803 445 6600" }, emergencyContact: { name: "Dr. Zainab Musa", relationship: "Sister", phone: "+234 810 223 4455" } },
  { id: "BK-0040", unit: "The Gwarimpa Penthouse", unitId: "NS-002", guest: "Mr. Femi Adeyinka", guestPhone: "+234 812 334 5566", guestEmail: "femi.adeyinka@gmail.com", checkIn: "2025-09-12", checkOut: "2025-09-16", nights: 4, nightly: 280_000, amount: 1_120_000, serviceFee: 59_000, total: 1_179_000, status: "Upcoming", paymentStatus: "Deposit Paid", location: "Gwarimpa, Abuja", assignedStaff: { name: "Emeka Nzekwe", role: "Estate Manager — Abuja", phone: "+234 802 000 0009", email: "e.nzekwe@naga.com" }, nextOfKin: { name: "Mrs. Bisi Adeyinka", relationship: "Wife", phone: "+234 812 334 5500" }, emergencyContact: { name: "Mr. Tayo Adeyinka", relationship: "Brother", phone: "+234 705 111 2233" } },
  { id: "BK-0039", unit: "Palm Court Premium Suite", unitId: "NS-001", guest: "Mrs. Chisom Obi", guestPhone: "+234 901 667 8899", guestEmail: "chisom.obi@outlook.com", checkIn: "2025-08-18", checkOut: "2025-08-22", nights: 4, nightly: 125_000, amount: 500_000, serviceFee: 26_315, total: 526_315, status: "Completed", paymentStatus: "Paid", location: "GRA, Benin City", assignedStaff: { name: "Blessing Omosu", role: "Estate Manager", phone: "+234 802 000 0008", email: "b.omosu@naga.com" }, nextOfKin: { name: "Mr. Chukwuemeka Obi", relationship: "Husband", phone: "+234 901 667 8800" }, emergencyContact: { name: "Mrs. Adaeze Eze", relationship: "Sister", phone: "+234 808 445 5566" } },
  { id: "BK-0038", unit: "The Gwarimpa Penthouse", unitId: "NS-002", guest: "Senator Ade Williams", guestPhone: "+234 805 200 3344", guestEmail: "ade.williams@senate.gov.ng", checkIn: "2025-08-10", checkOut: "2025-08-14", nights: 4, nightly: 280_000, amount: 1_120_000, serviceFee: 59_000, total: 1_179_000, status: "Completed", paymentStatus: "Paid", location: "Gwarimpa, Abuja", assignedStaff: { name: "Emeka Nzekwe", role: "Estate Manager — Abuja", phone: "+234 802 000 0009", email: "e.nzekwe@naga.com" }, nextOfKin: { name: "Mrs. Funmilayo Williams", relationship: "Wife", phone: "+234 805 200 3300" }, emergencyContact: { name: "Barrister Segun Williams", relationship: "Son", phone: "+234 815 667 4422" } },
  { id: "BK-0037", unit: "Palm Court Premium Suite", unitId: "NS-001", guest: "Dr. Amina Suleiman", guestPhone: "+234 803 445 6611", guestEmail: "amina.suleiman@med.ng", checkIn: "2025-07-01", checkOut: "2025-07-05", nights: 4, nightly: 125_000, amount: 500_000, serviceFee: 26_315, total: 526_315, status: "Cancelled", paymentStatus: "Refunded", location: "GRA, Benin City", assignedStaff: null, cancelReason: "Change of travel plans", nextOfKin: { name: "Prof. Bashir Suleiman", relationship: "Husband", phone: "+234 803 445 6600" }, emergencyContact: { name: "Dr. Zainab Musa", relationship: "Sister", phone: "+234 810 223 4455" } },
  { id: "BK-0042", unit: "The Gwarimpa Penthouse", unitId: "NS-002", guest: "Mr. Femi Adeyinka", guestPhone: "+234 812 334 5566", guestEmail: "femi.adeyinka@gmail.com", checkIn: "2025-10-03", checkOut: "2025-10-07", nights: 4, nightly: 280_000, amount: 1_120_000, serviceFee: 59_000, total: 1_179_000, status: "Pending", paymentStatus: "Awaiting Payment", location: "Gwarimpa, Abuja", assignedStaff: null, nextOfKin: { name: "Mrs. Bisi Adeyinka", relationship: "Wife", phone: "+234 812 334 5500" }, emergencyContact: { name: "Mr. Tayo Adeyinka", relationship: "Brother", phone: "+234 705 111 2233" } },
];

// ─────────────── PEOPLE ───────────────
export const EMPLOYEES = [
  { id: "EMP-001", name: "Emeka Okonkwo", role: "MD / CEO", department: "Executive", location: "Benin City", status: "Active", joinDate: "2018-01-01", salary: 1_800_000, phone: "+234 805 100 0001", email: "e.okonkwo@naga.com", grade: "Executive", contractType: "Permanent" },
  { id: "EMP-002", name: "Lola Adebayo", role: "Finance Manager", department: "Finance", location: "Benin City", status: "Active", joinDate: "2020-03-15", salary: 650_000, phone: "+234 805 100 0002", email: "l.adebayo@naga.com", grade: "Manager", contractType: "Permanent" },
  { id: "EMP-003", name: "Abiodun Fashola", role: "PCO — Palm Court", department: "Construction", location: "Abuja", status: "Active", joinDate: "2022-06-01", salary: 480_000, phone: "+234 805 100 0003", email: "a.fashola@naga.com", grade: "Senior Officer", contractType: "Permanent" },
  { id: "EMP-004", name: "Ngozi Adeyemi", role: "PCO — Emerald Gardens", department: "Construction", location: "Lagos", status: "Active", joinDate: "2023-01-10", salary: 460_000, phone: "+234 805 100 0004", email: "n.adeyemi@naga.com", grade: "Senior Officer", contractType: "Permanent" },
  { id: "EMP-005", name: "Tunde Bakare", role: "PCO — Granite Heights", department: "Construction", location: "Benin City", status: "Active", joinDate: "2021-09-01", salary: 470_000, phone: "+234 805 100 0005", email: "t.bakare@naga.com", grade: "Senior Officer", contractType: "Permanent" },
  { id: "EMP-006", name: "Chukwuma Eze", role: "HOWO — Abuja", department: "Construction", location: "Abuja", status: "Active", joinDate: "2019-04-20", salary: 580_000, phone: "+234 805 100 0006", email: "c.eze@naga.com", grade: "Manager", contractType: "Permanent" },
  { id: "EMP-007", name: "Sola Ogunlola", role: "Inventory Manager", department: "Inventory", location: "Abuja", status: "Active", joinDate: "2021-07-01", salary: 350_000, phone: "+234 805 100 0007", email: "s.ogunlola@naga.com", grade: "Officer", contractType: "Permanent" },
  { id: "EMP-008", name: "Blessing Omosu", role: "Estate Manager — Palm Estate", department: "Estates", location: "Benin City", status: "Active", joinDate: "2022-02-14", salary: 340_000, phone: "+234 805 100 0008", email: "b.omosu@naga.com", grade: "Officer", contractType: "Permanent" },
  { id: "EMP-009", name: "Yetunde Afolabi", role: "Admin Officer", department: "Administration", location: "Benin City", status: "On Leave", joinDate: "2023-05-01", salary: 280_000, phone: "+234 805 100 0009", email: "y.afolabi@naga.com", grade: "Officer", contractType: "Permanent" },
  { id: "EMP-010", name: "Kola Adebisi", role: "PRM", department: "Construction", location: "Lagos", status: "Suspended", joinDate: "2022-11-01", salary: 300_000, phone: "+234 805 100 0010", email: "k.adebisi@naga.com", grade: "Officer", contractType: "Contract", suspensionReason: "Unauthorised absence from site — pending investigation." },
];

export const LEAVE_REQUESTS = [
  { id: "LV-0044", employee: "Yetunde Afolabi", empId: "EMP-009", role: "Admin Officer", department: "Administration", type: "Annual Leave", startDate: "2025-09-01", endDate: "2025-09-12", days: 10, reason: "Family travel — sister's wedding in Port Harcourt", status: "Approved", approvedBy: "Emeka Okonkwo", approvedDays: 10, submittedDate: "2025-08-26" },
  { id: "LV-0043", employee: "Ngozi Adeyemi", empId: "EMP-004", role: "PCO — Emerald Gardens", department: "Construction", type: "Sick Leave", startDate: "2025-08-05", endDate: "2025-08-06", days: 2, reason: "Ill health — doctor's note attached", status: "Approved", approvedBy: "Emeka Okonkwo", approvedDays: 2, submittedDate: "2025-08-04" },
  { id: "LV-0045", employee: "Kola Adebisi", empId: "EMP-010", role: "PRM", department: "Construction", type: "Annual Leave", startDate: "2026-09-15", endDate: "2026-09-26", days: 10, reason: "Personal leave", status: "Pending", approvedBy: null, approvedDays: null, submittedDate: "2026-09-08" },
  { id: "LV-0046", employee: "Sola Ogunlola", empId: "EMP-007", role: "Inventory Manager", department: "Inventory", type: "Compassionate Leave", startDate: "2026-09-23", endDate: "2026-09-25", days: 3, reason: "Family bereavement — grandmother's burial", status: "Pending", approvedBy: null, approvedDays: null, submittedDate: "2026-09-20" },
  { id: "LV-0047", employee: "Tunde Bakare", empId: "EMP-005", role: "PCO — Granite Heights", department: "Construction", type: "Sick Leave", startDate: "2026-09-18", endDate: "2026-09-22", days: 5, reason: "Malaria treatment — doctor's note submitted", status: "Approved", approvedBy: "Chukwuma Eze", approvedDays: 5, submittedDate: "2026-09-17" },
  { id: "LV-0048", employee: "Blessing Omosu", empId: "EMP-008", role: "Estate Manager", department: "Estates", type: "Annual Leave", startDate: "2026-10-06", endDate: "2026-10-17", days: 10, reason: "Annual vacation — travel abroad", status: "Pending", approvedBy: null, approvedDays: null, submittedDate: "2026-09-19" },
  { id: "LV-0049", employee: "Abiodun Fashola", empId: "EMP-003", role: "PCO — Palm Court", department: "Construction", type: "Emergency Leave", startDate: "2026-09-21", endDate: "2026-09-21", days: 1, reason: "Medical emergency — child admitted to hospital", status: "Approved", approvedBy: "Chukwuma Eze", approvedDays: 1, submittedDate: "2026-09-21" },
];

export const DEPLOYMENT_RECORDS = [
  { id: "DEP-001", employee: "Ngozi Adeyemi", empId: "EMP-004", fromProject: "NAGA Palm Court", fromLocation: "Abuja", toProject: "Emerald Gardens", toLocation: "Lagos", effectiveDate: "2023-01-10", reason: "Assigned as PCO for new Lagos project", authorizedBy: "Emeka Okonkwo", status: "Active" },
  { id: "DEP-002", employee: "Chukwuma Eze", empId: "EMP-006", fromProject: "Granite Heights", fromLocation: "Benin City", toProject: "NAGA Palm Court", toLocation: "Abuja", effectiveDate: "2024-03-01", reason: "Promoted to lead supervisor — Palm Court", authorizedBy: "Emeka Okonkwo", status: "Active" },
  { id: "DEP-003", employee: "Kola Adebisi", empId: "EMP-010", fromProject: "Granite Heights", fromLocation: "Benin City", toProject: "Emerald Gardens", toLocation: "Lagos", effectiveDate: "2022-11-01", reason: "Support for Lagos phase ramp-up", authorizedBy: "Emeka Okonkwo", status: "Active" },
];

export const PROGRESS_REPORTS = [
  { id: "PR-0017", project: "NAGA Palm Court", projectId: "PRJ-001", submittedBy: "Abiodun Fashola", role: "PCO", date: "2026-09-20", phase: "Superstructure", percentBefore: 87, percentAfter: 89, summary: "Level 8 slab casting completed. Level 9 formwork commenced. Electrical conduit rough-in ongoing across floors 5–7.", challenges: "Concrete pump broke down at 2pm — manual casting used for balance of pour. Maintenance scheduled.", images: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&auto=format", "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&auto=format", "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop&auto=format"], reviewedBy: null, reviewStatus: "Pending" },
  { id: "PR-0016", project: "Emerald Gardens", projectId: "PRJ-002", submittedBy: "Ngozi Adeyemi", role: "PCO", date: "2026-09-19", phase: "Superstructure", percentBefore: 38, percentAfter: 42, summary: "Block C first floor ring beam complete. Roof beam casts for Block A and B completed. Carpenter gang mobilised for floor 2 formwork.", challenges: "Heavy rainfall on Wednesday delayed external works by half a day.", images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&auto=format", "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&h=400&fit=crop&auto=format"], reviewedBy: null, reviewStatus: "Pending" },
  { id: "PR-0015", project: "Granite Heights", projectId: "PRJ-003", submittedBy: "Tunde Bakare", role: "PCO", date: "2026-09-17", phase: "Finishes", percentBefore: 91, percentAfter: 93, summary: "Painting of external facade complete on blocks 1–3. Internal painting underway on units 7–12. Electrical fixtures installation in progress.", challenges: "Paint supplier delivered wrong shade for block 2 south face — corrected batch expected Friday.", images: ["https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&h=400&fit=crop&auto=format"], reviewedBy: "Chukwuma Eze", reviewStatus: "Approved" },
  { id: "PR-0014", project: "NAGA Palm Court", projectId: "PRJ-001", submittedBy: "Abiodun Fashola", role: "PCO", date: "2026-09-13", phase: "Superstructure", percentBefore: 85, percentAfter: 87, summary: "Level 7 shuttering and steel fixing completed. Casting scheduled for Monday. MEP coordination meeting held on site.", challenges: "Steel delivery from MR-00247 still awaited — workaround with existing stock approved by IVM.", images: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&auto=format"], reviewedBy: "Emeka Okonkwo", reviewStatus: "Approved" },
  { id: "PR-0013", project: "Emerald Gardens", projectId: "PRJ-002", submittedBy: "Ngozi Adeyemi", role: "PCO", date: "2026-09-06", phase: "Substructure", percentBefore: 32, percentAfter: 38, summary: "Block A and B ground floor slab cast and curing. Block C strip foundation blinding complete. Plumbing inspection signed off.", challenges: "Labour dispute resolved — all workers back on site as of Wednesday.", images: [] as string[], reviewedBy: "Emeka Okonkwo", reviewStatus: "Returned", reviewNote: "Please include photos of the slab pour and plumbing inspection sign-off sheet in next report." },
  { id: "PR-0012", project: "NAGA Palm Court", projectId: "PRJ-001", submittedBy: "Abiodun Fashola", role: "PCO", date: "2025-08-27", phase: "Superstructure", percentBefore: 80, percentAfter: 85, summary: "Level 5 slab steel fixing completed. Two panels cast and curing. Level 6 formwork started.", challenges: "Delayed concrete delivery — resolved by 11am.", images: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&auto=format", "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&auto=format"], reviewedBy: "Emeka Okonkwo", reviewStatus: "Approved" },
  { id: "PR-0011", project: "Emerald Gardens", projectId: "PRJ-002", submittedBy: "Ngozi Adeyemi", role: "PCO", date: "2025-08-27", phase: "Superstructure", percentBefore: 25, percentAfter: 30, summary: "Ground floor north and east elevation block-laying complete. Mortar curing in progress.", challenges: "None.", images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&auto=format"], reviewedBy: "Chukwuma Eze", reviewStatus: "Approved" },
  { id: "PR-0010", project: "Granite Heights", projectId: "PRJ-003", submittedBy: "Tunde Bakare", role: "PCO", date: "2025-08-26", phase: "Finishes", percentBefore: 84, percentAfter: 88, summary: "Tiling complete on floors 1–4. Floors 5 in progress. Plumbing fixtures being installed in 6 units.", challenges: "Minor tile batch colour variance in unit 9 — replacement ordered.", images: ["https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&h=400&fit=crop&auto=format"], reviewedBy: "Emeka Okonkwo", reviewStatus: "Approved" },
];

// ─────────────── INVENTORY ───────────────
export const INVENTORY_ITEMS = [
  { id: "INV-001", material: "Reinforced Steel Bars (12mm)", location: "Palm Court Site Store", qty: 45, unit: "Tons", reorderLevel: 20, lastUpdated: "2025-08-21", status: "Adequate" },
  { id: "INV-002", material: "Cement (Dangote 42.5)", location: "Palm Court Site Store", qty: 180, unit: "Bags", reorderLevel: 100, lastUpdated: "2025-08-21", status: "Adequate" },
  { id: "INV-003", material: "Binding Wire", location: "Palm Court Site Store", qty: 12, unit: "Rolls", reorderLevel: 20, lastUpdated: "2025-08-21", status: "Low" },
  { id: "INV-004", material: "Porcelain Floor Tiles (600x600)", location: "Granite Heights Site Store", qty: 2_800, unit: "m²", reorderLevel: 500, lastUpdated: "2025-08-17", status: "Adequate" },
  { id: "INV-005", material: "Ready-Mix Concrete (Grade 35)", location: "Palm Court Site Store", qty: 0, unit: "m³", reorderLevel: 20, lastUpdated: "2025-08-21", status: "Out of Stock" },
];

// ─────────────── AUDIT ───────────────
export const AUDIT_EVENTS = [
  { id: "AUD-0901", date: "2025-08-21", time: "16:04", actor: "Sola Ogunlola", role: "IVM", action: "Delivery Verified with Variance", entity: "MR-00245", project: "NAGA Palm Court", detail: "5 tons steel short-delivered. 2 rolls binding wire short. Credit note CN-SB-0091 requested from StrongBuild." },
  { id: "AUD-0900", date: "2025-08-20", time: "13:30", actor: "StrongBuild Materials Ltd", role: "Supplier", action: "Delivery Made", entity: "MR-00245", project: "NAGA Palm Court", detail: "Partial delivery — 195 tons steel, 80m³ concrete, 48 rolls wire. Signed POD-SB-0091." },
  { id: "AUD-0899", date: "2025-08-17", time: "14:30", actor: "Lola Adebayo", role: "Finance Manager", action: "Disbursement Processed", entity: "MR-00245", project: "NAGA Palm Court", detail: "₦3,244,000 transferred to StrongBuild Materials Ltd (ACC: 3011234567, GTB). TXN-NAG-0082." },
  { id: "AUD-0898", date: "2025-08-16", time: "11:02", actor: "Emeka Okonkwo", role: "MD / CEO", action: "Material Request Authorized", entity: "MR-00245", project: "NAGA Palm Court", detail: "CEO authorized ₦3,244,000 for superstructure materials — Palm Court Floors 4–6." },
  { id: "AUD-0897", date: "2025-08-15", time: "09:14", actor: "Chukwuma Eze", role: "HOWO", action: "Material Request Approved", entity: "MR-00245", project: "NAGA Palm Court", detail: "Quantities verified against BOQ. Request forwarded to CEO." },
  { id: "AUD-0896", date: "2025-08-14", time: "08:30", actor: "Abiodun Fashola", role: "PCO", action: "Material Request Submitted", entity: "MR-00245", project: "NAGA Palm Court", detail: "MR-00245 submitted for 200T steel, 80m³ concrete, 50 rolls wire. Total: ₦3,244,000." },
  { id: "AUD-0895", date: "2025-08-13", time: "15:15", actor: "Lola Adebayo", role: "Finance Manager", action: "Disbursement Processed", entity: "MR-00244", project: "Granite Heights", detail: "₦25,010,000 transferred to TileWorld Nigeria. TXN-NAG-0081." },
  { id: "AUD-0894", date: "2025-08-10", time: "10:22", actor: "Emeka Okonkwo", role: "MD / CEO", action: "Material Request Authorized", entity: "MR-00244", project: "Granite Heights", detail: "CEO authorized ₦25,010,000 for tiling works — Granite Heights all units." },
];

// ─────────────── KPIs ───────────────
export const EXECUTIVE_KPIS = {
  activeProjects: 3,
  totalProjectValue: 915_000_000,
  totalSpent: 584_150_000,
  pendingApprovals: 3,
  propertiesAvailable: 2,
  propertiesSold: 1,
  propertiesReserved: 1,
  totalSalesValue: 145_000_000,
  totalCollected: 177_500_000,
  estatesManaged: 2,
  totalResidents: 59,
  maintenanceOpen: 4,
  staysOccupied: 1,
  staysRevenueMTD: 1_000_000,
  staysTotalRevenue: 39_515_000,
  pendingMRs: 1,
  totalDisbursed: 289_400_000,
  overdueServiceCharges: 2,
};

// ─────────────── TASKS ───────────────
export const TASKS = [
  { id: "TSK-001", title: "Follow up on MR-00246 approval delay", description: "Procurement request for Emerald Gardens still pending supervisor sign-off for 4 days.", assignee: "Ngozi Adeyemi", assigner: "Emeka Okonkwo", project: "Emerald Gardens", priority: "High", status: "Todo", dueDate: "2026-09-02", createdAt: "2026-08-25", tags: ["procurement", "construction"] },
  { id: "TSK-002", title: "Prepare Q3 financial summary report", description: "Consolidate all disbursements, stays revenue, and service charge collections for Q3.", assignee: "Lola Adebayo", assigner: "Emeka Okonkwo", project: null, priority: "High", status: "In Progress", dueDate: "2026-08-30", createdAt: "2026-08-20", tags: ["finance", "reports"] },
  { id: "TSK-003", title: "Inspect Granite Heights snag list", description: "Unit-by-unit walkthrough to document final snag items before handover.", assignee: "Chukwuma Eze", assigner: "Emeka Okonkwo", project: "Granite Heights", priority: "High", status: "In Progress", dueDate: "2026-08-29", createdAt: "2026-08-18", tags: ["construction", "handover"] },
  { id: "TSK-004", title: "Update inventory count — Steel yard", description: "Physical count of all steel on site at Palm Court and reconcile with IVM records.", assignee: "Sola Ogunlola", assigner: "Abiodun Fashola", project: "NAGA Palm Court", priority: "Medium", status: "Todo", dueDate: "2026-09-05", createdAt: "2026-08-26", tags: ["inventory"] },
  { id: "TSK-005", title: "Renew annual security contract — Palm Estate", description: "Current security contract expires September 15. Get 3 quotes and present to management.", assignee: "Bimbo Adeyemi", assigner: "Emeka Okonkwo", project: null, priority: "Medium", status: "Todo", dueDate: "2026-09-10", createdAt: "2026-08-22", tags: ["estates", "contracts"] },
  { id: "TSK-006", title: "Onboard new site engineer — Emerald Gardens", description: "Complete HR onboarding, issue site access badge, and assign reporting line to HOWO.", assignee: "Ngozi Adeyemi", assigner: "Emeka Okonkwo", project: "Emerald Gardens", priority: "Medium", status: "Todo", dueDate: "2026-09-25", createdAt: "2026-08-27", tags: ["people"] },
  { id: "TSK-007", title: "Chase outstanding service charge — Obi Nwachukwu", description: "Resident has 90+ day overdue balance on Riverside Court. Escalate if no response.", assignee: "Bimbo Adeyemi", assigner: "Emeka Okonkwo", project: null, priority: "High", status: "Todo", dueDate: "2026-08-29", createdAt: "2026-08-24", tags: ["estates", "finance"] },
  { id: "TSK-008", title: "Photograph completed units — Palm Court floors 1-3", description: "Professional photography of show units for marketing materials and investor update.", assignee: "Ngozi Adeyemi", assigner: "Emeka Okonkwo", project: "NAGA Palm Court", priority: "Low", status: "Done", dueDate: "2026-08-20", createdAt: "2026-08-10", tags: ["marketing"] },
  { id: "TSK-009", title: "Process deposit refund — BK-0037", description: "Amina Suleiman cancellation confirmed. Initiate refund via finance.", assignee: "Lola Adebayo", assigner: "Emeka Okonkwo", project: null, priority: "Medium", status: "Done", dueDate: "2026-08-15", createdAt: "2026-08-12", tags: ["stays", "finance"] },
  { id: "TSK-010", title: "Draft lease renewal templates", description: "Prepare standardised renewal offer letters for 6 residents whose leases expire in October.", assignee: "Bimbo Adeyemi", assigner: "Emeka Okonkwo", project: null, priority: "Low", status: "Done", dueDate: "2026-08-25", createdAt: "2026-08-15", tags: ["estates", "legal"] },
];

// ─────────────── MESSAGES ───────────────
export const CONVERSATIONS = [
  {
    id: "CV-001",
    participants: ["Emeka Okonkwo", "Lola Adebayo"],
    subject: "Q3 Finance Report",
    messages: [
      { id: "m1", from: "Emeka Okonkwo", text: "Lola, when can we expect the Q3 report draft? Board meeting is Sept 5.", time: "2026-08-26 09:14", read: true },
      { id: "m2", from: "Lola Adebayo", text: "Working on it now. Should have a draft by Thursday EOD.", time: "2026-08-26 09:41", read: true },
      { id: "m3", from: "Emeka Okonkwo", text: "Good. Include the Stays revenue breakdown separately.", time: "2026-08-26 10:02", read: false },
    ],
    lastActivity: "2026-08-26 10:02",
  },
  {
    id: "CV-002",
    participants: ["Emeka Okonkwo", "Chukwuma Eze"],
    subject: "Granite Heights Snag List",
    messages: [
      { id: "m4", from: "Emeka Okonkwo", text: "Chukwuma, I need the snag list done before Sept 1 so we can plan handover.", time: "2026-08-25 08:30", read: true },
      { id: "m5", from: "Chukwuma Eze", text: "Understood. I am scheduling unit walkthroughs for Tue-Wed. Will send report by Thursday.", time: "2026-08-25 09:15", read: true },
    ],
    lastActivity: "2026-08-25 09:15",
  },
  {
    id: "CV-003",
    participants: ["Emeka Okonkwo", "Abiodun Fashola"],
    subject: "Palm Court — Level 5 Progress",
    messages: [
      { id: "m6", from: "Abiodun Fashola", text: "Sir, Level 5 steel fixing is 80% complete. Concrete pour is tomorrow pending inspection.", time: "2026-08-27 07:45", read: true },
      { id: "m7", from: "Emeka Okonkwo", text: "Good progress. Ensure the IVM is on site for the pour.", time: "2026-08-27 08:10", read: true },
      { id: "m8", from: "Abiodun Fashola", text: "Sola will be there. I will send photos after.", time: "2026-08-27 08:22", read: false },
    ],
    lastActivity: "2026-08-27 08:22",
  },
  {
    id: "CV-004",
    participants: ["Emeka Okonkwo", "Bimbo Adeyemi"],
    subject: "New Engineer Onboarding",
    messages: [
      { id: "m9", from: "Emeka Okonkwo", text: "Bimbo, the new engineer Seun starts Monday. Please prepare his onboarding pack.", time: "2026-08-27 11:00", read: true },
      { id: "m10", from: "Bimbo Adeyemi", text: "Noted. I will prepare the welcome pack and coordinate site access with security.", time: "2026-08-27 11:35", read: false },
    ],
    lastActivity: "2026-08-27 11:35",
  },
  {
    id: "CV-005",
    participants: ["Emeka Okonkwo", "Ngozi Adeyemi"],
    subject: "Procurement Delay — MR-00246",
    messages: [
      { id: "m11", from: "Emeka Okonkwo", text: "Ngozi, what is the holdup on the block-laying materials for Emerald? Bode has not approved yet.", time: "2026-08-27 14:00", read: false },
    ],
    lastActivity: "2026-08-27 14:00",
  },
];
