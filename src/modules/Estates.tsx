import { useState, useRef } from "react";
import { ESTATES, RESIDENTS, MAINTENANCE_REQUESTS } from "../data/dummy";
import { logActivity } from "../data/activityLog";
import { SHARED_MAINTENANCE, addMaintenanceRequest } from "../data/maintenanceStore";

function fmt(n: number) {
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Partial: "bg-amber-50 text-amber-700 border-amber-200",
    Overdue: "bg-red-50 text-red-700 border-red-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Open: "bg-gray-50 text-gray-600 border-gray-200",
    Assigned: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

const TECHNICIANS = [
  "Chidi Nwosu",
  "Emeka Dike",
  "Fola Adeyemi",
  "Samson Eze",
  "Ibrahim Musa",
];

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Structural",
  "HVAC",
  "General",
  "Security",
];

const PRIORITIES = ["Low", "Medium", "High"] as const;

// ── Scheduled Maintenance ────────────────────────────────────────────────────

interface ScheduledTask {
  id: string;
  title: string;
  category:
    | "Generator"
    | "Fire Safety"
    | "Elevator"
    | "Plumbing"
    | "Electrical"
    | "Pest Control"
    | "Water Treatment"
    | "HVAC"
    | "Building Inspection"
    | "Security Systems";
  estate: string;
  description: string;
  recurrence: "Weekly" | "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
  lastCompleted?: string;
  nextDue: string;
  assignedTo: string;
  estimatedCost?: number;
  status: "Scheduled" | "Due Soon" | "Overdue" | "Completed" | "Cancelled";
  notes?: string;
}

function RescheduleInline({
  task,
  onReschedule,
}: {
  task: ScheduledTask;
  onReschedule: (id: string, date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(task.nextDue);
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#6B9FE5]/60 text-[#6B9FE5] bg-[#EAF2FC] hover:bg-[#d6eaf8] transition-colors"
      >
        Reschedule
      </button>
    );
  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="border border-[#E8EAF0] rounded-md px-2 py-1 text-xs text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
      />
      <button
        onClick={() => {
          if (val) onReschedule(task.id, val);
          setOpen(false);
        }}
        className="px-2 py-1 rounded-md text-xs font-semibold bg-[#25205B] text-white hover:bg-[#1a1748] transition-colors"
      >
        Save
      </button>
      <button
        onClick={() => setOpen(false)}
        className="px-2 py-1 rounded-md text-xs text-[#69707D] hover:text-[#252731] transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  Generator: "⚡",
  "Fire Safety": "🔥",
  Elevator: "🛗",
  Plumbing: "🔧",
  Electrical: "💡",
  "Pest Control": "🪲",
  "Water Treatment": "💧",
  HVAC: "❄️",
  "Building Inspection": "🏗️",
  "Security Systems": "🔒",
};

const SCHED_CATEGORIES: ScheduledTask["category"][] = [
  "Generator",
  "Fire Safety",
  "Elevator",
  "Plumbing",
  "Electrical",
  "Pest Control",
  "Water Treatment",
  "HVAC",
  "Building Inspection",
  "Security Systems",
];

const RECURRENCES: ScheduledTask["recurrence"][] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Semi-Annual",
  "Annual",
];

function addDaysByRecurrence(
  dateStr: string,
  recurrence: ScheduledTask["recurrence"]
): string {
  const d = new Date(dateStr);
  const days: Record<string, number> = {
    Weekly: 7,
    Monthly: 30,
    Quarterly: 91,
    "Semi-Annual": 182,
    Annual: 365,
  };
  d.setDate(d.getDate() + (days[recurrence] ?? 30));
  return d.toISOString().slice(0, 10);
}

