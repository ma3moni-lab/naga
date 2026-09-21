import { useState, useEffect, useRef } from "react";
import { useNavigate as useRouterNavigate } from "react-router";
import ImageGallery from "./ImageGallery";
import { ESTATE_IMAGES, STAYS_IMAGES, GENERAL_IMAGES, LISTING_IMAGES } from "@/assets/images";
import nagaHbLogo from "@/imports/Naga_HummingBird_Logo-3__2_.png";
import nagaFullLogo from "@/imports/Naga_Construction_logo_full.png";

type Page = "home" | "about" | "services" | "properties" | "stays" | "contact";

interface Props {
  onEnterPlatform: () => void;
}

interface ModalData {
  kind: "property" | "stays" | "project";
  name: string;
  location: string;
  images: string[];
  subhead?: string;
  desc?: string;
  price?: string;
  priceUnit?: string;
  status?: string;
  statusColor?: { bg: string; color: string };
  features?: string[];
  rows?: { label: string; value: string }[];
  progress?: number;
  ctas?: { label: string; primary?: boolean; action: "enquire" | "portal" | "stays-portal" }[];
}

const NAV_LINKS: { label: string; id: Page }[] = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Services", id: "services" },
  { label: "Properties", id: "properties" },
  { label: "NAGA Stays", id: "stays" },
  { label: "Contact", id: "contact" },
];

