import { useState } from "react";
import { PROJECTS, MATERIAL_REQUESTS, EXECUTIVE_KPIS, AUDIT_EVENTS, STAYS_BOOKINGS, PENDING_APPROVALS, EMPLOYEES } from "../data/dummy";
import { ACTIVITY_LOG, ActivityEntry } from "../data/activityLog";
import { SHARED_MAINTENANCE } from "../data/maintenanceStore";
import { SHARED_SUPPORT_TICKETS } from "../data/supportStore";
import { LIVE_MATERIAL_REQUESTS, LIVE_PROGRESS_REPORTS } from "../data/persistentStore";
import { movementStore } from "../data/stockMovementStore";
import { payrollStore } from "./Payroll";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

function fmt(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Near Completion": "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Disbursed: "bg-purple-50 text-purple-700 border-purple-200",
    Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Pending Supervisor": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

type Module = "executive" | "construction" | "procurement" | "inventory" | "finance" | "realestate" | "customers" | "estates" | "stays" | "people" | "audit" | "reports" | "documents" | "support" | "tasks";

interface Props {
  onNavigate: (m: Module) => void;
}

interface DashboardProps {
  staffInfo: { name?: string; role?: string; coverage?: string; location?: string };
  onNavigate: (m: Module) => void;
}

export default function Executive({ onNavigate }: Props) {
  const staffInfo = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}"); } catch { return {}; } })();
  if (staffInfo.role === "howo") return <HOWODashboard staffInfo={staffInfo} onNavigate={onNavigate} />;
  if (staffInfo.role === "admin") return <AdminDashboard staffInfo={staffInfo} onNavigate={onNavigate} />;
  return <CEODashboard staffInfo={staffInfo} onNavigate={onNavigate} />;
}

