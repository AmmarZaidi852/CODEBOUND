# CODEBOUND — Project Memory

- **Project:** CODEBOUND — game-style Python learning platform
- **Current phase:** Phase 3 — Data Sorter (complete)
- **Next authorized phase:** none. Wait for the user to authorize Phase 4.
- **Repo:** https://github.com/AmmarZaidi852/CODEBOUND (`main` tracks `origin/main`)

## Stack

React 19 · TypeScript 6 · Vite 8 · Vitest 5 (+ Testing Library, jsdom) · ESLint 10 (typescript-eslint, react-hooks, react-refresh) · Prettier 3. Frontend only, no backend.

## Games (all playable)

| Game         | Challenges | Teaches                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------- |
| Bug Hunt     | 5          | Variables, arithmetic, strings, booleans, if/else (fix the bug)                         |
| Code Breaker | 5          | if, comparisons, if/elif/else, and/or/not, combined logic                               |
| Data Sorter  | 7          | Lists, zero-based indexing, item assignment, append(), pop(), combined ops, for + len() |

## Implemented

- **Phase 0:** scaffold with dev / test / lint / format / typecheck / build scripts; docs (`CLAUDE.md`, `DESIGN.md`, `ARCHITECTURE.md`, this file).
- **Phase 1:** home screen, game selection, Bug Hunt, XP (+100 correct / +25 wrong, level every 300 XP, session-only), completion screen.
- **Phase 2:** shared game building blocks (`useChallengeRun`, `RunProgress`, `ConceptCard`, `ChoiceList`, `FeedbackPanel`, `RunSummary`, `Choice`); Code Breaker; fix for `>=` font ligatures.
- **Phase 3:**
  - Data Sorter: 7 data terminals. Two interactions on the list itself: **pick** (tap a cell, e.g. `scores[2]`, `pop(2)`) and **build** (tap value tiles to assemble the resulting list; tap a placed value to remove it; Reset). Feedback shows the resulting list, what happened, the takeaway, and the typical mistake.
  - New: `ListCells` component (list as `[ cells ]` with index labels), `DataSorterRound` (per-challenge answer state, remounted with `key`), `listOps.ts` (tiny deterministic model of set / append / pop used to verify content).
  - `useChallengeRun` no longer requires a single-choice selection to submit; games gate their own submit button. XP is still awarded once per challenge.
  - All three games share one XP total.
  - Tests (75 total): list operations, Data Sorter validation and content consistency, gameplay (pick + build, undo/reset, submit gating, +100 / +25, feedback, locked after submit, progression, completion), game selection, and XP shared across all three games. All Phase 1–2 tests still pass.

See `ARCHITECTURE.md` for where things live and how to add a game.

## Not implemented (by design)

Python execution, typed-code answers, persistence (XP resets on reload), accounts, databases, backend, routing, maps/NPCs/dialogue, AI mentor, skill trees, leaderboards.

## Known limitations

- Replaying a game awards XP again (acceptable while XP is session-only).
- Leaving a game mid-run discards that run's progress; XP already earned is kept.
- Data Sorter shows one shared "typical mistake" note per challenge rather than a note for each specific wrong answer.
- Data Sorter values are integers only (no string lists yet).

## Git

- Branch: `main`
- Last code commit of Phase 3: `21b646d` (docs are committed right after it)
