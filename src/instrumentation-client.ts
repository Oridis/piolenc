import posthog from 'posthog-js';
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  createHistoryRouter,
  mountPostHogReplay,
  readStoredConsent,
} from '@/lib/posthog-replay.mjs';

// Next.js >= 15.3 client instrumentation: runs in the browser, before
// hydration, once per page load. It owns the single PostHog client and hands it
// to the consent-controlled replay controller in `src/lib/posthog-replay.mjs`.
if (typeof window !== 'undefined') {
  const router = createHistoryRouter(window);

  mountPostHogReplay({
    sdk: posthog,
    router,
    // Same consent source as `src/components/CookieBanner.tsx`: whatever the
    // visitor chose there, never a default and never an implicit opt-in.
    consent: {
      read: () => readStoredConsent(window.localStorage),
      subscribe: (onChange) => {
        const onStorage = (event: StorageEvent) => {
          if (event.key === null || event.key === CONSENT_STORAGE_KEY) onChange();
        };
        window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
        window.addEventListener('storage', onStorage);
        return () => {
          window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
          window.removeEventListener('storage', onStorage);
        };
      },
    },
    env: {
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
        process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    },
    win: window,
  });
}
