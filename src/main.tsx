import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persistOptions, queryClient } from '@web/lib/cache';
import { AuthProvider } from '@web/auth/AuthProvider';
import { ToastProvider } from '@web/ui/Toast';
import { App } from '@web/App';
// Registers the install-prompt listener before anything mounts (Chrome fires it once, early).
import '@web/lib/pwa';
import { capturePromoFromUrl } from '@web/lib/promo';
import '@web/styles/app.css';
import '@web/styles/onboarding.css';
import '@web/styles/pages.css';
import '@web/styles/premium.css';
import '@web/styles/sky.css';

// Apply the saved theme before first paint. "System" is the absence of a saved value.
// Light by default for everyone (the device's dark mode is ignored); dark only if chosen in Settings.
let savedTheme: string | null = null;
try { savedTheme = localStorage.getItem('iris-theme-v2'); } catch { /* private mode */ }
document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');

// Makes /app installable as a desktop app (Chrome/Edge "Install", Safari "Add to Dock").
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {}); });
}

// Partner links (/?code=ARJUN10) land straight in /app too: keep the code for checkout.
capturePromoFromUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
);
