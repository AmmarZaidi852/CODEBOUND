# CODEBOUND — Project Memory

- **Project:** CODEBOUND — game-style Python learning platform
- **Current phase:** Phase 2 — Code Breaker (complete)
- **Next authorized phase:** none. Wait for the user to authorize Phase 3.
- **Repo:** https://github.com/AmmarZaidi852/CODEBOUND (`main` tracks `origin/main`)

## Stack

React 19 · TypeScript 6 · Vite 8 · Vitest 5 (+ Testing Library, jsdom) · ESLint 10 (typescript-eslint, react-hooks, react-refresh) · Prettier 3. Frontend only, no backend.

## Games

| Game         | Status   | Teaches                                                         |
| ------------ | -------- | --------------------------------------------------------------- |
| Bug Hunt     | Playable | Variables, arithmetic, strings, booleans, if/else (fix the bug) |
| Code Breaker | Playable | if, comparisons, if/elif/else, and/or/not, combined logic       |
| Data Sorter  | Locked   | Lists (not started)                                             |

## Implemented

- **Phase 0:** scaffold with dev / test / lint / format / typecheck / build scripts; docs (`CLAUDE.md`, `DESIGN.md`, `ARCHITECTURE.md`, this file).
- **Phase 1:** home screen, game selection, Bug Hunt (5 challenges), XP (+100 correct / +25 wrong, level every 300 XP, session-only), completion screen.
- **Phase 2:**
  - Shared game building blocks extracted from Bug Hunt with no behaviour change: `useChallengeRun` hook, `RunProgress`, `ConceptCard`, `ChoiceList`, `FeedbackPanel`, `RunSummary`, and `Choice` in `src/challenges/choice.ts`.
  - Code Breaker: 5 sequential security locks. Access panel (rule, system state, lock status), concept card, lock code whose `____` slot fills with the selected condition, choose → attempt unlock → feedback (correct logic, how it evaluates, takeaway, why a wrong pick fails) → next → completion.
  - Code Breaker uses the same XP state as Bug Hunt; XP carries across both games.
  - Fix: code no longer renders `>=` as a `≥` font ligature.
  - Tests (42 total): Code Breaker validation and content, gameplay (submit gating, +100 / +25, feedback, no repeat submit, progression, completion), game selection, and shared XP across games. All Phase 1 tests still pass.

See `ARCHITECTURE.md` for where things live and how to add a game.

## Not implemented (by design)

Python execution, typed-code answers, persistence (XP resets on reload), Data Sorter gameplay, accounts, databases, backend, routing, maps/NPCs/dialogue, AI mentor, skill trees, leaderboards.

## Known limitations

- Replaying a game awards XP again (acceptable while XP is session-only).
- Leaving a game mid-run discards that run's progress; XP already earned is kept.

## Git

- Branch: `main`
- Last code commit of Phase 2: `f2f23a4` (docs are committed right after it)
