# DraftHam Horror

A drafting tool for [*Arkham Horror: The Card Game*](https://www.fantasyflightgames.com/en/products/arkham-horror-the-card-game/).
Pick your collection, an investigator and the draft rules, and the app drafts a deck for you one card at a time: either a new deck
(build) or the upgrades for an existing one (spend XP).

**Live site: https://radghiv.github.io/DrafthamHorror/**

This is a fork of [Skeezix55/ArkhamDraft](https://github.com/Skeezix55/ArkhamDraft).

## Features

- Setup wizard: collection, investigator (pick one, draw at random, or draft the investigator too), draft rules, review.
- Build a deck from scratch, or upgrade one imported from ArkhamDB.
- Card data, taboo lists and packs are fetched from the [ArkhamDB](https://arkhamdb.com) public API and kept in the browser, so the app
  starts at once and works offline after the first visit.
- Card names in several languages (card images are always in English).
- Undo (Ctrl+Z), automatic resume of a draft in progress, and links that share a setup together with its random seed.
- Export to ArkhamDB (`.o8d`) or plain text.
- Light, dark and Arkham themes; installable as an app (PWA).

It runs entirely in the browser: there is no backend, and everything is saved in the browser's own storage.

## Development

Plain JavaScript, [Vite](https://vitejs.dev), React 18 and Redux Toolkit.

```
npm install
npm start          # dev server on http://localhost:3000
npm run lint       # ESLint (not part of the dev server or the build)
npm test           # Vitest
npm run build      # production build into build/
npm run preview    # serves the production build (the service worker only runs there)
```

The app lives in `src/` and `public/` holds the static files. [CLAUDE.md](CLAUDE.md) describes the architecture (state slices, draft
engine, card filtering) and the conventions of the code.

## Deploying

The site is hosted on GitHub Pages, from the `gh-pages` branch:

```
npm run deploy     # builds and publishes build/ to gh-pages
```

In the repository settings, Pages must be set to *Deploy from a branch* → `gh-pages` / `(root)`. The build uses relative paths, so it
works under `/DrafthamHorror/` as well as on a custom domain.

When new content comes out (a pack, a taboo list, errata), raise `CACHE_VERSION` in `src/features/data/dataSlice.js` before deploying, so
returning users fetch the new card data.

## Credits

Based on [ArkhamDraft](https://github.com/Skeezix55/ArkhamDraft) by Skeezix55. Card data and images come from
[ArkhamDB](https://arkhamdb.com).

*Arkham Horror: The Card Game* is a trademark of Fantasy Flight Games / Asmodee. This is an unofficial fan project, not affiliated with
or endorsed by them.
