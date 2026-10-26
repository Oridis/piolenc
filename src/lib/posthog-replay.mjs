/**
 * PostHog session replay controller for the allo-maison-bois storefront.
 *
 * Browser-only and deliberately dependency free: the PostHog SDK, the router and
 * the consent source are injected by the mount (`instrumentation-client.ts`), so
 * this module can be exercised offline in Node against a mocked SDK.
 *
 * Rules encoded here:
 * - no project token or host means no-op (never a default region);
 * - a new client starts opted out with recording disabled, every optional
 *   capture channel off and all replay payloads masked;
 * - only an affirmative stored consent starts a recording, and it is started
 *   once, without arguments, after opt_in_capturing();
 * - denial, withdrawal, exit and sensitive routes stop the recording;
 * - replay page/request URLs lose their query string and fragment and are
 *   dropped entirely for sensitive or unsafe URLs.
 */

/** localStorage key written by `src/components/CookieBanner.tsx`. */
export const CONSENT_STORAGE_KEY = 'woodmachine_cookie_consent';

/** Event dispatched on `window` when the visitor changes their cookie choice. */
export const CONSENT_CHANGE_EVENT = 'woodmachine:consent-change';

export const CONSENT_GRANTED = 'granted';
export const CONSENT_DENIED = 'denied';
export const CONSENT_UNKNOWN = 'unknown';

/** Cookie banner values -> controller consent states. Anything else is unknown. */
const CONSENT_BY_STORED_VALUE = {
  accepted_all: CONSENT_GRANTED,
  refused_marketing: CONSENT_DENIED,
};

/**
 * Route segments that never reach a snapshot: authentication, checkout and
 * payment, account pages, order tracking (the token lives in the path) and the
 * JSON APIs.
 */
export const SENSITIVE_PATH_SEGMENTS = [
  'admin',
  'api',
  'commande',
  'connexion',
  'inscription',
  'mon-compte',
  'suivi',
  'virement-bancaire',
];

/**
 * Subtrees blocked from the snapshot entirely. `ph-no-capture` is PostHog's own
 * opt-out class and stays first; the rest cover credentials, checkout forms and
 * anything an author marked sensitive. Text masking alone does not hide
 * attributes, `<img src>` or form values.
 */
export const BLOCKED_DOM_SELECTOR = [
  '.ph-no-capture',
  '[data-ph-no-capture]',
  '[data-sensitive]',
  'input[type="password"]',
  'input[type="email"]',
  'input[type="tel"]',
  'input[autocomplete="cc-number"]',
].join(', ');

/** Path segments that look like opaque identifiers (tracking tokens, hashes). */
const OPAQUE_SEGMENT = /^(?:[0-9a-f]{16,}|[A-Za-z0-9_-]{32,})$/i;

/**
 * Reads the visitor's stored cookie choice.
 *
 * @param {{ getItem: (key: string) => string | null } | undefined} storage
 * @returns {'granted' | 'denied' | 'unknown'}
 */
export function readStoredConsent(storage) {
  if (!storage || typeof storage.getItem !== 'function') return CONSENT_UNKNOWN;
  let raw = null;
  try {
    raw = storage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return CONSENT_UNKNOWN;
  }
  if (typeof raw !== 'string') return CONSENT_UNKNOWN;
  return CONSENT_BY_STORED_VALUE[raw] ?? CONSENT_UNKNOWN;
}

/**
 * True when the path must never be recorded or replayed.
 *
 * @param {string} pathname
 */
