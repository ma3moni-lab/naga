import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { getAsset } from "@/utils/assetLoader";
const nagaLogo = getAsset("Naga_Construction_logo");

const POPUP_KEY = "naga_demo_popup_seen";
const BAR_KEY = "naga_demo_bar_hidden";
const POPUP_ROUTES = new Set(["/", "/admin", "/admin/staff"]);

export default function DemoBanner() {
  const { pathname } = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [barHidden, setBarHidden] = useState(
    () => sessionStorage.getItem(BAR_KEY) === "1"
  );

  useEffect(() => {
    if (POPUP_ROUTES.has(pathname) && sessionStorage.getItem(POPUP_KEY) !== "1") {
      const t = setTimeout(() => setShowPopup(true), 400);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--demo-bar-h",
      barHidden ? "0px" : "28px"
    );
  }, [barHidden]);

  const dismissPopup = () => {
    sessionStorage.setItem(POPUP_KEY, "1");
    setShowPopup(false);
  };

  const hideBar = () => {
    sessionStorage.setItem(BAR_KEY, "1");
    setBarHidden(true);
  };

  return (
    <>
      {/* ── Top ribbon ── */}
      {!barHidden && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "28px",
            zIndex: 9990,
            background: "#1a1645",
            borderBottom: "1px solid rgba(107,159,229,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {/* Pulse dot */}
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#D4A843",
              flexShrink: 0,
              boxShadow: "0 0 0 2px rgba(212,168,67,0.3)",
            }}
          />

          {/* Badge */}
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "rgba(212,168,67,0.18)",
              color: "#D4A843",
              padding: "2px 7px",
              borderRadius: "4px",
              border: "1px solid rgba(212,168,67,0.35)",
            }}
          >
            Demo
          </span>

          <span
            style={{
              fontSize: "11.5px",
              color: "rgba(211,227,249,0.8)",
              letterSpacing: "0.01em",
            }}
          >
            This is a presentation environment — some features are limited
          </span>

          <button
            onClick={hideBar}
            title="Hide banner"
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(211,227,249,0.5)",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: 1,
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(211,227,249,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(211,227,249,0.5)")}
          >
            ×
          </button>
        </div>
      )}

      {/* ── First-visit popup ── */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9995,
            background: "rgba(15,13,46,0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            animation: "toastIn 0.28s ease-out",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "36px 32px 28px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 24px 80px rgba(15,13,46,0.45)",
              position: "relative",
            }}
          >
            {/* Logo */}
            <img
              src={nagaLogo}
              alt="NAGA Group"
              style={{
                height: "48px",
                width: "auto",
                objectFit: "contain",
                marginBottom: "20px",
                display: "block",
              }}
            />

            {/* Gold accent bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "32px",
                right: "32px",
                height: "3px",
                background: "linear-gradient(90deg, #D4A843 0%, rgba(212,168,67,0.2) 100%)",
                borderRadius: "0 0 3px 3px",
              }}
            />

            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#D4A843",
                marginBottom: "8px",
              }}
            >
              Demo Environment
            </div>

            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#0f0d2e",
                marginBottom: "12px",
                lineHeight: 1.25,
                fontFamily: "var(--font-display)",
              }}
            >
              Welcome to the NAGA<br />Operations Platform
            </h2>

            <p
              style={{
                fontSize: "13.5px",
                color: "#69707D",
                lineHeight: 1.65,
                marginBottom: "24px",
              }}
            >
              You are viewing a <strong style={{ color: "#252731" }}>presentation demo</strong> of
              the unified operations platform. All data shown is illustrative, and certain
              features are limited to preserve the integrity of the demo environment.
            </p>

            <div
              style={{
                background: "#F4F8FD",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "24px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="7.5" cy="7.5" r="6.5" stroke="#6B9FE5" strokeWidth="1.2" />
                <path d="M7.5 6.5v4M7.5 5v-.5" stroke="#6B9FE5" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: "12px", color: "#6B9FE5", margin: 0, lineHeight: 1.55 }}>
                Navigate freely using the sidebar and command palette (⌘K).
                A demo notice will remain visible in the top bar.
              </p>
            </div>

            <button
              onClick={dismissPopup}
              style={{
                width: "100%",
                padding: "13px 24px",
                background: "#1a1645",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.01em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#25205B")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1a1645")}
            >
              Got it, explore the platform
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
