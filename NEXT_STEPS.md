# Hitster Bingo Cards — Status & Roadmap
_Portfolio audit: 2026-07-11_

## What this is
A mobile-friendly digital 5×5 bingo card for playing Hitster Music Bingo in person (German UI). Players pick a mode (Anfänger/Profi, each with 5 categories like "Jahr ± 2", "Jahrzehnt", "Vor/Nach 2000"), get a generated board, tap cells to mark them, use a scratchpad for round answers, and get confetti on bingo. Static HTML + Tailwind CDN + one vanilla JS file (`js/app.js`, 540 lines), deployed on GitHub Pages, with a header link to the companion Kategorie-Rad wheel app.

## Current state
Effectively done as a standalone play aid:

- 13 commits through 2026-04-10, clean working tree, no TODO markers.
- Recent work was pure polish: neon theme overhaul, cell glow and checked-state visuals, mode-selection modal with per-mode descriptions, click-to-toggle cells, auto-resize scratchpad, bingo replay fix, Eingabe-Löschen button.
- A CNAME custom-domain experiment was added and reverted, so it serves from the default github.io URL.
- Board generation logic was explicitly improved ("Better board generation logic" commit), and cell interaction is complete (toggle, replay after bingo).
- No tests or CI — appropriate for its size. No README either, which is the one documentation gap.
- Runtime dependencies are two CDN scripts: `cdn.tailwindcss.com` and `canvas-confetti` via jsDelivr.

The real finding is ecosystem-level: this app and **Hitster Bingo Wheel** are two halves of one product. They ship the *same* mode/category data (Anfänger/Profi, identical 5 categories per mode, matching neon color coding) duplicated across two repos, and this app already hard-links to the wheel at `https://0langa.github.io/Hitster-Bingo-Wheel/`. Any category tweak currently has to be made twice. A third overlap exists with Hitster-Remix, whose built-in bingo engine duplicates this app's job.

## Definition of "finished"
**Consolidation recommendation: make this repo the single "Hitster Bingo Companion".** Absorb the wheel as a second view/tab (it is ~700 lines of dependency-free HTML/CSS/JS), share one category config file between board and wheel, and archive the wheel repo. Hitster-Remix then drops its duplicate bingo mode and links here. Finished = one repo, one Pages deploy, one category config, plus a short README.

## Roadmap

### Phase 1 — Now (next 1-2 weeks)
- Merge the wheel in: copy `js/wheel.js`, `js/spin.js`, and the wheel styles from Hitster Bingo Wheel into this repo as a second screen (tab or hash-route), driven by the same category data as the board.
- Extract the duplicated mode/category definitions into one shared config object used by both board generation and wheel segments.
- Replace the external Kategorie-Rad link with the in-app wheel view; verify the Pages deploy still works.

### Phase 2 — Next (2-6 weeks)
- Add a short README: what it is, how to play, link to the deployed app, note that the wheel app was merged in.
- Archive the Hitster-Bingo-Wheel repo on GitHub with a pointer to this one; keep its Pages URL up briefly as a soft redirect.
- Vendor Tailwind locally (the `cdn.tailwindcss.com` script is explicitly not intended for production) and the canvas-confetti lib, so the game works offline at a party.

### Phase 3 — Later (optional/stretch)
- Persist board state in localStorage so an accidental refresh mid-game doesn't wipe the card.
- Multiple boards on one screen for shared-device play.
- PWA manifest + service worker for install-to-homescreen and full offline play.

## Effort to "finished"
**S** — the app is done; folding in the ~700-line wheel and deduplicating one config object is a weekend's work.