export function isSensitivePath(pathname) {
  if (typeof pathname !== 'string' || pathname.length === 0) return true;
  if (!pathname.startsWith('/')) return true;

  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return true;
  }

  const segments = decoded
    .toLowerCase()
    .split(/[/?#]/)
    .filter(Boolean);

  return segments.some(
    (segment) =>
      SENSITIVE_PATH_SEGMENTS.includes(segment) || OPAQUE_SEGMENT.test(segment)
  );
}

/**
 * Drops everything after the path of a URL: query strings and fragments can
 * carry emails, tokens and free text.
 *
 * Returns `null` for anything that cannot be parsed safely or points at a
 * sensitive route, so the replay never receives the original value.
 *
 * @param {unknown} rawUrl
 * @returns {string | null}
 */
export function redactReplayUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return null;
  const candidate = rawUrl.trim();
  if (candidate.length === 0) return null;
  // Whitespace, control characters and inline scripts are not safe URLs.
  if (/[\s\u0000-\u001f]/.test(candidate)) return null;
  if (/^(?:javascript|data|vbscript|file|blob):/i.test(candidate)) return null;

  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate);
  let parsed;
  try {
    parsed = new URL(candidate, 'https://redacted.invalid');
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (isSensitivePath(parsed.pathname)) return null;

  return isAbsolute
    ? `${parsed.origin}${parsed.pathname}`
    : parsed.pathname;
}

/**
 * `session_recording.maskCapturedNetworkRequestFn`. Also called with replay page
 * URLs. Returning `null` drops the entry instead of sending it.
 *
 * @param {unknown} request
 */
export function maskCapturedNetworkRequest(request) {
  if (!request || typeof request !== 'object') return null;
  const source =
    typeof request.name === 'string'
      ? request.name
      : typeof request.url === 'string'
        ? request.url
        : null;

  const safeUrl = redactReplayUrl(source);
  if (safeUrl === null) return null;

  const { url: _url, ...rest } = request;
  return { ...rest, name: safeUrl };
}

/**
 * Reads the public project token and the chosen ingestion host.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ token: string, host: string } | null} `null` when either value is
 * missing: there is no default region, the integration becomes a no-op.
 */
export function readProjectConfig(env) {
  const token = typeof env?.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN === 'string'
    ? env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN.trim()
    : '';
  const host = typeof env?.NEXT_PUBLIC_POSTHOG_HOST === 'string'
    ? env.NEXT_PUBLIC_POSTHOG_HOST.trim()
    : '';

  if (token.length === 0 || host.length === 0) return null;
  return { token, host };
}

/**
 * Builds the PostHog init options for a brand new client.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {Record<string, unknown> | null} `null` when the project is not
 * configured, which makes the whole integration a no-op.
 */
export function buildPostHogConfig(env) {
  const project = readProjectConfig(env);
  if (!project) return null;

  return {
    api_host: project.host,
    // New client: nothing is captured until the visitor says yes.
    opt_out_capturing_by_default: true,
    disable_session_recording: true,
    person_profiles: 'identified_only',
    // Optional capture channels stay off; replay is the only thing enabled.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    rageclick: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    enable_recording_console_log: false,
    capture_performance: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      recordBody: false,
      recordHeaders: false,
      // DOM masking does not cover canvas; it has to be switched off here
      // instead of relying on remote project defaults.
      captureCanvas: { recordCanvas: false },
      captureJsonLd: false,
      blockSelector: BLOCKED_DOM_SELECTOR,
      maskCapturedNetworkRequestFn: maskCapturedNetworkRequest,
    },
  };
}

/**
 * Minimal Next App Router adapter: the App Router has no public navigation
 * event, so client navigations are observed by wrapping the history methods
 * and by listening to `popstate`.
 *
 * @param {Window & typeof globalThis} win
 */
export function createHistoryRouter(win) {
  const listeners = new Set();
  const history = win?.history;

  const getPathname = () => {
    const pathname = win?.location?.pathname;
    return typeof pathname === 'string' && pathname.length > 0 ? pathname : '/';
  };

  const notify = () => {
    const pathname = getPathname();
    for (const listener of listeners) {
      try {
        listener(pathname);
      } catch {
        // A subscriber must never break navigation.
      }
    }
  };

  const restores = [];
  for (const method of ['pushState', 'replaceState']) {
    const original = history?.[method];
    if (typeof original !== 'function') continue;
    const patched = function patchedHistoryMethod(...args) {
      const result = original.apply(history, args);
      notify();
      return result;
    };
    history[method] = patched;
    restores.push(() => {
      if (history[method] === patched) history[method] = original;
    });
  }

  const onPopState = () => notify();
  win?.addEventListener?.('popstate', onPopState);

  return {
    getPathname,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      listeners.clear();
      win?.removeEventListener?.('popstate', onPopState);
      for (const restore of restores) restore();
    },
  };
}

