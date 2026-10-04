# CODEBOUND — Project Memory

- **Project:** CODEBOUND — game-style Python learning platform
- **Current phase:** Phase 9 — Difficulty tiers: Advanced & Boss modules (complete)
- **Next authorized phase:** none. Wait for the user to authorize Phase 10.
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

Games (all playable), modules = CORE + 2 ADVANCED + 1 BOSS: Bug Hunt 10, Code Breaker 10, Data Sorter 12, Function Forge 13. Write modules per game (core + advanced + boss): 4 / 4 / 4 / 5.

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

- **Phase 7 — Progression, mastery & replayability:**
  - **Persistence** (`src/progression/`): one `localStorage` key `codebound.progress`, schema `version: 1`: `xp`, `concepts`, `challenges` (`"game:challengeId"` → `{ solved, mastered, xp }`), `games` (`{ runs, bestRun }`; best run counts full runs from module 01 only). Level is derived from XP, never stored. `storage.ts` validates every load; missing / corrupt JSON / unknown version / blocked storage → fresh player, invalid fields dropped, writes never throw. `ProgressProvider` restores before first render and saves on every change through one `commit()`; screens use `useProgress()`.
  - **XP rules** (values unchanged: +100 correct, +25 wrong, +25 concept once): a challenge pays the XP of its best result once. First attempt +100 / +25; first correct answer after a miss +75 (tops up to 100); any other replay 0. Max 100 XP per challenge, so no XP farming.
  - **Challenge states:** unplayed (never solved) · completed (solved, first attempt wrong) · mastered (first attempt correct; can't be earned later, and a wrong replay doesn't remove it).
  - **Game states:** New · In progress · Complete · Mastered, derived from challenge states.
  - **Continue / replay:** a game in progress continues at its first unfinished module and plays to the end; Replay starts at 01. One runner (`useChallengeRun(game, challenges, startAt)`); `App` remounts the game with a new key for another run.
  - **UI (Phase 6 components reused):** cartridges show a status light (NEW / IN PROGRESS / COMPLETE / MASTERED, mastered as a solid badge with a green frame), `MODULES 03 / 05`, saved segments (mastered segments have a bright top edge), and Play, Continue + Replay, or Replay; the art readout turns to the success word when complete (Patched / Unlocked / Sorted / Online). The HUD fills saved segments and marks replayed modules COMPLETE / MASTERED. Feedback adds a MASTERED chip on first-try wins and "Replay · no XP" on repeats. The completion screen shows XP this run, correct this run, saved modules complete and mastered, game status, what is left, and Retry unfinished / Replay. Home shows saved XP / level / Foundations; its button reads START / CONTINUE / REVIEW LEARNING.
  - **Reset:** a quiet "Reset local progress" text link in Home's footer, inline confirmation (Cancel focused, Escape cancels, focus returns), red "Erase progress" removes only CODEBOUND's key.
  - Tests (188 total): pure rules (`progress.test.ts`), storage safety (`storage.test.ts`), app-level progression with simulated reloads (`Progression.test.tsx`: persistence, no fake level-up on restore, cartridge states, continue, replay without XP, completed-not-mastered, reset with confirmation). Screen tests render inside the provider (`src/test/render.tsx`) and check the XP total instead of a callback mock; re-entering a started game now continues (module 02), and Home's finished label is REVIEW LEARNING. No assertions weakened.
  - Browser-verified in Chrome (fresh player): Foundations 2 concepts, Bug Hunt (mastered + miss), Code Breaker, Data Sorter and Function Forge first-try wins; reload kept XP, Foundations (current = Operators), challenge and cartridge states, no XP popup on load; Continue opened module 02; replay of module 01 paid 0 XP; finishing Bug Hunt gave +375 (75 + 3×100), 5/5 complete, 4/5 mastered, Complete; Code Breaker reached Game mastered; reload kept both; keyboard-only reset (Cancel focused → Erase) cleared the key and stayed fresh after reload. 375px frame: no overflow, no buttons under 40px on Home, reset confirmation, cartridges, gameplay and completion. No console errors.

