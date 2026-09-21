import { useState, useEffect, useRef, useCallback } from "react";
import { getAsset } from "@/utils/assetLoader";
const nagaIconGold = getAsset("Naga_Construction_logo_white");
const nagaAllWhite = getAsset("Naga_Construction_logo_all_white");
import { useNavigate } from "react-router";
import { CURRENT_USER, TASKS, CONVERSATIONS, MATERIAL_REQUESTS, PENDING_APPROVALS, MAINTENANCE_REQUESTS } from "../data/dummy";
import { StaffRole } from "../portals/PlatformGate";
import Executive from "../modules/Executive";
import Construction from "../modules/Construction";
import Finance from "../modules/Finance";
import Procurement from "../modules/Procurement";
import Inventory from "../modules/Inventory";
import RealEstate from "../modules/RealEstate";
import CustomerPortal from "../modules/CustomerPortal";
import Estates from "../modules/Estates";
import NagaStays from "../modules/NagaStays";
import People from "../modules/People";
import Audit from "../modules/Audit";
import Reports from "../modules/Reports";
import Tasks from "../modules/Tasks";
import Messaging from "../modules/Messaging";
import Support from "../modules/Support";
import DocumentCentre from "../modules/DocumentCentre";
import Leave from "../modules/Leave";
import Payroll from "../modules/Payroll";
import VisitorManagement from "../modules/VisitorManagement";
import { SHARED_SUPPORT_TICKETS } from "../data/supportStore";
import { SHARED_MAINTENANCE } from "../data/maintenanceStore";
import { getStoreExpiryDate, formatExpiryCountdown, resetStore } from "../data/persistentStore";
import { getLiveNotifications, LiveNotification } from "../data/notificationStore";

type Module =
  | "executive"
  | "construction"
  | "procurement"
  | "inventory"
  | "finance"
  | "realestate"
  | "customers"
  | "estates"
  | "stays"
  | "people"
  | "audit"
  | "reports"
  | "tasks"
  | "messaging"
  | "support"
  | "documents"
  | "leave"
  | "payroll"
  | "visitors";

interface Props {
  onExitPlatform: () => void;
  staffRole?: StaffRole;
}

const ROLE_META: Record<StaffRole, { label: string; defaultModule: Module; access: Module[] }> = {
  ceo: {
    label: "Chief Executive Officer",
    defaultModule: "executive",
    access: ["executive", "construction", "procurement", "inventory", "finance", "realestate", "customers", "estates", "stays", "people", "audit", "reports", "tasks", "messaging", "support", "documents", "leave", "payroll", "visitors"],
  },
  howo: {
    label: "Head of Works and Operations",
    defaultModule: "construction",
    access: ["construction", "procurement", "inventory", "estates", "stays", "people", "reports", "tasks", "messaging", "support", "documents", "leave", "payroll", "visitors"],
  },
  finance: {
    label: "Finance Manager",
    defaultModule: "finance",
    access: ["finance", "procurement", "audit", "reports", "tasks", "messaging", "payroll"],
  },
  pco: {
    label: "Project Chartered Officer",
    defaultModule: "construction",
    access: ["construction", "procurement", "inventory", "reports", "tasks", "messaging", "leave", "visitors"],
  },
  prm: {
    label: "Personnel Resource Manager",
    defaultModule: "people",
    access: ["people", "construction", "procurement", "tasks", "messaging", "leave", "visitors"],
  },
  ivm: {
    label: "Inventory & Resource Manager",
    defaultModule: "inventory",
    access: ["inventory", "procurement", "tasks", "messaging", "leave"],
  },
  estate: {
    label: "Estate Manager",
    defaultModule: "estates",
    access: ["estates", "customers", "stays", "reports", "tasks", "messaging", "support", "documents", "leave", "visitors"],
  },
  admin: {
    label: "Admin Officer",
    defaultModule: "finance",
    access: ["finance", "procurement", "people", "realestate", "customers", "audit", "reports", "tasks", "messaging", "support", "documents", "leave", "payroll", "visitors"],
  },
  cso: {
    label: "Customer Support Officer",
    defaultModule: "support",
    access: ["support", "customers", "stays", "estates", "messaging", "tasks", "documents", "leave", "visitors"],
  },
};

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ id: "executive" as Module, label: "Executive", icon: <IconGrid /> }],
  },
  {
    label: "Operations",
    items: [
      { id: "construction" as Module, label: "Construction & Projects", icon: <IconBuilding /> },
      { id: "procurement" as Module, label: "Procurement", icon: <IconCart /> },
      { id: "inventory" as Module, label: "Inventory", icon: <IconBox /> },
    ],
  },
  {
    label: "Finance",
    items: [{ id: "finance" as Module, label: "Finance", icon: <IconCurrency /> }],
  },
  {
    label: "Properties",
    items: [
      { id: "realestate" as Module, label: "Real Estate", icon: <IconHome /> },
      { id: "customers" as Module, label: "Customer Portal", icon: <IconUsers /> },
      { id: "estates" as Module, label: "Estates", icon: <IconMap /> },
      { id: "stays" as Module, label: "NAGA Stays", icon: <IconStar /> },
      { id: "support" as Module, label: "Customer Support", icon: <IconSupport /> },
      { id: "visitors" as Module, label: "Visitor Management", icon: <IconVisitor /> },
    ],
  },
  {
    label: "People & Control",
    items: [
      { id: "people" as Module, label: "People", icon: <IconPerson /> },
      { id: "leave" as Module, label: "Leave Management", icon: <IconLeave /> },
      { id: "payroll" as Module, label: "Payroll", icon: <IconPayroll /> },
      { id: "audit" as Module, label: "Audit & Compliance", icon: <IconShield /> },
      { id: "reports" as Module, label: "Reports", icon: <IconChart /> },
      { id: "documents" as Module, label: "Documents", icon: <IconDoc /> },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "tasks" as Module, label: "Task Board", icon: <IconTask /> },
      { id: "messaging" as Module, label: "Messages", icon: <IconMessage /> },
    ],
  },
];

