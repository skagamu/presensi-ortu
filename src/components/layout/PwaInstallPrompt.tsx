"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const inStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (inStandalone) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem("pwa_prompt_dismissed_ortu")) {
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setShowPrompt(true);
    }

    // Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (showPrompt) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showPrompt]);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_prompt_dismissed_ortu", "true");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      handleDismiss();
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed top-4 left-3 right-3 md:left-auto md:right-8 md:max-w-sm z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-inner">
            <img src="/presensi-ortu/logo-skagamu.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold leading-tight truncate">Pasang Aplikasi Presensi Ortu</p>
            {isIos ? (
              <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                Ketuk <Share className="w-3 h-3 inline text-orange-400" /> lalu &apos;Add to Home Screen&apos; <PlusSquare className="w-3 h-3 inline text-orange-400" />
              </p>
            ) : (
              <p className="text-[10px] text-slate-300 mt-0.5">Akses cepat langsung dari layar utama HP</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIos && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Pasang
            </button>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