- **Phase 8 — Real coding challenges & challenge depth:**
  - **New interaction type: Write.** The player edits real Python in a CODEBOUND code terminal (`CodeTerminal`) and presses Check code. 9 write modules, placed right after the related challenge: Bug Hunt 2 (Ticket Counter, Broken Badge), Code Breaker 2 (Vault Threshold, Access Rule), Data Sorter 2 (Fix the Reading, Queue Intake), Function Forge 3 (Doubler, Adder, Use It). Games now have 7 / 7 / 9 / 10 modules and mix Choose, Build, Predict and Write. All earlier interactions are unchanged.
  - **Validation:** a controlled simulator of the taught Python subset (`src/python/`: lexer, parser, interpreter). **CODEBOUND does not execute user Python** (no real runtime, no `eval`, no backend). `checkCode` runs the code against each module's test cases (given system values; expected output, final variables or function return values), then token-level requirements (must use `append()`, must not type the answer…). Equivalent solutions pass; hard-coded answers and rebuilt lists are refused with an explanation. Errors use Python's names (`NameError`, `TypeError`, `IndexError`…); unsupported code (`while`, `import`, f-strings…) is refused clearly; step / range / depth limits stop runaway code.
  - **Feedback:** SYSTEM ONLINE / SYSTEM ERROR with what the checker found ("When power = 50, your code printed LOCKED…", "`double(4)` printed 8 but returned None…", off-by-one index), the player's output or resulting list as cells, Try again / Show solution (solution only on request), then the explanation once solved.
  - **Hints:** 3 per module, progressive (idea → syntax → shape), never the finished line, no XP cost. **A module solved after opening a hint is completed, not mastered.**
  - **Attempts / mastery / XP (values unchanged):** opening, editing, Reset and hints aren't attempts; each Check is. First Check correct (no hint) → mastered +100; first Check wrong → +25, retry allowed, first correct after that +75 (completed); further checks 0; replays 0 and never remove mastery. Implemented with `applyAnswer(..., hinted)` and `useChallengeRun.retry()` in the existing progression layer.
  - **Editor:** textarea over a highlighted copy (no editor library), line numbers, Enter auto-indent (+4 after `:`), Backspace removes an indent level, Tab not captured, 16px, internal horizontal scroll, focus ring, forced-colors fallback, Reset (44px).
  - **Foundations:** each lesson's Try it notes the linked game's Write modules; cartridges show "N modules where you type the code". Lessons unchanged.
  - Mission labels are numbered by position (Security Node 03…); hard-coded node / terminal / module fields removed. Screen readers now get a space between labels and values (Goal, Rule, Expected output).
  - Tests (284 total): simulator (printing, precedence, blocks, functions, lists, Python error messages, syntax-mistake messages, unsupported code, no page access, runaway limits), every write module (solution passes, starter fails, equivalent solutions, common mistakes, typed answers, malformed code, hints never contain the answer), module placement, hint mastery rule, CodeRound UI (label/description, Check enable, Reset, auto-indent, attempts, retry XP, second wrong check 0, Show solution, malformed/unsupported, hints), and write modules with Continue / persistence / replay / completion. Screen tests run against each game's own challenges as before; app-level tests play the real module lists through `src/test/play.ts`.
  - Browser-verified in Chrome: Bug Hunt patches then Ticket Counter typed with real keys (wrong `-` → "printed 5, should print 24", +25; hint; fix → +75, not mastered); Code Breaker Vault Threshold (failing case named, fix accepted); Data Sorter via Continue to Fix the Reading (off-by-one diagnosed, result list drawn) and Queue Intake (hinted first try +100, not mastered); Function Forge Doubler (print vs return diagnosed, fixed), Adder first try mastered, Use It typed with real Enter/Backspace (auto-indent/dedent) → mastered, completion 10/10 complete, 9/10 mastered; reload kept XP and every write-module record; replaying Ticket Counter showed COMPLETE and "Replay · no XP" with XP unchanged. 375px frame: no page overflow (long lines scroll inside the editor), no small buttons after the Reset fix. No console errors.

