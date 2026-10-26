/**
 * Offline check for the consent-controlled PostHog replay integration.
 *
 *   node posthog-replay.check.mjs
 *
 * It imports the real controller (`src/lib/posthog-replay.mjs`, the module the
 * Next.js entry `src/instrumentation-client.ts` mounts) as-is, and replaces the
 * PostHog SDK, the router and the consent source with stubs. No browser, no
 * network, no dotenv or framework autoload.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const PINNED_SDK_VERSION = '1.438.13';

// The child environment starts empty: only OS/path/temp values survive, plus the
// synthetic PostHog config injected before the controller is imported.
const OS_ENV_KEYS = new Set([
  'PATH',
  'Path',
  'PATHEXT',
  'ComSpec',
  'SystemRoot',
  'SystemDrive',
  'windir',
  'TEMP',
  'TMP',
  'HOME',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'NUMBER_OF_PROCESSORS',
  'OS',
  'PROCESSOR_ARCHITECTURE',
  'PROCESSOR_IDENTIFIER',
]);
for (const key of Object.keys(process.env)) {
  if (!OS_ENV_KEYS.has(key)) delete process.env[key];
}

// Never a real token prefix (no phc_/phx_): this is a synthetic placeholder.
const SYNTHETIC_ENV = Object.freeze({
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'synthetic-project-token',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
});
process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN =
  SYNTHETIC_ENV.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
process.env.NEXT_PUBLIC_POSTHOG_HOST = SYNTHETIC_ENV.NEXT_PUBLIC_POSTHOG_HOST;

let networkCalls = 0;
globalThis.fetch = () => {
  networkCalls += 1;
  return Promise.reject(new Error('network is disabled in this offline check'));
};

// Resolved from the project root so the check also runs from `scripts/`.
const replay = await import(
  pathToFileURL(path.join(ROOT, 'src/lib/posthog-replay.mjs')).href
);

const GRANTED = replay.CONSENT_GRANTED;
const DENIED = replay.CONSENT_DENIED;
const UNKNOWN = replay.CONSENT_UNKNOWN;

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readText(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

/**
 * Stubs for the three injected dependencies: the SDK singleton, the App Router
 * adapter and the consent source written by `CookieBanner`.
 */
function createHarness({ pathname = '/', consent = UNKNOWN } = {}) {
  const calls = { init: [], optIn: 0, optOut: 0, start: [], stop: 0 };

  const sdk = {
    init(token, options) {
      calls.init.push({ token, options });
      return sdk;
    },
    opt_in_capturing() {
      calls.optIn += 1;
    },
    opt_out_capturing() {
      calls.optOut += 1;
    },
    startSessionRecording(...args) {
      calls.start.push(args);
    },
    stopSessionRecording() {
      calls.stop += 1;
    },
  };

  const routeListeners = new Set();
  const router = {
    pathname,
    getPathname() {
      return router.pathname;
    },
    subscribe(listener) {
      routeListeners.add(listener);
      return () => routeListeners.delete(listener);
    },
  };

  const consentListeners = new Set();
  const consentSource = {
    value: consent,
    read() {
      return consentSource.value;
    },
    subscribe(listener) {
      consentListeners.add(listener);
      return () => consentListeners.delete(listener);
    },
    set(value) {
      consentSource.value = value;
      for (const listener of [...consentListeners]) listener();
    },
  };

  const windowListeners = new Map();
  const win = {
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      const listeners = windowListeners.get(type) ?? [];
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
  };

  return {
    sdk,
    calls,
    router,
    consent: consentSource,
    win,
    windowListeners,
    routeListeners,
    consentListeners,
    navigate(to) {
      router.pathname = to;
      for (const listener of [...routeListeners]) listener();
    },
    dispatch(type) {
      for (const listener of [...(windowListeners.get(type) ?? [])]) listener({});
    },
    mount(options = {}) {
      return replay.mountPostHogReplay({
        sdk: options.sdk ?? sdk,
        router,
        consent: consentSource,
        env: options.env ?? SYNTHETIC_ENV,
        win,
      });
    },
  };
}

