import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import pptxgen from "pptxgenjs";
import zsquareLogo from "@/imports/logo.png";
import { GENERAL_IMAGES, ESTATE_IMAGES } from "@/assets/images";

// ── Brand tokens ─────────────────────────────────────────────
const NAVY       = "#0f0d2e";
const NAVY_MID   = "#25205B";
const BLUE       = "#6B9FE5";
const BLUE_LIGHT = "#8eb6ec";
const WHITE      = "#ffffff";
const WHITE_DIM  = "rgba(255,255,255,0.55)";
const WHITE_FAINT= "rgba(255,255,255,0.10)";
const GOLD       = "#D4A843";
const ZS_BLUE    = "#1B8FCC";   // Zsquare brand blue

// ── Slide manifest ───────────────────────────────────────────
interface Slide { id: number; label: string; timing: string; }
const SLIDES: Slide[] = [
  { id: 0, label: "Cover",           timing: "0:30" },
  { id: 1, label: "The Challenge",   timing: "1:20" },
  { id: 2, label: "Our Solution",    timing: "2:10" },
  { id: 3, label: "Architecture",    timing: "3:10" },
  { id: 4, label: "CEO Dashboard",   timing: "4:10" },
  { id: 5, label: "Staff Ops",       timing: "5:10" },
  { id: 6, label: "Resident Portal", timing: "6:10" },
  { id: 7, label: "NAGA Stays",      timing: "7:10" },
  { id: 8, label: "Technology",      timing: "8:00" },
  { id: 9, label: "Business Case",   timing: "9:00" },
  { id: 10, label: "Next Steps",     timing: "10:00" },
];

const SPEAKER_NOTES = [
  "Good morning/afternoon. My name is [Name] from Zsquare Ideal Concepts. Today we want to walk you through a digital platform we have designed specifically for NAGA Property Management. Take a moment to let the title land before moving forward.",
  "These are not hypothetical problems. Every estate manager in Nigeria recognises at least two of these on a daily basis. We want the audience nodding before we offer anything.",
  "The key point here is ONE platform. Not three separate tools, not three separate logins. Everything talks to everything else. Staff actions reflect in resident views. Resident requests feed into staff dashboards.",
  "Every person on this diagram only sees what they need to see. The CEO sees everything. A guest sees only their booking. Nobody can accidentally access data that does not belong to them.",
  "Switch to the live platform now. Navigate to the CEO dashboard. Show the KPI cards first, then point to each chart individually. Real numbers, not dummy data.",
  "Log in as a staff member. Walk through a maintenance request from submission through to closure. Show the Document Centre briefly. The audit trail is the story here.",
  "Log in as Seun Adeleke. Walk the onboarding welcome screen, then submit a maintenance request and show how it tracks through. Create a visitor pass at the end.",
  "This is where it gets interesting. Register a brand new guest account right now, live. Show the booking itinerary that loads immediately. Show the access code. Open the area guide.",
  "If they ask about the database or payments, this is the answer. The structure is already there. Supabase, Paystack and Termii can each be plugged in as the next phase.",
  "Let the numbers do the talking here. Keep commentary short. If they want to discuss return on investment, take it offline after the presentation.",
  "Ask if there are any questions. Keep the live platform open on screen. If they want to explore a specific module, offer to walk them through it now.",
];

// ── Decoration SVGs ──────────────────────────────────────────
const GridDeco = () => (
  <svg style={{ position: "absolute", inset: 0, opacity: 0.025, pointerEvents: "none" }} width="100%" height="100%">
    <defs>
      <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke={BLUE} strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
  </svg>
);

const GeoDeco = () => (
  <svg style={{ position: "absolute", top: 0, right: 0, opacity: 0.04, pointerEvents: "none" }} width="620" height="620" viewBox="0 0 620 620" fill="none">
    <circle cx="450" cy="170" r="260" stroke={BLUE} strokeWidth="1" />
    <circle cx="450" cy="170" r="160" stroke={BLUE} strokeWidth="0.7" />
    <circle cx="450" cy="170" r="80" stroke={BLUE} strokeWidth="0.5" />
    <line x1="190" y1="0" x2="620" y2="430" stroke={BLUE} strokeWidth="0.5" />
  </svg>
);

// ── Utility components ───────────────────────────────────────
const Tag = ({ children, color = BLUE }: { children: string; color?: string }) => (
  <span style={{
    display: "inline-block", padding: "4px 12px", borderRadius: "999px",
    fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const,
    background: `${color}18`, border: `1px solid ${color}35`, color,
    fontFamily: "var(--font-sans)",
  }}>{children}</span>
);

const SlideWrap = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    width: "100%", height: "100%", display: "flex", flexDirection: "column" as const,
    justifyContent: "center", alignItems: "center", padding: "60px 80px",
    position: "relative" as const, overflow: "hidden", ...style,
  }}>
    <GridDeco /><GeoDeco />{children}
  </div>
);

const SlideHead = ({ eyebrow, title, subtitle, align = "left" }: { eyebrow?: string; title: string; subtitle?: string; align?: "left" | "center" }) => (
  <div style={{ marginBottom: "36px", textAlign: align }}>
    {eyebrow && <div style={{ marginBottom: "10px" }}><Tag>{eyebrow}</Tag></div>}
    <h2 style={{ fontSize: "clamp(26px,4vw,46px)", fontFamily: "var(--font-display)", color: WHITE, lineHeight: 1.1, margin: 0, marginBottom: subtitle ? "12px" : 0 }}>{title}</h2>
    {subtitle && <p style={{ fontSize: "15px", color: WHITE_DIM, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>}
  </div>
);

const TwoCol = ({ left, right, gap = "56px" }: { left: React.ReactNode; right: React.ReactNode; gap?: string }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap, width: "100%", maxWidth: "1100px", alignItems: "center" }}>
    <div>{left}</div><div>{right}</div>
  </div>
);

const Stat = ({ value, label, color = BLUE }: { value: string; label: string; color?: string }) => (
  <div style={{ background: WHITE_FAINT, border: `1px solid ${WHITE_FAINT}`, borderRadius: "16px", padding: "22px 16px", textAlign: "center" }}>
    <div style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 700, color, fontFamily: "var(--font-display)", lineHeight: 1, marginBottom: "8px" }}>{value}</div>
    <div style={{ fontSize: "11px", color: WHITE_DIM, letterSpacing: "0.06em", lineHeight: 1.4 }}>{label}</div>
  </div>
);

const FeatureRow = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
    <div style={{ flexShrink: 0, marginTop: "1px" }}>{icon}</div>
    <div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: WHITE, marginBottom: "3px" }}>{title}</div>
      <div style={{ fontSize: "12px", color: WHITE_DIM, lineHeight: 1.5 }}>{desc}</div>
    </div>
  </div>
);

// ── Bright SVG icon set (replaces emoji on dark slides) ──────
const IconDot = ({ color, size = 10 }: { color: string; size?: number }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />
);

const IconOps = ({ color }: { color: string }) => (
  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}18`, border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="8" height="8" rx="2" fill={color} />
      <rect x="12" y="2" width="8" height="8" rx="2" fill={color} fillOpacity="0.55" />
      <rect x="2" y="12" width="8" height="8" rx="2" fill={color} fillOpacity="0.55" />
      <rect x="12" y="12" width="8" height="8" rx="2" fill={color} fillOpacity="0.3" />
    </svg>
  </div>
);

const IconHome = ({ color }: { color: string }) => (
  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}18`, border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L21 9v11H1V9L11 2z" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.4" />
      <path d="M7.5 20v-8h7v8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="9.5" y="7.5" width="3" height="3.5" rx="0.5" fill={color} />
    </svg>
  </div>
);

