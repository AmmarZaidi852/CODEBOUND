# CODEBOUND — Project Memory

- **Project:** CODEBOUND — game-style Python learning platform
- **Current phase:** Phase 4 — Python Foundations (complete)
- **Next authorized phase:** none. Wait for the user to authorize Phase 5.
- **Repo:** https://github.com/AmmarZaidi852/CODEBOUND (`main` tracks `origin/main`)

## Stack

React 19 · TypeScript 6 · Vite 8 · Vitest 5 (+ Testing Library, jsdom) · ESLint 10 (typescript-eslint, react-hooks, react-refresh) · Prettier 3. Frontend only, no backend.

## Learning path → games

| #   | Concept    | Micro-challenge                            | Practised in |
| --- | ---------- | ------------------------------------------ | ------------ |
| 1   | Variables  | What does the example print?               | Bug Hunt     |
| 2   | Data types | Type of `"42"`?                            | Bug Hunt     |
| 3   | Operators  | `print(10 == 5 * 2)`?                      | Code Breaker |
| 4   | Conditions | Which branch runs when `energy = 80`?      | Code Breaker |
| 5   | Lists      | `len([4, 8, 15, 16])`?                     | Data Sorter  |
| 6   | Indexing   | Tap `nums[1]` (list cells)                 | Data Sorter  |
| 7   | Loops      | How many times does the loop body run?     | Data Sorter  |
| 8   | Functions  | What does `add(2, 3)` return? (def/params) | — (none yet) |

Games: Bug Hunt (5 challenges), Code Breaker (5), Data Sorter (7). All playable.

## Implemented

- **Phase 0:** scaffold, scripts, docs.
- **Phase 1:** home, game selection, Bug Hunt, XP (+100 / +25, level every 300 XP, session-only), completion screen.
- **Phase 2:** shared game building blocks; Code Breaker; `>=` ligature fix.
- **Phase 3:** Data Sorter (pick + build list interactions), `ListCells`, `listOps.ts`.
- **Phase 4 — Python Foundations:**
  - 8 concept lessons (`src/content/foundations.ts`), each one screen: one-sentence summary → tiny example → micro-challenge (`choice` or tap-a-cell `pick`) → feedback (answer + why, and why a wrong pick fails) → "Practise in <game>" or "Next concept".
  - Learning path screen with completed / up next / locked rows and an `n / 8 concepts completed` progress bar.
  - Sequential unlocking: Variables open; completing a concept (answering its micro-challenge) unlocks the next. Completed concepts can be reviewed.
  - Progression state: `completed: ConceptId[]` in `App.tsx`, session only; rules in `src/game/foundationsProgress.ts`.
  - XP: +25 (`XP_CONCEPT`) the first time a concept is completed; reviews give nothing. Same shared XP total as the games.
  - Home: Start / Continue / Review Foundations button with progress, plus PLAY for direct game access.
  - Games opened from a lesson return to the path ("← Foundations"); opened from game selection they return there. Game cards show "Learn: …" concepts derived from the concept data.
  - Shared tweaks: `FeedbackPanel` custom actions + hides 0 XP; `ChoiceList` rich legend; `RunSummary` / game screens take an exit label.
  - Tests (107 total): concept content and micro validation, progression rules, concept screen (correct / wrong / locked / review gives no XP / pick micro / Functions), full flow (unlocking, progress on home and path, next concept, practise in a game and return, all 8 complete), game-card concepts, direct game access. All earlier tests still pass.

See `ARCHITECTURE.md` and `DESIGN.md` for details.

## Not implemented (by design)

Python execution, typed-code answers, persistence (XP and progress reset on reload), a Functions game, accounts, databases, backend, routing, maps/NPCs/dialogue, AI mentor, skill trees, leaderboards.

## Known limitations

- Replaying a game awards XP again (acceptable while XP is session-only).
- Leaving a game mid-run discards that run's progress; XP already earned is kept.
- "Practise in <game>" starts that game from its first challenge, not the challenge matching the concept.
- Lists, Indexing, and Loops all practise in the same Data Sorter run.
- A concept completes on answering its micro-challenge, right or wrong (after the explanation), not after playing the game.
- Data Sorter shows one shared "typical mistake" note per challenge; values are integers only.

## Git

- Branch: `main`
- Last code commit of Phase 4: `08baab7` (docs are committed right after it)
