"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const T = {
  bg: "#FFFFFF", bgSoft: "#F7F7F7", bgSoft2: "#EDEDED",
  border: "rgba(0,0,0,0.07)", border2: "rgba(0,0,0,0.12)",
  text1: "#1A1A2E", text2: "#6B7280", text3: "#9CA3AF",
  primary: "#2D6A4F", primaryL: "rgba(45,106,79,0.09)",
  ok: "#34C759", warn: "#FF9F0A", err: "#FF453A",
  font: "'Inter',-apple-system,sans-serif",
};

// Steps
const STEPS = [
  { id: "location", label: "Location",   icon: "📍" },
  { id: "photos",   label: "Photos",     icon: "📷" },
  { id: "ai",       label: "AI Review",  icon: "✨" },
  { id: "details",  label: "Details",    icon: "📋" },
  { id: "publish",  label: "Publish",    icon: "🚀" },
];

const PROPERTY_TYPES = [
  { key: "apartment",  label: "Apartment",  icon: "🏢" },
  { key: "house",      label: "House",      icon: "🏠" },
  { key: "villa",      label: "Villa",      icon: "🏡" },
  { key: "commercial", label: "Commercial", icon: "🏪" },
  { key: "office",     label: "Office",     icon: "🏬" },
  { key: "land",       label: "Land",       icon: "🌍" },
  { key: "plot",       label: "Plot",       icon: "📐" },
  { key: "hall",       label: "Hall/Event", icon: "🎪" },
];

const LISTING_TYPES = [
  { key: "rent", label: "For Rent",  icon: "🔑" },
  { key: "buy",  label: "For Sale",  icon: "💰" },
];

const AMENITIES = [
  "Parking", "Generator", "Water Storage", "Security Guard", "CCTV",
  "Elevator", "Furnished", "Air Conditioning", "Internet Ready",
  "Garden", "Swimming Pool", "Gym", "Rooftop Terrace", "Storage Room",
];

const ADDIS_DISTRICTS = [
  "Bole","CMC","CMC Michael","Kazanchis","Sarbet","Piassa",
  "Megenagna","Yeka","Gullele","Kotebe","Lafto","Kirkos",
  "Arada","Lideta","Nifas Silk","Kolfe","Akaki",
];

// Map coords for districts
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Bole": [9.005, 38.799], "CMC": [9.065, 38.808], "CMC Michael": [9.065, 38.808],
  "Kazanchis": [8.993, 38.771], "Sarbet": [8.990, 38.751], "Piassa": [9.033, 38.752],
  "Megenagna": [9.025, 38.822], "Yeka": [9.030, 38.830], "Gullele": [9.057, 38.737],
  "Kotebe": [9.055, 38.840], "Lafto": [8.970, 38.730], "Kirkos": [9.010, 38.755],
  "Arada": [9.040, 38.755], "Lideta": [8.995, 38.745], "Nifas Silk": [8.975, 38.780],
  "Kolfe": [8.995, 38.720], "Akaki": [8.870, 38.795],
};

interface ListingDraft {
  listing_type: string;
  property_type: string;
  neighbourhood: string;
  city: string;
  lat: number | null;
  lng: number | null;
  images: string[];        // uploaded URLs
  ai_title: string;
  ai_description: string;
  ai_property_type: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  floor: string;
  floors_total: string;
  year_built: string;
  amenities: string[];
  available_from: string;
  status: "draft" | "active";
}

