"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { formatPrice, getHeroImage } from "@/lib/utils";
import { useSavedListings } from "@/app/hooks/useSavedListings";

interface ListingCreated {
  id: string;
  title: string;
  price: number;
  currency: string;
  listing_type: string;
  property_type: string;
  city: string;
  bedrooms: number;
  area_sqm?: number;
}

interface WizardState {
  step: string | null;
  data: Record<string, unknown>;
  lastCreatedId?: string;
  editingField?: string;
}

interface ContractCreated {
  id: string;
  tenant_name: string;
  landlord_name: string;
  monthly_rent: number | null;
  currency: string;
  start_date: string;
}

interface ProfileData {
  full_name?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  country_code?: string;
  id_number?: string;
  bio?: string;
  preferred_lang?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  properties?: Property[];
  appointment?: { success: boolean; error?: string };
  listing_created?: ListingCreated;
  contract_created?: ContractCreated;
  profile_saved?: { success: boolean; error?: string };
  wizard_chips?: string[];   // structured option chips for wizard steps
  filters?: Record<string, unknown>;
}

// ── Inline property card ─────────────────────────────────────────────────────
function ChatPropertyCard({ property }: { property: Property }) {
  const hero = getHeroImage(property.images);
  const { isSaved, toggle } = useSavedListings();
  const saved = isSaved(property.id);

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <button
        onClick={() => toggle(property.id)}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-110"
      >
        <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: saved ? "#ef4444" : "#94a3b8" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div>
        <div className="relative h-16 bg-slate-100 overflow-hidden">
          {hero ? (
            <Image src={hero} alt={property.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="300px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}>
              {property.listing_type === "buy" ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="font-bold text-slate-900 text-sm">
            {formatPrice(property.price, property.currency)}
            {property.listing_type === "rent" && <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>}
          </p>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{property.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {property.neighbourhood ? `${property.neighbourhood}, ` : ""}{property.city}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
            {property.bedrooms > 0 && <span>{property.bedrooms} bd</span>}
            {property.bathrooms > 0 && <span>{property.bathrooms} ba</span>}
            {property.area_sqm && <span>{property.area_sqm} m²</span>}
          </div>
          {saved && (
            <p className="text-[10px] text-slate-400 mt-1.5">
              Saved · <Link href="/saved" className="underline" style={{ color: "var(--color-primary)" }}>View details →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Appointment card ─────────────────────────────────────────────────────────
function AppointmentCard({ result }: { result: { success: boolean; error?: string } }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
        Could not save appointment: {result.error || "Unknown error"}
      </div>
    );
  }
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-emerald-800">Viewing request sent!</p>
        <p className="text-xs text-emerald-600 mt-0.5">We&apos;ll confirm by email shortly.</p>
      </div>
    </div>
  );
}

// ── Listing created card ─────────────────────────────────────────────────────
function ListingCreatedCard({ listing }: { listing: ListingCreated }) {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency", currency: listing.currency, maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-800 mb-0.5">Listing published!</p>
        <p className="text-sm font-medium text-slate-800 truncate">{listing.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-emerald-700">
          <span>{price}</span>
          <span className="capitalize">{listing.listing_type === "buy" ? "For Sale" : "For Rent"}</span>
          <span className="capitalize">{listing.property_type}</span>
          <span>{listing.city}</span>
          {listing.bedrooms > 0 && <span>{listing.bedrooms} bed</span>}
          {listing.area_sqm && <span>{listing.area_sqm} m²</span>}
        </div>
        <Link href="/saved"
          className="inline-block mt-2 text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
          View in Saved →
        </Link>
      </div>
    </div>
  );
}

// ── Contract created card ─────────────────────────────────────────────────────
function ContractCreatedCard({ contract }: { contract: ContractCreated }) {
  const rent = contract.monthly_rent
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: contract.currency, maximumFractionDigits: 0 }).format(contract.monthly_rent)
    : null;
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-lg">📄</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-800 mb-0.5">Contract being generated…</p>
        <p className="text-xs text-slate-600">
          {contract.landlord_name} → {contract.tenant_name}
          {rent ? ` · ${rent}/mo` : ""}
          {" · "}{new Date(contract.start_date).toLocaleDateString()}
        </p>
        <Link href="/home"
          className="inline-block mt-2 text-xs font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
          View in Home → Contracts
        </Link>
      </div>
    </div>
  );
}

// ── Profile saved card ────────────────────────────────────────────────────────
function ProfileSavedCard({ result }: { result: { success: boolean; error?: string } }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
        <div className="text-lg shrink-0">⚠️</div>
        <div>
          <p className="text-sm font-semibold text-red-700">Could not save profile</p>
          <p className="text-xs text-red-500 mt-0.5">{result.error || "Please try again or visit the Profile page."}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-lg">✅</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-800">Profile saved!</p>
        <p className="text-xs text-emerald-600 mt-0.5">Your details will be used to pre-fill contracts and personalise your AI experience.</p>
        <Link href="/profile"
          className="inline-block mt-2 text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
          View your profile →
        </Link>
      </div>
    </div>
  );
}

// ── Wizard option chips ───────────────────────────────────────────────────────
// Larger, more prominent than follow-up chips — used for guided listing wizard steps
function WizardChips({ chips, onSend }: { chips: string[]; onSend: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {chips.map((chip) => {
        const isPublish   = chip.toLowerCase().includes("publish");
        const isGenerate  = chip.toLowerCase().includes("generate");
        const isViewHome  = chip.toLowerCase().includes("view my contracts");
        const isPrimary   = isPublish || isGenerate || isViewHome;
        if (isViewHome) {
          return (
            <Link key={chip} href="/home"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white border-2 border-transparent hover:opacity-90 transition-all"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {chip}
            </Link>
          );
        }
        return (
          <button
            key={chip}
            onClick={() => onSend(chip)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
              isPrimary
                ? "text-white border-transparent hover:opacity-90"
                : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
            style={isPrimary ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}>
            {chip}
          </button>
        );
      })}
    </div>
  );
}

// ── Follow-up chips ──────────────────────────────────────────────────────────
function FollowUpChips({ msg, onSend }: { msg: ChatMessage; onSend: (text: string) => void }) {
  const chips: string[] = [];
  if (msg.properties && msg.properties.length > 0) {
    chips.push("Schedule a viewing");
    chips.push("Show cheaper options");
    chips.push("Show larger properties");
  } else if (msg.properties && msg.properties.length === 0) {
    chips.push("Show all listings");
    chips.push("Increase budget");
    chips.push("Try a different city");
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip) => (
        <button key={chip} onClick={() => onSend(chip)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 font-medium hover:border-slate-300 hover:bg-slate-50 transition-all">
          {chip}
        </button>
      ))}
    </div>
  );
}

