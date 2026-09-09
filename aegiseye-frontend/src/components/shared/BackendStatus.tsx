import { Wifi, WifiOff, AlertCircle, Loader2, FlaskConical } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils/cn';

export function BackendStatus() {
  const status = useAppStore((s) => s.connectionStatus);
  const demoMode = useAppStore((s) => s.demoMode);

  if (demoMode) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <FlaskConical className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-400 font-medium">Demo Mode Active</span>
      </div>
    );
  }

  const configs = {
    connected: {
      icon: Wifi,
      text: 'Backend Connected',
      className: 'bg-green-500/10 border-green-500/20 text-green-400',
    },
    disconnected: {
      icon: WifiOff,
      text: 'Backend Offline',
      className: 'bg-red-500/10 border-red-500/20 text-red-400',
    },
    error: {
      icon: AlertCircle,
      text: 'Connection Error',
      className: 'bg-red-500/10 border-red-500/20 text-red-400',
    },
    checking: {
      icon: Loader2,
      text: 'Connecting…',
      className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium',
        config.className
      )}
    >
      <Icon className={cn('w-4 h-4', status === 'checking' && 'animate-spin')} />
      <span>{config.text}</span>
    </div>
  );
}
