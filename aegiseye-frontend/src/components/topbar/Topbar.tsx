import { Bell, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { formatTimeAgo } from '@/utils/format';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cameras': 'Live Cameras',
  '/incidents': 'Incidents',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function Topbar() {
  const location = useLocation();
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const lastChecked = useAppStore((s) => s.lastChecked);
  const demoMode = useAppStore((s) => s.demoMode);
  const activeAlertIncidentId = useAppStore((s) => s.activeAlertIncidentId);

  const title = PAGE_TITLES[location.pathname] ?? 'AegisEye';

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-aegis-border-dark bg-aegis-bg-panel/80 backdrop-blur-sm flex-shrink-0">
      {/* Page title */}
      <div>
        <h1 className="text-white font-semibold text-base">{title}</h1>
        <p className="text-xs text-gray-500 font-mono">
          {new Date().toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Alert badge */}
        <AnimatePresence>
          {activeAlertIncidentId && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-medium animate-alert-flash"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              INCIDENT DETECTED
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs">
          {demoMode ? (
            <span className="text-yellow-400 font-mono">DEMO MODE</span>
          ) : connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Connected</span>
              {lastChecked && (
                <span className="text-gray-600">{formatTimeAgo(lastChecked)}</span>
              )}
            </>
          ) : connectionStatus === 'checking' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="text-blue-400">Connecting…</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">Offline</span>
            </>
          )}
        </div>

        {/* Bell */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
          {activeAlertIncidentId && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}
