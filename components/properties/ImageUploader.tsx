"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

interface UploadedImage {
  id:         string;
  url:        string;
  sort_order: number;
}

interface ImageUploaderProps {
  propertyId:     string;
  existingImages?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
  maxImages?:     number;
}

export function ImageUploader({
  propertyId,
  existingImages = [],
  onImagesChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const [images,    setImages]    = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [dragOver,  setDragOver]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Maximal ${maxImages} Fotos erlaubt.`);
      return;
    }

    const toUpload = fileArray.slice(0, remaining);
    setError(null);
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    toUpload.forEach((f) => form.append("files", f));

    try {
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        body:   form,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Upload fehlgeschlagen");
      }

      const data = await res.json();
      const next = [...images, ...(data.images ?? [])];
      setImages(next);
      onImagesChange?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function deleteImage(imgId: string) {
    try {
      await fetch(`/api/properties/${propertyId}/images?imageId=${imgId}`, { method: "DELETE" });
      const next = images.filter((i) => i.id !== imgId);
      setImages(next);
      onImagesChange?.(next);
    } catch {
      setError("Foto konnte nicht gelöscht werden.");
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }, [images]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const canAdd = images.length < maxImages && !uploading;

  return (
    <div className="flex flex-col gap-3">

      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            dragOver
              ? "border-opacity-100 bg-opacity-10"
              : "border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-white"
          }`}
          style={dragOver ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" } : {}}>

          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            {uploading ? (
              <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {uploading ? "Wird hochgeladen…" : "Fotos hinzufügen"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {uploading
                ? "Bitte warten"
                : `Klicken oder hierher ziehen · ${images.length}/${maxImages} Fotos`}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
              <Image src={img.url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="120px" />
              {/* Hero badge */}
              {i === 0 && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  Titelbild
                </div>
              )}
              {/* Delete button */}
              <button
                onClick={() => deleteImage(img.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 text-xs"
                title="Foto löschen">
                ×
              </button>
            </div>
          ))}

          {/* Add more slot */}
          {canAdd && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-slate-300 hover:bg-slate-50 transition-all">
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
