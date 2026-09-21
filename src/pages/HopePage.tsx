import { useState, useEffect, useRef, useCallback } from "react";

// ── Brand palette ─────────────────────────────────────────────────────────────
const NAV  = "#0B1747";
const NAV2 = "#14296A";
const BLU  = "#1565D8";
const CYN  = "#0891B2";
const GRN  = "#059669";
const LGR  = "#F1F5F9";
const MGR  = "#E2E8F0";
const DGR  = "#94A3B8";
const WHT  = "#FFFFFF";
const TDK  = "#0F172A";
const TMD  = "#475569";
const AMB  = "#D97706";

// ── Shared sub-components ─────────────────────────────────────────────────────

function Logo({ size = 22, dark = false }: { size?: number; dark?: boolean }) {
  const c = dark ? WHT : NAV;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: size, height: size, background: BLU, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.55, color: WHT, fontFamily: "Inter,sans-serif", letterSpacing: -0.5 }}>e</div>
      <span style={{ fontFamily: "Inter,sans-serif", fontSize: size * 0.7, fontWeight: 700, color: c, letterSpacing: -0.3 }}>eTranzact</span>
    </div>
  );
}

function SlideFooter({ num, dark = false }: { num: number; dark?: boolean }) {
  const c = dark ? "rgba(255,255,255,0.3)" : DGR;
  const b = dark ? "rgba(255,255,255,0.1)" : MGR;
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 48px", borderTop: `1px solid ${b}` }}>
      <span style={{ fontFamily: "Inter,sans-serif", fontSize: 9, color: c, fontWeight: 500, letterSpacing: 0.3 }}>
        eTranzact International Plc · HOPE-SP Digital Disbursement Infrastructure Proposal · Confidential
      </span>
      <span style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: c, fontWeight: 700 }}>
        {String(num).padStart(2, "0")} / 17
      </span>
    </div>
  );
}

