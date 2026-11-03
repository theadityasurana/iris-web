import * as SplashScreen from 'expo-splash-screen';

const VIDEO_WELCOME_ROUTES = new Set(['welcome', 'welcome-back']);

export function holdsSplashForVideoRoute(route: string | undefined): boolean {
  return !!route && VIDEO_WELCOME_ROUTES.has(route);
}

/** Hide native splash unless this route waits for welcome video readiness. */
export function hideSplashUnlessVideoWelcome(route: string | undefined) {
  if (!route) return;
  if (holdsSplashForVideoRoute(route)) return;
  SplashScreen.hideAsync().catch(() => {});
}

export function hideSplashAfterWelcomeVideo() {
  SplashScreen.hideAsync().catch(() => {});
}
