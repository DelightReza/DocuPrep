import React, { useEffect, useState } from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 text-white px-4 py-2 text-xs font-medium shadow-2xl border border-amber-500/40 backdrop-blur-md animate-fade-in"
    >
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>Offline Mode Active — All core resizing, PDF & image tools run 100% locally.</span>
    </div>
  );
};
