import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds or on second visit
      const visits = parseInt(localStorage.getItem('webtoon-visits') || '0');
      localStorage.setItem('webtoon-visits', String(visits + 1));
      
      if (visits >= 1) {
        setTimeout(() => setShowPrompt(true), 5000);
      } else {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show after delay if not installed
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 10000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800/95 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-3xl font-bold text-white">W</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">
          Installer l'application
        </h3>

        {/* Description */}
        <p className="text-slate-300 text-sm mb-6">
          Installez Webtoon Book sur votre écran d'accueil pour un accès rapide et les notifications !
        </p>

        {isIOS ? (
          // iOS instructions
          <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-slate-400 font-medium">1.</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-200">Appuyez sur</span>
                <Share size={18} className="text-indigo-400" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-400 font-medium">2.</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-200">Sélectionnez</span>
                <span className="font-semibold text-white">"Sur l'écran d'accueil"</span>
                <Plus size={18} className="text-indigo-400" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
          >
            Plus tard
          </button>
          
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Installer
            </button>
          )}
          
          {isIOS && (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              J'ai compris
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
