# Decisions log

Dated log of architecture and product decisions. Newest first.

## 2026-10-07 — Ralph round 3: contrast, accessibility audit, empty state, catalogue

Review: I captured about 25 states at 1280 and 360 px (empty, filtered-empty, add panel in each mode, spinner, AI review, unreadable label, errors, duplicate warning, delete dialog, keyboard focus, catalogue) and ran an axe-core audit on nine of them. Findings, in order of impact:
1. **Control borders had 1.4:1 contrast** (inputs, selects, buttons, chips, tiles), below the 3:1 that WCAG 1.4.11 asks for the boundary of a control. Text contrast was fine (every text pair is at least 4.5:1, computed).
2. **axe, serious:** catalogue buttons were named "Ajouter « … » à l'inventaire" while showing "Ajouter à l'inventaire", so the accessible name did not contain the visible label (WCAG 2.5.3). **axe, moderate:** the tab bar was outside any landmark.
3. **Empty inventory** showed six zero tiles and useless filters, with no call to action. The 20 catalogue cards each had a solid cyan button, which flattened the one-accent hierarchy. PoE and VPN were unexplained, "IA" was never spelled out.

Changed:
- New token `--control-border` (#64748b): 3.5:1 or more on every surface a control sits on. Cards and table rules keep the quieter `--border`.
- Catalogue buttons are named "Ajouter à l'inventaire : <modèle>" and use the secondary style. The tab bar moved inside `<main>`. axe now reports no violation in any of the nine audited states (WCAG 2.0, 2.1 and 2.2 A/AA plus best-practice rules).
- Empty inventory: a title, one sentence, "Ajouter un équipement" and "Parcourir le catalogue"; the summary, filters and count are hidden until there is something to filter.
- Glosses in plain French for PoE and VPN, and "intelligence artificielle (IA)" spelled out once in the review reminder.

Verified in a real Chrome (headless, driven over the DevTools protocol; the helper scripts live outside the repo and the fictional test data never ships):
- No horizontal overflow at 360 px in any captured state.
- A 4000x3000 PNG leaves the browser as a 1600x1200 JPEG of about 134 KB with no EXIF or GPS marker; a 900x520 image is not upscaled.
- Server unreachable, wrong file type, storage failure, form validation, unreadable label and quota errors all show their French messages. Arrow keys switch tabs; Escape closes the delete dialog and deletes nothing; focus is a visible double cyan ring.

Limits: Chrome only; no real phone (camera `capture`, touch targets, mobile Safari untested); axe finds only a part of what a manual accessibility review would, so this is "no automated violations plus manual checks", not a conformance claim; the UI itself has no automated tests in the repo.

## 2026-10-07 — Ralph round 2: tiles, table cells, compact phone layout

Review (screenshots at 1280 and 360 px, fictional test data loaded through localStorage):
1. The summary was a list of chips, not a summary row.
2. Table cells wrapped serials and site names, and the actions cell lost its row borders (the cell itself was a flex container).
3. On a phone the page was about 3,900 px long: each filter took a full row and card facts collapsed to one column.

Changed:
- The summary is now a row of tiles: a total, then one tile per status (en service, en stock, en panne, en réparation, retiré). The status tiles are buttons that toggle the status filter. The per-site chips sit under it.
- Serial numbers and sites no longer wrap; the table actions sit in an inner wrapper so row borders stay intact.
- Phone layout: card facts stay on two columns, filters use two columns, cards are tighter. Page height with 7 assets went from about 3,920 px to 2,915 px.

## 2026-10-07 — Ralph round 1: desktop table, filter bar, À compléter, header date

Review (screenshots at 1280 and 360 px, fictional test data): 7 assets took 1,700 px of tall cards on desktop; there was no equipment-type filter, no "À compléter" badge and no date in the header; on a phone the three card actions wrapped onto two rows.

Changed:
- Desktop (from 900 px): a compact table (inventory number, equipment with icon and type, serial number, site, assignee, status, actions). Below 900 px, cards. One list is rendered at a time (`useMediaQuery`), not both hidden by CSS.
- Filter bar: search by inventory number, serial number, assignee or model, plus Site, Statut and Type selects. They share state with the summary tiles and site chips.
- "À compléter" badge on assets that lack their serial number, or have neither a brand nor a model. This is a rule I chose, not a saved-field requirement: type, site, inventory number and status are always present on a saved asset, so those could never trigger it. `missingAssetFields` in `domain/asset.ts`, tested.
- Header shows today's date next to the app name.
- Phone cards: the three actions share one row.
- A loading state ("Chargement de l'inventaire…") while the inventory is read.

## 2026-10-07 — Frontend AI flows

### What
- The inventory has three ways to add an asset, chosen in an "Ajouter un équipement" panel: **Catalogue** (existing), **Décrire** (free text, up to 2,000 characters, sent to `describeAssetFromText`) and **Photo d'étiquette** (file upload, or camera through `capture="environment"`, with a preview, sent to `describeAssetFromImage`).
- Both AI flows end in the same review form, where every field is editable before saving. The form shows the AI's confidence as a percentage and the reminder that suggestions must be checked.
- Fields the AI returned as `null` stay empty, get an "À compléter" badge and a dashed cyan outline, and are never prefilled. The issue summary goes to the notes. The type and the status have no default for AI results, and saving requires both.
- Photos are decoded with EXIF rotation applied, drawn on a canvas at most 1600 px on the long side and re-encoded as JPEG (quality 0.85, lowered if still over 4 MB). Re-encoding through a canvas drops all metadata, including GPS. Files over 15 MB or not JPEG/PNG are refused before any work.
- One request at a time: the buttons are disabled while a call runs (guarded by a ref as well as state, so a fast double click cannot send two), and a spinner announces the wait. Errors are mapped to friendly French messages: server unreachable (with the emulator command in dev), rejected input, unavailable or slow service, quota, access, not configured, unusable answer, and unreadable label (nothing identifying could be read, offering to continue by hand).
- The client uses the Firebase JS SDK, loaded on first use so it stays out of the initial bundle. In dev it uses project `demo-it-parc` and `connectFunctionsEmulator` on `127.0.0.1:5001`, region `europe-west1`. It holds only a public project ID: no API key, no secret. A production build reads `VITE_FIREBASE_PROJECT_ID`; without it the AI flows report "not configured".

### Why
- **The asset model had to grow.** Assets only held a catalogue `modelId`. An AI result has free-text brand and model, and types such as "other". Matching it to the nearest catalogue model would be a guess. Assets now carry `equipmentType` (the six catalogue types plus `other`), `brand` and `modelLabel`; `modelId` is optional. Picking a catalogue model in the form copies those three fields from the catalogue, and they stay editable. The warranty end only shows for assets created from a catalogue model.
- **Storage moved to version 2**, and version 1 is still read and migrated (type, brand and model label filled from the catalogue model, `other` when the model no longer exists). Without this the stricter checks would have silently dropped assets saved before this change.
- **Duplicate tag or serial number is a warning, not a block**, as requested. It names the existing asset and offers "Enregistrer quand même". This supersedes the Initial build rule that asset tags must be unique; blank values never match and an asset being edited ignores itself.
- **The project ID is `demo-it-parc`**, as in `.firebaserc`. The request said `demo-itparc`, but the project ID is part of every callable URL in the emulator, so the client has to match the emulator.

### Trade-offs
- AI-created assets have no catalogue link, so they have no warranty end date.
- Switching the add method discards an unsaved review.
- The photo flow is slow: 17 to 46 s per call in testing (see the open issue in "AI backend"). The spinner says it can take up to a minute.
- Only the pure parts are unit-tested (AI mapping, error mapping, size computation, duplicates, validation, storage migration). The DOM parts (canvas resize, file inputs, the forms) have no automated test.
- Free text typed into "Décrire" is sent to Google. The form says not to type personal data, which is not enforced.

### Verified
- `npm run build`, `npm test` (70 tests) and `npm run lint` pass; no key or secret in `src/` or `dist/`.
- Against the emulator, with the real Firebase JS SDK run from Node:
  - the fictional note returns a parsed description (laptop, tag `TEST-0001`, serial `null`, `en_panne`);
  - a rejected input gives `functions/invalid-argument` with the French message followed by ` [400]`, which the client strips;
  - an unreachable server gives `functions/internal` with `internal [0]`, which the client maps to "server not reachable".
- A JPEG request in the exact shape the client sends returns the fictional label's brand, model, serial and tag, with the type left `null` (so the form would flag it "À compléter").
- A browser preflight from `http://localhost:5173` now gets `204` with `access-control-allow-origin`, and real responses carry the header.
- **Not verified: the browser UI itself.** No browser automation was available in this session, so nothing was clicked through (spinner, preview, canvas resize, the forms, refresh persistence, 360 px).

### CORS fix (backend change outside `src/`)
- Both functions were declared with `cors: false`. With firebase-functions 7 an explicit `cors` option beats the emulator's own CORS switch, so even the emulator answered a browser preflight with `400 Bad Request` and no CORS headers. A page served by Vite would have failed every call with a network error.
- Fixed in `functions/src/access.ts` (`CALLABLE_CORS`, used by both functions): CORS is open only when `FUNCTIONS_EMULATOR` is `true`. Deployed, it stays closed. Choosing the allowed origins is still required before any deploy.

### Gemini availability is intermittent
- During testing the same text call took 3 s, then hit the function's 60 s limit once and returned an upstream 503 after 53 s on the next try, then took 3 s again. The backend's 30 s upstream timeout did not stop these waits, so it is probably not applied as intended. Not investigated.
- On the frontend a function timeout surfaces as `internal [500]` and is shown as "service momentanément indisponible ou trop lent". An early version wrongly showed "server not reachable" for it; only `internal [0]` means that.

## 2026-10-07 — AI backend

### What
- `functions/` holds two 2nd gen callable Cloud Functions (TypeScript, Node 22, region `europe-west1`, max 5 instances, 60 s timeout, 512 MiB):
  - `describeAssetFromText`: free text from a technician or staff member, 1 to 2,000 characters.
  - `describeAssetFromImage`: base64 photo of a label or nameplate, JPEG or PNG only, at most 4 MB.
- Both return the same JSON: `equipmentType`, `brand`, `model`, `serialNumber`, `assetTag`, `suggestedStatus`, `issueSummary` (French, one sentence, empty if no issue), `confidence` (0 to 1). Every field except `issueSummary` and `confidence` is `null` when it cannot be read with certainty. `equipmentType` can be `null` as well as `other`.
- Gemini is called with `@google/genai` through the **Interactions API**, model `gemini-3.8-flash` (one constant in `functions/src/gemini.ts`), JSON-schema response format, thinking level `low`, `store: false`. Chosen because the Gemini docs (checked 2026-10-07) describe the Interactions API as generally available and recommended for new projects, and `generateContent` as legacy. The temperature is left at the API default and has not been tuned.
- Inputs and the model's JSON are validated with zod. French error messages for every failure (invalid input, missing key, rejected key, quota, unavailable, unreadable model answer).
- Guards against invented identifiers:
  - the system prompt requires serials and asset tags to be copied exactly, or `null`;
  - the server turns blanks and placeholders such as "N/A" or "inconnu" into `null`;
  - for text input, a serial or tag that does not appear in the text is dropped.
- Emulator only. `.firebaserc` uses the demo project `demo-it-parc`, so nothing can be deployed by accident. `firebase-tools` is a devDependency of `functions/`. The key is read with `defineSecret("GEMINI_API_KEY")`; locally it comes from `functions/.secret.local` (git-ignored).
- The frontend is untouched.

### Privacy
- The text or photo is sent to Google's Gemini API. Google's terms (ai.google.dev/gemini-api/terms, checked 2026-10-07) differ by tier:
  - **Unpaid services**: Google may use submitted content and responses to improve its products, and "human reviewers may read, annotate, and process your API input and output". The terms say: "Do not submit sensitive, confidential, or personal information to the Unpaid Services."
  - **Paid services**: Google says it does not use prompts or responses to improve its products, and logs them for a limited time to detect violations of its Prohibited Use Policy.
  - **Rule**: use a key from a billing-enabled project before any real inventory data is sent. A free-tier key is for fictional data only (like the sample label).
- `store: false`, so the interaction is not kept in the API's interaction history (the docs say 1 day on the free tier and 55 days on the paid tier otherwise).
- Logs hold only the function name, input type, outcome, error code, upstream HTTP status and duration. They never hold the text, the image, the base64, the model's answer, or raw SDK error messages, which can echo the request. Checked in the emulator log.
- Photos are held in memory for the call. Nothing is written to Storage or Firestore.
- The prompt tells the model to leave personal data out of its answer. This is not enforced, and free text typed by staff can still contain personal data. The UI that comes later should warn users.
- Region: the function runs in `europe-west1`, but I have not verified that the Gemini API call is pinned to the EU. If data residency matters, Vertex AI is the option to evaluate.

### Security
- The key lives in Secret Manager when deployed and in `functions/.secret.local` locally. It is denied to Claude in `.claude/settings.json`, never reaches the client, and never appears in logs or error messages.
- Outside the emulator, callers must be signed in (`unauthenticated` otherwise), so an accidental deploy cannot expose a public endpoint that spends the key.
- Not done yet, and required before any deploy:
  - App Check;
  - per-user rate limiting;
  - CORS (`cors: false` for now, set the allowed origins when the frontend starts calling).
- Cost and abuse caps: 2,000 characters, 4 MB, `maxInstances: 5`, a 30 s upstream timeout and one retry.
- Prompt injection: user content is wrapped as data and the prompt says to ignore instructions in it. The answer is constrained by a JSON schema and validated again with zod. The worst case is a wrong field value, because the model has no tools and triggers no action.
- Image checks look at the real bytes (JPEG or PNG signature must match the declared type), and the size is checked from the string length before anything is decoded.

### Trade-offs
- A model can misread characters on a photo. The verbatim check only works for text input, so for images the only protection is the prompt, the null rule and `confidence`. The UI must show every extracted value for human confirmation before saving.
- A 4 MB image becomes about 5.4 MB of base64 in the callable request. There is no client-side resize yet.
- The Gemini SDK is loaded on first call, and `firebase-functions` is imported by submodule. The Functions emulator gives up on loading code after 10 s. On this machine loading the `firebase-functions/v2` root alone took about 4 s, which made discovery fail until the imports were narrowed (full module load went from about 6 s to 2 s).
- `functions/package.json` declares `"node": "22"` because the Firebase CLI rejects `>=22`. The development machine runs Node 26, so the emulator runs on 26 with a warning and behaviour on Node 22 is untested.
- `npm audit` reports vulnerabilities in the `firebase-tools` dependency tree. It is a dev-only dependency and is not deployed. Not fixed, because the suggested fix is a downgrade.
- Unit tests cover input validation, output normalisation, the schema consistency and error mapping. No automated test calls Gemini (network and key needed); it was checked by hand in the emulator.
- The root `vite.config.ts` and `eslint.config.js` now exclude `functions/`, so the root test and lint runs do not pick up the backend.

### Alternatives considered
- `generateContent`: still supported but legacy.
- Vertex AI: better data-residency and enterprise terms, but needs a Google Cloud project, billing and IAM set up. Revisit if residency requires it.
- Uploading the photo to Storage and passing a URI: adds retention and access rules for no benefit at 4 MB.
- Function calling instead of a JSON schema: more moving parts for a single extraction step.
- Calling Gemini from the browser: rejected, it would expose the key.

### Verified (emulator, 2026-10-07, free-tier key, fictional data only)
- `describeAssetFromText` with a made-up note (laptop "Exemple Tech DEMO-14", tag `TEST-0001`, black screen): returned `laptop`, brand and model, `assetTag` `TEST-0001`, `serialNumber` `null` (none in the note), `en_panne`, a French one-sentence summary, confidence 0.95. About 3.5 s.
- `describeAssetFromImage` with the fictional label in `functions/samples/`: read back brand, model, serial and tag exactly, `suggestedStatus` `null`, empty `issueSummary`, confidence 0.95. Repeated twice with the same result.
- The emulator log contained none of the input text or the label values.

### Open issue: image latency
- The image call took 38 to 46 s on a small 900 x 520 PNG, against 3.5 s for text. A first attempt returned an upstream 503 after about 36 s, which the function reported as "service momentanément indisponible".
- The upstream timeout (30 s, one retry) and the function timeout (60 s) leave little margin for that latency. Not tuned yet.
- Things to try: `thinking_level: "minimal"`, downscaling photos before sending, higher timeouts, a different Flash model. Cause not investigated (model load, tier, network or thinking level).

## 2026-10-07 — Initial build

### What
Phase 1 of IT Parc: a local-only single-page app with two views.

- **Catalogue**: 20 built-in example equipment models (laptop, desktop, printer, receipt printer, smartphone, network device) with search and a type filter. Each shows brand, generic model label, typical use, recommended warranty and an icon.
- **Inventaire**: assets created from a catalogue model for a named site. Each asset has asset tag, serial number, status (en service / en stock / en panne / en réparation / retiré), assigned-to (free text), purchase date and notes. Counters per site and per status double as filters. Edit, duplicate and delete (with confirmation) are available.
- **Persistence** goes through `src/lib/repository.ts`, an async `AssetRepository` interface with a localStorage implementation. UI code never touches `localStorage` directly.
- Vite 7 + React 19 + TypeScript strict, no router, no UI library, one global stylesheet (dark theme, cyan accent). Vitest covers the domain logic and the repository.

### Why
- **Repository seam**: Firestore is planned. Keeping the interface async and the storage injected means the swap touches one file.
- **No router**: two views and no deep-linking need. A tab state is enough, and it avoids a dependency.
- **Generic catalogue**: the repo will later hold real asset data (serials, staff). Catalogue entries use real manufacturer names but descriptive model labels, and are labelled "Exemple" in the UI, so they cannot be mistaken for real inventory.
- **Duplicate clears asset tag, serial number and assigned-to**: those identify one physical unit, so copying them would create false duplicates. Nothing is saved until the form is submitted.
- **Asset tag must be unique** (case-insensitive, global across sites). Purchase date cannot be in the future.
- **Counters are filters**: one control instead of separate counters plus site/status dropdowns, which also saves space at 360px.
- **Cards instead of a table** for the inventory, so the layout works at 360px without horizontal scrolling.
- **Native `<dialog>`** for delete confirmation: focus trap, Escape and focus return come from the browser. Focus starts on the safe action (Annuler).
- **Status colour is never the only signal**: each status shows a text label, and the colour is applied to a dot only. The accent is cyan only.
- **Warranty end** is computed from purchase date plus the model's recommended months and flagged when past. It is derived, not stored.
- **Asset state lives in `App`** (via `useAssets`) so the inventory is loaded once and not re-read on every tab switch.

### Trade-offs
- localStorage is per browser and per device: no sync, no backup, no multi-user access, and clearing site data erases the inventory. Acceptable for Phase 1 only.
- A corrupt stored value is read as an empty inventory and will be overwritten by the next save. A "quarantine" copy of unreadable data was not added.
- The repository is async over a synchronous store, which adds a little ceremony today in exchange for a no-change swap later.
- Tests cover pure logic and the repository only. There are no React Testing Library component tests yet, so form and dialog behaviour is verified manually.
- Dark theme only, no light mode.
- Filters reset when leaving the Inventaire tab, because the panel unmounts.
- Catalogue text (model labels, typical use) is French content inside `domain/catalogue-data.ts` rather than `copy/fr.ts`, since it is data displayed as-is. All UI chrome stays in `copy/fr.ts`.
- Development machine runs Node 26 while the project targets Node 22 LTS. `package.json` declares `engines.node >=22`.
- `@vitejs/plugin-react` is pinned to v5 because v6 requires Vite 8, and the project targets Vite 7.

### Alternatives considered
- **Dexie / IndexedDB**: more capacity, but more code and a heavier swap story than needed for a few hundred assets.
- **React Router or hash routing**: not needed for two views.
- **Table layout for the inventory**: denser on desktop but poor at 360px.
- **Separate site/status dropdowns alongside counters**: redundant with clickable counters.
- **Clearing only the asset tag on duplicate**: rejected, a copied serial number is the more dangerous duplicate.

### Follow-ups
- Phase 2: Firestore implementation of `AssetRepository`, Microsoft 365 (Entra ID / Graph) via Cloud Functions only, never from the client.
- `.env.example` still lists `GEMINI_API_KEY` from the earlier PromptLens scope. It was not edited in this build.
