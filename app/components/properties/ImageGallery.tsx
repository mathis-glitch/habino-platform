"use client";

import { useState, useRef } from "react";

interface GalleryImage { id: string; url: string; sort_order?: number }

const G = "#2D6A4F";

export function ImageGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive]   = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipe    = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40 && images.length > 1) {
      didSwipe.current = true;
      if (dx < 0) setActive((a) => (a + 1) % images.length);
      else        setActive((a) => (a - 1 + images.length) % images.length);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  if (!images.length) {
    return (
      <div style={{
        width: "100%", height: 300, display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F0F7F4",
      }}>
        <svg width="64" height="64" fill="none" stroke={G} strokeWidth={1} viewBox="0 0 24 24" style={{ opacity: 0.35 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div
        style={{ position: "relative", width: "100%", height: 320, background: "#E8EDEB", cursor: "zoom-in", userSelect: "none" }}
        onClick={() => { if (!didSwipe.current) setLightbox(true); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {images.length > 1 && (
          <>
            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}
              style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 20, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
              ‹
            </button>
            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 20, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
              ›
            </button>
            {/* Dots */}
            <div style={{
              position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 5,
            }}>
              {images.slice(0, 6).map((_, i) => (
                <div key={i} style={{
                  width: i === active ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === active ? "#fff" : "rgba(255,255,255,.5)",
                  transition: "width 0.2s",
                }} />
              ))}
            </div>
            {/* Counter */}
            <div style={{
              position: "absolute", bottom: 14, right: 14,
              padding: "3px 9px", borderRadius: 20,
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
              color: "#fff", fontSize: 11, fontWeight: 600,
            }}>
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", padding: "8px 16px 2px",
          background: "#fff",
        }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0, width: 72, height: 52, borderRadius: 8, overflow: "hidden",
                border: `2px solid ${i === active ? G : "transparent"}`,
                opacity: i === active ? 1 : 0.55,
                cursor: "pointer", padding: 0, background: "none",
                transition: "opacity 0.15s",
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setLightbox(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button style={{
            position: "absolute", top: 16, right: 16,
            color: "rgba(255,255,255,0.7)", fontSize: 32, lineHeight: 1,
            background: "none", border: "none", cursor: "pointer",
          }}>×</button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}
                style={{
                  position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)", color: "#fff",
                  fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: "pointer",
                }}>‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}
                style={{
                  position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)", color: "#fff",
                  fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: "pointer",
                }}>›</button>
            </>
          )}
          <div
            style={{ maxWidth: "90vw", maxHeight: "85vh", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active].url}
              alt={title}
              style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }}
            />
          </div>
          <p style={{ position: "absolute", bottom: 16, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {active + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
