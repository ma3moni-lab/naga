import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { STAYS_BOOKINGS } from "../data/dummy";
import PaymentModal from "../components/PaymentModal";
import { addSupportTicket, SHARED_SUPPORT_TICKETS, addMessageToTicket } from "../data/supportStore";
import { STAYS_IMAGES, ESTATE_IMAGES } from "@/assets/images";

interface GuestAccount {
  name: string;
  email: string;
}

interface Props {
  onLogout: () => void;
}

const UNITS = [
  {
    id: "NSU-001", name: "Palm Court Premium Suite", location: "GRA, Benin City", type: "3-Bedroom Apartment", floor: "Ground Floor",
    nightly: 125_000, amenities: ["Wi-Fi", "AC", "Smart TV", "Full Kitchen", "Washer & Dryer", "Backup Power", "Parking"],
    img: STAYS_IMAGES.studio[0],
    desc: "A fully furnished 3-bedroom apartment in our GRA Benin City estate. Comfortably laid out with a separate living and dining area, full kitchen and reliable backup power.",
    imgs: STAYS_IMAGES.studio,
  },
  {
    id: "NSU-002", name: "The Gwarimpa Penthouse", location: "Gwarimpa, Abuja", type: "4-Bedroom Penthouse", floor: "Top Floor",
    nightly: 280_000, amenities: ["Wi-Fi", "AC", "Smart TV", "Full Kitchen", "Pool Access", "Rooftop Terrace", "Concierge", "Backup Power", "Gym"],
    img: STAYS_IMAGES.penthouse[0],
    desc: "Our most generous unit. A full-floor penthouse in Gwarimpa with four bedrooms, a wraparound terrace, pool access and a concierge on call.",
    imgs: STAYS_IMAGES.penthouse,
  },
];

type BookingStatus = "Active" | "Upcoming" | "Completed" | "Cancelled" | "Pending";
type PaymentStatus = "Paid" | "Deposit Paid" | "Refunded" | "Awaiting Payment" | "Partial";

