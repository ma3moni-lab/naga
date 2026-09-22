function uri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

// ── Shared mark: navy diamond with gold N ─────────────────────────────────
const markNavy = `
  <polygon points="30,3 57,32 30,61 3,32" fill="#1a1645"/>
  <polygon points="30,3 57,32 30,61 3,32" fill="none" stroke="#D4A843" stroke-width="1.5"/>
  <text x="30" y="40" font-family="Georgia,'Times New Roman',serif" font-size="22"
        font-weight="700" fill="#D4A843" text-anchor="middle">N</text>`;

const markWhite = `
  <polygon points="30,3 57,32 30,61 3,32" fill="rgba(255,255,255,0.12)"/>
  <polygon points="30,3 57,32 30,61 3,32" fill="none" stroke="#D4A843" stroke-width="1.5"/>
  <text x="30" y="40" font-family="Georgia,'Times New Roman',serif" font-size="22"
        font-weight="700" fill="#D4A843" text-anchor="middle">N</text>`;

// ── Hummingbird mark ──────────────────────────────────────────────────────
const hbMark = `
  <ellipse cx="38" cy="35" rx="14" ry="8" fill="#D4A843"
           transform="rotate(-22,38,35)"/>
  <circle cx="25" cy="26" r="7" fill="#D4A843"/>
  <path d="M19 27 L1 19" stroke="#D4A843" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M34 26 C50 5 70 13 67 25 C57 18 44 22 34 30 Z"
        fill="#1a1645" opacity="0.88"/>
  <path d="M50 37 L63 27 M50 38 L63 46"
        stroke="#D4A843" stroke-width="2.5" stroke-linecap="round"/>`;

// ── Construction — dark (light backgrounds) ───────────────────────────────
export const LOGOS = {
  construction: uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64">
  ${markNavy}
  <text x="72" y="26" font-family="'Arial Black',Arial,sans-serif"
        font-size="21" font-weight="900" fill="#0f0d2e">NAGA</text>
  <text x="73" y="40" font-family="Arial,sans-serif" font-size="8"
        font-weight="600" fill="#69707D" letter-spacing="1">PRIME CONSTRUCTION</text>
  <text x="73" y="52" font-family="Arial,sans-serif" font-size="7.5"
        font-weight="500" fill="#D4A843" letter-spacing="0.5">&amp; PROJECT MANAGEMENT</text>
</svg>`),

  // white lockup — for dark/navy backgrounds
  constructionAllWhite: uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64">
  ${markWhite}
  <text x="72" y="26" font-family="'Arial Black',Arial,sans-serif"
        font-size="21" font-weight="900" fill="#ffffff">NAGA</text>
  <text x="73" y="40" font-family="Arial,sans-serif" font-size="8"
        font-weight="600" fill="rgba(255,255,255,0.75)" letter-spacing="1">PRIME CONSTRUCTION</text>
  <text x="73" y="52" font-family="Arial,sans-serif" font-size="7.5"
        font-weight="500" fill="#D4A843" letter-spacing="0.5">&amp; PROJECT MANAGEMENT</text>
</svg>`),

  // icon-only — collapsed sidebar
  constructionWhite: uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${markWhite}
</svg>`),

  // full extended lockup with tagline
  constructionFull: uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 72">
  ${markNavy}
  <text x="72" y="24" font-family="'Arial Black',Arial,sans-serif"
        font-size="22" font-weight="900" fill="#0f0d2e">NAGA</text>
  <text x="73" y="39" font-family="Arial,sans-serif" font-size="8.5"
        font-weight="600" fill="#69707D" letter-spacing="1.2">PRIME CONSTRUCTION &amp; PM</text>
  <line x1="73" y1="46" x2="310" y2="46" stroke="#D4A843" stroke-width="0.75" opacity="0.6"/>
  <text x="73" y="58" font-family="Arial,sans-serif" font-size="7"
        font-weight="400" fill="#69707D" letter-spacing="1.5">BUILDING EXCELLENCE · DELIVERING FUTURES</text>
</svg>`),

  // Hummingbird Properties
  hummingbird: uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 64">
  ${hbMark}
  <text x="78" y="26" font-family="'Arial Black',Arial,sans-serif"
        font-size="21" font-weight="900" fill="#0f0d2e">NAGA</text>
  <text x="79" y="40" font-family="Arial,sans-serif" font-size="8"
        font-weight="600" fill="#69707D" letter-spacing="1">HUMMINGBIRD PROPERTIES</text>
  <text x="79" y="52" font-family="Arial,sans-serif" font-size="7"
        font-weight="400" fill="#D4A843" letter-spacing="0.8">REAL ESTATE · ESTATES · STAYS</text>
</svg>`),
} as const;
