import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Topbar } from '@/components/topbar/Topbar';
import { DemoModeBanner } from '@/components/demo/DemoModeBanner';
import { useAppStore } from '@/store/appStore';
import { useBackendStatus } from '@/hooks/useBackendStatus';

export function DashboardLayout() {
  useBackendStatus();

  const location = useLocation();
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const demoMode = useAppStore((s) => s.demoMode);

  return (
    <div className="flex h-screen overflow-hidden bg-aegis-bg-dark">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
      >
        {demoMode && <DemoModeBanner />}
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
