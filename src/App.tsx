import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { SplashScreen } from '@/components/brand/SplashScreen';
import { ToastContainer } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { AppRoutes } from '@/routes';
import { maybeNotifyWeeklyReview } from '@/services/rewards/weekly';
import { useAuthStore } from '@/stores/authStore';

export default function App() {
  useTheme();
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void maybeNotifyWeeklyReview();
  }, [isAuthenticated]);

  const appReady = isInitialized && splashGone;

  return (
    <>
      {!splashGone ? (
        <SplashScreen
          minDurationMs={1400}
          readyToDismiss={isInitialized}
          onFinish={() => setSplashGone(true)}
        />
      ) : null}

      {isInitialized ? (
        <div className={appReady ? 'contents' : 'invisible pointer-events-none absolute inset-0'}>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
          <ToastContainer />
        </div>
      ) : null}
    </>
  );
}