/* ─── MODAL ──────────────────────────────────────────────────────── */
function DetailModal({ data, onClose, onNavigate, onEnterPlatform }: {
  data: ModalData; onClose: () => void;
  onNavigate: (p: Page) => void; onEnterPlatform: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(15,13,46,0.75)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-[660px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        style={{ background: "white", animation: "modalIn 0.3s cubic-bezier(0.32,0.72,0,1)" }}>

        {/* Hero gallery */}
        <div className="relative shrink-0" style={{ height: 280 }}>
          <ImageGallery images={data.images} alt={data.name} height={280} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(15,13,46,0) 45%, rgba(15,13,46,0.78) 100%)" }} />
          {data.status && data.statusColor && (
            <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full z-10"
              style={{ background: data.statusColor.bg, color: data.statusColor.color }}>{data.status}</span>
          )}
          {data.progress !== undefined && (
            <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full z-10"
              style={{ background: "#6B9FE5", color: "white" }}>Active — {data.progress}%</span>
          )}
          <button onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <div className="absolute bottom-5 left-6 right-16 z-10">
            {data.subhead && <div className="text-[11px] uppercase tracking-widest mb-1 font-semibold" style={{ color: "#6B9FE5" }}>{data.subhead}</div>}
            <h2 className="text-white font-semibold leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,26px)" }}>{data.name}</h2>
            <div className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{data.location}</div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {data.price && (
            <div className="flex items-end gap-2">
              <span className="font-bold leading-none" style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "#25205B" }}>{data.price}</span>
              {data.priceUnit && <span className="text-[13px] pb-1" style={{ color: "#69707D" }}>{data.priceUnit}</span>}
            </div>
          )}
          {data.progress !== undefined && (
            <div>
              <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "#69707D" }}>
                <span>Construction progress</span>
                <span className="font-semibold" style={{ color: "#25205B" }}>{data.progress}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#EAF2FC" }}>
                <div className="h-full rounded-full" style={{ width: `${data.progress}%`, background: "#6B9FE5" }} />
              </div>
            </div>
          )}
          {data.rows && data.rows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.rows.map((r) => (
                <div key={r.label} className="rounded-xl px-4 py-3" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                  <div className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#69707D" }}>{r.label}</div>
                  <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{r.value}</div>
                </div>
              ))}
            </div>
          )}
          {data.desc && <p className="text-[14px] leading-relaxed" style={{ color: "#69707D" }}>{data.desc}</p>}
          {data.features && data.features.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide font-semibold mb-3" style={{ color: "#69707D" }}>
                {data.kind === "stays" ? "What is included" : "Features"}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.features.map((f) => (
                  <span key={f} className="text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "#EAF2FC", color: "#25205B" }}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {data.ctas && data.ctas.length > 0 && (
          <div className="shrink-0 p-6 pt-0 flex gap-3">
            {data.ctas.map((cta) => (
              <button key={cta.label}
                onClick={() => {
                  if (cta.action === "enquire") { onClose(); onNavigate("contact"); }
                  else { onClose(); onEnterPlatform(); }
                }}
                className={`flex-1 py-3.5 rounded-xl font-semibold text-[13px] transition-all hover:-translate-y-0.5 ${cta.primary ? "text-white hover:shadow-lg" : "hover:bg-[#EAF2FC]"}`}
                style={cta.primary ? { background: "linear-gradient(135deg, #25205B 0%, #312a72 100%)" } : { border: "1.5px solid #E8EAF0", color: "#25205B" }}>
                {cta.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn{from{transform:translateY(28px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────── */
export default function Website({ onEnterPlatform }: Props) {
  const [page, setPage] = useState<Page>("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const routerNavigate = useRouterNavigate();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 70);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (portalMenuRef.current && !portalMenuRef.current.contains(e.target as Node)) setPortalMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loggedInSession = (() => {
    try {
      const guest = sessionStorage.getItem("naga_guest");
      if (guest) { const d = JSON.parse(guest); return { name: d.name, route: "/admin/guest" }; }
      const resident = sessionStorage.getItem("naga_resident");
      if (resident) { const d = JSON.parse(resident); return { name: d.name, route: "/admin/resident" }; }
      const staff = sessionStorage.getItem("naga_staff");
      if (staff) { const d = JSON.parse(staff); return { name: d.name, route: "/admin/staff/dashboard" }; }
    } catch {}
    return null;
  })();

  const navigate = (p: Page) => { setPage(p); setMenuOpen(false); scrollRef.current?.scrollTo({ top: 0 }); };
  const navBg = scrolled || page !== "home";

  return (
    <div ref={scrollRef} className="relative h-full overflow-y-auto" style={{ fontFamily: "var(--font-sans)", background: "#fff" }}>
      {modal && <DetailModal data={modal} onClose={() => setModal(null)} onNavigate={navigate} onEnterPlatform={onEnterPlatform} />}

      {/* NAV */}
      <nav className="fixed left-0 right-0 z-50 transition-all duration-400"
        style={{ top: "var(--demo-bar-h, 0px)", background: navBg ? "rgba(255,255,255,0.97)" : "transparent", backdropFilter: navBg ? "blur(12px)" : "none", borderBottom: navBg ? "1px solid #E8EAF0" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center h-[76px] gap-8">
          <button onClick={() => navigate("home")} className="flex items-center shrink-0">
            <img
              src={nagaHbLogo}
              alt="NAGA Hummingbird Properties"
              style={{
                height: 64,
                maxWidth: 220,
                objectFit: "contain",
                filter: navBg ? "none" : "brightness(0) invert(1)",
                transition: "filter 0.3s",
              }}
            />
          </button>

          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((link) => {
              const active = page === link.id;
              return (
                <button key={link.id} onClick={() => navigate(link.id)}
                  className="px-3 py-2 rounded-lg text-[13px] transition-all"
                  style={{ color: active ? (navBg ? "#25205B" : "white") : (navBg ? "#69707D" : "rgba(255,255,255,0.75)"), background: active && navBg ? "#EAF2FC" : "transparent", fontWeight: active ? 600 : 500 }}>
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            {loggedInSession ? (
              <div className="relative" ref={portalMenuRef}>
                <button
                  onClick={() => setPortalMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90"
                  style={{ background: "#25205B", color: "white" }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "rgba(107,159,229,0.3)", color: "white" }}>
                    {loggedInSession.name.split(" ")[0][0]}
                  </div>
                  Welcome, {loggedInSession.name.split(" ")[0]}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.7, transform: portalMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M2 3.5l3 3 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                {portalMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50" style={{ background: "white", boxShadow: "0 8px 24px rgba(37,32,91,0.12)", border: "1px solid #E8EAF0" }}>
                    <button
                      onClick={() => { setPortalMenuOpen(false); routerNavigate(loggedInSession.route); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#25205B" }}><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      <span className="text-[13px]" style={{ color: "#252731" }}>My Dashboard</span>
                    </button>
                    <div style={{ borderTop: "1px solid #F0F2F5" }} />
                    <button
                      onClick={() => { setPortalMenuOpen(false); onEnterPlatform(); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6B9FE5" }}><circle cx="7" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      <span className="text-[13px]" style={{ color: "#252731" }}>Portal Login</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onEnterPlatform}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ background: "#25205B", color: "white" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4.5" r="2.3" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 12c0-2.7 2.3-5 5-5s5 2.3 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                My Portal
              </button>
            )}
          </div>

          <button className="md:hidden ml-auto p-2" onClick={() => setMenuOpen(!menuOpen)} style={{ color: navBg ? "#25205B" : "white" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen ? <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#E8EAF0] bg-white px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => navigate(link.id)} className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium"
                style={{ color: page === link.id ? "#25205B" : "#69707D", background: page === link.id ? "#EAF2FC" : "transparent" }}>
                {link.label}
              </button>
            ))}
            {loggedInSession ? (
              <>
                <button onClick={() => routerNavigate(loggedInSession.route)} className="w-full mt-2 px-3 py-2.5 rounded-lg text-[14px] font-semibold text-white text-left" style={{ background: "#25205B" }}>
                  My Dashboard ({loggedInSession.name.split(" ")[0]})
                </button>
              </>
            ) : (
              <button onClick={onEnterPlatform} className="w-full mt-2 px-3 py-2.5 rounded-lg text-[14px] font-semibold text-white text-left" style={{ background: "#25205B" }}>
                My Portal
              </button>
            )}
          </div>
        )}
      </nav>

      {page === "home" && <HomePage onNavigate={navigate} onEnterPlatform={onEnterPlatform} onOpenModal={setModal} />}
      {page === "about" && <AboutPage />}
      {page === "services" && <ServicesPage />}
      {page === "properties" && <PropertiesPage onEnterPlatform={onEnterPlatform} onOpenModal={setModal} />}
      {page === "stays" && <StaysPage onEnterPlatform={onEnterPlatform} onOpenModal={setModal} onNavigate={navigate} />}
      {page === "contact" && <ContactPage />}

      <Footer onNavigate={navigate} onEnterPlatform={onEnterPlatform} />
    </div>
  );
}

/* ─── PROJECT DATA ───────────────────────────────────────────────── */
const PROJECTS = [
  {
    id: "palm-court",
    name: "NAGA Palm Court",
    location: "Gwarimpa, Abuja",
    tag: "Gwarimpa, Abuja",
    units: "24 units",
    progress: 68,
    budget: "₦420M",
    desc: "Palm Court is our flagship Abuja development, sitting in the heart of Gwarimpa. Twenty-four 2 and 3-bedroom apartments with generous floor plans, dedicated parking, landscaped courtyards and 24-hour security. The building wraps around a quiet interior garden designed to give residents somewhere to breathe.",
    images: ESTATE_IMAGES.palmCourt,
    features: ["24-Hour Security", "Backup Power", "Covered Parking", "Landscaped Garden", "Lifts"],
    rows: [{ label: "Location", value: "Gwarimpa, Abuja" }, { label: "Units", value: "24 Residential" }, { label: "Budget", value: "₦420,000,000" }, { label: "Handover", value: "Q2 2026" }],
  },
  {
    id: "dawaki",
    name: "NAGA Dawaki",
    location: "Dawaki, Abuja",
    tag: "Dawaki, Abuja",
    units: "18 units",
    progress: 35,
    budget: "₦290M",
    desc: "Our newest Abuja project, NAGA Dawaki is a quiet, well-planned residential block in one of the fastest growing neighbourhoods in the FCT. Eighteen 2 and 3-bedroom apartments across five floors, with a focus on natural light and cross-ventilation.",
    images: ESTATE_IMAGES.dawaki,
    features: ["24-Hour Security", "Backup Power", "Parking", "Community Spaces"],
    rows: [{ label: "Location", value: "Dawaki, Abuja" }, { label: "Units", value: "18 Residential" }, { label: "Budget", value: "₦290,000,000" }, { label: "Handover", value: "Q4 2026" }],
  },
  {
    id: "jabi",
    name: "NAGA Jabi",
    location: "Jabi, Abuja",
    tag: "Jabi, Abuja",
    units: "20 units",
    progress: 52,
    budget: "₦350M",
    desc: "NAGA Jabi overlooks the Jabi Lake corridor, one of the most desirable addresses in Abuja. Twenty fully serviced apartments from studio through to 4-bedroom, with a rooftop terrace shared across the building and unobstructed lake views from the upper floors.",
    images: ESTATE_IMAGES.jabi,
    features: ["Rooftop Terrace", "Lake Views", "Smart Access", "Pool", "Backup Power"],
    rows: [{ label: "Location", value: "Jabi, Abuja" }, { label: "Units", value: "20 Residential" }, { label: "Budget", value: "₦350,000,000" }, { label: "Handover", value: "Q3 2026" }],
  },
  {
    id: "emerald",
    name: "Emerald Gardens",
    location: "Lekki Phase 1, Lagos",
    tag: "Lekki, Lagos",
    units: "16 units",
    progress: 42,
    budget: "₦310M",
    desc: "Sixteen apartments in a 7-storey building on one of Lekki's most established streets. Floor-to-ceiling glass, a rooftop pool and communal terrace, and underground parking. You can buy off-plan now at launch pricing.",
    images: ESTATE_IMAGES.emerald,
    features: ["Rooftop Pool", "Underground Parking", "Floor-to-Ceiling Glass", "24-Hour Security"],
    rows: [{ label: "Location", value: "Lekki Phase 1, Lagos" }, { label: "Units", value: "16 Residential" }, { label: "Budget", value: "₦310,000,000" }, { label: "Status", value: "Pre-sale open" }],
  },
  {
    id: "granite",
    name: "Granite Heights",
    location: "GRA, Benin City",
    tag: "GRA, Benin City",
    units: "12 units",
    progress: 91,
    budget: "₦185M",
    desc: "Granite Heights is nearly done. Twelve apartments across five floors in GRA, Benin City — NAGA's home turf. The finishes are in, snagging is underway, and handover is expected before the end of the year.",
    images: ESTATE_IMAGES.granite,
    features: ["Lift", "24-Hour Security", "Backup Generator", "Parking"],
    rows: [{ label: "Location", value: "GRA, Benin City" }, { label: "Units", value: "12 Residential" }, { label: "Budget", value: "₦185,000,000" }, { label: "Handover", value: "Q4 2025" }],
  },
];

/* ─── SUBSIDIARY DATA ────────────────────────────────────────────── */
const SUBSIDIARIES = [
  { name: "Hummingbird Properties", short: "Real Estate", color: "#6B9FE5", lightBg: "#EAF2FC", focus: "Property sales & estate management", cities: "Benin City · Abuja · Lagos" },
  { name: "NAGA Prime Construction & PM", short: "Construction", color: "#D4A843", lightBg: "#FEF7E7", focus: "Full-cycle construction & project management", cities: "All three cities" },
  { name: "Prime Apartment (NAGA Stays)", short: "Short-let", color: "#C07A5A", lightBg: "#FAF0EB", focus: "Short-let hospitality & guest stays", cities: "Abuja · Benin City" },
  { name: "Global Technology & Literacy Hub", short: "Technology", color: "#8B5CF6", lightBg: "#F5F3FF", focus: "Technology & education initiatives", cities: "China · Nigeria (coming soon)" },
];

/* ─── HOME PAGE ──────────────────────────────────────────────────── */
function HomePage({ onNavigate, onEnterPlatform, onOpenModal }: {
  onNavigate: (p: Page) => void; onEnterPlatform: () => void; onOpenModal: (d: ModalData) => void;
}) {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex flex-col justify-end overflow-hidden" style={{ minHeight: "100vh" }}>
        <div className="absolute inset-0">
          <img src={GENERAL_IMAGES.websiteHero} alt="Modern residential development, Lagos" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,22,69,0.65) 0%, rgba(26,22,69,0.9) 100%)" }} />
        </div>
        <div className="absolute left-[max(3rem,calc(50%-580px))] top-[68px] bottom-0 w-px" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 pt-[88px] sm:pt-[120px]">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-8 h-px" style={{ background: "#6B9FE5" }} />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#6B9FE5" }}>NAGA Hummingbird Properties</span>
          </div>
          <h1 className="text-white leading-[1.08] mb-7" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(52px, 7vw, 90px)", maxWidth: "780px", letterSpacing: "-0.01em" }}>
            Built to last.<br /><span className="italic" style={{ color: "#6B9FE5" }}>Built for you.</span>
          </h1>
          <p className="mb-12 text-[17px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)", maxWidth: "540px" }}>
            We build homes people are proud to own, manage estates that actually run well, and host guests in our furnished short-let apartments. Abuja, Lagos and Benin City.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => onNavigate("properties")} className="px-7 py-3.5 text-[14px] font-semibold transition-all hover:-translate-y-0.5 hover:opacity-90" style={{ background: "white", color: "#25205B", borderRadius: "10px" }}>Explore Properties</button>
            <button onClick={() => onNavigate("about")} className="px-7 py-3.5 text-[14px] font-semibold transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px" }}>Our Story</button>
          </div>
          <div className="mt-20 flex items-center gap-3">
            <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.2)" }} />
            <span className="text-[11px] tracking-widest uppercase text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* Group subsidiary strip */}
      <section className="bg-white" style={{ borderBottom: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase shrink-0" style={{ color: "#69707D" }}>NAGA Group of Companies</span>
            <div className="flex-1 h-px" style={{ background: "#E8EAF0" }} />
            <button onClick={() => onNavigate("about")} className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity shrink-0" style={{ color: "#25205B" }}>
              About the group
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SUBSIDIARIES.map((s) => (
              <div key={s.name} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: s.color, minHeight: 36 }} />
                <div className="min-w-0">
                  <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: s.color }}>{s.short}</div>
                  <div className="text-[11px] font-semibold leading-tight mb-0.5" style={{ color: "#252731" }}>{s.name}</div>
                  <div className="text-[10px] leading-relaxed" style={{ color: "#69707D" }}>{s.focus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-[#E8EAF0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { value: "2018", label: "Year we started" },
              { value: "₦1.35B+", label: "Value under construction" },
              { value: "5", label: "Active developments" },
              { value: "3", label: "Cities we work in" },
            ].map((stat, i) => (
              <div key={stat.label} className="py-10 px-6 flex flex-col justify-center" style={{ borderRight: i < 3 ? "1px solid #E8EAF0" : "none" }}>
                <div className="text-[38px] font-bold tracking-tight leading-none mb-2" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>{stat.value}</div>
                <div className="text-[12px] font-medium tracking-wide" style={{ color: "#69707D" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Developments */}
      <section className="py-12 sm:py-20 md:py-28" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Active Developments</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 46px)", color: "#252731", lineHeight: 1.1 }}>What we're building now</h2>
            </div>
            <button onClick={() => onNavigate("properties")} className="text-[13px] font-semibold flex items-center gap-2 group" style={{ color: "#25205B" }}>
              See all five projects
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          {/* Asymmetric grid — hero + 2 smaller */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 relative rounded-2xl overflow-hidden cursor-pointer group" style={{ minHeight: 420 }}
              onClick={() => onOpenModal({ kind: "project", ...PROJECTS[0], ctas: [{ label: "Enquire about units", primary: true, action: "enquire" }] })}>
              <ImageGallery images={PROJECTS[0].images} alt={PROJECTS[0].name} height={420} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(15,13,46,0.85) 100%)" }} />
              <div className="absolute top-4 left-4 z-10"><span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full" style={{ background: "#6B9FE5", color: "white" }}>Active — {PROJECTS[0].progress}%</span></div>
              <div className="absolute bottom-0 left-0 right-0 p-7 z-10">
                <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "#6B9FE5" }}>{PROJECTS[0].tag} · {PROJECTS[0].units}</div>
                <h3 className="text-white text-[26px] font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>{PROJECTS[0].name}</h3>
                <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: `${PROJECTS[0].progress}%`, background: "#6B9FE5" }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>Construction progress</span>
                  <span className="text-[11px] font-semibold text-white">{PROJECTS[0].budget}</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" style={{ background: "rgba(37,32,91,0.3)" }}>
                <span className="text-white font-semibold text-[14px] flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>View project →</span>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col gap-5">
              {[PROJECTS[1], PROJECTS[2]].map((p) => (
                <div key={p.id} className="relative rounded-2xl overflow-hidden flex-1 cursor-pointer group" style={{ minHeight: 195 }}
                  onClick={() => onOpenModal({ kind: "project", ...p, ctas: [{ label: "Enquire about units", primary: true, action: "enquire" }] })}>
                  <ImageGallery images={p.images} alt={p.name} height={195} />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 20%, rgba(15,13,46,0.88) 100%)" }} />
                  <div className="absolute top-3 left-3 z-10"><span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full" style={{ background: "#6B9FE5", color: "white" }}>{p.progress}%</span></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#6B9FE5" }}>{p.tag} · {p.units}</div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-white text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>{p.name}</h3>
                      <span className="text-[11px] font-semibold text-white">{p.budget}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" style={{ background: "rgba(37,32,91,0.3)" }}>
                    <span className="text-white text-[13px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>View project →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-[13px]" style={{ color: "#69707D" }}>
            Plus <button onClick={() => onNavigate("properties")} className="font-semibold underline underline-offset-2" style={{ color: "#25205B" }}>Emerald Gardens in Lagos</button> and <button onClick={() => onNavigate("properties")} className="font-semibold underline underline-offset-2" style={{ color: "#25205B" }}>Granite Heights in Benin City</button>, both progressing well.
          </p>
        </div>
      </section>

      {/* What we do */}
      <section className="py-12 sm:py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>What we do</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 3.5vw, 42px)", color: "#252731", lineHeight: 1.15 }}>
                Four subsidiaries.<br />One group standard.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed" style={{ color: "#69707D" }}>
                NAGA is a property group with four specialist arms — from construction and sales through to short-let hospitality and a global technology initiative.
              </p>
              <button onClick={() => onNavigate("about")} className="mt-8 flex items-center gap-2 text-[13px] font-semibold group" style={{ color: "#25205B" }}>
                Read about the group
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SUBSIDIARIES.map((s) => (
                <div key={s.name} className="p-7 rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" style={{ border: `1.5px solid ${s.color}28` }}>
                  <div className="w-8 h-1 rounded-full mb-5" style={{ background: s.color }} />
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full inline-block" style={{ background: s.lightBg, color: s.color }}>{s.short}</span>
                  <h3 className="font-semibold text-[15px] mb-2 mt-3" style={{ color: "#252731" }}>{s.name}</h3>
                  <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#69707D" }}>{s.focus}</p>
                  <div className="text-[10px] font-medium" style={{ color: s.color }}>{s.cities}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Available units preview */}
      <section className="py-12 sm:py-20 md:py-28" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Ready to move or buy</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 3.5vw, 42px)", color: "#252731", lineHeight: 1.15 }}>Available now</h2>
            </div>
            <button onClick={() => onNavigate("properties")} className="text-[13px] font-semibold flex items-center gap-2 group" style={{ color: "#25205B" }}>
              Browse all listings
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Palm Court — Unit A4", type: "3-Bedroom Apartment", location: "Gwarimpa, Abuja", price: "₦95,000,000", status: "Available", size: "210 sqm, Floor 2", img: LISTING_IMAGES.palmCourtUnit, desc: "A well-proportioned 3-bedroom on the second floor of Palm Court. Open-plan living, generous storage, and allocated parking." },
              { name: "Granite Heights — Unit 11", type: "2-Bedroom Apartment", location: "GRA, Benin City", price: "₦48,000,000", status: "Available", size: "135 sqm, Floor 4", img: LISTING_IMAGES.graniteUnit, desc: "A compact, well-priced 2-bedroom on the fourth floor of Granite Heights with city views and a backup power supply." },
              { name: "Emerald Gardens — Unit 4B", type: "Off-Plan 3-Bedroom", location: "Lekki, Lagos", price: "₦85,000,000", status: "Pre-Sale", size: "185 sqm, Floor 2", img: LISTING_IMAGES.emeraldUnit, desc: "Buy off-plan now at launch pricing. Lekki delivery expected 2026 with a rooftop pool included in the scheme." },
            ].map((prop) => {
              const sc = prop.status === "Available" ? { bg: "#dcfce7", color: "#166534" } : { bg: "#EAF2FC", color: "#25205B" };
              return (
                <div key={prop.name} className="bg-white rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer" style={{ border: "1px solid #E8EAF0" }}
                  onClick={() => onOpenModal({ kind: "property", name: prop.name, location: prop.location, images: [prop.img], subhead: prop.location, desc: prop.desc, price: prop.price, status: prop.status, statusColor: sc, rows: [{ label: "Type", value: prop.type }, { label: "Size", value: prop.size }, { label: "Status", value: prop.status }], features: ["24-Hour Security", "Backup Power", "Parking"], ctas: [{ label: "Enquire Now", primary: true, action: "enquire" }] })}>
                  <div className="relative h-52 overflow-hidden group" style={{ background: "#EAF2FC" }}>
                    <img src={prop.img} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "rgba(37,32,91,0.52)" }}>
                      <span className="text-white text-[13px] font-semibold">View details →</span>
                    </div>
                    <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{prop.status}</span>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] font-medium mb-1" style={{ color: "#69707D" }}>{prop.location}</div>
                    <h3 className="font-semibold text-[16px] mb-1" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>{prop.name}</h3>
                    <div className="text-[12px] mb-4" style={{ color: "#69707D" }}>{prop.type} · {prop.size}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-[20px] font-bold" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>{prop.price}</div>
                      <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#EAF2FC", color: "#25205B" }}>View →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NAGA Stays banner */}
      <section className="relative overflow-hidden" style={{ minHeight: "520px" }}>
        <img src={STAYS_IMAGES.banner} alt="NAGA Stays furnished apartment" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(26,22,69,0.92) 50%, rgba(26,22,69,0.5) 100%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-28 flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
          <div className="md:w-1/2">
            <div className="flex items-center gap-3 mb-6"><span className="w-6 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>NAGA Stays</span></div>
            <h2 className="text-white mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 4vw, 48px)", lineHeight: 1.12 }}>Our buildings. Your home for a while.</h2>
            <p className="mb-8 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)", maxWidth: "420px" }}>
              These are real apartments in buildings we built and still manage. Whether you're in Abuja for a week or Benin for a month, you're staying with us — not a listing aggregator.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => onNavigate("stays")} className="px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:-translate-y-0.5" style={{ background: "#6B9FE5", color: "white" }}>See available units</button>
              <button onClick={() => onNavigate("contact")} className="px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}>Get in touch</button>
            </div>
          </div>
          <div className="md:w-1/2 grid grid-cols-2 gap-4">
            {[{ label: "Nightly from", value: "₦125,000" }, { label: "Locations", value: "Abuja · Benin City" }, { label: "Stays completed", value: "56" }, { label: "Guest rating", value: "4.85 / 5" }].map((s) => (
              <div key={s.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-[11px] font-medium mb-1" style={{ color: "#6B9FE5" }}>{s.label}</div>
                <div className="text-white font-semibold text-[16px]">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal CTA */}
      <section className="py-10 sm:py-16 md:py-20 bg-white border-t border-[#E8EAF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-3"><span className="w-5 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Already a resident or guest?</span></div>
            <h3 className="text-[22px] font-semibold mb-2" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>Your portal is waiting.</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: "#69707D" }}>
              If you live in one of our estates or you have an active NAGA Stays booking, log in to pay your service charges, raise maintenance requests, track your booking or message the team.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button onClick={onEnterPlatform} className="flex items-center gap-2 px-6 py-3.5 text-[14px] font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ background: "#25205B", color: "white" }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L13.5 5v9H1.5V5L7.5 1.5z" stroke="white" strokeWidth="1.2" fill="none" /><rect x="5" y="9" width="5" height="5.5" rx="0.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.1" fill="none" /></svg>
              Estate Resident Login
            </button>
            <button onClick={onEnterPlatform} className="flex items-center gap-2 px-6 py-3.5 text-[14px] font-semibold rounded-xl transition-all hover:-translate-y-0.5" style={{ background: "#EAF2FC", color: "#25205B", border: "1.5px solid #D3E3F9" }}>
              NAGA Stays Guest Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── ABOUT PAGE ─────────────────────────────────────────────────── */
function AboutPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "440px" }}>
        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=600&fit=crop&auto=format" alt="NAGA team in discussion" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,22,69,0.72) 0%, rgba(15,13,46,0.94) 100%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-28">
          <div className="flex items-center gap-3 mb-5"><span className="w-6 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Who we are</span></div>
          <h1 className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5vw, 62px)", lineHeight: 1.08, maxWidth: "640px" }}>
            We don't cut corners.<br />We never have.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: "rgba(255,255,255,0.62)", maxWidth: "480px" }}>
            A Nigerian property group founded in 2018. Four subsidiaries, four cities, one uncompromising standard.
          </p>
          <div className="mt-10 flex flex-wrap gap-6">
            {[{ n: "2018", l: "Founded" }, { n: "4", l: "Subsidiaries" }, { n: "₦1.35B+", l: "Under construction" }, { n: "5", l: "Active projects" }].map((s) => (
              <div key={s.l}>
                <div className="text-[26px] font-bold" style={{ fontFamily: "var(--font-display)", color: "white" }}>{s.n}</div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story + Values */}
      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start">
          <div>
            <h2 className="mb-6" style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "#252731", lineHeight: 1.2 }}>The NAGA story</h2>
            <div className="space-y-4 text-[15px] leading-relaxed" style={{ color: "#69707D" }}>
              <p>
                NAGA Hummingbird Properties started in 2018 with a single development in Benin City. The company was built on a simple premise: Nigeria deserves better-built homes, managed by people who actually stay accountable after the sale.
              </p>
              <p>
                Over seven years we've grown into a group of four specialist subsidiaries operating across three cities — with five active developments totalling over ₦1.35 billion in project value. Along the way we built a dedicated construction arm, a short-let hospitality brand, and a technology and literacy initiative.
              </p>
              <p>
                The principle hasn't changed. If we can't show you every Naira spent, every decision made and every wall built, we won't do it. It's not complicated — it's just how we think a company should operate.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { title: "Started in 2018", desc: "Seven years of delivering on what we promise, in a market where that matters." },
              { title: "Full accountability", desc: "From the first concrete pour through to the title document. Every transaction is documented and traceable." },
              { title: "Design matters to us", desc: "We think about space, light and material seriously. It shows in the buildings." },
              { title: "Premium without the performance", desc: "We build homes that are genuinely good — not homes that are dressed up to look good on a brochure." },
              { title: "Operationally honest", desc: "We run our own procurement, inventory and finance systems. There's nowhere to hide, which is exactly how we want it." },
            ].map((v) => (
              <div key={v.title} className="flex gap-4 p-5 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0" style={{ background: "#6B9FE5" }} />
                <div>
                  <div className="font-semibold text-[14px] mb-1" style={{ color: "#252731" }}>{v.title}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: "#69707D" }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 sm:py-16 md:py-24" style={{ background: "#F7F8FA", borderTop: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Our journey</span>
          </div>
          <h2 className="mb-14" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,36px)", color: "#252731" }}>How NAGA grew</h2>
          <div className="relative">
            <div className="absolute left-[124px] top-3 bottom-3 w-px hidden md:block" style={{ background: "#E8EAF0" }} />
            <div className="space-y-10">
              {[
                { year: "2018", event: "Founded in Benin City", detail: "NAGA Hummingbird Properties registered in Benin City, Edo State. First development: Granite Heights, GRA Phase 2." },
                { year: "2020", event: "Construction arm formalised", detail: "NAGA Prime Construction & PM incorporated to run all builds in-house — no outsourcing of primary construction work." },
                { year: "2021", event: "Expanded to Abuja", detail: "Palm Court, Gwarimpa — NAGA's first FCT project and the largest development to date at ₦420M budget." },
                { year: "2022", event: "NAGA Stays launched", detail: "Prime Apartment established as the short-let hospitality subsidiary. First units go live in Benin City and Abuja." },
                { year: "2023", event: "Lagos entry & GTL Hub", detail: "Emerald Gardens, Lekki — NAGA's Lagos debut. Global Technology & Literacy Hub incorporated with China operations." },
                { year: "2024–", event: "Continued expansion", detail: "NAGA Dawaki and NAGA Jabi under active construction. All three cities now running simultaneously." },
              ].map((t) => (
                <div key={t.year} className="flex gap-6 md:gap-10 items-start">
                  <div className="w-[124px] shrink-0 text-right hidden md:block pt-0.5">
                    <span className="text-[18px] font-bold" style={{ fontFamily: "var(--font-display)", color: "#25205B" }}>{t.year}</span>
                  </div>
                  <div className="relative flex-1 pl-6 md:pl-10">
                    <div className="absolute left-0 md:-left-[21px] top-2 w-3.5 h-3.5 rounded-full border-2 z-10" style={{ background: "white", borderColor: "#6B9FE5", boxShadow: "0 0 0 3px #EAF2FC" }} />
                    <div className="md:hidden text-[14px] font-bold mb-1" style={{ color: "#25205B" }}>{t.year}</div>
                    <h3 className="font-semibold text-[15px] mb-1" style={{ color: "#252731" }}>{t.event}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#69707D" }}>{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Structure / Organogram */}
      <section className="py-12 sm:py-16 md:py-24 bg-white" style={{ borderTop: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Corporate structure</span>
          </div>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,36px)", color: "#252731" }}>The NAGA Group of Companies</h2>
          <p className="mb-14 text-[15px]" style={{ color: "#69707D", maxWidth: 560 }}>Four specialist subsidiaries under one holding group — each focused, each accountable.</p>

          <div className="flex flex-col items-center">
            {/* Parent node */}
            <div className="px-10 py-5 rounded-2xl text-center shadow-lg" style={{ background: "#0f0d2e", border: "2px solid #6B9FE5", minWidth: 260 }}>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#6B9FE5" }}>Holding Company</div>
              <div className="text-white text-[22px] font-bold" style={{ fontFamily: "var(--font-display)", letterSpacing: -0.4 }}>NAGA GROUP</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Parent Company · Nigeria</div>
            </div>

            <div style={{ width: 2, height: 28, background: "#6B9FE5", opacity: 0.4 }} />
            <div className="w-full max-w-5xl" style={{ height: 2, background: "#6B9FE5", opacity: 0.2 }} />

            {/* Subsidiaries */}
            <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-0">
              {[
                { name: "Hummingbird Properties", tag: "Real Estate", color: "#6B9FE5", light: "#EAF2FC", focus: "Property sales & estate management", ops: ["Benin City HQ", "Expanding to Abuja", "Expanding to Lagos"], logo: nagaHbLogo as string | null, icon: null as string | null },
                { name: "NAGA Prime Construction & PM", tag: "Construction", color: "#D4A843", light: "#FEF7E7", focus: "Full-cycle construction & PM", ops: ["All active builds", "Procurement & IVM", "Handover & QA"], logo: nagaFullLogo as string | null, icon: null as string | null },
                { name: "Prime Apartment", tag: "Short-let", color: "#C07A5A", light: "#FAF0EB", focus: "NAGA Stays — short-let hospitality", ops: ["Abuja (primary)", "Benin City (primary)", "Lagos (expanding)"], logo: null as string | null, icon: "🛎️" },
                { name: "Global Technology & Literacy Hub", tag: "Technology", color: "#8B5CF6", light: "#F5F3FF", focus: "Technology & education initiatives", ops: ["China (operating)", "Nigeria (coming soon)"], logo: null as string | null, icon: "🌐" },
              ].map((sub) => (
                <div key={sub.name} className="flex flex-col items-center">
                  <div style={{ width: 2, height: 28, background: sub.color, opacity: 0.35 }} />
                  <div className="w-full rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#F7F8FA", border: `1.5px solid ${sub.color}30`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-start justify-between gap-2">
                      {sub.logo
                        ? <img src={sub.logo} alt={sub.name} style={{ height: 36, objectFit: "contain", maxWidth: 120 }} />
                        : <span className="text-2xl">{sub.icon}</span>
                      }
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full shrink-0" style={{ background: sub.light, color: sub.color }}>{sub.tag}</span>
                    </div>
                    <div className="font-bold text-[14px] leading-tight" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>{sub.name}</div>
                    <div className="text-[11.5px]" style={{ color: "#69707D" }}>{sub.focus}</div>
                    <div className="mt-auto pt-2 space-y-1" style={{ borderTop: `1px solid ${sub.color}20` }}>
                      {sub.ops.map((op) => (
                        <div key={op} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "#69707D" }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sub.color }} />
                          {op}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-12 sm:py-16 md:py-24" style={{ background: "#25205B" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4"><span className="w-6 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Where we operate</span></div>
          <h2 className="text-white mb-14" style={{ fontFamily: "var(--font-display)", fontSize: "36px" }}>Four cities. One standard.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { city: "Benin City", role: "Headquarters", address: "GRA Phase 2, Benin City, Edo State", phone: "+234 802 000 0001", note: "Where it all started. Hummingbird Properties & NAGA Prime Construction HQ." },
              { city: "Abuja", role: "Project Office", address: "Gwarimpa, FCT Abuja", phone: "+234 802 000 0003", note: "Palm Court, Dawaki, Jabi — and our NAGA Stays flagship units." },
              { city: "Lagos", role: "Regional Office", address: "Lekki Phase 1, Lagos Island", phone: "+234 802 000 0002", note: "Emerald Gardens actively under construction. Prime Apartment expanding here." },
              { city: "China", role: "International Office", address: "People's Republic of China", phone: "", note: "Global Technology & Literacy Hub — Nigeria launch in preparation." },
            ].map((o) => (
              <div key={o.city} className="p-7 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(107,159,229,0.2)" }}>
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B9FE5" }}>{o.role}</div>
                <h3 className="text-white text-[24px] font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>{o.city}</h3>
                <p className="text-[13px] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>{o.address}</p>
                {o.phone && <p className="text-[13px] font-medium mb-3" style={{ color: "#6B9FE5" }}>{o.phone}</p>}
                <p className="text-[12px] italic leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{o.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── SERVICES PAGE ──────────────────────────────────────────────── */
function ServicesPage() {
  const services = [
    {
      id: "construction",
      number: "01", title: "Construction", subtitle: "From ground to keys",
      subsidiary: "NAGA Prime Construction & PM", subColor: "#D4A843", subBg: "#FEF7E7",
      desc: "We handle the full build ourselves. That means site preparation, foundation work, structure, MEP, finishes and the handover walkthrough with the buyer. Every material request goes through a documented approval chain — project officer, IVM verification, supervisor approval, finance disbursement. Nothing gets paid for unless it can be accounted for.",
      highlights: ["Project officers on every active site", "Documented procurement approval chain for all materials", "Daily site reports submitted with photographic evidence", "IVM team verifies every delivery against the purchase order", "Buyers receive a full snagging report before handover"],
      img: ESTATE_IMAGES.palmCourt[2],
    },
    {
      id: "real-estate",
      number: "02", title: "Real Estate Sales", subtitle: "Homes to buy, off-plan or ready now",
      subsidiary: "Hummingbird Properties", subColor: "#6B9FE5", subBg: "#EAF2FC",
      desc: "We have units available now and units you can reserve off-plan at a better price. Payment can be outright or through an installment structure — we're flexible on how you pay, but not on what gets documented. You'll have a full payment history, a clear outstanding balance and a named next payment date at every stage.",
      highlights: ["Outright purchase or installment plan", "Off-plan pricing available on active developments", "Clear payment schedule from day one", "Payment history accessible through the customer account", "Title documentation handled on full settlement"],
      img: ESTATE_IMAGES.granite[0],
    },
    {
      id: "estate-management",
      number: "03", title: "Estate Management", subtitle: "Running a community properly",
      subsidiary: "NAGA Prime Construction & PM", subColor: "#D4A843", subBg: "#FEF7E7",
      desc: "Running a gated estate well is harder than most people realise. Beyond collecting service charges, there's security coordination, maintenance management, vendor relationships, resident communication and financial reporting. We do all of it — and residents can raise requests, track their charge status and reach the estate manager through their own portal.",
      highlights: ["Annual service charge billing and collection", "Resident portal for maintenance and payments", "24-hour security coordination", "Contractor and vendor management", "Monthly estate financial reporting"],
      img: ESTATE_IMAGES.palmCourt[1],
    },
    {
      id: "naga-stays",
      number: "04", title: "NAGA Stays", subtitle: "Short-let without the compromise",
      subsidiary: "Prime Apartment", subColor: "#C07A5A", subBg: "#FAF0EB",
      desc: "Some of our finished apartments are run as short-let units under NAGA Stays. These are real apartments in buildings we built and still manage. Guests get hotel-quality service in a residential setting. We handle check-in, housekeeping, maintenance and revenue reporting. You're not booking through an aggregator — you're staying with the company that built the building.",
      highlights: ["Fully furnished, professionally managed units", "Daily, weekly and extended stay options", "Housekeeping and maintenance included", "Direct booking via the guest portal", "Available in Abuja and Benin City"],
      img: STAYS_IMAGES.heroBanner,
    },
    {
      id: "technology",
      number: "05", title: "Technology & Literacy", subtitle: "Global reach, Nigerian future",
      subsidiary: "Global Technology & Literacy Hub", subColor: "#8B5CF6", subBg: "#F5F3FF",
      desc: "The Global Technology & Literacy Hub is NAGA's fifth arm — a technology and education initiative with active operations in China and a Nigeria launch in preparation. The Hub bridges global technological exposure with literacy programmes designed for the Nigerian context. It operates as a distinct business within the NAGA Group, sharing the group's core commitment to accountability and long-term impact.",
      highlights: ["Active China operations since 2023", "Technology partnerships and exchange programmes", "Literacy and capacity-building curriculum", "Nigeria launch in preparation", "Operates independently within the NAGA Group"],
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=600&fit=crop&auto=format",
    },
  ];

  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16" style={{ background: "#25205B" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5"><span className="w-6 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Services</span></div>
          <h1 className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 58px)", lineHeight: 1.1, maxWidth: "640px" }}>
            We build it.<br /><span className="italic" style={{ color: "#6B9FE5" }}>We run it.</span><br />We sell it.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)", maxWidth: "500px" }}>
            Five services across four subsidiaries. Construction feeds real estate. Real estate leads to estate management. Finished apartments become NAGA Stays units. The whole system holds together.
          </p>
        </div>
      </div>

      {/* Quick navigation by subsidiary */}
      <div style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: "#69707D" }}>Services by subsidiary — jump to section</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { subsidiary: "Hummingbird Properties", tag: "Real Estate", color: "#6B9FE5", lightBg: "#EAF2FC", items: ["Property Sales", "Off-Plan Investment", "Installment Plans"], anchor: "#service-real-estate" },
              { subsidiary: "NAGA Prime Construction & PM", tag: "Construction", color: "#D4A843", lightBg: "#FEF7E7", items: ["Full-cycle Construction", "Site Supervision", "Estate Management"], anchor: "#service-construction" },
              { subsidiary: "Prime Apartment", tag: "NAGA Stays", color: "#C07A5A", lightBg: "#FAF0EB", items: ["Short-let Hosting", "Guest Management", "Extended Stays"], anchor: "#service-naga-stays" },
              { subsidiary: "Global Technology & Literacy Hub", tag: "Technology", color: "#8B5CF6", lightBg: "#F5F3FF", items: ["Technology Projects", "Literacy Programmes", "Global Partnerships"], anchor: "#service-technology" },
            ].map((s) => (
              <a key={s.subsidiary} href={s.anchor}
                className="block p-5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style={{ background: "white", border: `1.5px solid ${s.color}28`, textDecoration: "none" }}>
                <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full inline-block mb-3" style={{ background: s.lightBg, color: s.color }}>{s.tag}</span>
                <div className="font-semibold text-[13px] mb-3" style={{ color: "#252731" }}>{s.subsidiary}</div>
                <ul className="space-y-1.5 mb-4">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[11px]" style={{ color: "#69707D" }}>
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: s.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] font-semibold" style={{ color: s.color }}>View section →</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Service sections */}
      <div className="bg-white">
        {services.map((s, i) => (
          <section key={s.number} id={`service-${s.id}`} className="py-12 sm:py-16 md:py-24" style={{ background: i % 2 === 0 ? "white" : "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
            <div className="max-w-7xl mx-auto px-6">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${i % 2 !== 0 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div>
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full inline-block mb-4" style={{ background: s.subBg, color: s.subColor }}>{s.subsidiary}</span>
                  <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#6B9FE5" }}>{s.number} — {s.subtitle}</div>
                  <h2 className="mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 38px)", color: "#252731", lineHeight: 1.15 }}>{s.title}</h2>
                  <p className="text-[15px] leading-relaxed mb-7" style={{ color: "#69707D" }}>{s.desc}</p>
                  <ul className="space-y-2.5">
                    {s.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-[13px]" style={{ color: "#252731" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5"><circle cx="8" cy="8" r="7" fill="#EAF2FC" /><path d="M5 8l2.5 2.5L11 5.5" stroke="#25205B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative rounded-2xl overflow-hidden" style={{ height: "380px", background: "#EAF2FC" }}>
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ─── PROPERTIES PAGE ────────────────────────────────────────────── */
function VirtualTourModal({ prop, onClose }: { prop: { name: string; location: string; images: string[]; desc?: string; type?: string; price?: number }; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<"photos" | "video">("photos");
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setImgIdx((i) => (i + 1) % prop.images.length);
      if (e.key === "ArrowLeft")  setImgIdx((i) => (i - 1 + prop.images.length) % prop.images.length);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, prop.images.length]);
  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "rgba(8,6,30,0.97)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color: "#6B9FE5" }}>Virtual Tour</div>
          <div className="text-white font-semibold text-[16px]" style={{ fontFamily: "var(--font-display)" }}>{prop.name}</div>
          <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>{prop.location}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            {(["photos", "video"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 text-[11px] font-semibold capitalize transition-all"
                style={{ background: tab === t ? "rgba(107,159,229,0.2)" : "transparent", color: tab === t ? "#6B9FE5" : "rgba(255,255,255,0.45)" }}>
                {t === "photos" ? "📸 Photos" : "▶ Video Tour"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-0 min-h-0">
        {/* Primary display */}
        <div className="flex-1 relative flex items-center justify-center" style={{ background: "#050412" }}>
          {tab === "photos" ? (
            <>
              <img src={prop.images[imgIdx]} alt={prop.name} className="max-h-full max-w-full object-contain" style={{ width: "100%", height: "100%" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg,transparent 60%,rgba(8,6,30,0.6) 100%)" }} />
              {/* Nav arrows */}
              {prop.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i - 1 + prop.images.length) % prop.images.length)} className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                    ‹
                  </button>
                  <button onClick={() => setImgIdx((i) => (i + 1) % prop.images.length)} className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                    ›
                  </button>
                </>
              )}
              {/* Counter */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
                {imgIdx + 1} / {prop.images.length}
              </div>
            </>
          ) : (
            /* Video tour panel */
            <div className="w-full h-full flex items-center justify-center relative">
              <img src={prop.images[0]} alt={prop.name} className="absolute inset-0 w-full h-full object-cover" style={{ filter: playing ? "blur(3px)" : "none", transition: "filter 0.3s" }} />
              <div className="absolute inset-0" style={{ background: playing ? "rgba(8,6,30,0.7)" : "rgba(8,6,30,0.45)" }} />
              {!playing ? (
                <button onClick={() => setPlaying(true)} className="relative z-10 flex flex-col items-center gap-4 group">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(107,159,229,0.9)", boxShadow: "0 0 0 16px rgba(107,159,229,0.15)" }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ marginLeft: 4 }}><path d="M6 4l18 10L6 24V4z" fill="white"/></svg>
                  </div>
                  <div className="text-white text-[13px] font-semibold" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>Watch Video Walkthrough</div>
                  <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{prop.name} · {prop.type ?? "Estate"}</div>
                </button>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(107,159,229,0.15)", border: "1px solid rgba(107,159,229,0.3)" }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="3" width="4" height="16" rx="1.5" fill="#6B9FE5"/><rect x="14" y="3" width="4" height="16" rx="1.5" fill="#6B9FE5"/></svg>
                  </div>
                  <div className="text-white font-semibold text-[16px]">Video tour is playing…</div>
                  <div className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Full video walkthrough would stream here in production.<br/>Contact us to arrange a live guided tour.
                  </div>
                  <button onClick={() => setPlaying(false)} className="mt-2 px-5 py-2 rounded-lg text-[12px] font-semibold" style={{ background: "rgba(107,159,229,0.15)", color: "#6B9FE5", border: "1px solid rgba(107,159,229,0.3)" }}>
                    Stop
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: thumbnails + info */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>All Photos</div>
            {prop.images.map((img, i) => (
              <div key={i} onClick={() => { setImgIdx(i); setTab("photos"); }} className="relative overflow-hidden rounded-xl cursor-pointer transition-all" style={{ height: 90, border: i === imgIdx && tab === "photos" ? "2px solid #6B9FE5" : "2px solid transparent" }}>
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === imgIdx && tab === "photos" && <div className="absolute inset-0 rounded-xl" style={{ background: "rgba(107,159,229,0.15)" }} />}
              </div>
            ))}
          </div>
          {/* Estate info */}
          <div className="p-5 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {prop.price !== undefined && (
              <div className="text-[22px] font-bold mb-1" style={{ color: "white", fontFamily: "var(--font-display)" }}>₦{(prop.price / 1_000_000).toFixed(0)}M</div>
            )}
            <div className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>{prop.desc ?? ""}</div>
            <button className="w-full py-2.5 rounded-xl text-[12px] font-semibold" style={{ background: "#6B9FE5", color: "white" }}>
              Enquire about this property
            </button>
          </div>
        </div>
      </div>

      {/* Bottom thumbnail strip — photos only */}
      {tab === "photos" && (
        <div className="flex gap-2 px-5 py-3 overflow-x-auto shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
          {prop.images.map((img, i) => (
            <div key={i} onClick={() => setImgIdx(i)} className="shrink-0 overflow-hidden rounded-lg cursor-pointer transition-all"
              style={{ width: 60, height: 44, border: i === imgIdx ? "2px solid #6B9FE5" : "2px solid transparent", opacity: i === imgIdx ? 1 : 0.5 }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const GALLERY_SLIDES = [
  {
    id: "gs1", subsidiary: "Hummingbird Properties", tag: "Real Estate", subColor: "#6B9FE5", subBg: "#EAF2FC",
    headline: "Premium residential sales across three cities",
    desc: "Apartments and land in Abuja, Lagos and Benin City. Every unit quality-assured before it reaches the market.",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs2", subsidiary: "Hummingbird Properties", tag: "Estate Management", subColor: "#6B9FE5", subBg: "#EAF2FC",
    headline: "Managed communities that hold their value",
    desc: "Service charges, maintenance coordination, security oversight and community welfare — all managed end-to-end for NAGA residents.",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs3", subsidiary: "NAGA Prime Construction & PM", tag: "Construction", subColor: "#D4A843", subBg: "#FEF7E7",
    headline: "Full-cycle construction from ground up",
    desc: "Structural work, finishing, fit-out and site coordination — NAGA Prime Construction delivers at every milestone, on every project.",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs4", subsidiary: "NAGA Prime Construction & PM", tag: "Project Management", subColor: "#D4A843", subBg: "#FEF7E7",
    headline: "Timelines kept. Budgets respected.",
    desc: "Our PM team coordinates contractors, procurement and site logistics so developments stay on schedule from groundbreaking to handover.",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs5", subsidiary: "Prime Apartment (NAGA Stays)", tag: "Short-let Hospitality", subColor: "#C07A5A", subBg: "#FAF0EB",
    headline: "Fully furnished apartments, serviced daily",
    desc: "Hotel-level service standards, apartment-level space. Every NAGA Stays unit is styled, stocked and guest-ready on arrival.",
    img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs6", subsidiary: "Prime Apartment (NAGA Stays)", tag: "Corporate & Leisure", subColor: "#C07A5A", subBg: "#FAF0EB",
    headline: "Where business travel meets comfort",
    desc: "Extended stays, corporate bookings and weekend getaways in Abuja and Benin City. Consistent quality, every visit.",
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs7", subsidiary: "Global Technology & Literacy Hub", tag: "Technology Transfer", subColor: "#8B5CF6", subBg: "#F5F3FF",
    headline: "Bridging Nigeria and China through technology",
    desc: "The GTL Hub facilitates technology transfer, digital infrastructure projects and bilateral partnerships across West Africa.",
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&h=900&fit=crop&auto=format",
  },
  {
    id: "gs8", subsidiary: "Global Technology & Literacy Hub", tag: "Digital Literacy", subColor: "#8B5CF6", subBg: "#F5F3FF",
    headline: "Education programmes for the next generation",
    desc: "Skill-building initiatives in digital literacy, technology adoption and vocational training — expanding access to knowledge across Nigeria.",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=900&fit=crop&auto=format",
  },
];

const SLIDE_DURATION = 5000;

function PropertiesPage({ onEnterPlatform, onOpenModal }: { onEnterPlatform: () => void; onOpenModal: (d: ModalData) => void }) {
  const [activeTab, setActiveTab] = useState<"units" | "land" | "gallery">("units");
  const [filter, setFilter] = useState("All");
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [tourProp, setTourProp] = useState<{ name: string; location: string; images: string[]; desc?: string; type?: string; price?: number } | null>(null);

  useEffect(() => {
    if (!galleryOpen || isPaused) return;
    setSlideProgress(0);
    const start = Date.now();
    const progressId = setInterval(() => {
      setSlideProgress(Math.min(((Date.now() - start) / SLIDE_DURATION) * 100, 100));
    }, 50);
    const advanceId = setTimeout(() => {
      setSlideIdx((prev) => (prev + 1) % GALLERY_SLIDES.length);
    }, SLIDE_DURATION);
    return () => { clearInterval(progressId); clearTimeout(advanceId); };
  }, [slideIdx, galleryOpen, isPaused]);

  const units = [
    { name: "Palm Court — Unit A4", project: "palm-court", location: "Gwarimpa, Abuja", type: "3-Bedroom", size: "210 sqm", floor: 2, price: 95_000_000, status: "Available", images: [...ESTATE_IMAGES.palmCourt.slice(0, 2), STAYS_IMAGES.studio[0]], desc: "A well-proportioned 3-bedroom on the second floor of Palm Court in Gwarimpa. Open-plan living area, good light, dedicated parking and a short walk to the main road." },
    { name: "Palm Court — Unit B2", project: "palm-court", location: "Gwarimpa, Abuja", type: "4-Bedroom Penthouse", size: "310 sqm", floor: 5, price: 145_000_000, status: "Reserved", images: [STAYS_IMAGES.penthouse[0], ESTATE_IMAGES.palmCourt[1]], desc: "The top-floor unit. Full-floor layout with a private terrace, 4 bedrooms and views across Gwarimpa. Rarely available." },
    { name: "Dawaki — Unit 4", project: "dawaki", location: "Dawaki, Abuja", type: "2-Bedroom", size: "140 sqm", floor: 2, price: 52_000_000, status: "Pre-Sale", images: [...ESTATE_IMAGES.dawaki.slice(0, 2)], desc: "Lock in your price before the build is done. Second floor, 2 bedrooms, great cross-ventilation and good natural light from both aspects." },
    { name: "Jabi — Unit 9A", project: "jabi", location: "Jabi, Abuja", type: "3-Bedroom", size: "190 sqm", floor: 4, price: 88_000_000, status: "Pre-Sale", images: [ESTATE_IMAGES.jabi[0], STAYS_IMAGES.twoBed[0]], desc: "Fourth floor in NAGA Jabi with a direct view towards the lake corridor. 3 bedrooms, open-plan kitchen-diner and rooftop access included." },
    { name: "Granite Heights — Unit 7", project: "granite", location: "GRA, Benin City", type: "3-Bedroom", size: "185 sqm", floor: 3, price: 65_000_000, status: "Sold", images: [ESTATE_IMAGES.granite[0]], desc: "Now sold. Shown here as a reference for the type of finish available at Granite Heights." },
    { name: "Granite Heights — Unit 11", project: "granite", location: "GRA, Benin City", type: "2-Bedroom", size: "135 sqm", floor: 4, price: 48_000_000, status: "Available", images: [ESTATE_IMAGES.granite[0], STAYS_IMAGES.oneBed[0]], desc: "A solid 2-bedroom on the fourth floor. Good size, city views, and full backup power. One of the last available at this price in GRA." },
    { name: "Emerald Gardens — Unit 4B", project: "emerald", location: "Lekki Phase 1, Lagos", type: "3-Bedroom (Off-Plan)", size: "185 sqm", floor: 2, price: 85_000_000, status: "Pre-Sale", images: [...ESTATE_IMAGES.emerald.slice(0, 2)], desc: "Buy at launch price before construction reaches this floor. Rooftop pool included in the scheme. Lekki Phase 1 address." },
    { name: "Granite Heights — Unit 3", project: "granite", location: "GRA, Benin City", type: "3-Bedroom", size: "185 sqm", floor: 1, price: 65_000_000, status: "NAGA Stays", images: [STAYS_IMAGES.studio[0], STAYS_IMAGES.oneBed[0]], desc: "Currently running as a NAGA Stays short-let. Available for nightly and extended bookings." },
  ];

  const landListings = [
    {
      id: "dawaki-a7", name: "Dawaki — Plot A7", location: "Dawaki, FCT Abuja", landUse: "Residential",
      size: "400 sqm", price: 15_000_000, status: "Available",
      img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&h=500&fit=crop&auto=format",
      desc: "Well-positioned residential plot in Dawaki, directly adjacent to our NAGA Dawaki development. Survey document and deed of assignment ready. Good road access with no encumbrance.",
      features: ["Survey Document Ready", "Good Road Access", "No Encumbrance", "Near NAGA Dawaki"],
    },
    {
      id: "jabi-12", name: "Jabi Lakeside — Plot 12", location: "Jabi, FCT Abuja", landUse: "Mixed-Use",
      size: "500 sqm", price: 32_000_000, status: "Available",
      img: "https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?w=700&h=500&fit=crop&auto=format",
      desc: "Premium plot close to the Jabi Lake corridor and our NAGA Jabi development. Zoned for residential or light commercial use. High-value neighbourhood with excellent infrastructure and C of O.",
      features: ["Mixed-Use Zoning", "Lake Corridor Proximity", "Paved Road Frontage", "C of O Available"],
    },
    {
      id: "gra-benin-3b", name: "GRA Benin — Plot 3B", location: "GRA Phase 2, Benin City", landUse: "Residential",
      size: "600 sqm", price: 8_000_000, status: "Available",
      img: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=700&h=500&fit=crop&auto=format",
      desc: "Clean residential plot in GRA Phase 2, Benin City — the same neighbourhood as Granite Heights. All documentation in order. Good value for quality land in a proven location.",
      features: ["GRA Address", "Residential Zoning", "All Documents Ready", "Near Granite Heights"],
    },
    {
      id: "lekki-9a", name: "Lekki Corridor — Plot 9A", location: "Lekki Phase 2, Lagos", landUse: "Commercial",
      size: "300 sqm", price: 45_000_000, status: "Available",
      img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&h=500&fit=crop&auto=format",
      desc: "Commercial plot on the Lekki corridor, close to our Emerald Gardens site. Fast-appreciating area with strong infrastructure. Ideal for commercial or mixed-use development.",
      features: ["Commercial Zoning", "High-Traffic Corridor", "Lagos Island Proximity", "Strong Infrastructure"],
    },
    {
      id: "kuje-fha", name: "Kuje FHA — Plots Available", location: "Kuje, FCT Abuja", landUse: "Residential",
      size: "From 1,000 sqm", price: 5_000_000, status: "Available",
      img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=700&h=500&fit=crop&auto=format",
      desc: "Multiple FHA-allocated plots available in Kuje FCT. Affordable entry point for land banking in the capital territory. Good for long-term hold or phased construction.",
      features: ["FHA Allocation", "Multiple Plots Available", "Budget Entry Point", "Long-Term Value"],
    },
  ];

  const filters = ["All", "Available", "Pre-Sale", "Reserved", "Sold", "NAGA Stays"];
  const filtered = filter === "All" ? units : units.filter((p) => p.status === filter);
  const statusColors: Record<string, { bg: string; color: string }> = {
    Available: { bg: "#dcfce7", color: "#166534" },
    "Pre-Sale": { bg: "#EAF2FC", color: "#25205B" },
    Reserved: { bg: "#fef3c7", color: "#92400e" },
    Sold: { bg: "#25205B", color: "white" },
    "NAGA Stays": { bg: "#6B9FE5", color: "white" },
  };
  const landStatusColors: Record<string, { bg: string; color: string }> = {
    Available: { bg: "#dcfce7", color: "#166534" },
    Reserved: { bg: "#fef3c7", color: "#92400e" },
    Sold: { bg: "#25205B", color: "white" },
  };

  return (
    <>
    {tourProp && <VirtualTourModal prop={tourProp} onClose={() => setTourProp(null)} />}

    {/* ── Gallery modal ──────────────────────────────────── */}
    {galleryOpen && (() => {
      const slide = GALLERY_SLIDES[slideIdx];
      return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6"
          style={{ background: "rgba(8,6,30,0.92)" }}
          onClick={() => setGalleryOpen(false)}>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col"
            style={{ width: "min(95vw, 960px)", height: "clamp(320px, 75vh, 700px)" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Crossfading slides */}
            {GALLERY_SLIDES.map((s, i) => (
              <div key={s.id} className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === slideIdx ? 1 : 0, zIndex: i === slideIdx ? 1 : 0 }}>
                <img src={s.img} alt={s.headline} className="w-full h-full object-cover"
                  style={{ transform: i === slideIdx && !isPaused ? "scale(1.04)" : "scale(1)", transition: `transform ${SLIDE_DURATION}ms linear` }} />
              </div>
            ))}

            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, background: "linear-gradient(to top, rgba(8,6,30,0.92) 0%, rgba(8,6,30,0.38) 48%, transparent 72%)" }} />

            {/* Slide content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-9" style={{ zIndex: 3 }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full"
                  style={{ background: slide.subBg, color: slide.subColor }}>{slide.tag}</span>
                <span className="text-[10px] sm:text-[11px] font-medium hidden sm:inline" style={{ color: "rgba(255,255,255,0.55)" }}>{slide.subsidiary}</span>
              </div>
              <h3 className="text-white mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(16px,3.5vw,36px)", lineHeight: 1.15, maxWidth: 560 }}>{slide.headline}</h3>
              <p className="hidden sm:block text-[13px] sm:text-[14px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.62)", maxWidth: 500 }}>{slide.desc}</p>
              {/* Dot indicators */}
              <div className="flex items-center gap-2 mt-3">
                {GALLERY_SLIDES.map((s, i) => (
                  <button key={s.id} onClick={() => { setSlideIdx(i); setIsPaused(false); }}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === slideIdx ? 18 : 5, height: 5, background: i === slideIdx ? slide.subColor : "rgba(255,255,255,0.28)" }} />
                ))}
                <span className="ml-1.5 text-[10px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{slideIdx + 1}/{GALLERY_SLIDES.length}</span>
              </div>
            </div>

            {/* Prev arrow */}
            <button onClick={() => { setSlideIdx((p) => (p - 1 + GALLERY_SLIDES.length) % GALLERY_SLIDES.length); setIsPaused(false); }}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ zIndex: 4, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {/* Next arrow */}
            <button onClick={() => { setSlideIdx((p) => (p + 1) % GALLERY_SLIDES.length); setIsPaused(false); }}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ zIndex: 4, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ zIndex: 5, background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full" style={{ width: `${slideProgress}%`, background: slide.subColor, transition: "none" }} />
            </div>

            {/* Pause/play */}
            <button onClick={() => setIsPaused((p) => !p)}
              className="absolute top-4 right-14 sm:right-16 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all"
              style={{ zIndex: 6, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}>
              {isPaused
                ? <><svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginLeft: 1 }}><path d="M1.5 1l7 3.5-7 3.5V1z" fill="currentColor"/></svg><span className="hidden sm:inline"> Resume</span></>
                : <><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x="1" y="1" width="2.5" height="7" rx="1" fill="currentColor"/><rect x="5.5" y="1" width="2.5" height="7" rx="1" fill="currentColor"/></svg><span className="hidden sm:inline"> Pause</span></>
              }
            </button>

            {/* Close */}
            <button onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ zIndex: 6, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      );
    })()}

    <div className="pt-[68px]">
      {/* Hero */}
      <div className="px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16" style={{ background: "#25205B" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5"><span className="w-6 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Property portfolio</span></div>
          <h1 className="text-white mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 56px)", lineHeight: 1.1 }}>Find your space.</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", maxWidth: "540px" }}>
            Residential apartments and land for sale, active development projects you can buy into, and short-let units. Abuja, Lagos and Benin City.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(107,159,229,0.15)", color: "#6B9FE5", border: "1px solid rgba(107,159,229,0.25)" }}>Apartments from ₦48M</span>
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(212,168,67,0.15)", color: "#D4A843", border: "1px solid rgba(212,168,67,0.25)" }}>Land from ₦5M</span>
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}>Off-plan available</span>
          </div>
        </div>
      </div>

      {/* Developments overview */}
      <section className="py-14" style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px" style={{ background: "#D4A843" }} />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#D4A843" }}>NAGA Prime Construction</span>
          </div>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,30px)", color: "#252731", lineHeight: 1.15 }}>Active development pipeline</h2>
            <span className="text-[12px] px-3 py-1.5 rounded-full font-semibold" style={{ background: "#FEF7E7", color: "#D4A843" }}>5 projects · ₦1.35B+ total value</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROJECTS.map((p) => (
              <div key={p.id} className="p-5 rounded-xl transition-all hover:shadow-sm" style={{ background: "white", border: "1px solid #E8EAF0" }}>
                <div className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: "#69707D" }}>{p.tag}</div>
                <div className="font-semibold text-[13px] leading-snug mb-1" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>{p.name}</div>
                <div className="text-[10px] mb-4" style={{ color: "#69707D" }}>{p.units}</div>
                <div className="h-1.5 rounded-full mb-1.5" style={{ background: "#F0F2F6" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.progress >= 80 ? "#D4A843" : "#6B9FE5" }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]" style={{ color: "#69707D" }}>{p.progress}% done</span>
                  <span className="text-[11px] font-semibold" style={{ color: "#25205B" }}>{p.budget}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <div className="sticky top-[68px] z-40 bg-white" style={{ borderBottom: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            {([
              { id: "units" as const, label: "Residential Units", count: units.length },
              { id: "land" as const, label: "Land for Sale", count: landListings.length },
              { id: "gallery" as const, label: "Gallery", count: GALLERY_SLIDES.length },
            ]).map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-5 py-4 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-2"
                style={{ borderColor: activeTab === t.id ? "#25205B" : "transparent", color: activeTab === t.id ? "#25205B" : "#69707D" }}>
                {t.label}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: activeTab === t.id ? "#EAF2FC" : "#F7F8FA", color: activeTab === t.id ? "#25205B" : "#8C93A0" }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Units tab ─────────────────────────────────── */}
      {activeTab === "units" && (
        <div className="py-16 bg-white min-h-screen">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Hummingbird Properties — available units</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-10">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all"
                  style={{ background: filter === f ? "#25205B" : "#F7F8FA", color: filter === f ? "white" : "#69707D", border: filter === f ? "none" : "1px solid #E8EAF0" }}>
                  {f}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((prop) => {
                const sc = statusColors[prop.status] ?? { bg: "#F7F8FA", color: "#69707D" };
                const modalData = {
                  kind: "property" as const, name: prop.name, location: prop.location, images: prop.images,
                  subhead: prop.location, desc: prop.desc, status: prop.status, statusColor: sc,
                  price: `₦${(prop.price / 1_000_000).toFixed(0)}M`,
                  rows: [{ label: "Type", value: prop.type }, { label: "Size", value: prop.size }, { label: "Floor", value: `Floor ${prop.floor}` }, { label: "Status", value: prop.status }],
                  features: ["24-Hour Security", "Backup Power", "Parking", "Modern Finishes"],
                  ctas: prop.status === "NAGA Stays" ? [{ label: "Book a stay", primary: true, action: "stays-portal" as const }]
                    : prop.status === "Sold" ? []
                    : [{ label: "Enquire now", primary: true, action: "enquire" as const }],
                };
                return (
                  <div key={prop.name} className="group bg-white rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1" style={{ border: "1px solid #E8EAF0" }}>
                    <div className="relative overflow-hidden cursor-pointer" style={{ height: 224, background: "#EAF2FC" }}
                      onClick={() => onOpenModal(modalData)}>
                      <ImageGallery images={prop.images} alt={prop.name} height={224} />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: "rgba(37,32,91,0.52)" }}>
                        <span className="text-white text-[13px] font-semibold">View details →</span>
                      </div>
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full z-10" style={{ background: sc.bg, color: sc.color }}>{prop.status}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTourProp({ name: prop.name, location: prop.location, images: prop.images, desc: prop.desc, type: prop.type, price: prop.price }); }}
                        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105"
                        style={{ background: "rgba(8,6,30,0.75)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(107,159,229,0.4)" }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 4-8 4V2z" fill="#6B9FE5"/></svg>
                        Virtual Tour
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="text-[11px] mb-1 font-medium" style={{ color: "#69707D" }}>{prop.location}</div>
                      <h3 className="text-[16px] font-semibold mb-1 cursor-pointer" style={{ color: "#252731", fontFamily: "var(--font-display)" }}
                        onClick={() => onOpenModal(modalData)}>{prop.name}</h3>
                      <div className="text-[12px] mb-4" style={{ color: "#69707D" }}>{prop.type} · {prop.size} · Floor {prop.floor}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-[20px] font-bold" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>₦{(prop.price / 1_000_000).toFixed(0)}M</div>
                        {prop.status === "NAGA Stays" && <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#6B9FE5", color: "white" }}>Short-let</span>}
                        {prop.status !== "NAGA Stays" && prop.status !== "Sold" && <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#EAF2FC", color: "#25205B" }}>Enquire →</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-16 p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              <div>
                <h4 className="font-semibold text-[16px] mb-1" style={{ color: "#252731" }}>Already living in a NAGA estate?</h4>
                <p className="text-[13px]" style={{ color: "#69707D" }}>Log in to pay your service charges, raise maintenance requests and stay connected with your estate team.</p>
              </div>
              <button onClick={onEnterPlatform} className="shrink-0 flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-xl text-white" style={{ background: "#25205B" }}>
                Resident login →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Land tab ──────────────────────────────────── */}
      {activeTab === "land" && (
        <div className="py-16 bg-white min-h-screen">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-px" style={{ background: "#D4A843" }} />
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#D4A843" }}>Hummingbird Properties — Land Division</span>
            </div>
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3vw,36px)", color: "#252731", lineHeight: 1.1 }}>Land for sale</h2>
                <p className="mt-2 text-[14px]" style={{ color: "#69707D" }}>Residential and commercial plots across Abuja, Lagos and Benin City. All titles verified.</p>
              </div>
              <div className="text-[12px] px-4 py-2 rounded-xl font-semibold" style={{ background: "#FEF7E7", color: "#D4A843", border: "1px solid rgba(212,168,67,0.2)" }}>
                Prices from ₦5M · Documentation ready
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landListings.map((land) => {
                const sc = landStatusColors[land.status] ?? { bg: "#F7F8FA", color: "#69707D" };
                const landUseColors: Record<string, string> = { Residential: "#6B9FE5", Commercial: "#D4A843", "Mixed-Use": "#8B5CF6" };
                const landUseColor = landUseColors[land.landUse] ?? "#69707D";
                return (
                  <div key={land.id} className="group bg-white rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1" style={{ border: "1px solid #E8EAF0" }}>
                    <div className="relative overflow-hidden" style={{ height: 220 }}>
                      <img src={land.img} alt={land.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(15,13,46,0) 50%, rgba(15,13,46,0.55) 100%)" }} />
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full z-10" style={{ background: sc.bg, color: sc.color }}>{land.status}</span>
                      <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full z-10" style={{ background: "rgba(15,13,46,0.6)", color: "white", backdropFilter: "blur(4px)" }}>{land.landUse}</span>
                      <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: landUseColor }} />
                        <span className="text-[10px] font-semibold text-white">{land.size}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="text-[11px] font-medium mb-1" style={{ color: "#69707D" }}>{land.location}</div>
                      <h3 className="font-semibold text-[16px] mb-2" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>{land.name}</h3>
                      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#69707D" }}>{land.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {land.features.map((f) => (
                          <span key={f} className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "#F7F8FA", color: "#69707D", border: "1px solid #E8EAF0" }}>{f}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid #F0F2F6" }}>
                        <div>
                          <div className="text-[10px] font-medium mb-0.5" style={{ color: "#69707D" }}>Plot size · {land.size}</div>
                          <div className="text-[20px] font-bold" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>₦{(land.price / 1_000_000).toFixed(0)}M</div>
                        </div>
                        <button onClick={() => onOpenModal({
                          kind: "property", name: land.name, location: land.location,
                          images: [land.img],
                          subhead: `${land.landUse} Land · ${land.location}`,
                          desc: land.desc,
                          price: `₦${(land.price / 1_000_000).toFixed(0)}M`,
                          status: land.status, statusColor: sc,
                          rows: [{ label: "Land Use", value: land.landUse }, { label: "Plot Size", value: land.size }, { label: "Status", value: land.status }],
                          features: land.features,
                          ctas: land.status !== "Sold" ? [{ label: "Enquire about this plot", primary: true, action: "enquire" as const }] : [],
                        })}
                          className="px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:-translate-y-0.5"
                          style={{ background: "#EAF2FC", color: "#25205B" }}>
                          View details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-14 p-8 rounded-2xl" style={{ background: "linear-gradient(135deg, #25205B 0%, #1a1742 100%)" }}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: "#D4A843" }}>Land banking advice</div>
                  <h4 className="text-[20px] font-semibold mb-2 text-white" style={{ fontFamily: "var(--font-display)" }}>Not sure which plot is right for you?</h4>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 480 }}>Our land sales team can advise on zoning, documentation, development potential and payment plans. Reach out and we will help you make the right decision.</p>
                </div>
                <button onClick={onEnterPlatform} className="shrink-0 px-6 py-3.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5" style={{ background: "#D4A843", color: "#0f0d2e" }}>
                  Talk to our land team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Gallery tab — preview trigger ────────────── */}
      {activeTab === "gallery" && (
        <div className="py-10 sm:py-14 bg-white min-h-[60vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-start sm:items-end justify-between mb-6 sm:mb-8 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
                  <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>NAGA Group</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,34px)", color: "#252731", lineHeight: 1.1 }}>Our services gallery</h2>
                <p className="mt-1.5 text-[13px]" style={{ color: "#69707D" }}>{GALLERY_SLIDES.length} slides across all four subsidiaries · Opens in a pop-up</p>
              </div>
            </div>

            {/* Mosaic preview trigger */}
            <button className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl group cursor-pointer text-left block"
              style={{ aspectRatio: "16/7", minHeight: 200 }}
              onClick={() => { setGalleryOpen(true); setSlideIdx(0); setIsPaused(false); }}>
              {/* 2×2 mosaic of one image per subsidiary */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                {([0, 2, 4, 6] as const).map((idx) => (
                  <div key={idx} className="overflow-hidden">
                    <img src={GALLERY_SLIDES[idx].img} alt={GALLERY_SLIDES[idx].subsidiary}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                ))}
              </div>
              {/* Scrim */}
              <div className="absolute inset-0" style={{ background: "rgba(8,6,30,0.52)" }} />
              {/* Subsidiary badges */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-1.5 sm:gap-2 z-10">
                {[
                  { label: "Real Estate", color: "#6B9FE5", bg: "#EAF2FC" },
                  { label: "Construction", color: "#D4A843", bg: "#FEF7E7" },
                  { label: "Short-let", color: "#C07A5A", bg: "#FAF0EB" },
                  { label: "Technology", color: "#8B5CF6", bg: "#F5F3FF" },
                ].map((t) => (
                  <span key={t.label} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2 py-1 sm:px-2.5 rounded-full"
                    style={{ background: t.bg, color: t.color }}>{t.label}</span>
                ))}
              </div>
              {/* Play button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 0 0 12px rgba(255,255,255,0.06)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 3 }}><path d="M5 3l16 9L5 21V3z" fill="white"/></svg>
                </div>
                <span className="text-white text-[13px] sm:text-[15px] font-semibold tracking-wide">Open Gallery</span>
              </div>
              {/* Slide count */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 text-right">
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Service gallery</div>
                <div className="text-white font-semibold text-[12px] sm:text-[13px]">{GALLERY_SLIDES.length} slides · Loops automatically</div>
              </div>
            </button>

            {/* Subsidiary quick-access cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 sm:mt-5">
              {[
                { name: "Hummingbird Properties", color: "#6B9FE5", lightBg: "#EAF2FC", count: 2, startIdx: 0 },
                { name: "NAGA Prime Construction", color: "#D4A843", lightBg: "#FEF7E7", count: 2, startIdx: 2 },
                { name: "Prime Apartment · Stays", color: "#C07A5A", lightBg: "#FAF0EB", count: 2, startIdx: 4 },
                { name: "Global Technology Hub", color: "#8B5CF6", lightBg: "#F5F3FF", count: 2, startIdx: 6 },
              ].map((sub) => (
                <button key={sub.name} className="text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}
                  onClick={() => { setSlideIdx(sub.startIdx); setGalleryOpen(true); setIsPaused(false); }}>
                  <div className="w-2 h-2 rounded-full mb-2 sm:mb-2.5" style={{ background: sub.color }} />
                  <div className="text-[10px] sm:text-[11px] font-semibold leading-tight" style={{ color: "#252731" }}>{sub.name}</div>
                  <div className="mt-1 text-[9px] sm:text-[10px]" style={{ color: "#8C93A0" }}>{sub.count} slides →</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ─── STAYS PAGE ─────────────────────────────────────────────────── */

interface StaysRoom { label: string; img: string; note: string; }
interface StaysUnit {
  name: string; location: string; type: string; nightly: number; rating: number; reviews: number;
  amenities: string[]; status: string; desc: string;
  rooms: StaysRoom[];
}

function RoomTour({ rooms, onViewAll }: { rooms: StaysRoom[]; onViewAll: () => void }) {
  const [active, setActive] = useState(0);
  return (
    <div className="relative overflow-hidden cursor-pointer" style={{ minHeight: 380 }} onClick={onViewAll}>
      {rooms.map((r, i) => (
        <img key={r.label} src={r.img} alt={r.label} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" style={{ opacity: i === active ? 1 : 0 }} />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,46,0.8) 0%, transparent 55%)" }} />

      {/* Room tabs */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rooms.map((r, i) => (
            <button key={r.label} onClick={(e) => { e.stopPropagation(); setActive(i); }}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
              style={i === active ? { background: "white", color: "#25205B" } : { background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] italic" style={{ color: "rgba(255,255,255,0.6)" }}>{rooms[active].note}</div>
      </div>

      {/* View all overlay hint */}
      <div className="absolute top-4 right-4 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.35)", color: "white" }}>
        {rooms.length} photos · click to expand
      </div>
    </div>
  );
}

function StaysPage({ onEnterPlatform, onOpenModal, onNavigate }: { onEnterPlatform: () => void; onOpenModal: (d: ModalData) => void; onNavigate: (p: Page) => void }) {
  const units: StaysUnit[] = [
    {
      name: "Palm Court Premium Suite",
      location: "GRA, Benin City",
      type: "3-Bedroom Apartment",
      nightly: 125_000,
      rating: 4.8,
      reviews: 34,
      amenities: ["WiFi", "Smart TV", "Washer and Dryer", "Fully equipped kitchen", "Backup power", "Parking"],
      status: "Occupied until 30 Aug",
      desc: "A fully furnished 3-bedroom in our GRA Benin City development. Comfortable, quiet, and well-managed. The kitchen is properly stocked, the TV has streaming apps set up, and the estate security team is on-site 24 hours. Good for families or anyone who wants a real apartment rather than a hotel room.",
      rooms: [
        { label: "Living Area", img: "https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?w=800&h=550&fit=crop&auto=format", note: "Open-plan living and dining with natural light" },
        { label: "Master Bedroom", img: "https://images.unsplash.com/photo-1784653549288-07343300a44f?w=800&h=550&fit=crop&auto=format", note: "King bed, built-in wardrobe, blackout blinds" },
        { label: "Second Bedroom", img: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=800&h=550&fit=crop&auto=format", note: "Twin or queen configuration available" },
        { label: "Kitchen", img: "https://images.unsplash.com/photo-1725257928373-dc6d2ac7b145?w=800&h=550&fit=crop&auto=format", note: "Fully equipped with cookware, appliances and utensils" },
        { label: "Exterior", img: "https://images.unsplash.com/photo-1786609836248-310f4e75eec8?w=800&h=550&fit=crop&auto=format", note: "Secured building entrance with 24-hour gate security" },
      ],
    },
    {
      name: "The Gwarimpa Penthouse",
      location: "Gwarimpa, Abuja",
      type: "4-Bedroom Penthouse",
      nightly: 280_000,
      rating: 4.9,
      reviews: 22,
      amenities: ["WiFi", "Smart TV", "Pool access", "Rooftop terrace", "Concierge", "Backup power", "Gym access"],
      status: "Available from 5 Sep",
      desc: "The most generous unit we run. A full-floor penthouse in our Gwarimpa development with four bedrooms, a wraparound terrace, private pool access and a concierge on call. For families, corporate stays or anyone who doesn't want to compromise.",
      rooms: [
        { label: "Living Area", img: "https://images.unsplash.com/photo-1673563932782-28daf64ff066?w=800&h=550&fit=crop&auto=format", note: "Double-height ceilings with a large wraparound seating area" },
        { label: "Master Bedroom", img: "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&h=550&fit=crop&auto=format", note: "Super-king bed with ensuite and dressing area" },
        { label: "Third Bedroom", img: "https://images.unsplash.com/photo-1552858725-693709cc17c7?w=800&h=550&fit=crop&auto=format", note: "Guest room with queen bed and city view" },
        { label: "Kitchen", img: "https://images.unsplash.com/photo-1656402887556-e727ffe1f6d7?w=800&h=550&fit=crop&auto=format", note: "Island kitchen with premium appliances" },
        { label: "Rooftop", img: "https://images.unsplash.com/photo-1786609836595-72f93d38f090?w=800&h=550&fit=crop&auto=format", note: "Private rooftop terrace with pool and Abuja skyline views" },
      ],
    },
    {
      name: "Granite Heights — Corner Suite",
      location: "GRA, Benin City",
      type: "1-Bedroom Suite",
      nightly: 75_000,
      rating: 4.6,
      reviews: 41,
      amenities: ["WiFi", "Smart TV", "Full kitchen", "Backup power", "City view", "Parking"],
      status: "Available now",
      desc: "A well-lit corner 1-bedroom on the third floor of Granite Heights in GRA. Good views from two aspects, a full kitchen, reliable backup power and the building security team on-site around the clock. Practical, comfortable and in one of Benin City's best-value addresses.",
      rooms: [
        { label: "Bedroom", img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=550&fit=crop&auto=format", note: "Queen bed with en-suite and city views" },
        { label: "Living Area", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=550&fit=crop&auto=format", note: "Comfortable seating with Smart TV" },
        { label: "Kitchen", img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=550&fit=crop&auto=format", note: "Full kitchen — appliances, cookware, utensils included" },
      ],
    },
    {
      name: "Jabi Lakeside Studio",
      location: "Jabi, Abuja",
      type: "Executive Studio",
      nightly: 85_000,
      rating: 4.7,
      reviews: 18,
      amenities: ["WiFi", "Smart TV", "Kitchenette", "Backup power", "Work desk", "Parking"],
      status: "Available now",
      desc: "A compact, well-furnished studio on the upper floors of our Jabi development. Perfect for solo travelers or short business stays in Abuja. The building sits close to the Jabi Lake corridor — quiet, secure, and professionally managed by our estate team.",
      rooms: [
        { label: "Studio Room", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=550&fit=crop&auto=format", note: "Open-plan studio with queen bed and work area" },
        { label: "Kitchenette", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=550&fit=crop&auto=format", note: "Compact but fully equipped for self-catering" },
        { label: "Exterior", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=550&fit=crop&auto=format", note: "Jabi Lake corridor — walkable in minutes" },
      ],
    },
  ];

  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "480px" }}>
        <img src={STAYS_IMAGES.banner} alt="NAGA Stays furnished apartment" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,22,69,0.78) 0%, rgba(26,22,69,0.92) 100%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px" style={{ background: "#C07A5A" }} />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#C07A5A" }}>Prime Apartment</span>
          </div>
          <h1 className="text-white mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 58px)", lineHeight: 1.1 }}>NAGA Stays</h1>
          <p className="mb-10" style={{ color: "rgba(255,255,255,0.68)", fontSize: "16px", maxWidth: "520px", lineHeight: 1.7 }}>
            Real apartments in buildings we built and still manage. You're not booking through a listing platform — you're staying with the team that knows the building inside out.
          </p>
          <div className="flex flex-wrap gap-5">
            {[{ n: "4", l: "Available units" }, { n: "4.75", l: "Average rating" }, { n: "115+", l: "Guest stays" }, { n: "₦75k", l: "From per night" }].map((s) => (
              <div key={s.l} className="px-5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-[20px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{s.n}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-10 sm:py-16 md:py-20" style={{ background: "#F7F8FA", borderBottom: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px" style={{ background: "#6B9FE5" }} />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Simple process</span>
          </div>
          <h2 className="mb-12" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,3.5vw,36px)", color: "#252731", lineHeight: 1.15 }}>How a NAGA Stays booking works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: "01", title: "Browse & choose", desc: "Find the unit that suits your dates, group size and city. Each listing shows real-time availability and nightly pricing." },
              { step: "02", title: "Submit via portal", desc: "Log in or register as a guest through our portal and submit your booking with your arrival and departure dates." },
              { step: "03", title: "Get confirmed", desc: "We'll confirm within a few hours with check-in instructions, access code and a direct contact number for your stay." },
              { step: "04", title: "Arrive and settle in", desc: "The apartment is cleaned, stocked and ready. Our estate team is on-site. Any issue — you call us directly." },
            ].map((s) => (
              <div key={s.step} className="p-7 rounded-2xl" style={{ background: "white", border: "1px solid #E8EAF0" }}>
                <div className="text-[40px] font-bold leading-none mb-4" style={{ fontFamily: "var(--font-display)", color: "#E8EAF0" }}>{s.step}</div>
                <h3 className="font-semibold text-[15px] mb-2" style={{ color: "#252731" }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#69707D" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <button onClick={onEnterPlatform} className="px-7 py-3.5 text-[14px] font-semibold rounded-xl text-white transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ background: "#25205B" }}>
              Open guest portal
            </button>
            <button onClick={() => onNavigate("contact")} className="px-7 py-3.5 text-[14px] font-semibold rounded-xl transition-all hover:-translate-y-0.5" style={{ border: "1.5px solid #E8EAF0", color: "#25205B" }}>
              Talk to us first
            </button>
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="py-10 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          {units.map((u, i) => (
            <div key={u.name} className={`grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden ${i % 2 !== 0 ? "md:[&>*:first-child]:order-2" : ""}`} style={{ border: "1px solid #E8EAF0", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }}>
              <RoomTour rooms={u.rooms}
                onViewAll={() => onOpenModal({
                  kind: "stays", name: u.name, location: u.location,
                  images: u.rooms.map(r => r.img),
                  subhead: `${u.type} · ${u.location}`,
                  desc: u.desc,
                  price: `₦${(u.nightly / 1_000).toFixed(0)},000`, priceUnit: "per night",
                  rows: [{ label: "Type", value: u.type }, { label: "Rating", value: `${u.rating} out of 5 (${u.reviews} stays)` }, { label: "Availability", value: u.status }],
                  features: u.amenities,
                  ctas: [{ label: "Book via guest portal", primary: true, action: "stays-portal" }, { label: "Enquire", action: "enquire" }],
                })} />
              <div className="p-10 flex flex-col justify-center" style={{ background: "white" }}>
                <div className="flex items-center gap-1 mb-3">
                  {"★★★★★".split("").map((star, si) => (
                    <span key={si} className="text-[14px]" style={{ color: si < Math.floor(u.rating) ? "#F59E0B" : "#E8EAF0" }}>★</span>
                  ))}
                  <span className="text-[12px] ml-1.5 font-semibold" style={{ color: "#252731" }}>{u.rating}</span>
                  <span className="text-[12px]" style={{ color: "#69707D" }}>({u.reviews} stays)</span>
                </div>
                <h2 className="mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "#252731", lineHeight: 1.2 }}>{u.name}</h2>
                <p className="text-[13px] mb-4" style={{ color: "#69707D" }}>{u.location} · {u.type}</p>
                <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#69707D" }}>{u.desc}</p>
                <div className="text-[28px] font-bold mb-1" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>
                  ₦{(u.nightly / 1_000).toFixed(0)},000
                  <span className="text-[14px] font-medium ml-1.5" style={{ color: "#69707D" }}>/ night</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6 mt-4">
                  {u.amenities.map((a) => (<span key={a} className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium" style={{ background: "#EAF2FC", color: "#25205B" }}>{a}</span>))}
                </div>
                <div className="text-[12px] px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2" style={{ background: "#F7F8FA", color: "#69707D", border: "1px solid #E8EAF0" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: u.status.toLowerCase().includes("available") ? "#6B9FE5" : "#D4A843" }} />
                  {u.status}
                </div>
                <div className="flex gap-3">
                  <button onClick={onEnterPlatform} className="flex-1 py-3.5 text-[13px] font-semibold rounded-xl text-white transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ background: "#25205B" }}>Book via guest portal</button>
                  <button onClick={() => onNavigate("contact")} className="px-5 py-3.5 text-[13px] font-semibold rounded-xl transition-all hover:bg-[#EAF2FC]" style={{ border: "1px solid #E8EAF0", color: "#25205B" }}>Enquire</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── CONTACT PAGE ───────────────────────────────────────────────── */
function ContactPage() {
  const [sent, setSent] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("Buying a property");

  const teamOptions = [
    { tag: "Buy / Invest", color: "#6B9FE5", lightBg: "#EAF2FC", subsidiary: "Hummingbird Properties", desc: "Property purchase, off-plan reservation, installment plans", topic: "Buying a property" },
    { tag: "Construction", color: "#D4A843", lightBg: "#FEF7E7", subsidiary: "NAGA Prime Construction", desc: "Build partnerships, project inquiries, site visits", topic: "Construction inquiry" },
    { tag: "Short-let Stay", color: "#C07A5A", lightBg: "#FAF0EB", subsidiary: "Prime Apartment / NAGA Stays", desc: "Booking a furnished apartment, pricing, availability", topic: "NAGA Stays booking" },
    { tag: "Resident Support", color: "#8B5CF6", lightBg: "#F5F3FF", subsidiary: "Estate Management", desc: "Service charges, maintenance requests, resident matters", topic: "Estate management" },
  ];

  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16" style={{ background: "#25205B" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5"><span className="w-6 h-px" style={{ background: "#6B9FE5" }} /><span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6B9FE5" }}>Get in touch</span></div>
          <h1 className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 56px)", lineHeight: 1.1 }}>Talk to us.</h1>
          <p className="mt-3 text-[15px]" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "440px" }}>Whether you want to buy, book a stay, raise a maintenance request or just ask a question — reach out directly and someone will get back to you the same day.</p>
        </div>
      </div>

      {/* Team selector */}
      <div className="bg-white" style={{ borderBottom: "1px solid #E8EAF0" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-[13px] font-semibold mb-6" style={{ color: "#252731" }}>Who do you need to reach?</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {teamOptions.map((t) => (
              <button key={t.tag} onClick={() => setSelectedTeam(t.topic)}
                className="text-left p-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: selectedTeam === t.topic ? t.lightBg : "#F7F8FA", border: `1.5px solid ${selectedTeam === t.topic ? t.color : "#E8EAF0"}` }}>
                <span className="text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-full inline-block mb-2" style={{ background: t.lightBg, color: t.color }}>{t.tag}</span>
                <div className="text-[12px] font-semibold mb-1 leading-tight" style={{ color: "#252731" }}>{t.subsidiary}</div>
                <div className="text-[10px] leading-relaxed" style={{ color: "#69707D" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form + offices */}
      <div className="py-10 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <h2 className="text-[24px] font-semibold mb-8" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>Send us a message</h2>
            {sent ? (
              <div className="p-8 rounded-2xl text-center" style={{ background: "#EAF2FC", border: "1px solid rgba(107,159,229,0.3)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#6B9FE5" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5L16 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="font-semibold text-[16px] mb-1" style={{ color: "#25205B" }}>Got it, thank you.</div>
                <div className="text-[13px]" style={{ color: "#69707D" }}>Someone from the team will be in touch within one working day.</div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                {[{ label: "Full Name", type: "text", placeholder: "e.g. Chidi Nwosu" }, { label: "Email Address", type: "email", placeholder: "your@email.com" }, { label: "Phone Number", type: "tel", placeholder: "+234 800 000 0000" }].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#252731" }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl text-[14px] transition-all outline-none" style={{ border: "1px solid #E8EAF0", color: "#252731", background: "#F7F8FA" }} onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")} onBlur={(e) => (e.target.style.borderColor = "#E8EAF0")} />
                  </div>
                ))}
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#252731" }}>What is this about?</label>
                  <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] outline-none" style={{ border: "1px solid #E8EAF0", color: "#252731", background: "#F7F8FA" }}>
                    <option>Buying a property</option>
                    <option>NAGA Stays booking</option>
                    <option>Estate management</option>
                    <option>Construction inquiry</option>
                    <option>Off-plan investment</option>
                    <option>Something else</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#252731" }}>Message</label>
                  <textarea rows={4} placeholder="Tell us what you need..." className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none" style={{ border: "1px solid #E8EAF0", color: "#252731", background: "#F7F8FA" }} onFocus={(e) => (e.target.style.borderColor = "#6B9FE5")} onBlur={(e) => (e.target.style.borderColor = "#E8EAF0")} />
                </div>
                <button type="submit" className="w-full py-3.5 text-[14px] font-semibold rounded-xl text-white transition-all hover:opacity-90" style={{ background: "#25205B" }}>Send message</button>
              </form>
            )}
          </div>
          <div>
            <h2 className="text-[24px] font-semibold mb-8" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>Our offices</h2>
            <div className="space-y-5">
              {[
                { city: "Benin City", role: "Headquarters", address: "GRA Phase 2, Benin City, Edo State", phone: "+234 802 000 0001", email: "info@nagaproperties.com", note: "Hummingbird Properties & NAGA Prime Construction HQ", hours: "Mon–Fri, 8am–5pm" },
                { city: "Abuja", role: "Project Office", address: "Gwarimpa, FCT Abuja", phone: "+234 802 000 0003", email: "abuja@nagaproperties.com", note: "Palm Court, Dawaki, Jabi & NAGA Stays", hours: "Mon–Fri, 8am–5pm" },
                { city: "Lagos", role: "Regional Office", address: "Lekki Phase 1, Lagos Island, Lagos State", phone: "+234 802 000 0002", email: "lagos@nagaproperties.com", note: "Emerald Gardens & Prime Apartment (expanding)", hours: "Mon–Fri, 8am–5pm" },
              ].map((o) => (
                <div key={o.city} className="p-6 rounded-2xl" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#6B9FE5" }}>{o.role}</div>
                      <div className="text-[18px] font-semibold" style={{ color: "#252731", fontFamily: "var(--font-display)" }}>{o.city}</div>
                    </div>
                    <div className="text-[10px] px-2.5 py-1 rounded-full shrink-0" style={{ background: "#EAF2FC", color: "#6B9FE5" }}>{o.hours}</div>
                  </div>
                  <div className="space-y-1 text-[13px]" style={{ color: "#69707D" }}>
                    <div>{o.address}</div>
                    <div className="font-semibold text-[13px]" style={{ color: "#25205B" }}>{o.phone}</div>
                    <div>{o.email}</div>
                  </div>
                  <div className="mt-3 text-[11px] italic" style={{ color: "#69707D" }}>{o.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────── */
function Footer({ onNavigate, onEnterPlatform }: { onNavigate: (p: Page) => void; onEnterPlatform: () => void }) {
  return (
    <footer style={{ background: "#0f0d2e" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="mb-5">
              <img
                src={nagaHbLogo}
                alt="NAGA Hummingbird Properties"
                style={{ height: 48, objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
            </div>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.45)", maxWidth: "280px" }}>
              We've been building, selling and managing property in Nigeria since 2018. No shortcuts, no middlemen.
            </p>
            <p className="text-[11px]" style={{ color: "rgba(107,159,229,0.5)" }}>Abuja · Lagos · Benin City</p>
          </div>
          <div className="md:col-span-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: "rgba(107,159,229,0.5)" }}>Pages</div>
            <ul className="space-y-3">
              {(["home", "about", "services", "properties", "stays", "contact"] as Page[]).map((p) => (
                <li key={p}><button onClick={() => onNavigate(p)} className="text-[13px] capitalize hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{p === "stays" ? "NAGA Stays" : p}</button></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: "rgba(107,159,229,0.5)" }}>Group subsidiaries</div>
            <ul className="space-y-3">
              {[
                { label: "Hummingbird Properties", color: "#6B9FE5" },
                { label: "NAGA Prime Construction & PM", color: "#D4A843" },
                { label: "Prime Apartment (NAGA Stays)", color: "#C07A5A" },
                { label: "Global Technology & Literacy Hub", color: "#8B5CF6" },
              ].map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color, opacity: 0.6 }} />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: "rgba(107,159,229,0.5)" }}>Contact</div>
            <div className="space-y-4 text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {[{ city: "Benin City (HQ)", addr: "GRA Phase 2, Benin City", phone: "+234 802 000 0001" }, { city: "Lagos", addr: "Lekki Phase 1, Lagos", phone: "+234 802 000 0002" }, { city: "Abuja", addr: "Gwarimpa, FCT Abuja", phone: "+234 802 000 0003" }].map((o) => (
                <div key={o.city}><div className="font-semibold text-white text-[12px] mb-0.5">{o.city}</div>{o.addr}<br /><span style={{ color: "#6B9FE5" }}>{o.phone}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>© {new Date().getFullYear()} NAGA Hummingbird Properties Ltd. All rights reserved.</p>
          <button onClick={onEnterPlatform} className="text-[12px] font-medium flex items-center gap-2 transition-colors hover:opacity-80" style={{ color: "rgba(107,159,229,0.5)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 11c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Resident and Guest Portal
          </button>
        </div>
      </div>
    </footer>
  );
}
