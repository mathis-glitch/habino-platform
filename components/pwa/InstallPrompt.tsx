"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt]     = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible]   = useState(false);
  const [isIOS, setIsIOS]       = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user already dismissed
    if (localStorage.getItem("habino_pwa_dismissed")) return;

    // Detect iOS Safari (no beforeinstallprompt event)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;
    setIsIOS(ios);

    if (ios) {
      // Show iOS hint after 3 seconds
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome — listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("habino_pwa_dismissed", "1");
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setPrompt(null);
  }

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Green accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: "var(--color-primary)" }} />
        <div className="p-4 flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-lg"
            style={{ backgroundColor: "var(--color-primary)" }}>
            h
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">Habino installieren</p>
            {isIOS ? (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Tippe auf <strong>Teilen</strong> und dann <strong>„Zum Home-Bildschirm"</strong> um die App zu installieren.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Füge Habino zum Homescreen hinzu — wie eine echte App, ohne App Store.
              </p>
            )}
            {!isIOS && (
              <button
                onClick={install}
                className="mt-3 w-full py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Installieren
              </button>
            )}
          </div>
          <button onClick={dismiss}
            className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
