import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { notifyAppUpdateAvailable } from '@/components/pwa/UpdatePrompt';
import App from '@/App';
import '@/styles/index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found.');
}

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    // Poll for new builds when the app is focused — never clears IndexedDB.
    const ping = () => {
      void registration.update();
    };
    window.addEventListener('focus', ping);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ping();
    });
    // Periodic check every 60 minutes while the tab is open.
    window.setInterval(ping, 60 * 60 * 1000);
    console.info('[G4 PWA] Service worker registered:', swUrl);
  },
  onOfflineReady() {
    console.info('[G4 PWA] Ready to work offline.');
    window.dispatchEvent(new CustomEvent('g4-offline-ready'));
  },
  onNeedRefresh() {
    notifyAppUpdateAvailable(updateSW);
    window.dispatchEvent(new CustomEvent('g4-need-refresh'));
  },
});

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
