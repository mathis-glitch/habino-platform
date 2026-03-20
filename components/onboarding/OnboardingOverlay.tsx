"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SLIDES = [
  {
    icon: "🏡",
    title: "Find your space.\nAnytime. Anywhere.",
    body: "Habino bringt Transparenz in den Immobilienmarkt — egal ob du mietest, kaufst oder inserierst.",
    cta: null,
  },
  {
    icon: "✨",
    title: "Dein KI-Assistent\nist immer da.",
    body: "Sag einfach was du brauchst — per Text oder Sprache. Der Assistent findet Immobilien, erstellt Verträge und beantwortet alle Fragen.",
    cta: null,
  },
  {
    icon: "🚀",
    title: "Wie möchtest\ndu starten?",
    body: null,
    cta: "start",
  },
];

export default function OnboardingOverlay() {
  const router = useRouter();
  const [visible, setVisible]   = useState(false);
  const [slide,   setSlide]     = useState(0);
  const [exiting, setExiting]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("habino_onboarded")) {
      // Small delay so the app renders first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  function finish(path = "/") {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem("habino_onboarded", "1");
      setVisible(false);
      if (path !== "/") router.push(path);
    }, 300);
  }

  if (!visible) return null;

  const current = SLIDES[slide];
  const isLast  = slide === SLIDES.length - 1;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(160deg, var(--color-primary) 0%, var(--color-primary-dark, #235f35) 100%)" }}>

      {/* Skip */}
      <div className="flex justify-end p-5">
        <button onClick={() => finish("/")}
          className="text-white/60 text-sm font-medium hover:text-white transition-colors">
          Überspringen
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div key={slide} className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="text-7xl mb-8">{current.icon}</div>

          <h1 className="text-3xl font-black text-white leading-tight whitespace-pre-line mb-4">
            {current.title}
          </h1>

          {current.body && (
            <p className="text-white/75 text-base leading-relaxed max-w-xs mx-auto">
              {current.body}
            </p>
          )}

          {/* Last slide: two CTA options */}
          {current.cta === "start" && (
            <div className="flex flex-col gap-3 mt-8 w-full max-w-xs mx-auto">
              <button
                onClick={() => finish("/markt")}
                className="w-full py-4 rounded-xl bg-white font-bold text-base transition-all active:scale-[0.98] hover:bg-white/90"
                style={{ color: "var(--color-primary)" }}>
                🔍 Immobilie suchen
              </button>
              <button
                onClick={() => finish("/?q=Immobilie+inserieren")}
                className="w-full py-4 rounded-xl bg-white/15 border border-white/30 font-bold text-base text-white transition-all active:scale-[0.98] hover:bg-white/25">
                🏠 Immobilie inserieren
              </button>
              <button
                onClick={() => finish("/")}
                className="w-full py-3 text-white/60 text-sm font-medium hover:text-white transition-colors">
                Einfach mal schauen →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: dots + next button */}
      <div className="px-8 pb-10 flex flex-col items-center gap-6">

        {/* Dot indicators */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === slide ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/35"
              }`} />
          ))}
        </div>

        {/* Next / forward button (not on last slide) */}
        {!isLast && (
          <button
            onClick={() => setSlide(s => s + 1)}
            className="w-full max-w-xs py-4 rounded-xl bg-white font-bold text-base transition-all active:scale-[0.98] hover:bg-white/90"
            style={{ color: "var(--color-primary)" }}>
            Weiter →
          </button>
        )}
      </div>
    </div>
  );
}
