import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOSBanner, setIsIOSBanner] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    if (sessionStorage.getItem("naga-install-dismissed")) return;

    const isIOS =
      /ipad|iphone|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isIOS && !isInStandaloneMode) {
      // Show iOS instruction banner after a longer delay
      const timer = setTimeout(() => {
        setIsIOSBanner(true);
        setVisible(true);
      }, 8000);
      return () => clearTimeout(timer);
    }

    // Android / desktop: listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so the page has settled before we show the banner
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("naga-install-dismissed", "1");
  };

  if (!visible) return null;
  if (!isIOSBanner && !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install NAGA app"
      className="fixed bottom-0 left-0 right-0 z-[500] flex justify-center p-3 sm:p-4 pointer-events-none"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl px-4 py-3"
        style={{
          background: "#1a1645",
          border: "1px solid rgba(107,159,229,0.25)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(107,159,229,0.1)",
          animation: "slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {isIOSBanner ? (
          /* iOS instruction layout */
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* App icon */}
                <div className="shrink-0">
                  <svg width="40" height="40" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="rounded-xl">
                    <rect width="192" height="192" rx="40" fill="#252060"/>
                    <path d="M96 28L164 68v96H28V68L96 28z" stroke="#D4AF37" strokeWidth="7" fill="none" strokeLinejoin="round"/>
                    <path d="M68 164v-56h56v56" stroke="#6B9FE5" strokeWidth="7" fill="none" strokeLinejoin="round"/>
                    <rect x="82" y="68" width="28" height="28" rx="3" fill="#D4AF37" fillOpacity="0.85"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-tight">Install NAGA</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Add to your Home Screen
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 text-[12px] px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.45)" }}
                aria-label="Dismiss install prompt"
              >
                Not now
              </button>
            </div>
            {/* iOS instruction row */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(107,159,229,0.12)" }}
            >
              {/* Safari share icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="shrink-0"
                style={{ color: "#6B9FE5" }}
              >
                <rect x="4" y="8" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 2v10M9 5l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>
                Tap the <span className="font-semibold text-white">Share</span> button (
                <span aria-label="share icon">&#x25A1;&#x2191;</span>
                ) then choose <span className="font-semibold text-white">Add to Home Screen</span>
              </p>
            </div>
          </div>
        ) : (
          /* Android / desktop native prompt layout */
          <div className="flex items-center gap-3">
            {/* App icon */}
            <div className="shrink-0">
              <svg width="44" height="44" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="rounded-xl">
                <rect width="192" height="192" rx="40" fill="#252060"/>
                <path d="M96 28L164 68v96H28V68L96 28z" stroke="#D4AF37" strokeWidth="7" fill="none" strokeLinejoin="round"/>
                <path d="M68 164v-56h56v56" stroke="#6B9FE5" strokeWidth="7" fill="none" strokeLinejoin="round"/>
                <rect x="82" y="68" width="28" height="28" rx="3" fill="#D4AF37" fillOpacity="0.85"/>
              </svg>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight truncate">Install NAGA</p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
                Add to home screen for quick access
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="text-[12px] px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.45)" }}
                aria-label="Dismiss install prompt"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: "#6B9FE5", color: "#fff" }}
              >
                Install
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
