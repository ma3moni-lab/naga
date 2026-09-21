import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { PROJECTS, BUDGET_SUMMARY, NAGA_STAYS_UNITS, ESTATES } from "../data/dummy";
import { LIVE_MATERIAL_REQUESTS, LIVE_PROGRESS_REPORTS } from "../data/persistentStore";
import { movementStore } from "../data/stockMovementStore";

function fmt(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${n.toLocaleString()}`;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Chart data ──────────────────────────────────────────────────────────────
const OCCUPANCY_DATA = [
  { month: "Jan", rate: 62 },
  { month: "Feb", rate: 71 },
  { month: "Mar", rate: 58 },
  { month: "Apr", rate: 83 },
  { month: "May", rate: 76 },
  { month: "Jun", rate: 68 },
  { month: "Jul", rate: 91 },
  { month: "Aug", rate: 74 },
];

const HEADCOUNT_DATA = [
  { month: "Mar", count: 22 },
  { month: "Apr", count: 23 },
  { month: "May", count: 23 },
  { month: "Jun", count: 24 },
  { month: "Jul", count: 25 },
  { month: "Aug", count: 26 },
];

const SC_PIE_DATA = [
  { name: "Collected", value: 67, color: "#25205B" },
  { name: "Outstanding", value: 28, color: "#B8C4D4" },
  { name: "Waived", value: 5, color: "#F7D480" },
];

// ── Custom tooltip wrappers ──────────────────────────────────────────────────
interface OccupancyPayload {
  payload?: { month: string; rate: number };
  value?: number;
}

function OccupancyTooltip({ active, payload }: { active?: boolean; payload?: OccupancyPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2 shadow-sm text-xs">
      <span className="text-[#25205B] font-semibold">{payload[0]?.value}% occupancy</span>
    </div>
  );
}

interface EstateBarPayload {
  payload?: { name: string; pct: number; units: number; occupied: number };
  value?: number;
}

function EstateTooltip({ active, payload }: { active?: boolean; payload?: EstateBarPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2 shadow-sm text-xs space-y-0.5">
      <div className="font-semibold text-[#252731]">{d.name}</div>
      <div className="text-[#69707D]">{d.occupied} / {d.units} units occupied</div>
      <div className="text-[#25205B] font-semibold">{d.pct.toFixed(1)}% occupancy</div>
    </div>
  );
}

function HeadcountTooltip({ active, payload }: { active?: boolean; payload?: OccupancyPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-lg px-3 py-2 shadow-sm text-xs">
      <span className="text-[#25205B] font-semibold">{payload[0]?.value} staff</span>
    </div>
  );
}

export default function Reports() {
  const [showAllProjects, setShowAllProjects] = useState(false);

  const totalBudget = BUDGET_SUMMARY.reduce((a, b) => a + b.budget, 0);
  const totalSpent = BUDGET_SUMMARY.reduce((a, b) => a + b.spent, 0);

  // Live operational data
  const pendingMRs = LIVE_MATERIAL_REQUESTS.filter((m) => m.status !== "Disbursed" && m.status !== "Rejected").length;
  const disbursedMRs = LIVE_MATERIAL_REQUESTS.filter((m) => m.status === "Disbursed").length;
  const pendingReports = LIVE_PROGRESS_REPORTS.filter((r) => r.reviewStatus === "Pending").length;
  const approvedReports = LIVE_PROGRESS_REPORTS.filter((r) => r.reviewStatus === "Approved").length;
  const pendingStockMoves = movementStore.filter((m) => m.status === "Pending Approval").length;

  const estatesBarData = ESTATES.map((e) => ({
    name: e.name,
    pct: (e.occupiedUnits / e.units) * 100,
    units: e.units,
    occupied: e.occupiedUnits,
  }));

  const visibleProjects = showAllProjects ? PROJECTS : PROJECTS.slice(0, 6);

  function handleExport() {
    const rows: string[] = [];
    rows.push("NAGA Properties — Operations Report — September 2026");
    rows.push("");
    rows.push("PROJECTS");
    rows.push("ID,Name,Location,Budget (N),Spent (N),Committed (N),Remaining (N),Completion %,Units,Target Date");
    PROJECTS.forEach((p) => {
      const b = BUDGET_SUMMARY.find((b) => b.project === p.name);
      rows.push(`${p.id},"${p.name}","${p.location}",${b?.budget ?? ""},${b?.spent ?? ""},${b?.committed ?? ""},${b?.remaining ?? ""},${p.completion},${p.units},"${p.targetDate}"`);
    });
    rows.push("");
    rows.push("ESTATES OCCUPANCY");
    rows.push("Estate,Total Units,Occupied Units,Occupancy %,Service Charge Collection %");
    ESTATES.forEach((e) => {
      rows.push(`"${e.name}",${e.units},${e.occupiedUnits},${((e.occupiedUnits / e.units) * 100).toFixed(1)},${e.serviceChargeCollection}`);
    });
    rows.push("");
    rows.push("NAGA STAYS PERFORMANCE");
    rows.push("Unit,Bookings,Total Revenue (N),Rating");
    NAGA_STAYS_UNITS.forEach((u) => {
      rows.push(`"${u.name}",${u.totalBookings},${u.totalRevenue},${u.rating}`);
    });
    rows.push("");
    rows.push("STAYS OCCUPANCY TREND");
    rows.push("Month,Occupancy Rate (%)");
    OCCUPANCY_DATA.forEach((d) => rows.push(`${d.month},${d.rate}`));
    rows.push("");
    rows.push("STAFF HEADCOUNT TREND");
    rows.push("Month,Staff Count");
    HEADCOUNT_DATA.forEach((d) => rows.push(`${d.month},${d.count}`));
    downloadCSV(rows.join("\n"), "naga-operations-report-2026-09.csv");
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-[#252731] font-semibold text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Reports & Intelligence
          </h2>
          <p className="text-[#69707D] text-sm mt-0.5">
            Consolidated view of NAGA operations — August 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="bg-white border border-[#E8EAF0] text-[#252731] text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#F7F8FA] transition-colors shrink-0 flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 10h10M6.5 2v7M4 6.5l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-[#25205B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#312a72] transition-colors shrink-0 flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3.5 4V1.5h6V4M3.5 10H2V6.5h9V10H9.5M3.5 10v2h6v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Print PDF
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Project Value", value: fmt(totalBudget), sub: "3 active projects" },
          { label: "Total Disbursed", value: fmt(totalSpent), sub: `${Math.round((totalSpent / totalBudget) * 100)}% of budget` },
          { label: "Stays Lifetime Revenue", value: fmt(39_515_000), sub: "2 units operational" },
          { label: "Customer Payments Collected", value: fmt(177_500_000), sub: "3 customers active" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`rounded-xl border px-5 py-4 ${i === 0 ? "bg-[#25205B] border-[#312a72]" : "bg-white border-[#E8EAF0]"}`}
          >
            <div className={`text-xs font-medium mb-1 ${i === 0 ? "text-[#6B9FE5]" : "text-[#69707D]"}`}>{s.label}</div>
            <div className={`text-xl font-bold ${i === 0 ? "text-white" : "text-[#252731]"}`}>{s.value}</div>
            <div className={`text-xs mt-1 ${i === 0 ? "text-[#6B9FE5]/80" : "text-[#69707D]"}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Live Ops Pulse */}
      <div className="bg-[#1a1645] border border-[#25205B] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-pulse"></span>
          <h3 className="text-white font-semibold text-sm">Live Operations Pulse</h3>
          <span className="ml-auto text-[10px] text-[#6B9FE5]/70 font-medium">Updated in real-time from stores</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Procurement Pending", value: pendingMRs, accent: pendingMRs > 0 ? "#D4A843" : "#6B9FE5" },
            { label: "MRs Disbursed", value: disbursedMRs, accent: "#6B9FE5" },
            { label: "Reports Awaiting Review", value: pendingReports, accent: pendingReports > 0 ? "#D4A843" : "#6B9FE5" },
            { label: "Reports Approved", value: approvedReports, accent: "#6B9FE5" },
            { label: "Stock Movements Pending", value: pendingStockMoves, accent: pendingStockMoves > 0 ? "#D4A843" : "#6B9FE5" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white/5 rounded-lg px-3 py-3 text-center">
              <div className="text-2xl font-bold" style={{ color: kpi.accent }}>{kpi.value}</div>
              <div className="text-[10px] text-[#6B9FE5]/80 mt-1 leading-snug">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget vs Spend */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[#252731] font-semibold text-sm">Construction Budget vs Expenditure</h3>
          <button onClick={handleExport} className="text-xs text-[#6B9FE5] font-medium hover:text-[#25205B] transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 9.5h10M6 1.5v7M3.5 5.5l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            CSV
          </button>
        </div>
        <div className="space-y-5">
          {BUDGET_SUMMARY.map((b) => {
            const spentPct = (b.spent / b.budget) * 100;
            const committedPct = (b.committed / b.budget) * 100;
            return (
              <div key={b.project}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#252731] font-semibold">{b.project}</span>
                  <span className="text-[#69707D] text-xs">{fmt(b.budget)} budget</span>
                </div>
                <div className="relative h-6 bg-[#EAF2FC] rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-[#25205B] rounded-l-lg flex items-center pl-2"
                    style={{ width: `${spentPct}%` }}
                  >
                    {spentPct > 15 && (
                      <span className="text-white text-[10px] font-semibold whitespace-nowrap">
                        Spent: {fmt(b.spent)}
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute top-0 h-full bg-[#6B9FE5]/40 flex items-center"
                    style={{ left: `${spentPct}%`, width: `${committedPct}%` }}
                  >
                    {committedPct > 5 && (
                      <span className="text-[#25205B] text-[10px] font-semibold whitespace-nowrap px-1">
                        Committed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[#69707D]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-[#25205B]" />Spent: {fmt(b.spent)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-[#6B9FE5]/50" />Committed: {fmt(b.committed)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-[#EAF2FC] border border-[#6B9FE5]/30" />Remaining: {fmt(b.remaining)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Completion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleProjects.map((p) => (
          <div key={p.id} className="bg-white border border-[#E8EAF0] rounded-xl p-5">
            <h4 className="text-[#252731] font-semibold text-sm">{p.name}</h4>
            <p className="text-[#69707D] text-xs mt-0.5">{p.location}</p>
            <div className="mt-4">
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#25205B]">{p.completion}%</div>
                <div className="text-[#69707D] text-xs pb-1">complete</div>
              </div>
              <div className="mt-2 h-2 bg-[#EAF2FC] rounded-full overflow-hidden">
                <div className="h-full bg-[#6B9FE5] rounded-full" style={{ width: `${p.completion}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <div className="text-[#69707D]">Units</div>
                  <div className="text-[#252731] font-semibold">{p.units}</div>
                </div>
                <div className="text-xs">
                  <div className="text-[#69707D]">Target</div>
                  <div className="text-[#252731] font-semibold">{p.targetDate}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {PROJECTS.length > 6 && (
        <button
          onClick={() => setShowAllProjects(!showAllProjects)}
          className="text-[#6B9FE5] text-sm font-medium hover:underline"
        >
          {showAllProjects ? "Show less" : `Show ${PROJECTS.length - 6} more projects`}
        </button>
      )}

      {/* NAGA Stays Occupancy Line Chart */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[#252731] font-semibold text-sm">NAGA Stays — Occupancy & Revenue</h3>
          <button onClick={() => {
            const rows = ["Month,Occupancy Rate (%)"];
            OCCUPANCY_DATA.forEach((d) => rows.push(`${d.month},${d.rate}`));
            downloadCSV(rows.join("\n"), "naga-stays-occupancy.csv");
          }} className="text-xs text-[#6B9FE5] font-medium hover:text-[#25205B] transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 9.5h10M6 1.5v7M3.5 5.5l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            CSV
          </button>
        </div>
        <p className="text-[#69707D] text-xs mb-5">
          Average occupancy: 72.9% · Best month: July (91%)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={OCCUPANCY_DATA} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#69707D" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[40, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "#69707D" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<OccupancyTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#6B9FE5"
              strokeWidth={2.5}
              dot={{ fill: "#25205B", r: 4, strokeWidth: 0 }}
              activeDot={{ fill: "#25205B", r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estates Occupancy + SC Collection side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Estates Bar Chart */}
        <div className="bg-white border border-[#E8EAF0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[#252731] font-semibold text-sm">Estates — Unit Occupancy</h3>
            <button onClick={() => {
              const rows = ["Estate,Total Units,Occupied Units,Occupancy %"];
              ESTATES.forEach((e) => rows.push(`"${e.name}",${e.units},${e.occupiedUnits},${((e.occupiedUnits / e.units) * 100).toFixed(1)}`));
              downloadCSV(rows.join("\n"), "naga-estates-occupancy.csv");
            }} className="text-xs text-[#6B9FE5] font-medium hover:text-[#25205B] transition-colors flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 9.5h10M6 1.5v7M3.5 5.5l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={estatesBarData}
              layout="vertical"
              margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
              barCategoryGap="35%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "#69707D" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11, fill: "#252731" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<EstateTooltip />} cursor={{ fill: "#EAF2FC" }} />
              <Bar dataKey="pct" fill="#25205B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SC Collection Pie Chart */}
        <div className="bg-white border border-[#E8EAF0] rounded-xl p-6">
          <h3 className="text-[#252731] font-semibold text-sm mb-5">Service Charge Collection</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={SC_PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {SC_PIE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8EAF0" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              {SC_PIE_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-[#69707D]">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                  <span className="font-semibold text-[#252731]">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* People & Headcount */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl p-6">
        <h3 className="text-[#252731] font-semibold text-sm mb-1">People & Headcount</h3>
        <p className="text-[#69707D] text-xs mb-5">6-month staff trend · Mar–Aug 2026</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={HEADCOUNT_DATA} margin={{ top: 4, right: 16, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#69707D" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[18, 30]}
              tick={{ fontSize: 11, fill: "#69707D" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<HeadcountTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6B9FE5"
              strokeWidth={2.5}
              dot={{ fill: "#25205B", r: 4, strokeWidth: 0 }}
              activeDot={{ fill: "#25205B", r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estate & Stays Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#252731] font-semibold text-sm">Estate Service Charge Collection</h3>
            <button onClick={() => {
              const rows = ["Estate,Service Charge Collection %"];
              ESTATES.forEach((e) => rows.push(`"${e.name}",${e.serviceChargeCollection}`));
              downloadCSV(rows.join("\n"), "naga-service-charge.csv");
            }} className="text-xs text-[#6B9FE5] font-medium hover:text-[#25205B] transition-colors flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 9.5h10M6 1.5v7M3.5 5.5l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              CSV
            </button>
          </div>
          <div className="space-y-3">
            {ESTATES.map((e) => (
              <div key={e.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#252731] font-medium">{e.name}</span>
                  <span
                    className={`font-semibold ${e.serviceChargeCollection >= 80 ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {e.serviceChargeCollection}%
                  </span>
                </div>
                <div className="h-2 bg-[#EAF2FC] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${e.serviceChargeCollection >= 80 ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${e.serviceChargeCollection}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#252731] font-semibold text-sm">NAGA Stays Performance</h3>
            <button onClick={() => {
              const rows = ["Unit,Bookings,Total Revenue (N),Rating"];
              NAGA_STAYS_UNITS.forEach((u) => rows.push(`"${u.name}",${u.totalBookings},${u.totalRevenue},${u.rating}`));
              downloadCSV(rows.join("\n"), "naga-stays-performance.csv");
            }} className="text-xs text-[#6B9FE5] font-medium hover:text-[#25205B] transition-colors flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 9.5h10M6 1.5v7M3.5 5.5l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              CSV
            </button>
          </div>
          <div className="space-y-4">
            {NAGA_STAYS_UNITS.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EAF2FC] overflow-hidden shrink-0">
                  <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#252731] text-xs font-semibold truncate">{u.name}</div>
                  <div className="text-[#69707D] text-[10px]">{u.totalBookings} bookings · ★ {u.rating}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[#25205B] font-bold text-sm">{fmt(u.totalRevenue)}</div>
                  <div className="text-[#69707D] text-[10px]">lifetime revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data coverage note */}
      <div className="bg-[#F7F8FA] border border-[#E8EAF0] rounded-xl p-4 flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5" style={{ color: "#6B9FE5" }}><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" /><path d="M8 7v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="8" cy="4.5" r="0.8" fill="currentColor" /></svg>
        <p className="text-[#69707D] text-sm">
          This report covers data from the current session. Use the{" "}
          <span className="font-semibold text-[#252731]">Export CSV</span> button above to download project and budget data.
          For Finance, Estates, and Stays breakdowns, navigate to those modules directly.
        </p>
      </div>
    </div>
  );
}
