let _container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!_container || !document.body.contains(_container)) {
    _container = document.createElement("div");
    Object.assign(_container.style, {
      position: "fixed",
      bottom: "24px",
      right: "16px",
      zIndex: "9998",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none",
      maxWidth: "320px",
    });
    document.body.appendChild(_container);
  }
  return _container;
}

const PALETTE = {
  success: { bg: "#dcfce7", fg: "#166534", bd: "#bbf7d0" },
  error:   { bg: "#fee2e2", fg: "#991b1b", bd: "#fca5a5" },
  info:    { bg: "#EAF2FC", fg: "#25205B", bd: "#D3E3F9" },
  warning: { bg: "#fef3c7", fg: "#92400e", bd: "#fde68a" },
} as const;

export type ToastType = keyof typeof PALETTE;

export function showToast(message: string, type: ToastType = "success", durationMs = 3200) {
  const C = PALETTE[type];
  const el = document.createElement("div");
  Object.assign(el.style, {
    background: C.bg,
    color: C.fg,
    border: `1px solid ${C.bd}`,
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    pointerEvents: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    animation: "toastIn 0.25s ease-out",
    lineHeight: "1.4",
  });
  el.textContent = message;
  getContainer().appendChild(el);
  setTimeout(() => {
    Object.assign(el.style, { opacity: "0", transition: "opacity 0.3s" });
    setTimeout(() => el.remove(), 300);
  }, durationMs);
}
