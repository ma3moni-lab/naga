import { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface VisitorPass {
  id: string;
  passCode: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  hostName: string;
  estate: string;
  unit: string;
  expectedDate: string;
  expectedTime: string;
  numberOfVisitors: number;
  vehiclePlate?: string;
  status: "Pre-registered" | "Arrived" | "Departed" | "Denied" | "Expired";
  registeredAt: string;
  arrivedAt?: string;
  departedAt?: string;
  securityNote?: string;
}

// ── Mutable module-level store ─────────────────────────────────────────────────

const VISITOR_STORE: VisitorPass[] = [
  {
    id: "1",
    passCode: "VIS-A3KX2",
    visitorName: "Chidi Okonkwo",
    visitorPhone: "0803 412 7891",
    purpose: "Business Meeting",
    hostName: "Dr. Emeka Nwosu",
    estate: "Palm Court, Abuja",
    unit: "Block C / Apt 14",
    expectedDate: "2026-09-01",
    expectedTime: "10:00",
    numberOfVisitors: 2,
    vehiclePlate: "ABJ-234-KV",
    status: "Arrived",
    registeredAt: "2026-08-31T18:00:00Z",
    arrivedAt: "2026-09-01T10:12:00Z",
  },
  {
    id: "2",
    passCode: "VIS-BQ7YT",
    visitorName: "Mrs Adesola Banwo",
    visitorPhone: "0812 665 3300",
    purpose: "Personal Visit",
    hostName: "Mr Taiwo Banwo",
    estate: "Emerald Gardens, Lagos",
    unit: "Villa 7",
    expectedDate: "2026-09-01",
    expectedTime: "14:00",
    numberOfVisitors: 1,
    status: "Pre-registered",
    registeredAt: "2026-08-30T09:15:00Z",
  },
  {
    id: "3",
    passCode: "VIS-ZM9PL",
    visitorName: "Kola Fashola",
    visitorPhone: "0901 338 2210",
    purpose: "Delivery",
    hostName: "Ms Chioma Obi",
    estate: "Dawaki Estate",
    unit: "House 22",
    expectedDate: "2026-09-01",
    expectedTime: "09:30",
    numberOfVisitors: 1,
    vehiclePlate: "FCT-091-GH",
    status: "Departed",
    registeredAt: "2026-09-01T07:00:00Z",
    arrivedAt: "2026-09-01T09:28:00Z",
    departedAt: "2026-09-01T09:55:00Z",
  },
  {
    id: "4",
    passCode: "VIS-RN4CW",
    visitorName: "Ahmed Yakubu",
    visitorPhone: "0708 901 4456",
    purpose: "Contractor",
    hostName: "Estate Manager",
    estate: "Palm Court, Abuja",
    unit: "Common Area",
    expectedDate: "2026-09-01",
    expectedTime: "08:00",
    numberOfVisitors: 3,
    vehiclePlate: "KD-444-AA",
    status: "Arrived",
    registeredAt: "2026-08-31T16:30:00Z",
    arrivedAt: "2026-09-01T08:05:00Z",
  },
  {
    id: "5",
    passCode: "VIS-HJ2FU",
    visitorName: "Emeka Eze",
    visitorPhone: "0815 773 9982",
    purpose: "Inspection",
    hostName: "Arch. Sola Adekunle",
    estate: "Emerald Gardens, Lagos",
    unit: "Plot 3B",
    expectedDate: "2026-09-02",
    expectedTime: "11:00",
    numberOfVisitors: 2,
    status: "Pre-registered",
    registeredAt: "2026-09-01T08:45:00Z",
  },
  {
    id: "6",
    passCode: "VIS-TK8VE",
    visitorName: "Fatima Abdullahi",
    visitorPhone: "0803 220 6677",
    purpose: "Personal Visit",
    hostName: "Aminu Abdullahi",
    estate: "Dawaki Estate",
    unit: "Block A / Apt 3",
    expectedDate: "2026-08-30",
    expectedTime: "15:00",
    numberOfVisitors: 1,
    status: "Expired",
    registeredAt: "2026-08-29T11:00:00Z",
  },
  {
    id: "7",
    passCode: "VIS-GX5WN",
    visitorName: "Biodun Adeyemi",
    visitorPhone: "0706 551 8834",
    purpose: "Business Meeting",
    hostName: "CEO Office",
    estate: "Palm Court, Abuja",
    unit: "Penthouse Suite",
    expectedDate: "2026-09-01",
    expectedTime: "13:00",
    numberOfVisitors: 4,
    vehiclePlate: "LG-221-SB",
    status: "Denied",
    registeredAt: "2026-09-01T12:00:00Z",
    securityNote: "Visitor not on expected list; host unreachable at gate.",
  },
  {
    id: "8",
    passCode: "VIS-PQ3ML",
    visitorName: "Ngozi Okafor",
    visitorPhone: "0812 445 1129",
    purpose: "Other",
    hostName: "Mrs Tola Owoeye",
    estate: "Emerald Gardens, Lagos",
    unit: "Villa 12",
    expectedDate: "2026-09-01",
    expectedTime: "16:30",
    numberOfVisitors: 1,
    status: "Pre-registered",
    registeredAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "9",
    passCode: "VIS-DC6QY",
    visitorName: "Chukwudi Nwachukwu",
    visitorPhone: "0901 887 3341",
    purpose: "Contractor",
    hostName: "Facilities Manager",
    estate: "Dawaki Estate",
    unit: "Pool Area",
    expectedDate: "2026-08-31",
    expectedTime: "07:30",
    numberOfVisitors: 5,
    status: "Departed",
    registeredAt: "2026-08-30T17:00:00Z",
    arrivedAt: "2026-08-31T07:35:00Z",
    departedAt: "2026-08-31T17:10:00Z",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const SECURITY_ROLES = ["estate", "howo", "cso", "admin"];

const PURPOSES = [
  "Delivery",
  "Personal Visit",
  "Business Meeting",
  "Contractor",
  "Inspection",
  "Other",
];

const ESTATES = ["Palm Court, Abuja", "Dawaki Estate", "Emerald Gardens, Lagos"];

function generatePassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "VIS-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function nowISO(): string {
  return new Date().toISOString();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VisitorPass["status"] }) {
  const styles: Record<VisitorPass["status"], string> = {
    "Pre-registered": "bg-amber-50 text-amber-700 border-amber-200",
    Arrived: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/40",
    Departed: "bg-slate-50 text-slate-600 border-slate-200",
    Denied: "bg-red-50 text-red-700 border-red-200",
    Expired: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// ── Visitor Pass Card (physical badge look) ────────────────────────────────────

function VisitorPassCard({
  pass,
  showActions,
  onLogArrival,
  onLogDeparture,
  onDeny,
}: {
  pass: VisitorPass;
  showActions?: boolean;
  onLogArrival?: () => void;
  onLogDeparture?: () => void;
  onDeny?: () => void;
}) {
  const statusDot: Record<VisitorPass["status"], string> = {
    "Pre-registered": "bg-amber-400",
    Arrived: "bg-[#6B9FE5]",
    Departed: "bg-slate-400",
    Denied: "bg-red-500",
    Expired: "bg-gray-300",
  };

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-gray-400">
      {/* Badge header */}
      <div className="bg-[#0f0d2e] px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#6B9FE5] uppercase">
            NAGA Property Group
          </p>
          <p className="text-white font-semibold text-sm tracking-wide mt-0.5">
            VISITOR PASS
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`w-2 h-2 rounded-full ${statusDot[pass.status]}`}
          />
          <StatusBadge status={pass.status} />
        </div>
      </div>

      {/* Pass code + QR row */}
      <div className="px-5 py-4 flex items-start gap-4 border-b border-dashed border-[#E8EAF0]">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#69707D] font-medium tracking-wide uppercase mb-1">
            Pass Code
          </p>
          <p className="font-mono text-2xl font-semibold text-[#0f0d2e] tracking-widest">
            {pass.passCode}
          </p>
          <p className="text-[11px] text-[#B0B8C4] mt-1">
            Expected: {fmtDate(pass.expectedDate)} at {pass.expectedTime}
          </p>
        </div>
        {/* QR placeholder */}
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#D4A843] flex flex-col items-center justify-center bg-amber-50 shrink-0">
          <span className="text-[#D4A843] font-mono text-xs font-bold leading-none">
            QR
          </span>
          <span className="text-[8px] text-[#D4A843] mt-0.5 font-medium">
            CODE
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Visitor Name" value={pass.visitorName} />
        <Field label="Phone" value={pass.visitorPhone} />
        <Field label="Purpose" value={pass.purpose} />
        <Field label="No. of Visitors" value={String(pass.numberOfVisitors)} />
        <Field label="Host / Unit" value={`${pass.hostName} · ${pass.unit}`} />
        <Field label="Estate" value={pass.estate} />
        {pass.vehiclePlate && (
          <Field label="Vehicle Plate" value={pass.vehiclePlate} />
        )}
        {pass.arrivedAt && (
          <Field
            label="Arrived"
            value={`${fmtDate(pass.arrivedAt)} ${fmtTime(pass.arrivedAt)}`}
          />
        )}
        {pass.departedAt && (
          <Field
            label="Departed"
            value={`${fmtDate(pass.departedAt)} ${fmtTime(pass.departedAt)}`}
          />
        )}
      </div>

      {/* Security note */}
      {pass.securityNote && (
        <div className="mx-5 mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-0.5">
            Security Note
          </p>
          <p className="text-xs text-red-700">{pass.securityNote}</p>
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="px-5 pb-5 flex gap-2 flex-wrap">
          {pass.status === "Pre-registered" && (
            <button
              onClick={onLogArrival}
              className="flex-1 min-w-[110px] bg-[#25205B] text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-[#1a1645] transition-colors"
            >
              Log Arrival
            </button>
          )}
          {pass.status === "Arrived" && (
            <button
              onClick={onLogDeparture}
              className="flex-1 min-w-[110px] bg-[#25205B] text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-[#1a1645] transition-colors"
            >
              Log Departure
            </button>
          )}
          {(pass.status === "Pre-registered" || pass.status === "Arrived") && (
            <button
              onClick={onDeny}
              className="flex-1 min-w-[110px] bg-white text-red-600 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              Deny Entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-[#B0B8C4] font-medium uppercase tracking-wide mb-0.5 truncate">
        {label}
      </p>
      <p className="text-xs font-medium text-[#252731] truncate">{value}</p>
    </div>
  );
}

// ── Register Visitor Tab ───────────────────────────────────────────────────────

function RegisterVisitorTab({ staffName }: { staffName: string }) {
  const [form, setForm] = useState({
    visitorName: "",
    visitorPhone: "",
    purpose: "Personal Visit",
    estate: ESTATES[0],
    unit: "",
    expectedDate: todayISO(),
    expectedTime: "10:00",
    numberOfVisitors: 1,
    vehiclePlate: "",
    hostName: staffName,
  });
  const [generated, setGenerated] = useState<VisitorPass | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.visitorName.trim()) errs.visitorName = "Required";
    if (!form.visitorPhone.trim()) errs.visitorPhone = "Required";
    if (!form.unit.trim()) errs.unit = "Required";
    if (!form.hostName.trim()) errs.hostName = "Required";
    if (!form.expectedDate) errs.expectedDate = "Required";
    if (!form.expectedTime) errs.expectedTime = "Required";
    if (form.numberOfVisitors < 1) errs.numberOfVisitors = "Must be at least 1";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const newPass: VisitorPass = {
      id: String(Date.now()),
      passCode: generatePassCode(),
      visitorName: form.visitorName.trim(),
      visitorPhone: form.visitorPhone.trim(),
      purpose: form.purpose,
      hostName: form.hostName.trim(),
      estate: form.estate,
      unit: form.unit.trim(),
      expectedDate: form.expectedDate,
      expectedTime: form.expectedTime,
      numberOfVisitors: form.numberOfVisitors,
      vehiclePlate: form.vehiclePlate.trim() || undefined,
      status: "Pre-registered",
      registeredAt: nowISO(),
    };

    VISITOR_STORE.unshift(newPass);
    setGenerated(newPass);
  }

  function handleReset() {
    setGenerated(null);
    setForm({
      visitorName: "",
      visitorPhone: "",
      purpose: "Personal Visit",
      estate: ESTATES[0],
      unit: "",
      expectedDate: todayISO(),
      expectedTime: "10:00",
      numberOfVisitors: 1,
      vehiclePlate: "",
      hostName: staffName,
    });
    setErrors({});
  }

  if (generated) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#EAF2FC] mb-3">
            <svg
              className="w-5 h-5 text-[#25205B]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#252731]">
            Visitor Pass Generated
          </h3>
          <p className="text-xs text-[#69707D] mt-1">
            Share this pass code with the visitor
          </p>
        </div>

        <VisitorPassCard pass={generated} />

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-[#25205B] text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-[#1a1645] transition-colors"
          >
            Print Pass
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-white text-[#252731] text-sm font-semibold py-2.5 px-4 rounded-xl border border-[#E8EAF0] hover:bg-[#f7f8fa] transition-colors"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#252731]">
          Visitor Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Visitor Name"
            error={errors.visitorName}
            required
          >
            <input
              type="text"
              value={form.visitorName}
              onChange={(e) =>
                setForm((f) => ({ ...f, visitorName: e.target.value }))
              }
              placeholder="Full name"
              className={inputCls(!!errors.visitorName)}
            />
          </FormField>

          <FormField
            label="Visitor Phone"
            error={errors.visitorPhone}
            required
          >
            <input
              type="tel"
              value={form.visitorPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, visitorPhone: e.target.value }))
              }
              placeholder="0800 000 0000"
              className={inputCls(!!errors.visitorPhone)}
            />
          </FormField>

          <FormField label="Purpose of Visit" required>
            <select
              value={form.purpose}
              onChange={(e) =>
                setForm((f) => ({ ...f, purpose: e.target.value }))
              }
              className={inputCls(false)}
            >
              {PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Number of Visitors" error={errors.numberOfVisitors} required>
            <input
              type="number"
              min={1}
              max={20}
              value={form.numberOfVisitors}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  numberOfVisitors: parseInt(e.target.value) || 1,
                }))
              }
              className={inputCls(!!errors.numberOfVisitors)}
            />
          </FormField>

          <FormField label="Vehicle Plate (optional)">
            <input
              type="text"
              value={form.vehiclePlate}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehiclePlate: e.target.value }))
              }
              placeholder="e.g. ABC-123-XY"
              className={inputCls(false)}
            />
          </FormField>
        </div>
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#252731]">
          Visit Details
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Estate" required>
            <select
              value={form.estate}
              onChange={(e) =>
                setForm((f) => ({ ...f, estate: e.target.value }))
              }
              className={inputCls(false)}
            >
              {ESTATES.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Unit / Apartment" error={errors.unit} required>
            <input
              type="text"
              value={form.unit}
              onChange={(e) =>
                setForm((f) => ({ ...f, unit: e.target.value }))
              }
              placeholder="e.g. Block A / Apt 5"
              className={inputCls(!!errors.unit)}
            />
          </FormField>

          <FormField label="Expected Date" error={errors.expectedDate} required>
            <input
              type="date"
              value={form.expectedDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expectedDate: e.target.value }))
              }
              className={inputCls(!!errors.expectedDate)}
            />
          </FormField>

          <FormField label="Expected Time" error={errors.expectedTime} required>
            <input
              type="time"
              value={form.expectedTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, expectedTime: e.target.value }))
              }
              className={inputCls(!!errors.expectedTime)}
            />
          </FormField>

          <FormField
            label="Host Name"
            error={errors.hostName}
            required
            className="col-span-2"
          >
            <input
              type="text"
              value={form.hostName}
              onChange={(e) =>
                setForm((f) => ({ ...f, hostName: e.target.value }))
              }
              placeholder="Resident or staff receiving the visitor"
              className={inputCls(!!errors.hostName)}
            />
          </FormField>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#25205B] text-white text-sm font-semibold py-3 px-6 rounded-xl hover:bg-[#1a1645] transition-colors"
      >
        Generate Visitor Pass
      </button>
    </form>
  );
}

