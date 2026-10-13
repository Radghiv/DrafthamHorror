# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

The maintainer may converse in Italian or English, but all code, comments, commit messages, and documentation must be written in English.

## What this is

"DraftHam Horror" — a client-side drafting tool for *Arkham Horror: The Card Game* (a fork of Skeezix55/ArkhamDraft). Users pick a collection, an investigator and draft rules, then the app randomly drafts a deck (build) and/or upgrades (spend XP) using card data fetched live from the ArkhamDB public API. Plain JavaScript (no TypeScript), Vite 5, React 18, Redux Toolkit. No backend.

## Commands

The app is built with Vite (`vite.config.js`); the app root is `src/` (its `index.html` is the entry, static files come from `public/`).

- `npm start` — dev server on http://localhost:3000
- `npm run build` — production build into `build/` (gitignored; the build empties that folder first). To check that it compiles without touching `build/`, pass another folder: `npm run build -- --outDir <dir> --emptyOutDir`.
- `npm run preview` — serves the production build
- `npm test` — Vitest (jsdom); the only tests are the interface-text checks in `src/i18n/locales.test.js`
- `npm run lint` — ESLint with the `react-app` config (unused variables and imports, hooks rules); run it before finishing a change, there is no lint step in the dev server or the build
- `npm run deploy` — `predeploy` builds, then `gh-pages -d build` publishes it to the `gh-pages` branch, which GitHub Pages serves at https://radghiv.github.io/DrafthamHorror/

The sources use JSX in `.js` files, so `vite.config.js` tells esbuild and the React plugin to read `.js` as JSX.

## Hosting

The site is served by GitHub Pages from the `gh-pages` branch (Settings → Pages → *Deploy from a branch*); `main` holds only the sources. The build uses relative paths (`base: './'`), so it works under `/DrafthamHorror/` and on a custom domain. `package.json` `homepage` is informational.

## Architecture

**Data flow:** `src/index.js` applies the stored theme (`theme.js`) and dispatches the thunks `fetchCards`, `fetchTaboo` and `fetchPacks` (in `features/data/dataSlice.js`) on startup, which pull the full card DB, the taboo list and the pack list from `arkhamdb.com/api/public/*` into the `data` slice. Everything else is derived from that raw ArkhamDB card JSON (fields like `deck_options`, `deck_requirements`, `faction_code`, `xp`, `real_name`, `pack_code`). Deck import also hits ArkhamDB (`fetchDeck`, validated and loaded by `applyDeck`/`validateDeck`/`loadDeckCards`).

**Redux store (`src/store.js`)** — four slices in `src/features/`:
- `settings` — all user choices (investigator and how it is chosen, classes, draft type/weighting/counts, selected taboo, ban list, upgrade options, animation and layout preferences, current wizard step, `drafting`/`complete` flags). Exposes `reset` (listened to by other slices), `changeSetting`, and the `calculateFilteredCount` thunk. `investigatorActions.js` holds the investigator thunks (selecting an entry, drawing and redrawing the investigator pool, picking one).
- `data` — raw card/taboo/pack data, fetch/loading flags, taboo merging (`mergeTabooData`), imported-deck state, `syncCollectionPacks`.
- `draft` — the in-progress draft: `deckList`, `cardList`, `removedList`, draft pool (cards are revealed one by one), per-phase progress, deck modifiers, exile/burn state. Also holds the draft-lifecycle thunks `startDraft`, `advanceDraft`, `updateDeckRequirements`, `updateExileRemoval`, etc. (exported next to the reducer at the bottom of `draftSlice.js`).
- `collection` — which packs the user owns; saved in localStorage, and packs never seen before (new on ArkhamDB) start selected.

Slices import each other's actions and thunks directly (e.g. `dataSlice` imports from `settingsSlice`/`draftSlice`/`collectionSlice`), so watch for circular-import hazards when adding cross-slice code.

**Persistence (`src/storage.js`)** — guarded `loadJSON`/`saveJSON` over localStorage (it can be unavailable, so every call is wrapped). Keys: `draftham.theme`, `.collection`, `.collectionConfirmed`, `.cardsPerRow`, `.animationSpeed`, `.animateTogether`, `.bannedCards`, `.savedDraft`. The pages must render fine when storage is empty or blocked.

