/**
 * Asset loader — resolves logo/image files from src/imports/ by name,
 * regardless of extension. Drop a file named "My_Logo.jpg" (or .png, .jpeg,
 * .webp, .gif, .svg) and call getAsset("My_Logo") anywhere in the app.
 *
 * Vite's import.meta.glob collects every matching file at BUILD TIME and
 * emits them as hashed assets in dist/assets/, so URLs are always correct
 * in production — no Git LFS, no string paths, no 404s.
 */

const _assets = import.meta.glob(
  "../imports/*.{png,jpg,jpeg,webp,gif,svg,PNG,JPG,JPEG,WEBP,GIF,SVG}",
  { eager: true }
);

/**
 * Look up an asset from src/imports/ by filename (with or without extension).
 *
 * Examples:
 *   getAsset("Naga_Construction_logo_all_white")  // finds .png or .jpg etc.
 *   getAsset("Naga_Construction_logo_all_white.png")  // exact match
 *
 * Returns an empty string if no file matches (safe for <img src={...} />).
 */
export function getAsset(name: string): string {
  // 1. Exact match — name already includes an extension
  const exactKey = `../imports/${name}`;
  const exact = _assets[exactKey] as { default: string } | undefined;
  if (exact?.default) return exact.default;

  // 2. Extension-free match — find any file whose basename equals `name`
  for (const [key, mod] of Object.entries(_assets)) {
    const basename = key.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
    if (basename === name) {
      return (mod as { default: string }).default ?? "";
    }
  }

  return "";
}
