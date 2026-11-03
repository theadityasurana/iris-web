/** The few react-native APIs the shared lib/ code touches, for the browser. */
export const Platform = {
  OS: 'web' as const,
  select<T>(spec: { web?: T; default?: T; ios?: T; android?: T }): T | undefined {
    return 'web' in spec ? spec.web : spec.default;
  },
};

type AppStateStatus = 'active' | 'background';
export const AppState = {
  get currentState(): AppStateStatus {
    return document.visibilityState === 'visible' ? 'active' : 'background';
  },
  addEventListener(_type: 'change', listener: (s: AppStateStatus) => void) {
    const handler = () => listener(AppState.currentState);
    document.addEventListener('visibilitychange', handler);
    return { remove: () => document.removeEventListener('visibilitychange', handler) };
  },
};

export const Linking = {
  openURL: async (url: string) => { window.open(url, '_blank', 'noopener'); },
  canOpenURL: async () => true,
};

export const NativeModules = {};
