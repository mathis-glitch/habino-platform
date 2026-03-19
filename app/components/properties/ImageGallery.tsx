"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage { id: string; url: string }

export function ImageGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
        <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in"
        onClick={() => setLightbox(true)}>
        <Image
          src={images[active].url}
          alt={title}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              ›
            </button>
            <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
          {images.map((img, i) => (
            <button key={img.id} onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 rounded-lg overflow-hidden transition-all ${
                i === active ? "ring-2 opacity-100" : "opacity-60 hover:opacity-90"
              }`}
              >
              <div className={`absolute inset-0 rounded-lg ${i === active ? "ring-2" : ""}`}
                style={i === active ? { boxShadow: `0 0 0 2px var(--color-primary)` } : {}} />
              <Image src={img.url} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none">×</button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20">
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20">
                ›
              </button>
            </>
          )}
          <div className="relative w-full max-w-4xl max-h-[85vh] aspect-video" onClick={(e) => e.stopPropagation()}>
            <Image src={images[active].url} alt={title} fill className="object-contain" sizes="100vw" />
          </div>
          <p className="absolute bottom-4 text-white/50 text-sm">{active + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