- **Phase 9 — Difficulty tiers (Advanced & Boss):**
  - **Metadata** on every challenge object (`src/challenges/meta.ts`): `tier` (core default / advanced / boss) and `concepts` (Foundations concepts used). `interactionOf()` derives choose / build / predict / write from the challenge shape.
  - **12 new modules** (`src/content/depthChallenges.ts`), only combining taught concepts. Bug Hunt: Member Discount (choose), Average Score (write), boss Shop Checkout. Code Breaker: Override Switch (predict), Shift Scheduler (write), boss Vault Core. Data Sorter: Threshold Filter (build), Count Alerts (write), boss Sensor Repair. Function Forge: Fee Calculator (predict), Score Total (write), boss Shipping Rule. Every boss is a write module; each write module diagnoses its reasoning mistakes. Write modules can draw a different result list (`resultVariable`). No simulator changes were needed.
  - **Structure:** each game is CORE → 2 ADVANCED → 1 BOSS. A run plays one tier section; the completion screen stamps Core / Advanced complete, Boss cleared / mastered and offers Retry unfinished, Play Advanced, Play Boss or Replay. The boss unlocks once every core and advanced module is complete; a `boss` start while locked falls back to Continue. Continue (first unfinished) now walks CORE → ADVANCED → BOSS.
  - **Rules unchanged:** XP, mastery, hints, replay. A first-try boss is mastered; missed or hinted is cleared. No new saved fields (schema still `version: 1`); tier state is derived.
  - **UI:** ADVANCED / BOSS MODULE mission tag; boss gets a heavier frame and a SYSTEM CRITICAL · FINAL TEST strip; cartridges show `CORE 07/07 · ADVANCED 01/02 · BOSS LOCKED / READY / CLEARED / MASTERED`. Conditions, Lists, Loops and Functions lessons say where the idea is combined later.
  - Tests (352 total): every new module (solutions, equivalent solutions, mistakes, typed answers, malformed / unsupported code, hints never contain a finished line; choose / predict / build answers proven by running the code in the simulator, including every Bug Hunt patch); `Difficulty.test.tsx` (tier order, harder tiers combine more already-taught concepts, interaction mix, tier counts / sections, boss locked → ready → cleared / mastered, boss XP rules, core → advanced → boss runs, Continue routing, cartridge labels, boss state after reload). Existing full-game flows play each tier from the completion screen. Test helper fix: Bug Hunt patch radios are matched by their whitespace-collapsed accessible name.
  - Browser-verified in Chrome (Bug Hunt with core seeded complete): cartridge CORE 07/07 · ADVANCED 00/02 · BOSS LOCKED → Continue opened module 08 with the ADVANCED tag; Member Discount first try +100 mastered; Average Score typed with real keys, first check (`str()` only) diagnosed "prints 11.5… divides before it adds" (+25), equivalent `(b + a) / 2` accepted (+75); Advanced complete screen (+200, "Boss module ready", Play Boss); boss framed SYSTEM CRITICAL · FINAL TEST, Shop Checkout typed with Enter auto-indent and Backspace dedent → mastered +100; "Boss mastered" stamp, 10/10 complete, 9/10 mastered, Game status Complete; reload kept 1000 XP and BOSS MASTERED on the cartridge. 375px frame: no page overflow, no buttons under 40px, tier row wraps cleanly. No console errors.

See `ARCHITECTURE.md` and `DESIGN.md` for details.

## Not implemented (by design)

Real Python execution (write modules use the controlled subset simulator), free-form programs beyond the taught subset, cloud sync / cross-device progress, accounts, databases, backend, routing, maps/NPCs/dialogue, AI mentor, skill trees, leaderboards, achievements, streaks.

## Known limitations

- The Chrome window could not go below ~630px, so 375px was checked in a same-origin iframe (layout and overflow measured, not on a physical phone).
- Jersey 10 ships the latin subset only (all content is English).
- On phones the HUD status badge wraps under the game name, and the completion screen's exit button sits below the fold on short screens.
- Sprites are fixed images (only the Home cursor animates); there is no per-challenge art.

- Progress lives in one browser's `localStorage`: clearing site data or switching browser/device starts fresh. Two open tabs don't sync; the last one to save wins.
- Mastery is only possible on a challenge's first attempt; a missed module can be completed later but never mastered (by design).
- Leaving a game mid-run keeps every answer already given; the run's completion screen and "best run" are only recorded when a run reaches the end.
- Continue plays from the first unfinished module to the end of the game, including any already-finished modules after it (they pay no XP).
- "Practise in <game>" continues that game (first unfinished module), not the challenge matching the concept.
- Only one schema version exists; an unknown version starts a fresh player rather than migrating.
- A concept completes on answering its micro-challenge, right or wrong (after the explanation), not after playing the game.
- Function Forge assemble tasks accept only the exact expected token order (e.g. `h * w` is not offered as an alternative). Write modules accept equivalent code.
- The simulator covers only the taught subset; valid Python outside it (`while`, f-strings, `in`, slicing, dicts, string methods…) is refused as "not part of this terminal yet" rather than run.
- Write modules check behaviour on their test cases plus a few token requirements; unusual but valid solutions that avoid a required form (e.g. Vault Threshold written as `power > 49`) are asked to use the taught form, with an explanation.
- A hint opened, then the module left without checking, isn't remembered; mastery is still possible on a later first check.
- Output is compared exactly, so a stray trailing space in printed text counts as different (the message shows what was printed).
- Completion's "correct this run" counts a module fixed after a miss as correct (mastered count shows first-try wins).
- The suggested next step (Play Advanced / Play Boss) is a secondary button next to Back to games.
- Code isn't saved between visits; Reset and re-entering a module start from the starter code.
- Data Sorter shows one shared "typical mistake" note per challenge; values are integers only.

## Git

- Branch: `main`
- Phase 9 work starts after `4821dea` (end of Phase 8 docs); code commits `72214c9`, `30744e9`, tests `fff3e86`, then docs.
- Phase 8 work starts after `4fec17b` (end of Phase 7); its last code commit is `cb11746`, followed by docs. Phase 7 ended at `4fec17b`, Phase 6 at `5d9424d`, Phase 5 at `2fedf90`.
