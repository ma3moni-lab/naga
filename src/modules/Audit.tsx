import { useState } from "react";
import { AUDIT_EVENTS, MATERIAL_REQUESTS } from "../data/dummy";

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(3)}M`;
  return `₦${n.toLocaleString()}`;
}

type AuditView = "list" | "journey";

export default function Audit() {
  const [view, setView] = useState<AuditView>("list");
  const [filter, setFilter] = useState("All");

  const filters = ["All", "NAGA Palm Court", "Granite Heights", "Emerald Gardens"];
  const filtered = filter === "All" ? AUDIT_EVENTS : AUDIT_EVENTS.filter((e) => e.project === filter);

  // The critical MR for the CEO audit journey
  const criticalMR = MATERIAL_REQUESTS[0]; // MR-00245

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Audit & Compliance</h2>
          <p className="text-[#69707D] text-sm mt-0.5">Independent audit trail — every action, every actor, every transaction</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${view === "list" ? "bg-[#25205B] text-white border-[#25205B]" : "bg-white text-[#69707D] border-[#E8EAF0] hover:text-[#252731]"}`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setView("journey")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${view === "journey" ? "bg-[#25205B] text-white border-[#25205B]" : "bg-white text-[#69707D] border-[#E8EAF0] hover:text-[#252731]"}`}
          >
            CEO Audit Journey
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Audit Events", value: "894", sub: "All time" },
          { label: "Transactions Logged", value: "₦584M+", sub: "Financial activity" },
          { label: "Variances Detected", value: "2", sub: "Material variances" },
          { label: "Active Investigations", value: "0", sub: "All resolved" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E8EAF0] rounded-xl px-5 py-4">
            <div className="text-[#69707D] text-xs font-medium">{s.label}</div>
            <div className="text-[#252731] text-xl font-bold mt-1">{s.value}</div>
            <div className="text-[#69707D] text-xs mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {view === "list" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[#69707D] text-xs font-medium">Filter by project:</div>
            <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white text-[#25205B] shadow-sm" : "text-[#69707D] hover:text-[#252731]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EAF0]">
              <h3 className="text-[#252731] font-semibold text-sm">Audit Activity Log</h3>
            </div>
            <div className="divide-y divide-[#F0F2F5]">
              {filtered.map((event, i) => (
                <div key={event.id} className="px-5 py-4 hover:bg-[#F7F8FA] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#EAF2FC] border border-[#6B9FE5]/30 flex items-center justify-center text-[#25205B] text-[10px] font-bold">
                        {event.actor.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {i < filtered.length - 1 && <div className="w-0.5 h-4 bg-[#E8EAF0] mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#252731] font-semibold text-sm">{event.action}</span>
                            <span className="font-mono text-[10px] text-[#6B9FE5] bg-[#EAF2FC] border border-[#6B9FE5]/20 px-1.5 py-0.5 rounded">{event.entity}</span>
                          </div>
                          <div className="text-[#69707D] text-xs mt-0.5">
                            {event.actor} <span className="text-[#25205B]">({event.role})</span> · {event.project}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[#252731] text-xs font-mono font-semibold">{event.date}</div>
                          <div className="text-[#69707D] text-[10px]">{event.time}</div>
                        </div>
                      </div>
                      <p className="text-[#69707D] text-xs mt-1.5 leading-relaxed">{event.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === "journey" && (
        <div className="space-y-5">
          {/* Journey Header */}
          <div className="bg-[#25205B] rounded-xl p-6">
            <div className="text-[#6B9FE5] text-xs font-semibold uppercase tracking-widest mb-2">CEO Audit Journey</div>
            <h3 className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              ₦3,244,000 Material Request — NAGA Palm Court
            </h3>
            <p className="text-[#EAF2FC]/70 text-sm mt-1">
              Complete traceable journey from material request to delivery verification and variance resolution
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#6B9FE5]">
              <span className="bg-white/10 px-3 py-1 rounded-full">MR-00245</span>
              <span>·</span>
              <span>August 14–21, 2025</span>
              <span>·</span>
              <span>PCO → Supervisor → CEO → Finance → Supplier → IVM</span>
            </div>
          </div>

          {/* Journey Steps */}
          <div className="space-y-3">
            {[
              {
                step: 1,
                date: "2025-08-14",
                time: "08:30",
                title: "Material Request Submitted",
                actor: "Abiodun Fashola",
                role: "PCO — NAGA Palm Court",
                detail: "MR-00245 submitted for superstructure materials — Floors 4–6 slab casting. Items: 200T Reinforced Steel (₦2,400,000), 80m³ Ready-Mix Concrete (₦384,000), 50 Rolls Binding Wire (₦460,000). Total: ₦3,244,000.",
                status: "Submitted",
                color: "blue",
              },
              {
                step: 2,
                date: "2025-08-15",
                time: "09:14",
                title: "Supervisor Approval",
                actor: "Chukwuma Eze",
                role: "General Supervisor — Abuja",
                detail: "Quantities verified against Bill of Quantities. All materials confirmed within project scope. Request forwarded to CEO for authorization.",
                note: '"Quantities verified against BOQ."',
                status: "Approved",
                color: "blue",
              },
              {
                step: 3,
                date: "2025-08-16",
                time: "11:02",
                title: "CEO Authorization",
                actor: "Emeka Okonkwo",
                role: "MD / CEO",
                detail: "₦3,244,000 authorized for Palm Court superstructure materials. CEO digital authorization recorded.",
                note: '"Approved. Proceed immediately."',
                status: "Authorized",
                color: "indigo",
              },
              {
                step: 4,
                date: "2025-08-17",
                time: "14:30",
                title: "Finance Disbursement",
                actor: "Lola Adebayo",
                role: "Finance Manager",
                detail: "₦3,244,000 bank transfer to StrongBuild Materials Ltd (GTBank ACC: 3011234567). Transaction reference: TXN-NAG-0082. Disbursement record: DIS-0082.",
                status: "Disbursed",
                color: "purple",
              },
              {
                step: 5,
                date: "2025-08-20",
                time: "13:30",
                title: "Supplier Delivery",
                actor: "StrongBuild Materials Ltd",
                role: "Supplier",
                detail: "Materials delivered to Palm Court site store. Delivery note signed: POD-SB-0091. Items: 195T steel (short by 5T), 80m³ concrete (full), 48 rolls wire (short by 2 rolls).",
                status: "Partial Delivery",
                color: "amber",
              },
              {
                step: 6,
                date: "2025-08-21",
                time: "16:04",
                title: "IVM Verification & Variance Report",
                actor: "Sola Ogunlola",
                role: "Inventory Manager",
                detail: "Physical count confirmed delivery shortfall: 5T steel (₦240,000 value), 2 rolls binding wire (₦18,400 value). Total variance: ₦258,400. Credit note CN-SB-0091 requested from StrongBuild. 6 site photos recorded as evidence.",
                status: "Variance Noted",
                color: "amber",
              },
              {
                step: 7,
                date: "2025-08-21",
                time: "17:22",
                title: "Variance Resolution",
                actor: "StrongBuild Materials Ltd",
                role: "Supplier",
                detail: "Supplier acknowledged shortfall. Credit note CN-SB-0091 for ₦258,400 issued. Remaining materials scheduled for delivery on 2025-08-25.",
                status: "Resolved",
                color: "green",
              },
            ].map((step, i) => (
              <div key={step.step} className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden">
                <div className="flex items-stretch">
                  <div className={`w-1 shrink-0 ${step.color === "indigo" ? "bg-[#25205B]" : step.color === "blue" ? "bg-[#6B9FE5]" : step.color === "purple" ? "bg-purple-400" : step.color === "amber" ? "bg-amber-400" : step.color === "green" ? "bg-emerald-400" : "bg-gray-300"}`} />
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2 ${step.color === "indigo" ? "bg-[#25205B] text-white border-[#25205B]" : step.color === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/40"}`}>
                          {step.step}
                        </div>
                        <div>
                          <h4 className="text-[#252731] font-semibold text-sm">{step.title}</h4>
                          <div className="text-[#69707D] text-xs mt-0.5">{step.actor} · <span className="text-[#25205B] font-medium">{step.role}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${step.color === "indigo" ? "bg-[#25205B] text-white border-[#25205B]" : step.color === "blue" ? "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30" : step.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" : step.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {step.status}
                        </span>
                        <div className="text-right">
                          <div className="text-[#252731] font-mono text-xs font-semibold">{step.date}</div>
                          <div className="text-[#69707D] text-[10px]">{step.time}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#252731] text-sm leading-relaxed">{step.detail}</p>
                    {step.note && (
                      <div className="mt-2 px-3 py-2 bg-[#F7F8FA] border-l-2 border-[#6B9FE5] text-[#69707D] text-xs italic">
                        {step.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Journey Summary */}
          <div className="bg-[#EAF2FC] border border-[#6B9FE5]/30 rounded-xl p-5">
            <h4 className="text-[#25205B] font-semibold text-sm mb-3">Audit Summary — MR-00245</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Amount Requested", value: "₦3,244,000" },
                { label: "Amount Disbursed", value: "₦3,244,000" },
                { label: "Variance Identified", value: "₦258,400" },
                { label: "Resolution", value: "Credit Note Issued" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-lg px-4 py-3 border border-[#6B9FE5]/20">
                  <div className="text-[#69707D] text-[10px] font-semibold uppercase tracking-wide">{s.label}</div>
                  <div className="text-[#25205B] font-bold text-sm mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>
            <p className="text-[#25205B] text-xs mt-3">
              This journey demonstrates full traceability from the PCO's material request through supervisor approval, CEO authorization, finance disbursement, supplier delivery, and IVM verification — including variance detection and resolution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