**Undo and resume (`features/draftState.js`, `features/draftHistory.js`)** — both work on a snapshot `{ settings (without the preferences), draft, deckLoaded }`; the `restoreDraftState` action makes the settings, draft and data slices replace their state with it. `PREFERENCE_KEYS` lists the settings a restore must leave alone, so a new setting that is a preference (not part of the draft) has to be added there. Every pick (`draftCard` in `DrawDraft.js`) and "Done" pushes a snapshot onto an in-memory stack (`rememberUndoPoint`; `settings.undoDepth` mirrors its size for the UI), and the header's Undo button / Ctrl+Z pops it (`undoLastPick`). `store.js` autosaves the draft in progress to localStorage (debounced) and `components/ResumeDraft.js` offers to resume it on the setup screens (`resumeSavedDraft` re-applies the taboo list to the freshly fetched cards); only Restart clears the save. Bump `SAVED_DRAFT_VERSION` when the shape of the saved state changes.

**Seed and sharing (`random.js`, `share.js`)** — the draw uses `random()` from `random.js`, seeded with `settings.seed` when a draft starts (`useStartDraft`); the state of the sequence is part of the undo/resume snapshot. `share.js` builds and applies a link (`#setup=…`) that carries a build setup, its collection and the seed; `components/SharedSetup.js` offers it on the setup screens. Any new randomness in the draw must use `random()`, not `Math.random()`, or seeds stop reproducing drafts.

**Data cache (`cache.js`)** — the card, pack and taboo lists from ArkhamDB are kept in IndexedDB and never expire: a saved copy is always used (so the app starts at once and works offline), and the Collection step has a "Refresh card data" button that clears the cache and reloads. **When new content comes out (a pack, a taboo list, errata), raise `CACHE_VERSION` in `dataSlice.js`**: users then fetch the new data the next time the page loads, and the copies of older versions are deleted.

**Card languages (`data/Languages.js`, `components/useCardName.js`)** — the card data (and all the logic keyed on card names) stays English. A language chosen in the header (`settings.language`, saved in localStorage) makes `fetchTranslations` fetch that language's card list from ArkhamDB's translated site (`<code>.arkhamdb.com`), keep only `{ name, subname, customization text }` per card code and cache it like the other lists (`names-<code>` keys). What the user reads goes through `useCardName()` (`cardName`, `cardSubname`, `compareNames`, `customizationText`), which falls back to the English text; names stored or sent elsewhere (ban list, `.o8d` export) stay English. The card images are always English: ArkhamDB's translated sites serve the same pictures. A new place that shows a card name should use `useCardName` too.

**Interface language (`src/i18n/`)** — the interface texts are English string literals passed to `t()`/`msg()` (hook `useT`); the English text is its own key, and a language is a dictionary `src/i18n/locales/<code>.json` loaded on demand. `scripts/i18n-scan.mjs` finds the keys and `scripts/i18n-catalog.mjs` writes `src/i18n/catalog.json` (every text, for translators); `locales.test.js` checks the dictionaries. Keys must be string literals, or the scan misses them. Don't confuse it with the card languages above.

**Installable app (`vite-plugin-pwa`, `components/UpdateNotice.js`)** — `vite.config.js` generates the web manifest and a Workbox service worker (app shell precached, Google Fonts runtime-cached; card images and ArkhamDB data are not, the data lives in the IndexedDB cache). `registerType` is `prompt`: a new version waits until the user clicks Reload in `UpdateNotice`, so a draft is never interrupted. The service worker is only active in production builds (`npm run build` + `npm run preview`).

**Draft engine (`src/draft/`, `src/data/`)**
- `data/CardFilter.js` — the core eligibility logic: given investigator deck options, selected classes/traits, collection, taboo, ban list and phase, returns the set of legal cards (also `filteredCount`, `filterResearch`, `extraDeckRequirements`, draft weighting). Largest and most rules-heavy file; investigator-specific deckbuilding quirks live here.
- `draft/DrawDraft.js` — weighted random draw, `fillDraft`/`draftCard`/`redrawDraftCard`, simple draft vs the disabled "chaos" mode, XP/cost calculation (`costWithModifiers`, `calculateModifiedCost`), draft progress/target math, and `testForAdvance` which decides when to move to the next phase.
- `draft/Modifiers.js` — "deck modifiers": cards in the deck that alter later drafting/costs (Arcane Research-style discounts, Versatile, etc.), added via `addDeckModifier` and applied via `addModifiers`/`availableUpgrades`.
- `draft/Level0.js` — counting of the level 0 cards still waiting to be drafted. `draft/ExportDeck.js` — export to ArkhamDB-compatible `.o8d` and plain text. `draft/flyCard.js` — the "drafted card flies into the Draft List" animation.
- `data/DraftPhases.js` — phase enum (`AllCards`, `BuildPhase1-3`, `BuildUpgradePhase`, `UpgradeLevel0AddPhase`, `UpgradePhase`, `VersatilePhase`) plus `isUpgrade` / `isLevel0Upgrade` / `isLevel0Build` helpers used throughout both logic and UI. Note `UpgradeLevel0SwapPhase` is commented out in the enum but still referenced in the helpers. `data/PhaseLabel.js` gives the phase names shown in the header; `data/DraftModes.js` switches which draft types the UI offers (the engine still supports the disabled ones).
- `data/InvestigatorList.js` — the investigator list is **built from the card data** (`investigatorEntries`, hook `components/useInvestigatorEntries.js`): reprints and hidden cards are skipped, same-name versions become "Name (Parallel)" / "Name (Pack)", Agatha Crane has one entry per class. `data/RequiredCards.js` derives the cards an investigator always comes with from `deck_requirements` (used by the hover preview and the small pictures under the investigator).
- Packs: `data/PackCatalog.js` builds the collection groups from the ArkhamDB pack list and cards (new packs appear by themselves); `data/PackData.js` (pack code → name) and `data/CollectionGroups.js` are the built-in fallback used when ArkhamDB can't be reached. `data/ResearchLogs.js` — research-log card text.
- Card images: `data/CardImages.js` (`cardImageUrls(card, side)` tries ArkhamDB, then the arkham.build CDN), used by `CardImage`, `OverlayCardImage` and `CardPreview`.

