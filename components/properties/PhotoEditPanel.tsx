"use client";

import { useState } from "react";
import { ImageUploader } from "./ImageUploader";

interface PhotoEditPanelProps {
  propertyId: string;
  imageCount: number;
}

export function PhotoEditPanel({ propertyId, imageCount }: PhotoEditPanelProps) {
  const [open, setOpen] = useState(imageCount === 0);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: "var(--color-primary)" }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Fotos bearbeiten
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">Fotos verwalten</h3>
        <button onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600 text-sm">
          Schließen
        </button>
      </div>
      <ImageUploader propertyId={propertyId} />
    </div>
  );
}