function CEODashboard({ staffInfo, onNavigate }: DashboardProps) {
  const kpis = EXECUTIVE_KPIS;
  const isCEO = staffInfo.role === "ceo";
  const staffFirstName: string = (staffInfo.name ?? "Emeka").split(" ")[0];

  const [activityFilter, setActivityFilter] = useState<string>("All");
  const [activitySearch, setActivitySearch] = useState("");

  const filteredLog = ACTIVITY_LOG.filter((e: ActivityEntry) => {
    if (activityFilter !== "All" && e.module !== activityFilter) return false;
    if (activitySearch.trim() && !e.actor.toLowerCase().includes(activitySearch.toLowerCase()) && !e.action.toLowerCase().includes(activitySearch.toLowerCase()) && !e.detail.toLowerCase().includes(activitySearch.toLowerCase())) return false;
    return true;
  });

  const logModules = ["All", ...Array.from(new Set(ACTIVITY_LOG.map((e: ActivityEntry) => e.module)))];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl text-[#252731] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Good morning, {staffFirstName}
          </h1>
          <p className="text-[#69707D] text-sm mt-1">Here is what requires your attention across NAGA today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {kpis.pendingApprovals > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => onNavigate("finance")}>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {kpis.pendingApprovals} pending approvals
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Projects" value={kpis.activeProjects.toString()} sub="Across Abuja, Lagos, Benin" color="indigo" onClick={() => onNavigate("construction")} />
        <KpiCard label="Total Disbursed (All Projects)" value={fmt(kpis.totalDisbursed)} sub={`Budget: ${fmt(kpis.totalProjectValue)}`} color="blue" onClick={() => onNavigate("finance")} />
        <KpiCard label="Properties Available" value={`${kpis.propertiesAvailable + kpis.propertiesReserved}`} sub={`${kpis.propertiesAvailable} available · ${kpis.propertiesReserved} reserved`} color="teal" onClick={() => onNavigate("realestate")} />
        <KpiCard label="NAGA Stays Revenue" value={fmt(kpis.staysTotalRevenue)} sub="Lifetime earnings" color="gold" onClick={() => onNavigate("stays")} />
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Residents Managed" value={kpis.totalResidents.toString()} sub={`${kpis.overdueServiceCharges} overdue charges`} color="neutral" onClick={() => onNavigate("estates")} />
        <KpiCard label="Maintenance Open" value={kpis.maintenanceOpen.toString()} sub="Across all estates" color="amber" onClick={() => onNavigate("estates")} />
        <KpiCard label="Customer Receipts" value={fmt(kpis.totalCollected)} sub="All payment plans" color="green" onClick={() => onNavigate("customers")} />
        <KpiCard label="Pending MR Approvals" value={kpis.pendingMRs.toString()} sub="Awaiting your review" color="red" onClick={() => onNavigate("procurement")} />
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Projects + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
            <h2 className="text-[#252731] font-semibold text-sm">Active Projects</h2>
            <button onClick={() => onNavigate("construction")} className="text-[#6B9FE5] text-xs hover:underline font-medium">View all</button>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {PROJECTS.map((p) => (
              <div key={p.id} className="px-5 py-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer" onClick={() => onNavigate("construction")}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[#252731] font-semibold text-sm">{p.name}</div>
                    <div className="text-[#69707D] text-xs mt-0.5">{p.location} · {p.type} · {p.units} units</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#69707D]">
                    <span>Construction Progress</span>
                    <span className="font-semibold text-[#252731]">{p.completion}%</span>
                  </div>
                  <div className="h-1.5 bg-[#EAF2FC] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6B9FE5] transition-all"
                      style={{ width: `${p.completion}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#69707D] mt-1.5">
                    <span>Spent: <span className="text-[#252731] font-medium">{fmt(p.spent)}</span></span>
                    <span>Budget: <span className="text-[#252731] font-medium">{fmt(p.budget)}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Attention */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EAF0]">
              <h2 className="text-[#252731] font-semibold text-sm">Requires Attention</h2>
            </div>
            <div className="divide-y divide-[#F0F2F5]">
              {PENDING_APPROVALS.map((item) => (
                <div key={item.id} className="px-5 py-3.5 hover:bg-[#F7F8FA] transition-colors cursor-pointer" onClick={() => onNavigate("procurement")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[#252731] text-xs font-semibold">{item.id}</div>
                      <div className="text-[#69707D] text-[11px] mt-0.5">{item.type} · {item.requestedBy}</div>
                      {item.amount && (
                        <div className="text-[#25205B] text-xs font-semibold mt-1">{fmt(item.amount)}</div>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded font-medium uppercase tracking-wide">
                      {item.awaitingAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit Activity */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
              <h2 className="text-[#252731] font-semibold text-sm">Recent Activity</h2>
              <button onClick={() => onNavigate("audit")} className="text-[#6B9FE5] text-xs hover:underline font-medium">Audit trail</button>
            </div>
            <div className="divide-y divide-[#F0F2F5]">
              {AUDIT_EVENTS.slice(0, 4).map((e) => (
                <div key={e.id} className="px-5 py-3 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("audit")}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-[#EAF2FC] flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B9FE5]" />
                    </div>
                    <div>
                      <div className="text-[#252731] text-[11px] font-semibold">{e.action}</div>
                      <div className="text-[#69707D] text-[10px]">{e.actor} · {e.date}</div>
                      <div className="text-[#69707D] text-[10px] mt-0.5 line-clamp-1">{e.entity} — {e.project}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NAGA Stays Snapshot */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
          <div>
            <h2 className="text-[#252731] font-semibold text-sm">NAGA Stays — Active Bookings</h2>
            <p className="text-[#69707D] text-xs mt-0.5">Short-let performance this month</p>
          </div>
          <button onClick={() => onNavigate("stays")} className="text-[#6B9FE5] text-xs hover:underline font-medium">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                {["Booking Ref", "Unit", "Guest", "Check-in", "Check-out", "Amount", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {STAYS_BOOKINGS.slice(0, 3).map((b) => (
                <tr key={b.id} className="hover:bg-[#F7F8FA] cursor-pointer" onClick={() => onNavigate("stays")}>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#6B9FE5] font-medium">{b.id}</td>
                  <td className="px-5 py-3 text-[#252731] text-xs font-medium">{b.unit}</td>
                  <td className="px-5 py-3 text-[#252731] text-xs">{b.guest}</td>
                  <td className="px-5 py-3 text-[#69707D] text-xs">{b.checkIn}</td>
                  <td className="px-5 py-3 text-[#69707D] text-xs">{b.checkOut}</td>
                  <td className="px-5 py-3 text-[#252731] text-xs font-semibold">{fmt(b.amount)}</td>
                  <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CEO ACTIVITY LOG (CEO-only) ── */}
      {isCEO && (
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8EAF0]" style={{ background: "#1a1645" }}>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3v4l3 2" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div>
                <div className="text-white font-semibold text-[14px]">Platform Activity Log</div>
                <div className="text-[#6B9FE5] text-[10px] tracking-wide">CEO eyes only · All staff actions across all modules</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="#6B9FE5" strokeWidth="1.2"/><path d="M8 8l1.5 1.5" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <input
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search log…"
                  className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(107,159,229,0.25)", color: "white", width: 160 }}
                />
              </div>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(107,159,229,0.25)", color: "white" }}
              >
                {logModules.map((m) => <option key={m} value={m} style={{ background: "#1a1645" }}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="divide-y divide-[#F7F8FA] max-h-[480px] overflow-y-auto">
            {filteredLog.length === 0 && (
              <div className="text-center py-10 text-[13px]" style={{ color: "#9DA8C0" }}>No activity entries match your filter.</div>
            )}
            {filteredLog.map((entry: ActivityEntry) => {
              const severityStyle = entry.severity === "critical"
                ? { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" }
                : entry.severity === "warning"
                ? { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" }
                : { dot: "bg-[#6B9FE5]", bg: "bg-[#EAF2FC]", text: "text-[#25205B]" };
              return (
                <div key={entry.id} className={`px-5 py-3.5 hover:bg-[#FAFBFC] transition-colors ${entry.severity === "critical" ? "border-l-2 border-red-400" : entry.severity === "warning" ? "border-l-2 border-amber-400" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severityStyle.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[12px]" style={{ color: "#252731" }}>{entry.actor}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${severityStyle.bg} ${severityStyle.text}`}>{entry.role}</span>
                        <span className="text-[11px] font-medium" style={{ color: "#252731" }}>{entry.action}</span>
                        {entry.ref && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#6B9FE5", border: "1px solid #E8EAF0" }}>{entry.ref}</span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#9DA8C0", border: "1px solid #E8EAF0" }}>{entry.module}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#69707D" }}>{entry.detail}</p>
                      <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{entry.timestamp}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-[#E8EAF0] flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "#9DA8C0" }}>Showing {filteredLog.length} of {ACTIVITY_LOG.length} entries</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded" style={{ background: "#EAF2FC", color: "#25205B" }}>🔒 Restricted — CEO Only</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics Charts ──────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: "Jan", value: 3.2 },
  { month: "Feb", value: 2.8 },
  { month: "Mar", value: 4.1 },
  { month: "Apr", value: 3.6 },
  { month: "May", value: 5.2 },
  { month: "Jun", value: 4.8 },
  { month: "Jul", value: 6.1 },
  { month: "Aug", value: 5.5 },
];

const ESTATE_OCCUPANCY = [
  { estate: "Palm Estate", rate: 88 },
  { estate: "Sapphire Court", rate: 94 },
  { estate: "Emerald Gardens", rate: 76 },
  { estate: "Granite Heights", rate: 100 },
];

const MAINT_STATUS_COLORS: Record<string, string> = {
  Open: "#F59E0B",
  Assigned: "#6B9FE5",
  "In Progress": "#25205B",
  Completed: "#10B981",
  Closed: "#9CA3AF",
};

const SUPPORT_OPEN_STATUSES = new Set(["Open", "In Progress", "Pending Customer", "Escalated"]);

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
      <h3 className="font-semibold text-[14px] mb-4" style={{ color: "#252731" }}>{title}</h3>
      {children}
    </div>
  );
}

const AXIS_TICK = { fontSize: 11, fill: "#69707D" };

function AnalyticsCharts() {
  // Chart 3: maintenance counts by status
  const maintStatusOrder: Array<"Open" | "Assigned" | "In Progress" | "Completed" | "Closed"> =
    ["Open", "Assigned", "In Progress", "Completed", "Closed"];
  const maintCounts = maintStatusOrder.map((status) => ({
    status,
    count: SHARED_MAINTENANCE.filter((r) => r.status === status).length,
    color: MAINT_STATUS_COLORS[status],
  }));

  // Chart 4: open support tickets grouped by category
  const openTickets = SHARED_SUPPORT_TICKETS.filter((t) => SUPPORT_OPEN_STATUSES.has(t.status));
  const categoryMap: Record<string, number> = {};
  for (const t of openTickets) {
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + 1;
  }
  const supportData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Chart 1 — Monthly Revenue */}
      <ChartCard title="Service Charge Collections — 2026">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_REVENUE} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₦${v}m`}
            />
            <Tooltip
              formatter={(v) => [`₦${Number(v)}M`, "Collections"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8EAF0" }}
            />
            <Bar dataKey="value" fill="#6B9FE5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Chart 2 — Estate Occupancy (horizontal bar) */}
      <ChartCard title="Estate Occupancy Rate">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ESTATE_OCCUPANCY} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="estate"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              formatter={(v) => [`${Number(v)}%`, "Occupancy"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8EAF0" }}
            />
            <Bar dataKey="rate" fill="#25205B" radius={[0, 4, 4, 0]}>
              {ESTATE_OCCUPANCY.map((entry) => (
                <Cell
                  key={entry.estate}
                  fill={entry.rate === 100 ? "#10B981" : "#25205B"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Chart 3 — Maintenance by Status (PieChart) */}
      <ChartCard title="Maintenance Requests by Status">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={maintCounts}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {maintCounts.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, name) => [Number(v), String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8EAF0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
          {maintCounts.map((entry) => (
            <div key={entry.status} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
              <span className="text-[11px]" style={{ color: "#69707D" }}>
                {entry.status} <span className="font-semibold" style={{ color: "#252731" }}>({entry.count})</span>
              </span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Chart 4 — Open Support Tickets by Category */}
      <ChartCard title="Open Support Tickets">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={supportData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
            <XAxis dataKey="category" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(v) => [Number(v), "Open tickets"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8EAF0" }}
            />
            <Bar dataKey="count" fill="#EAF2FC" stroke="#6B9FE5" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ── GM Dashboard ─────────────────────────────────────────────────────────────

const GM_STAFF_PERFORMANCE = [
  { name: "Emeka Eze", role: "Site Supervisor", tasks: 14, completed: 11, overdue: 1 },
  { name: "Blessing Okafor", role: "PCO", tasks: 8, completed: 8, overdue: 0 },
  { name: "Tunde Adeyemi", role: "IVM Officer", tasks: 6, completed: 5, overdue: 1 },
  { name: "Chioma Nnadi", role: "Estate Officer", tasks: 10, completed: 9, overdue: 0 },
  { name: "Ahmed Musa", role: "Security Coordinator", tasks: 5, completed: 4, overdue: 0 },
];

const GM_SCHEDULE = [
  { date: "2026-09-02", type: "Inspection", detail: "Block A annual structural inspection — Palm Court", assignee: "Emeka Eze", urgent: true },
  { date: "2026-09-03", type: "Handover", detail: "Unit 14B handover to new resident — Emerald Gardens", assignee: "Chioma Nnadi", urgent: false },
  { date: "2026-09-05", type: "Maintenance", detail: "Generator scheduled servicing — Palm Court Block B", assignee: "IVM Team", urgent: false },
  { date: "2026-09-07", type: "Review", detail: "Supervisor weekly progress review", assignee: "All Supervisors", urgent: false },
  { date: "2026-09-10", type: "Handover", detail: "Unit 3A key collection — Granite Heights", assignee: "Chioma Nnadi", urgent: false },
];

const MAINT_WEEK_DATA = [
  { day: "Mon", opened: 3, closed: 4 },
  { day: "Tue", opened: 2, closed: 3 },
  { day: "Wed", opened: 5, closed: 2 },
  { day: "Thu", opened: 1, closed: 4 },
  { day: "Fri", opened: 4, closed: 3 },
  { day: "Sat", opened: 2, closed: 1 },
  { day: "Sun", opened: 0, closed: 1 },
];

const SCHEDULE_ICONS: Record<string, string> = {
  Inspection: "🔍", Handover: "🔑", Maintenance: "🔧", Review: "📋", Meeting: "👥",
};

function HOWODashboard({ staffInfo, onNavigate }: DashboardProps) {
  const firstName = (staffInfo.name ?? "Manager").split(" ")[0];
  const coverage = staffInfo.location ?? "All Areas";

  // State-scoped data
  const stateProjects = PROJECTS.filter((p) => !coverage || p.location === coverage || coverage === "All Areas");
  const activeProjects = stateProjects.filter((p) => p.status === "Active");

  // Live procurement — pending MRs for projects in this state
  const stateMRPending = LIVE_MATERIAL_REQUESTS.filter(
    (m) => m.status === "Pending Supervisor" && (!coverage || stateProjects.some((p) => p.name === m.project))
  );

  // Pending site report reviews
  const pendingReports = LIVE_PROGRESS_REPORTS.filter((r) => {
    if (r.reviewStatus !== "Pending") return false;
    return stateProjects.some((p) => p.name === r.project);
  });

  // Pending stock movements this HOWO must approve
  const pendingStockMoves = movementStore.filter(
    (m) => m.status === "Pending Approval" && m.authorisedBy === (staffInfo.name ?? "")
  );

  // Payroll — submitted schedules
  const pendingPayroll = payrollStore.filter((s) => s.status === "Submitted");

  // Maintenance (scoped to state sites)
  const openMaint = SHARED_MAINTENANCE.filter((m) => ["Open", "Assigned"].includes(m.status));
  const inProgressMaint = SHARED_MAINTENANCE.filter((m) => m.status === "In Progress");
  const completedMaint = SHARED_MAINTENANCE.filter((m) => m.status === "Completed");

  // Staff in state
  const stateStaff = EMPLOYEES.filter((e) => {
    const r = e.role?.toLowerCase() ?? "";
    return r.includes(coverage.toLowerCase()) || r.includes("howo") || ["pco","ivm","prm"].some((x) => r.startsWith(x));
  });

  const priorityTickets = openMaint.slice(0, 4);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1645 0%, #25205B 60%, #312a72 100%)" }}>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                  HEAD OF WORKS & OPERATIONS
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(212,168,67,0.2)", color: "#D4A843", border: "1px solid rgba(212,168,67,0.3)" }}>
                  State: {coverage}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-white mt-2" style={{ fontFamily: "var(--font-display)" }}>
                Good morning, {firstName}
              </h1>
              <p className="text-[#6B9FE5] text-sm mt-0.5">Operations briefing · Tuesday, 1 September 2026</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {stateMRPending.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer" style={{ background: "rgba(107,159,229,0.15)", border: "1px solid rgba(107,159,229,0.3)" }} onClick={() => onNavigate("procurement")}>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-blue-300 text-xs font-semibold">{stateMRPending.length} procurement pending</span>
                </div>
              )}
              {pendingReports.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }} onClick={() => onNavigate("construction")}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#a78bfa" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "#c4b5fd" }}>{pendingReports.length} site report{pendingReports.length > 1 ? "s" : ""} to review</span>
                </div>
              )}
              {pendingStockMoves.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer" style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)" }} onClick={() => onNavigate("inventory")}>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold">{pendingStockMoves.length} stock movement{pendingStockMoves.length > 1 ? "s" : ""} to approve</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ops KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Projects" value={activeProjects.length.toString()} sub={`${coverage} state`} color="indigo" onClick={() => onNavigate("construction")} />
        <KpiCard label="Pending MRs" value={stateMRPending.length.toString()} sub="Awaiting your review" color={stateMRPending.length > 0 ? "red" : "neutral"} onClick={() => onNavigate("procurement")} />
        <KpiCard label="Site Reports" value={pendingReports.length.toString()} sub="Pending review" color={pendingReports.length > 0 ? "amber" : "neutral"} onClick={() => onNavigate("construction")} />
        <KpiCard label="Stock Approvals" value={pendingStockMoves.length.toString()} sub="Movements to approve" color={pendingStockMoves.length > 0 ? "amber" : "neutral"} onClick={() => onNavigate("inventory")} />
      </div>

      {/* Payroll notice */}
      {pendingPayroll.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer" style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)" }} onClick={() => onNavigate("people")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="#D4A843" strokeWidth="1.2"/><path d="M4 6h6M4 8.5h3.5" stroke="#D4A843" strokeWidth="1.1" strokeLinecap="round"/></svg>
          <span className="text-[12px] font-semibold" style={{ color: "#D4A843" }}>{pendingPayroll.length} payroll schedule{pendingPayroll.length > 1 ? "s" : ""} submitted — awaiting Finance disbursement</span>
        </div>
      )}

      {/* Project Progress + Priority Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <div className="lg:col-span-2 bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
            <div>
              <h2 className="text-[#252731] font-semibold text-sm">Project Status</h2>
              <p className="text-[#69707D] text-[11px] mt-0.5">Construction progress and budget burn</p>
            </div>
            <button onClick={() => onNavigate("construction")} className="text-[#6B9FE5] text-xs font-medium hover:underline">Full view</button>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {stateProjects.map((p) => {
              const burnPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
              const overspend = burnPct > p.completion + 10;
              return (
                <div key={p.id} className="px-5 py-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer" onClick={() => onNavigate("construction")}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <div className="text-[#252731] font-semibold text-sm">{p.name}</div>
                      <div className="text-[#69707D] text-xs mt-0.5">{p.location} · {p.units} units</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#252731] text-sm font-bold">{p.completion}%</div>
                      <div className="text-[11px]" style={{ color: overspend ? "#dc2626" : "#69707D" }}>
                        {overspend ? "⚠ Budget concern" : "On budget"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-[#69707D] mb-1"><span>Construction</span><span className="font-semibold text-[#252731]">{p.completion}%</span></div>
                      <div className="h-2 bg-[#EAF2FC] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${p.completion}%`, background: p.completion >= 80 ? "#10B981" : "#6B9FE5" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[#69707D] mb-1"><span>Budget utilised</span><span className="font-semibold" style={{ color: overspend ? "#dc2626" : "#252731" }}>{burnPct}%</span></div>
                      <div className="h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(burnPct, 100)}%`, background: overspend ? "#ef4444" : "#D4A843" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Issues & Schedule */}
        <div className="space-y-4">
          {/* Priority Maintenance */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E8EAF0] flex items-center justify-between" style={{ background: "#FFFBEB" }}>
              <h2 className="text-amber-800 font-semibold text-sm">Priority Issues</h2>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">{openMaint.length} open</span>
            </div>
            <div className="divide-y divide-[#F0F2F5]">
              {priorityTickets.length === 0 ? (
                <div className="px-5 py-6 text-center text-[#69707D] text-xs">No open maintenance issues</div>
              ) : (
                priorityTickets.map((m) => (
                  <div key={m.id} className="px-5 py-3 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("estates")}>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-amber-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[#252731] text-[11px] font-semibold truncate">{m.type}</div>
                        <div className="text-[#69707D] text-[10px] mt-0.5">{m.unit} · {m.estate}</div>
                        <div className="text-[#69707D] text-[10px]">{m.dateSubmitted}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-2.5 border-t border-[#E8EAF0]">
              <button onClick={() => onNavigate("estates")} className="text-xs text-[#6B9FE5] font-semibold hover:underline">View all maintenance →</button>
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E8EAF0]">
              <h2 className="text-[#252731] font-semibold text-sm">Upcoming Schedule</h2>
            </div>
            <div className="divide-y divide-[#F0F2F5]">
              {GM_SCHEDULE.slice(0, 4).map((event, i) => (
                <div key={i} className="px-5 py-3 hover:bg-[#F7F8FA] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="text-base shrink-0 mt-0.5">{SCHEDULE_ICONS[event.type] ?? "📌"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#252731] text-[11px] font-semibold leading-tight">{event.detail}</div>
                      <div className="text-[#69707D] text-[10px] mt-0.5">{event.date} · {event.assignee}</div>
                      {event.urgent && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mt-1 inline-block">URGENT</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Activity Chart + Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Maintenance Activity */}
        <div className="bg-white border border-[#E8EAF0] rounded-xl p-5">
          <h3 className="text-[#252731] font-semibold text-sm mb-4">Maintenance Activity — This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MAINT_WEEK_DATA} barSize={14} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#69707D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#69707D" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8EAF0" }} />
              <Bar dataKey="opened" name="Opened" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="closed" name="Closed" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-amber-400 shrink-0" /><span className="text-[11px] text-[#69707D]">Opened</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-emerald-500 shrink-0" /><span className="text-[11px] text-[#69707D]">Closed</span></div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0]">
            <h3 className="text-[#252731] font-semibold text-sm">Staff Task Completion — September</h3>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {GM_STAFF_PERFORMANCE.map((s) => {
              const pct = Math.round((s.completed / s.tasks) * 100);
              return (
                <div key={s.name} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <div className="text-[#252731] text-xs font-semibold">{s.name}</div>
                      <div className="text-[#69707D] text-[10px]">{s.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#252731] text-xs font-bold">{pct}%</div>
                      {s.overdue > 0 && (
                        <div className="text-[9px] text-red-500 font-semibold">{s.overdue} overdue</div>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct === 100 ? "#10B981" : pct >= 70 ? "#6B9FE5" : "#F59E0B" }}
                    />
                  </div>
                  <div className="text-[10px] text-[#69707D] mt-1">{s.completed}/{s.tasks} tasks complete</div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-[#E8EAF0]">
            <button onClick={() => onNavigate("people")} className="text-xs text-[#6B9FE5] font-semibold hover:underline">View all staff →</button>
          </div>
        </div>
      </div>

      {/* Live approvals queue */}
      {(stateMRPending.length > 0 || pendingStockMoves.length > 0 || pendingReports.length > 0) && (
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E8EAF0] flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: "#252731" }}>Pending Your Action</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
              {stateMRPending.length + pendingStockMoves.length + pendingReports.length} items
            </span>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {stateMRPending.slice(0, 3).map((mr) => (
              <div key={mr.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("procurement")}>
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(107,159,229,0.12)", color: "#25205B" }}>MR</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: "#252731" }}>{mr.id} — {mr.project}</div>
                  <div className="text-[10px]" style={{ color: "#69707D" }}>Procurement · {mr.requestedBy} · ₦{(mr.totalAmount ?? 0).toLocaleString()}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(212,168,67,0.1)", color: "#b07e0f" }}>Pending</span>
              </div>
            ))}
            {pendingStockMoves.slice(0, 3).map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("inventory")}>
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(212,168,67,0.1)", color: "#b07e0f" }}>STK</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: "#252731" }}>{m.id} — {m.itemName}</div>
                  <div className="text-[10px]" style={{ color: "#69707D" }}>Stock {m.type} · {m.project} · {m.qty} {m.itemUnit}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(212,168,67,0.1)", color: "#b07e0f" }}>Pending</span>
              </div>
            ))}
            {pendingReports.slice(0, 3).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("construction")}>
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>RPT</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: "#252731" }}>{r.id} — {r.project}</div>
                  <div className="text-[10px]" style={{ color: "#69707D" }}>Site report · {r.submittedBy} · {r.date}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>Review</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

const ADMIN_DOCUMENT_QUEUE = [
  { id: "DOC-031", type: "Service Charge", subject: "Q3 Service Charge Statement — All Residents", estate: "All Estates", status: "Draft", due: "2026-09-05", priority: "high" },
  { id: "DOC-032", type: "Circular", subject: "September General Meeting Reminder", estate: "Palm Court", status: "Pending Signature", due: "2026-09-03", priority: "high" },
  { id: "DOC-033", type: "Warning Letter", subject: "Overdue Payment Notice — 3 residents", estate: "Granite Heights", status: "Ready to Send", due: "2026-09-04", priority: "medium" },
  { id: "DOC-034", type: "Notice", subject: "Planned Water Supply Interruption — Block C", estate: "Emerald Gardens", status: "Draft", due: "2026-09-06", priority: "low" },
  { id: "DOC-035", type: "Report", subject: "Q2 Estate Management Summary", estate: "All Estates", status: "Pending Signature", due: "2026-09-10", priority: "medium" },
];

const COMPLIANCE_EVENTS = [
  { date: "2026-09-10", type: "AGM", description: "Palm Court Annual General Meeting", estate: "Palm Court", priority: "high" },
  { date: "2026-09-15", type: "Inspection", description: "Fire safety compliance inspection", estate: "Emerald Gardens", priority: "medium" },
  { date: "2026-09-20", type: "Filing", description: "Q3 Financial Report submission to board", estate: "All Estates", priority: "medium" },
  { date: "2026-09-30", type: "Insurance", description: "Block insurance renewal deadline", estate: "Granite Heights", priority: "high" },
  { date: "2026-10-01", type: "Audit", description: "Annual property valuation audit", estate: "All Estates", priority: "medium" },
];

const DOC_STATUS_STYLE: Record<string, string> = {
  "Draft": "bg-gray-50 text-gray-600 border-gray-200",
  "Pending Signature": "bg-amber-50 text-amber-700 border-amber-200",
  "Ready to Send": "bg-blue-50 text-blue-700 border-blue-200",
  "Sent": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const COMPLIANCE_TYPE_ICON: Record<string, string> = {
  AGM: "🏛", Inspection: "🔍", Filing: "📁", Insurance: "🛡", Audit: "📊",
};

function AdminDashboard({ staffInfo, onNavigate }: DashboardProps) {
  const firstName = (staffInfo.name ?? "Admin").split(" ")[0];

  const pendingApprovals = PENDING_APPROVALS.length;
  const pendingDocs = ADMIN_DOCUMENT_QUEUE.filter((d) => d.status !== "Sent").length;
  const openTickets = SHARED_SUPPORT_TICKETS.filter((t) => ["Open", "In Progress", "Escalated"].includes(t.status)).length;
  const draftDocs = ADMIN_DOCUMENT_QUEUE.filter((d) => d.status === "Draft").length;

  const unassignedTickets = SHARED_SUPPORT_TICKETS.filter((t) => t.status === "Open").slice(0, 4);
  const upcomingCompliance = COMPLIANCE_EVENTS.filter((e) => e.date >= "2026-09-01").slice(0, 5);

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date("2026-09-01").getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="rounded-xl overflow-hidden border border-[#E8EAF0]" style={{ background: "#FAFBFC" }}>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#25205B] text-white">ADMIN</span>
                <span className="text-[10px] font-semibold text-[#69707D]">Estate Administration & Compliance</span>
              </div>
              <h1 className="text-2xl font-semibold text-[#252731] mt-1" style={{ fontFamily: "var(--font-display)" }}>
                Good morning, {firstName}
              </h1>
              <p className="text-[#69707D] text-sm mt-0.5">Administrative overview · Tuesday, 1 September 2026</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {draftDocs > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-700 text-xs font-semibold">{draftDocs} drafts pending</span>
                </div>
              )}
              {pendingApprovals > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EAF2FC] border border-[#6B9FE5]/30 cursor-pointer" onClick={() => onNavigate("procurement")}>
                  <span className="w-2 h-2 rounded-full bg-[#6B9FE5] animate-pulse" />
                  <span className="text-[#25205B] text-xs font-semibold">{pendingApprovals} pending approvals</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Documents Pending" value={pendingDocs.toString()} sub={`${draftDocs} drafts · ${pendingDocs - draftDocs} ready`} color="amber" onClick={() => onNavigate("documents")} />
        <KpiCard label="Pending Approvals" value={pendingApprovals.toString()} sub="Procurement & finance" color="indigo" onClick={() => onNavigate("procurement")} />
        <KpiCard label="Open Support Tickets" value={openTickets.toString()} sub="Unresolved requests" color="neutral" onClick={() => onNavigate("support")} />
        <KpiCard label="Compliance Items" value={upcomingCompliance.length.toString()} sub="Next 30 days" color="red" onClick={() => onNavigate("audit")} />
      </div>

      {/* Document Queue + Compliance Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document & Notice Queue */}
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
            <div>
              <h2 className="text-[#252731] font-semibold text-sm">Document & Notice Queue</h2>
              <p className="text-[#69707D] text-[11px] mt-0.5">Circulars, statements, and letters in progress</p>
            </div>
            <button onClick={() => onNavigate("documents")} className="text-[#6B9FE5] text-xs font-medium hover:underline">Document Centre</button>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {ADMIN_DOCUMENT_QUEUE.map((doc) => (
              <div key={doc.id} className="px-5 py-3.5 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("documents")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-[#6B9FE5] font-semibold">{doc.id}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F0F2F5] text-[#69707D]">{doc.type}</span>
                      {doc.priority === "high" && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Urgent</span>}
                    </div>
                    <div className="text-[#252731] text-[11px] font-medium truncate">{doc.subject}</div>
                    <div className="text-[#69707D] text-[10px] mt-0.5">{doc.estate} · Due {doc.due}</div>
                  </div>
                  <span className={`shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${DOC_STATUS_STYLE[doc.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Calendar */}
        <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
            <div>
              <h2 className="text-[#252731] font-semibold text-sm">Compliance Calendar</h2>
              <p className="text-[#69707D] text-[11px] mt-0.5">Upcoming deadlines and regulatory events</p>
            </div>
            <button onClick={() => onNavigate("audit")} className="text-[#6B9FE5] text-xs font-medium hover:underline">Full calendar</button>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {upcomingCompliance.map((event, i) => {
              const days = daysUntil(event.date);
              const isUrgent = days <= 7;
              return (
                <div key={i} className={`px-5 py-3.5 hover:bg-[#F7F8FA] transition-colors cursor-pointer ${isUrgent ? "border-l-2 border-red-400" : ""}`} onClick={() => onNavigate("audit")}>
                  <div className="flex items-start gap-3">
                    <div className="text-lg shrink-0 mt-0.5">{COMPLIANCE_TYPE_ICON[event.type] ?? "📌"}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[#252731] text-[11px] font-semibold">{event.description}</div>
                        <div className={`shrink-0 ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#EAF2FC] text-[#25205B] border border-[#6B9FE5]/20"}`}>
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                        </div>
                      </div>
                      <div className="text-[#69707D] text-[10px] mt-0.5">{event.estate} · {event.date}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
          <div>
            <h2 className="text-[#252731] font-semibold text-sm">Items Requiring Your Action</h2>
            <p className="text-[#69707D] text-[11px] mt-0.5">Procurement requests, authorizations, and overrides pending Admin sign-off</p>
          </div>
          <button onClick={() => onNavigate("procurement")} className="text-[#6B9FE5] text-xs font-medium hover:underline">Procurement module</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                {["Reference", "Type", "Submitted By", "Amount", "Awaiting"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {PENDING_APPROVALS.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F8FA] cursor-pointer" onClick={() => onNavigate("procurement")}>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#6B9FE5] font-semibold">{item.id}</td>
                  <td className="px-5 py-3 text-xs text-[#252731]">{item.type}</td>
                  <td className="px-5 py-3 text-xs text-[#252731]">{item.requestedBy}</td>
                  <td className="px-5 py-3 text-xs font-bold text-[#252731]">{item.amount ? `₦${item.amount.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-3">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30">{item.awaitingAction}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Ticket Routing Queue */}
      <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAF0] flex items-center justify-between">
          <div>
            <h2 className="text-[#252731] font-semibold text-sm">Support — Tickets Awaiting Assignment</h2>
            <p className="text-[#69707D] text-[11px] mt-0.5">Route new requests to the appropriate team member</p>
          </div>
          <button onClick={() => onNavigate("support")} className="text-[#6B9FE5] text-xs font-medium hover:underline">Support module</button>
        </div>
        {unassignedTickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-[#69707D] text-sm">All open tickets have been assigned.</div>
        ) : (
          <div className="divide-y divide-[#F0F2F5]">
            {unassignedTickets.map((t) => (
              <div key={t.id} className="px-5 py-3.5 hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => onNavigate("support")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-[#6B9FE5] font-semibold">{t.id}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F0F2F5] text-[#69707D] border border-[#E8EAF0]">{t.category}</span>
                    </div>
                    <div className="text-[#252731] text-xs font-medium truncate">{t.subject}</div>
                    <div className="text-[#69707D] text-[10px] mt-0.5">{t.customer} · {t.estate ?? "—"} · {t.created}</div>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">Unassigned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, onClick }: { label: string; value: string; sub: string; color: string; onClick: () => void }) {
  const colorMap: Record<string, { bg: string; accent: string; border: string }> = {
    indigo: { bg: "bg-[#25205B]", accent: "text-white", border: "border-[#312a72]" },
    blue: { bg: "bg-[#EAF2FC]", accent: "text-[#25205B]", border: "border-[#6B9FE5]/30" },
    teal: { bg: "bg-white", accent: "text-[#252731]", border: "border-[#E8EAF0]" },
    gold: { bg: "bg-white", accent: "text-[#252731]", border: "border-[#E8EAF0]" },
    neutral: { bg: "bg-white", accent: "text-[#252731]", border: "border-[#E8EAF0]" },
    amber: { bg: "bg-white", accent: "text-[#252731]", border: "border-[#E8EAF0]" },
    green: { bg: "bg-white", accent: "text-[#252731]", border: "border-[#E8EAF0]" },
    red: { bg: "bg-white", accent: "text-[#252731]", border: "border-[#E8EAF0]" },
  };
  const c = colorMap[color] ?? colorMap.neutral;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-px ${c.bg} ${c.border} group`}
    >
      <div className={`text-xs font-medium mb-2 ${color === "indigo" ? "text-[#6B9FE5]" : "text-[#69707D]"}`}>{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${c.accent} ${color === "indigo" ? "text-white" : "text-[#252731]"}`}>
        {value}
      </div>
      <div className={`text-[11px] mt-1 ${color === "indigo" ? "text-[#6B9FE5]/80" : "text-[#69707D]"}`}>{sub}</div>
    </button>
  );
}
