import { FlaskConical, X, Zap } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function DemoModeBanner() {
  const setDemoMode = useAppStore((s) => s.setDemoMode);

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
      <div className="flex items-center gap-2 text-yellow-400 text-xs">
        <FlaskConical className="w-3.5 h-3.5" />
        <span className="font-semibold">DEMO MODE</span>
        <span className="text-yellow-500/70">
          — Displaying simulated data. Connect the backend and disable Demo Mode in Settings.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDemoMode(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-medium transition-colors"
        >
          <Zap className="w-3 h-3" />
          Connect Backend
        </button>
        <button
          className="text-yellow-500/50 hover:text-yellow-400 transition-colors"
          onClick={() => setDemoMode(false)}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
