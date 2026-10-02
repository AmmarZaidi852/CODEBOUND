# CODEBOUND — Architecture

A frontend-only single-page app: **React + TypeScript + Vite**, tested with **Vitest** + Testing Library, linted with **ESLint**, formatted with **Prettier**. No backend.

## Current layout

```
index.html                  HTML entry
public/                     Static files served as-is (favicon)
src/
  main.tsx                  Mounts <App /> and loads global styles
  App.tsx                   Holds session state (current screen, XP) and switches screens
  screens/                  Full-page screens: Home, GameSelect, BugHunt, CodeBreaker
  components/               Reusable UI (see below)
  content/                  Static data: game list, Bug Hunt and Code Breaker challenges
  challenges/               Challenge types + deterministic answer validation
  game/xp.ts                XP rewards and level maths
  game/useChallengeRun.ts   Shared state for playing through a challenge sequence
  styles/global.css         Design tokens (CSS variables), buttons, shared game layout
  test/setup.ts             Vitest setup (jest-dom matchers, cleanup)
```

Tests sit next to the code they cover (`*.test.ts[x]`).

## How it fits together

- **Screens** are chosen by a plain `useState` in `App.tsx`. No router.
- **XP** is session-only React state in `App.tsx`. Every game gets the same `onEarnXp(amount)` callback, so XP is shared across games. Nothing is persisted.
- **Content is data.** Each game has its own typed challenge shape in `src/challenges/` and a list of challenges in `src/content/`. Adding a challenge means adding an object to that list.
  - `BugHuntChallenge`: buggy code + candidate one-line patches.
  - `CodeBreakerChallenge`: a security rule, a system-state readout, lock code with an optional `____` slot, and options that either fill the slot or predict the output.
  - Both kinds of answers extend `Choice` (`id`, optional `whyNot`) from `src/challenges/choice.ts`.
- **Validation** is deterministic and client-side: the chosen id is compared with the challenge's correct id. No Python is executed.
- **Styling** is plain CSS: shared tokens, buttons, and the `.game` column layout in `global.css`; each screen/component keeps its own CSS file next to it.

## Shared game building blocks

A game screen owns its layout and content, and composes these:

| Piece             | Role                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `useChallengeRun` | Current index, selection, single submit (awards XP once), next, run XP, first-try count, finished, focus. |
| `RunProgress`     | "Game · 2/5" label and progress pips.                                                                     |
| `ConceptCard`     | Short concept primer.                                                                                     |
| `CodeBlock`       | Editor-style code with optional highlighted line and fillable slot.                                       |
| `ChoiceList`      | Radio choices that lock and mark correct/wrong after submit.                                              |
| `FeedbackPanel`   | Success/fail header, XP earned, why a wrong pick fails, game-specific explanation, Next/Finish.           |
| `RunSummary`      | Completion screen: XP earned, challenges completed, solved first try, back to games.                      |

To add a game: define its challenge type + validator in `src/challenges/`, its data in `src/content/`, a screen in `src/screens/` built from the pieces above, then mark it playable in `src/content/games.ts` and route to it in `App.tsx`.

## Not built yet

| Concern                   | Likely location | Notes                                                                                 |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| Shared/persistent state   | `src/state/`    | Only if prop passing gets painful or progress must survive a reload.                  |
| Python execution (future) | `src/python/`   | Likely in-browser (e.g. Pyodide in a Web Worker) to avoid a backend. Not decided yet. |