const NOOP_HANDLE = Object.freeze({
  recording: false,
  sync() {},
  dispose() {},
});

let activeMount = null;

/**
 * Mounts the consent-controlled replay for one browser session.
 *
 * Calling it again (React strict mode, a re-executed entry) returns the handle
 * that already owns the SDK, so `init`, `startSessionRecording` and the
 * listeners are never duplicated.
 *
 * @param {{
 *   sdk: any,
 *   router?: { getPathname: () => string, subscribe?: (cb: () => void) => () => void, dispose?: () => void },
 *   consent?: { read: () => string, subscribe?: (cb: () => void) => () => void },
 *   env?: Record<string, string | undefined>,
 *   win?: any,
 * }} deps
 */
export function mountPostHogReplay({ sdk, router, consent, env, win } = {}) {
  if (activeMount) return activeMount;

  const project = readProjectConfig(env);
  const config = buildPostHogConfig(env);
  if (!sdk || typeof sdk.init !== 'function' || !project || !config) {
    return NOOP_HANDLE;
  }

  const state = {
    consent: CONSENT_UNKNOWN,
    recording: false,
    optedOut: false,
    exited: false,
    disposed: false,
    instance: null,
  };

  const safe = (action) => {
    try {
      action();
    } catch {
      // PostHog must never break a visitor action on the storefront.
    }
  };

  const handle = {
    get recording() {
      return state.recording;
    },
    sync,
    dispose,
  };

  activeMount = handle;

  const readConsent = () => {
    if (!consent || typeof consent.read !== 'function') return CONSENT_UNKNOWN;
    try {
      const value = consent.read();
      return typeof value === 'string' ? value : CONSENT_UNKNOWN;
    } catch {
      return CONSENT_UNKNOWN;
    }
  };

  const getPathname = () => {
    if (!router || typeof router.getPathname !== 'function') return '/';
    try {
      return router.getPathname();
    } catch {
      return '/';
    }
  };

  safe(() => {
    // `init` returns the browser singleton; reuse it when the SDK provides one.
    const instance = sdk.init(project.token, config);
    state.instance =
      instance && typeof instance.startSessionRecording === 'function'
        ? instance
        : sdk;
  });

  function stopRecording() {
    if (!state.recording) return;
    state.recording = false;
    safe(() => state.instance?.stopSessionRecording?.());
  }

  function startRecording() {
    if (state.recording || state.exited) return;
    // Set before the call so a throwing SDK cannot cause a retry loop.
    state.recording = true;
    safe(() => state.instance?.opt_in_capturing?.());
    safe(() => state.instance?.startSessionRecording?.());
  }

  function sync() {
    if (state.disposed) return;
    state.consent = readConsent();

    if (state.consent === CONSENT_DENIED) {
      stopRecording();
      if (!state.optedOut) {
        state.optedOut = true;
        safe(() => state.instance?.opt_out_capturing?.());
      }
      return;
    }

    if (state.consent !== CONSENT_GRANTED) {
      stopRecording();
      return;
    }

    if (state.exited || isSensitivePath(getPathname())) {
      stopRecording();
      return;
    }

    startRecording();
  }

  const unsubscribeConsent = consent?.subscribe?.(() => sync()) ?? (() => {});
  const unsubscribeRouter = router?.subscribe?.(() => sync()) ?? (() => {});

  const onExit = () => {
    state.exited = true;
    stopRecording();
  };
  safe(() => win?.addEventListener?.('pagehide', onExit));
  safe(() => win?.addEventListener?.('beforeunload', onExit));

  function dispose() {
    if (state.disposed) return;
    stopRecording();
    state.disposed = true;
    safe(() => unsubscribeConsent());
    safe(() => unsubscribeRouter());
    safe(() => win?.removeEventListener?.('pagehide', onExit));
    safe(() => win?.removeEventListener?.('beforeunload', onExit));
    safe(() => router?.dispose?.());
    if (activeMount === handle) activeMount = null;
  }

  sync();

  return handle;
}