const IconBed = ({ color }: { color: string }) => (
  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}18`, border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1.5" y="11" width="19" height="7" rx="1.8" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.4" />
      <rect x="3.5" y="7.5" width="6" height="5" rx="1.2" fill={color} fillOpacity="0.55" />
      <rect x="11.5" y="7.5" width="6" height="5" rx="1.2" fill={color} fillOpacity="0.55" />
      <path d="M1.5 11.5V7a1.5 1.5 0 011.5-1.5h16A1.5 1.5 0 0120.5 7v4.5" stroke={color} strokeWidth="1.4" />
    </svg>
  </div>
);

const IconPerson = ({ color }: { color: string }) => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1.5px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="3" stroke={color} strokeWidth="1.4" />
      <path d="M2 16.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  </div>
);

const IconTeam = ({ color }: { color: string }) => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1.5px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="6.5" cy="6" r="2.3" stroke={color} strokeWidth="1.3" />
      <circle cx="12" cy="6" r="2.3" stroke={color} strokeWidth="1.3" />
      <path d="M1 15.5c0-2.5 2.4-4.3 5.5-4.3s5.5 1.8 5.5 4.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12.5 11.4c1.8.3 3.5 1.8 3.5 4.1" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  </div>
);

const IconKey = ({ color }: { color: string }) => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1.5px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="7.5" r="4" stroke={color} strokeWidth="1.3" />
      <path d="M10.5 10.5L16 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 12.5v2.5h2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// ── Zsquare logo component ───────────────────────────────────
const ZsquareBadge = ({ size = 48 }: { size?: number }) => (
  <div style={{ background: "white", borderRadius: 12, padding: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}>
    <img src={zsquareLogo} alt="Zsquare Ideal Concepts" style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  </div>
);

// ── Portal card (slide 3) — now with SVG icons ───────────────
const PortalBox = ({ iconNode, title, sub, items, color }: {
  iconNode: React.ReactNode; title: string; sub: string; items: string[]; color: string;
}) => (
  <div style={{ background: WHITE_FAINT, border: `1px solid ${color}28`, borderRadius: "20px", padding: "26px", flex: 1 }}>
    <div style={{ marginBottom: "14px" }}>{iconNode}</div>
    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color, marginBottom: "6px", textTransform: "uppercase" as const }}>{sub}</div>
    <div style={{ fontSize: "17px", fontWeight: 600, color: WHITE, marginBottom: "14px", fontFamily: "var(--font-display)" }}>{title}</div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" as const, gap: "8px" }}>
      {items.map(i => (
        <li key={i} style={{ fontSize: "12px", color: WHITE_DIM, display: "flex", alignItems: "center", gap: "9px" }}>
          <IconDot color={color} size={5} />{i}
        </li>
      ))}
    </ul>
  </div>
);

// ═══════════════════════════════════════════════════════════
// SLIDES
// ═══════════════════════════════════════════════════════════

function CoverSlide() {
  return (
    <SlideWrap>
      {/* Real building photo as subtle backdrop */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img src={ESTATE_IMAGES.granite[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.07 }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "820px" }}>
        {/* Presenter */}
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "10px", marginBottom: "36px" }}>
          <ZsquareBadge size={52} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, letterSpacing: "0.08em" }}>Zsquare Ideal Concepts Ltd</div>
            <div style={{ fontSize: "11px", color: WHITE_DIM, marginTop: "2px" }}>Digital Solutions & Technology Consulting</div>
          </div>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <Tag color={ZS_BLUE}>Proposal · August 2026</Tag>
        </div>

        <h1 style={{
          fontSize: "clamp(38px,6.5vw,72px)", fontFamily: "var(--font-display)", color: WHITE,
          lineHeight: 1.05, margin: "0 0 18px 0", letterSpacing: "-0.01em",
        }}>
          NAGA Property Platform
        </h1>

        <p style={{ fontSize: "clamp(14px,1.8vw,18px)", color: WHITE_DIM, lineHeight: 1.65, margin: "0 0 32px 0", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
          A complete digital management ecosystem for NAGA's estate operations, resident experience, and NAGA Stays short-let portfolio — proposed by Zsquare.
        </p>

        {/* Prepared for */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "10px 20px", borderRadius: "999px", background: WHITE_FAINT, border: "1px solid rgba(255,255,255,0.12)" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect width="18" height="18" rx="4" fill={`${BLUE}20`} />
            <path d="M9 2.5L16 7v8H2V7L9 2.5z" stroke={BLUE} strokeWidth="1.2" fill="none" />
            <rect x="6.5" y="8" width="5" height="5.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </svg>
          <span style={{ fontSize: "12px", color: WHITE_DIM }}>Prepared for</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: WHITE }}>NAGA Property Management</span>
        </div>

        <div style={{ marginTop: "28px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" as const }}>
          {["Palm Estate", "Sapphire Court", "Emerald Gardens", "Granite Heights"].map(e => (
            <span key={e} style={{ padding: "5px 12px", borderRadius: "999px", fontSize: "11px", background: WHITE_FAINT, border: "1px solid rgba(255,255,255,0.08)", color: WHITE_DIM }}>{e}</span>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, ${ZS_BLUE}, ${BLUE}, transparent)`, opacity: 0.6 }} />
    </SlideWrap>
  );
}