// ── Security Desk Tab ──────────────────────────────────────────────────────────

function SecurityDeskTab() {
  const [store, setStore] = useState<VisitorPass[]>([...VISITOR_STORE]);
  const [query, setQuery] = useState("");
  const [denyTargetId, setDenyTargetId] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState("");

  // Keep store in sync with module-level array
  function refresh() {
    setStore([...VISITOR_STORE]);
  }

  const today = todayISO();

  const stats = useMemo(() => {
    const todayPasses = VISITOR_STORE.filter(
      (v) => v.expectedDate === today || v.arrivedAt?.startsWith(today)
    );
    return {
      total: todayPasses.length,
      inside: VISITOR_STORE.filter((v) => v.status === "Arrived").length,
      preRegistered: VISITOR_STORE.filter(
        (v) => v.status === "Pre-registered" && v.expectedDate === today
      ).length,
      denied: todayPasses.filter((v) => v.status === "Denied").length,
    };
  }, [store]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return VISITOR_STORE.filter(
      (v) =>
        v.passCode.toLowerCase().includes(q) ||
        v.visitorName.toLowerCase().includes(q)
    );
  }, [query, store]);

  const allSorted = useMemo(
    () =>
      [...VISITOR_STORE].sort(
        (a, b) =>
          new Date(b.registeredAt).getTime() -
          new Date(a.registeredAt).getTime()
      ),
    [store]
  );

  function logArrival(id: string) {
    const idx = VISITOR_STORE.findIndex((v) => v.id === id);
    if (idx !== -1) {
      VISITOR_STORE[idx] = {
        ...VISITOR_STORE[idx],
        status: "Arrived",
        arrivedAt: nowISO(),
      };
      refresh();
    }
  }

  function logDeparture(id: string) {
    const idx = VISITOR_STORE.findIndex((v) => v.id === id);
    if (idx !== -1) {
      VISITOR_STORE[idx] = {
        ...VISITOR_STORE[idx],
        status: "Departed",
        departedAt: nowISO(),
      };
      refresh();
    }
  }

  function denyEntry(id: string) {
    const idx = VISITOR_STORE.findIndex((v) => v.id === id);
    if (idx !== -1) {
      VISITOR_STORE[idx] = {
        ...VISITOR_STORE[idx],
        status: "Denied",
        securityNote: denyNote.trim() || "Denied at gate.",
      };
      setDenyTargetId(null);
      setDenyNote("");
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Today", value: stats.total, color: "text-[#25205B]" },
          {
            label: "Currently Inside",
            value: stats.inside,
            color: "text-[#6B9FE5]",
          },
          {
            label: "Pre-reg. Today",
            value: stats.preRegistered,
            color: "text-amber-600",
          },
          { label: "Denied Today", value: stats.denied, color: "text-red-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E8EAF0] rounded-xl p-4"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#69707D] mt-0.5 font-medium">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl p-4">
        <label className="block text-xs font-semibold text-[#252731] mb-2">
          Search by Pass Code or Visitor Name
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. VIS-A3KX2 or Chidi Okonkwo"
          className="w-full border border-[#E8EAF0] rounded-lg px-3 py-2.5 text-sm text-[#252731] placeholder-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#6B9FE5]/40 focus:border-[#6B9FE5]"
        />

        {query.trim() && searchResults.length === 0 && (
          <p className="text-xs text-[#69707D] mt-3 text-center py-2">
            No pass found matching "{query}"
          </p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-4">
            {searchResults.map((pass) => (
              <div key={pass.id}>
                <VisitorPassCard
                  pass={pass}
                  showActions
                  onLogArrival={() => logArrival(pass.id)}
                  onLogDeparture={() => logDeparture(pass.id)}
                  onDeny={() => setDenyTargetId(pass.id)}
                />
                {denyTargetId === pass.id && (
                  <div className="mt-2 bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-red-700">
                      Reason for Denial
                    </p>
                    <textarea
                      value={denyNote}
                      onChange={(e) => setDenyNote(e.target.value)}
                      placeholder="Provide a reason (optional)..."
                      rows={2}
                      className="w-full border border-red-200 rounded-lg px-3 py-2 text-xs text-[#252731] placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-300/40 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => denyEntry(pass.id)}
                        className="flex-1 bg-red-600 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm Denial
                      </button>
                      <button
                        onClick={() => {
                          setDenyTargetId(null);
                          setDenyNote("");
                        }}
                        className="flex-1 bg-white text-[#252731] text-xs font-semibold py-2 px-3 rounded-lg border border-[#E8EAF0] hover:bg-[#f7f8fa] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full visitor log */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0]">
          <h3 className="text-sm font-semibold text-[#252731]">
            Visitor Log
          </h3>
          <p className="text-xs text-[#69707D] mt-0.5">
            All registered passes, sorted by date
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-[#E8EAF0]">
                {[
                  "Pass Code",
                  "Visitor",
                  "Purpose",
                  "Estate / Unit",
                  "Expected",
                  "Arrived",
                  "Departed",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF0]">
              {allSorted.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-[#f7f8fa] transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-[#0f0d2e] whitespace-nowrap">
                    {v.passCode}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-[#252731]">
                      {v.visitorName}
                    </p>
                    <p className="text-[#B0B8C4] text-[10px]">
                      {v.visitorPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#69707D] whitespace-nowrap">
                    {v.purpose}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-[#252731]">{v.estate}</p>
                    <p className="text-[#B0B8C4] text-[10px]">{v.unit}</p>
                  </td>
                  <td className="px-4 py-3 text-[#69707D] whitespace-nowrap">
                    {fmtDate(v.expectedDate)} {v.expectedTime}
                  </td>
                  <td className="px-4 py-3 text-[#69707D] whitespace-nowrap">
                    {v.arrivedAt
                      ? `${fmtDate(v.arrivedAt)} ${fmtTime(v.arrivedAt)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#69707D] whitespace-nowrap">
                    {v.departedAt
                      ? `${fmtDate(v.departedAt)} ${fmtTime(v.departedAt)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Shared form helpers ────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "w-full border rounded-lg px-3 py-2.5 text-sm text-[#252731] placeholder-[#B0B8C4]",
    "focus:outline-none focus:ring-2 transition-colors",
    hasError
      ? "border-red-300 focus:ring-red-200/50 focus:border-red-400"
      : "border-[#E8EAF0] focus:ring-[#6B9FE5]/40 focus:border-[#6B9FE5]",
  ].join(" ");
}

function FormField({
  label,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-[#252731] mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VisitorManagement() {
  const sessionRaw = sessionStorage.getItem("naga_staff");
  const staff = sessionRaw
    ? (JSON.parse(sessionRaw) as { name: string; role: string; coverage?: string })
    : { name: "Staff Member", role: "admin" };

  const canAccessSecurityDesk = SECURITY_ROLES.includes(staff.role);

  const [activeTab, setActiveTab] = useState<"register" | "security">(
    "register"
  );

  const tabs: { id: "register" | "security"; label: string; restricted?: boolean }[] = [
    { id: "register", label: "Register Visitor" },
    {
      id: "security",
      label: "Security Desk",
      restricted: !canAccessSecurityDesk,
    },
  ];

  return (
    <div className="min-h-full bg-[#f7f8fa] p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#0f0d2e] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#6B9FE5]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#252731]">
              Visitor Management
            </h1>
            <p className="text-xs text-[#69707D]">
              Register and track estate visitors
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#E8EAF0] rounded-xl p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.restricted && setActiveTab(tab.id)}
            disabled={tab.restricted}
            className={[
              "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
              activeTab === tab.id
                ? "bg-[#0f0d2e] text-white"
                : tab.restricted
                ? "text-[#B0B8C4] cursor-not-allowed"
                : "text-[#69707D] hover:text-[#252731] hover:bg-[#f7f8fa]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "register" && (
        <RegisterVisitorTab staffName={staff.name} />
      )}
      {activeTab === "security" && canAccessSecurityDesk && (
        <SecurityDeskTab />
      )}
      {activeTab === "security" && !canAccessSecurityDesk && (
        <div className="max-w-sm mx-auto text-center py-16">
          <div className="w-12 h-12 rounded-full bg-[#EAF2FC] flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-[#6B9FE5]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#252731] mb-1">
            Access Restricted
          </h3>
          <p className="text-xs text-[#69707D]">
            Security Desk is available to Estate, Supervisor, CSO, Admin, and GM
            roles only.
          </p>
        </div>
      )}
    </div>
  );
}
