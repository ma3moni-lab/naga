import { useEffect, useState } from "react";

export default function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      // If a waiting SW exists on load (e.g. hard refresh)
      if (reg.waiting) {
        setWaiting(reg.waiting);
        setVisible(true);
      }

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(installing);
            setVisible(true);
          }
        });
      });
    });

    // Listen for the SW's own postMessage (from the SKIP_WAITING flow)
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "SW_UPDATED") {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  const handleUpdate = () => {
    if (!waiting) return;
    waiting.postMessage({ type: "SKIP_WAITING" });
    setVisible(false);
  };

  const handleDismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 left-1/2 z-[600] -translate-x-1/2 w-[calc(100%-24px)] max-w-sm pointer-events-auto"
      style={{ animation: "dropIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
        style={{
          background: "#1a1645",
          border: "1px solid rgba(212,168,67,0.3)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Pulse dot */}
        <span className="relative flex shrink-0 h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#D4A843" }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#D4A843" }} />
        </span>

        <p className="flex-1 text-[12px] font-medium leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>
          New version available
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-[11px] px-2 py-1 rounded-md font-medium"
            style={{ color: "rgba(255,255,255,0.4)" }}
            aria-label="Dismiss update"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="text-[11px] px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: "#D4A843", color: "#0f0d2e" }}
          >
            Reload
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