function ProblemSlide() {
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <SlideHead eyebrow="The Challenge" title="Premium properties. Legacy operations." subtitle="Nigeria's high-end real estate market has outgrown its management tools." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
          {[
            { n: "01", title: "Fragmented Communications", desc: "Maintenance requests, payments, and notices scattered across WhatsApp, email, and phone calls — no audit trail, no accountability." },
            { n: "02", title: "No Self-Service for Residents", desc: "Owners and tenants can't track their service charges, raise requests, or receive estate notices without calling the office." },
            { n: "03", title: "Short-Let Brand Gap", desc: "NAGA Stays guests have no branded digital experience — no booking portal, no check-in instructions, no area guide. Just a phone number." },
          ].map(p => (
            <div key={p.n} style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(239,100,100,0.75)", marginBottom: "10px" }}>PAIN POINT {p.n}</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: WHITE, marginBottom: "8px" }}>{p.title}</div>
              <div style={{ fontSize: "12px", color: WHITE_DIM, lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "28px", padding: "18px 22px", borderRadius: "12px", background: `${BLUE}0e`, border: `1px solid ${BLUE}22`, display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ fontSize: "20px" }}>💡</div>
          <p style={{ margin: 0, fontSize: "13px", color: WHITE_DIM }}>
            The result: talented staff buried in admin, residents frustrated with opacity, and guests who cannot re-book because the experience left no impression.
            <strong style={{ color: WHITE }}> Zsquare is proposing one platform that handles all three at once.</strong>
          </p>
        </div>
      </div>
    </SlideWrap>
  );
}

function SolutionSlide() {
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <SlideHead eyebrow="Zsquare Proposes" title="One platform. Three portals." subtitle="A single, role-aware digital system that replaces every spreadsheet, WhatsApp group, and paper form." />
        <div style={{ display: "flex", gap: "16px" }}>
          <PortalBox
            iconNode={<IconOps color={BLUE} />}
            title="Staff Command Centre"
            sub="Operations"
            color={BLUE}
            items={["10 staff roles, each with the right level of access", "CEO and GM get a live analytics dashboard", "Maintenance tracked from report to close", "Document Centre, tasks and notifications in one place", "Alerts pull live from the maintenance and support queues"]}
          />
          <PortalBox
            iconNode={<IconHome color={BLUE_LIGHT} />}
            title="Resident Portal"
            sub="Owners & Tenants"
            color={BLUE_LIGHT}
            items={["See your service charge balance and payment history", "Submit and track maintenance requests yourself", "Pre-register visitors before they arrive", "Receive estate notices directly, not via WhatsApp", "Message the NAGA team from inside the app"]}
          />
          <PortalBox
            iconNode={<IconBed color={GOLD} />}
            title="NAGA Stays"
            sub="Guest Portal"
            color={GOLD}
            items={["New guests register in under a minute", "Booking details and access code in one place", "Check-in and checkout times clearly shown", "Area guide with restaurants, transport and essentials", "Support channel that actually logs the conversation"]}
          />
        </div>
      </div>
    </SlideWrap>
  );
}

function ArchitectureSlide() {
  const layers = [
    { label: "CEO / GM", desc: "Executive dashboard, full analytics, all modules — strategic oversight at a glance", iconNode: <IconPerson color={GOLD} />, color: GOLD, badge: "2 roles" },
    { label: "Operations Staff", desc: "PCO, Finance, IVM, Supervisor, CSO, Admin, PRM, Estate — each with scoped access", iconNode: <IconTeam color={BLUE} />, color: BLUE, badge: "8 roles" },
    { label: "Estate Residents", desc: "Owners and tenants — self-service payments, maintenance, and communication", iconNode: <IconHome color={BLUE_LIGHT} />, color: BLUE_LIGHT, badge: "Resident" },
    { label: "NAGA Stays Guests", desc: "Short-let guests — booking portal, check-in access codes, local area guide", iconNode: <IconKey color={GOLD} />, color: GOLD, badge: "Guest" },
  ];
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1000px" }}>
        <SlideHead eyebrow="Platform Architecture" title="Role-based access across every user type." subtitle="Every actor in the NAGA ecosystem has a tailored, permission-scoped interface." />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
          {layers.map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "18px", background: WHITE_FAINT, border: `1px solid ${l.color}22`, borderLeft: `3px solid ${l.color}`, borderRadius: "14px", padding: "16px 22px" }}>
              {l.iconNode}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: WHITE, marginBottom: "3px" }}>{l.label}</div>
                <div style={{ fontSize: "12px", color: WHITE_DIM }}>{l.desc}</div>
              </div>
              <div style={{ fontSize: "11px", color: l.color, fontFamily: "var(--font-mono)", padding: "4px 10px", borderRadius: "6px", background: `${l.color}12`, border: `1px solid ${l.color}25`, whiteSpace: "nowrap" as const }}>{l.badge}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "18px", fontSize: "11px", color: "rgba(255,255,255,0.22)", textAlign: "center" as const }}>
          Secured by session-based role authentication · No cross-portal data leakage
        </p>
      </div>
    </SlideWrap>
  );
}

function DashboardSlide() {
  const DotIcon = ({ color }: { color: string }) => (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, border: `1.5px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
    </div>
  );
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <TwoCol
          left={<>
            <SlideHead eyebrow="CEO & GM Dashboard" title="Business intelligence built in." subtitle="Real-time KPIs, occupancy, revenue tracking, and live analytics — all in one view." />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
              {[
                { color: GOLD, title: "Revenue tracking", desc: "Monthly service charge collections shown as a bar chart. You can see trends at a glance." },
                { color: BLUE, title: "Occupancy by estate", desc: "Each estate gets its own bar. You know immediately which buildings have gaps to fill." },
                { color: BLUE_LIGHT, title: "Maintenance at a glance", desc: "How many requests are open, assigned, in progress or done. Numbers pulled live." },
                { color: "#8B7FD4", title: "Support ticket breakdown", desc: "Open tickets grouped by category. Useful for spotting patterns before they become problems." },
              ].map(f => (
                <FeatureRow key={f.title} icon={<DotIcon color={f.color} />} title={f.title} desc={f.desc} />
              ))}
            </div>
          </>}
          right={
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Stat value="₦3.2bn" label="Service Charges Collected YTD" color={GOLD} />
              <Stat value="94%" label="Peak Occupancy — Sapphire Court" color={BLUE} />
              <Stat value="47" label="Maintenance Requests This Month" color={BLUE_LIGHT} />
              <Stat value="4" label="Active Support Tickets" color="#8B7FD4" />
            </div>
          }
        />
      </div>
    </SlideWrap>
  );
}

function StaffSlide() {
  const modules = [
    { title: "Maintenance", desc: "Full lifecycle — assign, track, close with resident feedback", color: BLUE },
    { title: "Document Centre", desc: "Circulars, leases, receipts — searchable and downloadable", color: BLUE_LIGHT },
    { title: "Tasks", desc: "Assignable tasks with due dates, priority, and status tracking", color: GOLD },
    { title: "Notifications", desc: "Live alerts drawn from maintenance and support stores", color: "#8B7FD4" },
    { title: "Messaging", desc: "Resident and guest support ticket threads in-app", color: BLUE },
    { title: "10 Staff Roles", desc: "CEO, GM, Finance, PCO, IVM, Supervisor, Admin, PRM, CSO, Estate", color: BLUE_LIGHT },
  ];
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <TwoCol
          left={
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {modules.map(m => (
                <div key={m.title} style={{ background: WHITE_FAINT, border: `1px solid ${m.color}20`, borderRadius: "14px", padding: "18px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, marginBottom: "10px" }} />
                  <div style={{ fontSize: "13px", fontWeight: 600, color: WHITE, marginBottom: "5px" }}>{m.title}</div>
                  <div style={{ fontSize: "11px", color: WHITE_DIM, lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          }
          right={<>
            <SlideHead eyebrow="Staff Operations" title="Every back-office function, unified." subtitle="From first maintenance report to final resident sign-off — managed in one platform, accessible to the right role." />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "7px" }}>
              {["CEO", "GM", "Finance", "PCO", "IVM", "Supervisor", "Admin", "PRM", "CSO", "Estate"].map(r => (
                <span key={r} style={{ padding: "5px 11px", borderRadius: "7px", fontSize: "11px", background: WHITE_FAINT, border: "1px solid rgba(255,255,255,0.1)", color: WHITE_DIM, fontFamily: "var(--font-mono)" }}>{r}</span>
              ))}
            </div>
          </>}
        />
      </div>
    </SlideWrap>
  );
}

function ResidentSlide() {
  const DotIcon = ({ color }: { color: string }) => (
    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}20`, border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
    </div>
  );
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <TwoCol
          left={<>
            <SlideHead eyebrow="Resident Portal" title="A premium self-service experience." subtitle="Estate owners and tenants access everything they need — without calling the office." />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
              {[
                { color: GOLD, title: "Service charge account", desc: "See what you owe, what you have paid, and download receipts." },
                { color: BLUE, title: "Raise a maintenance request", desc: "Submit it yourself and watch it move through the workflow in real time." },
                { color: BLUE_LIGHT, title: "Register visitors", desc: "Pre-register guests before they arrive, including vehicle details." },
                { color: "#8B7FD4", title: "Estate notices", desc: "Circulars come straight to the portal rather than a WhatsApp group." },
                { color: BLUE, title: "Support chat", desc: "Message NAGA from the app. A badge shows up when someone replies." },
              ].map(f => <FeatureRow key={f.title} icon={<DotIcon color={f.color} />} title={f.title} desc={f.desc} />)}
            </div>
          </>}
          right={
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
              <div style={{ background: WHITE_FAINT, border: `1px solid rgba(107,159,229,0.2)`, borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontSize: "10px", color: WHITE_DIM, marginBottom: "4px", fontFamily: "var(--font-mono)" }}>RESIDENT — MR. SEUN ADELEKE</div>
                <div style={{ fontSize: "14px", color: WHITE, fontWeight: 600, marginBottom: "2px" }}>Unit A7 · Palm Estate</div>
                <div style={{ fontSize: "12px", color: WHITE_DIM }}>Owner · Active since 2019</div>
                <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1, background: `${BLUE}12`, borderRadius: "10px", padding: "12px", textAlign: "center" as const }}>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: BLUE, fontFamily: "var(--font-display)" }}>3</div>
                    <div style={{ fontSize: "10px", color: WHITE_DIM }}>Open requests</div>
                  </div>
                  <div style={{ flex: 1, background: `${GOLD}12`, borderRadius: "10px", padding: "12px", textAlign: "center" as const }}>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: GOLD, fontFamily: "var(--font-display)" }}>2</div>
                    <div style={{ fontSize: "10px", color: WHITE_DIM }}>Visitor passes</div>
                  </div>
                </div>
              </div>
              <div style={{ background: WHITE_FAINT, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
                <div style={{ fontSize: "12px", color: WHITE, fontWeight: 600, marginBottom: "8px" }}>Guided Onboarding Flow</div>
                <div style={{ fontSize: "12px", color: WHITE_DIM, lineHeight: 1.8 }}>
                  ✓ Welcome screen on first login<br />
                  ✓ Unit details auto-populated<br />
                  ✓ Quick-access to all features
                </div>
              </div>
            </div>
          }
        />
      </div>
    </SlideWrap>
  );
}

