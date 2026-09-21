import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { StaffRole } from "../portals/PlatformGate";
import { getAsset } from "@/utils/assetLoader";
const nagaAllWhite = getAsset("Naga_Construction_logo_all_white");
const nagaNavyLogo  = getAsset("Naga_Construction_logo");

const STAFF_ROLES: { role: StaffRole; abbr: string; title: string; desc: string; color: string }[] = [
  { role: "ceo", abbr: "CEO", title: "Chief Executive Officer", desc: "Full platform access & final authority", color: "#D4AF37" },
  { role: "admin", abbr: "ADM", title: "Admin Officer", desc: "Administration, approvals & operations", color: "#C084FC" },
  { role: "howo", abbr: "HOWO", title: "Head of Works and Operations", desc: "State-wide operations & project oversight", color: "#a78bfa" },
  { role: "finance", abbr: "FIN", title: "Finance Manager", desc: "Disbursements & budgets", color: "#6B9FE5" },
  { role: "pco", abbr: "PCO", title: "Project Chartered Officer", desc: "Phase reports & monitoring", color: "#8eb6ec" },
  { role: "prm", abbr: "PRM", title: "Personnel Resource Mgr", desc: "Labour & site personnel", color: "#f59e0b" },
  { role: "ivm", abbr: "IVM", title: "Inventory & Resource Mgr", desc: "Materials & stock", color: "#b0ccf3" },
  { role: "estate", abbr: "EST", title: "Estate Manager", desc: "Residents & estates", color: "#6B9FE5" },
  { role: "cso", abbr: "CSO", title: "Customer Support Officer", desc: "Resident support & service relations", color: "#34D1BF" },
];

const STAFF_ACCOUNTS: { email: string; password: string; name: string; role: StaffRole; location?: string }[] = [
  { email: "emeka.okonkwo@naga.com", password: "staff", name: "Emeka Okonkwo", role: "ceo" },
  { email: "chukwuma.eze@naga.com", password: "staff", name: "Chukwuma Eze", role: "howo", location: "Abuja" },
  { email: "chioma.ezinwa@naga.com", password: "staff", name: "Chioma Ezinwa", role: "finance" },
  { email: "kola.adekunle@naga.com", password: "staff", name: "Kola Adekunle", role: "pco", location: "Abuja" },
  { email: "ibrahim.garba@naga.com", password: "staff", name: "Ibrahim Garba", role: "prm" },
  { email: "samuel.ekele@naga.com", password: "staff", name: "Samuel Ekele", role: "ivm", location: "Abuja" },
  { email: "blessing.omosu@naga.com", password: "staff", name: "Blessing Omosu", role: "estate" },
  { email: "chukwudi.obi@naga.com", password: "staff", name: "Chukwudi Obi", role: "admin" },
  { email: "ngozi.nwosu@naga.com", password: "staff", name: "Ngozi Nwosu", role: "cso" },
];

function WorkflowInfographic() {
  const steps = [
    { label: "PRM", sub: "Requests", color: "#f59e0b" },
    { label: "HOWO", sub: "Approves", color: "#a78bfa" },
    { label: "CEO", sub: "Authorises", color: "#D4AF37" },
    { label: "IVM", sub: "Verifies", color: "#9DA8C0" },
    { label: "PCO", sub: "Confirms", color: "#6B9FE5" },
  ];
  const xs = [30, 90, 150, 210, 270];
  return (
    <svg viewBox="0 0 320 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[300px]">
      {steps.map((s, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={40} r={22} fill="rgba(26,22,69,0.8)" stroke={s.color} strokeWidth="1.3" />
          <text x={xs[i]} y={44} textAnchor="middle" fontSize="9" fontWeight="700" fill={s.color} fontFamily="var(--font-mono)">{s.label}</text>
          <text x={xs[i]} y={76} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-sans)">{s.sub}</text>
          {i < steps.length - 1 && (
            <line x1={xs[i] + 23} y1={40} x2={xs[i + 1] - 23} y2={40} stroke={`rgba(${s.color === "#D4AF37" ? "212,175,55" : "107,159,229"},0.3)`} strokeWidth="1.2" strokeDasharray="3 3" />
          )}
        </g>
      ))}
      <text x="160" y="95" textAnchor="middle" fontSize="8" fill="rgba(107,159,229,0.25)" fontFamily="var(--font-mono)">MATERIAL REQUEST APPROVAL CHAIN</text>
    </svg>
  );
}

const HOWO_COVERAGE_AREAS = ["Abuja", "Lagos", "Benin City"] as const;
type HOWOCoverage = typeof HOWO_COVERAGE_AREAS[number];

