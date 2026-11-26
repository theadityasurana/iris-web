import { useLayoutEffect } from 'react';

/**
 * Sign-in, sign-up, onboarding and the first-job screen always use the light
 * theme, whatever the device prefers. The user's own choice comes back after.
 */
export function useLightTheme() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    return () => {
      if (prev) root.setAttribute('data-theme', prev); else root.removeAttribute('data-theme');
    };
  }, []);
}
