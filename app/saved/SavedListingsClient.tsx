"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Property } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

function pricePerSqm(p: Property) {
  if (!p.area_sqm || p.area_sqm === 0) return "—";
  return fmt(Math.round(p.price / p.area_sqm), p.currency) + "/m²";
}

function propTypeLabel(t: string) {
  return { apartment: "Apartment", house: "House", commercial: "Commercial", land: "Land" }[t] ?? t;
}

function listingLabel(t: string) {
  return t === "buy" ? "Buy" : "Rent";
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ property: initialProperty, onClose }: { property: Property; onClose: () => void }) {
  const router    = useRouter();
  const [imgIdx, setImgIdx]       = useState(0);
  const [property, setProperty]   = useState(initialProperty);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = property.images ?? [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const stats = [
    property.bedrooms  > 0 && { label: "Beds",       value: String(property.bedrooms) },
    property.bathrooms > 0 && { label: "Baths",      value: String(property.bathrooms) },
    property.area_sqm      && { label: "Area",        value: `${property.area_sqm} m²` },
    true                    && { label: "Type",        value: propTypeLabel(property.property_type) },
    property.area_sqm      && { label: "Price/m²",    value: pricePerSqm(property) },
  ].filter(Boolean) as { label: string; value: string }[];

  function bookViewing() {
    const q = encodeURIComponent(`I would like to book a viewing for "${property.title}" in ${property.city}`);
    router.push(`/?q=${q}`);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadErr(null);
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    try {
      const res = await fetch(`/api/properties/${property.id}/images`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const newImages = data.images ?? [];
      setProperty((prev) => {
        const merged = [...(prev.images ?? []), ...newImages];
        setImgIdx(merged.length - newImages.length);
        return { ...prev, images: merged };
      });
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        style={{ maxWidth: 440, background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
              background: property.listing_type === "rent" ? "var(--color-primary-light)" : "rgba(48,209,88,0.1)",
              color: property.listing_type === "rent" ? "var(--color-primary)" : "var(--ok)",
            }}>
              {listingLabel(property.listing_type)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{propTypeLabel(property.property_type)}</span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--text-2)",
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} />

          {uploadErr && (
            <div style={{ margin: "12px 16px", padding: "10px 14px", borderRadius: 10, background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.2)", fontSize: 12, color: "var(--err)" }}>
              {uploadErr}
              <button onClick={() => setUploadErr(null)} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "var(--err)", fontSize: 12 }}>Close</button>
            </div>
          )}

          {/* Image carousel */}
          <div style={{ position: "relative", height: 260, background: "var(--surface2)" }}>
            {images.length > 0 ? (
              <>
                <Image src={images[imgIdx].url} alt={property.title} fill className="object-cover" sizes="440px" />
                {images.length > 1 && (
                  <>
                    {[
                      { dir: "prev", side: "left", d: "M15 19l-7-7 7-7" },
                      { dir: "next", side: "right", d: "M9 5l7 7-7 7" },
                    ].map(({ dir, side, d }) => (
                      <button key={dir}
                        onClick={() => setImgIdx((i) => dir === "prev" ? (i - 1 + images.length) % images.length : (i + 1) % images.length)}
                        style={{
                          position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)",
                          width: 30, height: 30, borderRadius: 8,
                          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "white",
                        }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                        </svg>
                      </button>
                    ))}
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setImgIdx(i)} style={{
                          width: i === imgIdx ? 14 : 5, height: 5, borderRadius: 3,
                          background: i === imgIdx ? "white" : "rgba(255,255,255,0.4)",
                          border: "none", cursor: "pointer", transition: "all 0.15s", padding: 0,
                        }} />
                      ))}
                    </div>
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      padding: "3px 8px", borderRadius: 20,
                      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                      fontSize: 10, fontWeight: 600, color: "white",
                    }}>
                      {imgIdx + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                }}>
                {uploading
                  ? <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }} />
                  : <>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        border: "1.5px dashed var(--border2)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)",
                      }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Add photos</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>JPG, PNG, WebP · max. 8 MB</span>
                    </>
                }
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 0 && (
            <div style={{
              display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto",
              background: "var(--surface2)", borderBottom: "1px solid var(--border)",
            }}>
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setImgIdx(i)} style={{
                  flexShrink: 0, width: 52, height: 38, borderRadius: 6, overflow: "hidden",
                  border: `2px solid ${i === imgIdx ? "var(--color-primary)" : "transparent"}`,
                  opacity: i === imgIdx ? 1 : 0.55, cursor: "pointer", padding: 0,
                }}>
                  <Image src={img.url} alt="" width={52} height={38} className="object-cover w-full h-full" />
                </button>
              ))}
              {images.length < 10 && (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
                  flexShrink: 0, width: 52, height: 38, borderRadius: 6,
                  border: "1.5px dashed var(--border2)",
                  background: "none", cursor: "pointer", color: "var(--text-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {uploading
                    ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }} />
                    : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  }
                </button>
              )}
            </div>
          )}

          {/* Price + title */}
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
              {fmt(property.price, property.currency)}
              {property.listing_type === "rent" && (
                <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-2)", marginLeft: 4 }}>/mo</span>
              )}
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", marginTop: 6, lineHeight: 1.3 }}>{property.title}</h2>
            <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)", marginTop: 6 }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, color: "var(--text-3)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Stats grid */}
          {stats.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {stats.map((s) => (
                  <div key={s.label} style={{
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "10px 8px", textAlign: "center",
                  }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Description</h3>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{property.description}</p>
            </div>
          )}

          {/* Agent contact */}
          {(property.agent_name || property.agent_email || property.agent_phone) && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Contact</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  color: "var(--text-3)",
                }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  {property.agent_name && <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{property.agent_name}</p>}
                  {property.agent_phone && <a href={`tel:${property.agent_phone}`} style={{ fontSize: 12, color: "var(--text-2)", display: "block" }}>{property.agent_phone}</a>}
                  {property.agent_email && <a href={`mailto:${property.agent_email}`} style={{ fontSize: 12, color: "var(--text-2)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.agent_email}</a>}
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>

        {/* CTA footer */}
        <div style={{
          flexShrink: 0, borderTop: "1px solid var(--border)",
          background: "var(--surface)", padding: "14px 16px",
          display: "flex", gap: 10,
        }}>
          <button onClick={bookViewing} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
            fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer",
            background: "var(--color-primary)",
            boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 4px 16px rgba(124,110,242,0.2)",
          }}>
            Book a viewing
          </button>
          <Link href="/" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "12px 16px", borderRadius: 10,
            border: "1px solid var(--border2)", background: "var(--surface2)",
            fontSize: 13, fontWeight: 500, color: "var(--text-2)", textDecoration: "none",
          }}>
            Ask AI
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Saved Card ────────────────────────────────────────────────────────────────
function SavedCard({
  property, selected, onToggle, onRemove, onOpen,
}: {
  property: Property; selected: boolean;
  onToggle: () => void; onRemove: () => void; onOpen: () => void;
}) {
  const img = property.images?.[0]?.url;
  return (
    <div
      onClick={onOpen}
      style={{
        position: "relative",
        background: "var(--surface2)",
        border: `1px solid ${selected ? "var(--color-primary)" : "var(--border)"}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        boxShadow: selected ? "0 0 0 3px rgba(124,110,242,0.15)" : "none",
        transition: "all 0.15s",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        aria-label="Select for comparison"
        style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          width: 24, height: 24, borderRadius: 7,
          border: selected ? "none" : "2px solid rgba(255,255,255,0.7)",
          background: selected ? "var(--color-primary)" : "rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
        <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24" style={{ opacity: selected ? 1 : 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove from saved"
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          width: 24, height: 24, borderRadius: 7,
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.65)",
        }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <div style={{ position: "relative", height: 160, background: "var(--surface3)", overflow: "hidden" }}>
        {img ? (
          <Image src={img} alt={property.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }} />
        <div style={{ position: "absolute", bottom: 8, left: 8 }}>
          <span style={{
            padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600,
            background: property.listing_type === "rent" ? "var(--color-primary-light)" : "rgba(48,209,88,0.12)",
            color: property.listing_type === "rent" ? "var(--color-primary)" : "var(--ok)",
            border: `1px solid ${property.listing_type === "rent" ? "rgba(124,110,242,0.25)" : "rgba(48,209,88,0.2)"}`,
            backdropFilter: "blur(8px)",
          }}>
            {listingLabel(property.listing_type)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 14px 16px" }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {fmt(property.price, property.currency)}
        </p>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", marginTop: 5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
          {property.title}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>
          {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          {property.bedrooms  > 0 && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{property.bedrooms} bd</span>}
          {property.bathrooms > 0 && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{property.bathrooms} ba</span>}
          {property.area_sqm      && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{property.area_sqm} m²</span>}
        </div>
      </div>
    </div>
  );
}

// ── Vergleichsansicht ─────────────────────────────────────────────────────────
function CompareView({ properties, onClose }: { properties: Property[]; onClose: () => void }) {
  const rows: { label: string; getValue: (p: Property) => string }[] = [
    { label: "Price",        getValue: (p) => fmt(p.price, p.currency) },
    { label: "Listing",          getValue: (p) => listingLabel(p.listing_type) },
    { label: "Type",          getValue: (p) => propTypeLabel(p.property_type) },
    { label: "Beds",       getValue: (p) => p.bedrooms  > 0 ? String(p.bedrooms) : "—" },
    { label: "Baths",        getValue: (p) => p.bathrooms > 0 ? String(p.bathrooms) : "—" },
    { label: "Area",       getValue: (p) => p.area_sqm ? `${p.area_sqm} m²` : "—" },
    { label: "Price/m²",     getValue: (p) => pricePerSqm(p) },
    { label: "City",        getValue: (p) => p.city },
    { label: "District",    getValue: (p) => p.neighbourhood ?? "—" },
  ];

  function isBest(row: typeof rows[0], p: Property, all: Property[]) {
    if (row.label === "Price") return p.price === Math.min(...all.map((x) => x.price));
    if (row.label === "Area") return (p.area_sqm ?? 0) === Math.max(...all.map((x) => x.area_sqm ?? 0)) && (p.area_sqm ?? 0) > 0;
    if (row.label === "Price/m²") {
      const vals = all.map((x) => x.area_sqm ? x.price / x.area_sqm : Infinity);
      const mine = p.area_sqm ? p.price / p.area_sqm : Infinity;
      return mine === Math.min(...vals) && mine < Infinity;
    }
    return false;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <button onClick={onClose} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 500, color: "var(--text-2)",
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>
        <span style={{ color: "var(--border2)" }}>/</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          {properties.length} properties compared
        </h1>
      </div>

      <div style={{
        background: "var(--surface2)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: `${200 + properties.length * 200}px` }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em", width: 160 }}>
                Merkmal
              </th>
              {properties.map((p) => {
                const img = p.images?.[0]?.url;
                return (
                  <th key={p.id} style={{ padding: "16px 16px", textAlign: "left", minWidth: 180 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ position: "relative", height: 90, borderRadius: 10, overflow: "hidden", background: "var(--surface3)" }}>
                        {img
                          ? <Image src={img} alt={p.title} fill className="object-cover" />
                          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
                              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                        }
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3 }}>{p.title}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)" }}>{[p.neighbourhood, p.city].filter(Boolean).join(", ")}</p>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 20px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {row.label}
                </td>
                {properties.map((p) => {
                  const best = isBest(row, p, properties);
                  return (
                    <td key={p.id} style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: best ? "var(--ok)" : "var(--text-1)", display: "flex", alignItems: "center", gap: 5 }}>
                        {best && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ok)", flexShrink: 0 }} />}
                        {row.getValue(p)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 12 }}>
        Green dot = best value in the category
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function SavedListingsClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [ids, setIds]               = useState<string[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [comparing, setComparing]   = useState(false);
  const [detailProp, setDetailProp] = useState<Property | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      setIds(stored);
    } catch { setIds([]); }
  }, []);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); setProperties([]); return; }
    async function fetchSaved() {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/batch?ids=${ids.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
        }
      } catch { setProperties([]); }
      finally { setLoading(false); }
    }
    fetchSaved();
  }, [ids]);

  useEffect(() => {
    function onStorage() {
      try {
        const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
        setIds(stored);
      } catch { setIds([]); }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else if (next.size < 4) { next.add(id); }
      return next;
    });
  }, []);

  function removeProperty(id: string) {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      const updated = stored.filter((x) => x !== id);
      localStorage.setItem("habino_saved", JSON.stringify(updated));
      setIds(updated);
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      if (detailProp?.id === id) setDetailProp(null);
    } catch { /* ignore */ }
  }

  if (comparing) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <CompareView properties={properties.filter((p) => selected.has(p.id))} onClose={() => setComparing(false)} />
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ height: 28, width: 160, background: "var(--surface2)", borderRadius: 8, marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "var(--surface2)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ height: 160, background: "var(--surface3)" }} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 18, background: "var(--surface3)", borderRadius: 5, width: "50%" }} />
                <div style={{ height: 14, background: "var(--surface3)", borderRadius: 5, width: "75%" }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (properties.length === 0) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px", minHeight: "calc(100vh - 124px)" }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: "var(--surface2)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, color: "var(--text-3)",
        }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", marginBottom: 8 }}>No saved properties yet</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 280, marginBottom: 28, lineHeight: 1.6 }}>
          Ask the AI agent for properties and save them using the heart icon.
        </p>
        <Link href="/" style={{
          padding: "10px 22px", borderRadius: 10,
          background: "var(--color-primary)", color: "white",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 4px 16px rgba(124,110,242,0.2)",
        }}>
          Objekte entdecken
        </Link>
      </main>
    );
  }

  const selectedArr = Array.from(selected);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            Saved
            <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-3)", marginLeft: 8 }}>· {properties.length}</span>
          </h1>
          {properties.length >= 2 && (
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Open a card for details · select 2–4 to compare</p>
          )}
        </div>
        <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>
          Mehr entdecken →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
        {properties.map((p) => (
          <SavedCard
            key={p.id}
            property={p}
            selected={selected.has(p.id)}
            onToggle={() => toggleSelect(p.id)}
            onRemove={() => removeProperty(p.id)}
            onOpen={() => setDetailProp(p)}
          />
        ))}
      </div>

      {detailProp && <DetailDrawer property={detailProp} onClose={() => setDetailProp(null)} />}

      {/* Compare bar */}
      {selectedArr.length >= 2 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 30,
          display: "flex", alignItems: "center", gap: 12,
          background: "var(--surface)", border: "1px solid var(--border2)",
          padding: "12px 18px", borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,110,242,0.1)",
        }}>
          <div style={{ display: "flex", marginRight: -4 }}>
            {selectedArr.slice(0, 4).map((id) => {
              const p = properties.find((x) => x.id === id);
              const img = p?.images?.[0]?.url;
              return (
                <div key={id} style={{
                  width: 30, height: 30, borderRadius: 8,
                  border: "2px solid var(--surface)", background: "var(--surface3)",
                  overflow: "hidden", marginRight: -6,
                }}>
                  {img && <Image src={img} alt="" width={30} height={30} className="object-cover w-full h-full" />}
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", paddingLeft: 10 }}>
            {selectedArr.length} selected
          </span>
          <button onClick={() => setComparing(true)} style={{
            padding: "7px 16px", borderRadius: 9,
            background: "var(--color-primary)", color: "white",
            fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
          }}>
            Compare →
          </button>
          <button onClick={() => setSelected(new Set())} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-3)", display: "flex", alignItems: "center",
          }} aria-label="Clear selection">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
