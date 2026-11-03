import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * The website reuses the mobile app's domain code (lib/, types/, constants/)
 * straight from the repo root, so feed ranking, credits, Iris and the inbox
 * behave exactly like the app. The handful of native-only modules those files
 * import are swapped for browser shims below.
 *
 * Output: dist/app/** (the signed-in web app, served at irisjobs.live/app)
 *         dist/how-it-works/index.html (static marketing page)
 */
const ROOT = __dirname;
const SHARED = resolve(__dirname, 'shared');
const SRC = resolve(__dirname, 'src');
const rootModule = (name: string) => resolve(ROOT, 'node_modules', name);

export default defineConfig(({ mode }) => {
  // Only the logo.dev publishable token is exposed to the browser. Nothing
  // else from the app's .env (server keys etc.) is ever bundled.
  const env = loadEnv(mode, ROOT, 'VITE_');
  const expoEnv = loadEnv(mode, ROOT, 'EXPO_PUBLIC_');
  const publicEnv = { EXPO_PUBLIC_LOGO_DEV_TOKEN: expoEnv.EXPO_PUBLIC_LOGO_DEV_TOKEN ?? '' };

  return {
    root: __dirname,
    base: '/',
    plugins: [react()],
    define: {
      __DEV__: JSON.stringify(mode !== 'production'),
      'process.env': JSON.stringify(publicEnv),
    },
    resolve: {
      alias: [
        // Web replacements for modules that only work on a phone.
        { find: /^@\/lib\/supabase$/, replacement: resolve(SRC, 'shims/supabase.ts') },
        { find: /^@\/lib\/posthog$/, replacement: resolve(SRC, 'shims/posthog.ts') },
        { find: /^@\/lib\/offline$/, replacement: resolve(SRC, 'shims/offline.ts') },
        { find: /^\.\/supabase$/, replacement: resolve(SRC, 'shims/supabase.ts') },
        { find: /^@\/constants\/company-logos$/, replacement: resolve(SRC, 'shims/company-logos.ts') },
        { find: /^react-native$/, replacement: resolve(SRC, 'shims/react-native.ts') },
        { find: /^@react-native-async-storage\/async-storage$/, replacement: resolve(SRC, 'shims/async-storage.ts') },
        { find: /^@react-native-community\/netinfo$/, replacement: resolve(SRC, 'shims/netinfo.ts') },
        // App code.
        { find: /^@web\//, replacement: SRC + '/' },
        { find: /^@\//, replacement: SHARED + '/' },
        // One copy of each runtime library, shared by app code and website code.
        { find: /^react$/, replacement: rootModule('react') },
        { find: /^react\/(.*)$/, replacement: rootModule('react') + '/$1' },
        { find: /^react-dom$/, replacement: rootModule('react-dom') },
        { find: /^react-dom\/(.*)$/, replacement: rootModule('react-dom') + '/$1' },
        { find: /^@tanstack\/react-query$/, replacement: rootModule('@tanstack/react-query') },
        { find: /^@supabase\/supabase-js$/, replacement: rootModule('@supabase/supabase-js') },
        { find: /^livekit-client$/, replacement: rootModule('livekit-client') },
        { find: /^zustand$/, replacement: rootModule('zustand') },
      ],
      dedupe: ['react', 'react-dom'],
    },
    server: { port: 5180, fs: { allow: [ROOT, SHARED] } },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'app/assets',
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'app/index.html'),
        },
      },
    },
  };
});