// Notifications derived dynamically in the Platform component via getLiveNotifications()
// Icon map for notification types
const NOTIF_ICONS: Record<string, string> = {
  approval: "⏳", report: "📋", payroll: "💰", stock: "📦",
  leave: "🗓", task: "☑", alert: "⚠", default: "🔔",
};

type SearchResult = { label: string; sub: string; module: Module; icon: string };
function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  TASKS.forEach(t => results.push({ label: t.title, sub: `Task · ${t.status} · ${t.assignee}`, module: "tasks", icon: "☑" }));
  CONVERSATIONS.forEach(c => results.push({ label: c.subject, sub: `Message · ${c.participants.join(", ")}`, module: "messaging", icon: "💬" }));
  MATERIAL_REQUESTS.forEach(m => results.push({ label: `${m.id} — ${m.project}`, sub: `Procurement · ₦${m.totalAmount.toLocaleString()} · ${m.status}`, module: "procurement", icon: "📦" }));
  PENDING_APPROVALS.forEach((a) => results.push({ label: `${a.id} — ${a.type}`, sub: `Finance · ${a.project} · ${a.awaitingAction}`, module: "finance", icon: "📋" }));
  MAINTENANCE_REQUESTS.forEach(m => results.push({ label: `${m.id} — ${m.issue}`, sub: `Estates · ${m.estate} · ${m.status}`, module: "estates", icon: "🔧" }));
  return results;
}
const SEARCH_INDEX = buildSearchIndex();

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: "#25205B", fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

const MODULE_HINTS: Partial<Record<Module, string>> = {
  executive: "Get a live overview of all NAGA operations — click any KPI card to navigate directly to that module.",
  finance: "Use ⌘K to jump between modules, or check the approvals tab for items needing your attention.",
  procurement: "Bulk-select material requests using the checkboxes, then approve or export in one action.",
  stays: "Toggle between List and Calendar view to see occupancy at a glance.",
  realestate: "Click ⊕ Compare on any two properties to see a side-by-side spec breakdown.",
  tasks: "Drag cards between columns to update task status instantly.",
};
const DEFAULT_HINT = "Use ⌘K to search across tasks, messages, and requests.";