function Dn({ color = BLU }: { color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "3px 0" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v10M3 8l4 4 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

function Rt({ color = MGR }: { color?: string }) {
  return (
    <div style={{ margin: "0 4px", display: "flex", alignItems: "center" }}>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M0 5h12M8 1l5 4-5 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 01 — COVER
// ─────────────────────────────────────────────────────────────────────────────
function Slide01() {
  return (
    <div style={{ background: NAV, width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", right: -60, top: -60, opacity: 0.07 }} width="500" height="500" viewBox="0 0 500 500" fill="none">
        <circle cx="250" cy="250" r="240" stroke={CYN} strokeWidth="80"/>
        <circle cx="250" cy="250" r="140" stroke={BLU} strokeWidth="40"/>
        <circle cx="250" cy="250" r="60" stroke={CYN} strokeWidth="20"/>
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(to bottom,${BLU},${CYN})` }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "18px 56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo dark size={22} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Submitted to</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", fontWeight: 600, marginTop: 2 }}>Federal Ministry of Humanitarian Affairs & Poverty Reduction</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 80px" }}>
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 9.5, fontFamily: "Inter,sans-serif", fontWeight: 700, color: CYN, letterSpacing: 2.5, textTransform: "uppercase" }}>
            HOPE-SP — Household Prosperity & Economic Social Protection Project
          </span>
        </div>
        <h1 style={{ fontSize: 48, fontFamily: "Inter,sans-serif", fontWeight: 900, color: WHT, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 660, marginBottom: 22 }}>
          Digital Disbursement Infrastructure for HOPE-SP
        </h1>
        <div style={{ width: 56, height: 4, background: `linear-gradient(to right,${BLU},${CYN})`, borderRadius: 2, marginBottom: 22 }} />
        <p style={{ fontSize: 19, fontFamily: "Inter,sans-serif", fontWeight: 400, color: "rgba(255,255,255,0.72)", lineHeight: 1.4, maxWidth: 540, marginBottom: 6 }}>
          From Approved Beneficiaries to Delivered Impact
        </p>
        <p style={{ fontSize: 13, fontFamily: "Inter,sans-serif", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>
          A Strategic Partnership Proposal by eTranzact International Plc
        </p>
      </div>
      {[0,1,2,3,4,5,6,7].map((i) => (
        <div key={i} style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", background: i%2===0 ? BLU : CYN, opacity: 0.35, left: 100+i*96, bottom: 70+Math.sin(i*1.1)*20 }} />
      ))}
      <SlideFooter num={1} dark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 02 — EXECUTIVE PROPOSITION
// ─────────────────────────────────────────────────────────────────────────────
function Slide02() {
  const pillars = [
    { label: "SECURE",    sub: "Protected payment execution and controlled access",  icon: "🔒" },
    { label: "SCALABLE",  sub: "Designed for high-volume beneficiary disbursement",   icon: "📈" },
    { label: "INCLUSIVE", sub: "Bank, wallet, card and agent-enabled access",          icon: "🌍" },
    { label: "TRACEABLE", sub: "Transaction visibility, reporting and auditability",   icon: "👁" },
    { label: "GOVERNED",  sub: "Approval workflows and authorization controls",        icon: "⚖️" },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "40px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Executive Proposition</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: NAV, letterSpacing: -0.7, lineHeight: 1.15, marginBottom: 10, fontFamily: "Inter,sans-serif" }}>
        HOPE-SP Needs More Than a Payment Processor
      </h2>
      <p style={{ fontSize: 12.5, color: TMD, lineHeight: 1.65, maxWidth: 700, marginBottom: 20, fontFamily: "Inter,sans-serif" }}>
        HOPE-SP requires a trusted digital financial infrastructure capable of moving programme funds securely from approved beneficiaries to actual accounts and access points — with visibility, control, reconciliation and accountability across the entire disbursement lifecycle.
      </p>
      <div style={{ display: "flex", gap: 10, flex: 1 }}>
        {pillars.map((p) => (
          <div key={p.label} style={{ flex: 1, background: LGR, borderRadius: 10, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, borderTop: `3px solid ${BLU}` }}>
            <div style={{ fontSize: 20 }}>{p.icon}</div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: NAV, letterSpacing: 0.5, fontFamily: "Inter,sans-serif", textTransform: "uppercase" }}>{p.label}</div>
            <div style={{ fontSize: 10.5, color: TMD, lineHeight: 1.55, fontFamily: "Inter,sans-serif" }}>{p.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, background: NAV, borderRadius: 10, padding: "11px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {(["Government Programme", null, "Digital Infrastructure", null, "Beneficiary Impact"] as (string|null)[]).map((item, i) =>
          item === null
            ? <Rt key={i} color={CYN} />
            : <div key={i} style={{ fontSize: 12, fontWeight: 700, color: WHT, fontFamily: "Inter,sans-serif" }}>{item}</div>
        )}
      </div>
      <SlideFooter num={2} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 03 — UNDERSTANDING HOPE-SP
// ─────────────────────────────────────────────────────────────────────────────
function Slide03() {
  const traditional = ["Palliatives", "Fragmented delivery", "Limited visibility", "Manual processes"];
  const hopeSP = ["Identification", "Targeting", "Intervention", "Digital Delivery", "Accountability", "Empowerment", "Sustainable Impact"];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "38px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>HOPE-SP Programme</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: NAV, letterSpacing: -0.7, lineHeight: 1.15, marginBottom: 20, fontFamily: "Inter,sans-serif" }}>From Palliatives to Pathways</h2>
      <div style={{ display: "flex", flex: 1, gap: 20, alignItems: "stretch" }}>
        <div style={{ flex: 1, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "18px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#B91C1C", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, fontFamily: "Inter,sans-serif" }}>Traditional Intervention</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "center" }}>
            {traditional.map((t, i) => (
              <div key={t}>
                <div style={{ background: WHT, border: "1px solid #FECACA", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, color: "#7F1D1D", fontFamily: "Inter,sans-serif" }}>{t}</div>
                {i < traditional.length - 1 && <Dn color="#EF4444" />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <div style={{ width: 1, height: 40, background: MGR }} />
          <div style={{ background: NAV, color: WHT, borderRadius: 20, padding: "8px 12px", fontSize: 9, fontWeight: 700, fontFamily: "Inter,sans-serif", letterSpacing: 1.5, textTransform: "uppercase", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>TRANSFORMS</div>
          <svg width="18" height="28" viewBox="0 0 18 28" fill="none"><path d="M9 0v22M2 16l7 8 7-8" stroke={BLU} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div style={{ width: 1, height: 40, background: MGR }} />
        </div>
        <div style={{ flex: 1.3, background: `linear-gradient(135deg,${NAV} 0%,${NAV2} 100%)`, borderRadius: 12, padding: "18px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CYN, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, fontFamily: "Inter,sans-serif" }}>HOPE-SP</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, justifyContent: "center" }}>
            {hopeSP.map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === hopeSP.length - 1 ? GRN : BLU, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, fontWeight: 600, color: WHT, fontFamily: "Inter,sans-serif" }}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,0.07)", borderRadius: 8, borderLeft: `3px solid ${GRN}` }}>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", fontStyle: "italic" }}>Structured · Measurable · Sustainable</div>
          </div>
        </div>
      </div>
      <SlideFooter num={3} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 04 — THE DISBURSEMENT CHALLENGE
// ─────────────────────────────────────────────────────────────────────────────
function Slide04() {
  const steps = [
    { label: "BENEFICIARY DATA",  desc: "Incomplete / outdated records",                             color: "#DC2626" },
    { label: "VALIDATION",        desc: "NIN / BVN / account verification",                          color: "#EA580C" },
    { label: "ACCOUNT ACCESS",    desc: "Bank / wallet / card requirements",                         color: AMB },
    { label: "DISBURSEMENT",      desc: "Millions of payments requiring controlled execution",        color: BLU },
    { label: "LAST-MILE ACCESS",  desc: "Cash-out and beneficiary accessibility",                    color: "#7C3AED" },
    { label: "RECONCILIATION",    desc: "Confirming what was initiated, processed or exceptional",   color: CYN },
    { label: "REPORTING",         desc: "Programme-level visibility and accountability",             color: NAV2 },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 48px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: "#DC2626", letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>The Challenge</div>
      <h2 style={{ fontSize: 25, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 22, fontFamily: "Inter,sans-serif", maxWidth: 660 }}>
        The Real Challenge Is Not Funding. It Is Delivery at Scale.
      </h2>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 6 }}>
        {steps.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, width: "100%" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: WHT, fontFamily: "Inter,sans-serif" }}>{i+1}</div>
              <div style={{ background: LGR, borderRadius: 8, padding: "10px 10px", borderTop: `3px solid ${s.color}`, textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: NAV, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "Inter,sans-serif", lineHeight: 1.3, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 9.5, color: TMD, lineHeight: 1.45, fontFamily: "Inter,sans-serif" }}>{s.desc}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ margin: "0 4px", marginTop: -18 }}>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h10M6 1l5 4-5 4" stroke={MGR} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "10px 16px", background: `${NAV}12`, borderLeft: `3px solid ${NAV}`, borderRadius: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: NAV, fontFamily: "Inter,sans-serif" }}>
          eTranzact is designed to address each of these operational challenges within a unified digital infrastructure.
        </div>
      </div>
      <SlideFooter num={4} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 05 — eTRANZACT PROPOSITION
// ─────────────────────────────────────────────────────────────────────────────
function Slide05() {
  const left  = ["Beneficiary Data Capture", "NIN & BVN Verification", "Account / Wallet Creation", "Card Issuance", "CorporatePay Disbursement"];
  const right = ["eTranzact Switching Infrastructure", "Bank / Wallet / Card / Agent Access", "Monitoring", "Reconciliation", "Reporting"];
  const itemStyle = { background: LGR, border: `1px solid ${MGR}`, borderRadius: 8, padding: "7px 10px", flex: 1, fontSize: 10.5, fontWeight: 600, color: TDK, fontFamily: "Inter,sans-serif" };
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 48px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>eTranzact Proposition</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 18, fontFamily: "Inter,sans-serif" }}>
        One Integrated Infrastructure. The Entire Disbursement Lifecycle.
      </h2>
      <div style={{ display: "flex", flex: 1, gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {left.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={itemStyle}>{item}</div>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h10M6 1l5 4-5 4" stroke={BLU} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 150, height: 150, borderRadius: "50%", background: `linear-gradient(135deg,${NAV},${NAV2})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 10px ${BLU}18, 0 0 0 22px ${BLU}0A` }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: CYN, letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center", fontFamily: "Inter,sans-serif", lineHeight: 1.5, padding: "0 12px" }}>
              eTRANZACT<br/>DIGITAL<br/>DISBURSEMENT<br/>INFRASTRUCTURE
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 9, color: DGR, fontFamily: "Inter,sans-serif", textAlign: "center", fontStyle: "italic", lineHeight: 1.4, maxWidth: 130 }}>
            Technology-enabled processes supporting the Ministry's programme framework
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {right.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M14 5H4M8 1L2 5l6 4" stroke={BLU} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={itemStyle}>{item}</div>
            </div>
          ))}
        </div>
      </div>
      <SlideFooter num={5} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 06 — CORPORATEPAY HERO
// ─────────────────────────────────────────────────────────────────────────────
function Slide06() {
  const layers = [
    { label: "FMHAPR / HOPE-SP",                  sub: "Programme governance & funding authority",                             accent: "#A78BFA" },
    { label: "CORPORATEPAY",                        sub: "Controlled disbursement engine · upload · approve · authorize",       accent: CYN,      hero: true },
    { label: "eTRANZACT SWITCH",                   sub: "Transaction processing and routing infrastructure",                   accent: "#6B9FE5" },
    { label: "BANKS | WALLETS | CARDS | AGENTS",  sub: "Multi-channel beneficiary access layer",                              accent: "#38BDF8" },
    { label: "BENEFICIARIES",                       sub: "Nationwide household access to programme funds",                     accent: "#34D399" },
  ];
  return (
    <div style={{ background: `linear-gradient(155deg,${NAV} 0%,#070D2F 100%)`, width: "100%", height: "100%", position: "relative", padding: "36px 80px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: CYN, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>Disbursement Engine</div>
      <h2 style={{ fontSize: 38, fontWeight: 900, color: WHT, letterSpacing: -1, lineHeight: 1.05, marginBottom: 4, fontFamily: "Inter,sans-serif" }}>CorporatePay</h2>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 22, fontFamily: "Inter,sans-serif", fontWeight: 500 }}>The Disbursement Engine for HOPE-SP</p>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, justifyContent: "center" }}>
        {layers.map((l, i) => (
          <div key={l.label}>
            <div style={{ background: l.hero ? BLU : "rgba(255,255,255,0.05)", border: l.hero ? `1.5px solid ${CYN}` : "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: l.hero ? "14px 20px" : "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: l.hero ? `0 0 0 3px ${CYN}25` : "none" }}>
              <div>
                <div style={{ fontSize: l.hero ? 14 : 11.5, fontWeight: l.hero ? 800 : 700, color: "rgba(255,255,255,0.9)", fontFamily: "Inter,sans-serif", letterSpacing: l.hero ? -0.2 : 0.5 }}>{l.label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "Inter,sans-serif", marginTop: 2 }}>{l.sub}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.accent }} />
            </div>
            {i < layers.length - 1 && (
              <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v8M2 7l4 3 4-3" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "10px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 8, borderLeft: `3px solid ${CYN}` }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", lineHeight: 1.55 }}>
          CorporatePay enables the Ministry to initiate controlled single and bulk payment instructions to beneficiaries through a structured authorization and approval process.
        </div>
      </div>
      <SlideFooter num={6} dark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 07 — CORPORATEPAY CONTROL FRAMEWORK
// ─────────────────────────────────────────────────────────────────────────────
function Slide07() {
  const steps = ["Payment Preparation","Beneficiary File Upload","Uploader Review / Authorization","Approval Group","Approval Route","Final Authorization","Payment Execution","Reporting"];
  const roles = [
    { role: "Administrator",    tasks: ["Creates users","Configures approval groups","Configures approval routes"],                                          color: "#7C3AED" },
    { role: "Uploader",         tasks: ["Initiates payment","Uploads beneficiary payment batch"],                                                            color: BLU },
    { role: "Approver",         tasks: ["Reviews and approves transactions"],                                                                               color: CYN },
    { role: "Final Authorizer", tasks: ["Performs final payment authorization","Reviews payment information","Accesses payment reports"],                     color: GRN },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "34px 48px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Control Framework</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 18, fontFamily: "Inter,sans-serif" }}>Controlled Disbursement. From Upload to Final Authorization.</h2>
      <div style={{ display: "flex", flex: 1, gap: 20 }}>
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: DGR, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "Inter,sans-serif" }}>Disbursement Workflow</div>
          {steps.map((s, i) => (
            <div key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: i===5?GRN:i===6?NAV:BLU, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: WHT, fontFamily: "Inter,sans-serif", flexShrink: 0 }}>{i+1}</div>
                <div style={{ background: LGR, borderRadius: 6, padding: "7px 12px", flex: 1, fontSize: 11, fontWeight: 600, color: TDK, fontFamily: "Inter,sans-serif" }}>{s}</div>
              </div>
              {i < steps.length - 1 && <div style={{ marginLeft: 10, width: 2, height: 5, background: MGR }} />}
            </div>
          ))}
        </div>
        <div style={{ width: 1, background: MGR }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: DGR, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, fontFamily: "Inter,sans-serif" }}>Segregation of Duties</div>
          {roles.map((r) => (
            <div key={r.role} style={{ background: LGR, borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${r.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAV, marginBottom: 5, fontFamily: "Inter,sans-serif" }}>{r.role}</div>
              {r.tasks.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 2 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: r.color, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ fontSize: 10, color: TMD, fontFamily: "Inter,sans-serif", lineHeight: 1.4 }}>{t}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <SlideFooter num={7} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 08 — CORPORATEPAY CAPABILITIES
// ─────────────────────────────────────────────────────────────────────────────
function Slide08() {
  const caps = [
    { icon: "📦", label: "Bulk Payments",        desc: "One-to-many beneficiary payment processing" },
    { icon: "⬆️", label: "Beneficiary Upload",   desc: "Structured batch payment initiation" },
    { icon: "👥", label: "Approval Groups",       desc: "Users organized by roles and functions" },
    { icon: "🔀", label: "Approval Routes",       desc: "Defined transaction approval hierarchy" },
    { icon: "🔑", label: "Role-Based Access",     desc: "Administrator, uploader, approver, final authorizer" },
    { icon: "✅", label: "Final Authorization",   desc: "Controlled release of payment instructions" },
    { icon: "📊", label: "Payment Reporting",     desc: "View and download payment reports" },
    { icon: "🏦", label: "Account Management",    desc: "Source and holding account configuration" },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>CorporatePay Capabilities</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 20, fontFamily: "Inter,sans-serif" }}>Built for High-Volume Government Disbursement</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, flex: 1 }}>
        {caps.map((c) => (
          <div key={c.label} style={{ background: LGR, borderRadius: 10, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 7, borderBottom: `2px solid ${BLU}` }}>
            <div style={{ fontSize: 22 }}>{c.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif" }}>{c.label}</div>
            <div style={{ fontSize: 10.5, color: TMD, lineHeight: 1.55, fontFamily: "Inter,sans-serif" }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <SlideFooter num={8} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 09 — HOPE-SP DISBURSEMENT ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────
function Slide09() {
  const layers = [
    { label: "HOPE-SP PROGRAMME",                items: ["Programme approval","Beneficiary framework","Funding instruction"],                                      color: "#7C3AED" },
    { label: "eTRANZACT INTEGRATED",             items: ["Data enhancement","NIN/BVN verification","Account/wallet creation","Card infrastructure"],               color: BLU },
    { label: "CORPORATEPAY",                     items: ["Payment preparation","Bulk upload","Approval workflow","Authorization","Disbursement"],                  color: NAV, hero: true },
    { label: "eTRANZACT SWITCH",                 items: ["Transaction processing","Routing infrastructure"],                                                       color: CYN },
    { label: "BENEFICIARY ACCESS",               items: ["Bank Account","Wallet","Card","Agent/Cash-out"],                                                         color: GRN },
    { label: "MONITORING & RECONCILIATION",      items: ["Transaction status","Reports","Audit trail","Programme visibility"],                                     color: AMB },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "30px 48px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 5 }}>End-to-End Architecture</div>
      <h2 style={{ fontSize: 23, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 14, fontFamily: "Inter,sans-serif" }}>From Programme Instruction to Beneficiary Impact</h2>
      <div style={{ display: "flex", flex: 1, gap: 7, alignItems: "stretch" }}>
        {layers.map((l, i) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ background: l.hero ? `${NAV}` : `${l.color}0A`, borderRadius: 10, padding: "10px 11px", borderTop: `3px solid ${l.color}`, display: "flex", flexDirection: "column", minWidth: 110 }}>
              <div style={{ fontSize: 8.5, fontWeight: 800, color: l.hero ? CYN : l.color, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 8, lineHeight: 1.35 }}>{l.label}</div>
              {(l.items).map((item) => (
                <div key={item} style={{ display: "flex", gap: 4, alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: l.hero ? CYN : l.color, flexShrink: 0, marginTop: 4 }} />
                  <div style={{ fontSize: 9.5, color: l.hero ? "rgba(255,255,255,0.75)" : TMD, fontFamily: "Inter,sans-serif", lineHeight: 1.4 }}>{item}</div>
                </div>
              ))}
            </div>
            {i < layers.length - 1 && (
              <div style={{ margin: "0 3px" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M0 6h8M5 2l5 4-5 4" stroke={MGR} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <SlideFooter num={9} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 10 — BENEFICIARY WALLET
// ─────────────────────────────────────────────────────────────────────────────
function Slide10() {
  const channels = [
    { label: "Agent Network",     sub: "Last-mile cash-out and physical access", color: "#7C3AED" },
    { label: "Card",              sub: "Debit card for ATM and POS access",      color: BLU },
    { label: "Bank Account",      sub: "Direct credit to existing accounts",     color: GRN },
    { label: "Digital Channels",  sub: "Mobile and online payment channels",     color: CYN },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Financial Inclusion</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 18, fontFamily: "Inter,sans-serif" }}>Extending HOPE-SP Beyond the Bank Account</h2>
      <div style={{ display: "flex", flex: 1, gap: 32, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ background: LGR, border: `2px solid ${MGR}`, borderRadius: 12, padding: "12px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif" }}>BENEFICIARY</div>
          </div>
          <Dn color={BLU} />
          <div style={{ background: `linear-gradient(135deg,${NAV},${NAV2})`, borderRadius: 16, padding: "18px 24px", textAlign: "center", boxShadow: `0 0 0 8px ${BLU}18` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: CYN, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 8 }}>DIGITAL WALLET</div>
            {["Receive Funds","Store Value","Access Funds","Cash Out"].map((a) => (
              <div key={a} style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "Inter,sans-serif", marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: CYN }} />{a}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9.5, color: DGR, fontFamily: "Inter,sans-serif", textAlign: "center", fontStyle: "italic", lineHeight: 1.5, maxWidth: 180 }}>
            Additional access mechanism for beneficiaries without conventional bank accounts
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="32" height="14" viewBox="0 0 32 14" fill="none"><path d="M0 7h26M20 2l8 5-8 5" stroke={BLU} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ flex: 1.2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {channels.map((c) => (
            <div key={c.label} style={{ background: LGR, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif", marginBottom: 5 }}>{c.label}</div>
              <div style={{ fontSize: 10.5, color: TMD, fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <SlideFooter num={10} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 11 — MULTI-CHANNEL ACCESS
// ─────────────────────────────────────────────────────────────────────────────
function Slide11() {
  const channels = [
    { label: "BANK ACCOUNT",   sub: "Direct account credit",                  icon: "🏦", color: BLU },
    { label: "DIGITAL WALLET", sub: "Wallet-based beneficiary access",        icon: "📱", color: CYN },
    { label: "DEBIT CARD",     sub: "Card-based access to funds",             icon: "💳", color: "#7C3AED" },
    { label: "AGENT NETWORK",  sub: "Last-mile cash-out and physical access", icon: "🏘️", color: GRN },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Beneficiary Access</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 10, fontFamily: "Inter,sans-serif" }}>One Programme. Multiple Paths to Beneficiary Access.</h2>
      <div style={{ marginBottom: 18, background: NAV, borderRadius: 8, padding: "10px 16px", alignSelf: "flex-start" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: WHT, fontFamily: "Inter,sans-serif" }}>HOPE-SP should not depend on a single access channel.</div>
      </div>
      <div style={{ display: "flex", flex: 1, gap: 14 }}>
        {channels.map((c) => (
          <div key={c.label} style={{ flex: 1, background: LGR, borderRadius: 14, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 10, borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 30 }}>{c.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: NAV, letterSpacing: 0.5, fontFamily: "Inter,sans-serif", textTransform: "uppercase" }}>{c.label}</div>
            <div style={{ fontSize: 12, color: TMD, fontFamily: "Inter,sans-serif", lineHeight: 1.55 }}>{c.sub}</div>
            <div style={{ flex: 1 }} />
            <div style={{ height: 2, background: `linear-gradient(to right,${c.color},transparent)`, borderRadius: 1 }} />
          </div>
        ))}
      </div>
      <SlideFooter num={11} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 12 — DISBURSEMENT INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────
function Slide12() {
  const metrics = [
    { label: "Total Disbursement Value",   value: "₦8.4B",    color: BLU },
    { label: "Beneficiaries Processed",    value: "612,000",   color: "#7C3AED" },
    { label: "Successful Transactions",    value: "98.2%",     color: GRN },
    { label: "Exception Transactions",     value: "1.8%",      color: "#EF4444" },
  ];
  const bars = [60,75,55,90,82,95];
  const months = ["Jan","Feb","Mar","Apr","May","Jun"];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "30px 48px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>Disbursement Intelligence</div>
        <span style={{ fontSize: 9, color: AMB, fontWeight: 700, fontFamily: "Inter,sans-serif", border: `1px solid ${AMB}`, borderRadius: 4, padding: "2px 8px" }}>Illustrative HOPE-SP Dashboard Concept</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: NAV, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 14, fontFamily: "Inter,sans-serif" }}>Visibility Across Every Disbursement</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ flex: 1, background: LGR, borderRadius: 8, padding: "9px 14px", borderLeft: `3px solid ${m.color}` }}>
            <div style={{ fontSize: 8.5, color: DGR, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: "Inter,sans-serif", letterSpacing: -0.5 }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flex: 1 }}>
        <div style={{ flex: 1.5, background: LGR, borderRadius: 10, padding: "13px 15px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif", marginBottom: 10 }}>Disbursement Trend</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 75 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", background: `linear-gradient(to top,${BLU},${CYN})`, borderRadius: "3px 3px 0 0", height: `${v}%`, opacity: 0.85 }} />
                <div style={{ fontSize: 8, color: DGR, fontFamily: "Inter,sans-serif" }}>{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, background: LGR, borderRadius: 10, padding: "13px 15px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif", marginBottom: 8 }}>Transaction Status</div>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: "block", margin: "0 auto" }}>
            <circle cx="40" cy="40" r="30" fill="none" stroke={GRN} strokeWidth="14" strokeDasharray={`${0.982*188.5} ${188.5}`} strokeDashoffset="47" />
            <circle cx="40" cy="40" r="30" fill="none" stroke="#EF4444" strokeWidth="14" strokeDasharray={`${0.018*188.5} ${188.5}`} strokeDashoffset={`${-(0.982*188.5)+47}`} />
            <text x="40" y="44" textAnchor="middle" fontSize="10" fontWeight="800" fill={NAV} fontFamily="Inter,sans-serif">98.2%</text>
          </svg>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 12 }}>
            {[{c:GRN,l:"Success"},{c:"#EF4444",l:"Exception"}].map(s => (
              <div key={s.l} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c }} />
                <div style={{ fontSize: 9, color: TMD, fontFamily: "Inter,sans-serif" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1.1, background: LGR, borderRadius: 10, padding: "13px 15px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif", marginBottom: 8 }}>Regional Distribution</div>
          {[{r:"North West",p:35},{r:"North East",p:22},{r:"South South",p:18},{r:"South West",p:15},{r:"Others",p:10}].map(d => (
            <div key={d.r} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <div style={{ fontSize: 9, color: TMD, fontFamily: "Inter,sans-serif" }}>{d.r}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: NAV, fontFamily: "Inter,sans-serif" }}>{d.p}%</div>
              </div>
              <div style={{ height: 4, background: MGR, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${d.p}%`, background: BLU, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <SlideFooter num={12} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 13 — GOVERNANCE, CONTROL & RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────
function Slide13() {
  const pillars = [
    { label: "GOVERNANCE",    items: ["Role-based access","Approval hierarchy","Segregation of duties"],                    color: "#7C3AED" },
    { label: "CONTROL",       items: ["Payment authorization","Batch management","Transaction review"],                     color: BLU },
    { label: "ACCOUNTABILITY",items: ["Reports","Audit trail","Reconciliation","Transaction history"],                     color: GRN },
  ];
  const loop = ["INITIATE","APPROVE","AUTHORIZE","DISBURSE","RECONCILE","REPORT"];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Governance & Accountability</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 22, fontFamily: "Inter,sans-serif" }}>Every Naira Accounted For. Every Instruction Controlled.</h2>
      <div style={{ display: "flex", gap: 14, flex: 1, marginBottom: 16 }}>
        {pillars.map((p) => (
          <div key={p.label} style={{ flex: 1, background: LGR, borderRadius: 12, padding: "20px 20px", borderTop: `4px solid ${p.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: p.color, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 12 }}>{p.label}</div>
            {p.items.map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: TMD, fontFamily: "Inter,sans-serif" }}>{item}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ background: NAV, borderRadius: 12, padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {loop.map((step, i) => (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ background: i===0?BLU:i===loop.length-1?GRN:"rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", fontSize: 10.5, fontWeight: 700, color: WHT, fontFamily: "Inter,sans-serif", letterSpacing: 0.5 }}>{step}</div>
            {i < loop.length - 1 && (
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" style={{ margin: "0 3px" }}><path d="M0 5h14M10 1l6 4-6 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </div>
        ))}
      </div>
      <SlideFooter num={13} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 14 — PROVEN HUMANITARIAN EXPERIENCE
// ─────────────────────────────────────────────────────────────────────────────
function Slide14() {
  const clients = [
    { name: "UNICEF",         color: "#009FDC", stats: [["Beneficiaries","40,000+"],["States","12 Northern"],["Processed","₦47B+"],["Transactions","2.4M"]] },
    { name: "USAID NEI-PLUS", color: "#002868", stats: [["Beneficiaries","5,000+"],["States","2 Northern"],["Processed","₦4B+"],["Transactions","300,000"]] },
    { name: "ICRC / Red Cross",color: "#EF4444",stats: [["Households","42,000"],["Processed","₦2.5B+"],["Transactions","1.008M"],["Duration","2 years"]] },
    { name: "NCTO",            color: GRN,      stats: [["Beneficiaries","176,000+"],["Processed","₦54B+"],["States","3 States"],["Duration","3 years"]] },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Proven Experience</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 18, fontFamily: "Inter,sans-serif" }}>Experience Across Social Protection & Humanitarian Disbursement</h2>
      <div style={{ display: "flex", gap: 12, flex: 1 }}>
        {clients.map((c) => (
          <div key={c.name} style={{ flex: 1, background: LGR, borderRadius: 12, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ borderBottom: `2px solid ${c.color}`, paddingBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: c.color, fontFamily: "Inter,sans-serif" }}>{c.name}</div>
            </div>
            {c.stats.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 8.5, color: DGR, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: NAV, fontFamily: "Inter,sans-serif", letterSpacing: -0.4, marginTop: 1 }}>{value}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: "10px 16px", background: `${NAV}0D`, borderLeft: `3px solid ${BLU}`, borderRadius: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: NAV, fontFamily: "Inter,sans-serif", fontStyle: "italic" }}>
          eTranzact has experience operating within the same social-disbursement environments that HOPE-SP seeks to scale.
        </div>
      </div>
      <SlideFooter num={14} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 15 — GOVERNMENT-SCALE PAYMENT EXPERIENCE
// ─────────────────────────────────────────────────────────────────────────────
function Slide15() {
  const govCaps = [
    { icon: "🏛️", label: "Federal Government Payment Processing" },
    { icon: "💰", label: "FIRS Revenue Collections" },
    { icon: "📊", label: "State IGR Infrastructure" },
    { icon: "🔐", label: "Public-Sector Digital Payment Solutions" },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 80px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Government Scale</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: NAV, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 24, fontFamily: "Inter,sans-serif" }}>Built for the Scale of Government</h2>
      <div style={{ display: "flex", flex: 1, gap: 40, alignItems: "center" }}>
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${NAV},${NAV2})`, borderRadius: 20, padding: "36px 36px", gap: 8 }}>
          <div style={{ fontSize: 58, fontWeight: 900, color: WHT, fontFamily: "Inter,sans-serif", letterSpacing: -2, lineHeight: 1 }}>₦11T+</div>
          <div style={{ width: 48, height: 3, background: CYN, borderRadius: 1, margin: "8px 0" }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", fontFamily: "Inter,sans-serif", textAlign: "center", lineHeight: 1.6 }}>
            Police Salary Payments<br/>Federal Government of Nigeria<br/>Since 2010
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: DGR, fontFamily: "Inter,sans-serif", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Government Payment Capabilities</div>
          {govCaps.map((g) => (
            <div key={g.label} style={{ display: "flex", gap: 12, alignItems: "center", background: LGR, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 20 }}>{g.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TDK, fontFamily: "Inter,sans-serif" }}>{g.label}</div>
            </div>
          ))}
          <div style={{ padding: "10px 14px", background: `${BLU}0F`, borderRadius: 8, borderLeft: `3px solid ${BLU}` }}>
            <div style={{ fontSize: 11, color: NAV, fontFamily: "Inter,sans-serif", fontWeight: 600 }}>20+ years of government payment infrastructure experience</div>
          </div>
        </div>
      </div>
      <SlideFooter num={15} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 16 — WHY eTRANZACT
// ─────────────────────────────────────────────────────────────────────────────
function Slide16() {
  const pillars = [
    { num: "01", label: "Proven Experience",       desc: "20+ years of payment experience and demonstrated social-disbursement engagements." },
    { num: "02", label: "Government Scale",         desc: "Experience supporting large-scale public-sector payment environments." },
    { num: "03", label: "Integrated Infrastructure",desc: "Switching, disbursement, wallets, cards and agent capabilities in one ecosystem." },
    { num: "04", label: "Control & Visibility",     desc: "Structured authorization, payment monitoring, reporting and reconciliation." },
    { num: "05", label: "Nationwide Reach",         desc: "Infrastructure to support beneficiaries across diverse geographic and financial-access environments." },
  ];
  return (
    <div style={{ background: WHT, width: "100%", height: "100%", position: "relative", padding: "36px 56px 44px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: BLU, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>The Case for eTranzact</div>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: NAV, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 22, fontFamily: "Inter,sans-serif" }}>Why eTranzact</h2>
      <div style={{ display: "flex", gap: 12, flex: 1 }}>
        {pillars.map((p, i) => (
          <div key={p.num} style={{ flex: 1, background: i===2?`linear-gradient(135deg,${NAV},${NAV2})`:LGR, borderRadius: 12, padding: "20px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: i===2?"rgba(255,255,255,0.12)":MGR, fontFamily: "Inter,sans-serif", letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>{p.num}</div>
            <div style={{ width: 22, height: 3, background: i===2?CYN:BLU, borderRadius: 2, marginBottom: 10 }} />
            <div style={{ fontSize: 12.5, fontWeight: 700, color: i===2?WHT:NAV, fontFamily: "Inter,sans-serif", marginBottom: 7, lineHeight: 1.3 }}>{p.label}</div>
            <div style={{ fontSize: 11, color: i===2?"rgba(255,255,255,0.65)":TMD, fontFamily: "Inter,sans-serif", lineHeight: 1.6, flex: 1 }}>{p.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, textAlign: "center", padding: "12px 24px", background: NAV, borderRadius: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: WHT, fontFamily: "Inter,sans-serif", letterSpacing: 2.5, textTransform: "uppercase" }}>
          Secure · Inclusive · Transparent · Scalable
        </div>
      </div>
      <SlideFooter num={16} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 17 — PARTNERSHIP / CTA
// ─────────────────────────────────────────────────────────────────────────────
function Slide17() {
  const flow = [
    { label: "Government Funding",             color: "#A78BFA" },
    { label: "Controlled Digital Disbursement", color: CYN },
    { label: "Beneficiary Access",              color: "#34D399" },
    { label: "Measurable Impact",               color: GRN },
  ];
  return (
    <div style={{ background: `linear-gradient(155deg,${NAV} 0%,#060D2A 100%)`, width: "100%", height: "100%", position: "relative", overflow: "hidden", padding: "44px 80px" }}>
      <svg style={{ position: "absolute", right: -80, top: -80, opacity: 0.06 }} width="420" height="420" viewBox="0 0 420 420" fill="none">
        <circle cx="210" cy="210" r="200" stroke={CYN} strokeWidth="80"/>
        <circle cx="210" cy="210" r="120" stroke={BLU} strokeWidth="40"/>
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(to bottom,${BLU},${CYN},${GRN})` }} />
      <div style={{ display: "flex", height: "100%", gap: 48, alignItems: "center" }}>
        <div style={{ flex: 1.2 }}>
          <Logo dark size={22} />
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10, color: CYN, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 8 }}>Partnership Proposal</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: WHT, fontFamily: "Inter,sans-serif", letterSpacing: -0.9, lineHeight: 1.1, marginBottom: 14 }}>
              A Trusted Digital Infrastructure for HOPE-SP
            </h1>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", fontFamily: "Inter,sans-serif", lineHeight: 1.7, maxWidth: 360, marginBottom: 18 }}>
              eTranzact proposes to partner with the Federal Ministry of Humanitarian Affairs and Poverty Reduction as a Digital Disbursement Infrastructure Partner for HOPE-SP.
            </p>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "rgba(255,255,255,0.45)", fontFamily: "Inter,sans-serif", lineHeight: 1.8, fontStyle: "italic" }}>
              From Palliatives to Pathways.<br/>From Government Funding to Beneficiary Impact.
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {flow.map((f, i) => (
            <div key={f.label}>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: f.color, flexShrink: 0 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: WHT, fontFamily: "Inter,sans-serif" }}>{f.label}</div>
              </div>
              {i < flow.length - 1 && <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v8M2 7l4 3 4-3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
            </div>
          ))}
          <div style={{ marginTop: 8, padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif" }}>eTranzact International Plc</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", marginTop: 2 }}>Confidential · For discussion purposes only</div>
          </div>
        </div>
      </div>
      <SlideFooter num={17} dark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slides registry
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES = [
  { id: 1,  title: "Cover",                        component: Slide01 },
  { id: 2,  title: "Executive Proposition",        component: Slide02 },
  { id: 3,  title: "Understanding HOPE-SP",        component: Slide03 },
  { id: 4,  title: "The Disbursement Challenge",   component: Slide04 },
  { id: 5,  title: "eTranzact Proposition",        component: Slide05 },
  { id: 6,  title: "CorporatePay Hero",            component: Slide06 },
  { id: 7,  title: "Control Framework",            component: Slide07 },
  { id: 8,  title: "CorporatePay Capabilities",    component: Slide08 },
  { id: 9,  title: "Disbursement Architecture",    component: Slide09 },
  { id: 10, title: "Beneficiary Wallet",           component: Slide10 },
  { id: 11, title: "Multi-Channel Access",         component: Slide11 },
  { id: 12, title: "Disbursement Intelligence",    component: Slide12 },
  { id: 13, title: "Governance & Control",         component: Slide13 },
  { id: 14, title: "Proven Experience",            component: Slide14 },
  { id: 15, title: "Government Scale",             component: Slide15 },
  { id: 16, title: "Why eTranzact",                component: Slide16 },
  { id: 17, title: "Partnership & Next Steps",     component: Slide17 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function HopePage() {
  const [current, setCurrent] = useState(0);
  const [overview, setOverview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const hiddenRefs = useRef<(HTMLDivElement | null)[]>(Array(SLIDES.length).fill(null));

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(SLIDES.length - 1, c + 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prev();
      if (e.key === "Escape") setOverview(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setScale(Math.min(el.clientWidth / 960, el.clientHeight / 540));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const exportToPptx = useCallback(async () => {
    setExporting(true);
    try {
      const [{ default: PptxGenJS }, { default: html2canvas }] = await Promise.all([
        import("pptxgenjs"),
        import("html2canvas"),
      ]);
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      (pptx as unknown as Record<string,string>).author = "eTranzact International Plc";
      (pptx as unknown as Record<string,string>).title  = "HOPE-SP Digital Disbursement Infrastructure Proposal";
      for (let i = 0; i < SLIDES.length; i++) {
        const el = hiddenRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null });
        const imgData = canvas.toDataURL("image/png");
        const slide = pptx.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
      }
      await pptx.writeFile({ fileName: "eTranzact-HOPE-SP-Proposal.pptx" });
    } catch (err) {
      console.error("PPTX export failed", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const SlideComp = SLIDES[current].component;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#050B1C", userSelect: "none" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Hidden slide containers for PPTX export — rendered off-screen at native 960×540 */}
      <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none", zIndex: -1 }}>
        {SLIDES.map((s, i) => (
          <div key={s.id} ref={el => { hiddenRefs.current[i] = el; }} style={{ width: 960, height: 540, overflow: "hidden", position: "relative" }}>
            <s.component />
          </div>
        ))}
      </div>
      {/* Chrome header */}
      <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <Logo dark size={18} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif", maxWidth: 400, textAlign: "center" }}>
          {SLIDES[current].title}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOverview((o) => !o)} style={{ background: overview ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
            {overview ? "Close" : "All Slides"}
          </button>
          <button onClick={() => window.print()} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
            Print
          </button>
          <button onClick={exportToPptx} disabled={exporting} style={{ background: exporting ? `${BLU}30` : BLU, border: `1px solid ${BLU}`, color: exporting ? "rgba(255,255,255,0.4)" : WHT, fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 6, cursor: exporting ? "default" : "pointer", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            {exporting ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                Exporting…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 7l4 4 4-4M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download PPTX
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview panel */}
      {overview && (
        <div style={{ position: "absolute", inset: 0, top: 46, background: "#050B1C", zIndex: 50, overflowY: "auto", padding: 24 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18, fontFamily: "Inter,sans-serif" }}>
              HOPE-SP Proposal — All Slides
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {SLIDES.map((s, i) => (
                <button key={s.id} onClick={() => { setCurrent(i); setOverview(false); }}
                  style={{ background: current===i ? `${BLU}25` : "rgba(255,255,255,0.04)", border: `1px solid ${current===i?BLU:"rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontSize: 8.5, color: current===i?BLU:"rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>{String(s.id).padStart(2, "0")}</div>
                  <div style={{ fontSize: 11.5, color: current===i?WHT:"rgba(255,255,255,0.55)", fontWeight: 600, fontFamily: "Inter,sans-serif" }}>{s.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slide viewport */}
      <div ref={containerRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: 960, height: 540, transform: `scale(${scale})`, transformOrigin: "center", borderRadius: 4, overflow: "hidden", boxShadow: "0 20px 72px rgba(0,0,0,0.55)" }}>
          <SlideComp />
        </div>
      </div>

      {/* Navigation bar */}
      <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={prev} disabled={current===0} style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: current===0?"default":"pointer", opacity: current===0?0.3:1, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: i===current?18:5, height: 5, borderRadius: 3, border: "none", background: i===current?BLU:"rgba(255,255,255,0.18)", cursor: "pointer", transition: "width 0.2s ease" }} />
          ))}
        </div>

        <button onClick={next} disabled={current===SLIDES.length-1} style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: current===SLIDES.length-1?"default":"pointer", opacity: current===SLIDES.length-1?0.3:1, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>

        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Inter,sans-serif", marginLeft: 6 }}>{current+1} / {SLIDES.length}</span>
      </div>
    </div>
  );
}
