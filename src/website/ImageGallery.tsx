import { useState } from "react";

interface Props {
  images: string[];
  alt: string;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onImageClick?: () => void;
}

export default function ImageGallery({ images, alt, height = 320, className, style, onImageClick }: Props) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent((current - 1 + total) % total); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent((current + 1) % total); };

  if (!total) return null;

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ height, ...style }}
      onClick={onImageClick}
    >
      {images.map((img, i) => (
        <img
          key={img}
          src={img}
          alt={`${alt} ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
        />
      ))}

      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 1.5L3.5 5.5 7 9.5" stroke="#252731" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4 1.5L7.5 5.5 4 9.5" stroke="#252731" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          {/* Pill dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === current ? "18px" : "6px", background: i === current ? "white" : "rgba(255,255,255,0.4)" }}
              />
            ))}
          </div>

          {/* Counter badge */}
          <div className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.38)", color: "white", backdropFilter: "blur(4px)" }}>
            {current + 1}/{total}
          </div>
        </>
      )}
    </div>
  );
}