function mountWithCleanup(t, harness, options) {
  const handle = harness.mount(options);
  t.after(() => handle.dispose());
  return handle;
}

test('the importer pins posthog-js in its manifest, lock and resolution', () => {
  const manifest = readJson('package.json');
  assert.equal(manifest.dependencies['posthog-js'], PINNED_SDK_VERSION);

  // Read-only lock readers: the original lock has to resolve the pinned SDK
  // from the same importer package.
  const lock = readJson('package-lock.json');
  assert.ok(lock.lockfileVersion >= 2, 'package-lock.json must be a v2/v3 lock');
  assert.equal(
    lock.packages[''].dependencies['posthog-js'],
    PINNED_SDK_VERSION,
    'the lock root has to declare the pinned SDK'
  );
  assert.equal(
    lock.packages['node_modules/posthog-js']?.version,
    PINNED_SDK_VERSION,
    'the lock has to resolve the pinned SDK'
  );

  const require = createRequire(path.join(ROOT, 'package.json'));
  const entry = require.resolve('posthog-js');
  assert.match(entry, /node_modules[\\/]posthog-js[\\/]/, 'the SDK resolves from the importer');
  const installed = JSON.parse(
    readFileSync(path.join(ROOT, 'node_modules', 'posthog-js', 'package.json'), 'utf8')
  );
  assert.equal(installed.version, PINNED_SDK_VERSION);
});

test('only the root npm lock exists', () => {
  assert.ok(existsSync(path.join(ROOT, 'package-lock.json')));
  assert.ok(!existsSync(path.join(ROOT, 'yarn.lock')), 'yarn repositories are ineligible');

  const skipped = new Set([
    'node_modules',
    '.git',
    '.next',
    '.open-next',
    '.vercel',
    '.wrangler',
    'freebuff-sites-build',
    '.freebuff',
  ]);
  const foreignLocks = [];
  const walk = (dir, depth) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (skipped.has(entry.name) || depth >= 2) continue;
        walk(path.join(dir, entry.name), depth + 1);
        continue;
      }
      if (/^(?:yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|package-lock\.json)$/.test(entry.name)) {
        if (path.join(dir, entry.name) !== path.join(ROOT, 'package-lock.json')) {
          foreignLocks.push(path.relative(ROOT, path.join(dir, entry.name)));
        }
      }
    }
  };
  walk(ROOT, 0);
  assert.deepEqual(foreignLocks, [], 'secondary or stale locks are not allowed');
});

