import { useState } from "react";

export type PortalMode = "resident" | "guest" | "staff";
export type StaffRole = "ceo" | "finance" | "pco" | "howo" | "ivm" | "estate" | "admin" | "prm" | "cso";



interface Props {
  onSelect: (mode: PortalMode, role?: StaffRole) => void;
  onBackToWebsite: () => void;
}

// Simulated user accounts for the prototype
const RESIDENT_ACCOUNTS = [
  { email: "seun.adeleke@email.com", password: "staff", name: "Mr. Seun Adeleke", unit: "A7", estate: "Palm Estate", type: "Owner" },
  { email: "grace.okafor@email.com", password: "staff", name: "Mrs. Grace Okafor", unit: "C3", estate: "Palm Estate", type: "Owner" },
  { email: "james.iyede@email.com", password: "staff", name: "Engr. James Iyede", unit: "D2", estate: "Sapphire Court", type: "Tenant" },
];

const GUEST_ACCOUNTS: { email: string; password: string; name: string; booking: string }[] = [
  { email: "amina.suleiman@email.com", password: "staff", name: "Dr. Amina Suleiman", booking: "BK-0041" },
  { email: "femi.adeyinka@email.com", password: "staff", name: "Mr. Femi Adeyinka", booking: "BK-0040" },
];