function StaysSlide() {
  const DotIcon = ({ color }: { color: string }) => (
    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}20`, border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
    </div>
  );
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <TwoCol
          left={
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
              <div style={{ background: WHITE_FAINT, border: `1px solid ${GOLD}22`, borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, marginBottom: "8px" }}>NAGA STAYS — GUEST PORTAL</div>
                <div style={{ fontSize: "14px", color: WHITE, fontWeight: 600, marginBottom: "4px" }}>Dr. Amina Suleiman</div>
                <div style={{ fontSize: "12px", color: WHITE_DIM, marginBottom: "16px" }}>Booking BK-0041 · Sapphire Court Studio</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[["Check-in", "12 Sep 2026, 14:00"], ["Checkout", "15 Sep 2026, 11:00"], ["Access Code", "NGA-0041"], ["Unit", "Studio 4B"]].map(([l, v]) => (
                    <div key={l} style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}15`, borderRadius: "10px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "9px", color: WHITE_DIM, marginBottom: "3px", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{l}</div>
                      <div style={{ fontSize: "12px", color: WHITE, fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: WHITE_FAINT, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "16px 18px" }}>
                <div style={{ fontSize: "12px", color: WHITE, fontWeight: 600, marginBottom: "8px" }}>Area Guide — Abuja</div>
                <div style={{ fontSize: "11px", color: WHITE_DIM, lineHeight: 1.8 }}>
                  Restaurants · Supermarkets · Pharmacies · Banks<br />
                  Bolt / Uber · Nnamdi Azikiwe Intl (28 km)
                </div>
              </div>
            </div>
          }
          right={<>
            <SlideHead eyebrow="NAGA Stays" title="A branded hospitality experience." subtitle="Short-let guests get an Airbnb-quality portal — registration, booking details, access codes, and a local guide — all under the NAGA brand." />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
              {[
                { color: ZS_BLUE, title: "New guest? Just register.", desc: "Name, email, password. Under a minute. No email verification loop." },
                { color: GOLD, title: "Access code on arrival", desc: "A unique NGA-XXXX code is right there in the app when you check in." },
                { color: BLUE_LIGHT, title: "What is near me?", desc: "Restaurants, pharmacies, transport options, nearest airport. All filtered by city." },
                { color: BLUE, title: "Need help? Just message.", desc: "Support goes straight to the NAGA team. Every message is logged." },
              ].map(f => <FeatureRow key={f.title} icon={<DotIcon color={f.color} />} title={f.title} desc={f.desc} />)}
            </div>
          </>}
        />
      </div>
    </SlideWrap>
  );
}

