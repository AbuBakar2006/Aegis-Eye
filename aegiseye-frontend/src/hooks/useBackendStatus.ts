/**
 * useBackendStatus hook
 * Periodically pings the backend and updates connection status in global store.
 */

import { useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAppStore } from '@/store/appStore';

export function useBackendStatus() {
  const setConnectionStatus = useAppStore((s) => s.setConnectionStatus);
  const setLastChecked = useAppStore((s) => s.setLastChecked);
  const demoMode = useAppStore((s) => s.demoMode);

  useEffect(() => {
    if (demoMode) {
      setConnectionStatus('disconnected');
      return;
    }

    let cancelled = false;

    const check = async () => {
      setConnectionStatus('checking');
      const ok = await apiClient.ping();
      if (!cancelled) {
        setConnectionStatus(ok ? 'connected' : 'error');
        setLastChecked(new Date().toISOString());
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [demoMode, setConnectionStatus, setLastChecked]);
}
