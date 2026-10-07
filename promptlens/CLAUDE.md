# IT Parc

## What this is
Web app for cataloguing and tracking IT equipment across sites.
1. **Catalogue**: 20 built-in generic example models (laptop, desktop, printer,
   receipt printer, smartphone, network device).
2. **Inventaire**: physical assets created from a catalogue model, each tied to a
   named site, with asset tag, serial number, status, assignee, purchase date, notes.

Phase 1 (done): local-only, persisted in localStorage.
Phase 2: Firestore, and possibly Microsoft 365 (Entra ID / Graph API) through
Firebase Cloud Functions.

## Stack & versions
Source of truth for exact versions: `package.json` (and `functions/package.json` once it exists).
- Node 22 LTS or newer, npm
- Vite 7 + React 19 + TypeScript 5 (`strict: true`)
- Vitest (domain and repository tests; no component tests yet)
- Firebase: Cloud Functions (2nd gen, Node 22, `functions/`); Hosting and Firestore: not set up yet
- Gemini: `@google/genai` (Interactions API), model `gemini-3.8-flash`, called only from `functions/`; zod validates input and output
- `@vitejs/plugin-react` stays on v5 while the project is on Vite 7

## Commands
Keep this list in sync with `package.json`.
- `npm run dev`: Vite dev server
- `npm run build`: type-check (`tsc -b`) + production build
- `npm test`: Vitest, single run
- `npm run lint`: ESLint
- `npm --prefix functions run build`: compile the Cloud Functions (`tsc`)
- `npm --prefix functions test`: Vitest for the functions (no network, no key needed)
- `npm --prefix functions run serve`: build + Functions **emulator** on `127.0.0.1:5001`
  (project `demo-it-parc`; needs `functions/.secret.local` containing `GEMINI_API_KEY=...`)
- `node functions/scripts/call-samples.mjs [validation|samples]`: call both functions in the running emulator with fictional data
- `firebase deploy ...`: ask first (see Never)

## Folder structure
```
src/
  app/             # entry (main.tsx), App.tsx, styles.css
  features/
    catalogue/     # catalogue panel, filters, cards
    inventory/     # inventory panel, form, counters, cards, useAssets
  components/      # shared UI (TypeIcon, StatusBadge, ConfirmDialog)
  domain/          # types and pure logic (asset, equipment, catalogue data, stats)
  lib/             # repository.ts (persistence seam); Firebase client init later
  copy/fr.ts       # all French UI strings
functions/
  src/             # callables: describeAssetFromText, describeAssetFromImage (Gemini calls live here only)
  scripts/         # sample-label generator and emulator call script
  samples/         # fictional label image used for emulator checks
docs/
  decisions.md     # dated log of architecture/product decisions
firebase.json, .firebaserc   # emulator config, demo project demo-it-parc
```

## Conventions
- TypeScript strict everywhere. No `any` (use `unknown` and narrow). No non-null `!` without a comment.
- Naming: components `PascalCase.tsx`; hooks `useThing.ts`; other files `kebab-case.ts`;
  types/interfaces `PascalCase`; constants `SCREAMING_SNAKE_CASE`.
- One component per file. Colocate tests as `*.test.ts(x)` next to the code.
- Code, identifiers, comments, commit messages: **English**.
- All user-facing text: **French**, defined in `src/copy/fr.ts`, never hard-coded in JSX.
  Exception: catalogue model labels and typical-use text live in `domain/catalogue-data.ts`.
- Domain types live in `src/domain/` and are shared; don't redefine them per feature.
- Prefer small pure functions in `domain/`; keep persistence and Firebase calls in `lib/` or `functions/`.
- **Persistence goes only through `AssetRepository` (`src/lib/repository.ts`).** Never read or
  write `localStorage` from components or hooks. A Firestore implementation must satisfy the same interface.
- UI: dark theme, one cyan accent. Status colours carry meaning only and are always paired
  with a text label. Monospace for asset tags and serial numbers. Visible keyboard focus;
  usable at 360px.

## Domain terms
- **Catalogue model**: one of the 20 built-in generic examples (type, brand, model label,
  typical use, recommended warranty, icon). Not a real unit.
- **Asset**: one physical unit logged in the inventory, created from a catalogue model.
- **Asset tag** (UI: « N° d’inventaire »): internal identifier, unique across the inventory.
- **Serial number**: manufacturer serial of the unit.
- **Site**: free-text name of the location the asset belongs to.
- **Status**: en service, en stock, en panne, en réparation, retiré.
- **Assigned to**: free text (person or room).
- **Warranty end**: derived from purchase date plus the model's recommended months.

## Data privacy
The repo will later hold real asset data (serial numbers, staff assignments).
- No real staff names, serial numbers or site names in code, tests, seed data or docs.
  Fixtures use obviously fake values such as `TEST-0001` or `Site test`.
- Real inventory exports (CSV/XLSX) live only in `data/private/`, which is git-ignored
  and denied to Claude in `.claude/settings.json`.

## Workflow
1. **Plan**: restate the goal, list files to touch, flag open questions before coding.
2. **Implement**: smallest change that meets the goal; stay within the planned files.
3. **Test**: add/update tests; `npm test`, `npm run build` and `npm run lint` must pass.
4. **Document**: append significant decisions to `docs/decisions.md`
   (date, decision, why, alternatives considered).

## Never
- Commit `.env*` (except `.env.example`) or `functions/.secret.local` (both stay git-ignored).
- Call Microsoft Graph, or ship a Graph client secret, from the client. Graph goes through Cloud Functions only.
- Call Gemini, or ship its API key, from the client. Gemini goes through Cloud Functions only.
- Log user text, images, base64 or model output in Cloud Functions (only sizes, types, codes, durations).
- Send real inventory data to Gemini with a free-tier key: free-tier content may be used by Google and read by reviewers (see `docs/decisions.md`, "AI backend").
- Read or edit `functions/.secret.local`: the user fills it in.
- Touch Firebase rules (`firestore.rules`, `storage.rules`) without asking first.
- Deploy to Firebase without explicit confirmation.
- Put real staff, serial or site data anywhere outside `data/private/`.
