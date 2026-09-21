import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import { NAGA_STAYS_UNITS, STAYS_BOOKINGS } from "../data/dummy";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { showToast } from "../utils/toast";
import { useCountUp } from "../hooks/useCountUp";
import { exportCSV } from "../utils/csvExport";

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  return `₦${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Upcoming: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Completed: "bg-gray-50 text-gray-600 border-gray-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
    Occupied: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Available: "bg-[#EAF2FC] text-[#25205B] border-[#6B9FE5]/30",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Deposit Paid": "bg-amber-50 text-amber-700 border-amber-200",
    "Deposit Received": "bg-amber-50 text-amber-700 border-amber-200",
    "Awaiting Payment": "bg-red-50 text-red-700 border-red-200",
    Refunded: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

type StaysBooking = typeof STAYS_BOOKINGS[0];

/* ─── BOOKING DETAIL DRAWER ─── */
type ExtendedBooking = StaysBooking & {
  guestPhone?: string; guestEmail?: string;
  nextOfKin?: { name: string; relationship: string; phone: string };
  emergencyContact?: { name: string; relationship: string; phone: string };
  cancelReason?: string;
};

function BookingDrawer({ booking, onClose }: { booking: StaysBooking; onClose: () => void }) {
  const b = booking as ExtendedBooking;
  return (
    <div className="fixed inset-0 z-[200] flex justify-end" style={{ background: "rgba(15,13,46,0.5)", backdropFilter: "blur(6px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[480px] h-full bg-white overflow-y-auto shadow-2xl" style={{ animation: "slideInRight 0.28s cubic-bezier(0.32,0.72,0,1)" }}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <div>
            <div className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{booking.id}</div>
            <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>{booking.unit}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stay dates */}
          <div className="rounded-xl p-4" style={{ background: "#25205B" }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Check-In", value: booking.checkIn },
                { label: "Check-Out", value: booking.checkOut },
                { label: "Duration", value: `${booking.nights} night${booking.nights > 1 ? "s" : ""}` },
              ].map((r) => (
                <div key={r.label}>
                  <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#6B9FE5" }}>{r.label}</div>
                  <div className="font-semibold text-[12px] text-white">{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={b.status} />
            <StatusBadge status={b.paymentStatus} />
          </div>

          {/* Guest details */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Guest Information</div>
            <div className="rounded-xl p-4 space-y-2.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "#25205B", color: "white" }}>
                  {b.guest.split(" ").map((n) => n[0]).join("").slice(-2)}
                </div>
                <div>
                  <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{b.guest}</div>
                  <div className="text-[11px]" style={{ color: "#69707D" }}>{b.location}</div>
                </div>
              </div>
              <div className="h-px" style={{ background: "#E8EAF0" }} />
              {([{ label: "Phone", value: b.guestPhone }, { label: "Email", value: b.guestEmail }] as { label: string; value?: string }[]).filter((r) => r.value).map((r) => (
                <div key={r.label} className="flex items-center justify-between text-[12px]">
                  <span style={{ color: "#69707D" }}>{r.label}</span>
                  <span className="font-semibold" style={{ color: "#252731" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next of Kin */}
          {b.nextOfKin && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Next of Kin</div>
              <div className="rounded-xl p-4 space-y-1.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                {(["name", "relationship", "phone"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between text-[12px]">
                    <span className="capitalize" style={{ color: "#69707D" }}>{k}</span>
                    <span className="font-semibold" style={{ color: "#252731" }}>{b.nextOfKin![k]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency contact */}
          {b.emergencyContact && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Emergency Contact</div>
              <div className="rounded-xl p-4 space-y-1.5" style={{ background: "#FEF9EC", border: "1px solid #fde68a" }}>
                {(["name", "relationship", "phone"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between text-[12px]">
                    <span className="capitalize" style={{ color: "#92400e" }}>{k}</span>
                    <span className="font-semibold" style={{ color: "#252731" }}>{b.emergencyContact![k]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned staff */}
          {b.assignedStaff && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>NAGA Host / Assigned Staff</div>
              <div className="rounded-xl p-4 space-y-1.5" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{b.assignedStaff.name}</div>
                <div className="text-[11px]" style={{ color: "#69707D" }}>{b.assignedStaff.role}</div>
                <div className="text-[12px]" style={{ color: "#25205B" }}>{b.assignedStaff.phone}</div>
                <div className="text-[12px]" style={{ color: "#25205B" }}>{b.assignedStaff.email}</div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>Pricing Breakdown</div>
            <div className="rounded-xl p-4 space-y-2" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              {[
                { label: `₦${(b.nightly / 1_000).toFixed(0)}k × ${b.nights} nights`, value: fmt(b.amount) },
                { label: "Service fee (5%)", value: fmt(b.serviceFee ?? 0) },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-[12px]">
                  <span style={{ color: "#69707D" }}>{r.label}</span>
                  <span className="font-semibold" style={{ color: "#252731" }}>{r.value}</span>
                </div>
              ))}
              <div className="h-px" style={{ background: "#E8EAF0" }} />
              <div className="flex items-center justify-between text-[14px] font-bold">
                <span style={{ color: "#252731" }}>Total</span>
                <span style={{ color: "#25205B" }}>{fmt(b.total)}</span>
              </div>
            </div>
          </div>

          {b.status === "Cancelled" && b.cancelReason && (
            <div className="rounded-xl p-4" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#991b1b" }}>Cancellation Reason</div>
              <div className="text-[12px]" style={{ color: "#7f1d1d" }}>{b.cancelReason}</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:none}}`}</style>
    </div>
  );
}

