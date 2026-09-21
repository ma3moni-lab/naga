// Admin shell skeleton: dark navy sidebar + header bar + content cards
export function PageSkeleton() {
  return (
    <div style={{ display: "flex", height: "100dvh", background: "#F7F8FA" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: "#1a1645",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          gap: 8,
        }}
      >
        {/* Logo placeholder */}
        <div
          className="animate-pulse"
          style={{
            width: 120,
            height: 28,
            borderRadius: 6,
            background: "#2d2870",
            marginBottom: 24,
          }}
        />
        {/* Nav items */}
        {[80, 64, 72, 56, 68].map((w, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              width: w,
              height: 14,
              borderRadius: 4,
              background: "#2d2870",
              marginLeft: 8,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div
          style={{
            height: 56,
            borderBottom: "1px solid #E8EAF0",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
          }}
        >
          <div className="animate-pulse" style={{ flex: 1, height: 14, borderRadius: 4, background: "#E8EAF0", maxWidth: 200 }} />
          <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8EAF0" }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Page title */}
          <div className="animate-pulse" style={{ width: 180, height: 20, borderRadius: 6, background: "#E8EAF0" }} />

          {/* Stat cards row */}
          <div style={{ display: "flex", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  flex: 1,
                  height: 90,
                  borderRadius: 10,
                  background: "#E8EAF0",
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </div>

          {/* Content rows */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 56,
                borderRadius: 8,
                background: "#E8EAF0",
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple skeleton for public/website routes
export function WebSkeleton() {
  return (
    <div style={{ height: "100dvh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Nav bar */}
      <div
        style={{
          height: 64,
          background: "#1a1645",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          gap: 24,
        }}
      >
        <div className="animate-pulse" style={{ width: 140, height: 24, borderRadius: 6, background: "#2d2870" }} />
        <div style={{ flex: 1 }} />
        {[60, 48, 56].map((w, i) => (
          <div key={i} className="animate-pulse" style={{ width: w, height: 12, borderRadius: 4, background: "#2d2870", animationDelay: `${i * 70}ms` }} />
        ))}
      </div>

      {/* Hero block */}
      <div style={{ padding: "48px 32px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
        <div className="animate-pulse" style={{ width: "60%", height: 32, borderRadius: 8, background: "#E8EAF0" }} />
        <div className="animate-pulse" style={{ width: "80%", height: 16, borderRadius: 4, background: "#E8EAF0", animationDelay: "60ms" }} />
        <div className="animate-pulse" style={{ width: "70%", height: 16, borderRadius: 4, background: "#E8EAF0", animationDelay: "120ms" }} />
        <div className="animate-pulse" style={{ width: 120, height: 40, borderRadius: 8, background: "#E8EAF0", marginTop: 8, animationDelay: "180ms" }} />
      </div>

      {/* Content cards */}
      <div style={{ padding: "0 32px", display: "flex", gap: 24 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              flex: 1,
              height: 160,
              borderRadius: 12,
              background: "#E8EAF0",
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
