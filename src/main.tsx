import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persistOptions, queryClient } from '@web/lib/cache';
import { AuthProvider } from '@web/auth/AuthProvider';
import { ToastProvider } from '@web/ui/Toast';
import { App } from '@web/App';
import '@web/styles/app.css';
import '@web/styles/onboarding.css';
import '@web/styles/pages.css';

// Apply the saved theme before first paint. "System" is the absence of a saved value.
try {
  const theme = localStorage.getItem('iris-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
} catch { /* private mode */ }

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
