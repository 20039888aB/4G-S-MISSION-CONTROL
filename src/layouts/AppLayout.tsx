import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { Sidebar } from '@/layouts/Sidebar';
import { TopBar } from '@/layouts/TopBar';

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative flex-1 overflow-x-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(240,180,41,0.08),transparent_60%)]"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <QuickCapture />
      <InstallPrompt />
    </div>
  );
}