test('a missing token or host makes the integration a no-op', (t) => {
  const cases = [
    {},
    { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'synthetic-project-token' },
    { NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com' },
    { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: '   ', NEXT_PUBLIC_POSTHOG_HOST: '  ' },
  ];

  for (const env of cases) {
    const harness = createHarness({ consent: GRANTED });
    const handle = mountWithCleanup(t, harness, { env });
    assert.equal(harness.calls.init.length, 0, 'no SDK init without token and host');
    assert.equal(harness.calls.start.length, 0);
    assert.equal(harness.windowListeners.size, 0, 'no listeners without a configured client');
    assert.equal(harness.consentListeners.size, 0);
    assert.equal(harness.routeListeners.size, 0);
    assert.equal(handle.recording, false);
  }
});

test('a new client starts opted out with recording disabled', (t) => {
  const harness = createHarness({ consent: UNKNOWN });
  mountWithCleanup(t, harness);

  assert.equal(harness.calls.init.length, 1);
  assert.equal(
    harness.calls.init[0].token,
    SYNTHETIC_ENV.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  );
  const options = harness.calls.init[0].options;
  assert.equal(options.api_host, SYNTHETIC_ENV.NEXT_PUBLIC_POSTHOG_HOST);
  assert.equal(options.opt_out_capturing_by_default, true);
  assert.equal(options.disable_session_recording, true);
  assert.equal(harness.calls.start.length, 0);
  assert.equal(harness.calls.optIn, 0);
});

test('unknown or denied consent never records', (t) => {
  const harness = createHarness({ consent: UNKNOWN });
  mountWithCleanup(t, harness);

  assert.equal(harness.calls.start.length, 0);
  assert.equal(harness.calls.optIn, 0);

  harness.consent.set(DENIED);
  assert.equal(harness.calls.start.length, 0, 'denied consent must not start recording');
  assert.equal(harness.calls.optOut, 1, 'denied consent opts out of capture');
});

test('an affirmative stored consent starts one recording without arguments', (t) => {
  const harness = createHarness({ consent: GRANTED });
  mountWithCleanup(t, harness);

  assert.equal(harness.calls.optIn, 1);
  assert.equal(harness.calls.start.length, 1);
  assert.deepEqual(harness.calls.start[0], [], 'startSessionRecording takes no arguments');

  harness.consent.set(GRANTED);
  harness.navigate('/boutique');
  assert.equal(harness.calls.start.length, 1, 'recording starts once per consent');
});

test('remounting adds no duplicate init, start or listeners', (t) => {
  const harness = createHarness({ consent: GRANTED });
  const first = harness.mount();
  const second = harness.mount();
  t.after(() => {
    first.dispose();
    second.dispose();
  });

  assert.equal(first, second, 'the mounted controller is reused');
  assert.equal(harness.calls.init.length, 1);
  assert.equal(harness.calls.start.length, 1);
  assert.equal((harness.windowListeners.get('pagehide') ?? []).length, 1);
  assert.equal((harness.windowListeners.get('beforeunload') ?? []).length, 1);
  assert.equal(harness.consentListeners.size, 1);
  assert.equal(harness.routeListeners.size, 1);
});

test('sensitive routes and page exit stop the recording', (t) => {
  const harness = createHarness({ consent: GRANTED });
  mountWithCleanup(t, harness);
  assert.equal(harness.calls.start.length, 1);

  harness.navigate('/suivi/9f8e7d6c5b4a39281706f5e4d3c2b1a0');
  assert.equal(harness.calls.stop, 1, 'order tracking pages are never recorded');

  harness.navigate('/admin/produits');
  assert.equal(harness.calls.stop, 1, 'already stopped for the admin route');

  harness.navigate('/boutique');
  assert.equal(harness.calls.start.length, 2, 'consented capture resumes on a safe route');

  harness.dispatch('pagehide');
  assert.equal(harness.calls.stop, 2, 'exit stops recording');

  harness.navigate('/catalogue');
  assert.equal(harness.calls.start.length, 2, 'an exited session does not restart');
});

test('withdrawal opts out and denied re-entry stays stopped', (t) => {
  const harness = createHarness({ consent: GRANTED });
  mountWithCleanup(t, harness);
  assert.equal(harness.calls.start.length, 1);

  harness.consent.set(DENIED);
  assert.equal(harness.calls.stop, 1);
  assert.equal(harness.calls.optOut, 1, 'withdrawal opts out of capture');

  harness.navigate('/boutique');
  harness.consent.set(DENIED);
  assert.equal(harness.calls.start.length, 1, 'denied re-entry stays stopped');
  assert.equal(harness.calls.optOut, 1, 'one opt-out is enough');

  harness.consent.set(GRANTED);
  assert.equal(harness.calls.start.length, 2, 'a fresh affirmative consent may record again');
});

test('SDK failures do not break the visitor journey', (t) => {
  const exploding = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'init') {
          return () => {
            throw new Error('sdk init failed');
          };
        }
        return () => {
          throw new Error(`sdk ${String(property)} failed`);
        };
      },
    }
  );

  const harness = createHarness({ consent: GRANTED });
  const handle = harness.mount({ sdk: exploding });
  t.after(() => handle.dispose());

  assert.equal(typeof handle.dispose, 'function');
  assert.equal(harness.consentListeners.size, 1, 'consent wiring survives an SDK failure');
  assert.equal(harness.routeListeners.size, 1, 'router wiring survives an SDK failure');

  harness.consent.set(DENIED);
  harness.navigate('/admin');
  harness.dispatch('pagehide');
  assert.doesNotThrow(() => handle.dispose());
});

