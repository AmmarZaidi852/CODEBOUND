# CODEBOUND — Project Memory

- **Project:** CODEBOUND — game-style Python learning platform
- **Current phase:** Phase 1 — First playable learning loop (complete)
- **Next authorized phase:** none. Wait for the user to authorize Phase 2.
- **Repo:** https://github.com/AmmarZaidi852/CODEBOUND (`main` tracks `origin/main`)

## Stack

React 19 · TypeScript 6 · Vite 8 · Vitest 5 (+ Testing Library, jsdom) · ESLint 10 (typescript-eslint, react-hooks, react-refresh) · Prettier 3. Frontend only, no backend.

## Implemented

- **Phase 0:** scaffold with dev / test / lint / format / typecheck / build scripts; docs (`CLAUDE.md`, `DESIGN.md`, `ARCHITECTURE.md`, this file).
- **Phase 1:**
  - Home screen: logo, "Learn Python. Play the Code.", PLAY, XP/level badge.
  - Game selection: Bug Hunt (playable), Code Breaker and Data Sorter (locked).
  - Bug Hunt: 5 sequential beginner challenges (variables, arithmetic, strings, booleans, if/else). Concept primer → mission + expected output → buggy code → choose a patch → feedback with the bug line highlighted, why a wrong pick fails, and an explanation.
  - XP: +100 correct, +25 wrong, level every 300 XP. Session-only (React state in `App.tsx`).
  - Completion screen: XP earned, challenges completed, fixed first try, back to games.
  - Tests: XP maths, validation, content integrity, Bug Hunt gameplay, and a full app loop.

See `ARCHITECTURE.md` for where things live.

## Not implemented (by design)

Python execution, typed-code answers, persistence (XP resets on reload), Code Breaker and Data Sorter gameplay, accounts, databases, backend, routing, maps/NPCs/dialogue, AI mentor, skill trees, leaderboards.

## Known limitations

- Replaying Bug Hunt awards XP again (acceptable while XP is session-only).

## Git

- Branch: `main`
- Last code commit of Phase 1: `d097c07` (this file is committed right after it)
