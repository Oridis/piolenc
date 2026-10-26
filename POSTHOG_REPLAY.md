# PostHog session replay — allo-maison-bois

One masked, consent-controlled browser journey recorded with `posthog-js`, mounted
from the Next.js App Router client entry. No deployment, no remote project
settings and no credentials are part of this change.

## 1. Repository facts recorded before the change

| Item | Value |
| --- | --- |
| Package manager | `npm` (npm 11.13.0), lock `package-lock.json` (`lockfileVersion` 3) |
| Yarn | no `yarn.lock` and no `packageManager` field pointing at yarn — repository is eligible |
| SDK-importing package | the root package `allo-maison-bois` (single package, no workspaces) |
| Framework | Next.js `16.4.1`, App Router (`src/app`), React 18, TypeScript 5.6 |
| Consent source | `src/components/CookieBanner.tsx` → `localStorage['woodmachine_cookie_consent']` (`accepted_all` / `refused_marketing`) |
| Baseline typecheck | no `typecheck` script; `npx tsc --noEmit` → exit 0 |
| Baseline lint | `npm run lint` (`next lint`) → **fails**, pre-existing: Next 16 removed the `next lint` command and the repository has no ESLint config. Left as-is, unrelated to this change. |

Pinned install (one plain command, run from the root importer):

```bash
npm install posthog-js@1.438.13
```

`package.json` now declares `"posthog-js": "1.438.13"` and `package-lock.json`
resolves `node_modules/posthog-js` to `1.438.13`. No other dependency changed.

## 2. Where the integration lives

| File | Role |
| --- | --- |
| `src/instrumentation-client.ts` | Next.js ≥ 15.3 client instrumentation. Browser-only, runs once per page load, before hydration. Imports `posthog-js`, builds the router adapter and mounts the controller. |
| `src/lib/posthog-replay.mjs` | The controller: config, consent gating, route gating, URL redaction, listener cleanup. Dependency-free, so the same file runs in Node for the offline check. |
| `src/components/CookieBanner.tsx` | Existing consent banner. Now shared constants + a `woodmachine:consent-change` window event so a choice starts/stops replay without a reload. |
| `posthog-replay.check.mjs` | Offline check (`npm run test:replay`). |

The SDK singleton is the `posthog-js` default export; the controller never creates
a second client and `init` runs exactly once (a second mount returns the existing
handle).

## 3. Privacy boundaries applied before any snapshot

Replay is a new client, so it starts fully closed:

- `opt_out_capturing_by_default: true`, `disable_session_recording: true`
- `autocapture`, `capture_pageview`, `capture_pageleave`, `capture_dead_clicks`,
  `rageclick`, `capture_exceptions`, `capture_heatmaps` all `false`
- `enable_recording_console_log: false`, `capture_performance: false`,
  `person_profiles: 'identified_only'`
- `session_recording.maskAllInputs: true`, `maskTextSelector: '*'`
- `session_recording.recordBody: false`, `recordHeaders: false` — local values, so
  a remote project toggle cannot turn bodies/headers back on
- `session_recording.captureCanvas: { recordCanvas: false }` and
  `captureJsonLd: false` — DOM masking does not cover canvas or JSON-LD, so both
  channels are switched off explicitly
- `session_recording.blockSelector` keeps `.ph-no-capture` and adds
  `[data-ph-no-capture]`, `[data-sensitive]`, password/email/tel inputs and
  `autocomplete="cc-number"` — text masking alone hides neither attributes nor
  images, so sensitive subtrees are blocked entirely

URL handling: `session_recording.maskCapturedNetworkRequestFn` also receives the
replay page URL, so the real hook (`maskCapturedNetworkRequest`) strips the query
string **and** the fragment from every URL it accepts, and returns `null` (entry
dropped) for unparseable URLs, non-http(s) schemes, whitespace/control characters,
opaque path identifiers and sensitive routes. `before_send` is not used as a
substitute for this redaction.

Sensitive routes never start a snapshot and stop one in progress:

```
/admin  /api  /commande  /connexion  /inscription  /mon-compte  /suivi  /virement-bancaire
```

`/suivi/<token>` and any long hex/opaque path segment are treated as sensitive too.

Consent: only `localStorage['woodmachine_cookie_consent'] === 'accepted_all'`
counts as affirmative. Unknown or `refused_marketing` never records. On consent
the controller calls `opt_in_capturing()` and then `startSessionRecording()` with
**no arguments**. Withdrawal and denial call `stopSessionRecording()` and
`opt_out_capturing()`; `pagehide`/`beforeunload` stop the recording and do not
restart it.

## 4. Private project configuration

Both variables are public browser values, added empty to `.env.example` (and to
your local `.env.local`; never commit real values):

```dotenv
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=
```

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` — the PostHog **project** token from
  *Project settings → Project API key*. It is a public ingestion key, never a
  personal API key or a secret.
- `NEXT_PUBLIC_POSTHOG_HOST` — your region, chosen by you: `https://us.i.posthog.com`
  or `https://eu.i.posthog.com`. There is no fallback: if either value is empty
  the integration is a no-op and the SDK is never initialized.

## 5. Verify locally, then inspect playback privately

1. Put your token and chosen host in `.env.local`, then restart `npm run dev`.
2. In PostHog, check replay enablement, sampling, triggers, minimum duration and
   the authorized domain for your site.
3. In the browser, accept cookies in the banner, then walk one safe journey, e.g.
   `/` → `/boutique` → `/catalogue` → `/produit/<slug>` → `/panier`.
4. Open the recording in PostHog and confirm: page context is useful, all text and
   inputs are masked, canvas/JSON-LD/console/network bodies are absent, no email or
   order identifier appears in URLs, and no event comes from the sensitive routes
   listed in section 3.
5. Click *Refuser* (or clear the stored consent) and confirm new activity stops.

## 6. Checks

```bash
npm run test:replay   # 17 offline assertions against the real controller + mocked SDK
npx tsc --noEmit      # typecheck (no typecheck script exists in this repo)
```

`posthog-replay.check.mjs` runs with a scrubbed environment (OS/path/temp values
plus a synthetic, non-`phc_` token), denies network access, imports the real
controller, and asserts: pinned manifest/lock/resolution, single root lock,
no init without token + host, unknown/denied never record, one start on affirmative
consent, idempotent remounts, stops on sensitive routes and exit, opt-out on
withdrawal and denied re-entry, SDK failures that do not break the journey, every
privacy channel disabled, URL redaction on secrets/malformed/blocked paths, and
that `src/instrumentation-client.ts` really mounts this controller.
