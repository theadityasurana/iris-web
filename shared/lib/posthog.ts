import PostHog from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const isPostHogConfigured = !!apiKey && apiKey !== 'phc_your_project_token_here';

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host: host || 'https://us.i.posthog.com',
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: isPostHogConfigured,
  flushAt: 5,
  flushInterval: 5000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: isPostHogConfigured,
  sendFeatureFlagEvent: isPostHogConfigured,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
  enableSessionReplay: false,
});

// Setup global error tracking
if (isPostHogConfigured) {
  const EU = (global as any).ErrorUtils;
  if (EU) {
    const originalHandler = EU.getGlobalHandler?.();
    EU.setGlobalHandler?.((error: any, isFatal?: boolean) => {
      posthog.capture('$exception', {
        $exception_message: error?.message || String(error),
        $exception_type: error?.name || 'Error',
        $exception_stack_trace_raw: error?.stack || '',
        is_fatal: isFatal ?? false,
      });
      if (originalHandler) originalHandler(error, isFatal);
    });
  }
}

// Helper: track with user context automatically included
export function track(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}