// ── Voice languages (full list) ───────────────────────────────────────────────
const VOICE_LANGS = [
  { code: "en-US", flag: "🇺🇸", label: "English (US)" },
  { code: "en-GB", flag: "🇬🇧", label: "English (UK)" },
  { code: "de-DE", flag: "🇩🇪", label: "Deutsch" },
  { code: "fr-FR", flag: "🇫🇷", label: "Français" },
  { code: "es-ES", flag: "🇪🇸", label: "Español (ES)" },
  { code: "es-MX", flag: "🇲🇽", label: "Español (MX)" },
  { code: "ar-SA", flag: "🇸🇦", label: "العربية" },
  { code: "ar-EG", flag: "🇪🇬", label: "العربية (مصر)" },
  { code: "sw-KE", flag: "🇰🇪", label: "Kiswahili" },
  { code: "pt-BR", flag: "🇧🇷", label: "Português (BR)" },
  { code: "pt-PT", flag: "🇵🇹", label: "Português (PT)" },
  { code: "it-IT", flag: "🇮🇹", label: "Italiano" },
  { code: "nl-NL", flag: "🇳🇱", label: "Nederlands" },
  { code: "pl-PL", flag: "🇵🇱", label: "Polski" },
  { code: "ru-RU", flag: "🇷🇺", label: "Русский" },
  { code: "tr-TR", flag: "🇹🇷", label: "Türkçe" },
  { code: "hi-IN", flag: "🇮🇳", label: "हिन्दी" },
  { code: "bn-IN", flag: "🇧🇩", label: "বাংলা" },
  { code: "zh-CN", flag: "🇨🇳", label: "普通话" },
  { code: "zh-TW", flag: "🇹🇼", label: "繁體中文" },
  { code: "ja-JP", flag: "🇯🇵", label: "日本語" },
  { code: "ko-KR", flag: "🇰🇷", label: "한국어" },
  { code: "vi-VN", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "th-TH", flag: "🇹🇭", label: "ภาษาไทย" },
  { code: "id-ID", flag: "🇮🇩", label: "Bahasa Indonesia" },
  { code: "ms-MY", flag: "🇲🇾", label: "Bahasa Melayu" },
  { code: "ha-NG", flag: "🇳🇬", label: "Hausa" },
  { code: "yo-NG", flag: "🇳🇬", label: "Yorùbá" },
  { code: "ig-NG", flag: "🇳🇬", label: "Igbo" },
  { code: "am-ET", flag: "🇪🇹", label: "አማርኛ" },
  { code: "zu-ZA", flag: "🇿🇦", label: "isiZulu" },
  { code: "af-ZA", flag: "🇿🇦", label: "Afrikaans" },
];

