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
    // Check for updates when the app returns to focus (mobile-friendly).
    const ping = () => {
      void registration.update();
    };
    window.addEventListener('focus', ping);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ping();
    });
    console.info('[G4 PWA] Service worker registered:', swUrl);
  },
  onOfflineReady() {
    console.info('[G4 PWA] Ready to work offline.');
    window.dispatchEvent(new CustomEvent('g4-offline-ready'));
  },
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('g4-need-refresh'));
  },
});

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
