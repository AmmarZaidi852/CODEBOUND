# CODEBOUND — Project Memory

- **Project:** CODEBOUND — game-style Python learning platform
- **Current phase:** Phase 6 — Retro game identity & UX overhaul (complete)
- **Next authorized phase:** none. Wait for the user to authorize Phase 7.
- **Repo:** https://github.com/AmmarZaidi852/CODEBOUND (`main` tracks `origin/main`)

## Stack

React 19 · TypeScript 6 · Vite 8 · `@fontsource/jersey-10` (self-hosted display font, the only runtime dependency besides React) · Vitest 5 (+ Testing Library, jsdom) · ESLint 10 (typescript-eslint, react-hooks, react-refresh) · Prettier 3. Frontend only, no backend.

## Learning path → games

| #   | Concept    | Micro-challenge                            | Practised in   |
| --- | ---------- | ------------------------------------------ | -------------- |
| 1   | Variables  | What does the example print?               | Bug Hunt       |
| 2   | Data types | Type of `"42"`?                            | Bug Hunt       |
| 3   | Operators  | `print(10 == 5 * 2)`?                      | Code Breaker   |
| 4   | Conditions | Which branch runs when `energy = 80`?      | Code Breaker   |
| 5   | Lists      | `len([4, 8, 15, 16])`?                     | Data Sorter    |
| 6   | Indexing   | Tap `nums[1]` (list cells)                 | Data Sorter    |
| 7   | Loops      | How many times does the loop body run?     | Data Sorter    |
| 8   | Functions  | What does `add(2, 3)` return? (def/params) | Function Forge |

Games (all playable): Bug Hunt (5 challenges), Code Breaker (5), Data Sorter (7), Function Forge (7).

## Implemented

- **Phase 0:** scaffold, scripts, docs.
- **Phase 1:** home, game selection, Bug Hunt, XP (+100 / +25, level every 300 XP, session-only), completion screen.
- **Phase 2:** shared game building blocks; Code Breaker; `>=` ligature fix.
- **Phase 3:** Data Sorter (pick + build list interactions), `ListCells`, `listOps.ts`.
- **Phase 4:** Python Foundations: 8 concept lessons with micro-challenges, learning path with sequential unlocking, one-time +25 concept XP, Start/Continue/Review Learning on home, games opened from a lesson return to the path.
- **Phase 5 — Function Forge:**
  - 7 sequential function "modules": Define It (assemble `def greet():`), Call It (choose `greet()`), One Parameter (pass `"Alex"`), Return (choose `return a + b` over `print`/bare expression), Two Inputs (pass `10, 3` in order), Trace It (predict `double(7)`), Forge It (assemble `def area(w, h):` + `return w * h`).
  - Interactions: **assemble** (tap tokens in order; live code preview; tap to remove; Reset), **args** (tap value tiles into named parameter slots; tap to clear), **choose** (slot a line into the code or predict output). 2 assemble, 2 args, 3 choose.
  - `FunctionPipeline` shows INPUT → `name()` → OUTPUT; output hidden until the module runs. On a wrong call it shows what that call really returns (e.g. `-7`, `NameError`). Module status: Idle → Online / Fault.
  - Validation is deterministic: exact token sequence, exact argument order, or option id. Argument tasks carry a tiny TypeScript mirror (`run`) of their function, tested to hit the target only with the expected arguments. No Python is executed.
  - Reuses `useChallengeRun`, `FeedbackPanel`, `RunSummary`, `ChoiceList`, `CodeBlock`, `ConceptCard`, exit-label navigation; per-challenge answer state lives in `FunctionForgeRound` (remounted with `key`).
  - Functions concept now maps to Function Forge ("Practise in Function Forge"; "← Foundations" returns to the path with progress kept). Game selection shows 4 games in a 2 × 2 grid (1 column on phones).
  - Vitest per-test timeout raised to 15s (full play-through tests were intermittently slower than 5s on a loaded machine).
  - Tests (137 total): token formatting, validation (structure, order, call, output), content consistency, gameplay (assemble with undo/reset, args order and real output, choose slotting, predict, locked after run / XP once, sequential progress, completion and first-try count), four games in selection, Functions → Function Forge → back to Foundations with progress kept. All earlier tests still pass.
  - Browser-verified in Chrome: full Function Forge run (+550, 5/7 first try), wrong-argument NameError display, Foundations → Functions → Practise in Function Forge → ← Foundations (8/8 kept), all four games open directly, shared XP consistent, no console errors, no horizontal overflow at 375px.