// ── Language picker dropdown ──────────────────────────────────────────────────
function LangPicker({ lang, onChange }: { lang: typeof VOICE_LANGS[0]; onChange: (l: typeof VOICE_LANGS[0]) => void }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  const filtered = search
    ? VOICE_LANGS.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()))
    : VOICE_LANGS;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} title="Voice language"
        className="shrink-0 h-9 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-1">
        <span>{lang.flag}</span>
        <span className="hidden sm:inline">{lang.code.split("-")[0].toUpperCase()}</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-56 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language…"
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1"/>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((l) => (
              <button key={l.code} type="button"
                onClick={() => { onChange(l); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${lang.code === l.code ? "bg-slate-50 font-semibold" : ""}`}>
                <span>{l.flag}</span>
                <span className="truncate">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mic button ────────────────────────────────────────────────────────────────
function MicButton({ onResult, lang, size = "md" }: { onResult: (t: string) => void; lang: string; size?: "sm" | "md" }) {
  const [listening,  setListening]  = useState(false);
  const [supported,  setSupported]  = useState(true);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const w = window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition };
    if (!window.SpeechRecognition && !w.webkitSpeechRecognition) setSupported(false);
  }, []);

  function toggle() {
    const w  = window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition };
    const SR = window.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r          = new SR();
    r.lang           = lang;
    r.continuous     = false;
    r.interimResults = false;
    r.onresult = (e: SpeechRecognitionEvent) => onResult(e.results[0][0].transcript);
    r.onerror  = () => setListening(false);
    r.onend    = () => setListening(false);
    r.start();
    recogRef.current = r;
    setListening(true);
  }

  if (!supported) return null;
  const dim = size === "sm" ? "w-9 h-9" : "w-10 h-10";
  return (
    <button type="button" onClick={toggle} title={listening ? "Stop" : "Speak"}
      className={`shrink-0 ${dim} rounded-xl flex items-center justify-center transition-all ${
        listening ? "bg-red-500 animate-pulse" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700"
      }`}>
      {listening
        ? <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
          </svg>}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function AIChatPage() {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [wizardState, setWizardState] = useState<WizardState>({ step: null, data: {} });
  const [voiceLangIdx, setVoiceLangIdx] = useState(0);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const voiceLang = VOICE_LANGS[voiceLangIdx];

  function onVoiceResult(text: string) {
    setInput((prev) => (prev ? prev + " " + text : text));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function setVoiceLang(l: typeof VOICE_LANGS[0]) {
    setVoiceLangIdx(VOICE_LANGS.findIndex((x) => x.code === l.code));
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-send ?q= query param (e.g. from "Book a Viewing" in Saved drawer)
  // Also handle ?wizard=profile to start the profile setup interview
  useEffect(() => {
    const q      = searchParams.get("q");
    const wizard = searchParams.get("wizard");

    if (messages.length === 0) {
      if (wizard === "profile") {
        sendMessage("I want to set up my profile");
        window.history.replaceState(null, "", "/");
      } else if (q) {
        sendMessage(decodeURIComponent(q));
        window.history.replaceState(null, "", "/");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const currentProperty = pathname?.startsWith("/properties/")
      ? pathname.replace("/properties/", "") : undefined;

    try {
      // Serialize properties into assistant messages so the AI has context for follow-ups
      const apiMessages = newMessages.map(({ role, content, properties }) => ({
        role,
        content: properties && properties.length > 0
          ? `${content}\n\n[Listings shown: ${JSON.stringify(properties.map(p => ({
              id: p.id, title: p.title, price: p.price, currency: p.currency,
              city: p.city, neighbourhood: p.neighbourhood,
              property_type: p.property_type, listing_type: p.listing_type,
              bedrooms: p.bedrooms, bathrooms: p.bathrooms, area_sqm: p.area_sqm,
            })))}]`
          : content,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context: currentProperty ? { currentProperty } : undefined,
          wizard: wizardState,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages([...newMessages, { role: "assistant", content: `⚠️ Error: ${data.error || `HTTP ${res.status}`}` }]);
        return;
      }
      // Update wizard state if returned by API
      if (data.wizard !== undefined) {
        setWizardState(data.wizard);
      }

      // If API returned profile_data, save it via the profile API (which handles auth)
      let profileSaved: { success: boolean; error?: string } | undefined;
      if (data.profile_data) {
        try {
          const saveRes = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.profile_data as ProfileData),
          });
          const saveData = await saveRes.json();
          profileSaved = saveRes.ok
            ? { success: true }
            : { success: false, error: saveData.error ?? "Save failed" };
        } catch (e: unknown) {
          profileSaved = { success: false, error: e instanceof Error ? e.message : "Network error" };
        }
      }

      setMessages([...newMessages, {
        role: "assistant",
        content: data.reply ?? "",
        properties: data.properties !== undefined ? data.properties : undefined,
        appointment: data.appointment,
        listing_created: data.listing_created,
        contract_created: data.contract_created,
        profile_saved: profileSaved,
        wizard_chips: data.chips,
        filters: data.filters,
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages([...newMessages, { role: "assistant", content: `⚠️ Connection error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pathname]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function renderText(text: string) {
    const parts = text.split(/(\[.*?\]\(\/properties\/[^)]+\))/g);
    return parts.map((part, i) => {
      const m = part.match(/^\[(.+?)\]\((\/properties\/[^)]+)\)$/);
      if (m) return <Link key={i} href={m[2]} className="underline font-semibold" style={{ color: "var(--color-primary)" }}>{m[1]}</Link>;
      return <span key={i}>{part}</span>;
    });
  }

  const quickActions = [
    { icon: "📝", text: "I want to list my property", label: "List a property" },
    { icon: "📄", text: "Create a contract",          label: "Create a contract" },
    { icon: "👤", text: "I want to set up my profile", label: "Set up profile" },
  ];

  const suggestions = [
    { icon: "🏠", text: "Show apartments for rent" },
    { icon: "💰", text: "What's available under $300k?" },
    { icon: "🛏️", text: "I need a 3-bedroom home" },
    { icon: "🏙️", text: "Show properties in Nairobi" },
  ];

  const hasMessages = messages.length > 0;

  return (
    <main className="flex flex-col" style={{ minHeight: "calc(100vh - 64px - 60px)" }}>

      {/* ── Empty / Hero state ── */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

          {/* Headline */}
          <div className="text-center max-w-xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              AI-Powered Real Estate
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
              Find your perfect<br />
              <span style={{ color: "var(--color-primary)" }}>home with AI</span>
            </h1>
            <p className="text-slate-500 text-lg">
              Describe what you&apos;re looking for — I&apos;ll find matching properties and book viewings. Property owner? I can list your property too.
            </p>
          </div>

          {/* Main input bar */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex items-end gap-3 bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 focus-within:border-primary transition-all shadow-lg focus-within:shadow-xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 3-bedroom apartment near the city centre under $400k..."
                rows={1}
                className="flex-1 bg-transparent text-base text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              {/* Language picker */}
              <LangPicker lang={voiceLang} onChange={setVoiceLang} />
              {/* Mic */}
              <MicButton onResult={onVoiceResult} lang={voiceLang.code} />
              {/* Send */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90 active:scale-95 shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-slate-300 mt-2">Press Enter to send · Tap 🎤 to speak</p>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-3 mb-2">
            {quickActions.map((a) => (
              <button
                key={a.text}
                onClick={() => sendMessage(a.text)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>

          {/* Suggestion chips */}
          <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
            {suggestions.map((s) => (
              <button key={s.text} onClick={() => sendMessage(s.text)}
                className="flex items-center gap-3 text-left px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:shadow-sm hover:border-slate-300 transition-all text-sm text-slate-600 font-medium">
                <span className="text-base">{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>

          {/* Subtle agent link */}
          <p className="text-xs text-slate-300 mt-8">
            Are you a property agent?{" "}
            <Link href="/admin" className="underline hover:text-slate-500 transition-colors">
              Go to dashboard →
            </Link>
          </p>
        </div>
      )}

      {/* ── Message thread ── */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                    ✨
                  </div>
                )}
                <div className="flex flex-col gap-3 max-w-[85%]">
                  {msg.content && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                    }`} style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : {}}>
                      {msg.role === "assistant" ? renderText(msg.content) : msg.content}
                    </div>
                  )}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ maxWidth: "520px" }}>
                      {msg.properties.map((p) => <ChatPropertyCard key={p.id} property={p} />)}
                    </div>
                  )}
                  {msg.appointment && <AppointmentCard result={msg.appointment} />}
                  {msg.listing_created && <ListingCreatedCard listing={msg.listing_created} />}
                  {msg.contract_created && <ContractCreatedCard contract={msg.contract_created} />}
                  {msg.profile_saved && <ProfileSavedCard result={msg.profile_saved} />}
                  {msg.role === "assistant" && i === messages.length - 1 && !loading && (
                    msg.wizard_chips
                      ? <WizardChips chips={msg.wizard_chips} onSend={sendMessage} />
                      : <FollowUpChips msg={msg} onSend={sendMessage} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                  ✨
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1s" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* ── Input bar (chat mode) ── */}
      {hasMessages && (
        <div className="border-t border-slate-200 bg-white py-4 px-4">
          {/* Wizard progress bar */}
          {wizardState.step && (() => {
            // Determine which wizard is active and its steps/labels
            const isProfile  = wizardState.step.startsWith("profile_");
            const isContract = wizardState.step.startsWith("contract_");

            const steps = isProfile
              ? ["profile_name","profile_contact","profile_location","profile_identity","profile_confirm"]
              : isContract
              ? ["contract_landlord","contract_property","contract_tenant","contract_terms","contract_jurisdiction","contract_confirm"]
              : ["listing_type","property_type","title","price","city","extras","confirm"];

            const idx   = steps.indexOf(wizardState.step);
            const total = steps.length;
            const wizardName = isProfile ? "Profile setup" : isContract ? "Contract wizard" : "Listing wizard";
            const labels: Record<string, string> = {
              listing_type: "Sale or Rent", property_type: "Property type",
              title: "Title", price: "Price", city: "City",
              extras: "Details", confirm: "Review & publish",
              edit_field: "Editing", edit_value: "Editing",
              profile_name: "Your name", profile_contact: "Contact details",
              profile_location: "Location", profile_identity: "Identity & language",
              profile_confirm: "Review & save",
              contract_landlord: "Landlord", contract_property: "Property",
              contract_tenant: "Tenant", contract_terms: "Terms",
              contract_jurisdiction: "Jurisdiction", contract_confirm: "Review & generate",
            };
            return (
              <div className="max-w-2xl mx-auto mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {wizardName} · {labels[wizardState.step] || wizardState.step}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Step {Math.max(idx + 1, 1)} of {total}
                  </span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((Math.max(idx + 1, 1)) / total) * 100}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            );
          })()}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about properties..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              {/* Language picker */}
              <LangPicker lang={voiceLang} onChange={setVoiceLang} />
              {/* Mic */}
              <MicButton onResult={onVoiceResult} lang={voiceLang.code} size="sm" />
              {/* Send */}
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90 active:scale-95 shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-300 mt-2">Enter to send · Tap 🎤 to speak</p>
          </div>
        </div>
      )}
    </main>
  );
}