type ExtendedBooking = typeof STAYS_BOOKINGS[0] & {
  depositAmount?: number;
  depositPaidDate?: string;
  depositRef?: string;
  depositMethod?: string;
  balanceDue?: number;
};

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, { bg: string; color: string; dot: string }> = {
    Active: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    Upcoming: { bg: "#EAF2FC", color: "#25205B", dot: "#6B9FE5" },
    Completed: { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
    Cancelled: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    Pending: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { bg: string; color: string }> = {
    Paid: { bg: "#dcfce7", color: "#166534" },
    "Deposit Paid": { bg: "#fef3c7", color: "#92400e" },
    Refunded: { bg: "#f3f4f6", color: "#374151" },
    "Awaiting Payment": { bg: "#fee2e2", color: "#991b1b" },
    Partial: { bg: "#fef3c7", color: "#92400e" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>{status}</span>
  );
}

function fmtNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function downloadInvoice(booking: ExtendedBooking, account: GuestAccount) {
  const depositAmt = booking.depositAmount ?? Math.round(booking.total * 0.30);
  const balanceAmt = booking.balanceDue ?? (booking.total - depositAmt);
  const hasDeposit = booking.paymentStatus === "Deposit Paid" || booking.paymentStatus === "Partial";
  const isPaid = booking.paymentStatus === "Paid";
  const today = new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

  const paymentRows = hasDeposit ? `
    <tr style="border-bottom:1px solid #F0F2F5;">
      <td style="padding:10px 0;color:#252731;">30% Deposit — paid ${booking.depositPaidDate ?? today}</td>
      <td style="padding:10px 0;text-align:right;font-weight:600;color:#166534;">${fmtNaira(depositAmt)}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;color:#92400e;font-weight:600;">Balance outstanding (due at check-in · ${booking.checkIn})</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:#92400e;">${fmtNaira(balanceAmt)}</td>
    </tr>` : isPaid ? `
    <tr>
      <td style="padding:10px 0;color:#166534;font-weight:600;">Payment completed</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:#166534;">${fmtNaira(booking.total)}</td>
    </tr>` : `
    <tr>
      <td style="padding:10px 0;color:#991b1b;font-weight:600;">Awaiting payment</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:#991b1b;">${fmtNaira(booking.total)}</td>
    </tr>`;

  const refRow = booking.depositRef ? `<div style="margin-top:4px;font-family:monospace;color:#6B9FE5;font-size:12px;">Ref: ${booking.depositRef}</div>` : "";
  const methodRow = booking.depositMethod ? `<div style="margin-top:2px;color:#69707D;font-size:12px;">via ${booking.depositMethod}</div>` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${booking.id} — NAGA Stays</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,Helvetica,sans-serif;color:#252731;font-size:13px;line-height:1.6;background:white;}
.page{max-width:720px;margin:0 auto;padding:40px 48px;}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #25205B;margin-bottom:32px;}
.brand-name{font-size:20px;font-weight:700;color:#25205B;letter-spacing:-0.3px;}
.brand-sub{font-size:11px;color:#69707D;margin-top:3px;}
.brand-contact{font-size:11px;color:#69707D;margin-top:2px;}
.inv-title{font-size:30px;font-weight:700;color:#25205B;text-align:right;}
.inv-id{font-family:monospace;color:#6B9FE5;font-size:13px;text-align:right;margin-top:4px;}
.inv-date{font-size:11px;color:#69707D;text-align:right;margin-top:2px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:28px;}
.label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#69707D;font-weight:600;margin-bottom:6px;}
.party-name{font-weight:700;font-size:15px;color:#252731;}
.party-detail{color:#69707D;font-size:12px;}
.section{background:#F7F8FA;border-radius:8px;padding:16px;margin-bottom:24px;}
.section-label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#69707D;font-weight:600;margin-bottom:12px;}
.res-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.res-key{font-size:11px;color:#69707D;margin-bottom:3px;}
.res-val{font-weight:600;font-size:13px;}
table{width:100%;border-collapse:collapse;margin-bottom:24px;}
thead th{text-align:left;padding:8px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#69707D;border-bottom:2px solid #E8EAF0;}
thead th.right{text-align:right;}
td{padding:11px 0;border-bottom:1px solid #F0F2F5;color:#252731;vertical-align:top;}
td.right{text-align:right;}
.total-row td{border-bottom:none;font-weight:700;font-size:15px;color:#25205B;padding-top:14px;}
.payment-box{border:1px solid #E8EAF0;border-radius:8px;overflow:hidden;margin-bottom:32px;}
.payment-box-header{background:#F7F8FA;padding:12px 16px;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#69707D;font-weight:600;}
.payment-box-body{padding:16px;}
.status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}
.footer{border-top:1px solid #E8EAF0;padding-top:16px;text-align:center;color:#B0B8C4;font-size:10px;margin-top:16px;}
@media print{body{margin:0;}@page{margin:12mm 15mm;}}</style></head>
<body><div class="page">
<div class="header">
  <div>
    <div class="brand-name">NAGA Properties Ltd</div>
    <div class="brand-sub">NAGA Stays · Short-let &amp; Serviced Apartments</div>
    <div class="brand-contact">stays@nagaproperties.com · +234 800 6242 7829</div>
    <div class="brand-contact" style="margin-top:2px;">RC No. 1234567 · Lagos, Nigeria</div>
  </div>
  <div>
    <div class="inv-title">INVOICE</div>
    <div class="inv-id">${booking.id}</div>
    <div class="inv-date">Issued: ${today}</div>
  </div>
</div>

<div class="grid2">
  <div>
    <div class="label">Bill To</div>
    <div class="party-name">${account.name}</div>
    <div class="party-detail">${account.email}</div>
    <div class="party-detail">NAGA Stays Guest</div>
  </div>
  <div>
    <div class="label">Service Provider</div>
    <div class="party-name">NAGA Properties Ltd</div>
    <div class="party-detail">stays@nagaproperties.com</div>
    <div class="party-detail">+234 800 6242 7829</div>
  </div>
</div>

<div class="section">
  <div class="section-label">Reservation Details</div>
  <div class="res-grid">
    <div><div class="res-key">Unit</div><div class="res-val">${booking.unit}</div></div>
    <div><div class="res-key">Check-in</div><div class="res-val">${booking.checkIn}</div></div>
    <div><div class="res-key">Check-out</div><div class="res-val">${booking.checkOut}</div></div>
    <div><div class="res-key">Duration</div><div class="res-val">${booking.nights} night${booking.nights > 1 ? "s" : ""}</div></div>
  </div>
</div>

<table>
  <thead>
    <tr><th>Description</th><th class="right">Amount</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Accommodation · ${booking.unit}<br><span style="color:#69707D;font-size:11px;">${booking.nights} nights @ ${fmtNaira(booking.nightly)}/night · ${booking.location}</span></td>
      <td class="right" style="font-weight:600;">${fmtNaira(booking.amount)}</td>
    </tr>
    <tr>
      <td>Service fee (5%)</td>
      <td class="right" style="font-weight:600;">${fmtNaira(booking.serviceFee ?? 0)}</td>
    </tr>
    <tr class="total-row">
      <td>Total</td>
      <td class="right">${fmtNaira(booking.total)}</td>
    </tr>
  </tbody>
</table>

<div class="payment-box">
  <div class="payment-box-header">Payment Record</div>
  <div class="payment-box-body">
    <table style="margin-bottom:0;">
      <tbody>${paymentRows}</tbody>
    </table>
    ${booking.depositRef ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #F0F2F5;">${refRow}${methodRow}</div>` : ""}
  </div>
</div>

<div style="background:#EAF2FC;border-radius:8px;padding:14px 16px;font-size:11px;color:#25205B;line-height:1.6;margin-bottom:24px;">
  <strong>Payment Policy:</strong> A non-refundable 30% deposit is required to secure the reservation. The remaining 70% balance is due at check-in. Cancellations made within 48 hours of check-in forfeit the full deposit.
</div>

<div class="footer">
  This invoice was generated by NAGA Stays Guest Portal &nbsp;·&nbsp; NAGA Properties Ltd &nbsp;·&nbsp; stays@nagaproperties.com<br>
  For queries, please quote your booking reference <strong>${booking.id}</strong>
</div>
</div></body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

function BookingCard({ booking, onAction, onPay, onDownloadInvoice }: {
  booking: ExtendedBooking;
  onAction: (action: "cancel" | "change-date", b: ExtendedBooking) => void;
  onPay: (b: ExtendedBooking) => void;
  onDownloadInvoice: (b: ExtendedBooking) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActionable = booking.status === "Upcoming" || booking.status === "Pending";
  const isPaid = booking.paymentStatus === "Paid" || booking.paymentStatus === "Deposit Paid";
  const hasDeposit = booking.paymentStatus === "Deposit Paid" || booking.paymentStatus === "Partial";
  const depositAmt = booking.depositAmount ?? Math.round(booking.total * 0.30);
  const balanceAmt = booking.balanceDue ?? (booking.total - depositAmt);

  const statusIcon: Record<string, string> = { Active: "🏨", Upcoming: "📅", Completed: "✓", Cancelled: "✕", Pending: "⏳" };

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all" style={{ border: "1px solid #E8EAF0", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              {statusIcon[booking.status]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-[10px] font-semibold" style={{ color: "#6B9FE5" }}>{booking.id}</span>
                <BookingStatusBadge status={booking.status as BookingStatus} />
              </div>
              <h3 className="font-semibold text-[15px] leading-tight" style={{ color: "#252731" }}>{booking.unit}</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{booking.location}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-[17px] leading-none" style={{ color: "#25205B" }}>₦{(booking.total / 1_000).toFixed(0)}k</div>
            <div className="mt-1"><PaymentBadge status={booking.paymentStatus as PaymentStatus} /></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Check-in", value: booking.checkIn },
            { label: "Check-out", value: booking.checkOut },
            { label: "Duration", value: `${booking.nights} night${booking.nights > 1 ? "s" : ""}` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-3 py-2.5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>{item.label}</div>
              <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {hasDeposit && booking.paymentStatus !== "Paid" && (
          <div className="mb-4 rounded-xl p-3" style={{ background: "#FEFBF0", border: "1px solid #fde68a" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold" style={{ color: "#92400e" }}>30% deposit paid · balance outstanding</span>
              <span className="text-[10px] font-bold" style={{ color: "#92400e" }}>₦{(balanceAmt / 1_000).toFixed(0)}k left</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#fde68a" }}>
              <div className="h-full rounded-full" style={{ width: "30%", background: "#f59e0b" }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px]" style={{ color: "#b45309" }}>₦{(depositAmt / 1_000).toFixed(0)}k paid</span>
              <span className="text-[9px]" style={{ color: "#b45309" }}>₦{(balanceAmt / 1_000).toFixed(0)}k due at check-in</span>
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between py-2 text-[12px] font-medium" style={{ color: "#6B9FE5" }}>
          <span>{expanded ? "Hide details" : "View full details"}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#F0F2F5]">
          {/* Itinerary Card */}
          {(() => {
            const accessCode = `NGA-${booking.id.slice(-4)}`;
            return (
              <div className="p-5 border-b border-[#F0F2F5]">
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>Your Stay Itinerary</div>

                {/* Check-in / Check-out times */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-3" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                    <div className="text-[9px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#25205B" }}>Check-in</div>
                    <div className="font-bold text-[14px]" style={{ color: "#25205B" }}>{booking.checkIn}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#6B9FE5" }}>From 14:00 (2:00 PM)</div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                    <div className="text-[9px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#69707D" }}>Check-out</div>
                    <div className="font-bold text-[14px]" style={{ color: "#252731" }}>{booking.checkOut}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>By 12:00 noon</div>
                  </div>
                </div>

                {/* Access Code */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#1a1645" }}>
                  <div className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#6B9FE5" }}>Your Access Code</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-[24px] font-bold tracking-[0.12em] text-white">{accessCode}</div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(accessCode); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(107,159,229,0.15)", color: "#6B9FE5", border: "1px solid rgba(107,159,229,0.3)" }}
                      title="Copy access code"
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <rect x="1" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                        <path d="M3 3V2a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Use this code for gate access. Keep it private.</div>
                </div>

                {/* House Rules */}
                <div className="rounded-xl p-4 mb-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                  <div className="text-[9px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>House Rules</div>
                  <div className="space-y-2">
                    {[
                      "No smoking inside the apartment or on balconies",
                      "No parties or events — quiet residential estate",
                      "Quiet hours: 10:00 PM – 8:00 AM",
                      "Respect shared spaces and estate facilities",
                      "Check out by 12:00 noon — late checkout by arrangement only",
                    ].map((rule) => (
                      <div key={rule} className="flex items-start gap-2.5 text-[12px]" style={{ color: "#252731" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                          <circle cx="7" cy="7" r="5.5" stroke="#6B9FE5" strokeWidth="1.1"/>
                          <path d="M4.5 7l1.8 1.8 3-3.6" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                  <div className="px-4 py-2.5" style={{ background: "#FEF2F2", borderBottom: "1px solid #fca5a5" }}>
                    <div className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: "#991b1b" }}>Emergency Contacts</div>
                  </div>
                  <div className="divide-y divide-[#F0F2F5]">
                    {[
                      { label: "Estate Security", number: "+234 803 000 0099" },
                      { label: "Estate Manager", number: "+234 803 000 0010" },
                      { label: "NAGA Support", number: "0800-624-4357" },
                    ].map((c) => (
                      <div key={c.label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[11px]" style={{ color: "#69707D" }}>{c.label}</span>
                        <a href={`tel:${c.number.replace(/[\s-]/g, "")}`} className="font-mono text-[12px] font-semibold" style={{ color: "#25205B" }}>{c.number}</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pricing */}
          <div className="p-5 space-y-2">
            <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>Pricing Breakdown</div>
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "#69707D" }}>₦{(booking.nightly / 1_000).toFixed(0)},000 × {booking.nights} nights</span>
              <span className="font-medium" style={{ color: "#252731" }}>₦{(booking.amount / 1_000).toFixed(0)},000</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "#69707D" }}>Service fee (5%)</span>
              <span className="font-medium" style={{ color: "#252731" }}>₦{((booking.serviceFee ?? 0) / 1_000).toFixed(1)}k</span>
            </div>
            <div className="flex justify-between text-[13px] font-bold pt-2 border-t border-[#F0F2F5]">
              <span style={{ color: "#252731" }}>Total</span>
              <span style={{ color: "#25205B" }}>₦{(booking.total / 1_000).toFixed(0)},000</span>
            </div>
            {hasDeposit && (
              <>
                <div className="flex justify-between text-[12px] pt-1">
                  <span className="flex items-center gap-1.5" style={{ color: "#166534" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                    30% deposit paid
                  </span>
                  <span className="font-semibold" style={{ color: "#166534" }}>− ₦{(depositAmt / 1_000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-[12px] font-semibold">
                  <span style={{ color: "#92400e" }}>Balance outstanding</span>
                  <span style={{ color: "#92400e" }}>₦{(balanceAmt / 1_000).toFixed(0)}k</span>
                </div>
              </>
            )}
          </div>

          {/* Part-payment record */}
          {hasDeposit && (
            <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
                <div className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: "#69707D" }}>Part-Payment Record</div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>Deposit Paid</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>30% Deposit Received</div>
                    {booking.depositPaidDate && (
                      <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>Paid on {booking.depositPaidDate}</div>
                    )}
                    {booking.depositRef && (
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: "#6B9FE5" }}>Ref: {booking.depositRef}</div>
                    )}
                    {booking.depositMethod && (
                      <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>via {booking.depositMethod}</div>
                    )}
                  </div>
                  <div className="text-[16px] font-bold" style={{ color: "#166534" }}>₦{(depositAmt / 1_000).toFixed(0)}k</div>
                </div>

                <div style={{ borderTop: "1px solid #F0F2F5" }} />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>Remaining Balance (70%)</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>Due at check-in · {booking.checkIn}</div>
                  </div>
                  <div className="text-[16px] font-bold" style={{ color: "#92400e" }}>₦{(balanceAmt / 1_000).toFixed(0)}k</div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "#69707D" }}>
                    <span>Payment progress</span>
                    <span>30% of ₦{(booking.total / 1_000).toFixed(0)}k</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8EAF0" }}>
                    <div className="h-full rounded-full" style={{ width: "30%", background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Host */}
          {isPaid && booking.assignedStaff && (
            <div className="mx-5 mb-4 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #EAF2FC 0%, #f0f6ff 100%)", border: "1px solid #D3E3F9" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#25205B" }}>Your NAGA Host</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0" style={{ background: "#25205B", color: "white" }}>
                  {booking.assignedStaff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{booking.assignedStaff.name}</div>
                  <div className="text-[11px]" style={{ color: "#69707D" }}>{booking.assignedStaff.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <a href={`tel:${booking.assignedStaff.phone}`} className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "#25205B" }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2.5C2 7.75 5.25 11 10.5 11l.5-2-2-1-1 1C6.5 8.5 4.5 6.5 4 5l1-1-1-2H2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none" /></svg>
                  {booking.assignedStaff.phone}
                </a>
                <a href={`mailto:${booking.assignedStaff.email}`} className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "#25205B" }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
                  {booking.assignedStaff.email}
                </a>
              </div>
            </div>
          )}

          {booking.status === "Cancelled" && booking.cancelReason && (
            <div className="mx-5 mb-4 p-3 rounded-xl" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#991b1b" }}>Cancellation reason</div>
              <div className="text-[12px]" style={{ color: "#7f1d1d" }}>{booking.cancelReason}</div>
            </div>
          )}

          {booking.paymentStatus === "Deposit Paid" && (
            <div className="px-5 pb-4">
              <button onClick={() => onPay(booking)} className="w-full py-3 text-[13px] font-semibold rounded-xl text-white transition-all hover:opacity-90 flex items-center justify-center gap-2" style={{ background: "#25205B" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.2"/><path d="M1 6h12" stroke="white" strokeWidth="1.2"/><rect x="3" y="8" width="3" height="1.5" rx="0.3" fill="white"/></svg>
                Pay Remaining Balance · ₦{(balanceAmt / 1_000).toFixed(0)}k
              </button>
            </div>
          )}
          {booking.paymentStatus === "Awaiting Payment" && (
            <div className="px-5 pb-4">
              <button onClick={() => onPay(booking)} className="w-full py-3 text-[13px] font-semibold rounded-xl text-white transition-all hover:opacity-90 flex items-center justify-center gap-2" style={{ background: "#25205B" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.2"/><path d="M1 6h12" stroke="white" strokeWidth="1.2"/><rect x="3" y="8" width="3" height="1.5" rx="0.3" fill="white"/></svg>
                Pay in Full
              </button>
            </div>
          )}

          {/* Download invoice */}
          <div className="px-5 pb-4">
            <button
              onClick={() => onDownloadInvoice(booking)}
              className="w-full py-2.5 text-[12px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-[#F7F8FA]"
              style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "#6B9FE5" }}>
                <path d="M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 10v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Download Invoice (PDF)
            </button>
          </div>

          {isActionable && (
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => onAction("change-date", booking)} className="flex-1 py-2.5 text-[12px] font-semibold rounded-xl transition-all hover:bg-[#EAF2FC]" style={{ border: "1.5px solid #D3E3F9", color: "#25205B" }}>
                Change Date
              </button>
              <button onClick={() => onAction("cancel", booking)} className="flex-1 py-2.5 text-[12px] font-semibold rounded-xl transition-all hover:bg-red-50" style={{ border: "1.5px solid #fca5a5", color: "#dc2626" }}>
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CancelModal({ booking, onConfirm, onClose }: { booking: ExtendedBooking; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(15,13,46,0.7)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        <div className="px-4 sm:px-6 py-5 border-b border-[#E8EAF0]">
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Cancel this booking?</h3>
          <p className="text-[12px] mt-1" style={{ color: "#69707D" }}>Booking {booking.id} · {booking.unit}</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #fca5a5" }}>
            <div className="text-[12px] leading-relaxed" style={{ color: "#991b1b" }}>
              If you cancel a confirmed booking, the refund timeline is up to 7 working days. Deposits may be partially retained depending on how close you are to the check-in date.
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>Keep Booking</button>
          <button onClick={onConfirm} className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#dc2626" }}>Yes, Cancel</button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

function ChangeDateModal({ booking, onConfirm, onClose }: { booking: ExtendedBooking; onConfirm: () => void; onClose: () => void }) {
  const [newCheckin, setNewCheckin] = useState(booking.checkIn);
  const [newCheckout, setNewCheckout] = useState(booking.checkOut);
  const [reason, setReason] = useState("");
  const calcN = () => Math.max(0, Math.round((new Date(newCheckout).getTime() - new Date(newCheckin).getTime()) / 86_400_000));

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(15,13,46,0.7)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[440px] overflow-hidden shadow-2xl" style={{ animation: "modalIn 0.25s ease-out" }}>
        <div className="px-4 sm:px-6 py-5 border-b border-[#E8EAF0]">
          <h3 className="font-semibold text-[16px]" style={{ color: "#252731" }}>Request a date change</h3>
          <p className="text-[12px] mt-1" style={{ color: "#69707D" }}>{booking.id} · {booking.unit}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-[11px] rounded-xl p-3 leading-relaxed" style={{ background: "#EAF2FC", color: "#25205B", border: "1px solid #D3E3F9" }}>
            Date changes are subject to availability. Your NAGA host will confirm within 24 hours.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold tracking-wide mb-1.5" style={{ color: "#69707D" }}>New Check-in</label>
              <input type="date" value={newCheckin} onChange={(e) => setNewCheckin(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold tracking-wide mb-1.5" style={{ color: "#69707D" }}>New Check-out</label>
              <input type="date" value={newCheckout} onChange={(e) => setNewCheckout(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
            </div>
          </div>
          {calcN() > 0 && (
            <div className="flex justify-between text-[12px] px-3 py-2 rounded-lg" style={{ background: "#F7F8FA" }}>
              <span style={{ color: "#69707D" }}>New duration</span>
              <span className="font-semibold" style={{ color: "#25205B" }}>{calcN()} night{calcN() > 1 ? "s" : ""} · ₦{((booking.nightly * calcN() * 1.05) / 1_000).toFixed(0)}k total</span>
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-wide mb-1.5" style={{ color: "#69707D" }}>Reason (optional)</label>
            <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let us know why..." className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1.5px solid #E8EAF0", color: "#252731" }}>Cancel</button>
          <button onClick={onConfirm} disabled={calcN() < 1} className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white disabled:opacity-40" style={{ background: "#25205B" }}>Submit Request</button>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

function IconHome() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 6.5L7.5 2l5.5 4.5V13a.75.75 0 01-.75.75H10V9.5H5v4.25H3.25A.75.75 0 012.5 13V6.5z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/></svg>;
}
function IconBrowse() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><rect x="1.5" y="8" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/></svg>;
}
function IconBookings() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1.5v2M10 1.5v2M1.5 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
}
function IconSupport() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 6c0-1.1.9-2 2-2s2 .9 2 2c0 1-.7 1.7-1.5 2V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="7.5" cy="11" r=".6" fill="currentColor"/></svg>;
}
function IconTransactions() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 6.5h12M4.5 9.5h3M4.5 11.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M10 1.5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M9 3.5l1-2 1 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function IconGuide() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5C5.01 1.5 3 3.51 3 6c0 3.75 4.5 7.5 4.5 7.5s4.5-3.75 4.5-7.5c0-2.49-2.01-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><circle cx="7.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1"/></svg>;
}

// ── Blocked-dates helpers ────────────────────────────────────────────────────
function genRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const SEED_BLOCKED: Record<string, string[]> = {
  "NSU-001": [
    ...genRange("2026-09-05", "2026-09-08"),
    ...genRange("2026-09-15", "2026-09-18"),
    ...genRange("2026-10-02", "2026-10-06"),
    ...genRange("2026-10-20", "2026-10-25"),
  ],
  "NSU-002": [
    ...genRange("2026-09-20", "2026-09-23"),
    ...genRange("2026-10-05", "2026-10-10"),
    ...genRange("2026-10-28", "2026-10-31"),
  ],
};

// ── Availability Calendar ────────────────────────────────────────────────────
type AvailCalProps = {
  baseDate: Date;
  blockedSet: Set<string>;
  checkin: string | null;
  checkout: string | null;
  onDateClick: (d: string) => void;
  onClear: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function AvailabilityCalendar({ baseDate, blockedSet, checkin, checkout, onDateClick, onClear, onPrev, onNext }: AvailCalProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const todayStr = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.toISOString().slice(0, 10);
  })();

  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const pad = (n: number) => String(n).padStart(2, "0");

  const calNights =
    checkin && checkout
      ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000)
      : 0;

  function renderMonth(monthDate: Date) {
    const y = monthDate.getFullYear();
    const mo = monthDate.getMonth();
    const firstDow = new Date(y, mo, 1).getDay();
    const daysInMo = new Date(y, mo + 1, 0).getDate();
    const label = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const cells: (number | null)[] = [
      ...Array<null>(firstDow).fill(null),
      ...Array.from({ length: daysInMo }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div key={label} style={{ flex: 1, minWidth: 0 }}>
        <div className="text-center font-semibold text-[14px] mb-4" style={{ color: "#252731" }}>{label}</div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold py-1.5" style={{ color: "#B0B8C4" }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} />;
            const dateStr = `${y}-${pad(mo + 1)}-${pad(day)}`;
            const isPast = dateStr < todayStr;
            const isBlocked = blockedSet.has(dateStr);
            const isStart = dateStr === checkin;
            const isEnd = dateStr === checkout;
            const isRange = !!(checkin && checkout && dateStr > checkin && dateStr < checkout);
            const isAvail = !isPast && !isBlocked;
            const isHov = hovered === dateStr && isAvail;

            let bg = "transparent";
            let color = "#252731";
            let borderRadius = "8px";
            let fontWeight: number | string = 400;

            if (isPast) {
              color = "#D0D4DC";
            } else if (isStart || isEnd) {
              bg = "#D4A843";
              color = "white";
              fontWeight = 700;
              borderRadius = "10px";
            } else if (isRange) {
              bg = "rgba(212,168,67,0.15)";
              color = "#92400e";
              borderRadius = "0";
              fontWeight = 500;
            } else if (isBlocked) {
              bg = "rgba(15,13,46,0.08)";
              color = "#B0B8C4";
            } else if (isHov) {
              bg = "rgba(107,159,229,0.22)";
            } else {
              bg = "rgba(107,159,229,0.09)";
            }

            return (
              <button
                key={dateStr}
                disabled={!isAvail}
                onClick={() => isAvail && onDateClick(dateStr)}
                onMouseEnter={() => isAvail && setHovered(dateStr)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  height: 38,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: bg,
                  color,
                  borderRadius,
                  fontWeight,
                  fontSize: 12,
                  border: "none",
                  cursor: isAvail ? "pointer" : "default",
                  outline: "none",
                  transition: "background 0.1s",
                }}
                title={isBlocked ? "Not available" : isPast ? "" : "Available"}
              >
                {isBlocked ? (
                  <>
                    <span style={{ lineHeight: 1, fontSize: 11 }}>{day}</span>
                    <span style={{ lineHeight: 1, fontSize: 8, marginTop: 1, opacity: 0.45 }}>✕</span>
                  </>
                ) : (
                  day
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const month2 = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);

  return (
    <div>
      {calNights > 0 && (
        <div className="mb-4 px-4 py-2.5 rounded-xl flex items-center gap-3 flex-wrap" style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.28)" }}>
          <span className="font-bold text-[15px]" style={{ color: "#92400e" }}>{calNights} night{calNights > 1 ? "s" : ""} selected</span>
          <span className="text-[12px]" style={{ color: "#b45309" }}>{checkin} → {checkout}</span>
          <button onClick={onClear} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-70" style={{ color: "#92400e" }}>Clear</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrev}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[#EAF2FC]"
          style={{ border: "1px solid #E8EAF0", color: "#25205B" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="text-[12px] font-medium hidden sm:flex items-center gap-2" style={{ color: "#69707D" }}>
          <span>{baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          <span style={{ color: "#D0D4DC" }}>·</span>
          <span>{month2.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </div>
        <button
          onClick={onNext}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[#EAF2FC]"
          style={{ border: "1px solid #E8EAF0", color: "#25205B" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 lg:gap-10">
        {renderMonth(baseDate)}
        {renderMonth(month2)}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-[11px]" style={{ color: "#69707D" }}>
        {[
          { bg: "rgba(107,159,229,0.12)", label: "Available" },
          { bg: "#D4A843", label: "Selected" },
          { bg: "rgba(212,168,67,0.15)", label: "Range" },
          { bg: "rgba(15,13,46,0.08)", label: "Unavailable" },
        ].map(({ bg, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background: bg }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface DepositIntent {
  unit: typeof UNITS[0];
  checkin: string;
  checkout: string;
  nights: number;
  total: number;
  deposit: number;
  balance: number;
}

export default function GuestPortal({ onLogout }: Props) {
  const raw = sessionStorage.getItem("naga_guest");
  const account: GuestAccount = raw ? JSON.parse(raw) : { name: "Amina Suleiman", email: "amina.suleiman@email.com" };

  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [activeTab, setActiveTab] = useState<"home" | "browse" | "bookings" | "transactions" | "support" | "guide">("home");
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !sessionStorage.getItem("naga_guest_onboarded");
  });

  // Support tab state
  const [supportView, setSupportView] = useState<"list" | "thread" | "new">("list");
  const [selectedSupportId, setSelectedSupportId] = useState<string | null>(null);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportCategory, setSupportCategory] = useState("General");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [threadReply, setThreadReply] = useState("");
  const [guestTickets, setGuestTickets] = useState(() =>
    SHARED_SUPPORT_TICKETS.filter(t => t.customerType === "Guest" && t.customer.includes(account.name.split(" ")[1] ?? account.name))
  );

  const refreshGuestTickets = () => {
    setGuestTickets(SHARED_SUPPORT_TICKETS.filter(t => t.customerType === "Guest" && t.customer.includes(account.name.split(" ")[1] ?? account.name)));
  };
  const [selectedUnit, setSelectedUnit] = useState<typeof UNITS[0] | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [bookingFilter, setBookingFilter] = useState<"All" | BookingStatus>("All");
  const [cancelTarget, setCancelTarget] = useState<ExtendedBooking | null>(null);
  const [changeDateTarget, setChangeDateTarget] = useState<ExtendedBooking | null>(null);
  const [payTarget, setPayTarget] = useState<ExtendedBooking | null>(null);
  const [actionDone, setActionDone] = useState<{ type: "cancel" | "change-date" | "paid"; id: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localBookings, setLocalBookings] = useState<any[]>(STAYS_BOOKINGS);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [depositIntent, setDepositIntent] = useState<DepositIntent | null>(null);

  // ── Calendar & new booking flow ──────────────────────────────────────────
  const [calendarBase, setCalendarBase] = useState(() => new Date(2026, 8, 1));
  const [calCheckin, setCalCheckin] = useState<string | null>(null);
  const [calCheckout, setCalCheckout] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<"form" | "confirm" | null>(null);
  const [guestForm, setGuestForm] = useState({ name: account.name, email: account.email, phone: "", guests: "1", special: "" });
  const [confirmRef, setConfirmRef] = useState<string | null>(null);
  const [extraBlockedDates, setExtraBlockedDates] = useState<Record<string, string[]>>({});

  // ── Loyalty discount: returning guests booking a different city get 10% off ──
  const completedCities = localBookings
    .filter((b) => b.status === "Completed")
    .map((b) => (b.location as string).split(",").pop()?.trim() ?? "");
  const isLoyaltyEligible = (unit: typeof UNITS[0]) => {
    if (completedCities.length === 0) return false;
    const unitCity = unit.location.split(",").pop()?.trim() ?? "";
    return completedCities.some((c) => c !== unitCity);
  };
  const LOYALTY_DISCOUNT = 0.10;

  const calcNights = () => {
    if (!checkin || !checkout) return 0;
    return Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000));
  };

  const calcTotals = () => {
    if (!selectedUnit) return { subtotal: 0, discountAmt: 0, fee: 0, total: 0, deposit: 0, balance: 0, loyaltyApplied: false };
    const nights = calcNights();
    const loyaltyApplied = isLoyaltyEligible(selectedUnit);
    const baseSubtotal = selectedUnit.nightly * nights;
    const discountAmt  = loyaltyApplied ? Math.round(baseSubtotal * LOYALTY_DISCOUNT) : 0;
    const subtotal     = baseSubtotal - discountAmt;
    const fee          = Math.round(subtotal * 0.05);
    const total        = subtotal + fee;
    const deposit      = Math.round(total * 0.30);
    return { subtotal: baseSubtotal, discountAmt, fee, total, deposit, balance: total - deposit, loyaltyApplied };
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const nights = calcNights();
    const { total, deposit, balance } = calcTotals();
    setDepositIntent({ unit: selectedUnit, checkin, checkout, nights, total, deposit, balance });
  };
  const loyaltyApplied = selectedUnit ? isLoyaltyEligible(selectedUnit) : false;

  const handleDepositSuccess = (ref: string, method: string) => {
    if (!depositIntent) return;
    const today = new Date().toISOString().slice(0, 10);
    const methodLabel = method === "card" ? "Debit / Credit Card" : method === "transfer" ? "Bank Transfer" : "USSD";
    const newBooking = {
      id: `BK-${Date.now().toString().slice(-6)}`,
      unit: depositIntent.unit.name,
      location: depositIntent.unit.location,
      nightly: depositIntent.unit.nightly,
      checkIn: depositIntent.checkin,
      checkOut: depositIntent.checkout,
      nights: depositIntent.nights,
      amount: depositIntent.unit.nightly * depositIntent.nights,
      serviceFee: Math.round(depositIntent.unit.nightly * depositIntent.nights * 0.05),
      total: depositIntent.total,
      status: "Upcoming",
      paymentStatus: "Deposit Paid",
      depositAmount: depositIntent.deposit,
      depositPaidDate: today,
      depositRef: ref,
      depositMethod: methodLabel,
      balanceDue: depositIntent.balance,
      assignedStaff: null,
      cancelReason: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLocalBookings((prev: any[]) => [newBooking, ...prev]);
    setDepositIntent(null);
    setBookingDone(true);
    setTimeout(() => {
      setBookingDone(false);
      setShowBookingForm(false);
      setSelectedUnit(null);
      setCheckin("");
      setCheckout("");
      setActiveTab("bookings");
    }, 2800);
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    setLocalBookings((prev) => prev.map((b) => b.id === cancelTarget.id ? { ...b, status: "Cancelled", paymentStatus: "Refunded", cancelReason: "Cancelled by guest" } : b));
    setActionDone({ type: "cancel", id: cancelTarget.id });
    setCancelTarget(null);
    setTimeout(() => setActionDone(null), 4000);
  };

  const handleChangeDone = () => {
    if (!changeDateTarget) return;
    setActionDone({ type: "change-date", id: changeDateTarget.id });
    setChangeDateTarget(null);
    setTimeout(() => setActionDone(null), 4000);
  };

  const handlePaymentSuccess = (bookingId: string) => {
    setLocalBookings((prev) => prev.map((b) => b.id === bookingId
      ? { ...b, paymentStatus: "Paid", status: b.status === "Pending" ? "Upcoming" : b.status }
      : b));
    setActionDone({ type: "paid", id: bookingId });
    setPayTarget(null);
    setTimeout(() => setActionDone(null), 4500);
  };

  const switchTab = (id: "home" | "browse" | "bookings" | "transactions" | "support" | "guide") => {
    setActiveTab(id);
    setSelectedUnit(null);
    setShowBookingForm(false);
    setBookingStep(null);
    setCalCheckin(null);
    setCalCheckout(null);
    setConfirmRef(null);
    if (id === "support") { setSupportView("list"); setSelectedSupportId(null); refreshGuestTickets(); }
  };

  const submitGuestSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    addSupportTicket({
      subject: supportSubject,
      customer: account.name,
      customerType: "Guest",
      category: supportCategory as "Booking" | "General" | "Maintenance" | "Billing" | "Access" | "Amenity" | "Escalation",
      priority: "Medium",
      status: "Open",
      created: today,
      lastUpdated: today,
      assignedTo: "Unassigned",
      slaHours: 12,
      ageHours: 0,
      source: "portal",
      messages: [{ from: account.name, role: "Guest", text: supportMessage, timestamp: now }],
    });
    setSupportSubject("");
    setSupportMessage("");
    setSupportCategory("General");
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setSupportView("list");
      refreshGuestTickets();
    }, 2500);
  };

  const submitGuestReply = (ticketId: string) => {
    if (!threadReply.trim()) return;
    const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    addMessageToTicket(ticketId, { from: account.name, role: "Guest", text: threadReply, timestamp: now });
    setThreadReply("");
    refreshGuestTickets();
  };

  const handleDownloadInvoice = (booking: ExtendedBooking) => {
    downloadInvoice(booking, account);
  };

  // ── Calendar handlers ────────────────────────────────────────────────────
  const calNights =
    calCheckin && calCheckout
      ? Math.round((new Date(calCheckout).getTime() - new Date(calCheckin).getTime()) / 86_400_000)
      : 0;

  const getBlockedSet = (unitId: string): Set<string> => {
    const seeded = SEED_BLOCKED[unitId] ?? [];
    const extra = extraBlockedDates[unitId] ?? [];
    return new Set([...seeded, ...extra]);
  };

  const handleCalDateClick = (dateStr: string) => {
    if (!selectedUnit) return;
    if (!calCheckin || calCheckout) {
      setCalCheckin(dateStr);
      setCalCheckout(null);
    } else if (dateStr > calCheckin) {
      const blocked = getBlockedSet(selectedUnit.id);
      const hasBlockedInRange = [...blocked].some(b => b > calCheckin && b < dateStr);
      if (hasBlockedInRange) {
        setCalCheckin(dateStr);
        setCalCheckout(null);
      } else {
        setCalCheckout(dateStr);
      }
    } else {
      setCalCheckin(dateStr);
      setCalCheckout(null);
    }
  };

  const handleCalClear = () => { setCalCheckin(null); setCalCheckout(null); };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !calCheckin || !calCheckout) return;
    const newDates: string[] = [];
    const cur = new Date(calCheckin);
    const end = new Date(calCheckout);
    while (cur < end) {
      newDates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    setExtraBlockedDates(prev => ({
      ...prev,
      [selectedUnit.id]: [...(prev[selectedUnit.id] ?? []), ...newDates],
    }));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const ref = "NBS-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setConfirmRef(ref);
    setBookingStep("confirm");
  };

  const TABS = [
    { id: "home" as const, label: "Home", Icon: IconHome },
    { id: "browse" as const, label: "Browse Units", Icon: IconBrowse },
    { id: "bookings" as const, label: "My Bookings", Icon: IconBookings, count: localBookings.filter((b) => b.status === "Active" || b.status === "Upcoming" || b.status === "Pending").length },
    { id: "transactions" as const, label: "Transactions", Icon: IconTransactions },
    { id: "support" as const, label: "Support", Icon: IconSupport },
    { id: "guide" as const, label: "Area Guide", Icon: IconGuide },
  ];

  const bookingStatuses: (BookingStatus | "All")[] = ["All", "Active", "Upcoming", "Completed", "Cancelled", "Pending"];
  const filteredBookings = bookingFilter === "All" ? localBookings : localBookings.filter((b) => b.status === bookingFilter);
  const { subtotal: fSubtotal, fee: fFee, total: fTotal, deposit: fDeposit, balance: fBalance } = calcTotals();

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ fontFamily: "var(--font-sans)", background: "#F7F8FA" }}>
      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: "rgba(15,13,46,0.97)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm text-center">
            {/* NAGA Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#25205B", border: "1px solid rgba(107,159,229,0.3)" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M3 12L14 3l11 9V25H3V12z" stroke="#6B9FE5" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                  <rect x="9" y="16" width="10" height="9" rx="1" stroke="rgba(107,159,229,0.5)" strokeWidth="1.4" fill="none"/>
                </svg>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-white text-[26px] font-semibold leading-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Welcome to NAGA Stays,<br />{account.name.split(" ")[0]}
            </h1>
            <p className="text-[13px] mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              Here is everything you can do from your guest portal.
            </p>

            {/* Steps */}
            <div className="space-y-3 mb-8 text-left">
              {[
                "View your booking itinerary and access code",
                "Find local restaurants, shops and transport options",
                "Make balance payments or view your invoice",
                "Message our team for anything you need",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5" style={{ background: "#6B9FE5", color: "white" }}>{i + 1}</span>
                  <span className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{step}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                sessionStorage.setItem("naga_guest_onboarded", "1");
                setShowOnboarding(false);
              }}
              className="w-full py-4 text-[15px] font-semibold rounded-2xl text-white transition-opacity hover:opacity-90"
              style={{ background: "#6B9FE5" }}
            >
              {"Let's Go →"}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {cancelTarget && <CancelModal booking={cancelTarget} onConfirm={handleCancel} onClose={() => setCancelTarget(null)} />}
      {changeDateTarget && <ChangeDateModal booking={changeDateTarget} onConfirm={handleChangeDone} onClose={() => setChangeDateTarget(null)} />}
      {payTarget && (
        <PaymentModal
          amount={payTarget.total}
          description={`${payTarget.unit} · ${payTarget.checkIn} → ${payTarget.checkOut}`}
          onSuccess={() => handlePaymentSuccess(payTarget.id)}
          onClose={() => setPayTarget(null)}
        />
      )}
      {depositIntent && (
        <PaymentModal
          amount={depositIntent.deposit}
          description={`30% deposit · ${depositIntent.unit.name} · ${depositIntent.checkin} → ${depositIntent.checkout}`}
          onSuccess={(ref, method) => handleDepositSuccess(ref, method)}
          onClose={() => setDepositIntent(null)}
        />
      )}

      {/* Header */}
      <header className="shrink-0 bg-white flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #E8EAF0", minHeight: 54 }}>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2.5 pr-4 mr-1" style={{ borderRight: "1px solid #E8EAF0" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#25205B" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 5.5L6.5 1.5l5 4V12H1.5V5.5z" stroke="#6B9FE5" strokeWidth="1.1" fill="none"/><rect x="4.5" y="7.5" width="4" height="4.5" rx="0.5" stroke="rgba(107,159,229,0.6)" strokeWidth="0.9" fill="none"/></svg>
            </div>
            <div>
              <div className="text-[12px] font-bold leading-tight" style={{ color: "#25205B" }}>NAGA Stays</div>
              <div className="text-[9px] leading-tight" style={{ color: "#69707D" }}>Guest Portal</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: "#EAF2FC", color: "#25205B" }}>
            {account.name.split(" ")[0][0]}{account.name.split(" ")[1]?.[0] ?? ""}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-[13px] font-semibold" style={{ color: "#252731" }}>{account.name}</div>
            <div className="text-[10px]" style={{ color: "#69707D" }}>NAGA Stays Guest</div>
          </div>
        </div>
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors hover:bg-[#F7F8FA]" style={{ border: "1px solid #E8EAF0" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#25205B", color: "white" }}>
              {account.name.split(" ")[0][0]}
            </div>
            <span className="text-[12px] font-medium hidden sm:inline" style={{ color: "#252731" }}>
              Welcome, <span style={{ color: "#25205B", fontWeight: 700 }}>{account.name.split(" ")[0]}</span>
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#69707D", transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50" style={{ background: "white", boxShadow: "0 8px 24px rgba(37,32,91,0.12)", border: "1px solid #E8EAF0" }}>
              <button onClick={() => { setUserMenuOpen(false); navigate("/"); }} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6B9FE5" }}><path d="M7 1L13 6v7H1V6L7 1z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                <span className="text-[13px]" style={{ color: "#252731" }}>Main Website</span>
              </button>
              <div style={{ borderTop: "1px solid #F0F2F5" }} />
              <button onClick={() => { setUserMenuOpen(false); onLogout(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F5] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#f87171" }}><path d="M5 2H2v10h3M9 10l4-3-4-3M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-[13px]" style={{ color: "#f87171" }}>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Sidebar — lg+ */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 bg-white py-5 px-3" style={{ borderRight: "1px solid #E8EAF0" }}>
          <nav className="flex flex-col gap-0.5 flex-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-all"
                style={{ background: activeTab === t.id ? "#EAF2FC" : "transparent", color: activeTab === t.id ? "#25205B" : "#69707D" }}
              >
                <span className="shrink-0" style={{ color: activeTab === t.id ? "#25205B" : "#B0B8C4" }}><t.Icon /></span>
                <span className="flex-1">{t.label}</span>
                {(t as { count?: number }).count !== undefined && (t as { count?: number }).count! > 0 && (
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25205B", color: "white" }}>
                    {(t as { count?: number }).count}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="pt-4" style={{ borderTop: "1px solid #E8EAF0" }}>
            <button onClick={() => navigate("/")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:bg-[#F7F8FA]" style={{ color: "#69707D" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "#B0B8C4" }}><path d="M6.5 1L12.5 5.5V12H0.5V5.5L6.5 1z" stroke="currentColor" strokeWidth="1.1" fill="none"/></svg>
              Main Website
            </button>
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:bg-red-50 mt-0.5" style={{ color: "#f87171" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 1.5H2v10h2.5M8 9l4-2.5L8 4M12 6.5H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile brand strip */}
          <div className="lg:hidden shrink-0 px-5 py-2.5 flex items-center gap-2" style={{ background: "#25205B" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 7L8 2l6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="#6B9FE5" strokeWidth="1.2" fill="none" /><rect x="5.5" y="9" width="5" height="6" rx="0.5" stroke="rgba(107,159,229,0.6)" strokeWidth="1" fill="none" /></svg>
            <span className="text-white text-[12px] font-semibold tracking-wide">NAGA Stays</span>
            <span className="text-[11px]" style={{ color: "#6B9FE5" }}>· Guest Portal</span>
          </div>

          {/* Mobile tabs */}
          <div className="lg:hidden shrink-0 bg-white" style={{ borderBottom: "1px solid #E8EAF0" }}>
            <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TABS.map((t) => (
                <button key={t.id} onClick={() => switchTab(t.id)}
                  className="px-4 py-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 shrink-0"
                  style={{ borderColor: activeTab === t.id ? "#25205B" : "transparent", color: activeTab === t.id ? "#25205B" : "#69707D" }}>
                  {t.label}
                  {(t as { count?: number }).count !== undefined && (t as { count?: number }).count! > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{(t as { count?: number }).count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toast */}
          {actionDone && (
            <div className="shrink-0 px-5 py-3 text-[12px] font-medium flex items-center gap-2" style={{ background: "#dcfce7", color: "#166534", borderBottom: "1px solid #bbf7d0" }}>
              <span>✓</span>
              {actionDone.type === "cancel"
                ? `Booking ${actionDone.id} cancelled. Refund processed within 7 working days.`
                : actionDone.type === "paid"
                ? `Payment for ${actionDone.id} confirmed. Your NAGA host contact is now available.`
                : `Date change request submitted for ${actionDone.id}. Host will confirm within 24 hours.`}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 lg:p-8 space-y-6">

              {/* ── HOME ── */}
              {activeTab === "home" && !selectedUnit && (
                <>
                  <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: 220 }}>
                    <img src={STAYS_IMAGES.oneBed[0]} alt="NAGA Stays furnished apartment" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(26,22,69,0.92) 50%, rgba(26,22,69,0.35) 100%)" }} />
                    <div className="relative px-8 py-10 flex items-end gap-6 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#6B9FE5" }}>Welcome back</div>
                        <h1 className="text-white text-[28px] font-semibold leading-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
                          {account.name.split(" ")[0]},<br />good to have you.
                        </h1>
                        <p className="text-[13px] mb-5" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 340 }}>Real apartments in buildings we built. Browse, book, and manage everything from here.</p>
                        <button onClick={() => switchTab("browse")} className="px-6 py-3 text-[13px] font-semibold rounded-xl" style={{ background: "#6B9FE5", color: "white" }}>Browse Available Units →</button>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { num: localBookings.filter((b) => b.status === "Active").length, label: "Active stays" },
                          { num: localBookings.filter((b) => b.status === "Upcoming").length, label: "Upcoming" },
                          { num: localBookings.filter((b) => b.paymentStatus === "Deposit Paid").length, label: "Deposits paid" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-2xl px-5 py-4 text-center" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 80 }}>
                            <div className="text-[26px] font-bold text-white leading-none">{s.num}</div>
                            <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {localBookings.filter((b) => b.status === "Active" || b.status === "Upcoming" || b.status === "Pending").length > 0 ? (
                      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-[14px]" style={{ color: "#252731" }}>Current &amp; upcoming stays</h3>
                          <button onClick={() => switchTab("bookings")} className="text-[12px] font-medium" style={{ color: "#6B9FE5" }}>See all →</button>
                        </div>
                        <div className="space-y-3">
                          {localBookings.filter((b) => b.status === "Active" || b.status === "Upcoming" || b.status === "Pending").map((b) => (
                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[13px] truncate" style={{ color: "#252731" }}>{b.unit}</div>
                                <div className="text-[11px]" style={{ color: "#69707D" }}>{b.checkIn} → {b.checkOut}</div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                <BookingStatusBadge status={b.status as BookingStatus} />
                                <PaymentBadge status={b.paymentStatus as PaymentStatus} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="text-4xl mb-3">🛋</div>
                        <div className="font-semibold text-[14px] mb-1" style={{ color: "#252731" }}>No active bookings</div>
                        <div className="text-[12px] mb-4" style={{ color: "#69707D" }}>Browse available units and make your first reservation.</div>
                        <button onClick={() => switchTab("browse")} className="px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>Browse Units</button>
                      </div>
                    )}
                    <div className="space-y-3">
                      {[
                        { icon: "🛋", title: "Fully furnished", desc: "Everything you need is already there — linens, cookware, appliances." },
                        { icon: "🔐", title: "Managed by NAGA", desc: "We built the building. We run the estate. You are in safe hands." },
                        { icon: "📲", title: "Host always reachable", desc: "Your assigned NAGA host is contactable from the moment you book." },
                        { icon: "💳", title: "Flexible payment", desc: "Secure your stay with just a 30% deposit. Pay the balance at check-in." },
                      ].map((f) => (
                        <div key={f.title} className="bg-white rounded-xl p-4 flex items-center gap-4" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="text-xl w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F7F8FA" }}>{f.icon}</div>
                          <div>
                            <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{f.title}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{f.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── BROWSE — Unit listing ── */}
              {activeTab === "browse" && !selectedUnit && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>Available Units</h2>
                    <span className="text-[12px]" style={{ color: "#69707D" }}>{UNITS.length} properties</span>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-5">
                    {UNITS.map((u) => (
                      <div key={u.id} className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="relative h-48 overflow-hidden bg-[#EAF2FC] shrink-0">
                          <img src={u.imgs[activeImgIdx < u.imgs.length ? activeImgIdx : 0]} alt={u.name} className="w-full h-full object-cover" />
                          {u.imgs.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {u.imgs.map((_, i) => (
                                <button key={i} onClick={() => setActiveImgIdx(i)} className="rounded-full transition-all" style={{ background: i === (activeImgIdx < u.imgs.length ? activeImgIdx : 0) ? "white" : "rgba(255,255,255,0.4)", width: i === (activeImgIdx < u.imgs.length ? activeImgIdx : 0) ? "18px" : "6px", height: "6px" }} />
                              ))}
                            </div>
                          )}
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(37,32,91,0.85)", color: "white" }}>
                            {u.type}
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-mono text-[10px]" style={{ color: "#6B9FE5" }}>{u.id}</div>
                                {isLoyaltyEligible(u) && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400e" }}>🌟 10% OFF</span>
                                )}
                              </div>
                              <h3 className="font-semibold text-[16px] leading-tight" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>{u.name}</h3>
                              <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{u.location} · {u.floor}</div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              {isLoyaltyEligible(u) ? (
                                <>
                                  <div className="text-[12px] line-through" style={{ color: "#B0B8C4" }}>₦{(u.nightly / 1_000).toFixed(0)}k</div>
                                  <div className="text-[20px] font-bold" style={{ color: "#25205B" }}>₦{((u.nightly * 0.9) / 1_000).toFixed(0)}k</div>
                                </>
                              ) : (
                                <div className="text-[20px] font-bold" style={{ color: "#25205B" }}>₦{(u.nightly / 1_000).toFixed(0)}k</div>
                              )}
                              <div className="text-[10px]" style={{ color: "#69707D" }}>per night</div>
                            </div>
                          </div>
                          <p className="text-[12px] leading-relaxed my-3 flex-1" style={{ color: "#69707D" }}>{u.desc}</p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {u.amenities.slice(0, 5).map((a) => (<span key={a} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{a}</span>))}
                            {u.amenities.length > 5 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#69707D" }}>+{u.amenities.length - 5} more</span>}
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => { setSelectedUnit(u); setBookingStep(null); setCalCheckin(null); setCalCheckout(null); }} className="px-4 py-2.5 text-[12px] font-medium rounded-xl" style={{ border: "1px solid #E8EAF0", color: "#252731" }}>Details</button>
                            <button onClick={() => { setSelectedUnit(u); setBookingStep(null); setCalCheckin(null); setCalCheckout(null); }} className="flex-1 py-2.5 text-[13px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>Check Availability</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── BROWSE — Unit detail + availability calendar ── */}
              {activeTab === "browse" && selectedUnit && bookingStep === null && (
                <>
                  <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "#6B9FE5" }}>← Back to units</button>

                  {/* Hero */}
                  <div className="rounded-2xl overflow-hidden relative" style={{ height: 260, background: "#EAF2FC" }}>
                    <img src={selectedUnit.imgs[0]} alt={selectedUnit.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />
                    <div className="absolute bottom-5 left-6 right-6">
                      <h2 className="text-white text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{selectedUnit.name}</h2>
                      <div className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{selectedUnit.location} · {selectedUnit.type}</div>
                    </div>
                  </div>

                  {/* Unit info */}
                  <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-mono text-[11px] mb-1" style={{ color: "#6B9FE5" }}>{selectedUnit.id}</div>
                        <div className="text-[13px]" style={{ color: "#69707D" }}>{selectedUnit.location} · {selectedUnit.floor}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[26px] font-bold" style={{ color: "#25205B" }}>₦{(selectedUnit.nightly / 1_000).toFixed(0)}k</div>
                        <div className="text-[11px]" style={{ color: "#69707D" }}>per night</div>
                      </div>
                    </div>
                    <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#69707D" }}>{selectedUnit.desc}</p>
                    <div className="border-t border-[#E8EAF0] pt-4">
                      <div className="text-[11px] uppercase font-semibold tracking-wide mb-3" style={{ color: "#69707D" }}>Included amenities</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedUnit.amenities.map((a) => (<div key={a} className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "#252731" }}><span style={{ color: "#6B9FE5" }}>✓</span>{a}</div>))}
                      </div>
                    </div>
                  </div>

                  {/* Availability Calendar */}
                  <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                    <div className="mb-5">
                      <h3 className="font-semibold text-[17px]" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>Check Availability</h3>
                      <p className="text-[12px] mt-1" style={{ color: "#69707D" }}>Click a date to set check-in, then click another to set check-out.</p>
                    </div>
                    <AvailabilityCalendar
                      baseDate={calendarBase}
                      blockedSet={getBlockedSet(selectedUnit.id)}
                      checkin={calCheckin}
                      checkout={calCheckout}
                      onDateClick={handleCalDateClick}
                      onClear={handleCalClear}
                      onPrev={() => setCalendarBase(new Date(calendarBase.getFullYear(), calendarBase.getMonth() - 1, 1))}
                      onNext={() => setCalendarBase(new Date(calendarBase.getFullYear(), calendarBase.getMonth() + 1, 1))}
                    />
                  </div>

                  {/* Booking summary — appears once both dates selected */}
                  {calCheckin && calCheckout && calNights > 0 && (() => {
                    const hasLoyalty = isLoyaltyEligible(selectedUnit);
                    const base = selectedUnit.nightly * calNights;
                    const discAmt = hasLoyalty ? Math.round(base * LOYALTY_DISCOUNT) : 0;
                    const subtotal = base - discAmt;
                    const svcFee = Math.round(subtotal * 0.05);
                    const vat = Math.round(subtotal * 0.075);
                    const total = subtotal + svcFee + vat;
                    return (
                      <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #25205B 0%, #1b174e 100%)" }}>
                        {hasLoyalty && (
                          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)" }}>
                            <span className="text-[16px]">🌟</span>
                            <div>
                              <div className="text-[11px] font-bold" style={{ color: "#D4A843" }}>Returning Guest Discount — 10% Off</div>
                              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Applied because you have stayed with us in another city</div>
                            </div>
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-widest font-semibold mb-4" style={{ color: "#6B9FE5" }}>Your Booking Summary</div>
                        <div className="grid sm:grid-cols-2 gap-4 mb-5">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Check-in</div>
                            <div className="text-white font-bold text-[16px]">{calCheckin}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>From 14:00 (2 PM)</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Check-out</div>
                            <div className="text-white font-bold text-[16px]">{calCheckout}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>By 12:00 noon</div>
                          </div>
                        </div>
                        <div className="space-y-2 border-t pt-4 mb-5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "rgba(255,255,255,0.5)" }}>₦{(selectedUnit.nightly / 1_000).toFixed(0)}k × {calNights} night{calNights > 1 ? "s" : ""}</span>
                            <span className="font-medium text-white">₦{(base / 1_000).toFixed(0)}k</span>
                          </div>
                          {hasLoyalty && (
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#D4A843" }}>Loyalty discount (10%)</span>
                              <span className="font-medium" style={{ color: "#D4A843" }}>–₦{(discAmt / 1_000).toFixed(1)}k</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "rgba(255,255,255,0.5)" }}>Service charge (5%)</span>
                            <span className="font-medium text-white">₦{(svcFee / 1_000).toFixed(1)}k</span>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "rgba(255,255,255,0.5)" }}>VAT (7.5%)</span>
                            <span className="font-medium text-white">₦{(vat / 1_000).toFixed(1)}k</span>
                          </div>
                          <div className="flex justify-between font-bold text-[15px] pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#D4A843" }}>
                            <span>Total</span>
                            <span>₦{(total / 1_000).toFixed(0)}k</span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setGuestForm(f => ({ ...f, name: account.name, email: account.email })); setBookingStep("form"); }}
                          className="w-full py-4 font-bold text-[14px] rounded-xl transition-opacity hover:opacity-90"
                          style={{ background: "#D4A843", color: "#1a0e00" }}
                        >
                          Book Now — {calNights} night{calNights > 1 ? "s" : ""} · ₦{(total / 1_000).toFixed(0)}k →
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ── BROWSE — Guest details form ── */}
              {activeTab === "browse" && selectedUnit && bookingStep === "form" && (() => {
                const hasLoyalty = isLoyaltyEligible(selectedUnit);
                const base = selectedUnit.nightly * calNights;
                const discAmt = hasLoyalty ? Math.round(base * LOYALTY_DISCOUNT) : 0;
                const subtotal = base - discAmt;
                const svcFee = Math.round(subtotal * 0.05);
                const vat = Math.round(subtotal * 0.075);
                const total = subtotal + svcFee + vat;
                return (
                  <>
                    <button onClick={() => setBookingStep(null)} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "#6B9FE5" }}>← Back to availability</button>
                    <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
                      <form onSubmit={handleConfirmBooking} className="bg-white rounded-2xl p-6 space-y-5" style={{ border: "1px solid #E8EAF0" }}>
                        <div>
                          <div className="font-semibold text-[17px] mb-0.5" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>Complete Your Booking</div>
                          <div className="text-[12px]" style={{ color: "#69707D" }}>{selectedUnit.name} · {selectedUnit.location}</div>
                        </div>

                        {/* Selected dates */}
                        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                          <div>
                            <div className="text-[9px] uppercase font-semibold tracking-wide mb-0.5" style={{ color: "#B0B8C4" }}>Check-in</div>
                            <div className="font-bold text-[13px]" style={{ color: "#252731" }}>{calCheckin}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase font-semibold tracking-wide mb-0.5" style={{ color: "#B0B8C4" }}>Check-out</div>
                            <div className="font-bold text-[13px]" style={{ color: "#252731" }}>{calCheckout}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase font-semibold tracking-wide mb-0.5" style={{ color: "#B0B8C4" }}>Duration</div>
                            <div className="font-bold text-[13px]" style={{ color: "#25205B" }}>{calNights} night{calNights > 1 ? "s" : ""}</div>
                          </div>
                        </div>

                        {/* Guest details */}
                        <div>
                          <div className="text-[11px] uppercase font-semibold tracking-wide mb-3" style={{ color: "#69707D" }}>Guest Details</div>
                          <div className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Full Name *</label>
                                <input required type="text" value={guestForm.name} onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Email Address *</label>
                                <input required type="email" value={guestForm.email} onChange={e => setGuestForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Phone Number *</label>
                                <input required type="tel" value={guestForm.phone} onChange={e => setGuestForm(f => ({ ...f, phone: e.target.value }))} placeholder="+234 ..." className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Number of Guests</label>
                                <select value={guestForm.guests} onChange={e => setGuestForm(f => ({ ...f, guests: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Special Requests <span className="normal-case font-normal">(optional)</span></label>
                              <textarea rows={3} value={guestForm.special} onChange={e => setGuestForm(f => ({ ...f, special: e.target.value }))} placeholder="Early check-in, dietary requirements, parking needs, etc." className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                          </div>
                        </div>

                        {/* Cost breakdown */}
                        {hasLoyalty && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#FEF7E7", border: "1px solid #F5D78A" }}>
                            <span className="text-[16px]">🌟</span>
                            <div>
                              <div className="text-[12px] font-bold" style={{ color: "#92400e" }}>Returning Guest — 10% Loyalty Discount Applied</div>
                              <div className="text-[10.5px]" style={{ color: "#B45309" }}>You have previously stayed with NAGA Stays in another city</div>
                            </div>
                          </div>
                        )}
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold" style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0", color: "#69707D" }}>Cost Breakdown</div>
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#69707D" }}>Accommodation (₦{(selectedUnit.nightly / 1_000).toFixed(0)}k × {calNights} nights)</span>
                              <span className="font-medium" style={{ color: "#252731" }}>₦{(base / 1_000).toFixed(0)}k</span>
                            </div>
                            {hasLoyalty && (
                              <div className="flex justify-between text-[12px]">
                                <span style={{ color: "#B45309" }}>🌟 Loyalty discount (10%)</span>
                                <span className="font-medium" style={{ color: "#B45309" }}>–₦{(discAmt / 1_000).toFixed(1)}k</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#69707D" }}>Service charge (5%)</span>
                              <span className="font-medium" style={{ color: "#252731" }}>₦{(svcFee / 1_000).toFixed(1)}k</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#69707D" }}>VAT (7.5%)</span>
                              <span className="font-medium" style={{ color: "#252731" }}>₦{(vat / 1_000).toFixed(1)}k</span>
                            </div>
                            <div className="flex justify-between text-[14px] font-bold pt-2 border-t border-[#E8EAF0]">
                              <span style={{ color: "#252731" }}>Total</span>
                              <span style={{ color: "#25205B" }}>₦{(total / 1_000).toFixed(0)}k</span>
                            </div>
                          </div>
                        </div>

                        <button type="submit" className="w-full py-4 font-bold text-[14px] rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: "#25205B" }}>
                          Complete Booking →
                        </button>
                      </form>

                      {/* Sidebar summary */}
                      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="h-40 overflow-hidden bg-[#EAF2FC]">
                          <img src={selectedUnit.imgs[0]} alt={selectedUnit.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>{selectedUnit.name}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "#69707D" }}>{selectedUnit.location} · {selectedUnit.type}</div>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "#69707D" }}>Nightly rate</span>
                            <span className="font-bold" style={{ color: "#25205B" }}>₦{(selectedUnit.nightly / 1_000).toFixed(0)}k</span>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "#69707D" }}>Duration</span>
                            <span className="font-bold" style={{ color: "#25205B" }}>{calNights} night{calNights > 1 ? "s" : ""}</span>
                          </div>
                          <div className="rounded-xl p-3 text-[11px] leading-relaxed" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9", color: "#25205B" }}>
                            <div className="font-semibold mb-0.5">Cancellation policy</div>
                            <div>Free cancellation up to 48 hours before check-in. Full amount charged thereafter.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* ── BROWSE — Booking confirmation ── */}
              {activeTab === "browse" && selectedUnit && bookingStep === "confirm" && confirmRef && (() => {
                const subtotal = selectedUnit.nightly * calNights;
                const svcFee = Math.round(subtotal * 0.05);
                const vat = Math.round(subtotal * 0.075);
                const total = subtotal + svcFee + vat;
                return (
                  <div className="max-w-[600px] mx-auto">
                    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EAF0", boxShadow: "0 8px 40px rgba(37,32,91,0.12)" }}>
                      {/* Receipt header */}
                      <div className="px-8 py-7" style={{ background: "linear-gradient(135deg, #0f0d2e 0%, #25205B 100%)" }}>
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(107,159,229,0.2)", border: "1px solid rgba(107,159,229,0.2)" }}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 7L8 2l6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="#6B9FE5" strokeWidth="1.2" fill="none" /><rect x="5" y="9" width="6" height="6" rx="0.5" stroke="rgba(107,159,229,0.6)" strokeWidth="1" fill="none" /></svg>
                            </div>
                            <div>
                              <div className="font-bold text-[13px] text-white">NAGA Stays</div>
                              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Short-let &amp; Serviced Apartments</div>
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#dcfce7" }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5L16 7" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </div>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Booking Reference</div>
                        <div className="font-mono text-[30px] font-bold tracking-widest mb-3" style={{ color: "#D4A843" }}>{confirmRef}</div>
                        <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>A confirmation has been sent to <span style={{ color: "rgba(255,255,255,0.7)" }}>{guestForm.email}</span></div>
                      </div>

                      {/* Body */}
                      <div className="p-6 space-y-5">
                        {/* Unit + dates */}
                        <div className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                          <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#B0B8C4" }}>Reservation Details</div>
                          <div className="font-bold text-[16px] mb-0.5" style={{ color: "#252731" }}>{selectedUnit.name}</div>
                          <div className="text-[12px] mb-4" style={{ color: "#69707D" }}>{selectedUnit.location} · {selectedUnit.type}</div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#B0B8C4" }}>Check-in</div>
                              <div className="font-bold text-[12px]" style={{ color: "#252731" }}>{calCheckin}</div>
                              <div className="text-[10px]" style={{ color: "#69707D" }}>From 14:00</div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#B0B8C4" }}>Check-out</div>
                              <div className="font-bold text-[12px]" style={{ color: "#252731" }}>{calCheckout}</div>
                              <div className="text-[10px]" style={{ color: "#69707D" }}>By 12:00</div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#B0B8C4" }}>Duration</div>
                              <div className="font-bold text-[12px]" style={{ color: "#252731" }}>{calNights} night{calNights > 1 ? "s" : ""}</div>
                              <div className="text-[10px]" style={{ color: "#69707D" }}>{guestForm.guests} guest{parseInt(guestForm.guests) > 1 ? "s" : ""}</div>
                            </div>
                          </div>
                        </div>

                        {/* Guest info */}
                        <div className="rounded-xl p-4" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="text-[10px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#B0B8C4" }}>Guest Information</div>
                          <div className="space-y-2 text-[13px]">
                            <div className="flex justify-between">
                              <span style={{ color: "#69707D" }}>Name</span>
                              <span className="font-semibold" style={{ color: "#252731" }}>{guestForm.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "#69707D" }}>Email</span>
                              <span className="font-semibold" style={{ color: "#252731" }}>{guestForm.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "#69707D" }}>Phone</span>
                              <span className="font-semibold" style={{ color: "#252731" }}>{guestForm.phone}</span>
                            </div>
                            {guestForm.special && (
                              <div className="pt-1 border-t border-[#F0F2F5]">
                                <div className="text-[10px] uppercase font-semibold tracking-wide mb-1" style={{ color: "#B0B8C4" }}>Special Requests</div>
                                <div className="text-[12px]" style={{ color: "#252731" }}>{guestForm.special}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cost breakdown */}
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="px-4 py-2.5 text-[10px] uppercase tracking-wide font-semibold" style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0", color: "#69707D" }}>Payment Summary</div>
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#69707D" }}>Accommodation</span>
                              <span className="font-medium" style={{ color: "#252731" }}>₦{(subtotal / 1_000).toFixed(0)}k</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#69707D" }}>Service charge (5%)</span>
                              <span className="font-medium" style={{ color: "#252731" }}>₦{(svcFee / 1_000).toFixed(1)}k</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                              <span style={{ color: "#69707D" }}>VAT (7.5%)</span>
                              <span className="font-medium" style={{ color: "#252731" }}>₦{(vat / 1_000).toFixed(1)}k</span>
                            </div>
                            <div className="flex justify-between font-bold text-[14px] pt-2 border-t border-[#E8EAF0]">
                              <span style={{ color: "#252731" }}>Total</span>
                              <span style={{ color: "#25205B" }}>₦{(total / 1_000).toFixed(0)}k</span>
                            </div>
                          </div>
                        </div>

                        {/* Check-in notice */}
                        <div className="rounded-xl p-4 flex items-start gap-4" style={{ background: "linear-gradient(135deg, #D4A843 0%, #c89820 100%)" }}>
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v5M7.5 10v1.5" stroke="#92400e" strokeWidth="2" strokeLinecap="round" /></svg>
                          </div>
                          <div>
                            <div className="font-bold text-[13px]" style={{ color: "#1a0e00" }}>Present this reference at check-in</div>
                            <div className="font-mono text-[18px] font-bold mt-1" style={{ color: "#1a0e00" }}>{confirmRef}</div>
                            <div className="text-[11px] mt-1" style={{ color: "rgba(26,14,0,0.55)" }}>Keep this code safe. You will need it to access your apartment.</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button onClick={() => window.print()} className="flex-1 py-3 font-semibold text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-[#EAF2FC]" style={{ border: "1.5px solid #D3E3F9", color: "#25205B" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M4 4V2h6v2M4 8h6M4 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            Print Confirmation
                          </button>
                          <button onClick={() => { setSelectedUnit(null); setBookingStep(null); setCalCheckin(null); setCalCheckout(null); setConfirmRef(null); }} className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: "#25205B" }}>
                            Browse More Units
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── MY BOOKINGS ── */}
              {activeTab === "bookings" && (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>My Bookings</h2>
                    <div className="text-[12px]" style={{ color: "#69707D" }}>{localBookings.length} total</div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {([
                      { status: "Active", count: localBookings.filter((b) => b.status === "Active").length, color: "#166534", bg: "#dcfce7" },
                      { status: "Upcoming", count: localBookings.filter((b) => b.status === "Upcoming").length, color: "#25205B", bg: "#EAF2FC" },
                      { status: "Completed", count: localBookings.filter((b) => b.status === "Completed").length, color: "#374151", bg: "#f3f4f6" },
                      { status: "Pending", count: localBookings.filter((b) => b.status === "Pending").length, color: "#92400e", bg: "#fef3c7" },
                      { status: "Cancelled", count: localBookings.filter((b) => b.status === "Cancelled").length, color: "#991b1b", bg: "#fee2e2" },
                    ] as { status: BookingStatus; count: number; color: string; bg: string }[]).map((s) => (
                      <button key={s.status} onClick={() => setBookingFilter(s.status)} className="rounded-xl p-3 text-left transition-all"
                        style={{ background: bookingFilter === s.status ? s.bg : "white", border: `1.5px solid ${bookingFilter === s.status ? "transparent" : "#E8EAF0"}` }}>
                        <div className="font-bold text-[16px]" style={{ color: bookingFilter === s.status ? s.color : "#252731" }}>{s.count}</div>
                        <div className="text-[10px] font-medium mt-0.5" style={{ color: bookingFilter === s.status ? s.color : "#69707D" }}>{s.status}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {bookingStatuses.map((s) => (
                      <button key={s} onClick={() => setBookingFilter(s)} className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                        style={{ background: bookingFilter === s ? "#25205B" : "#F7F8FA", color: bookingFilter === s ? "white" : "#69707D", border: bookingFilter === s ? "none" : "1px solid #E8EAF0" }}>
                        {s}
                      </button>
                    ))}
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid #E8EAF0" }}>
                      <div className="text-3xl mb-3">🛏️</div>
                      <div className="text-[14px] font-medium" style={{ color: "#252731" }}>No {bookingFilter !== "All" ? bookingFilter.toLowerCase() : ""} bookings</div>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-2 gap-4">
                      {filteredBookings.map((b) => (
                        <BookingCard key={b.id} booking={b as ExtendedBooking}
                          onAction={(action, booking) => {
                            if (action === "cancel") setCancelTarget(booking);
                            else setChangeDateTarget(booking);
                          }}
                          onPay={(booking) => setPayTarget(booking)}
                          onDownloadInvoice={handleDownloadInvoice} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── TRANSACTIONS ── */}
              {activeTab === "transactions" && (() => {
                type TxnRecord = {
                  id: string;
                  bookingId: string;
                  unit: string;
                  date: string;
                  amount: number;
                  method: string;
                  type: string;
                  statusLabel: string;
                  statusColor: string;
                  statusBg: string;
                  booking: ExtendedBooking;
                };

                const txns: TxnRecord[] = [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (localBookings as any[]).forEach((b: ExtendedBooking) => {
                  if (b.paymentStatus === "Awaiting Payment") return;
                  if (b.paymentStatus === "Deposit Paid" || b.paymentStatus === "Partial") {
                    const depAmt = b.depositAmount ?? Math.round(b.total * 0.30);
                    txns.push({
                      id: b.depositRef ?? `DEP-${b.id}`,
                      bookingId: b.id,
                      unit: b.unit,
                      date: b.depositPaidDate ?? b.checkIn,
                      amount: depAmt,
                      method: b.depositMethod ?? "Card",
                      type: "30% Deposit",
                      statusLabel: "Successful",
                      statusColor: "#166534",
                      statusBg: "#dcfce7",
                      booking: b,
                    });
                  } else if (b.paymentStatus === "Paid") {
                    txns.push({
                      id: b.depositRef ?? `PMT-${b.id}`,
                      bookingId: b.id,
                      unit: b.unit,
                      date: b.depositPaidDate ?? b.checkIn,
                      amount: b.total,
                      method: b.depositMethod ?? "Card",
                      type: "Full Payment",
                      statusLabel: "Successful",
                      statusColor: "#166534",
                      statusBg: "#dcfce7",
                      booking: b,
                    });
                  } else if (b.paymentStatus === "Refunded") {
                    txns.push({
                      id: `REF-${b.id}`,
                      bookingId: b.id,
                      unit: b.unit,
                      date: b.checkIn,
                      amount: b.depositAmount ?? Math.round(b.total * 0.30),
                      method: "Original method",
                      type: "Refund",
                      statusLabel: "Refunded",
                      statusColor: "#374151",
                      statusBg: "#f3f4f6",
                      booking: b,
                    });
                  }
                });

                const totalPaid = txns.filter(t => t.statusLabel === "Successful").reduce((s, t) => s + t.amount, 0);

                return (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h2 className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>Transactions</h2>
                      <span className="text-[12px]" style={{ color: "#69707D" }}>{txns.length} record{txns.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: "Total paid", value: fmtNaira(totalPaid), color: "#166534", bg: "#dcfce7" },
                        { label: "Transactions", value: String(txns.length), color: "#25205B", bg: "#EAF2FC" },
                        { label: "Bookings with deposit", value: String(txns.filter(t => t.type === "30% Deposit").length), color: "#92400e", bg: "#fef3c7" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg }}>
                          <div className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</div>
                          <div className="text-[22px] font-bold mt-1 leading-none" style={{ color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {txns.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #E8EAF0" }}>
                        <div className="text-3xl mb-3">🧾</div>
                        <div className="text-[14px] font-medium" style={{ color: "#252731" }}>No transactions yet</div>
                        <div className="text-[12px] mt-1" style={{ color: "#69707D" }}>Payments will appear here once a booking deposit or payment is made.</div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                      <div className="bg-white rounded-2xl overflow-hidden min-w-[640px]" style={{ border: "1px solid #E8EAF0" }}>
                        {/* Table header */}
                        <div className="grid gap-3 px-5 py-3 text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#69707D", background: "#F7F8FA", borderBottom: "1px solid #E8EAF0", gridTemplateColumns: "1fr 1.5fr 80px 90px 80px 90px" }}>
                          <span>Reference</span>
                          <span>Booking / Unit</span>
                          <span>Date</span>
                          <span>Type</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">Actions</span>
                        </div>
                        {txns.map((t, i) => (
                          <div key={t.id} className="grid gap-3 px-5 py-4 items-center" style={{ gridTemplateColumns: "1fr 1.5fr 80px 90px 80px 90px", borderBottom: i < txns.length - 1 ? "1px solid #F0F2F5" : "none" }}>
                            {/* Ref */}
                            <div>
                              <div className="font-mono text-[11px] font-semibold" style={{ color: "#6B9FE5" }}>{t.id}</div>
                              <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{t.method}</div>
                            </div>
                            {/* Unit */}
                            <div>
                              <div className="text-[12px] font-semibold truncate" style={{ color: "#252731" }}>{t.unit}</div>
                              <div className="font-mono text-[10px] mt-0.5" style={{ color: "#69707D" }}>{t.bookingId}</div>
                            </div>
                            {/* Date */}
                            <div className="text-[11px]" style={{ color: "#252731" }}>{t.date}</div>
                            {/* Type badge */}
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: t.statusBg, color: t.statusColor }}>{t.statusLabel}</span>
                              <div className="text-[10px] mt-0.5" style={{ color: "#69707D" }}>{t.type}</div>
                            </div>
                            {/* Amount */}
                            <div className="text-right">
                              <div className="text-[13px] font-bold" style={{ color: t.statusLabel === "Refunded" ? "#374151" : "#252731" }}>
                                {t.statusLabel === "Refunded" ? "−" : "+"}{fmtNaira(t.amount)}
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDownloadInvoice(t.booking)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:bg-[#EAF2FC]"
                                style={{ border: "1px solid #D3E3F9", color: "#25205B" }}
                                title="Download Invoice PDF"
                              >
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                  <path d="M5.5 1v5.5M3.5 5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M1.5 8.5v1a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                </svg>
                                PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    )}

                    {/* Info note */}
                    <div className="rounded-2xl p-4 text-[12px] leading-relaxed" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9", color: "#25205B" }}>
                      <strong>Note:</strong> Click "PDF" on any row to download a full invoice for that booking. Invoices include reservation details, pricing breakdown, and payment status. Contact <a href="mailto:stays@nagaproperties.com" style={{ color: "#6B9FE5" }}>stays@nagaproperties.com</a> for billing queries.
                    </div>
                  </>
                );
              })()}

              {/* ── SUPPORT ── */}
              {activeTab === "support" && (
                <>
                  {/* New ticket form */}
                  {supportView === "new" && (
                    <div className="max-w-[600px]">
                      <button onClick={() => setSupportView("list")} className="flex items-center gap-2 text-[13px] font-medium mb-5" style={{ color: "#6B9FE5" }}>← Back to support</button>
                      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EAF0" }}>
                        {supportSubmitted ? (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-3">✓</div>
                            <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Message sent to support</div>
                            <div className="text-[13px]" style={{ color: "#69707D" }}>Our team will respond within 12 hours. You can track it in your support history.</div>
                          </div>
                        ) : (
                          <form onSubmit={submitGuestSupportTicket} className="space-y-4">
                            <h3 className="font-semibold text-[16px]" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>New Support Message</h3>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Subject</label>
                              <input required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)}
                                placeholder="Brief description of your issue"
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Category</label>
                              <select value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}>
                                {["General", "Booking", "Billing", "Access", "Amenity", "Maintenance"].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Your Message</label>
                              <textarea required rows={5} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Describe your issue or query in detail..."
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                                style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }} />
                            </div>
                            <div className="flex gap-3">
                              <button type="submit" className="flex-1 py-3 font-semibold text-[13px] rounded-xl text-white" style={{ background: "#25205B" }}>Send to Support →</button>
                              <button type="button" onClick={() => setSupportView("list")} className="px-5 py-3 font-semibold text-[13px] rounded-xl" style={{ border: "1px solid #E8EAF0", color: "#69707D" }}>Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thread view */}
                  {supportView === "thread" && (() => {
                    const ticket = guestTickets.find(t => t.id === selectedSupportId);
                    if (!ticket) return null;
                    return (
                      <div className="max-w-[700px]">
                        <button onClick={() => { setSupportView("list"); setSelectedSupportId(null); }} className="flex items-center gap-2 text-[13px] font-medium mb-5" style={{ color: "#6B9FE5" }}>← Back to support</button>
                        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="px-6 py-5" style={{ background: "#1a1645" }}>
                            <div className="text-[#6B9FE5] text-[10px] font-mono font-semibold mb-1">{ticket.id}</div>
                            <h3 className="text-white text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{ticket.subject}</h3>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide" style={{ background: ticket.status === "Resolved" ? "#dcfce7" : ticket.status === "Open" ? "#fef3c7" : "#EAF2FC", color: ticket.status === "Resolved" ? "#166534" : ticket.status === "Open" ? "#92400e" : "#25205B" }}>{ticket.status}</span>
                              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Opened {ticket.created}</span>
                            </div>
                          </div>
                          <div className="divide-y divide-[#F7F8FA]">
                            {ticket.messages.filter(m => !m.internal).map((msg, i) => {
                              const isMe = msg.role === "Guest";
                              const isSystem = msg.role === "System";
                              return (
                                <div key={i} className={`px-5 py-4 ${isSystem ? "bg-[#F7F8FA]" : ""}`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${isMe ? "bg-[#EAF2FC] text-[#25205B]" : isSystem ? "bg-[#E8EAF0] text-[#69707D]" : "bg-[#25205B] text-white"}`}>
                                      {isSystem ? "⚙" : msg.from.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold text-[13px]" style={{ color: "#252731" }}>{isMe ? "You" : msg.from}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#69707D" }}>{msg.role}</span>
                                        <span className="text-[11px]" style={{ color: "#9DA8C0" }}>{msg.timestamp}</span>
                                      </div>
                                      <p className="text-[13px] leading-relaxed" style={{ color: isSystem ? "#9DA8C0" : "#252731" }}>{msg.text}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {ticket.status !== "Closed" && ticket.status !== "Resolved" && (
                            <div className="px-5 py-4 border-t border-[#E8EAF0]" style={{ background: "#FAFBFC" }}>
                              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#69707D" }}>Reply</label>
                              <textarea rows={3} value={threadReply} onChange={(e) => setThreadReply(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                                style={{ border: "1px solid #E8EAF0", background: "white", color: "#252731" }} />
                              <div className="flex justify-end mt-2">
                                <button onClick={() => submitGuestReply(ticket.id)} disabled={!threadReply.trim()}
                                  className="px-4 py-2 text-[13px] font-semibold rounded-xl text-white disabled:opacity-40"
                                  style={{ background: "#25205B" }}>Send Reply →</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ticket list */}
                  {supportView === "list" && (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h2 className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>Guest Support</h2>
                          <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Your messages to the NAGA Stays team</p>
                        </div>
                        <button onClick={() => setSupportView("new")} className="text-[12px] font-semibold px-4 py-2 rounded-lg text-white flex items-center gap-2" style={{ background: "#25205B" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                          New Message
                        </button>
                      </div>

                      <div className="grid lg:grid-cols-3 gap-4 mb-2">
                        {[
                          { icon: "📞", label: "24/7 Guest Line", value: "+234 800 6242 7829" },
                          { icon: "📧", label: "Email Support", value: "stays@nagaproperties.com" },
                          { icon: "💬", label: "WhatsApp", value: "+234 901 234 5678" },
                        ].map((c) => (
                          <div key={c.label} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: "1px solid #E8EAF0" }}>
                            <div className="text-lg w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F7F8FA" }}>{c.icon}</div>
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>{c.label}</div>
                              <div className="font-semibold text-[12px]" style={{ color: "#252731" }}>{c.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {guestTickets.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #E8EAF0" }}>
                          <div className="text-4xl mb-3">💬</div>
                          <div className="font-semibold text-[15px] mb-1" style={{ color: "#252731" }}>No support messages yet</div>
                          <div className="text-[12px] mb-5" style={{ color: "#69707D" }}>Send us a message and our team will get back to you within 12 hours.</div>
                          <button onClick={() => setSupportView("new")} className="px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>Start a Conversation</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {guestTickets.map((t) => (
                            <button key={t.id} onClick={() => { setSelectedSupportId(t.id); setSupportView("thread"); }}
                              className="w-full text-left bg-white rounded-2xl p-5 transition-all hover:shadow-sm"
                              style={{ border: "1px solid #E8EAF0" }}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-[10px] font-semibold mb-1" style={{ color: "#6B9FE5" }}>{t.id}</div>
                                  <div className="font-semibold text-[14px] truncate" style={{ color: "#252731" }}>{t.subject}</div>
                                  <div className="text-[11px] mt-1 truncate" style={{ color: "#69707D" }}>{t.messages[t.messages.length - 1]?.text}</div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase" style={{ background: t.status === "Resolved" ? "#dcfce7" : t.status === "Open" ? "#fef3c7" : "#EAF2FC", color: t.status === "Resolved" ? "#166534" : t.status === "Open" ? "#92400e" : "#25205B", borderColor: "transparent" }}>{t.status}</span>
                                  <div className="text-[10px] mt-1.5" style={{ color: "#B0B8C4" }}>{t.lastUpdated}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2.5">
                                <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "#F7F8FA", color: "#69707D" }}>{t.category}</span>
                                <span className="text-[10px]" style={{ color: "#B0B8C4" }}>{t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}


              {/* ── AREA GUIDE ── */}
              {activeTab === "guide" && (() => {
                const guestCity = localBookings.some((b) => b.location?.includes("Abuja")) ? "abuja" : "benin";
                const cityLabel = guestCity === "abuja" ? "Gwarimpa, Abuja" : "GRA, Benin City";

                const nearbyEssentials = guestCity === "abuja"
                  ? [
                    { icon: "🛒", name: "Jabi Lake Mall", distance: "3.5km drive", note: "Large shopping mall, Shoprite & restaurants" },
                    { icon: "🏥", name: "Garki General Hospital", distance: "4km drive", note: "24-hour emergency ward" },
                    { icon: "🏦", name: "GTBank Gwarimpa", distance: "1km drive", note: "ATM available 24/7" },
                    { icon: "⛽", name: "Conoil Gwarimpa", distance: "400m walk", note: "Petrol & diesel, open daily" },
                    { icon: "🍕", name: "Debonairs Pizza", distance: "0.7km drive", note: "Fast food & delivery available" },
                  ]
                  : [
                    { icon: "🛒", name: "Shoprite Benin", distance: "1.2km drive", note: "Full supermarket, home essentials & groceries" },
                    { icon: "🏥", name: "UBTH Hospital", distance: "0.8km drive", note: "University of Benin Teaching Hospital — A&E unit" },
                    { icon: "🏦", name: "Zenith Bank GRA", distance: "500m walk", note: "Branch & ATM, Mon–Fri 8am–5pm" },
                    { icon: "⛽", name: "NIPCO Station", distance: "300m walk", note: "Nearest fuel station, 24-hour" },
                    { icon: "🍽️", name: "Sky Restaurant & Bar", distance: "200m walk", note: "Nigerian & continental cuisine" },
                  ];

                return (
                  <>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "#252731" }}>Local Area Guide</h2>
                        <p className="text-[12px] mt-0.5" style={{ color: "#69707D" }}>Nearby essentials and useful information for {cityLabel}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>
                        📍 {cityLabel}
                      </span>
                    </div>

                    {/* Nearby Essentials */}
                    <div>
                      <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#69707D" }}>Nearby Essentials</div>
                      <div className="grid lg:grid-cols-2 gap-3">
                        {nearbyEssentials.map((place) => (
                          <div key={place.name} className="bg-white rounded-2xl p-5 flex items-start gap-4" style={{ border: "1px solid #E8EAF0" }}>
                            <div className="text-2xl w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>{place.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{place.name}</div>
                              <div className="text-[11px] font-medium mt-0.5" style={{ color: "#6B9FE5" }}>{place.distance}</div>
                              <div className="text-[11px] mt-1 leading-relaxed" style={{ color: "#69707D" }}>{place.note}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Transport */}
                    <div>
                      <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#69707D" }}>Getting Around</div>
                      <div className="grid lg:grid-cols-2 gap-3">
                        {[
                          { icon: "🚗", title: "Bolt / Uber", detail: "Available in both cities", note: "Recommended for safe, trackable rides" },
                          { icon: "✈️", title: "Nearest Airport", detail: guestCity === "abuja" ? "Nnamdi Azikiwe Intl — 28km" : "Benin Airport — 12km", note: "Allow 45–60 min during peak hours" },
                        ].map((t) => (
                          <div key={t.title} className="bg-white rounded-2xl p-5 flex items-start gap-4" style={{ border: "1px solid #E8EAF0" }}>
                            <div className="text-2xl w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>{t.icon}</div>
                            <div>
                              <div className="font-semibold text-[14px]" style={{ color: "#252731" }}>{t.title}</div>
                              <div className="text-[12px] font-medium mt-0.5" style={{ color: "#25205B" }}>{t.detail}</div>
                              <div className="text-[11px] mt-1" style={{ color: "#69707D" }}>{t.note}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Important Numbers */}
                    <div>
                      <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#69707D" }}>Important Numbers</div>
                      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EAF0" }}>
                        {[
                          { label: "Estate Security", number: "+234 803 000 0099", category: "On-site" },
                          { label: "Estate Manager", number: "+234 803 000 0010", category: "On-site" },
                          { label: "NAGA 24hr Support", number: "0800-624-4357", category: "NAGA" },
                          { label: "Police Emergency", number: "199", category: "Emergency" },
                          { label: "Fire Service", number: "01-555-0199", category: "Emergency" },
                        ].map((c, i) => (
                          <div key={c.label} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: i < 4 ? "1px solid #F0F2F5" : "none" }}>
                            <div>
                              <div className="text-[13px] font-medium" style={{ color: "#252731" }}>{c.label}</div>
                              <div className="text-[10px] mt-0.5" style={{ color: "#B0B8C4" }}>{c.category}</div>
                            </div>
                            <a href={`tel:${c.number.replace(/[\s-]/g, "")}`} className="font-mono text-[13px] font-bold" style={{ color: "#25205B" }}>{c.number}</a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer note */}
                    <div className="rounded-2xl p-4 text-[12px] leading-relaxed" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9", color: "#25205B" }}>
                      <strong>Need help?</strong> Your NAGA host is always reachable. Call estate security at <strong>+234 803 000 0099</strong> for any on-site assistance, day or night.
                    </div>
                  </>
                );
              })()}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