test('every replay privacy channel is disabled in the init options', (t) => {
  const harness = createHarness({ consent: GRANTED });
  mountWithCleanup(t, harness);

  const options = harness.calls.init[0].options;
  assert.equal(options.autocapture, false);
  assert.equal(options.capture_pageview, false);
  assert.equal(options.capture_pageleave, false);
  assert.equal(options.capture_dead_clicks, false);
  assert.equal(options.rageclick, false);
  assert.equal(options.capture_exceptions, false);
  assert.equal(options.capture_heatmaps, false);
  assert.equal(options.enable_recording_console_log, false);
  assert.equal(options.capture_performance, false);

  const recording = options.session_recording;
  assert.equal(recording.maskAllInputs, true);
  assert.equal(recording.maskTextSelector, '*');
  assert.equal(recording.recordBody, false);
  assert.equal(recording.recordHeaders, false);
  assert.deepEqual(recording.captureCanvas, { recordCanvas: false });
  assert.equal(recording.captureJsonLd, false);
  assert.match(recording.blockSelector, /\.ph-no-capture/);
  assert.match(recording.blockSelector, /\[data-sensitive\]/);
  assert.match(recording.blockSelector, /input\[type="password"\]/);
  assert.equal(
    recording.maskCapturedNetworkRequestFn,
    replay.maskCapturedNetworkRequest,
    'the mounted URL hook is the tested one'
  );
  assert.equal(
    JSON.stringify(options).includes('"recordCanvas":true'),
    false,
    'canvas recording is never enabled'
  );
  assert.equal(
    JSON.stringify(options).includes('"recordBody":true'),
    false,
    'request bodies are never recorded'
  );
});

test('stored cookie choices map to consent without a permissive fallback', () => {
  const storage = (value) => ({ getItem: () => value });
  assert.equal(replay.readStoredConsent(storage('accepted_all')), GRANTED);
  assert.equal(replay.readStoredConsent(storage('refused_marketing')), DENIED);
  assert.equal(replay.readStoredConsent(storage(null)), UNKNOWN);
  assert.equal(replay.readStoredConsent(storage('yes')), UNKNOWN);
  assert.equal(replay.readStoredConsent(storage('')), UNKNOWN);
  assert.equal(replay.readStoredConsent(undefined), UNKNOWN);
  assert.equal(
    replay.readStoredConsent({
      getItem() {
        throw new Error('storage blocked');
      },
    }),
    UNKNOWN
  );
});

test('sensitive routes are recognised before snapshots start', () => {
  for (const safe of ['/', '/boutique', '/catalogue', '/produit/panneau-epicea', '/panier']) {
    assert.equal(replay.isSensitivePath(safe), false, safe);
  }
  for (const sensitive of [
    '/admin',
    '/admin/produits',
    '/connexion',
    '/inscription',
    '/mon-compte',
    '/commande',
    '/commande/confirmation/CMD-2026-0042',
    '/suivi/abc123',
    '/virement-bancaire',
    '/api/tracking/abc',
    '/boutique/9f8e7d6c5b4a39281706f5e4d3c2b1a0',
  ]) {
    assert.equal(replay.isSensitivePath(sensitive), true, sensitive);
  }
  assert.equal(replay.isSensitivePath(''), true);
  assert.equal(replay.isSensitivePath('boutique?email=a@b.c'), true);
});

test('the replay URL hook strips secrets and drops unsafe or sensitive URLs', () => {
  const hook = replay.maskCapturedNetworkRequest;

  const cart = hook({
    name: 'https://boutique.example/panier?email=buyer%40example.com&token=secret#paiement',
    method: 'GET',
    status: 200,
    duration: 42,
  });
  assert.equal(cart.name, 'https://boutique.example/panier');
  assert.equal(cart.method, 'GET');
  assert.equal(cart.status, 200);
  assert.equal(cart.duration, 42);
  assert.equal('url' in cart, false, 'the unredacted URL never survives');

  const relative = hook({ name: '/catalogue?page=2&q=bois#top' });
  assert.equal(relative.name, '/catalogue');

  for (const unsafe of [
    'not a url',
    '',
    '   ',
    'javascript:alert(document.cookie)',
    'data:text/html,<h1>x</h1>',
    'http://[broken',
    '//broken host/',
    '/panier\n<script>',
  ]) {
    assert.equal(hook({ name: unsafe }), null, `dropped: ${JSON.stringify(unsafe)}`);
  }

  for (const blocked of [
    '/admin/produits',
    '/commande/confirmation/CMD-2026-0042?email=buyer%40example.com',
    '/mon-compte',
    '/suivi/9f8e7d6c5b4a39281706f5e4d3c2b1a0',
    '/api/tracking/abc',
    'https://boutique.example/p/9f8e7d6c5b4a39281706f5e4d3c2b1a0',
  ]) {
    assert.equal(hook({ name: blocked }), null, `dropped: ${blocked}`);
  }

  assert.equal(hook(null), null);
  assert.equal(hook('https://boutique.example/boutique'), null);
});

