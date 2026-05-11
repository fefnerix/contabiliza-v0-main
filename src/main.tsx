
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.tsx'
import './index.css'

const THEME_KEY = 'contabiliza-ui-theme';
const LEGACY_THEME_KEY = 'metacash-ui-theme';
try {
  if (!localStorage.getItem(THEME_KEY) && localStorage.getItem(LEGACY_THEME_KEY)) {
    localStorage.setItem(THEME_KEY, localStorage.getItem(LEGACY_THEME_KEY)!);
  }
} catch {
  /* ignore private mode */
}
import { registerSW } from 'virtual:pwa-register'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  beforeSend(event) {
    return event;
  },
});

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay contenido nuevo disponible. ¿Actualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('La aplicación está lista para funcionar sin conexión')
  },
})

createRoot(document.getElementById("root")!).render(<App />);