function DemoStoreBanner({ staffRole }: { staffRole: string }) {
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const isAdmin = staffRole === "admin" || staffRole === "ceo";

  useEffect(() => {
    function refresh() {
      const d = getStoreExpiryDate();
      setExpiry(d);
      if (d) setCountdown(formatExpiryCountdown(d));
    }
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!expiry || dismissed) return null;

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-[12px]"
      style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.3)", color: "#252731" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <circle cx="7" cy="7" r="6" stroke="#D4A843" strokeWidth="1.3" />
        <path d="M7 4v3.5l2 1.5" stroke="#D4A843" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="flex-1">
        <span style={{ color: "#D4A843", fontWeight: 600 }}>Demo data</span> — all actions are saved for the next{" "}
        <span style={{ fontWeight: 600 }}>{countdown}</span>, then reset to defaults.
      </span>
      {isAdmin && (
        <button
          onClick={() => { resetStore(); window.location.reload(); }}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 shrink-0"
          style={{ background: "rgba(212,168,67,0.15)", color: "#b07e0f", border: "1px solid rgba(212,168,67,0.4)" }}
        >
          Reset now
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="shrink-0 text-[16px] leading-none hover:opacity-60 transition-opacity" style={{ color: "#B0B8C4" }} aria-label="Dismiss">×</button>
    </div>
  );
}

export default function Platform({ onExitPlatform, staffRole = "ceo" }: Props) {
  const roleMeta = ROLE_META[staffRole];
  const [activeModule, setActiveModule] = useState<Module>(() => {
    const saved = sessionStorage.getItem("naga_module_" + staffRole);
    if (saved && roleMeta.access.includes(saved as Module)) return saved as Module;
    return roleMeta.defaultModule;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set<string>());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [seenModules, setSeenModules] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem("naga_seen") ?? "[]")); }
    catch { return new Set(); }
  });
  const [tooltipModule, setTooltipModule] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const staffName = (() => {
    try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}").name ?? CURRENT_USER.name; }
    catch { return CURRENT_USER.name; }
  })();
  const staffFirstName = staffName.split(" ")[0];
  const staffLocation = (() => { try { return JSON.parse(sessionStorage.getItem("naga_staff") ?? "{}").location; } catch { return undefined; } })();

  const liveNotifications: LiveNotification[] = getLiveNotifications(staffRole, staffName, staffLocation);
  const unreadCount = liveNotifications.filter(n => !readNotifs.has(n.id)).length;

  const searchResults = searchQuery.trim().length > 1
    ? SEARCH_INDEX.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()) || r.sub.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const switchModule = useCallback((mod: Module) => {
    setActiveModule(mod);
    sessionStorage.setItem("naga_module_" + staffRole, mod);
    setSeenModules(prev => {
      if (!prev.has(mod)) {
        const next = new Set(prev);
        next.add(mod);
        sessionStorage.setItem("naga_seen", JSON.stringify([...next]));
        setTooltipModule(mod);
        return next;
      }
      return prev;
    });
  }, [staffRole]);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    switchModule(result.module);
    setSearchOpen(false);
    setSearchQuery("");
  }, [switchModule]);

  const navigateTo = useCallback((mod: Module) => {
    switchModule(mod);
    setMobileDrawerOpen(false);
  }, [switchModule]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(o => !o); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); setMobileDrawerOpen(false); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) { setTimeout(() => searchInputRef.current?.focus(), 50); }
  }, [searchOpen]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return () => document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const meta = ROLE_META[staffRole];
    const saved = sessionStorage.getItem("naga_module_" + staffRole);
    const next = (saved && meta.access.includes(saved as Module) ? saved : meta.defaultModule) as Module;
    setActiveModule(next);
  }, [staffRole]);

  useEffect(() => {
    if (mobileDrawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    if (!tooltipModule) return;
    const timer = setTimeout(() => setTooltipModule(null), 6000);
    return () => clearTimeout(timer);
  }, [tooltipModule]);

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => roleMeta.access.includes(i.id)),
  })).filter((g) => g.items.length > 0);

  const allVisibleItems = visibleGroups.flatMap(g => g.items);
  const activeLabel = allVisibleItems.find((i) => i.id === activeModule)?.label ?? "";

  const bottomNavItems = allVisibleItems.slice(0, 4);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F7F8FA", fontFamily: "var(--font-sans)" }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? "w-[60px]" : "w-[220px]"}`}
        style={{ background: "#1a1645", borderRight: "1px solid #231e55" }}
      >
        <div className="flex items-center gap-3 px-4 py-[18px]" style={{ borderBottom: "1px solid #231e55" }}>
          {sidebarCollapsed
            ? <NagaLogo size={28} />
            : <img src={nagaAllWhite} alt="NAGA Prime Construction" style={{ height: 34, objectFit: "contain", maxWidth: 140 }} />
          }
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto shrink-0 transition-colors hover:opacity-80"
            style={{ color: "#6B9FE5", display: sidebarCollapsed ? "none" : "flex" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="transition-colors hover:opacity-80 w-full flex justify-center"
              style={{ color: "#6B9FE5" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4" style={{ padding: sidebarCollapsed ? "16px 8px" : "16px 10px" }}>
          {visibleGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: gi < visibleGroups.length - 1 ? "20px" : "0" }}>
              {!sidebarCollapsed && (
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2 px-2" style={{ color: "#3d3589" }}>
                  {group.label}
                </div>
              )}
              {sidebarCollapsed && gi > 0 && (
                <div style={{ height: 1, background: "#231e55", margin: "8px 0" }} />
              )}
              {group.items.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => switchModule(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className="w-full flex items-center transition-all duration-150 mb-0.5"
                    style={{
                      gap: "10px",
                      padding: sidebarCollapsed ? "9px" : "9px 10px",
                      borderRadius: "7px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      background: isActive ? "rgba(107,159,229,0.15)" : "transparent",
                      color: isActive ? "#EAF2FC" : "#6B9FE5",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="shrink-0" style={{ color: isActive ? "#8eb6ec" : "#4d5a80" }}>{item.icon}</span>
                    {!sidebarCollapsed && <span className="text-[12.5px] font-medium">{item.label}</span>}
                    {!sidebarCollapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#6B9FE5" }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid #231e55", padding: "12px 10px" }}>
          {!sidebarCollapsed && (
            <button
              onClick={onExitPlatform}
              className="w-full flex items-center gap-2 text-[11px] font-medium transition-all mb-3 px-3 py-2 rounded-md hover:bg-white/5"
              style={{ color: "#4d5a80" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h3M8 9l3-3-3-3M11 6H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to Website
            </button>
          )}
          <div className={`flex items-center gap-3 px-2 py-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "rgba(107,159,229,0.25)", border: "1px solid rgba(107,159,229,0.4)" }}>
              {CURRENT_USER.initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-[12px] font-semibold truncate" style={{ color: "#EAF2FC" }}>{staffName}</div>
                <div className="text-[10px] truncate" style={{ color: "#4d5a80" }}>{roleMeta.label}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(15,13,46,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <div
        className="fixed top-0 left-0 bottom-0 z-50 md:hidden flex flex-col transition-transform duration-300"
        style={{
          width: "280px",
          background: "#1a1645",
          borderRight: "1px solid #231e55",
          transform: mobileDrawerOpen ? "translateX(0)" : "translateX(-100%)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #231e55" }}>
          <div className="flex items-center gap-3">
            <img src={nagaAllWhite} alt="NAGA Prime Construction" style={{ height: 32, objectFit: "contain", maxWidth: 140 }} />
          </div>
          <button onClick={() => setMobileDrawerOpen(false)} className="p-1.5 rounded-lg" style={{ color: "#6B9FE5" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          {visibleGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: gi < visibleGroups.length - 1 ? "20px" : "0" }}>
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2 px-3" style={{ color: "#3d3589" }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-0.5 transition-colors"
                    style={{
                      background: isActive ? "rgba(107,159,229,0.15)" : "transparent",
                      color: isActive ? "#EAF2FC" : "#6B9FE5",
                    }}
                  >
                    <span style={{ color: isActive ? "#8eb6ec" : "#4d5a80" }}>{item.icon}</span>
                    <span className="text-[13px] font-medium">{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#6B9FE5" }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #231e55", padding: "12px" }}>
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: "rgba(107,159,229,0.25)", border: "1px solid rgba(107,159,229,0.4)" }}>
              {staffFirstName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: "#EAF2FC" }}>{staffName}</div>
              <div className="text-[11px] truncate" style={{ color: "#4d5a80" }}>{roleMeta.label}</div>
            </div>
          </div>
          <button
            onClick={() => { setMobileDrawerOpen(false); onExitPlatform(); }}
            className="w-full flex items-center gap-2 text-[12px] font-medium px-3 py-2.5 rounded-lg"
            style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3M9 10l4-3-4-3M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="shrink-0 flex items-center gap-2 px-3 md:px-6 bg-white"
          style={{ borderBottom: "1px solid #E8EAF0", height: "52px", paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg shrink-0"
            style={{ color: "#69707D", border: "1px solid #E8EAF0" }}
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>

          {/* Desktop expand when collapsed */}
          {sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(false)} className="hidden md:flex text-[#69707D] hover:text-[#25205B] transition-colors mr-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}

          <div className="min-w-0 flex-1 md:flex-none">
            <div className="font-semibold text-[13px] md:text-[14px] truncate" style={{ color: "#252731" }}>{activeLabel}</div>
            <div className="text-[10px] md:text-[11px] hidden sm:block truncate" style={{ color: "#69707D" }}>{roleMeta.label} · NAGA</div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-md text-[11px] transition-colors hover:bg-[#F7F8FA]"
              style={{ color: "#69707D", border: "1px solid #E8EAF0", background: "#F7F8FA" }}
              aria-label="Search"
            >
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" /><path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              <span className="hidden md:inline">Search…</span>
              <span className="hidden lg:inline ml-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#E8EAF0", color: "#69707D" }}>⌘K</span>
            </button>

            {/* Date — desktop only */}
            <div className="text-[11px] px-3 py-1.5 rounded-md hidden lg:block" style={{ color: "#69707D", background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>

            {/* Dark mode */}
            <button
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "Light mode" : "Dark mode"}
              className="w-8 h-8 hidden sm:flex items-center justify-center rounded-md transition-colors hover:bg-[#F7F8FA]"
              style={{ color: "#69707D", border: "1px solid #E8EAF0" }}
            >
              {darkMode
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" /><path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.9 2.9l.7.7M10.4 10.4l.7.7M2.9 11.1l.7-.7M10.4 3.6l.7-.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 9A6 6 0 015 2.5a5.5 5.5 0 100 9 6 6 0 006.5-2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              }
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-[#F7F8FA]"
                style={{ color: "#69707D", border: "1px solid #E8EAF0" }}
                aria-label="Notifications"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5A4 4 0 003.5 5.5V9L2 10.5h11L11.5 9V5.5A4 4 0 007.5 1.5z" stroke="currentColor" strokeWidth="1.2" /><path d="M6 11a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.1" /></svg>
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">{unreadCount}</span>
              )}
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
                  style={{ width: "min(320px, calc(100vw - 24px))", background: "white", boxShadow: "0 12px 40px rgba(37,32,91,0.15)", border: "1px solid #E8EAF0" }}
                >
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F0F2F5" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: "#252731" }}>Notifications</span>
                      {unreadCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>{unreadCount} new</span>}
                    </div>
                    <button onClick={() => setReadNotifs(new Set(liveNotifications.map(n => n.id)))} className="text-[11px] font-medium" style={{ color: "#6B9FE5" }}>Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#F7F8FA]">
                    {liveNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[12px]" style={{ color: "#B0B8C4" }}>No new notifications</div>
                    ) : liveNotifications.map(n => {
                      const isRead = readNotifs.has(n.id);
                      const icon = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.default;
                      const priorityDot = n.priority === "high" && !isRead;
                      return (
                        <button
                          key={n.id}
                          onClick={() => { setReadNotifs(prev => new Set([...prev, n.id])); if (n.module) switchModule(n.module as Module); setNotifOpen(false); }}
                          className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F7F8FA]"
                          style={{ background: isRead ? "white" : "#FAFBFF" }}
                        >
                          <span className="text-base leading-none mt-0.5 shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[12px] ${isRead ? "font-medium" : "font-semibold"}`} style={{ color: "#252731" }}>{n.title}</span>
                              {!isRead && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityDot ? "#dc2626" : "#6B9FE5" }} />}
                            </div>
                            <div className="text-[11px] mt-0.5 leading-tight" style={{ color: "#69707D" }}>{n.body}</div>
                            <div className="text-[10px] mt-1" style={{ color: "#B0B8C4" }}>{n.time}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-lg transition-colors hover:bg-[#F7F8FA]"
                style={{ border: "1px solid #E8EAF0" }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#25205B", color: "white" }}>
                  {staffFirstName[0]}
                </div>
                <span className="text-[12px] font-medium hidden sm:inline" style={{ color: "#252731" }}>
                  <span style={{ color: "#25205B", fontWeight: 700 }}>{staffFirstName}</span>
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#69707D", transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50" style={{ background: "white", boxShadow: "0 8px 24px rgba(37,32,91,0.12)", border: "1px solid #E8EAF0" }}>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate("/"); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6B9FE5" }}><path d="M7 1L13 6v7H1V6L7 1z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                    <span className="text-[13px]" style={{ color: "#252731" }}>Main Website</span>
                  </button>
                  <div style={{ borderTop: "1px solid #F0F2F5" }} />
                  <button
                    onClick={() => { setUserMenuOpen(false); onExitPlatform(); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F5] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#f87171" }}><path d="M5 2H2v10h3M9 10l4-3-4-3M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-[13px]" style={{ color: "#f87171" }}>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {tooltipModule && (
            <div
              className="mx-4 mt-3 flex items-center gap-3 rounded-xl px-5 py-3 text-[12px]"
              style={{ background: "#EAF2FC", border: "1px solid #D3E3F9", color: "#25205B" }}
            >
              <span className="flex-1">{MODULE_HINTS[tooltipModule as Module] ?? DEFAULT_HINT}</span>
              <button
                onClick={() => setTooltipModule(null)}
                className="shrink-0 text-[16px] leading-none hover:opacity-70 transition-opacity"
                style={{ color: "#25205B" }}
                aria-label="Dismiss"
              >×</button>
            </div>
          )}
          <DemoStoreBanner staffRole={staffRole} />
          {activeModule === "executive" && <Executive onNavigate={setActiveModule} />}
          {activeModule === "construction" && <Construction />}
          {activeModule === "procurement" && <Procurement />}
          {activeModule === "inventory" && <Inventory />}
          {activeModule === "finance" && <Finance />}
          {activeModule === "realestate" && <RealEstate />}
          {activeModule === "customers" && <CustomerPortal />}
          {activeModule === "estates" && <Estates />}
          {activeModule === "stays" && <NagaStays />}
          {activeModule === "people" && <People />}
          {activeModule === "audit" && <Audit />}
          {activeModule === "reports" && <Reports />}
          {activeModule === "tasks" && <Tasks />}
          {activeModule === "messaging" && <Messaging />}
          {activeModule === "support" && <Support />}
          {activeModule === "documents" && <DocumentCentre />}
          {activeModule === "leave" && <Leave />}
          {activeModule === "payroll" && <Payroll />}
          {activeModule === "visitors" && <VisitorManagement />}
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav
          className="md:hidden flex items-center shrink-0"
          style={{
            background: "white",
            borderTop: "1px solid #E8EAF0",
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "calc(56px + env(safe-area-inset-bottom))",
          }}
        >
          {bottomNavItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => switchModule(item.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
                style={{ color: isActive ? "#25205B" : "#9DA8C0" }}
              >
                <span style={{ color: isActive ? "#25205B" : "#B0B8C4" }}>{item.icon}</span>
                <span className="text-[9px] font-semibold leading-none mt-0.5">{item.label.split(" ")[0]}</span>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: "#25205B" }} />}
              </button>
            );
          })}
          {/* "More" button to open drawer */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            style={{ color: "#9DA8C0" }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="3" cy="7.5" r="1.3" fill="currentColor" /><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" /><circle cx="12" cy="7.5" r="1.3" fill="currentColor" /></svg>
            <span className="text-[9px] font-semibold leading-none mt-0.5">More</span>
          </button>
        </nav>
      </div>

      {/* Global Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4"
          style={{ background: "rgba(15,13,46,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden"
            style={{ background: "white", boxShadow: "0 24px 80px rgba(37,32,91,0.25)", border: "1px solid #E8EAF0" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #F0F2F5" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "#6B9FE5", flexShrink: 0 }}><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks, messages, requests…"
                className="flex-1 text-[14px] outline-none bg-transparent"
                style={{ color: "#252731" }}
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F0F2F5", color: "#69707D" }}>ESC</button>
            </div>
            {searchResults.length > 0 ? (
              <div className="max-h-64 overflow-y-auto py-2">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchSelect(r)}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] transition-colors"
                  >
                    <span className="text-[16px] w-6 shrink-0 text-center">{r.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "#252731" }}>{highlight(r.label, searchQuery)}</div>
                      <div className="text-[11px] truncate" style={{ color: "#69707D" }}>{highlight(r.sub, searchQuery)}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim().length > 1 ? (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#69707D" }}>No results for "{searchQuery}"</div>
            ) : (
              <div className="px-4 py-5">
                <div className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#B0B8C4" }}>Quick Navigate</div>
                <div className="flex flex-wrap gap-2">
                  {(["tasks", "messaging", "finance", "procurement", "estates"] as Module[]).filter(m => roleMeta.access.includes(m)).map(m => (
                    <button key={m} onClick={() => { switchModule(m); setSearchOpen(false); }}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-lg capitalize transition-colors hover:bg-[#EAF2FC]"
                      style={{ background: "#F7F8FA", color: "#25205B", border: "1px solid #E8EAF0" }}>
                      {m === "messaging" ? "Messages" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NagaLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={nagaIconGold}
      alt="NAGA Prime Construction"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

function IconGrid() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>; }
function IconBuilding() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 13.5V6l5.5-4L13 6v7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><rect x="5.5" y="9" width="4" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.3" /></svg>; }
function IconCart() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 1h2l2.2 6.6a1 1 0 00.95.7H12a1 1 0 00.97-.75L14.5 4H3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="12" r="1.3" stroke="currentColor" strokeWidth="1.1" /><circle cx="11.5" cy="12" r="1.3" stroke="currentColor" strokeWidth="1.1" /></svg>; }
function IconBox() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 5v7.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V5" stroke="currentColor" strokeWidth="1.3" /><path d="M13.5 2.5H1.5a1 1 0 00-1 1V5h13.5V3.5a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M6 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconCurrency() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M7.5 3.5v8M5.5 5.5h3a1.5 1.5 0 010 3h-2a1.5 1.5 0 000 3h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconHome() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 7L7.5 2l6 5v6a1 1 0 01-1 1h-10a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><rect x="5.5" y="8.5" width="4" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.3" /></svg>; }
function IconUsers() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="5.5" cy="4.5" r="2.3" stroke="currentColor" strokeWidth="1.3" /><path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M10.5 2.5a2.3 2.3 0 010 4.6M14 13a3.7 3.7 0 00-3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconMap() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1C5.3 1 3.5 2.8 3.5 5c0 3 4 9 4 9s4-6 4-9c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.3" /><circle cx="7.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.1" /></svg>; }
function IconStar() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5l1.6 3.3 3.7.6-2.7 2.6.7 3.7L7.5 10l-3.3 1.7.7-3.7L2.2 5.4l3.7-.6L7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>; }
function IconPerson() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4.5" r="2.7" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 13.5c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconShield() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L2 3.5v5C2 12 5 14.5 7.5 15c2.5-.5 5.5-3 5.5-6.5v-5L7.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M5 7.5l1.8 1.8L10 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconChart() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 11l3.5-3.5 3 3L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1.5 13.5h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>; }
function IconTask() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7.5l1.8 1.8L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconMessage() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 2.5h12a1 1 0 011 1v7a1 1 0 01-1 1H9l-2 2.5-2-2.5H1.5a1 1 0 01-1-1v-7a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>; }
function IconSupport() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" /><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 2l3.7 3.7M9.3 9.3L13 13M13 2l-3.7 3.7M5.7 9.3L2 13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>; }
function IconDoc() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 1.5h6l2.5 2.5v9.5a1 1 0 01-1 1h-7.5a1 1 0 01-1-1v-11a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M9.5 1.5v2.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 6.5h5M5 8.5h5M5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
function IconLeave() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 1.5v2M10 1.5v2M1.5 6h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M5 9h5M5 11.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>; }
function IconPayroll() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M4 7h2M4 9.5h1.5M9 7h2M9 9.5h1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M1 5.5h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
function IconVisitor() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="7.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.2" /><path d="M4 12c0-1.9 1.6-3.5 3.5-3.5S11 10.1 11 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
