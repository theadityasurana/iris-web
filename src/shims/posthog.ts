/** Analytics are a no-op on the web build for now. */
export const posthog = {
  capture: (_event: string, _props?: Record<string, unknown>) => {},
  identify: (_id: string, _props?: Record<string, unknown>) => {},
  reset: () => {},
};
export function track(_event: string, _properties?: Record<string, unknown>) {}