**UI (`src/components/`)** — `ArkhamDraft.js` is the top-level switch between the setup wizard, the investigator draft, the drafting screen and the complete screen. The known-issues comment at its top lists existing limitations (parallel investigator export, Myriad at level 0).
- *Setup wizard* (`SetupWizard.js`, `components/wizard/`): breadcrumb steps Collection → Investigator (pick from the list, random, or investigator draft) → Draft Rules (Build or Upgrade, rules, deck options, deck import) → Review. `settings.setupStep` and `collectionConfirmed` drive it; a redraft returns to the Investigator step. `describeSetup.js` has the plain-text summaries shared by the summary column, stepper and review.
- *Draft screens* share one layout (`.draft-layout` with `.draft-left` / `.draft-main` / `.draft-aside`): `DeckSidebar.js` (`DeckLeftColumn`, `DeckRightColumn`: investigator, deck lists, cost curve, upgrade/deck options), `DraftPanel.js` (the card pool, with the flip, redraw and fly animations), `CardListPanel`, `ExportPanel`, `UpgradeOptionsPanel`, `Level0UpgradePanel`, `VersatilePanel`. When the draft completes the panels re-arrange and `useFlipLayout.js` animates the move. Below 1380px the side columns become drawers.
- *Hover previews*: every image hover goes through `useCardOverlay` (`OverlayImage.js`), which stores the image, anchor and card code in `settings`; `CardPreview.js` places the big preview beside the hovered element, with bonded cards and customizations, scaling down to stay on screen. On touch screens there is no hover: `useCardOverlay` opens the preview after a long press, centered and "pinned" (`settings.imagepinned`) with a backdrop that closes it when tapped, and swallows the click that ends the press so the card isn't selected or drafted.
- Legacy setup components still used by the wizard's rules step: `Build*Settings`, `Upgrade*Settings`, `PhasedDraftSettings`, `PhaseSettings`, `DeckOptionsPanel`, `BuildUpgradePanel`.

**Styling** — one stylesheet, `src/styles.css`, imported by `index.js`; it has three sections in cascade order: page basics, layout and draft cards (older rules, still needed) and themes and components (design tokens and the component classes of the redesign). Themes (`light`, `dark`, `arkham`) are set with `data-theme` on `<html>` by `theme.js`; colors come from CSS variables (`--bg --surface --text --primary --line …`, defined per theme in the last section of `styles.css`), so new CSS should use the tokens, not fixed colors. Prefer the shared classes (`.panel .btn .btn-primary .field .setting-row .options-section .check-row .switch .chip …`) over adding new ones. Before deleting a class, grep for it in `src/**/*.js`: some are built from pieces (e.g. `'rotated-' + side`).

## Adding game content

Most new investigators and packs now show up by themselves (investigator list and collection groups are derived from ArkhamDB). Special-case cards and investigators with unusual deckbuilding rules still need hand-written handling in `CardFilter.js` / `Modifiers.js` (by card name or code), and, for the signature cards of the export, in `ExportPanel.js` (Lily Chen, Occult Evidence, Burden of Destiny) and `RequiredCards.js`. Grep for an existing investigator or card name to find every place that needs a matching change; recent commits ("added new expansions with same name character logic", "Suzi/Parallel Pete, fixes", "The Drowned City") show the pattern.