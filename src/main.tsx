import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from '@/App';
import '@/styles/index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found.');
}

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    // Check for new deploys often so phones pick up updates without a manual tap.
    const ping = () => {
      void registration.update();
    };
    window.addEventListener('focus', ping);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ping();
    });
    window.setInterval(ping, 15 * 60 * 1000);
    console.info('[G4 PWA] Service worker registered (auto-update):', swUrl);
  },
  onOfflineReady() {
    console.info('[G4 PWA] Ready to work offline.');
    window.dispatchEvent(new CustomEvent('g4-offline-ready'));
  },
  onNeedRefresh() {
    // autoUpdate + skipWaiting: new SW activates; reload to load fresh assets.
    // Local IndexedDB data is preserved.
    console.info('[G4 PWA] New version ready — reloading.');
    window.location.reload();
  },
});

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