type PendingAuth = { name: string; role: StaffRole; location?: string };

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StaffLogin() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<StaffRole>("ceo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [howoCoverage, setHowoCoverage] = useState<HOWOCoverage>("Abuja");

  // 2FA state
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerKey, setTimerKey] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const activeRole = STAFF_ROLES.find(r => r.role === selectedRole)!;

  // Countdown timer for OTP step
  useEffect(() => {
    if (step !== "otp") return;
    setTimerSeconds(300);
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerKey]);

  // Auto-verify when all 6 digits are filled
  useEffect(() => {
    if (step !== "otp") return;
    if (otpDigits.every(d => d !== "")) {
      verifyOtp(otpDigits.join(""));
    }
  }, [otpDigits]);

  function startOtpStep(auth: PendingAuth) {
    const code = generateOtp();
    setOtpCode(code);
    setOtpDigits(Array(6).fill(""));
    setOtpAttempts(0);
    setOtpError("");
    setResendMsg("");
    setTimerKey(k => k + 1);
    setPendingAuth(auth);
    setStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 80);
  }

  function verifyOtp(entered: string) {
    if (timerSeconds === 0) {
      setOtpError("Verification code has expired. Please request a new code.");
      return;
    }
    if (entered === otpCode) {
      if (!pendingAuth) return;
      const staffData = { ...pendingAuth };
      sessionStorage.setItem("naga_staff", JSON.stringify(staffData));
      navigate("/admin/staff/dashboard");
    } else {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      setOtpDigits(Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 40);
      if (newAttempts >= 3) {
        setOtpError("Too many incorrect attempts. Please request a new code.");
      } else {
        setOtpError(`Incorrect code. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} remaining.`);
      }
    }
  }

  function handleResend() {
    const code = generateOtp();
    setOtpCode(code);
    setOtpDigits(Array(6).fill(""));
    setOtpAttempts(0);
    setOtpError("");
    setResendMsg("Code resent successfully.");
    setTimerKey(k => k + 1);
    setTimeout(() => {
      setResendMsg("");
      otpRefs.current[0]?.focus();
    }, 2500);
  }

  function handleOtpChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[idx] = digit;
    setOtpDigits(newDigits);
    setOtpError("");
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otpDigits[idx] === "" && idx > 0) {
        const newDigits = [...otpDigits];
        newDigits[idx - 1] = "";
        setOtpDigits(newDigits);
        otpRefs.current[idx - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[idx] = "";
        setOtpDigits(newDigits);
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpPaste(idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      if (idx + i < 6) newDigits[idx + i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const nextFocus = Math.min(idx + pasted.length, 5);
    otpRefs.current[nextFocus]?.focus();
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const acc = STAFF_ACCOUNTS.find(a => a.email === email && a.password === password && a.role === selectedRole);
      if (!acc) {
        const emailOnly = STAFF_ACCOUNTS.find(a => a.email === email);
        if (emailOnly && emailOnly.role !== selectedRole) {
          setError(`This account belongs to the ${STAFF_ROLES.find(r => r.role === emailOnly.role)?.title} role. Please select the correct role.`);
        } else {
          setError("Invalid email or password.");
        }
        return;
      }
      const auth: PendingAuth = { name: acc.name, role: acc.role, location: acc.role === "howo" ? howoCoverage : (acc.location ?? undefined) };
      startOtpStep(auth);
    }, 800);
  };

  return (
    <div className="h-full flex overflow-hidden" style={{ fontFamily: "var(--font-sans)", background: "#0f0d2e" }}>

      {/* Left — visual panel */}
      <div className="hidden lg:flex flex-col w-[46%] shrink-0 relative overflow-hidden" style={{ background: "#080718" }}>

        {/* Brand bar */}
        <div className="relative z-20 flex items-center justify-between px-8 pt-8 pb-0">
          <div className="flex items-center">
            <img src={nagaAllWhite} alt="NAGA Prime Construction" style={{ height: 40, objectFit: "contain", maxWidth: 180 }} />
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>
            Staff Only
          </div>
        </div>

        {/* Hero tagline */}
        <div className="relative z-20 px-8 mt-7 mb-5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: "rgba(212,175,55,0.6)" }}>Unified Operations Platform</p>
          <h1 className="leading-[1.12] text-white" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 2.6vw, 36px)" }}>
            Building Nigeria's<br />
            <span style={{ color: "#D4AF37" }}>finest addresses.</span>
          </h1>
        </div>

        {/* Photo mosaic */}
        <div className="relative z-20 mx-8 flex gap-2.5" style={{ height: "280px" }}>
          {/* Main estate image */}
          <div className="relative flex-[3] rounded-2xl overflow-hidden" style={{ background: "#1a1645" }}>
            <img
              src="https://images.unsplash.com/photo-1643297550841-1386b3a10612?w=600&h=560&fit=crop&auto=format"
              alt="NAGA Palm Estate — luxury residential development"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,7,24,0.85) 0%, rgba(8,7,24,0.1) 55%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#D4AF37" }}>Estate · Palm Estate</div>
              <div className="text-white text-[12px] font-semibold leading-tight">Residential · Abuja</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4AF37" }} />
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>48 units · Active</span>
              </div>
            </div>
          </div>

          {/* Right column: two stacked */}
          <div className="flex-[2] flex flex-col gap-2.5">
            {/* Construction aerial */}
            <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ background: "#0f0d2e" }}>
              <img
                src="https://images.unsplash.com/photo-1685266325960-8ea392f6f026?w=400&h=200&fit=crop&auto=format"
                alt="NAGA Sapphire Court — active construction site aerial"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,7,24,0.8) 0%, transparent 55%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-[8px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#6B9FE5" }}>Construction</div>
                <div className="text-white text-[11px] font-semibold">Sapphire Court</div>
                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Lagos · 68% complete</div>
              </div>
            </div>

            {/* City development */}
            <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ background: "#0f0d2e" }}>
              <img
                src="https://images.unsplash.com/photo-1639774274707-09c80b4f53e3?w=400&h=200&fit=crop&auto=format"
                alt="NAGA development portfolio — Abuja skyline"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,7,24,0.85) 0%, transparent 55%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-[8px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#a78bfa" }}>Development</div>
                <div className="text-white text-[11px] font-semibold">Royal Heights</div>
                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Benin City · Planning</div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio stats */}
        <div className="relative z-20 mx-8 mt-5 grid grid-cols-4 gap-2">
          {[
            { value: "₦850M", label: "Portfolio", sub: "value" },
            { value: "3", label: "Active", sub: "projects" },
            { value: "2", label: "Managed", sub: "estates" },
            { value: "116", label: "Total", sub: "units" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-3 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="font-bold text-[15px] leading-none" style={{ color: "#D4AF37", fontFamily: "var(--font-mono)" }}>{s.value}</div>
              <div className="text-[9px] mt-1.5 leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}<br />{s.sub}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: "#FAFBFC" }}>
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center px-4 pt-6 pb-3">
          <img src={nagaNavyLogo} alt="NAGA Prime Construction" style={{ height: 36, objectFit: "contain", maxWidth: 160 }} />
        </div>

        <div className="flex-1 px-4 sm:px-8 py-10 flex flex-col items-center">
          <div className="w-full max-w-[420px]">

            {step === "credentials" ? (
              <>
                <div className="mb-7">
                  <h2 className="text-[28px] font-semibold mb-2" style={{ fontFamily: "var(--font-display)", color: "#1a1645" }}>
                    Staff sign in
                  </h2>
                  <p className="text-[14px]" style={{ color: "#69707D" }}>Select your role and enter your credentials.</p>
                </div>

                {/* Role selector grid */}
                <div className="mb-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#69707D" }}>Your Role</label>
                  <div className="grid grid-cols-4 gap-2">
                    {STAFF_ROLES.map((r) => {
                      const isActive = selectedRole === r.role;
                      return (
                        <button
                          key={r.role}
                          onClick={() => setSelectedRole(r.role)}
                          title={r.title}
                          className="flex flex-col items-center py-2.5 px-1 rounded-xl transition-all text-center"
                          style={{
                            background: isActive ? "white" : "rgba(255,255,255,0.5)",
                            border: isActive ? `2px solid ${r.color}` : "1.5px solid #E8EAF0",
                            boxShadow: isActive ? `0 0 0 3px ${r.color}22` : "none",
                          }}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold mb-1.5"
                            style={{ background: isActive ? r.color : "rgba(107,159,229,0.08)", color: isActive ? "white" : "#9DA8C0" }}>
                            {r.abbr}
                          </div>
                          <span className="text-[9px] leading-tight font-medium" style={{ color: isActive ? "#1a1645" : "#9DA8C0" }}>
                            {r.abbr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Active role detail */}
                  <div className="mt-2 px-3 py-2 rounded-lg text-[11px] flex items-center gap-2" style={{ background: "rgba(37,32,91,0.04)", border: "1px solid #E8EAF0" }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: activeRole.color }} />
                    <span style={{ color: "#69707D" }}><strong style={{ color: "#25205B" }}>{activeRole.title}</strong> — {activeRole.desc}</span>
                  </div>

                  {/* HOWO state coverage selector */}
                  {selectedRole === "howo" && (
                    <div className="mt-3 p-3 rounded-xl" style={{ background: "#FFF7ED", border: "1px solid #FDE68A" }}>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#92400e" }}>
                        State Coverage Area
                      </label>
                      <div className="flex gap-2">
                        {HOWO_COVERAGE_AREAS.map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => setHowoCoverage(area)}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              background: howoCoverage === area ? "#92400e" : "white",
                              color: howoCoverage === area ? "white" : "#92400e",
                              border: `1px solid ${howoCoverage === area ? "#92400e" : "#FDE68A"}`,
                            }}
                          >{area}</button>
                        ))}
                      </div>
                      <p className="text-[10px] mt-1.5" style={{ color: "#a16207" }}>HOWO can only view projects and activities within this state</p>
                    </div>
                  )}
                </div>

                {/* Demo credentials — click to auto-fill & sign in */}
                <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #D3E3F9" }}>
                  <button
                    type="button"
                    onClick={() => setShowDemo(!showDemo)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-[11px] font-semibold transition-colors hover:opacity-90"
                    style={{ background: "#EAF2FC", color: "#25205B" }}
                  >
                    <span>Demo accounts — click any to sign in instantly</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showDemo ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {showDemo && (
                    <div className="divide-y divide-[#F0F2F5]" style={{ background: "white", borderTop: "1px solid #D3E3F9" }}>
                      {STAFF_ACCOUNTS.map((a) => {
                        const roleMeta = STAFF_ROLES.find(r => r.role === a.role)!;
                        return (
                          <button
                            key={a.role}
                            type="button"
                            onClick={() => {
                              setSelectedRole(a.role);
                              setEmail(a.email);
                              setPassword(a.password);
                              setError("");
                              const auth: PendingAuth = { name: a.name, role: a.role, location: a.role === "howo" ? howoCoverage : (a.location ?? undefined) };
                              startOtpStep(auth);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F7F8FA]"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: roleMeta.color + "22", color: roleMeta.color }}>
                              {roleMeta.abbr}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>{a.name}</div>
                              <div className="text-[10px] truncate" style={{ color: "#9DA8C0" }}>{a.email}</div>
                            </div>
                            <div className="text-[10px] font-semibold shrink-0" style={{ color: roleMeta.color }}>{roleMeta.title}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Work Email</label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder={`e.g. ${STAFF_ACCOUNTS.find(a => a.role === selectedRole)?.email ?? "name@naga.com"}`}
                      className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                      style={{ border: "1.5px solid #E8EAF0", background: "white", color: "#252731" }}
                      onFocus={(e) => { e.target.style.borderColor = "#25205B"; e.target.style.boxShadow = "0 0 0 3px rgba(37,32,91,0.08)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#E8EAF0"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Password</label>
                    <input
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                      style={{ border: "1.5px solid #E8EAF0", background: "white", color: "#252731" }}
                      onFocus={(e) => { e.target.style.borderColor = "#25205B"; e.target.style.boxShadow = "0 0 0 3px rgba(37,32,91,0.08)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#E8EAF0"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl px-4 py-3 text-[12px] font-medium" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626" }}>{error}</div>
                  )}

                  <button
                    type="submit" disabled={loading}
                    className="w-full py-4 font-semibold text-[14px] rounded-xl text-white transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0 disabled:shadow-none"
                    style={{ background: "linear-gradient(135deg, #1a1645 0%, #25205B 100%)" }}
                  >
                    {loading ? "Signing in…" : `Sign In as ${activeRole.abbr} →`}
                  </button>
                  <p className="text-center text-[12px] mt-3" style={{ color: "#B0B8C4" }}>
                    Forgotten your password?{" "}
                    <a href="mailto:it@naga.com" className="font-medium hover:underline" style={{ color: "#6B9FE5" }}>
                      Contact IT support
                    </a>
                  </p>
                </form>
              </>
            ) : (
              /* OTP / 2FA Step */
              <>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-5">
                    {/* Shield icon */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(37,32,91,0.07)", border: "1.5px solid rgba(37,32,91,0.12)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L4 6.5V11c0 4.5 3.4 8.7 8 9.9 4.6-1.2 8-5.4 8-9.9V6.5L12 3z" stroke="#25205B" strokeWidth="1.6" fill="none" />
                        <path d="M9 12l2 2 4-4" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-[24px] font-semibold leading-tight" style={{ fontFamily: "var(--font-display)", color: "#1a1645" }}>
                        Verification Required
                      </h2>
                      <p className="text-[13px] mt-0.5" style={{ color: "#69707D" }}>
                        Signed in as <strong style={{ color: "#25205B" }}>{pendingAuth?.name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className="rounded-xl px-4 py-3.5 flex gap-3" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.28)" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="8" cy="8" r="7" stroke="#D4AF37" strokeWidth="1.3" fill="none" />
                      <path d="M8 7v4M8 5.5v.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-[12px] leading-relaxed" style={{ color: "#92711A" }}>
                      Your verification code is{" "}
                      <span className="font-bold tracking-widest" style={{ color: "#1a1645", fontFamily: "var(--font-mono)" }}>{otpCode}</span>
                      {" "}— in a real deployment this is sent to your registered phone/email.
                    </p>
                  </div>
                </div>

                {/* OTP digit inputs */}
                <div className="mb-5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#69707D" }}>
                    Enter 6-digit code
                  </label>
                  <div className="flex gap-2.5 justify-between">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={timerSeconds === 0 || otpAttempts >= 3}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        onPaste={e => handleOtpPaste(idx, e)}
                        onFocus={e => {
                          e.target.style.borderColor = "#D4AF37";
                          e.target.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.18)";
                          e.target.style.background = "white";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = digit ? "#25205B" : "#E8EAF0";
                          e.target.style.boxShadow = "none";
                          e.target.style.background = digit ? "rgba(37,32,91,0.03)" : "white";
                        }}
                        className="flex-1 text-center font-bold rounded-xl outline-none transition-all select-none disabled:opacity-40"
                        style={{
                          height: "60px",
                          minWidth: "44px",
                          fontSize: "22px",
                          fontFamily: "var(--font-mono)",
                          color: "#1a1645",
                          border: digit ? "2px solid #25205B" : "1.5px solid #E8EAF0",
                          background: digit ? "rgba(37,32,91,0.03)" : "white",
                          boxShadow: "none",
                          caretColor: "#D4AF37",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    {timerSeconds > 0 ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="5.5" stroke="#9DA8C0" strokeWidth="1.2" fill="none" />
                          <path d="M6.5 4v3l2 1.2" stroke="#9DA8C0" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <span className="text-[12px] font-medium" style={{ color: timerSeconds <= 60 ? "#DC2626" : "#69707D" }}>
                          Code expires in{" "}
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            {formatTimer(timerSeconds)}
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] font-semibold" style={{ color: "#DC2626" }}>
                        Code has expired
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[12px] font-semibold hover:underline transition-opacity hover:opacity-80"
                    style={{ color: "#6B9FE5" }}
                  >
                    Resend code
                  </button>
                </div>

                {/* Feedback messages */}
                {resendMsg && (
                  <div className="mb-3 rounded-xl px-4 py-3 text-[12px] font-medium flex items-center gap-2" style={{ background: "#F0F7FF", border: "1px solid #93C5FD", color: "#1D4ED8" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#1D4ED8" strokeWidth="1.2" fill="none" />
                      <path d="M4.5 7l2 2 3-3" stroke="#1D4ED8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {resendMsg}
                  </div>
                )}

                {otpError && (
                  <div className="mb-3 rounded-xl px-4 py-3 text-[12px] font-medium" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626" }}>
                    {otpError}
                  </div>
                )}

                {/* Manual verify button (fallback if auto-submit doesn't trigger) */}
                <button
                  type="button"
                  disabled={otpDigits.some(d => d === "") || timerSeconds === 0 || otpAttempts >= 3}
                  onClick={() => verifyOtp(otpDigits.join(""))}
                  className="w-full py-4 font-semibold text-[14px] rounded-xl text-white transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
                  style={{ background: "linear-gradient(135deg, #1a1645 0%, #25205B 100%)" }}
                >
                  Verify &amp; Continue →
                </button>

                {/* Back link */}
                <p className="text-center text-[12px] mt-4" style={{ color: "#B0B8C4" }}>
                  <button
                    type="button"
                    onClick={() => { setStep("credentials"); setOtpError(""); setResendMsg(""); }}
                    className="font-medium hover:underline"
                    style={{ color: "#6B9FE5" }}
                  >
                    ← Back to sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        <div className="px-4 pb-6 text-center">
          <p className="text-[11px]" style={{ color: "#B0B8C4" }}>
            <Link to="/" className="hover:underline" style={{ color: "#B0B8C4" }}>← Main Website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
