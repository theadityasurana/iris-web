import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

export function safeGoBack(router: Router, fallback: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}

/**
 * Replace the whole navigation stack with `path`. router.replace() alone only
 * swaps the top screen: signing out from Settings left the previous account's
 * tabs mounted underneath, so the next account ran two home feeds at once.
 */
export function resetTo(router: Router, path: string) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(path as any);
}
