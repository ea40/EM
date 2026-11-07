# EMER-BRACE — Clinical Dispatch Console

Web console for the EMER-BRACE maternal telemetry wearable. It receives GSM
telemetry from patient bracelets, triages each payload into a triage code,
tracks the ambulance fleet, and gives a dispatcher the controls to send a unit,
call a caregiver, or close an incident.

Single-page React app. There is no server, no router and no persistence — all
state lives in `App.tsx` for the life of the tab, seeded from `src/data/mockData.ts`.

## Running it

```bash
npm install       # required first — node_modules may predate the current package.json
npm run dev       # Vite dev server
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc --noEmit` then `vite build` — **the typecheck gates the build** |
| `npm run typecheck` | `tsc --noEmit` alone |
| `npm run lint` | ESLint (flat config) |
| `npm run format` | Prettier over `src/**/*.{ts,tsx,css}` |
| `npm test` | Vitest, single run |
| `npm run test:coverage` | Vitest with V8 coverage |

## Where things live

```
src/
├── App.tsx              all app state; route switching; the three modals
├── pages/               one component per sidebar route
├── components/          shared surfaces (queue, map, ECG, modals, shell)
├── components/ui/       Modal.tsx — the single dialog shell every modal uses
├── config/thresholds.ts operator-tunable clinical limits + defaults
├── data/mockData.ts     seed patients, fleet, hospitals
├── types/index.ts       the domain model (TriageCode, VitalMetrics, …)
└── utils/               pure logic, each with a sibling __tests__ file
```

Routes are a string-literal union (`PageRoute` in `types/index.ts`) rendered by
`currentRoute === 'X' && <XPage />` in `App.tsx`. Adding a page means adding a
member to that union, an entry in `Header.tsx`'s `PAGE_TITLES`, an entry in
`Sidebar.tsx`'s nav array, and a `page` directory file.

## The two rules that matter most

**1. Clinical colour comes from the configured thresholds, never from literals.**
`src/utils/vitals.ts` is the only place that decides whether a heart rate, SpO₂,
temperature or impact reading is critical / warning / normal. It mirrors the
decoder's triage tree in `utils/gsmDecoder.ts` — including its asymmetries
(bradycardia is elevated, never critical; fever has no critical band). Components
map the returned `VitalSeverity` to a tone and stop there.

This exists because the components used to hardcode cutoffs (`< 85` for SpO₂,
`> 140` for heart rate) while the decoder used the operator's settings. Under the
*default* settings that made the console contradict itself: SpO₂ 82 raised an
AMBER alert and was then painted critical red on the same card. If you need a new
vital on screen, add a function to `vitals.ts` with tests — do not write the
comparison in JSX.

**2. Live numbers are computed from the live array.**
`hospital.availableAmbulances` and `hospital.totalDispatchesToday` in
`mockData.ts` are frozen seeds that never move. Anything an operator reads as
"now" must be derived from the `fleet` array the dispatch logic actually mutates
— `selectDispatchableAmbulances`, `deployedAmbulanceCount` and friends in
`utils/dispatch.ts`. The map popups and the hub cards were once advertising
vehicles that were already en route for exactly this reason.

## Telemetry ingest

`utils/gsmDecoder.ts` parses the `#`-delimited payload the bracelet sends over
the GSM gateway:

```
EB-104#FALL_DETECTED#9.03,38.74#HR:138#SPO2:91#TMP:37.4#BAT:89%#ACC:3.2,1.8,0.15
```

Inject one from the **Simulator** page. The decoder's field matching is
order-sensitive for the coordinate pair — see the `isBareCoordinatePair` guard
and its tests before reordering any branch, or fall alerts will plot in the
Atlantic.

## Safety and security notes

- **XSS surface is Leaflet.** `L.divIcon({ html })` and `marker.bindPopup()` take
  raw HTML strings. Every interpolated value goes through `escapeHtml.ts` — keep
  it that way, and escape anything new you interpolate there.
- **CSP is a real response header**, not a `<meta>` tag: `public/_headers`. A
  meta policy cannot express `frame-ancestors`.
- **No secrets in the client bundle.** Anything in `src/` ships to the browser.
  There is no env-var plumbing yet; add one deliberately (Vite exposes only
  `VITE_*`), and never a credential.

## Known gaps

- `src/components/HardwareSimulator.tsx` is dead — nothing imports it, and
  nothing should. It is a leftover prototype.
- `standalone.html` is a separate hand-written Tailwind-CDN prototype kept at the
  repo root. It uses the older `emer` palette and has already drifted from the
  app's `navy`/`triage` tokens. Either delete it or treat it as a deliberately
  frozen single-file demo — do not let it be read as an implementation reference.
- `tsconfig.json` leaves `noUnusedLocals` and `noUnusedParameters` off. Turning
  them on is worthwhile, but do it in a change where you can run the typecheck.
- No end-to-end test suite. `utils/` and `config/` have unit tests; the pages do
  not.

## Styling

Tailwind with the design tokens in `tailwind.config.js` (`navy-*` surfaces,
`triage.*` and `emer.*` colour ramps, `shadow-elev-*`, `ease-out-expo`, the named
animations) plus the semantic classes in `index.css` (`.panel`, `.panel-inset`,
`.eyebrow`, `.data-num`, `.no-scrollbar`).

Prefer those over raw Tailwind values. The custom properties in `index.css`
(`--surface-*`, `--line-*`, `--text-*`) exist so surfaces stay consistent; a
one-off `bg-slate-900` is how the crash screen ended up as the only screen that
did not look like the product. Fonts are Inter (UI) and JetBrains Mono (all
figures, with tabular numerals and slashed zero).
