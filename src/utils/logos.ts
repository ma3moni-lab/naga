// Vite resolves these at build time → hashed URLs in dist/assets/.
// Served as real files; not intercepted by the Vercel catch-all rewrite.
import construction      from "@/imports/Naga_Construction_logo.png";
import constructionAllWhite from "@/imports/Naga_Construction_logo_all_white.png";
import constructionFull  from "@/imports/Naga_Construction_logo_full.png";
import constructionWhite from "@/imports/Naga_Construction_logo_white.png";
import hummingbird       from "@/imports/Naga_HummingBird_Logo-3__2_.png";

export const LOGOS = {
  /** Navy logo — light backgrounds (demo popup, login pages) */
  construction,
  /** All-white — dark/navy sidebar and card backgrounds */
  constructionAllWhite,
  /** Gold-accent variant — hero sections and feature cards */
  constructionFull,
  /** White variant — collapsed sidebar badge, icon-only contexts */
  constructionWhite,
  /** Naga Hummingbird Properties logo */
  hummingbird,
} as const;