export default function PlatformGate({ onSelect, onBackToWebsite }: Props) {
  const [view, setView] = useState<"choose" | "resident-login" | "guest-login" | "guest-register">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Registration state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBooking, setRegBooking] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleResidentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const match = RESIDENT_ACCOUNTS.find((a) => a.email === email && a.password === password);
      if (match) {
        sessionStorage.setItem("naga_resident", JSON.stringify(match));
        onSelect("resident");
      } else {
        setError("Incorrect email or password. Try: seun.adeleke@email.com / resident");
      }
      setLoading(false);
    }, 800);
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const match = GUEST_ACCOUNTS.find((a) => a.email === email && a.password === password);
      if (match) {
        sessionStorage.setItem("naga_guest", JSON.stringify(match));
        onSelect("guest");
      } else {
        setError("Incorrect email or password.");
      }
      setLoading(false);
    }, 800);
  };

  const handleGuestRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (GUEST_ACCOUNTS.find((a) => a.email === regEmail)) {
      setRegError("An account with this email already exists. Please sign in.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }
    setRegLoading(true);
    setTimeout(() => {
      const bookingRef = regBooking.trim() || `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAccount = { email: regEmail.trim().toLowerCase(), password: regPassword, name: regName.trim(), booking: bookingRef };
      GUEST_ACCOUNTS.push(newAccount);
      sessionStorage.setItem("naga_guest", JSON.stringify(newAccount));
      setRegLoading(false);
      onSelect("guest");
    }, 900);
  };

  const back = () => { setView("choose"); setError(""); setEmail(""); setPassword(""); setRegError(""); setRegName(""); setRegEmail(""); setRegPhone(""); setRegPassword(""); setRegBooking(""); };

  return (
    <div className="h-full overflow-y-auto flex flex-col" style={{ background: "#0f0d2e", fontFamily: "var(--font-sans)" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onBackToWebsite} className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.45)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to website
        </button>
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="7" fill="rgba(107,159,229,0.12)" />
            <path d="M15 5L25 11.5v12H5v-12L15 5z" stroke="#6B9FE5" strokeWidth="1.5" fill="none" />
            <path d="M11 23.5v-8h8v8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
            <rect x="13" y="10" width="4" height="4" rx="0.5" fill="#6B9FE5" fillOpacity="0.6" />
          </svg>
          <div>
            <div className="text-white text-[14px] font-bold tracking-wide">NAGA</div>
            <div className="text-[9px] tracking-[0.16em] uppercase" style={{ color: "#6B9FE5" }}>Platform Access</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center px-6 py-16">
        {view === "choose" && (
          <div className="w-full max-w-4xl flex flex-col justify-center" style={{ minHeight: "60vh" }}>
            <div className="text-center mb-14">
              <h1 className="text-white mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 46px)" }}>
                Welcome to NAGA Platform
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px" }}>
                Select your access type to continue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto w-full">
              {/* Resident */}
              <PortalCard
                icon="🏘"
                title="Estate Resident"
                subtitle="Resident & Tenant Portal"
                desc="Access your service charge account, submit maintenance requests, and stay connected with your estate."
                items={["Service charge payments", "Maintenance request tracking", "Estate notices & updates", "Facility management support"]}
                cta="Resident Sign In"
                note="For estate owners and tenants"
                color="#6B9FE5"
                onClick={() => setView("resident-login")}
              />

              {/* Guest */}
              <PortalCard
                icon="🛋"
                title="NAGA Stays"
                subtitle="Guest Booking Portal"
                desc="Book a premium short-let unit, manage your reservation, and access your guest account."
                items={["Browse available units", "Manage your booking", "Check-in instructions", "Guest support"]}
                cta="Sign In to My Account"
                note="Returning or new guests"
                color="#8eb6ec"
                onClick={() => setView("guest-login")}
                secondaryCta="New guest? Create an account →"
                onSecondaryClick={() => { setRegError(""); setRegName(""); setRegEmail(""); setRegPhone(""); setRegPassword(""); setRegBooking(""); setView("guest-register"); }}
              />
            </div>

            <p className="text-center mt-10 text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              This is a secure platform. Unauthorised access is prohibited.
            </p>
          </div>
        )}

        {/* ── RESIDENT LOGIN ── */}
        {view === "resident-login" && (
          <LoginForm
            title="Resident Portal"
            subtitle="Estate residents and tenants"
            icon="🏘"
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            error={error} loading={loading}
            onSubmit={handleResidentLogin}
            onBack={back}
            hint="Demo: seun.adeleke@email.com / staff"
          />
        )}

        {/* ── GUEST LOGIN ── */}
        {view === "guest-login" && (
          <LoginForm
            title="NAGA Stays"
            subtitle="Guest booking portal"
            icon="🛋"
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            error={error} loading={loading}
            onSubmit={handleGuestLogin}
            onBack={back}
            hint="Demo: amina.suleiman@email.com / staff"
            footer={
              <p className="text-center text-[13px] mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                New to NAGA Stays?{" "}
                <button
                  type="button"
                  onClick={() => { setError(""); setEmail(""); setPassword(""); setView("guest-register"); }}
                  className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
                  style={{ color: "#6B9FE5" }}>
                  Create an account
                </button>
              </p>
            }
          />
        )}

        {/* ── GUEST REGISTER ── */}
        {view === "guest-register" && (
          <form onSubmit={handleGuestRegister} className="w-full max-w-md">
            <button type="button" onClick={back} className="flex items-center gap-2 text-[13px] mb-8 transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
            <div className="text-center mb-8">
              <div className="text-3xl mb-3">🛋</div>
              <h2 className="text-white text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>Join NAGA Stays</h2>
              <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Create your free guest account — takes under a minute</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Full Name</label>
                <input
                  type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. Amina Suleiman"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Email Address</label>
                <input
                  type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Phone Number</label>
                <input
                  type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
                <input
                  type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Booking Reference <span style={{ color: "rgba(255,255,255,0.25)" }}>(optional)</span></label>
                <input
                  type="text" value={regBooking} onChange={(e) => setRegBooking(e.target.value)}
                  placeholder="e.g. BK-0042 — leave blank if not yet booked"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                />
              </div>
              {regError && (
                <div className="px-4 py-3 rounded-xl text-[12px]" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  {regError}
                </div>
              )}
            </div>

            <button
              type="submit" disabled={regLoading}
              className="w-full mt-6 py-3.5 text-[14px] font-semibold rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: "#25205B" }}>
              {regLoading ? "Creating account…" : "Create Account →"}
            </button>
            <p className="text-center text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
              Already have an account?{" "}
              <button type="button" onClick={() => setView("guest-login")} className="underline" style={{ color: "rgba(107,159,229,0.6)" }}>Sign in</button>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}

// ─── Reusable components ───

function PortalCard({ icon, title, subtitle, desc, items, cta, note, color, onClick, secondaryCta, onSecondaryClick }: {
  icon: string; title: string; subtitle: string; desc: string;
  items: string[]; cta: string; note: string; color: string; onClick: () => void;
  secondaryCta?: string; onSecondaryClick?: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-7 flex flex-col transition-all hover:-translate-y-1 hover:shadow-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="text-4xl mb-5">{icon}</div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color }}>
        {subtitle}
      </div>
      <h3 className="text-white text-[20px] font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      <p className="text-[13px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
      <ul className="space-y-2 flex-1 mb-6">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
            {i}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className="w-full py-3 text-[13px] font-semibold rounded-xl transition-all hover:opacity-90 text-white cursor-pointer"
        style={{ background: "#25205B", border: `1px solid ${color}30` }}
      >
        {cta} →
      </button>
      {secondaryCta && onSecondaryClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onSecondaryClick(); }}
          className="w-full mt-2.5 py-2.5 text-[12px] font-medium rounded-xl transition-all hover:opacity-80 cursor-pointer"
          style={{ background: "rgba(107,159,229,0.08)", border: "1px solid rgba(107,159,229,0.2)", color: "#6B9FE5" }}
        >
          {secondaryCta}
        </button>
      )}
      <p className="text-center text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>{note}</p>
    </div>
  );
}

function LoginForm({ title, subtitle, icon, email, setEmail, password, setPassword, error, loading, onSubmit, onBack, hint, footer }: {
  title: string; subtitle: string; icon: string;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string; loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  hint: string;
  footer?: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-[13px] mb-8 transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back
      </button>
      <div className="text-center mb-8">
        <div className="text-3xl mb-3">{icon}</div>
        <h2 className="text-white text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{subtitle}</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Email Address</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
          />
        </div>
        {error && (
          <div className="px-4 py-3 rounded-xl text-[12px]" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            {error}
          </div>
        )}
        <div className="px-4 py-3 rounded-xl text-[12px]" style={{ background: "rgba(107,159,229,0.08)", border: "1px solid rgba(107,159,229,0.15)", color: "rgba(107,159,229,0.7)" }}>
          Demo credentials: {hint}
        </div>
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full mt-5 py-3.5 text-[14px] font-semibold rounded-xl text-white transition-all hover:opacity-90"
        style={{ background: "#25205B" }}
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-center text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
        Forgot your password? Contact your estate manager.
      </p>
      {footer}
    </form>
  );
}