/* ─── NEW BOOKING MODAL ─── */
function NewBookingModal({ onSave, onClose }: {
  onSave: (b: StaysBooking) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Step 1 — unit + dates
  const [unitId, setUnitId] = useState(NAGA_STAYS_UNITS[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Awaiting Payment");
  // Step 2 — guest info
  const [guest, setGuest] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  // Step 3 — NOK + emergency
  const [nokName, setNokName] = useState("");
  const [nokRel, setNokRel] = useState("");
  const [nokPhone, setNokPhone] = useState("");
  const [emergName, setEmergName] = useState("");
  const [emergRel, setEmergRel] = useState("");
  const [emergPhone, setEmergPhone] = useState("");

  const unit = NAGA_STAYS_UNITS.find((u) => u.id === unitId);
  const nights = checkIn && checkOut ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)) : 0;
  const nightly = unit?.nightly_rate ?? 0;
  const amount = nights * nightly;
  const serviceFee = Math.round(amount * 0.05);
  const total = amount + serviceFee;

  const step1Valid = !!unitId && nights > 0;
  const step2Valid = guest.trim() && guestPhone.trim() && guestEmail.trim();

  const handleSave = () => {
    if (!unit) return;
    const newBooking = {
      id: "BK-" + (Date.now() % 10000).toString().padStart(4, "0"),
      unit: unit.name, unitId: unit.id, guest, guestPhone, guestEmail,
      checkIn, checkOut, nights, nightly, amount, serviceFee, total,
      status: "Upcoming" as const, paymentStatus,
      location: unit.location,
      assignedStaff: null,
      nextOfKin: { name: nokName, relationship: nokRel, phone: nokPhone },
      emergencyContact: { name: emergName, relationship: emergRel, phone: emergPhone },
    };
    onSave(newBooking as unknown as StaysBooking);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(15,13,46,0.7)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[540px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8EAF0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>New NAGA Stays Booking</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-2">
            {[{ n: 1, label: "Unit & Dates" }, { n: 2, label: "Guest Details" }, { n: 3, label: "Emergency Info" }].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-6" style={{ background: step >= s.n ? "#25205B" : "#E8EAF0" }} />}
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: step >= s.n ? "#25205B" : "#F7F8FA", color: step >= s.n ? "white" : "#B0B8C4", border: `1px solid ${step >= s.n ? "#25205B" : "#E8EAF0"}` }}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: step >= s.n ? "#25205B" : "#B0B8C4" }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Select Unit <span style={{ color: "#dc2626" }}>*</span></label>
                <select value={unitId} onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                  {NAGA_STAYS_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.location} (₦{(u.nightly_rate / 1_000).toFixed(0)}k/night)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Check-In <span style={{ color: "#dc2626" }}>*</span></label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Check-Out <span style={{ color: "#dc2626" }}>*</span></label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                </div>
              </div>
              {nights > 0 && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "#25205B" }}>
                  {[
                    { label: `₦${(nightly / 1_000).toFixed(0)}k × ${nights} nights`, value: fmt(amount) },
                    { label: "Service fee (5%)", value: fmt(serviceFee) },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-[11px]">
                      <span style={{ color: "#6B9FE5" }}>{r.label}</span>
                      <span className="font-semibold text-white">{r.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/20 pt-2 flex justify-between">
                    <span className="text-[11px] font-bold text-white">Total</span>
                    <span className="text-[14px] font-bold text-white">{fmt(total)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                  {["Awaiting Payment", "Deposit Paid", "Paid"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Guest Full Name <span style={{ color: "#dc2626" }}>*</span></label>
                <input value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="e.g. Dr. Amina Suleiman"
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Guest Phone <span style={{ color: "#dc2626" }}>*</span></label>
                <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+234 xxx xxx xxxx"
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Guest Email <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="guest@email.com"
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
              </div>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <div className="rounded-xl p-3 text-[11px]" style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}>
                Next of Kin and Emergency Contact details are required for all NAGA Stays bookings for guest safety and communication purposes.
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Next of Kin</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Full Name</label>
                    <input value={nokName} onChange={(e) => setNokName(e.target.value)} placeholder="Full name"
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Relationship</label>
                    <input value={nokRel} onChange={(e) => setNokRel(e.target.value)} placeholder="e.g. Spouse"
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Phone</label>
                    <input value={nokPhone} onChange={(e) => setNokPhone(e.target.value)} placeholder="+234 xxx"
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>Emergency Contact</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Full Name</label>
                    <input value={emergName} onChange={(e) => setEmergName(e.target.value)} placeholder="Full name"
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Relationship</label>
                    <input value={emergRel} onChange={(e) => setEmergRel(e.target.value)} placeholder="e.g. Sibling"
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Phone</label>
                    <input value={emergPhone} onChange={(e) => setEmergPhone(e.target.value)} placeholder="+234 xxx"
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 border-t border-[#E8EAF0] pt-4">
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>← Back</button>
          ) : (
            <button onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>Cancel</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white disabled:opacity-40"
              style={{ background: "#25205B" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSave} className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#25205B" }}>
              Create Booking
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 2_820_000 }, { month: "Feb", revenue: 3_160_000 },
  { month: "Mar", revenue: 2_540_000 }, { month: "Apr", revenue: 3_900_000 },
  { month: "May", revenue: 4_200_000 }, { month: "Jun", revenue: 3_750_000 },
  { month: "Jul", revenue: 4_600_000 }, { month: "Aug", revenue: 3_300_000 },
];

/* ─── BOOKINGS CALENDAR ─── */
function BookingsCalendar({ bookings, onSelectBooking }: { bookings: StaysBooking[]; onSelectBooking: (b: StaysBooking) => void }) {
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const STATUS_DOT: Record<string, string> = {
    Active: "#10b981",
    Upcoming: "#6B9FE5",
    Completed: "#9ca3af",
    Cancelled: "#ef4444",
    Pending: "#f59e0b",
  };

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1);
  // Monday-first: JS getDay() returns 0=Sun, so (getDay()+6)%7 gives Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

  // Map each day of the displayed month to overlapping bookings
  const dayBookingsMap = useMemo(() => {
    const map: Record<string, StaysBooking[]> = {};
    const numDays = new Date(calYear, calMonth + 1, 0).getDate();
    for (let d = 1; d <= numDays; d++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      // A booking spans day ds if checkIn <= ds <= checkOut (YYYY-MM-DD string comparison)
      map[ds] = bookings.filter((b) => b.checkIn <= ds && b.checkOut >= ds);
    }
    return map;
  }, [bookings, calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const getCellDayStr = (idx: number): string | null => {
    const dayNum = idx - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
  };

  const selectedDayBookings = selectedDay ? (dayBookingsMap[selectedDay] ?? []) : [];

  return (
    <div className="p-5">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F8FA] transition-colors"
          style={{ border: "1px solid #E8EAF0", color: "#69707D" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>
          {MONTH_NAMES[calMonth]} {calYear}
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F8FA] transition-colors"
          style={{ border: "1px solid #E8EAF0", color: "#69707D" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide py-1.5" style={{ color: "#69707D" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — gap-px + parent bg creates hairline grid lines */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: "#E8EAF0" }}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const ds = getCellDayStr(idx);
          const dayNum = idx - startOffset + 1;
          const isValid = ds !== null;
          const dayBks = ds ? (dayBookingsMap[ds] ?? []) : [];
          const hasBookings = dayBks.length > 0;
          const isSelected = ds !== null && ds === selectedDay;
          const isToday = ds === todayStr;

          let cellBg = "white";
          if (isSelected) cellBg = "#EAF2FC";
          else if (hasBookings) cellBg = "#FAFBFF";
          else if (!isValid) cellBg = "#FAFAFA";

          return (
            <div
              key={idx}
              onClick={() => { if (isValid && ds) setSelectedDay(isSelected ? null : ds); }}
              className="min-h-[72px] p-2 flex flex-col transition-colors"
              style={{
                background: cellBg,
                cursor: isValid ? "pointer" : "default",
              }}
            >
              {isValid && (
                <>
                  <div
                    className="text-[11px] font-semibold mb-1.5 w-5 h-5 flex items-center justify-center rounded-full leading-none"
                    style={{
                      background: isToday ? "#25205B" : "transparent",
                      color: isToday ? "white" : "#252731",
                    }}
                  >
                    {dayNum}
                  </div>
                  {dayBks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {dayBks.slice(0, 5).map((b) => (
                        <div
                          key={b.id}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: STATUS_DOT[b.status] ?? "#9ca3af" }}
                          title={`${b.guest} — ${b.status}`}
                        />
                      ))}
                      {dayBks.length > 5 && (
                        <span className="text-[8px] leading-none" style={{ color: "#69707D" }}>+{dayBks.length - 5}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { label: "Active", color: "#10b981" },
          { label: "Upcoming", color: "#6B9FE5" },
          { label: "Completed", color: "#9ca3af" },
          { label: "Cancelled", color: "#ef4444" },
          { label: "Pending", color: "#f59e0b" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: "#69707D" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (
        <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}
          >
            <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>
              Bookings on {selectedDay}
              <span className="ml-2 font-normal text-[11px]" style={{ color: "#69707D" }}>
                ({selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? "s" : ""})
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#E8EAF0] transition-colors"
              style={{ color: "#69707D" }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {selectedDayBookings.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px]" style={{ color: "#69707D" }}>
              No bookings fall on this date.
            </div>
          ) : (
            <div className="divide-y divide-[#F0F2F5]">
              {selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#F7F8FA] transition-colors"
                  onClick={() => onSelectBooking(b)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "#25205B", color: "white" }}
                    >
                      {b.guest.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[12px] truncate" style={{ color: "#252731" }}>{b.guest}</div>
                      <div className="text-[10px] truncate" style={{ color: "#69707D" }}>
                        {b.unit} · {b.checkIn} → {b.checkOut}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type StaysSection = "overview" | "units" | "bookings";

const NAV_ITEMS: { id: StaysSection; label: string; icon: ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: "units",
    label: "Units",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 16V7.5L9 2l7 5.5V16" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="6.5" y="10" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 2v3M12.5 2v3M2 7.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M5.5 11h7M5.5 13.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function NagaStays() {
  const [activeSection, setActiveSection] = useState<StaysSection>("overview");
  const [localBookings, setLocalBookings] = useState<StaysBooking[]>(STAYS_BOOKINGS as unknown as StaysBooking[]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<StaysBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [bookingView, setBookingView] = useState<"List" | "Calendar">("List");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; booking: StaysBooking } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  const totalRevenue = NAGA_STAYS_UNITS.reduce((a, u) => a + u.totalRevenue, 0);
  const totalBookings = NAGA_STAYS_UNITS.reduce((a, u) => a + u.totalBookings, 0);
  const displayedBookings = totalBookings + localBookings.filter((b) => b.id.startsWith("BK-") && parseInt(b.id.slice(3)) > 50000).length;
  const activeStays = localBookings.filter((b) => b.status === "Active").length;
  const unitsManaged = NAGA_STAYS_UNITS.length;

  const animatedRevenue = useCountUp(totalRevenue, { duration: 1100 });
  const animatedBookings = useCountUp(displayedBookings, { duration: 1100 });
  const animatedActiveStays = useCountUp(activeStays, { duration: 1100 });
  const animatedUnits = useCountUp(unitsManaged, { duration: 1100 });

  const handleNewBooking = (b: StaysBooking) => {
    setLocalBookings((prev) => [b, ...prev]);
    setShowNewBooking(false);
    showToast(`Booking ${b.id} created for ${b.guest}.`, "success");
  };

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMenu]);

  const filteredBookings = statusFilter === "All" ? localBookings : localBookings.filter((b) => b.status === statusFilter);

  return (
    <div className="flex h-full" style={{ background: "#F7F8FA" }}>
      {showNewBooking && <NewBookingModal onSave={handleNewBooking} onClose={() => setShowNewBooking(false)} />}
      {selectedBooking && <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}

      {ctxMenu && (
        <div
          ref={ctxMenuRef}
          className="fixed bg-white border border-[#E8EAF0] rounded-xl shadow-xl py-1 z-[999] min-w-[180px] text-[12px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-[#F7F8FA] transition-colors text-[#252731]"
            onClick={() => { setSelectedBooking(ctxMenu.booking); setCtxMenu(null); }}
          >
            View Details
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-[#F7F8FA] transition-colors text-[#252731]"
            onClick={() => {
              navigator.clipboard.writeText(ctxMenu.booking.id);
              showToast("Copied", "success");
              setCtxMenu(null);
            }}
          >
            Copy Booking ID
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-[#F7F8FA] transition-colors text-[#252731]"
            onClick={() => {
              const b = ctxMenu.booking;
              exportCSV("naga-stays-bookings",
                ["Booking Ref", "Unit", "Guest", "Check-In", "Check-Out", "Nights", "Amount", "Payment Status", "Status"],
                [[b.id, b.unit, b.guest, b.checkIn, b.checkOut, b.nights, b.amount, b.paymentStatus, b.status]]
              );
              setCtxMenu(null);
            }}
          >
            Export Row
          </button>
          <div className="h-px my-1 bg-[#E8EAF0]" />
          {ctxMenu.booking.status !== "Completed" && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#F7F8FA] transition-colors text-[#252731]"
              onClick={() => {
                setLocalBookings((prev) =>
                  prev.map((bk) => bk.id === ctxMenu.booking.id ? { ...bk, status: "Completed" as const } : bk)
                );
                setCtxMenu(null);
              }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      )}

      {/* ── Persistent sidebar ── */}
      <aside
        className="flex flex-col shrink-0 h-full"
        style={{
          width: "56px",
          background: "white",
          borderRight: "1px solid #E8EAF0",
          transition: "width 0.2s ease",
        }}
        /* Expand to labeled width on md+ via inline media — handled by Tailwind md:w-44 below */
      >
        {/* We use a CSS variable trick: the aside itself stays at 56px on mobile, 176px on md+ */}
        <style>{`
          @media (min-width: 768px) {
            .stays-sidebar { width: 176px !important; }
          }
        `}</style>
        <div className="stays-sidebar flex flex-col h-full" style={{ width: "56px", background: "white" }}>
          {/* Brand strip */}
          <div
            className="flex items-center gap-3 shrink-0 overflow-hidden"
            style={{ height: "60px", padding: "0 16px", borderBottom: "1px solid #E8EAF0" }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: "#25205B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 12L6.5 1L12 12" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M3 8.5h7" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <span
              className="stays-label font-semibold text-[13px] whitespace-nowrap overflow-hidden"
              style={{ color: "#252731", opacity: 0, width: 0, transition: "opacity 0.15s, width 0.2s" }}
            >
              NAGA Stays
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 flex-1 py-3 px-2 overflow-hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  title={item.label}
                  className="flex items-center gap-3 rounded-lg transition-all shrink-0 overflow-hidden"
                  style={{
                    padding: "10px 12px",
                    background: isActive ? "#EAF2FC" : "transparent",
                    color: isActive ? "#25205B" : "#69707D",
                    borderLeft: isActive ? "3px solid #25205B" : "3px solid transparent",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    width: "100%",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = "#F7F8FA";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span className="stays-label overflow-hidden" style={{ opacity: 0, width: 0, transition: "opacity 0.15s, width 0.2s" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* New Booking button */}
          <div className="shrink-0 p-2 overflow-hidden" style={{ borderTop: "1px solid #E8EAF0" }}>
            <button
              onClick={() => setShowNewBooking(true)}
              title="New Booking"
              className="flex items-center gap-2.5 rounded-lg transition-colors overflow-hidden"
              style={{
                background: "#25205B",
                color: "white",
                padding: "10px 12px",
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                width: "100%",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#312a72")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25205B")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="stays-label" style={{ opacity: 0, width: 0, transition: "opacity 0.15s, width 0.2s" }}>
                New Booking
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* CSS to reveal labels on md+ */}
      <style>{`
        @media (min-width: 768px) {
          .stays-label {
            opacity: 1 !important;
            width: auto !important;
          }
        }
      `}</style>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div className="p-4 md:p-6 space-y-6 max-w-[1100px]">

          {/* Page heading */}
          <div>
            <h2 className="text-[#252731] font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
            </h2>
            <p className="text-[#69707D] text-sm mt-0.5">
              {activeSection === "overview" && "Short-let portfolio performance and key metrics"}
              {activeSection === "units" && "Browse and manage your NAGA Stays properties"}
              {activeSection === "bookings" && "View and manage all guest reservations"}
            </p>
          </div>

          {/* ── Overview section ── */}
          {activeSection === "overview" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border px-5 py-4 bg-[#25205B] border-[#312a72]">
                  <div className="text-xs font-medium mb-1 text-[#6B9FE5]">Lifetime Revenue</div>
                  <div className="text-2xl font-bold text-white">{fmt(animatedRevenue)}</div>
                </div>
                <div className="rounded-xl border px-5 py-4 bg-white border-[#E8EAF0]">
                  <div className="text-xs font-medium mb-1 text-[#69707D]">Total Bookings</div>
                  <div className="text-2xl font-bold text-[#252731]">{animatedBookings}</div>
                </div>
                <div className="rounded-xl border px-5 py-4 bg-white border-[#E8EAF0]">
                  <div className="text-xs font-medium mb-1 text-[#69707D]">Active Stays</div>
                  <div className="text-2xl font-bold text-[#252731]">{animatedActiveStays}</div>
                </div>
                <div className="rounded-xl border px-5 py-4 bg-white border-[#E8EAF0]">
                  <div className="text-xs font-medium mb-1 text-[#69707D]">Units Managed</div>
                  <div className="text-2xl font-bold text-[#252731]">{animatedUnits}</div>
                </div>
              </div>

              <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>Monthly Revenue Trend</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>Combined revenue across all NAGA Stays units — 2025</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={MONTHLY_REVENUE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#69707D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => [fmt(Number(v)), "Revenue"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E8EAF0" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#25205B" strokeWidth={2.5} dot={{ r: 3, fill: "#25205B" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Quick-nav cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveSection("units")}
                  className="bg-white border border-[#E8EAF0] rounded-xl p-5 text-left hover:border-[#6B9FE5]/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#EAF2FC", color: "#25205B" }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 16V7.5L9 2l7 5.5V16" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><rect x="6.5" y="10" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" /></svg>
                    </div>
                    <span className="font-semibold text-[13px] text-[#252731]">{unitsManaged} Properties</span>
                  </div>
                  <p className="text-[12px] text-[#69707D]">Browse all managed short-let units and their details.</p>
                  <div className="mt-3 text-[11px] font-semibold text-[#25205B] group-hover:underline">View Units →</div>
                </button>
                <button
                  onClick={() => setActiveSection("bookings")}
                  className="bg-white border border-[#E8EAF0] rounded-xl p-5 text-left hover:border-[#6B9FE5]/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#EAF2FC", color: "#25205B" }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5.5 2v3M12.5 2v3M2 7.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M5.5 11h7M5.5 13.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </div>
                    <span className="font-semibold text-[13px] text-[#252731]">{activeStays} Active Stays</span>
                  </div>
                  <p className="text-[12px] text-[#69707D]">Manage reservations, check-ins, and guest records.</p>
                  <div className="mt-3 text-[11px] font-semibold text-[#25205B] group-hover:underline">View Bookings →</div>
                </button>
              </div>
            </>
          )}

          {/* ── Units section ── */}
          {activeSection === "units" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {NAGA_STAYS_UNITS.map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-[#E8EAF0] rounded-xl overflow-hidden hover:shadow-md hover:border-[#6B9FE5]/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedUnit(selectedUnit === u.id ? null : u.id)}
                >
                  <div className="relative h-52 bg-[#EAF2FC] overflow-hidden">
                    <img src={u.image} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3"><StatusBadge status={u.status} /></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-base" style={{ fontFamily: "var(--font-display)" }}>{u.name}</h3>
                      <p className="text-white/80 text-xs mt-0.5">{u.location} · {u.type}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <div className="text-[#69707D] text-[10px] font-semibold uppercase">Nightly Rate</div>
                        <div className="text-[#25205B] font-bold text-base mt-0.5">{fmt(u.nightly_rate)}</div>
                      </div>
                      <div>
                        <div className="text-[#69707D] text-[10px] font-semibold uppercase">Total Revenue</div>
                        <div className="text-[#252731] font-semibold mt-0.5">{fmt(u.totalRevenue)}</div>
                      </div>
                      <div>
                        <div className="text-[#69707D] text-[10px] font-semibold uppercase">Bookings</div>
                        <div className="text-[#252731] font-semibold mt-0.5">{u.totalBookings}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {u.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="text-[10px] px-2 py-1 bg-[#EAF2FC] text-[#25205B] rounded border border-[#6B9FE5]/20 font-medium">{a}</span>
                      ))}
                      {u.amenities.length > 4 && (
                        <span className="text-[10px] text-[#69707D]">+{u.amenities.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Bookings section ── */}
          {activeSection === "bookings" && (
            <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8EAF0]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-[#252731] font-semibold text-sm">All Bookings</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>
                      {bookingView === "List"
                        ? "Click any row to view full guest details including contacts and emergency info"
                        : "Click a day cell to see its bookings. Dots represent individual reservations."}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-0.5 rounded-full" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                    {(["List", "Calendar"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setBookingView(v)}
                        className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-all"
                        style={{
                          background: bookingView === v ? "#25205B" : "transparent",
                          color: bookingView === v ? "white" : "#69707D",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {bookingView === "List" && (
                  <div className="flex items-center justify-between flex-wrap mt-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {["All", "Active", "Upcoming", "Completed", "Pending", "Cancelled"].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                          className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
                          style={{
                            background: statusFilter === s ? "#25205B" : "#F7F8FA",
                            color: statusFilter === s ? "white" : "#69707D",
                            border: statusFilter === s ? "none" : "1px solid #E8EAF0",
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => exportCSV("naga-stays-bookings",
                        ["Booking Ref", "Unit", "Guest", "Check-In", "Check-Out", "Nights", "Amount", "Payment Status", "Status"],
                        filteredBookings.map((b) => [b.id, b.unit, b.guest, b.checkIn, b.checkOut, b.nights, b.amount, b.paymentStatus, b.status])
                      )}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-[#25205B] hover:bg-[#EAF2FC] transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                )}
              </div>

              {bookingView === "List" ? (
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="bg-[#F7F8FA] border-b border-[#E8EAF0]">
                        {["Booking Ref", "Unit", "Guest", "Check-In", "Check-Out", "Nights", "Amount", "Payment", "Status"].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#69707D] uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                      {filteredBookings.map((bk) => {
                        const bke = bk as ExtendedBooking;
                        return (
                          <tr key={bk.id} className="hover:bg-[#F7F8FA] cursor-pointer transition-colors" onClick={() => setSelectedBooking(bk)} onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, booking: bk }); }}>
                            <td className="px-5 py-3 font-mono text-xs font-semibold text-[#6B9FE5]">{bk.id}</td>
                            <td className="px-5 py-3 text-xs font-medium text-[#252731] max-w-[160px] truncate">{bk.unit}</td>
                            <td className="px-5 py-3">
                              <div className="text-xs text-[#252731]">{bk.guest}</div>
                              {bke.guestPhone && (
                                <div className="text-[10px]" style={{ color: "#B0B8C4" }}>{bke.guestPhone}</div>
                              )}
                            </td>
                            <td className="px-5 py-3 text-xs text-[#69707D]">{bk.checkIn}</td>
                            <td className="px-5 py-3 text-xs text-[#69707D]">{bk.checkOut}</td>
                            <td className="px-5 py-3 text-xs text-[#252731]">{bk.nights}</td>
                            <td className="px-5 py-3 text-sm font-bold text-[#252731]">{fmt(bk.amount)}</td>
                            <td className="px-5 py-3"><StatusBadge status={bk.paymentStatus} /></td>
                            <td className="px-5 py-3"><StatusBadge status={bk.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredBookings.length === 0 && (
                    <div className="px-5 py-10 text-center text-[13px]" style={{ color: "#69707D" }}>No bookings found for this filter.</div>
                  )}
                </div>
              ) : (
                <BookingsCalendar bookings={filteredBookings} onSelectBooking={setSelectedBooking} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