test('the history router follows App Router navigations', (t) => {
  const listeners = [];
  const history = {
    pushState(_state, _title, url) {
      win.location.pathname = new URL(String(url), 'https://boutique.example').pathname;
    },
    replaceState(_state, _title, url) {
      win.location.pathname = new URL(String(url), 'https://boutique.example').pathname;
    },
  };
  const popState = [];
  const win = {
    location: { pathname: '/' },
    history,
    addEventListener(type, listener) {
      if (type === 'popstate') popState.push(listener);
    },
    removeEventListener(type, listener) {
      const index = popState.indexOf(listener);
      if (index >= 0) popState.splice(index, 1);
    },
  };

  const router = replay.createHistoryRouter(win);
  t.after(() => router.dispose());
  const seen = [];
  router.subscribe((pathname) => seen.push(pathname));

  assert.equal(router.getPathname(), '/');

  win.history.pushState({}, '', '/boutique');
  assert.equal(router.getPathname(), '/boutique');
  win.history.replaceState({}, '', '/catalogue?page=2');
  for (const listener of popState) listener({});

  assert.deepEqual(seen, ['/boutique', '/catalogue', '/catalogue']);

  router.dispose();
  assert.equal(popState.length, 0, 'listeners are cleaned up');
});

test('the real Next entry mounts the tested controller', () => {
  const entry = readText('src/instrumentation-client.ts');
  assert.match(entry, /@\/lib\/posthog-replay\.mjs/, 'the entry imports the controller module');
  assert.match(entry, /mountPostHogReplay\(/, 'the entry mounts the controller');
  assert.match(entry, /createHistoryRouter\(window\)/);
  assert.match(entry, /readStoredConsent\(window\.localStorage\)/);
  assert.match(entry, /process\.env\.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN/);
  assert.match(entry, /process\.env\.NEXT_PUBLIC_POSTHOG_HOST/);
  assert.doesNotMatch(entry, /maskAllInputs|maskTextSelector/, 'replay privacy lives in the controller');

  const banner = readText('src/components/CookieBanner.tsx');
  assert.match(banner, /CONSENT_CHANGE_EVENT/, 'the banner notifies the controller');
  assert.match(banner, /readStoredConsent|CONSENT_STORAGE_KEY/, 'the banner shares the consent key');
});

test('examples are empty and no changed source carries a live credential', () => {
  const envExample = readText('.env.example');
  assert.match(envExample, /^NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=[ \t\r]*$/m);
  assert.match(envExample, /^NEXT_PUBLIC_POSTHOG_HOST=[ \t\r]*$/m);

  const files = ['src/instrumentation-client.ts', 'src/lib/posthog-replay.mjs', 'posthog-replay.check.mjs', 'POSTHOG_REPLAY.md'];
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const relative = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(relative);
      } else if (/\.(?:ts|tsx|js|mjs|cjs|json|md)$/.test(entry.name)) {
        files.push(relative);
      }
    }
  };
  walk('src');

  for (const file of files) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) continue;
    const content = readFileSync(full, 'utf8');
    assert.equal(
      /(?:phc|phx)_[A-Za-z0-9]{8,}/.test(content),
      false,
      `${file} must not contain a PostHog project or API key`
    );
  }

  assert.equal(networkCalls, 0, 'the check never touches the network');
});