- **Phase 6 — Retro game identity & UX overhaul:**
  - **Visual system** (`src/styles/global.css`, documented in `DESIGN.md` → Visual language): navy surfaces; green brand plus one tone per area via `data-theme` (Foundations green, Bug Hunt amber, Code Breaker magenta, Data Sorter cyan, Function Forge violet); Jersey 10 display font for headings/labels/buttons, system font for teaching text, monospace for code; square 2px-bordered panels with tone corner brackets; chunky pressable buttons (primary / default / ghost, `btn--go` arrow).
  - **Original pixel art** (`src/art/`): grid → SVG renderer (one path per colour) and 6 hand-composed sprites: Home terminal + cartridge (with blinking cursor), Foundations training cartridge + manual, Bug Hunt corrupted terminal + bug, Code Breaker padlock + key, Data Sorter crates on an indexed shelf, Function Forge input → machine → output. No external or copyrighted assets.
  - **Home** is a title screen (hero art, extruded pixel logo, primary Start/Continue/Review Learning, PLAY, segmented Foundations progress, large XP badge; two-column on desktop).
  - **Game selection** is a cartridge shelf (art window with CART number and status LED, name in tone, description, concepts taught, one Play button; hover/focus lift).
  - **Gameplay hierarchy** for every game and lesson: `GameHud` (sprite, name, `MODULE 02 / 05` segmented progressbar, per-game status) → mission (number, title, objective) → Intel concept card → interaction → sticky `ActionBar` (hint + one primary action, disabled until answered).
  - **Feedback**: SYSTEM ONLINE / SYSTEM ERROR strip with tick/cross and XP chip above the unchanged teaching text; ✓/✕ markers and A/B/C keys on choices; one-shot shake on wrong answers.
  - **XP**: rules unchanged. Segmented level bar, floating "+100" / "+100 · LEVEL UP" on the top-bar badge (decorative, `aria-hidden`), completion screen with mission stamp, burst, stats and "N XP to level X" meter.
  - **Foundations** is a training campaign (Complete / Current / Locked rows with pixel icons; locked rows dashed and quiet); lessons are training terminals ("Training module 03", `>` prompt, "Code terminal · Try it").
  - New shared components: `GameHud`, `StatusBadge`, `PixelProgress`, `ActionBar`, `PixelSprite`. `RunProgress` removed (replaced by `GameHud`).
  - Fixes found in the browser: screens now open at the top (scroll was carried over); reload no longer restores a mid-page scroll; `--tone-wash` is recomputed per theme (it was stuck on green); Pixelify Sans replaced by Jersey 10 because C read as O and 5 as S; removed `background-attachment: fixed` and `backdrop-filter` (paint cost).
  - Tests (153 total): progress assertions now check the HUD progressbar and `MODULE 0n / 0m` label (`src/test/progress.ts`); Forge's first status reads Ready; new `RetroUi.test.tsx` (cartridges, primary actions, action-bar hints, status changes, SYSTEM ONLINE/ERROR, XP popup and level up, completion stamp and level meter) and `sprites.test.ts` (sprite grids valid). No existing assertions weakened.
  - Browser-verified in Chrome (desktop width and a 375px same-origin frame): Home, game selection (all 4 cartridges), Bug Hunt correct + wrong, Code Breaker wrong + correct and full run to completion, Data Sorter correct, Function Forge assemble correct, Foundations → Variables lesson → micro-challenge → Practise in Bug Hunt → ← Foundations (1/8 kept, XP kept), completion → Back to games. No horizontal overflow at 375px, no console errors, keyboard focus visible, ~60 fps.

See `ARCHITECTURE.md` and `DESIGN.md` for details.

## Not implemented (by design)

Python execution, typed-code answers, persistence (XP and progress reset on reload), accounts, databases, backend, routing, maps/NPCs/dialogue, AI mentor, skill trees, leaderboards.

## Known limitations

- The Chrome window could not go below ~630px, so 375px was checked in a same-origin iframe (layout and overflow measured, not on a physical phone).
- Jersey 10 ships the latin subset only (all content is English).
- On phones the HUD status badge wraps under the game name, and the completion screen's exit button sits below the fold on short screens.
- Sprites are fixed images (only the Home cursor animates); there is no per-challenge art.

- Replaying a game awards XP again (acceptable while XP is session-only).
- Leaving a game mid-run discards that run's progress; XP already earned is kept.
- "Practise in <game>" starts that game from its first challenge, not the challenge matching the concept.
- A concept completes on answering its micro-challenge, right or wrong (after the explanation), not after playing the game.
- Function Forge assemble tasks accept only the exact expected token order (e.g. `h * w` is not offered as an alternative).
- Data Sorter shows one shared "typical mistake" note per challenge; values are integers only.

## Git

- Branch: `main`
- Last code commit of Phase 6: `e4a72f2` (tests); docs follow it. Phase 5 ended at `2fedf90`.
