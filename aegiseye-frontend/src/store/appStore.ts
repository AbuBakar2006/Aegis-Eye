import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionStatus } from '@/types/api';

interface AppStore {
  // Demo mode
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  toggleDemoMode: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Backend connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  lastChecked: string | null;
  setLastChecked: (ts: string) => void;

  // API URL override (runtime setting)
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;

  // Active alerts (for notification banners)
  activeAlertIncidentId: string | null;
  setActiveAlert: (id: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Demo mode — default ON so FYP works without backend
      demoMode: true,
      setDemoMode: (enabled) => set({ demoMode: enabled }),
      toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Connection
      connectionStatus: 'checking',
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      lastChecked: null,
      setLastChecked: (ts) => set({ lastChecked: ts }),

      // API URL
      apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000',
      setApiBaseUrl: (url) => set({ apiBaseUrl: url }),

      // Alerts
      activeAlertIncidentId: null,
      setActiveAlert: (id) => set({ activeAlertIncidentId: id }),
    }),
    {
      name: 'aegiseye-app-store',
      partialize: (state) => ({
        demoMode: state.demoMode,
        sidebarCollapsed: state.sidebarCollapsed,
        apiBaseUrl: state.apiBaseUrl,
      }),
    }
  )
);