function TechSlide() {
  const items = [
    { color: BLUE,       title: "Mobile-first PWA",    desc: "Installed on any device, works like a native app — no App Store needed" },
    { color: BLUE_LIGHT, title: "React 19 + Vite 8",   desc: "Sub-second hot reload, lazy-loaded routes, < 3s time-to-interactive" },
    { color: GOLD,       title: "Role-based Auth",     desc: "10 staff roles + resident + guest, fully isolated session stores" },
    { color: ZS_BLUE,    title: "Live Data Stores",    desc: "Shared maintenance and support stores bridge portals in real time" },
    { color: BLUE,       title: "Tailwind CSS v4",     desc: "Design token system, dark-first, fully responsive across breakpoints" },
    { color: "#8B7FD4",  title: "API-Ready",           desc: "Supabase, Paystack, and Termii SMS — modular integration path" },
  ];
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1000px" }}>
        <SlideHead eyebrow="Technology" title="Built to scale." subtitle="Production-grade React architecture. A clear path to database, payments, and SMS notifications." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {items.map(i => (
            <div key={i.title} style={{ background: WHITE_FAINT, border: `1px solid ${i.color}20`, borderRadius: "14px", padding: "20px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: i.color, marginBottom: "12px" }} />
              <div style={{ fontSize: "13px", fontWeight: 600, color: WHITE, marginBottom: "6px" }}>{i.title}</div>
              <div style={{ fontSize: "11px", color: WHITE_DIM, lineHeight: 1.5 }}>{i.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrap>
  );
}

function BusinessSlide() {
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1100px" }}>
        <TwoCol
          left={<>
            <SlideHead eyebrow="Business Case" title="Why this platform — and why now?" subtitle="A platform that protects premium Nigerian real estate value while opening a scalable short-let revenue stream." />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "13px" }}>
              {[
                { color: GOLD,       title: "Less time in admin", desc: "When requests, payments and communications are in one place, the team spends less time chasing and more time managing." },
                { color: BLUE,       title: "Residents who stay longer", desc: "Transparency and responsiveness are why people renew leases. A portal delivers both, consistently." },
                { color: BLUE_LIGHT, title: "NAGA Stays as a revenue line", desc: "A branded booking portal means short-let income is trackable, repeat guests are recognisable, and the brand leaves an impression." },
                { color: ZS_BLUE,    title: "Knowing before it becomes a problem", desc: "The CEO dashboard shows occupancy gaps, maintenance backlogs and support trends before anyone has to ask." },
              ].map(i => (
                <div key={i.title} style={{ display: "flex", gap: "13px", alignItems: "flex-start" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: i.color, marginTop: "6px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: WHITE, marginBottom: "2px" }}>{i.title}</div>
                    <div style={{ fontSize: "11px", color: WHITE_DIM, lineHeight: 1.5 }}>{i.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}
          right={
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Stat value="4" label="Premium Estates Under Management" color={BLUE} />
              <Stat value="10+" label="Staff Roles Supported" color={BLUE_LIGHT} />
              <Stat value="2" label="Cities — Abuja & Benin" color={GOLD} />
              <Stat value="∞" label="Scalable to Any Number of Estates" color={ZS_BLUE} />
            </div>
          }
        />
      </div>
    </SlideWrap>
  );
}

function CloseSlide({ onDownloadPPT, pptLoading }: { onDownloadPPT: () => void; pptLoading: boolean }) {
  return (
    <SlideWrap>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" as const, maxWidth: "740px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <ZsquareBadge size={56} />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <Tag color={ZS_BLUE}>Ready to Implement</Tag>
        </div>
        <h2 style={{ fontSize: "clamp(32px,5vw,58px)", fontFamily: "var(--font-display)", color: WHITE, lineHeight: 1.1, margin: "0 0 18px 0" }}>
          Let&apos;s build the future of NAGA together.
        </h2>
        <p style={{ fontSize: "15px", color: WHITE_DIM, lineHeight: 1.7, margin: "0 0 36px 0" }}>
          What you have seen today is a complete working prototype, built by Zsquare specifically for NAGA. The next step is connecting it to a real database, wiring up payments, and switching on SMS notifications. We can start that conversation today.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" as const, marginBottom: "28px" }}>
          {[
            { label: "contact@zsquareservices.com", icon: "✉️" },
            { label: "+234 913 044 8830", icon: "📞" },
            { label: "zsquareservices.com", icon: "🌐" },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "999px", background: WHITE_FAINT, border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", color: WHITE_DIM }}>
              <span>{c.icon}</span><span>{c.label}</span>
            </div>
          ))}
        </div>

        {/* PPT download */}
        <button
          onClick={onDownloadPPT}
          disabled={pptLoading}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 24px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
            background: pptLoading ? "rgba(107,159,229,0.15)" : `${ZS_BLUE}`,
            border: `1px solid ${ZS_BLUE}50`,
            color: pptLoading ? WHITE_DIM : WHITE,
            cursor: pptLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1.5" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M8 12v2.5M6 13l2 1.5 2-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {pptLoading ? "Generating .pptx…" : "Download as PowerPoint (.pptx)"}
        </button>

        <p style={{ marginTop: "24px", fontSize: "10px", color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-mono)" }}>
          ZSQUARE IDEAL CONCEPTS LTD · CONFIDENTIAL PROPOSAL · PREPARED FOR NAGA PROPERTY MANAGEMENT · 2026
        </p>
      </div>
    </SlideWrap>
  );
}

// ═══════════════════════════════════════════════════════════
// PPT GENERATOR
// ═══════════════════════════════════════════════════════════
async function generatePPT() {
  const pres = new pptxgen();
  (pres as any).layout = "LAYOUT_WIDE";

  const N = "0F0D2E";  // navy bg
  const NM = "25205B"; // navy mid
  const BL = "6B9FE5"; // blue
  const GD = "D4A843"; // gold
  const ZB = "1B8FCC"; // zsquare blue
  const WT = "FFFFFF";
  const WD = "8899AA";

  // Fetch logo → base64
  let logoB64 = "";
  try {
    const resp = await fetch(zsquareLogo);
    const blob = await resp.blob();
    logoB64 = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.readAsDataURL(blob);
    });
  } catch { /* skip logo if fetch fails */ }

  const addLogo = (slide: ReturnType<typeof pres.addSlide>, x: number, y: number, size = 0.9) => {
    if (logoB64) {
      slide.addImage({ data: `image/png;base64,${logoB64}`, x, y, w: size, h: size });
    }
  };

  const bg = { color: N };
  const line = (slide: ReturnType<typeof pres.addSlide>) =>
    slide.addShape(pres.ShapeType.line, { x: 0.5, y: 7.1, w: 12.33, h: 0, line: { color: BL, width: 0.5, transparency: 60 } });

  // ── Slide 1: Cover ───────────────────────────────────────
  const s1 = pres.addSlide();
  s1.background = bg;
  addLogo(s1, 0.6, 0.35, 0.85);
  s1.addText("ZSQUARE IDEAL CONCEPTS LTD", { x: 1.65, y: 0.42, w: 6, h: 0.28, fontSize: 10, bold: true, color: WT, fontFace: "Calibri" });
  s1.addText("Digital Solutions & Technology Consulting", { x: 1.65, y: 0.7, w: 7, h: 0.22, fontSize: 8, color: WD, fontFace: "Calibri" });
  s1.addText("PROPOSAL · AUGUST 2026", { x: 0.5, y: 1.4, w: 12.33, h: 0.28, fontSize: 9, color: ZB, bold: true, align: "center", fontFace: "Calibri" });
  s1.addText("NAGA Property Platform", { x: 0.5, y: 1.85, w: 12.33, h: 1.5, fontSize: 44, bold: true, color: WT, align: "center", fontFace: "Georgia" });
  s1.addText("A complete digital management ecosystem for NAGA's estate operations, resident experience, and NAGA Stays short-let portfolio", { x: 1.0, y: 3.55, w: 11.33, h: 0.7, fontSize: 14, color: WD, align: "center", fontFace: "Calibri" });
  s1.addText("Prepared for NAGA Property Management", { x: 0.5, y: 4.55, w: 12.33, h: 0.4, fontSize: 12, color: BL, align: "center", bold: true, fontFace: "Calibri" });
  s1.addShape(pres.ShapeType.rect, { x: 0, y: 7.25, w: 13.33, h: 0.25, fill: { color: ZB, transparency: 0 } });
  line(s1);

  // ── Slide 2: Problem ─────────────────────────────────────
  const s2 = pres.addSlide();
  s2.background = bg;
  s2.addText("THE CHALLENGE", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s2.addText("Premium properties. Legacy operations.", { x: 0.5, y: 0.75, w: 12, h: 0.7, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const pains = [
    ["PAIN POINT 01", "Fragmented Communications", "Requests, payments, and notices across WhatsApp, email, and calls — no audit trail, no accountability."],
    ["PAIN POINT 02", "No Resident Self-Service", "Owners can't track charges, raise requests, or receive notices without calling the office."],
    ["PAIN POINT 03", "Short-Let Brand Gap", "NAGA Stays guests have no branded portal — no booking details, no check-in instructions."],
  ];
  pains.forEach(([label, title, desc], i) => {
    const x = 0.5 + i * 4.2;
    s2.addShape(pres.ShapeType.rect, { x, y: 1.7, w: 4.0, h: 3.8, fill: { color: "3D0A0A", transparency: 70 }, line: { color: "CC4444", transparency: 50, width: 0.5 } });
    s2.addText(label, { x: x + 0.2, y: 1.9, w: 3.6, h: 0.25, fontSize: 8, color: "CC6666", bold: true, fontFace: "Calibri" });
    s2.addText(title, { x: x + 0.2, y: 2.2, w: 3.6, h: 0.5, fontSize: 13, bold: true, color: WT, fontFace: "Calibri" });
    s2.addText(desc, { x: x + 0.2, y: 2.8, w: 3.6, h: 2.4, fontSize: 10, color: WD, fontFace: "Calibri", valign: "top" });
  });
  s2.addText("Zsquare proposes a unified digital platform that solves all three challenges simultaneously.", { x: 0.5, y: 5.8, w: 12.33, h: 0.4, fontSize: 11, color: BL, bold: true, align: "center", fontFace: "Calibri" });
  line(s2);

  // ── Slide 3: Solution ────────────────────────────────────
  const s3 = pres.addSlide();
  s3.background = bg;
  s3.addText("ZSQUARE PROPOSES", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s3.addText("One platform. Three portals.", { x: 0.5, y: 0.75, w: 12, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const portals = [
    { title: "Staff Command Centre", sub: "OPERATIONS", color: BL, items: ["10 role types with tailored access", "CEO & GM executive dashboard", "Maintenance request management", "Document Centre & task tracking"] },
    { title: "Resident Portal", sub: "OWNERS & TENANTS", color: "8eb6ec", items: ["Service charge overview", "Maintenance request & tracking", "Visitor pass management", "Direct support messaging"] },
    { title: "NAGA Stays", sub: "GUEST PORTAL", color: GD, items: ["Guest self-registration flow", "Booking itinerary & access code", "Local area guide", "Guest support channel"] },
  ];
  portals.forEach((p, i) => {
    const x = 0.5 + i * 4.2;
    s3.addShape(pres.ShapeType.rect, { x, y: 1.55, w: 4.0, h: 5.0, fill: { color: "FFFFFF", transparency: 94 }, line: { color: p.color, transparency: 75, width: 0.5 } });
    s3.addText(p.sub, { x: x + 0.2, y: 1.75, w: 3.6, h: 0.25, fontSize: 7.5, color: p.color, bold: true, fontFace: "Calibri" });
    s3.addText(p.title, { x: x + 0.2, y: 2.05, w: 3.6, h: 0.55, fontSize: 14, bold: true, color: WT, fontFace: "Calibri" });
    p.items.forEach((item, j) => {
      s3.addText(`• ${item}`, { x: x + 0.2, y: 2.75 + j * 0.45, w: 3.6, h: 0.4, fontSize: 10, color: WD, fontFace: "Calibri" });
    });
  });
  line(s3);

  // ── Slide 4: Architecture ────────────────────────────────
  const s4 = pres.addSlide();
  s4.background = bg;
  s4.addText("PLATFORM ARCHITECTURE", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s4.addText("Role-based access across every user type.", { x: 0.5, y: 0.75, w: 12, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const tiers = [
    { label: "CEO / GM", desc: "Executive dashboard, full analytics, all modules — strategic oversight", badge: "2 roles", color: GD },
    { label: "Operations Staff", desc: "PCO, Finance, IVM, Supervisor, CSO, Admin, PRM — each with scoped access", badge: "8 roles", color: BL },
    { label: "Estate Residents", desc: "Owners and tenants — self-service payments, maintenance, and communication", badge: "Resident", color: "8eb6ec" },
    { label: "NAGA Stays Guests", desc: "Short-let guests — booking portal, check-in access codes, local area guide", badge: "Guest", color: GD },
  ];
  tiers.forEach((t, i) => {
    const y = 1.65 + i * 1.15;
    s4.addShape(pres.ShapeType.rect, { x: 0.5, y, w: 0.06, h: 0.95, fill: { color: t.color }, line: { color: t.color, width: 0 } });
    s4.addShape(pres.ShapeType.rect, { x: 0.65, y, w: 11.5, h: 0.95, fill: { color: "FFFFFF", transparency: 94 }, line: { color: t.color, transparency: 80, width: 0.5 } });
    s4.addText(t.label, { x: 0.95, y: y + 0.1, w: 4, h: 0.35, fontSize: 13, bold: true, color: WT, fontFace: "Calibri" });
    s4.addText(t.desc, { x: 0.95, y: y + 0.47, w: 7.5, h: 0.32, fontSize: 10, color: WD, fontFace: "Calibri" });
    s4.addShape(pres.ShapeType.rect, { x: 10.8, y: y + 0.22, w: 1.1, h: 0.35, fill: { color: t.color, transparency: 88 }, line: { color: t.color, transparency: 65, width: 0.5 } });
    s4.addText(t.badge, { x: 10.8, y: y + 0.22, w: 1.1, h: 0.35, fontSize: 9, color: t.color, bold: true, align: "center", fontFace: "Calibri" });
  });
  s4.addText("Session-based role authentication · No cross-portal data leakage", { x: 0.5, y: 6.6, w: 12.33, h: 0.3, fontSize: 9, color: "556677", align: "center", fontFace: "Calibri" });
  line(s4);

  // ── Slide 5: CEO Dashboard ───────────────────────────────
  const s5 = pres.addSlide();
  s5.background = bg;
  s5.addText("CEO & GM DASHBOARD", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s5.addText("Business intelligence built in.", { x: 0.5, y: 0.75, w: 7, h: 0.65, fontSize: 26, bold: true, color: WT, fontFace: "Georgia" });
  const kpis = [["₦3.2bn", "Service Charges YTD", GD], ["94%", "Peak Occupancy", BL], ["47", "Requests This Month", "8eb6ec"], ["4", "Open Tickets", "8B7FD4"]];
  kpis.forEach(([val, lbl, col], i) => {
    const x = 0.5 + (i % 2) * 3.2, y = 1.55 + Math.floor(i / 2) * 1.8;
    s5.addShape(pres.ShapeType.rect, { x, y, w: 3.0, h: 1.55, fill: { color: "FFFFFF", transparency: 94 }, line: { color: col, transparency: 75, width: 0.5 } });
    s5.addText(val, { x, y: y + 0.15, w: 3.0, h: 0.75, fontSize: 28, bold: true, color: col, align: "center", fontFace: "Georgia" });
    s5.addText(lbl, { x, y: y + 0.95, w: 3.0, h: 0.45, fontSize: 9, color: WD, align: "center", fontFace: "Calibri" });
  });
  const dashFeatures = ["Revenue analytics — monthly service charge collections with trend charts", "Occupancy rates — per-estate horizontal bar charts", "Live maintenance feed — breakdown by status in real time", "Support intelligence — open tickets by category"];
  dashFeatures.forEach((f, i) => s5.addText(`• ${f}`, { x: 7.1, y: 1.65 + i * 0.65, w: 5.7, h: 0.55, fontSize: 11, color: WD, fontFace: "Calibri" }));
  line(s5);

  // ── Slide 6: Staff ───────────────────────────────────────
  const s6 = pres.addSlide();
  s6.background = bg;
  s6.addText("STAFF OPERATIONS", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s6.addText("Every back-office function, unified.", { x: 0.5, y: 0.75, w: 12, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const mods = [
    ["Maintenance", "Full lifecycle — assign, track, close with resident feedback", BL],
    ["Document Centre", "Circulars, leases, receipts — searchable and downloadable", "8eb6ec"],
    ["Tasks Module", "Assignable tasks with due dates, priority, and status", GD],
    ["Notifications", "Live alerts from maintenance and support stores", "8B7FD4"],
    ["Messaging", "In-app resident and guest support ticket threads", BL],
    ["10 Staff Roles", "CEO, GM, Finance, PCO, IVM, Supervisor, Admin, PRM, CSO, Estate", "8eb6ec"],
  ];
  mods.forEach(([title, desc, col], i) => {
    const x = 0.5 + (i % 3) * 4.2, y = 1.65 + Math.floor(i / 3) * 2.0;
    s6.addShape(pres.ShapeType.rect, { x, y, w: 4.0, h: 1.7, fill: { color: "FFFFFF", transparency: 94 }, line: { color: col, transparency: 80, width: 0.5 } });
    s6.addText(title as string, { x: x + 0.2, y: y + 0.15, w: 3.6, h: 0.35, fontSize: 12, bold: true, color: WT, fontFace: "Calibri" });
    s6.addText(desc as string, { x: x + 0.2, y: y + 0.55, w: 3.6, h: 0.9, fontSize: 10, color: WD, fontFace: "Calibri", valign: "top" });
  });
  line(s6);

  // ── Slide 7: Resident Portal ─────────────────────────────
  const s7 = pres.addSlide();
  s7.background = bg;
  s7.addText("RESIDENT PORTAL", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s7.addText("A premium self-service experience.", { x: 0.5, y: 0.75, w: 8, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const resFeatures = [
    ["Service Charge Overview", "Outstanding balances, payment history, and receipt downloads"],
    ["Maintenance Requests", "Submit, track, and mark resolved — staff notes visible in real time"],
    ["Visitor Passes", "Pre-register guests with vehicle details and arrival windows"],
    ["Estate Notices", "Circulars and announcements pushed directly to the resident"],
    ["Support Messaging", "Direct thread with NAGA support — unread reply badge alerts"],
  ];
  resFeatures.forEach(([title, desc], i) => {
    s7.addText(`${title}`, { x: 0.5, y: 1.65 + i * 0.9, w: 7.5, h: 0.3, fontSize: 12, bold: true, color: WT, fontFace: "Calibri" });
    s7.addText(desc as string, { x: 0.5, y: 1.95 + i * 0.9, w: 7.5, h: 0.35, fontSize: 10, color: WD, fontFace: "Calibri" });
  });
  s7.addShape(pres.ShapeType.rect, { x: 8.7, y: 1.55, w: 4.1, h: 3.3, fill: { color: "FFFFFF", transparency: 94 }, line: { color: BL, transparency: 70, width: 0.5 } });
  s7.addText("MR. SEUN ADELEKE", { x: 8.9, y: 1.7, w: 3.7, h: 0.25, fontSize: 8, color: WD, bold: true, fontFace: "Calibri" });
  s7.addText("Unit A7 · Palm Estate", { x: 8.9, y: 2.0, w: 3.7, h: 0.32, fontSize: 12, color: WT, bold: true, fontFace: "Calibri" });
  s7.addText("Owner · Active since 2019", { x: 8.9, y: 2.35, w: 3.7, h: 0.28, fontSize: 10, color: WD, fontFace: "Calibri" });
  s7.addText("3 Open Requests", { x: 8.9, y: 3.0, w: 1.7, h: 0.55, fontSize: 11, color: BL, bold: true, align: "center", fontFace: "Calibri" });
  s7.addText("2 Visitor Passes", { x: 10.8, y: 3.0, w: 1.7, h: 0.55, fontSize: 11, color: GD, bold: true, align: "center", fontFace: "Calibri" });
  line(s7);

  // ── Slide 8: NAGA Stays ──────────────────────────────────
  const s8 = pres.addSlide();
  s8.background = bg;
  s8.addText("NAGA STAYS", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: GD, bold: true, fontFace: "Calibri" });
  s8.addText("A branded hospitality experience.", { x: 0.5, y: 0.75, w: 8, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const staysFeatures = [
    ["Guest Self-Registration", "New guests create an account in under a minute — no admin needed"],
    ["Access Code & Check-in", "Unique NGA-XXXX code delivered in-app with arrival instructions"],
    ["Local Area Guide", "City-aware essentials — restaurants, transport, pharmacies"],
    ["Guest Support", "Direct support channel with NAGA team, tracked and resolved"],
  ];
  staysFeatures.forEach(([title, desc], i) => {
    s8.addText(`${title}`, { x: 0.5, y: 1.65 + i * 1.0, w: 7.5, h: 0.3, fontSize: 12, bold: true, color: WT, fontFace: "Calibri" });
    s8.addText(desc as string, { x: 0.5, y: 1.95 + i * 1.0, w: 7.5, h: 0.35, fontSize: 10, color: WD, fontFace: "Calibri" });
  });
  s8.addShape(pres.ShapeType.rect, { x: 8.7, y: 1.55, w: 4.1, h: 3.8, fill: { color: "FFFFFF", transparency: 94 }, line: { color: GD, transparency: 65, width: 0.5 } });
  s8.addText("DR. AMINA SULEIMAN", { x: 8.9, y: 1.7, w: 3.7, h: 0.25, fontSize: 8, color: GD, bold: true, fontFace: "Calibri" });
  s8.addText("Booking BK-0041", { x: 8.9, y: 2.0, w: 3.7, h: 0.3, fontSize: 12, color: WT, bold: true, fontFace: "Calibri" });
  s8.addText("Sapphire Court Studio", { x: 8.9, y: 2.32, w: 3.7, h: 0.28, fontSize: 10, color: WD, fontFace: "Calibri" });
  const guestDetails = [["Check-in", "12 Sep 2026, 14:00"], ["Checkout", "15 Sep 2026, 11:00"], ["Access Code", "NGA-0041"], ["Unit", "Studio 4B"]];
  guestDetails.forEach(([l, v], i) => {
    const row_x = 8.9 + (i % 2) * 1.9, row_y = 2.85 + Math.floor(i / 2) * 0.75;
    s8.addText(`${l}: ${v}`, { x: row_x, y: row_y, w: 1.8, h: 0.55, fontSize: 9, color: WD, fontFace: "Calibri" });
  });
  line(s8);

  // ── Slide 9: Technology ──────────────────────────────────
  const s9 = pres.addSlide();
  s9.background = bg;
  s9.addText("TECHNOLOGY", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s9.addText("Built to scale.", { x: 0.5, y: 0.75, w: 12, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const techItems = [
    ["Mobile-first PWA", "Installed on any device, works like a native app — no App Store needed", BL],
    ["React 19 + Vite 8", "Sub-second hot reload, lazy-loaded routes, < 3s time-to-interactive", "8eb6ec"],
    ["Role-based Auth", "10 staff roles + resident + guest, fully isolated session stores", GD],
    ["Live Data Stores", "Shared stores bridge portals in real time", ZB],
    ["Tailwind CSS v4", "Design token system, dark-first, fully responsive", BL],
    ["API-Ready Integration", "Supabase, Paystack, and Termii SMS — modular path", "8B7FD4"],
  ];
  techItems.forEach(([title, desc, col], i) => {
    const x = 0.5 + (i % 3) * 4.2, y = 1.65 + Math.floor(i / 3) * 2.0;
    s9.addShape(pres.ShapeType.rect, { x, y, w: 4.0, h: 1.7, fill: { color: "FFFFFF", transparency: 94 }, line: { color: col, transparency: 80, width: 0.5 } });
    s9.addText(title as string, { x: x + 0.2, y: y + 0.15, w: 3.6, h: 0.35, fontSize: 12, bold: true, color: WT, fontFace: "Calibri" });
    s9.addText(desc as string, { x: x + 0.2, y: y + 0.55, w: 3.6, h: 0.9, fontSize: 10, color: WD, fontFace: "Calibri", valign: "top" });
  });
  line(s9);

  // ── Slide 10: Business Case ──────────────────────────────
  const s10 = pres.addSlide();
  s10.background = bg;
  s10.addText("BUSINESS CASE", { x: 0.5, y: 0.4, w: 12, h: 0.3, fontSize: 9, color: BL, bold: true, fontFace: "Calibri" });
  s10.addText("Why this platform — and why now?", { x: 0.5, y: 0.75, w: 8, h: 0.65, fontSize: 28, bold: true, color: WT, fontFace: "Georgia" });
  const bizPoints = [
    ["Operational Cost Reduction", "Eliminate admin overhead with a single, automated platform", GD],
    ["Resident Retention", "Self-service and transparency are the top drivers of lease renewal", BL],
    ["NAGA Stays Revenue", "A branded short-let portal converts occupancy into measurable income", "8eb6ec"],
    ["Data-Driven Decisions", "CEO dashboard surfaces trends and issues before they escalate", ZB],
  ];
  bizPoints.forEach(([title, desc, col], i) => {
    s10.addText(`${title}`, { x: 0.8, y: 1.65 + i * 1.0, w: 7.5, h: 0.3, fontSize: 12, bold: true, color: WT, fontFace: "Calibri" });
    s10.addText(desc as string, { x: 0.8, y: 1.95 + i * 1.0, w: 7.5, h: 0.35, fontSize: 10, color: WD, fontFace: "Calibri" });
    s10.addShape(pres.ShapeType.ellipse, { x: 0.55, y: 1.72 + i * 1.0, w: 0.14, h: 0.14, fill: { color: col }, line: { color: col, width: 0 } });
  });
  const stats = [["4", "Premium Estates", BL], ["10+", "Staff Roles", "8eb6ec"], ["2", "Cities", GD], ["∞", "Scalable", ZB]];
  stats.forEach(([val, lbl, col], i) => {
    const x = 8.7 + (i % 2) * 2.1, y = 1.65 + Math.floor(i / 2) * 2.0;
    s10.addShape(pres.ShapeType.rect, { x, y, w: 2.0, h: 1.6, fill: { color: "FFFFFF", transparency: 94 }, line: { color: col, transparency: 75, width: 0.5 } });
    s10.addText(val as string, { x, y: y + 0.15, w: 2.0, h: 0.75, fontSize: 28, bold: true, color: col, align: "center", fontFace: "Georgia" });
    s10.addText(lbl as string, { x, y: y + 0.95, w: 2.0, h: 0.45, fontSize: 9, color: WD, align: "center", fontFace: "Calibri" });
  });
  line(s10);

  // ── Slide 11: Close ──────────────────────────────────────
  const s11 = pres.addSlide();
  s11.background = bg;
  addLogo(s11, 5.67, 0.5, 1.0);
  s11.addText("ZSQUARE IDEAL CONCEPTS LTD", { x: 0.5, y: 1.8, w: 12.33, h: 0.35, fontSize: 12, bold: true, color: ZB, align: "center", fontFace: "Calibri" });
  s11.addText("Let's build the future of NAGA together.", { x: 0.5, y: 2.25, w: 12.33, h: 1.0, fontSize: 30, bold: true, color: WT, align: "center", fontFace: "Georgia" });
  s11.addText("Zsquare is ready to move to full production implementation — database, payments, and SMS — immediately upon engagement.", { x: 1.0, y: 3.45, w: 11.33, h: 0.6, fontSize: 13, color: WD, align: "center", fontFace: "Calibri" });
  const contacts = ["✉  contact@zsquareservices.com", "📞  +234 913 044 8830", "🌐  zsquareservices.com"];
  contacts.forEach((c, i) => s11.addText(c, { x: 0.5 + i * 4.2, y: 4.5, w: 4.0, h: 0.5, fontSize: 12, color: WT, align: "center", fontFace: "Calibri" }));
  s11.addShape(pres.ShapeType.rect, { x: 0, y: 7.25, w: 13.33, h: 0.25, fill: { color: ZB } });
  s11.addText("CONFIDENTIAL PROPOSAL · PREPARED FOR NAGA PROPERTY MANAGEMENT · 2026", { x: 0.5, y: 6.6, w: 12.33, h: 0.3, fontSize: 8, color: "445566", align: "center", fontFace: "Calibri" });

  // pptxgenjs detects Vite's `process` shim as Node.js and tries node:fs.
  // Use write('blob') + manual anchor click to force a browser download instead.
  const blob = await pres.write({ outputType: "blob" }) as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "NAGA-Platform-Proposal-by-Zsquare.pptx";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 150);
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function PresentationPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [pptLoading, setPptLoading] = useState(false);
  const total = SLIDES.length;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); prev(); }
      if (e.key === "Escape") navigate("/");
      if (e.key === "n" || e.key === "N") setShowNotes(n => !n);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, navigate]);

  useEffect(() => {
    setShowControls(true);
    const t = setTimeout(() => setShowControls(false), 3200);
    return () => clearTimeout(t);
  }, [current]);

  const handleDownloadPPT = async () => {
    setPptLoading(true);
    try { await generatePPT(); } catch (e) { console.error(e); }
    finally { setPptLoading(false); }
  };

  const slide = SLIDES[current];

  const renderSlide = () => {
    switch (current) {
      case 0:  return <CoverSlide />;
      case 1:  return <ProblemSlide />;
      case 2:  return <SolutionSlide />;
      case 3:  return <ArchitectureSlide />;
      case 4:  return <DashboardSlide />;
      case 5:  return <StaffSlide />;
      case 6:  return <ResidentSlide />;
      case 7:  return <StaysSlide />;
      case 8:  return <TechSlide />;
      case 9:  return <BusinessSlide />;
      case 10: return <CloseSlide onDownloadPPT={handleDownloadPPT} pptLoading={pptLoading} />;
      default: return null;
    }
  };

  return (
    <div
      style={{ width: "100vw", height: "100dvh", background: NAVY, fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", cursor: showControls ? "default" : "none" }}
      onMouseMove={() => setShowControls(true)}
    >
      <div style={{ width: "100%", height: "100%" }}>{renderSlide()}</div>

      {/* Click zones */}
      <div
        style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", zIndex: 5 }}
        onClick={(e) => {
          const { clientX, currentTarget } = e;
          const { left, width } = currentTarget.getBoundingClientRect();
          const ratio = (clientX - left) / width;
          if (ratio < 0.35) prev(); else next();
        }}
      />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 26px",
        background: "linear-gradient(to bottom, rgba(15,13,46,0.96), transparent)",
        zIndex: 10, opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease",
        pointerEvents: showControls ? "auto" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "white", borderRadius: 8, padding: "3px 5px", display: "flex" }}>
            <img src={zsquareLogo} alt="Zsquare" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: WHITE, letterSpacing: "0.06em" }}>NAGA Platform Proposal</div>
            <div style={{ fontSize: "9px", color: WHITE_DIM, marginTop: "1px" }}>Prepared by Zsquare Ideal Concepts Ltd</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotes(n => !n); }}
            style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", background: showNotes ? `${BLUE}25` : "rgba(255,255,255,0.06)", border: `1px solid ${showNotes ? BLUE + "50" : "rgba(255,255,255,0.1)"}`, color: showNotes ? BLUE : WHITE_DIM }}>
            Speaker Notes
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate("/"); }}
            style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: WHITE_DIM }}>
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 26px",
        background: "linear-gradient(to top, rgba(15,13,46,0.96), transparent)",
        zIndex: 10, opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease",
        pointerEvents: showControls ? "auto" : "none",
      }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: WHITE, marginBottom: "2px" }}>{slide.label}</div>
          <div style={{ fontSize: "10px", color: WHITE_DIM, fontFamily: "var(--font-mono)" }}>⏱ ~{slide.timing} mark</div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={(e) => { e.stopPropagation(); setCurrent(i); }} style={{ width: i === current ? "20px" : "6px", height: "6px", borderRadius: "999px", background: i === current ? ZS_BLUE : "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", transition: "all 0.25s", padding: 0 }} />
          ))}
        </div>

        {/* Prev / Next */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={current === 0}
            style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: current === 0 ? "rgba(255,255,255,0.2)" : WHITE_DIM, cursor: current === 0 ? "not-allowed" : "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ fontSize: "11px", color: WHITE_DIM, fontFamily: "var(--font-mono)", minWidth: "40px", textAlign: "center" as const }}>{current + 1} / {total}</span>
          <button onClick={(e) => { e.stopPropagation(); next(); }} disabled={current === total - 1}
            style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: current === total - 1 ? "rgba(255,255,255,0.04)" : `${ZS_BLUE}30`, border: `1px solid ${current === total - 1 ? "rgba(255,255,255,0.08)" : ZS_BLUE + "55"}`, color: current === total - 1 ? "rgba(255,255,255,0.2)" : ZS_BLUE, cursor: current === total - 1 ? "not-allowed" : "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.05)", zIndex: 11 }}>
        <div style={{ height: "100%", width: `${((current + 1) / total) * 100}%`, background: `linear-gradient(90deg, ${NAVY_MID}, ${ZS_BLUE})`, transition: "width 0.35s ease" }} />
      </div>

      {/* Speaker notes */}
      {showNotes && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: "62px", left: "50%", transform: "translateX(-50%)",
            background: "rgba(10,9,30,0.97)", border: `1px solid ${ZS_BLUE}30`,
            borderRadius: "12px", padding: "16px 20px",
            maxWidth: "580px", width: "calc(100% - 80px)",
            zIndex: 20, fontSize: "12px", color: WHITE_DIM, lineHeight: 1.7,
            backdropFilter: "blur(12px)",
          }}>
          <div style={{ fontSize: "9px", color: ZS_BLUE, fontWeight: 700, letterSpacing: "0.12em", marginBottom: "7px" }}>SPEAKER NOTES — SLIDE {current + 1} OF {total}</div>
          {SPEAKER_NOTES[current]}
        </div>
      )}
    </div>
  );
}
