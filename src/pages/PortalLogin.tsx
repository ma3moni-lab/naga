import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { getAsset } from "@/utils/assetLoader";
const nagaHbLogo = getAsset("Naga_HummingBird_Logo-3__2_");

type Portal = "resident" | "guest";

const RESIDENT_ACCOUNTS = [
  { email: "seun.adeleke@email.com", password: "resident", name: "Mr. Seun Adeleke", unit: "A7", estate: "Palm Estate", type: "Owner" },
  { email: "grace.okafor@email.com", password: "resident", name: "Mrs. Grace Okafor", unit: "C3", estate: "Sapphire Court", type: "Tenant" },
  { email: "james.iyede@email.com", password: "resident", name: "Mr. James Iyede", unit: "B12", estate: "Palm Estate", type: "Renter" },
];
const GUEST_ACCOUNTS = [
  { email: "amina.suleiman@email.com", password: "guest", name: "Amina Suleiman" },
  { email: "femi.adeyinka@email.com", password: "guest", name: "Femi Adeyinka" },
];

function BuildingInfographic() {
  const floors = [
    [true, true, false], [false, true, true], [true, false, true],
    [true, true, true], [false, true, false], [true, false, false],
  ];
  return (
    <svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[320px]">
      {/* Blueprint grid */}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 35} x2="340" y2={i * 35} stroke="rgba(107,159,229,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <line key={`v${i}`} x1={i * 38} y1="0" x2={i * 38} y2="420" stroke="rgba(107,159,229,0.06)" strokeWidth="1" />
      ))}

      {/* Ground shadow */}
      <ellipse cx="170" cy="390" rx="100" ry="8" fill="rgba(0,0,0,0.3)" />

      {/* Trees */}
      <rect x="52" y="358" width="6" height="24" fill="rgba(107,159,229,0.3)" rx="2" />
      <ellipse cx="55" cy="352" rx="14" ry="12" fill="rgba(107,159,229,0.15)" stroke="rgba(107,159,229,0.3)" strokeWidth="1" />
      <rect x="278" y="358" width="6" height="24" fill="rgba(107,159,229,0.3)" rx="2" />
      <ellipse cx="281" cy="352" rx="14" ry="12" fill="rgba(107,159,229,0.15)" stroke="rgba(107,159,229,0.3)" strokeWidth="1" />

      {/* Building base / plinth */}
      <rect x="68" y="356" width="204" height="26" rx="3" fill="rgba(107,159,229,0.08)" stroke="rgba(107,159,229,0.25)" strokeWidth="1.2" />
      {/* Entrance door */}
      <rect x="153" y="336" width="34" height="46" rx="3" fill="rgba(107,159,229,0.12)" stroke="rgba(107,159,229,0.35)" strokeWidth="1.2" />
      <circle cx="183" cy="360" r="2.5" fill="#6B9FE5" />
      {/* Door arch */}
      <path d="M153 336 Q170 318 187 336" stroke="rgba(107,159,229,0.4)" strokeWidth="1.2" fill="none" />

      {/* Main building body */}
      <rect x="78" y="82" width="184" height="254" rx="2" fill="rgba(26,22,69,0.5)" stroke="rgba(107,159,229,0.3)" strokeWidth="1.2" />

      {/* Floors */}
      {floors.map((row, fi) => {
        const y = 96 + fi * 40;
        return (
          <g key={fi}>
            <line x1="78" y1={y + 32} x2="262" y2={y + 32} stroke="rgba(107,159,229,0.12)" strokeWidth="0.8" />
            {row.map((lit, wi) => {
              const x = 96 + wi * 58;
              return (
                <g key={wi}>
                  <rect x={x} y={y + 4} width="38" height="24" rx="2"
                    fill={lit ? "rgba(107,159,229,0.2)" : "rgba(255,255,255,0.03)"}
                    stroke={lit ? "rgba(107,159,229,0.5)" : "rgba(107,159,229,0.15)"} strokeWidth="1" />
                  {lit && (
                    <>
                      <rect x={x + 2} y={y + 6} width="34" height="20" rx="1.5" fill="rgba(107,159,229,0.15)" />
                      <line x1={x + 19} y1={y + 4} x2={x + 19} y2={y + 28} stroke="rgba(107,159,229,0.3)" strokeWidth="0.8" />
                      <line x1={x} y1={y + 16} x2={x + 38} y2={y + 16} stroke="rgba(107,159,229,0.2)" strokeWidth="0.8" />
                    </>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Roof / penthouse */}
      <rect x="100" y="54" width="140" height="30" rx="2" fill="rgba(107,159,229,0.1)" stroke="rgba(107,159,229,0.3)" strokeWidth="1.2" />
      <rect x="140" y="38" width="60" height="18" rx="2" fill="rgba(107,159,229,0.08)" stroke="rgba(107,159,229,0.25)" strokeWidth="1" />
      {/* Antenna */}
      <line x1="170" y1="38" x2="170" y2="16" stroke="rgba(107,159,229,0.4)" strokeWidth="1.2" />
      <circle cx="170" cy="14" r="3" fill="#6B9FE5" fillOpacity="0.8" />
      <line x1="158" y1="24" x2="170" y2="16" stroke="rgba(107,159,229,0.3)" strokeWidth="0.8" />
      <line x1="182" y1="24" x2="170" y2="16" stroke="rgba(107,159,229,0.3)" strokeWidth="0.8" />

      {/* Service icons — left side */}
      {/* Wi-Fi */}
      <g transform="translate(4, 100)">
        <rect x="0" y="0" width="52" height="36" rx="6" fill="rgba(107,159,229,0.1)" stroke="rgba(107,159,229,0.25)" strokeWidth="1" />
        <path d="M12 22 Q26 10 40 22" stroke="#6B9FE5" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M17 27 Q26 19 35 27" stroke="#6B9FE5" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="31" r="2" fill="#6B9FE5" />
        <line x1="52" y1="18" x2="78" y2="116" stroke="rgba(107,159,229,0.2)" strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Security */}
      <g transform="translate(4, 170)">
        <rect x="0" y="0" width="52" height="36" rx="6" fill="rgba(107,159,229,0.1)" stroke="rgba(107,159,229,0.25)" strokeWidth="1" />
        <path d="M26 8 L38 13 L38 21 C38 27 32 32 26 33 C20 32 14 27 14 21 L14 13 Z" stroke="#6B9FE5" strokeWidth="1.4" fill="none" />
        <path d="M20 20 L24 24 L32 16" stroke="#6B9FE5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="52" y1="18" x2="78" y2="196" stroke="rgba(107,159,229,0.2)" strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Service icons — right side */}
      {/* Maintenance */}
      <g transform="translate(284, 140)">
        <rect x="0" y="0" width="52" height="36" rx="6" fill="rgba(107,159,229,0.1)" stroke="rgba(107,159,229,0.25)" strokeWidth="1" />
        <path d="M34 10 L38 14 L22 30 L18 26 Z" stroke="#6B9FE5" strokeWidth="1.4" fill="none" />
        <path d="M16 12 Q16 6 22 6 L20 10 L22 14 L18 16 Z" stroke="#6B9FE5" strokeWidth="1.2" fill="none" />
        <line x1="0" y1="18" x2="-206" y2="166" stroke="rgba(107,159,229,0.2)" strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Pool/Amenity */}
      <g transform="translate(284, 220)">
        <rect x="0" y="0" width="52" height="36" rx="6" fill="rgba(107,159,229,0.1)" stroke="rgba(107,159,229,0.25)" strokeWidth="1" />
        <rect x="10" y="12" width="32" height="16" rx="3" stroke="#6B9FE5" strokeWidth="1.2" fill="none" />
        <path d="M10 19 Q18 15 26 19 Q34 23 42 19" stroke="#6B9FE5" strokeWidth="1.2" fill="none" />
        <line x1="0" y1="18" x2="-206" y2="246" stroke="rgba(107,159,229,0.2)" strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Floor labels */}
      {["G", "1", "2", "3", "4", "5", "PH"].map((label, i) => {
        const y = i === 6 ? 68 : i === 0 ? 344 : 96 + (5 - i) * 40 + 12;
        return (
          <text key={label} x="68" y={y} textAnchor="end" fontSize="8" fill="rgba(107,159,229,0.35)" fontFamily="var(--font-mono)" dominantBaseline="middle">{label}</text>
        );
      })}
    </svg>
  );
}

export default function PortalLogin() {
  const navigate = useNavigate();
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (selectedPortal === "resident") {
        const acc = RESIDENT_ACCOUNTS.find(a => a.email === email && a.password === password);
        if (!acc) { setError("Invalid email or password."); return; }
        sessionStorage.setItem("naga_resident", JSON.stringify({ name: acc.name, unit: acc.unit, estate: acc.estate, type: acc.type }));
        navigate("/admin/resident");
      } else {
        const acc = GUEST_ACCOUNTS.find(a => a.email === email && a.password === password);
        if (!acc) { setError("Invalid email or password."); return; }
        sessionStorage.setItem("naga_guest", JSON.stringify({ name: acc.name, email: acc.email }));
        navigate("/admin/guest");
      }
    }, 800);
  };

  return (
    <div className="h-full flex overflow-hidden" style={{ fontFamily: "var(--font-sans)", background: "#0f0d2e" }}>

      {/* Left — infographic panel */}
      <div className="hidden lg:flex flex-col w-[46%] shrink-0 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #1a1645 0%, #0f0d2e 100%)" }}>
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(107,159,229,0.08) 0%, transparent 70%)" }} />

        {/* Top brand */}
        <div className="relative z-10 flex items-center px-10 pt-10">
          <img
            src={nagaHbLogo}
            alt="NAGA Hummingbird Properties"
            style={{ height: 44, objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* Headline */}
        <div className="relative z-10 px-10 mt-8">
          <div className="text-[11px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#6B9FE5" }}>Resident & Guest Portal</div>
          <h1 className="text-white leading-tight mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 36px)" }}>
            Your home,<br />
            <span style={{ color: "#6B9FE5" }}>managed.</span>
          </h1>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            Access your estate services, pay facility charges, raise maintenance requests, and manage your NAGA Stays reservations.
          </p>
        </div>

        {/* Building illustration */}
        <div className="relative z-10 flex-1 flex items-end justify-center px-6 pb-2">
          <BuildingInfographic />
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-px mx-8 mb-8 rounded-xl overflow-hidden" style={{ background: "rgba(107,159,229,0.12)", border: "1px solid rgba(107,159,229,0.15)" }}>
          {[
            { value: "2", label: "Managed Estates" },
            { value: "120+", label: "Residential Units" },
            { value: "24/7", label: "Support Access" },
          ].map((s) => (
            <div key={s.label} className="px-4 py-4 text-center" style={{ background: "rgba(26,22,69,0.7)" }}>
              <div className="font-bold text-[18px] text-white">{s.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(107,159,229,0.6)" }}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Right — login form */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: "#FAFBFC" }}>
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center px-4 pt-6 pb-3">
          <img src={nagaHbLogo} alt="NAGA Hummingbird Properties" style={{ height: 36, objectFit: "contain", maxWidth: 160 }} />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6">
          <div className="w-full max-w-[420px]">

            {!selectedPortal ? (
              <>
                <div className="mb-8">
                  <h2 className="text-[28px] font-semibold mb-2" style={{ fontFamily: "var(--font-display)", color: "#1a1645" }}>
                    Welcome back
                  </h2>
                  <p className="text-[14px]" style={{ color: "#69707D" }}>Select your account type to continue.</p>
                </div>

                <div className="space-y-3 mb-8">
                  <button
                    onClick={() => setSelectedPortal("resident")}
                    className="w-full text-left group relative flex items-start gap-4 p-5 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "white", border: "1.5px solid #E8EAF0" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#25205B"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8EAF0"; }}
                  >
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #25205B 0%, #312a72 100%)" }}>
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M11 2L20 7.5v12H2V7.5L11 2z" stroke="white" strokeWidth="1.5" fill="none" />
                        <path d="M8 19.5v-7h6v7" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
                        <rect x="9.5" y="6.5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.7)" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px] mb-1" style={{ color: "#1a1645" }}>Estate Resident</div>
                      <div className="text-[12px] leading-relaxed" style={{ color: "#69707D" }}>Owners, tenants &amp; renters in NAGA-managed estates. Pay service charges, raise maintenance requests.</div>
                    </div>
                    <svg className="shrink-0 mt-1 opacity-30 group-hover:opacity-70 transition-opacity" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#25205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>

                  <button
                    onClick={() => setSelectedPortal("guest")}
                    className="w-full text-left group relative flex items-start gap-4 p-5 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "white", border: "1.5px solid #E8EAF0" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6B9FE5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8EAF0"; }}
                  >
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d5a8a 0%, #6B9FE5 100%)" }}>
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M3 9L11 3l8 6v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="white" strokeWidth="1.5" fill="none" />
                        <rect x="8" y="12" width="6" height="8" rx="1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" fill="none" />
                        <rect x="9.5" y="6" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.7)" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px] mb-1" style={{ color: "#1a1645" }}>NAGA Stays Guest</div>
                      <div className="text-[12px] leading-relaxed" style={{ color: "#69707D" }}>Short-let &amp; serviced apartment guests. Browse units, manage bookings, check-in instructions.</div>
                    </div>
                    <svg className="shrink-0 mt-1 opacity-30 group-hover:opacity-70 transition-opacity" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#6B9FE5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>

                <div className="text-center">
                  <Link to="/" className="text-[12px]" style={{ color: "#69707D" }}>← Return to main website</Link>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => { setSelectedPortal(null); setError(""); setEmail(""); setPassword(""); }}
                  className="flex items-center gap-2 mb-6 text-[13px] font-medium transition-colors hover:opacity-70" style={{ color: "#6B9FE5" }}>
                  ← Back
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: selectedPortal === "resident" ? "#25205B" : "#6B9FE5" }}>
                      {selectedPortal === "resident" ? (
                        <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M11 2L20 7.5v12H2V7.5L11 2z" stroke="white" strokeWidth="1.5" fill="none" /><path d="M8 19.5v-7h6v7" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M3 9L11 3l8 6v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="white" strokeWidth="1.5" fill="none" /><rect x="8" y="12" width="6" height="8" rx="1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" fill="none" /></svg>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[18px]" style={{ fontFamily: "var(--font-display)", color: "#1a1645" }}>
                        {selectedPortal === "resident" ? "Estate Resident" : "NAGA Stays Guest"}
                      </div>
                      <div className="text-[11px]" style={{ color: "#69707D" }}>Sign in to your portal</div>
                    </div>
                  </div>
                </div>

                {/* Demo accounts — click to auto-fill & sign in */}
                <div className="mb-5 rounded-xl overflow-hidden" style={{ border: "1px solid #D3E3F9" }}>
                  <div className="px-3.5 py-2 text-[11px] font-semibold" style={{ background: "#EAF2FC", color: "#25205B" }}>
                    Demo accounts — click any to sign in instantly
                  </div>
                  <div className="divide-y bg-white" style={{ borderTop: "1px solid #D3E3F9" }}>
                    {(selectedPortal === "resident" ? RESIDENT_ACCOUNTS : GUEST_ACCOUNTS).map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        onClick={() => {
                          setEmail(a.email);
                          setPassword(a.password);
                          setError("");
                          setLoading(true);
                          setTimeout(() => {
                            setLoading(false);
                            if (selectedPortal === "resident") {
                              const acc = RESIDENT_ACCOUNTS.find(r => r.email === a.email)!;
                              sessionStorage.setItem("naga_resident", JSON.stringify({ name: acc.name, unit: acc.unit, estate: acc.estate, type: acc.type }));
                              navigate("/admin/resident");
                            } else {
                              const acc = GUEST_ACCOUNTS.find(g => g.email === a.email)!;
                              sessionStorage.setItem("naga_guest", JSON.stringify({ name: acc.name, email: acc.email }));
                              navigate("/admin/guest");
                            }
                          }, 600);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F7F8FA]"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white" style={{ background: selectedPortal === "resident" ? "#25205B" : "#6B9FE5" }}>
                          {a.name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold" style={{ color: "#252731" }}>{a.name}</div>
                          <div className="text-[10px] truncate" style={{ color: "#9DA8C0" }}>{a.email}</div>
                        </div>
                        {"unit" in a && (
                          <div className="text-[10px] shrink-0 font-medium" style={{ color: "#6B9FE5" }}>Unit {(a as typeof RESIDENT_ACCOUNTS[0]).unit}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#69707D" }}>Email Address</label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                      style={{ border: "1.5px solid #E8EAF0", background: "white", color: "#252731", fontFamily: "var(--font-sans)" }}
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
                      style={{ border: "1.5px solid #E8EAF0", background: "white", color: "#252731", fontFamily: "var(--font-sans)" }}
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
                    style={{ background: selectedPortal === "resident" ? "linear-gradient(135deg, #25205B 0%, #312a72 100%)" : "linear-gradient(135deg, #3d5a8a 0%, #6B9FE5 100%)" }}
                  >
                    {loading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="px-4 pb-6 text-center">
          <p className="text-[11px]" style={{ color: "#B0B8C4" }}>
            © 2025 NAGA Hummingbird Properties Ltd
          </p>
        </div>
      </div>
    </div>
  );
}