function computeTaskStatus(nextDue: string): ScheduledTask["status"] {
  const today = new Date("2026-09-01");
  const due = new Date(nextDue);
  const diffDays = Math.floor(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "Overdue";
  if (diffDays <= 7) return "Due Soon";
  return "Scheduled";
}

const SCHEDULE_DATA: ScheduledTask[] = [
  {
    id: "SCH-001",
    title: "Generator Servicing",
    category: "Generator",
    estate: "Palm Court Abuja",
    description: "Monthly generator inspection, oil change and load testing.",
    recurrence: "Monthly",
    lastCompleted: "2026-07-25",
    nextDue: "2026-08-25",
    assignedTo: "PowerGen Nigeria Ltd",
    estimatedCost: 45000,
    status: "Overdue",
  },
  {
    id: "SCH-002",
    title: "Generator Servicing",
    category: "Generator",
    estate: "Dawaki Estate",
    description: "Monthly generator maintenance and fuel system check.",
    recurrence: "Monthly",
    lastCompleted: "2026-08-05",
    nextDue: "2026-09-05",
    assignedTo: "Emeka Dike",
    estimatedCost: 38000,
    status: "Due Soon",
  },
  {
    id: "SCH-003",
    title: "Generator Servicing",
    category: "Generator",
    estate: "Emerald Gardens Lagos",
    description: "Monthly generator service and performance test.",
    recurrence: "Monthly",
    lastCompleted: "2026-08-15",
    nextDue: "2026-09-15",
    assignedTo: "Lagos Power Services",
    estimatedCost: 42000,
    status: "Scheduled",
  },
  {
    id: "SCH-004",
    title: "Generator Servicing",
    category: "Generator",
    estate: "Jabi Estate",
    description: "Monthly generator service and battery system check.",
    recurrence: "Monthly",
    lastCompleted: "2026-07-28",
    nextDue: "2026-08-28",
    assignedTo: "Ibrahim Musa",
    estimatedCost: 35000,
    status: "Overdue",
  },
  {
    id: "SCH-005",
    title: "Fire Alarm System Test",
    category: "Fire Safety",
    estate: "Palm Court Abuja",
    description:
      "Quarterly testing of all fire alarm panels, detectors and suppression systems.",
    recurrence: "Quarterly",
    lastCompleted: "2026-07-01",
    nextDue: "2026-10-01",
    assignedTo: "SafeGuard Fire Systems",
    estimatedCost: 60000,
    status: "Scheduled",
  },
  {
    id: "SCH-006",
    title: "Elevator Inspection & Servicing",
    category: "Elevator",
    estate: "Palm Court Abuja",
    description:
      "Monthly elevator cabin, cables and safety mechanism inspection.",
    recurrence: "Monthly",
    lastCompleted: "2026-08-03",
    nextDue: "2026-09-03",
    assignedTo: "Otis Nigeria Ltd",
    estimatedCost: 75000,
    status: "Due Soon",
  },
  {
    id: "SCH-007",
    title: "Water Tank Cleaning",
    category: "Water Treatment",
    estate: "Dawaki Estate",
    description:
      "Monthly overhead water tank decontamination and disinfection.",
    recurrence: "Monthly",
    lastCompleted: "2026-08-07",
    nextDue: "2026-09-07",
    assignedTo: "Clean Water Solutions",
    estimatedCost: 28000,
    status: "Due Soon",
  },
  {
    id: "SCH-008",
    title: "Pest Control Treatment",
    category: "Pest Control",
    estate: "Emerald Gardens Lagos",
    description:
      "Quarterly fumigation of common areas, refuse points and basement.",
    recurrence: "Quarterly",
    lastCompleted: "2026-08-01",
    nextDue: "2026-11-01",
    assignedTo: "Pest Away Nigeria",
    estimatedCost: 55000,
    status: "Scheduled",
  },
  {
    id: "SCH-009",
    title: "Annual Building Inspection",
    category: "Building Inspection",
    estate: "Jabi Estate",
    description:
      "Comprehensive annual structural and safety assessment by certified engineers.",
    recurrence: "Annual",
    lastCompleted: "2025-12-01",
    nextDue: "2026-12-01",
    assignedTo: "Structo Engineering",
    estimatedCost: 250000,
    status: "Scheduled",
  },
  {
    id: "SCH-010",
    title: "HVAC System Servicing",
    category: "HVAC",
    estate: "Palm Court Abuja",
    description:
      "Semi-annual servicing of central HVAC units, filter replacement and refrigerant check.",
    recurrence: "Semi-Annual",
    lastCompleted: "2026-04-15",
    nextDue: "2026-10-15",
    assignedTo: "CoolAir Nigeria",
    estimatedCost: 120000,
    status: "Scheduled",
  },
  {
    id: "SCH-011",
    title: "Security System Check",
    category: "Security Systems",
    estate: "Dawaki Estate",
    description:
      "Monthly CCTV, access control and intercom system verification.",
    recurrence: "Monthly",
    lastCompleted: "2026-08-10",
    nextDue: "2026-09-10",
    assignedTo: "Samson Eze",
    estimatedCost: 18000,
    status: "Scheduled",
  },
  {
    id: "SCH-012",
    title: "Plumbing Inspection",
    category: "Plumbing",
    estate: "Emerald Gardens Lagos",
    description:
      "Quarterly inspection of main supply lines, sewage and drainage systems.",
    recurrence: "Quarterly",
    lastCompleted: "2026-06-06",
    nextDue: "2026-09-06",
    assignedTo: "Fola Adeyemi",
    estimatedCost: 32000,
    status: "Due Soon",
  },
  {
    id: "SCH-013",
    title: "Water Treatment Check",
    category: "Water Treatment",
    estate: "Palm Court Abuja",
    description:
      "Monthly water quality testing and borehole pump maintenance.",
    recurrence: "Monthly",
    lastCompleted: "2026-07-20",
    nextDue: "2026-08-20",
    assignedTo: "AquaPure Services",
    estimatedCost: 22000,
    status: "Overdue",
  },
  {
    id: "SCH-014",
    title: "Fire Safety Inspection",
    category: "Fire Safety",
    estate: "Jabi Estate",
    description:
      "Quarterly fire extinguisher checks and exit route inspection.",
    recurrence: "Quarterly",
    lastCompleted: "2026-06-09",
    nextDue: "2026-09-09",
    assignedTo: "SafeGuard Fire Systems",
    estimatedCost: 45000,
    status: "Scheduled",
  },
  {
    id: "SCH-015",
    title: "Electrical Systems Check",
    category: "Electrical",
    estate: "Dawaki Estate",
    description:
      "Quarterly inspection of distribution boards, earthing and panel integrity.",
    recurrence: "Quarterly",
    lastCompleted: "2026-08-15",
    nextDue: "2026-11-15",
    assignedTo: "Chidi Nwosu",
    estimatedCost: 40000,
    status: "Scheduled",
  },
];

interface MaintenanceRequest {
  id: string;
  resident: string;
  unit: string;
  estate: string;
  issue: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  reportedDate: string;
  targetDate?: string | null;
  resolvedDate?: string | null;
  startedDate?: string;
  notes?: string;
  evidenceUrls?: string[];
}

type ActionModal =
  | { type: "assign"; id: string }
  | { type: "start"; id: string }
  | { type: "complete"; id: string }
  | { type: "new" };

export default function Estates() {
  const estStaffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  const estActorName: string = estStaffInfo.name ?? "Estate Manager";
  const estActorRole: string = (estStaffInfo.role ?? "estate").toUpperCase();

  const [tab, setTab] = useState<
    "estates" | "residents" | "maintenance" | "schedule"
  >("estates");

  // Maintenance state
  const [localRequests, setLocalRequests] = useState<MaintenanceRequest[]>(
    SHARED_MAINTENANCE as unknown as MaintenanceRequest[]
  );
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // ── Scheduled Maintenance state ──
  const [scheduleItems, setScheduleItems] =
    useState<ScheduledTask[]>(SCHEDULE_DATA);
  const [schedView, setSchedView] = useState<"list" | "calendar">("list");
  const [schedEstateFilter, setSchedEstateFilter] = useState<string>("All");
  const [schedCategoryFilter, setSchedCategoryFilter] =
    useState<string>("All");
  const [schedStatusFilter, setSchedStatusFilter] = useState<string>("All");
  const [completedFlash, setCompletedFlash] = useState<Set<string>>(new Set());
  const [showAddTask, setShowAddTask] = useState(false);
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);
  // Add task form
  const [atTitle, setAtTitle] = useState("");
  const [atCategory, setAtCategory] =
    useState<ScheduledTask["category"]>("Generator");
  const [atEstate, setAtEstate] = useState(ESTATES[0]?.name ?? "");
  const [atDesc, setAtDesc] = useState("");
  const [atRecurrence, setAtRecurrence] =
    useState<ScheduledTask["recurrence"]>("Monthly");
  const [atNextDue, setAtNextDue] = useState("");
  const [atAssignedTo, setAtAssignedTo] = useState("");
  const [atCost, setAtCost] = useState("");

  function handleMarkSchedComplete(id: string) {
    setScheduleItems((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const today = "2026-09-01";
        const newNextDue = addDaysByRecurrence(today, t.recurrence);
        return {
          ...t,
          status: "Completed" as const,
          lastCompleted: today,
          nextDue: newNextDue,
        };
      })
    );
    setCompletedFlash((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setCompletedFlash((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }, 3000);
  }

  function handleReschedule(id: string, newDate: string) {
    setScheduleItems((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, nextDue: newDate, status: computeTaskStatus(newDate) }
          : t
      )
    );
  }

  function handleAddTask() {
    if (!atTitle.trim() || !atNextDue) return;
    const newTask: ScheduledTask = {
      id: `SCH-${Date.now()}`,
      title: atTitle,
      category: atCategory,
      estate: atEstate,
      description: atDesc,
      recurrence: atRecurrence,
      nextDue: atNextDue,
      assignedTo: atAssignedTo,
      estimatedCost: atCost ? parseInt(atCost, 10) : undefined,
      status: computeTaskStatus(atNextDue),
    };
    setScheduleItems((prev) => [newTask, ...prev]);
    setShowAddTask(false);
    setAtTitle("");
    setAtCategory("Generator");
    setAtEstate(ESTATES[0]?.name ?? "");
    setAtDesc("");
    setAtRecurrence("Monthly");
    setAtNextDue("");
    setAtAssignedTo("");
    setAtCost("");
  }

  // Assign modal state
  const [assignTech, setAssignTech] = useState(TECHNICIANS[0]);
  const [assignNotes, setAssignNotes] = useState("");

  // Start modal state
  const [startNotes, setStartNotes] = useState("");

  // Complete modal state
  const [completeNotes, setCompleteNotes] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New request modal state
  const [newEstate, setNewEstate] = useState(ESTATES[0]?.name ?? "");
  const [newUnit, setNewUnit] = useState("");
  const [newResident, setNewResident] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">(
    "Medium"
  );
  const [newIssue, setNewIssue] = useState("");

  function resetModalState() {
    setAssignTech(TECHNICIANS[0]);
    setAssignNotes("");
    setStartNotes("");
    setCompleteNotes("");
    setEvidenceUrls([]);
    setNewUnit("");
    setNewResident("");
    setNewCategory(CATEGORIES[0]);
    setNewPriority("Medium");
    setNewIssue("");
    setNewEstate(ESTATES[0]?.name ?? "");
  }

  function closeModal() {
    setActionModal(null);
    resetModalState();
  }

  function handleAssign(id: string) {
    const req = localRequests.find((r) => r.id === id);
    const capturedAssignTech = assignTech;
    const capturedAssignNotes = assignNotes;
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Assigned", assignedTo: assignTech, notes: assignNotes }
          : r
      )
    );
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: estActorName,
      role: estActorRole,
      action: "Maintenance Assigned",
      module: "Estates",
      detail: `Assigned maintenance request ${id} (${req?.issue ?? req?.category ?? ""}) at ${req?.estate ?? ""} to ${capturedAssignTech}.${capturedAssignNotes ? ` Notes: ${capturedAssignNotes}` : ""}`,
      ref: id,
      severity: "info",
    });
    closeModal();
  }

  function handleStart(id: string) {
    const req2 = localRequests.find((r) => r.id === id);
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "In Progress", startedDate: "2026-08-28", notes: startNotes }
          : r
      )
    );
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: estActorName,
      role: estActorRole,
      action: "Maintenance Started",
      module: "Estates",
      detail: `Maintenance ${id} (${req2?.issue ?? req2?.category ?? ""}) marked In Progress.`,
      ref: id,
      severity: "info",
    });
    closeModal();
  }

  function handleComplete(id: string) {
    const req = localRequests.find((r) => r.id === id);
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Resolved",
              resolvedDate: "2026-08-28",
              notes: completeNotes,
              evidenceUrls,
            }
          : r
      )
    );
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: estActorName,
      role: estActorRole,
      action: "Maintenance Completed",
      module: "Estates",
      detail: `Maintenance ${id} (${req?.issue ?? req?.category ?? ""}) marked Resolved.${completeNotes ? ` Notes: ${completeNotes}` : ""}`,
      ref: id,
      severity: "info",
    });
    closeModal();
  }

  function handleNewRequest() {
    if (!newIssue.trim() || !newUnit.trim() || !newResident.trim()) return;
    const newReq: MaintenanceRequest = {
      id: `MNT-${Date.now()}`,
      issue: newIssue,
      resident: newResident,
      unit: newUnit,
      estate: newEstate,
      category: newCategory,
      priority: newPriority,
      assignedTo: "Unassigned",
      status: "Open",
      reportedDate: "2026-08-28",
      resolvedDate: null,
      targetDate: null,
    };
    setLocalRequests((prev) => [newReq, ...prev]);
    logActivity({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: estActorName,
      role: estActorRole,
      action: "Maintenance Request Raised",
      module: "Estates",
      detail: `New maintenance request for Unit ${newUnit} (${newEstate}) — ${newIssue.slice(0, 80)}. Priority: ${newPriority}.`,
      severity: "info",
    });
    closeModal();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setEvidenceUrls((prev) => [...prev, ...urls]);
  }

  const statusCounts = {
    All: localRequests.length,
    Open: localRequests.filter((r) => r.status === "Open").length,
    Assigned: localRequests.filter((r) => r.status === "Assigned").length,
    "In Progress": localRequests.filter((r) => r.status === "In Progress").length,
    Resolved: localRequests.filter((r) => r.status === "Resolved").length,
  };

  const filteredRequests =
    statusFilter === "All"
      ? localRequests
      : localRequests.filter((r) => r.status === statusFilter);

  const activeRequest =
    actionModal && actionModal.type !== "new"
      ? localRequests.find((r) => r.id === (actionModal as { id: string }).id)
      : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px]">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-card { animation: modalIn 0.18s ease forwards; }
      `}</style>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-[#252731] font-semibold text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Estates
          </h2>
          <p className="text-[#69707D] text-sm mt-0.5">
            Estate management, residents and service charges
          </p>
        </div>
      </div>

      {/* Estate Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ESTATES.map((estate) => (
          <div
            key={estate.id}
            className="bg-white border border-[#E8EAF0] rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-[#252731] font-semibold">{estate.name}</h3>
                <p className="text-[#69707D] text-sm mt-0.5">
                  {estate.location} · {estate.units} units · Manager:{" "}
                  {estate.manager}
                </p>
              </div>
              <StatusBadge status={estate.status} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                <div className="text-[#69707D] text-[10px] font-semibold uppercase">
                  Occupied
                </div>
                <div className="text-[#252731] font-bold text-lg">
                  {estate.occupiedUnits}/{estate.units}
                </div>
              </div>
              <div className="bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                <div className="text-[#69707D] text-[10px] font-semibold uppercase">
                  SC Collection
                </div>
                <div
                  className={`font-bold text-lg ${estate.serviceChargeCollection < 80 ? "text-amber-600" : "text-emerald-600"}`}
                >
                  {estate.serviceChargeCollection}%
                </div>
              </div>
              <div className="bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                <div className="text-[#69707D] text-[10px] font-semibold uppercase">
                  Open MNT
                </div>
                <div
                  className={`font-bold text-lg ${estate.maintenanceOpen > 0 ? "text-amber-600" : "text-[#252731]"}`}
                >
                  {estate.maintenanceOpen}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg flex-wrap">
        {(
          ["estates", "residents", "maintenance", "schedule"] as const
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}
          >
            {t === "estates"
              ? "Overview"
              : t === "schedule"
                ? "Scheduled Maintenance"
                : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Residents Tab ── */}
      {tab === "residents" && (
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                  {[
                    "Resident",
                    "Unit",
                    "Estate",
                    "Annual SC",
                    "Paid",
                    "Outstanding",
                    "Status",
                    "Next Due",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {RESIDENTS.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F8FA] cursor-pointer">
                    <td className="px-5 py-3 text-sm font-semibold text-[#252731]">
                      {r.name}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#69707D] font-mono">
                      {r.unit}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#252731]">
                      {r.estate}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#252731] font-medium">
                      {fmt(r.serviceCharge)}
                    </td>
                    <td className="px-5 py-3 text-xs text-emerald-600 font-semibold">
                      {fmt(r.paid)}
                    </td>
                    <td
                      className={`px-5 py-3 text-xs font-bold ${r.outstanding > 0 ? "text-red-600" : "text-[#252731]"}`}
                    >
                      {fmt(r.outstanding)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-[#69707D]">
                      {r.nextDue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Maintenance Tab ── */}
      {tab === "maintenance" && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Metrics chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "Total", value: statusCounts.All },
                { label: "Open", value: statusCounts.Open },
                { label: "In Progress", value: statusCounts["In Progress"] },
                { label: "Resolved", value: statusCounts.Resolved },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="bg-[#F7F8FA] rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-[#69707D] text-[11px] font-medium">
                    {chip.label}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#25205B" }}
                  >
                    {chip.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Log New Request */}
            <button
              onClick={() => setActionModal({ type: "new" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#25205B" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M7 1v12M1 7h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Log New Request
            </button>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["All", "Open", "Assigned", "In Progress", "Resolved"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    statusFilter === s
                      ? "border-[#25205B] text-[#25205B] bg-[#EAF2FC]"
                      : "border-[#E8EAF0] text-[#69707D] bg-white hover:border-[#6B9FE5]/50"
                  }`}
                >
                  {s}
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                      statusFilter === s
                        ? "bg-[#25205B] text-white"
                        : "bg-[#F0F2F5] text-[#69707D]"
                    }`}
                  >
                    {statusCounts[s as keyof typeof statusCounts]}
                  </span>
                </button>
              )
            )}
          </div>

          {/* Request cards */}
          <div className="space-y-3">
            {filteredRequests.length === 0 && (
              <div className="bg-white border border-[#E8EAF0] rounded-xl p-8 text-center text-[#69707D] text-sm">
                No requests match this filter.
              </div>
            )}
            {filteredRequests.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-[#E8EAF0] rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-[#6B9FE5] font-semibold">
                        {m.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                          m.priority === "High"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : m.priority === "Medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {m.priority}
                      </span>
                    </div>
                    <h3 className="text-[#252731] font-semibold">{m.issue}</h3>
                    <p className="text-[#69707D] text-xs mt-0.5">
                      {m.resident} · Unit {m.unit} · {m.estate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={m.status} />
                    {/* Action buttons */}
                    {m.status === "Open" && (
                      <button
                        onClick={() =>
                          setActionModal({ type: "assign", id: m.id })
                        }
                        className="px-3 py-1 rounded-md text-xs font-semibold border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        Assign Technician
                      </button>
                    )}
                    {m.status === "Assigned" && (
                      <button
                        onClick={() =>
                          setActionModal({ type: "start", id: m.id })
                        }
                        className="px-3 py-1 rounded-md text-xs font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {m.status === "In Progress" && (
                      <button
                        onClick={() =>
                          setActionModal({ type: "complete", id: m.id })
                        }
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#69707D] flex-wrap">
                  <span>
                    Category:{" "}
                    <span className="text-[#252731] font-medium">
                      {m.category}
                    </span>
                  </span>
                  <span>
                    Assigned to:{" "}
                    <span className="text-[#252731] font-medium">
                      {m.assignedTo}
                    </span>
                  </span>
                  <span>
                    Reported:{" "}
                    <span className="text-[#252731]">{m.reportedDate}</span>
                  </span>
                  {m.resolvedDate && (
                    <span>
                      Resolved:{" "}
                      <span className="text-emerald-600 font-medium">
                        {m.resolvedDate}
                      </span>
                    </span>
                  )}
                  {!m.resolvedDate && m.targetDate && (
                    <span>
                      Target:{" "}
                      <span className="text-[#252731]">{m.targetDate}</span>
                    </span>
                  )}
                </div>
                {/* Evidence thumbnails */}
                {m.evidenceUrls && m.evidenceUrls.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {m.evidenceUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-[#E8EAF0]"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scheduled Maintenance Tab ── */}
      {tab === "schedule" && (() => {
        const filteredSchedule = scheduleItems.filter((t) => {
          if (schedEstateFilter !== "All" && t.estate !== schedEstateFilter)
            return false;
          if (
            schedCategoryFilter !== "All" &&
            t.category !== schedCategoryFilter
          )
            return false;
          if (schedStatusFilter !== "All" && t.status !== schedStatusFilter)
            return false;
          return true;
        });

        const schedStats = {
          total: scheduleItems.length,
          overdue: scheduleItems.filter((t) => t.status === "Overdue").length,
          dueThisWeek: scheduleItems.filter((t) => t.status === "Due Soon")
            .length,
          completedThisMonth: scheduleItems.filter(
            (t) => t.status === "Completed"
          ).length,
        };

        // Calendar: September 2026, first day = Tuesday (index 2)
        const calDays: (number | null)[] = [
          ...Array(2).fill(null),
          ...Array.from({ length: 30 }, (_, i) => i + 1),
        ];

        const tasksForDay = (day: number) => {
          const dateStr = `2026-09-${String(day).padStart(2, "0")}`;
          return scheduleItems.filter((t) => t.nextDue === dateStr);
        };

        const urgencyColor = (status: string) => {
          if (status === "Overdue")
            return "text-red-600 bg-red-50 border-red-200";
          if (status === "Due Soon")
            return "text-amber-600 bg-amber-50 border-amber-200";
          if (status === "Completed")
            return "text-emerald-600 bg-emerald-50 border-emerald-200";
          return "text-[#6B9FE5] bg-[#EAF2FC] border-[#6B9FE5]/30";
        };

        const dueDateColor = (status: string) => {
          if (status === "Overdue") return "text-red-600 font-semibold";
          if (status === "Due Soon") return "text-amber-600 font-semibold";
          if (status === "Completed") return "text-emerald-600";
          return "text-[#6B9FE5]";
        };

        const recurrenceBadge =
          "inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border bg-[#F7F8FA] text-[#69707D] border-[#E8EAF0] tracking-wide uppercase";

        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Summary stats */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Total Tasks", value: schedStats.total, color: "#25205B" },
                  { label: "Overdue", value: schedStats.overdue, color: "#dc2626" },
                  { label: "Due This Week", value: schedStats.dueThisWeek, color: "#d97706" },
                  {
                    label: "Completed This Month",
                    value: schedStats.completedThisMonth,
                    color: "#059669",
                  },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="bg-[#F7F8FA] rounded-lg px-3 py-2 flex items-center gap-2"
                  >
                    <span className="text-[#69707D] text-[11px] font-medium">
                      {chip.label}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: chip.color }}
                    >
                      {chip.value}
                    </span>
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex gap-0.5 bg-[#F0F2F5] p-0.5 rounded-lg">
                  {(["list", "calendar"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSchedView(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${schedView === v ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}
                    >
                      {v === "list" ? "List" : "Calendar"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "#25205B" }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M7 1v12M1 7h12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add Schedule
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Estate dropdown */}
              <select
                value={schedEstateFilter}
                onChange={(e) => setSchedEstateFilter(e.target.value)}
                className="border border-[#E8EAF0] rounded-lg px-3 py-1.5 text-xs text-[#252731] bg-white focus:outline-none focus:border-[#6B9FE5]"
              >
                <option value="All">All Estates</option>
                {ESTATES.map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name}
                  </option>
                ))}
              </select>
              {/* Category dropdown */}
              <select
                value={schedCategoryFilter}
                onChange={(e) => setSchedCategoryFilter(e.target.value)}
                className="border border-[#E8EAF0] rounded-lg px-3 py-1.5 text-xs text-[#252731] bg-white focus:outline-none focus:border-[#6B9FE5]"
              >
                <option value="All">All Categories</option>
                {SCHED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {/* Status button group */}
              <div className="flex items-center gap-1">
                {(["All", "Overdue", "Due Soon", "Scheduled", "Completed"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setSchedStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        schedStatusFilter === s
                          ? s === "Overdue"
                            ? "border-red-300 text-red-700 bg-red-50"
                            : s === "Due Soon"
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : s === "Completed"
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                : "border-[#25205B] text-[#25205B] bg-[#EAF2FC]"
                          : "border-[#E8EAF0] text-[#69707D] bg-white hover:border-[#6B9FE5]/50"
                      }`}
                    >
                      {s}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ── LIST VIEW ── */}
            {schedView === "list" && (
              <div className="space-y-3">
                {filteredSchedule.length === 0 && (
                  <div className="bg-white border border-[#E8EAF0] rounded-xl p-8 text-center text-[#69707D] text-sm">
                    No scheduled tasks match this filter.
                  </div>
                )}
                {filteredSchedule.map((task) => {
                  const flashed = completedFlash.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`bg-white border rounded-xl p-5 transition-all ${flashed ? "border-emerald-300 bg-emerald-50/30" : "border-[#E8EAF0]"}`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl leading-none mt-0.5">
                            {CATEGORY_ICONS[task.category] ?? "🔧"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-mono text-xs text-[#6B9FE5] font-semibold">
                                {task.id}
                              </span>
                              <span className={recurrenceBadge}>
                                {task.recurrence}
                              </span>
                              <span
                                className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${urgencyColor(task.status)}`}
                              >
                                {task.status}
                              </span>
                              {flashed && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded tracking-wide uppercase">
                                  Marked Complete
                                </span>
                              )}
                            </div>
                            <h3 className="text-[#252731] font-semibold">
                              {task.title}
                            </h3>
                            <p className="text-[#69707D] text-xs mt-0.5">
                              {task.estate}
                            </p>
                            <p className="text-[#69707D] text-xs mt-0.5 max-w-md">
                              {task.description}
                            </p>
                          </div>
                        </div>
                        {/* Action buttons */}
                        {task.status !== "Completed" &&
                          task.status !== "Cancelled" && (
                            <div className="flex items-center gap-2 flex-wrap shrink-0">
                              <RescheduleInline
                                task={task}
                                onReschedule={handleReschedule}
                              />
                              <button
                                onClick={() =>
                                  handleMarkSchedComplete(task.id)
                                }
                                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              >
                                Mark Complete
                              </button>
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#69707D] flex-wrap">
                        <span>
                          Assigned:{" "}
                          <span className="text-[#252731] font-medium">
                            {task.assignedTo}
                          </span>
                        </span>
                        <span>
                          Next Due:{" "}
                          <span className={dueDateColor(task.status)}>
                            {task.nextDue}
                          </span>
                        </span>
                        {task.lastCompleted && (
                          <span>
                            Last Done:{" "}
                            <span className="text-[#252731]">
                              {task.lastCompleted}
                            </span>
                          </span>
                        )}
                        {task.estimatedCost !== undefined && (
                          <span>
                            Est. Cost:{" "}
                            <span className="text-[#252731] font-medium">
                              {fmt(task.estimatedCost)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CALENDAR VIEW ── */}
            {schedView === "calendar" && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-[#252731] font-semibold text-sm"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      September 2026
                    </h3>
                    <span className="text-xs text-[#69707D]">
                      {scheduleItems.filter((t) =>
                        t.nextDue.startsWith("2026-09")
                      ).length}{" "}
                      tasks this month
                    </span>
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div
                          key={d}
                          className="text-center text-[10px] font-semibold text-[#69707D] py-1"
                        >
                          {d}
                        </div>
                      )
                    )}
                  </div>
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day, idx) => {
                      if (day === null)
                        return <div key={`blank-${idx}`} />;
                      const dayTasks = tasksForDay(day);
                      const dateStr = `2026-09-${String(day).padStart(2, "0")}`;
                      const isToday = day === 1;
                      const isSelected = calSelectedDate === dateStr;
                      return (
                        <button
                          key={day}
                          onClick={() =>
                            setCalSelectedDate(
                              isSelected ? null : dateStr
                            )
                          }
                          className={`relative flex flex-col items-center rounded-lg p-1.5 transition-all min-h-[52px] ${
                            isSelected
                              ? "bg-[#25205B] text-white"
                              : isToday
                                ? "bg-[#EAF2FC] text-[#25205B]"
                                : "hover:bg-[#F7F8FA] text-[#252731]"
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold ${isSelected ? "text-white" : isToday ? "text-[#25205B]" : ""}`}
                          >
                            {day}
                          </span>
                          {dayTasks.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                              {dayTasks.slice(0, 3).map((t) => (
                                <span
                                  key={t.id}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    t.status === "Overdue"
                                      ? "bg-red-500"
                                      : t.status === "Due Soon"
                                        ? "bg-amber-400"
                                        : t.status === "Completed"
                                          ? "bg-emerald-500"
                                          : "bg-[#6B9FE5]"
                                  } ${isSelected ? "opacity-80" : ""}`}
                                />
                              ))}
                              {dayTasks.length > 3 && (
                                <span
                                  className={`text-[8px] font-bold ${isSelected ? "text-white/80" : "text-[#69707D]"}`}
                                >
                                  +{dayTasks.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tasks for selected date */}
                {calSelectedDate && (
                  <div className="space-y-2">
                    <h4 className="text-[#252731] font-semibold text-sm">
                      Tasks due {calSelectedDate}
                    </h4>
                    {tasksForDay(parseInt(calSelectedDate.slice(-2), 10))
                      .length === 0 ? (
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-4 text-center text-[#69707D] text-sm">
                        No tasks due on this date.
                      </div>
                    ) : (
                      tasksForDay(
                        parseInt(calSelectedDate.slice(-2), 10)
                      ).map((task) => (
                        <div
                          key={task.id}
                          className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {CATEGORY_ICONS[task.category] ?? "🔧"}
                            </span>
                            <div>
                              <p className="text-[#252731] font-semibold text-sm">
                                {task.title}
                              </p>
                              <p className="text-[#69707D] text-xs">
                                {task.estate} · {task.assignedTo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${urgencyColor(task.status)}`}
                            >
                              {task.status}
                            </span>
                            {task.status !== "Completed" &&
                              task.status !== "Cancelled" && (
                                <button
                                  onClick={() =>
                                    handleMarkSchedComplete(task.id)
                                  }
                                  className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                  Mark Complete
                                </button>
                              )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-[#69707D]">
                  {[
                    { color: "bg-red-500", label: "Overdue" },
                    { color: "bg-amber-400", label: "Due Soon" },
                    { color: "bg-[#6B9FE5]", label: "Scheduled" },
                    { color: "bg-emerald-500", label: "Completed" },
                  ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Overview Tab ── */}
      {tab === "estates" && (
        <div className="bg-white border border-[#E8EAF0] rounded-xl p-6">
          <h3 className="text-[#252731] font-semibold text-sm mb-4">
            Service Charge Collection Summary
          </h3>
          <div className="space-y-4">
            {ESTATES.map((e) => (
              <div key={e.id}>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="text-[#252731] font-medium">{e.name}</span>
                  <span className="text-[#69707D] text-xs">
                    {e.serviceChargeCollection}% collected
                  </span>
                </div>
                <div className="h-2.5 bg-[#EAF2FC] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${e.serviceChargeCollection >= 80 ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${e.serviceChargeCollection}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-[#69707D]">
                  <span>{e.occupiedUnits} occupied units</span>
                  <span>Annual SC per unit: {fmt(e.annualServiceCharge)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Scheduled Task Modal ── */}
      {showAddTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAddTask(false)}
        >
          <div
            className="modal-card bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4
                className="font-semibold text-[#252731] text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Add Maintenance Schedule
              </h4>
              <p className="text-[#69707D] text-xs mt-0.5">
                Create a new recurring maintenance task for an estate.
              </p>
            </div>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-[#252731] mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={atTitle}
                  onChange={(e) => setAtTitle(e.target.value)}
                  placeholder="e.g. Generator Servicing"
                  className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Category
                  </label>
                  <select
                    value={atCategory}
                    onChange={(e) =>
                      setAtCategory(e.target.value as ScheduledTask["category"])
                    }
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                  >
                    {SCHED_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Estate
                  </label>
                  <select
                    value={atEstate}
                    onChange={(e) => setAtEstate(e.target.value)}
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                  >
                    {ESTATES.map((e) => (
                      <option key={e.id} value={e.name}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252731] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={atDesc}
                  onChange={(e) => setAtDesc(e.target.value)}
                  placeholder="Brief description of the maintenance task..."
                  className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Recurrence
                  </label>
                  <select
                    value={atRecurrence}
                    onChange={(e) =>
                      setAtRecurrence(
                        e.target.value as ScheduledTask["recurrence"]
                      )
                    }
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                  >
                    {RECURRENCES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={atNextDue}
                    onChange={(e) => setAtNextDue(e.target.value)}
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={atAssignedTo}
                    onChange={(e) => setAtAssignedTo(e.target.value)}
                    placeholder="Staff name or contractor"
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Estimated Cost (₦, optional)
                  </label>
                  <input
                    type="number"
                    value={atCost}
                    onChange={(e) => setAtCost(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#69707D] border border-[#E8EAF0] hover:bg-[#F7F8FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!atTitle.trim() || !atNextDue}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#25205B" }}
              >
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Modals ── */}
      {actionModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={closeModal}
        >
          <div
            className="modal-card bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Assign Technician */}
            {actionModal.type === "assign" && activeRequest && (
              <>
                <div>
                  <h4
                    className="font-semibold text-[#252731] text-base"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Assign Technician
                  </h4>
                  <p className="text-[#69707D] text-xs mt-0.5">
                    {activeRequest.issue} · {activeRequest.id}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#252731] mb-1">
                      Technician
                    </label>
                    <select
                      value={assignTech}
                      onChange={(e) => setAssignTech(e.target.value)}
                      className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                    >
                      {TECHNICIANS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#252731] mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      placeholder="Assignment instructions..."
                      className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5] resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#69707D] border border-[#E8EAF0] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAssign(actionModal.id)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ background: "#25205B" }}
                  >
                    Confirm Assignment
                  </button>
                </div>
              </>
            )}

            {/* Mark In Progress */}
            {actionModal.type === "start" && activeRequest && (
              <>
                <div>
                  <h4
                    className="font-semibold text-[#252731] text-base"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Mark In Progress
                  </h4>
                  <p className="text-[#69707D] text-xs mt-0.5">
                    {activeRequest.issue} · {activeRequest.id}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252731] mb-1">
                    Work started notes
                  </label>
                  <textarea
                    rows={4}
                    value={startNotes}
                    onChange={(e) => setStartNotes(e.target.value)}
                    placeholder="Describe what work has begun..."
                    className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5] resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#69707D] border border-[#E8EAF0] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStart(actionModal.id)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}

            {/* Mark Complete */}
            {actionModal.type === "complete" && activeRequest && (
              <>
                <div>
                  <h4
                    className="font-semibold text-[#252731] text-base"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Mark Complete
                  </h4>
                  <p className="text-[#69707D] text-xs mt-0.5">
                    {activeRequest.issue} · {activeRequest.id}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#252731] mb-1">
                      Completion notes / work done
                    </label>
                    <textarea
                      rows={3}
                      value={completeNotes}
                      onChange={(e) => setCompleteNotes(e.target.value)}
                      placeholder="Describe the completed work..."
                      className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#252731] mb-1">
                      Evidence photos (optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#6B9FE5] text-[#6B9FE5] text-xs font-semibold hover:bg-[#EAF2FC] transition-colors w-full justify-center"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M7 1v12M1 7h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      Upload Photos
                    </button>
                    {evidenceUrls.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {evidenceUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Upload ${i + 1}`}
                            className="w-14 h-14 object-cover rounded-lg border border-[#E8EAF0]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#69707D] border border-[#E8EAF0] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleComplete(actionModal.id)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>
              </>
            )}

            {/* Log New Request */}
            {actionModal.type === "new" && (
              <>
                <div>
                  <h4
                    className="font-semibold text-[#252731] text-base"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Log New Maintenance Request
                  </h4>
                  <p className="text-[#69707D] text-xs mt-0.5">
                    Fill in the details below to create a new request.
                  </p>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#252731] mb-1">
                        Estate
                      </label>
                      <select
                        value={newEstate}
                        onChange={(e) => setNewEstate(e.target.value)}
                        className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                      >
                        {ESTATES.map((e) => (
                          <option key={e.id} value={e.name}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#252731] mb-1">
                        Unit Number
                      </label>
                      <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="e.g. A-12"
                        className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#252731] mb-1">
                      Resident Name
                    </label>
                    <input
                      type="text"
                      value={newResident}
                      onChange={(e) => setNewResident(e.target.value)}
                      placeholder="Full name"
                      className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#252731] mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#252731] mb-1">
                        Priority
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) =>
                          setNewPriority(
                            e.target.value as "Low" | "Medium" | "High"
                          )
                        }
                        className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] focus:outline-none focus:border-[#6B9FE5]"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#252731] mb-1">
                      Issue Description
                    </label>
                    <textarea
                      rows={3}
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2 text-sm text-[#252731] placeholder-[#B0B7C3] focus:outline-none focus:border-[#6B9FE5] resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#69707D] border border-[#E8EAF0] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewRequest}
                    disabled={!newIssue.trim() || !newUnit.trim() || !newResident.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#25205B" }}
                  >
                    Log Request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