const EMPTY: ListingDraft = {
  listing_type: "", property_type: "", neighbourhood: "", city: "Addis Ababa",
  lat: null, lng: null, images: [], ai_title: "", ai_description: "",
  ai_property_type: "", title: "", description: "", price: "", currency: "ETB",
  bedrooms: "", bathrooms: "", area_sqm: "", floor: "", floors_total: "",
  year_built: "", amenities: [], available_from: "", status: "draft",
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 20px", gap: 0 }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: done ? T.primary : active ? T.primary : T.bgSoft2,
              border: `2px solid ${done || active ? T.primary : T.border2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: done ? 12 : 11,
              color: done || active ? "#fff" : T.text3,
              fontWeight: 700,
            }}>
              {done ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? T.primary : T.bgSoft2, margin: "0 4px", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Location Step ─────────────────────────────────────────────────────────────
function StepLocation({ draft, onChange, onNext }: {
  draft: ListingDraft;
  onChange: (d: Partial<ListingDraft>) => void;
  onNext: () => void;
}) {
  const [mapCoords, setMapCoords] = useState<[number, number]>(
    draft.lat && draft.lng ? [draft.lat, draft.lng] : [9.005, 38.763]
  );

  function selectDistrict(nb: string) {
    const coords = DISTRICT_COORDS[nb] ?? [9.005, 38.763];
    setMapCoords(coords);
    onChange({ neighbourhood: nb, lat: coords[0], lng: coords[1] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: -0.5, marginBottom: 4 }}>Where is it?</div>
        <div style={{ fontSize: 14, color: T.text2 }}>Select the district and confirm the location on the map.</div>
      </div>

      {/* Listing type */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Listing Type</div>
        <div style={{ display: "flex", gap: 10 }}>
          {LISTING_TYPES.map(lt => (
            <button key={lt.key} onClick={() => onChange({ listing_type: lt.key })} style={{
              flex: 1, padding: "14px", borderRadius: 14,
              border: `2px solid ${draft.listing_type === lt.key ? T.primary : T.border2}`,
              background: draft.listing_type === lt.key ? T.primaryL : T.bg,
              cursor: "pointer", fontFamily: T.font,
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{lt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: draft.listing_type === lt.key ? T.primary : T.text1 }}>{lt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* District picker */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>District / Neighbourhood</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ADDIS_DISTRICTS.map(nb => (
            <button key={nb} onClick={() => selectDistrict(nb)} style={{
              padding: "8px 14px", borderRadius: 20,
              border: `1.5px solid ${draft.neighbourhood === nb ? T.primary : T.border2}`,
              background: draft.neighbourhood === nb ? T.primaryL : T.bg,
              color: draft.neighbourhood === nb ? T.primary : T.text2,
              fontSize: 13, fontWeight: draft.neighbourhood === nb ? 700 : 500,
              cursor: "pointer", fontFamily: T.font,
            }}>
              {nb}
            </button>
          ))}
        </div>
      </div>

      {/* Map preview */}
      {draft.neighbourhood && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Map Preview</div>
          <div style={{ borderRadius: 14, overflow: "hidden", height: 200, background: T.bgSoft2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {/* Simple visual representation */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>{draft.neighbourhood}</div>
              <div style={{ fontSize: 12, color: T.text3 }}>{mapCoords[0].toFixed(4)}, {mapCoords[1].toFixed(4)}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 6 }}>📌 Coordinates automatically set for this district. You can refine the exact location after publishing.</div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!draft.listing_type || !draft.neighbourhood}
        style={{
          padding: "16px", borderRadius: 14,
          background: (!draft.listing_type || !draft.neighbourhood) ? T.bgSoft2 : T.primary,
          color: (!draft.listing_type || !draft.neighbourhood) ? T.text3 : "#fff",
          fontSize: 15, fontWeight: 700, border: "none",
          cursor: (!draft.listing_type || !draft.neighbourhood) ? "not-allowed" : "pointer",
          fontFamily: T.font,
        }}
      >
        Next: Upload Photos →
      </button>
    </div>
  );
}

// ── Photos Step ───────────────────────────────────────────────────────────────
function StepPhotos({ draft, onChange, onNext, onBack }: {
  draft: ListingDraft;
  onChange: (d: Partial<ListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const newUrls: string[] = [];
    for (let i = 0; i < Math.min(files.length, 10 - draft.images.length); i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const { url } = await res.json();
          newUrls.push(url);
        }
      } catch { /* ignore */ }
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }
    onChange({ images: [...draft.images, ...newUrls] });
    setUploading(false);
  }

  function removeImage(idx: number) {
    onChange({ images: draft.images.filter((_, i) => i !== idx) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: -0.5, marginBottom: 4 }}>Add Photos</div>
        <div style={{ fontSize: 14, color: T.text2 }}>Upload at least 3 photos. Our AI will analyse them to suggest the property type and description.</div>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${draft.images.length > 0 ? T.primary : T.border2}`,
          borderRadius: 16, padding: "32px 20px", textAlign: "center",
          cursor: "pointer", background: draft.images.length > 0 ? T.primaryL : T.bgSoft,
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 4 }}>
          {uploading ? `Uploading… ${uploadProgress}%` : "Tap to upload photos"}
        </div>
        <div style={{ fontSize: 12, color: T.text3 }}>JPEG, PNG, WebP · Max 10MB each · Up to 10 photos</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={e => handleFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </div>

      {/* Image grid */}
      {draft.images.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            {draft.images.length} photo{draft.images.length !== 1 ? "s" : ""} uploaded
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {draft.images.map((url, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: T.bgSoft2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: "absolute", top: 4, right: 4, width: 22, height: 22,
                    borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none",
                    color: "#fff", fontSize: 12, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
                {i === 0 && (
                  <div style={{ position: "absolute", bottom: 4, left: 4, padding: "2px 6px", borderRadius: 6, background: T.primary, color: "#fff", fontSize: 9, fontWeight: 700 }}>COVER</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={draft.images.length < 1}
          style={{
            flex: 2, padding: "14px", borderRadius: 14,
            background: draft.images.length < 1 ? T.bgSoft2 : T.primary,
            color: draft.images.length < 1 ? T.text3 : "#fff",
            fontSize: 14, fontWeight: 700, border: "none",
            cursor: draft.images.length < 1 ? "not-allowed" : "pointer",
            fontFamily: T.font,
          }}
        >
          {draft.images.length > 0 ? `Next: AI Analysis →` : "Add at least 1 photo"}
        </button>
      </div>
    </div>
  );
}

// ── AI Step ───────────────────────────────────────────────────────────────────
function StepAI({ draft, onChange, onNext, onBack }: {
  draft: ListingDraft;
  onChange: (d: Partial<ListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(!!(draft.ai_title));

  async function runAI() {
    setAnalyzing(true);
    // Simulate AI analysis (replace with real API call)
    await new Promise(r => setTimeout(r, 2000));

    // Generate realistic suggestions based on what we know
    const typeGuesses: Record<string, string> = {
      apartment: "apartment", house: "house", villa: "villa",
      commercial: "commercial", office: "office", land: "land",
    };
    const guessedType = draft.property_type || "apartment";

    const descriptions: Record<string, string> = {
      apartment: `Bright and modern apartment in ${draft.neighbourhood}, Addis Ababa. Features open-plan living spaces with good natural light, a well-equipped kitchen, and comfortable bedrooms. Located in a secure compound with 24-hour security. Easy access to major roads and public transport.`,
      house: `Spacious family home in the heart of ${draft.neighbourhood}. Set on a generous plot with a private garden, this well-maintained property offers comfortable living across multiple floors. Close to schools, markets, and main arterials.`,
      villa: `Elegant villa in prestigious ${draft.neighbourhood} neighbourhood. Designed for discerning buyers seeking space, privacy and luxury. Features high ceilings, quality finishes, private garden and dedicated parking. A rare opportunity in one of Addis Ababa's most sought-after addresses.`,
      commercial: `Prime commercial space in ${draft.neighbourhood}, ideally suited for retail, office or service business. Excellent street frontage, flexible open-plan layout, and strong foot traffic in this established commercial corridor.`,
      office: `Professional office space in ${draft.neighbourhood} business district. Modern fit-out with meeting room, reception area, and high-speed internet infrastructure. Ideal for growing teams seeking a central, prestigious address.`,
      land: `Development land in ${draft.neighbourhood} — a rare opportunity to build in one of Addis Ababa's most active growth corridors. Clear title, regular plot dimensions, suitable for residential or mixed-use development.`,
    };

    onChange({
      ai_title: `${guessedType.charAt(0).toUpperCase() + guessedType.slice(1)} ${draft.listing_type === "rent" ? "for Rent" : "for Sale"} in ${draft.neighbourhood}`,
      ai_description: descriptions[guessedType] || descriptions.apartment,
      ai_property_type: guessedType,
      title: `${guessedType.charAt(0).toUpperCase() + guessedType.slice(1)} ${draft.listing_type === "rent" ? "for Rent" : "for Sale"} in ${draft.neighbourhood}`,
      description: descriptions[guessedType] || descriptions.apartment,
      property_type: draft.property_type || guessedType,
    });
    setAnalyzing(false);
    setDone(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: -0.5, marginBottom: 4 }}>AI Analysis ✨</div>
        <div style={{ fontSize: 14, color: T.text2 }}>Our AI analyses your photos and location to suggest a title, description, and property type.</div>
      </div>

      {!done && !analyzing && (
        <div style={{ padding: "24px", background: T.primaryL, border: `1px solid rgba(45,106,79,0.15)`, borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.primary, marginBottom: 8 }}>Ready to analyse {draft.images.length} photo{draft.images.length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 16 }}>The AI will suggest property type, title and description. You can edit everything afterwards.</div>
          <button onClick={runAI} style={{ padding: "14px 32px", borderRadius: 12, background: T.primary, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
            ✨ Analyse with AI
          </button>
        </div>
      )}

      {analyzing && (
        <div style={{ padding: "32px 20px", background: T.primaryL, borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.primary, marginBottom: 8 }}>Analysing your photos…</div>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 16 }}>Detecting property type, features, and location characteristics</div>
          <div style={{ height: 4, background: T.bgSoft2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: T.primary, borderRadius: 2, width: "60%", animation: "shimmer 1.2s infinite" }} />
          </div>
        </div>
      )}

      {done && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "12px 14px", background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)", borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ok, marginBottom: 4 }}>✓ AI analysis complete</div>
            <div style={{ fontSize: 12, color: T.text2 }}>Suggestions applied below. Edit anything before continuing.</div>
          </div>

          {/* Property type */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Property Type (AI suggested)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PROPERTY_TYPES.map(pt => (
                <button key={pt.key} onClick={() => onChange({ property_type: pt.key })} style={{
                  padding: "8px 14px", borderRadius: 20, fontFamily: T.font,
                  border: `1.5px solid ${draft.property_type === pt.key ? T.primary : T.border2}`,
                  background: draft.property_type === pt.key ? T.primaryL : T.bg,
                  color: draft.property_type === pt.key ? T.primary : T.text2,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  {pt.icon} {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Title</label>
            <input
              value={draft.title}
              onChange={e => onChange({ title: e.target.value })}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.primary}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Description</label>
            <textarea
              value={draft.description}
              onChange={e => onChange({ description: e.target.value })}
              rows={5}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.primary}`, fontSize: 14, color: T.text1, fontFamily: T.font, resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!done}
          style={{
            flex: 2, padding: "14px", borderRadius: 14,
            background: done ? T.primary : T.bgSoft2,
            color: done ? "#fff" : T.text3,
            fontSize: 14, fontWeight: 700, border: "none",
            cursor: done ? "pointer" : "not-allowed", fontFamily: T.font,
          }}
        >
          Next: Property Details →
        </button>
      </div>
    </div>
  );
}

// ── Details Step ──────────────────────────────────────────────────────────────
function StepDetails({ draft, onChange, onNext, onBack }: {
  draft: ListingDraft;
  onChange: (d: Partial<ListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isLand = draft.property_type === "land" || draft.property_type === "plot";

  function toggleAmenity(a: string) {
    const cur = draft.amenities;
    onChange({ amenities: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: -0.5, marginBottom: 4 }}>Property Details</div>
        <div style={{ fontSize: 14, color: T.text2 }}>Fill in the specifics — buyers and renters need these to make decisions.</div>
      </div>

      {/* Price */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
          Price {draft.listing_type === "rent" ? "(per month)" : ""}
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={draft.currency}
            onChange={e => onChange({ currency: e.target.value })}
            style={{ padding: "12px 10px", borderRadius: 10, border: `1.5px solid ${T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, background: T.bg, outline: "none" }}
          >
            <option value="ETB">ETB</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <input
            type="number"
            value={draft.price}
            onChange={e => onChange({ price: e.target.value })}
            placeholder="0"
            style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.price ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, outline: "none" }}
          />
        </div>
      </div>

      {/* Size */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Area (m²)</label>
        <input
          type="number"
          value={draft.area_sqm}
          onChange={e => onChange({ area_sqm: e.target.value })}
          placeholder="e.g. 120"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.area_sqm ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
        />
      </div>

      {/* Bedrooms / Bathrooms (not for land) */}
      {!isLand && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { key: "bedrooms" as const, label: "Bedrooms",  placeholder: "e.g. 3" },
            { key: "bathrooms" as const, label: "Bathrooms", placeholder: "e.g. 2" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{label}</label>
              <input
                type="number" min="0"
                value={draft[key]}
                onChange={e => onChange({ [key]: e.target.value })}
                placeholder={placeholder}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft[key] ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Floor / Total floors */}
      {!isLand && draft.property_type === "apartment" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { key: "floor" as const, label: "Floor", placeholder: "e.g. 4" },
            { key: "floors_total" as const, label: "Total Floors", placeholder: "e.g. 10" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{label}</label>
              <input
                type="number" min="0"
                value={draft[key]}
                onChange={e => onChange({ [key]: e.target.value })}
                placeholder={placeholder}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft[key] ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Year built + Available from */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Year Built</label>
          <input
            type="number" min="1950" max="2030"
            value={draft.year_built}
            onChange={e => onChange({ year_built: e.target.value })}
            placeholder="e.g. 2018"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.year_built ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Available From</label>
          <input
            type="date"
            value={draft.available_from}
            onChange={e => onChange({ available_from: e.target.value })}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.available_from ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Amenities & Features ({draft.amenities.length} selected)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AMENITIES.map(a => {
            const on = draft.amenities.includes(a);
            return (
              <button key={a} onClick={() => toggleAmenity(a)} style={{
                padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                border: `1.5px solid ${on ? T.primary : T.border2}`,
                background: on ? T.primaryL : T.bg,
                color: on ? T.primary : T.text2,
                fontSize: 13, fontWeight: on ? 700 : 500,
              }}>
                {on ? "✓ " : ""}{a}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!draft.price}
          style={{
            flex: 2, padding: "14px", borderRadius: 14,
            background: draft.price ? T.primary : T.bgSoft2,
            color: draft.price ? "#fff" : T.text3,
            fontSize: 14, fontWeight: 700, border: "none",
            cursor: draft.price ? "pointer" : "not-allowed", fontFamily: T.font,
          }}
        >
          Review & Publish →
        </button>
      </div>
    </div>
  );
}

// ── Publish Step ──────────────────────────────────────────────────────────────
function StepPublish({ draft, onChange, onBack }: {
  draft: ListingDraft;
  onChange: (d: Partial<ListingDraft>) => void;
  onBack: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [listingId, setListingId]   = useState<string | null>(null);

  const fmtPrice = (p: string, c: string) => {
    const n = parseFloat(p);
    if (isNaN(n)) return `${c} —`;
    return n >= 1_000_000 ? `${c} ${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${c} ${(n/1_000).toFixed(0)}K` : `${c} ${p}`;
  };

  async function submit(status: "draft" | "active") {
    setSubmitting(true);
    try {
      const body = {
        title:         draft.title || `${draft.property_type} in ${draft.neighbourhood}`,
        description:   draft.description,
        listing_type:  draft.listing_type,
        property_type: draft.property_type,
        price:         parseFloat(draft.price) || 0,
        currency:      draft.currency,
        bedrooms:      parseInt(draft.bedrooms) || 0,
        bathrooms:     parseInt(draft.bathrooms) || 0,
        area_sqm:      parseFloat(draft.area_sqm) || null,
        city:          draft.city,
        neighbourhood: draft.neighbourhood,
        lat:           draft.lat,
        lng:           draft.lng,
        status,
        amenities:     draft.amenities,
      };
      const res = await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        setListingId(data.id);
        setSubmitted(true);
        onChange({ status });
      }
    } finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "32px 0", gap: 16 }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text1 }}>
          {draft.status === "active" ? "Listing Published!" : "Draft Saved!"}
        </div>
        <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.6 }}>
          {draft.status === "active"
            ? "Your property is now live and visible to buyers and renters."
            : "Your draft is saved. You can activate it from your profile at any time."}
        </div>
        <a href={listingId ? `/properties/${listingId}` : "/explore"} style={{ padding: "16px 32px", borderRadius: 14, background: T.primary, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", marginTop: 8 }}>
          {draft.status === "active" ? "View Listing →" : "Back to Explore →"}
        </a>
        <a href="/listings/new" style={{ fontSize: 13, color: T.primary, fontWeight: 600 }}>+ List another property</a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: -0.5, marginBottom: 4 }}>Review & Publish</div>
        <div style={{ fontSize: 14, color: T.text2 }}>Everything looks good? Choose to publish now or save as draft.</div>
      </div>

      {/* Summary card */}
      <div style={{ background: T.bgSoft, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        {draft.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.images[0]} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, marginBottom: 4 }}>{draft.title}</div>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 8 }}>📍 {draft.neighbourhood}, {draft.city}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, background: T.primaryL, color: T.primary, fontSize: 12, fontWeight: 700 }}>
              {fmtPrice(draft.price, draft.currency)}{draft.listing_type === "rent" ? "/mo" : ""}
            </span>
            {draft.bedrooms && <span style={{ padding: "3px 10px", borderRadius: 20, background: T.bgSoft2, color: T.text2, fontSize: 12, fontWeight: 600 }}>{draft.bedrooms} bd</span>}
            {draft.bathrooms && <span style={{ padding: "3px 10px", borderRadius: 20, background: T.bgSoft2, color: T.text2, fontSize: 12, fontWeight: 600 }}>{draft.bathrooms} ba</span>}
            {draft.area_sqm && <span style={{ padding: "3px 10px", borderRadius: 20, background: T.bgSoft2, color: T.text2, fontSize: 12, fontWeight: 600 }}>{draft.area_sqm} m²</span>}
          </div>
          {draft.amenities.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: T.text3 }}>{draft.amenities.join(" · ")}</div>
          )}
        </div>
      </div>

      {/* Photos count */}
      <div style={{ padding: "12px 14px", background: T.primaryL, borderRadius: 12, fontSize: 13, color: T.primary, fontWeight: 600 }}>
        📷 {draft.images.length} photo{draft.images.length !== 1 ? "s" : ""} uploaded
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
          ← Edit
        </button>
        <button
          onClick={() => submit("draft")}
          disabled={submitting}
          style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: `1.5px solid ${T.border2}`, cursor: "pointer", fontFamily: T.font }}
        >
          💾 Draft
        </button>
      </div>
      <button
        onClick={() => submit("active")}
        disabled={submitting}
        style={{
          padding: "16px", borderRadius: 14,
          background: submitting ? T.bgSoft2 : T.primary,
          color: submitting ? T.text3 : "#fff",
          fontSize: 15, fontWeight: 700, border: "none",
          cursor: submitting ? "not-allowed" : "pointer", fontFamily: T.font,
        }}
      >
        {submitting ? "Publishing…" : "🚀 Publish Now"}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NewListingClient() {
  const [step, setStep]   = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(EMPTY);

  function update(d: Partial<ListingDraft>) { setDraft(prev => ({ ...prev, ...d })); }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Header */}
      <div style={{ padding: "52px 20px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: 10, background: T.bgSoft, border: `1px solid ${T.border2}`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke={T.text2} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text1 }}>List a Property</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{STEPS[step].icon} Step {step + 1} of {STEPS.length}: {STEPS[step].label}</div>
          </div>
        </div>
        <StepBar current={step} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>
        {step === 0 && <StepLocation  draft={draft} onChange={update} onNext={() => setStep(1)} />}
        {step === 1 && <StepPhotos   draft={draft} onChange={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <StepAI       draft={draft} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepDetails  draft={draft} onChange={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepPublish  draft={draft} onChange={update} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}
