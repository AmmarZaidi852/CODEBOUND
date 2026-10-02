# CODEBOUND — Architecture

A frontend-only single-page app: **React + TypeScript + Vite**, tested with **Vitest** + Testing Library, linted with **ESLint**, formatted with **Prettier**. No backend.

## Current layout

```
index.html                  HTML entry
public/                     Static files served as-is (favicon)
src/
  main.tsx                  Mounts <App /> and loads global styles
  App.tsx                   Holds session state (current screen, XP) and switches screens
  screens/                  Full-page screens: Home, GameSelect, BugHunt
  components/               Reusable UI: TopBar, XpBadge, CodeBlock, InlineCode
  content/                  Static data: game list, Bug Hunt challenges
  challenges/               Challenge types + deterministic answer validation
  game/xp.ts                XP rewards and level maths
  styles/global.css         Design tokens (CSS variables), buttons, base styles
  test/setup.ts             Vitest setup (jest-dom matchers, cleanup)
```

Tests sit next to the code they cover (`*.test.ts[x]`).

## How it fits together

- **Screens** are chosen by a plain `useState` in `App.tsx`. No router.
- **XP** is session-only React state in `App.tsx`, passed down as a prop. A game reports earned XP through an `onEarnXp(amount)` callback. Nothing is persisted.
- **Content is data.** A Bug Hunt challenge (`BugHuntChallenge` in `src/challenges/bugHunt.ts`) holds a lesson, mission, buggy code lines, candidate one-line patches, the correct patch id, and an explanation. Adding a challenge means adding an object to `src/content/bugHuntChallenges.ts`.
- **Validation** is deterministic and client-side: the chosen patch id is compared with `correctFixId`. No Python is executed.
- **Styling** is plain CSS: shared tokens and button styles in `global.css`; each screen/component keeps its own CSS file next to it.

New games should follow the same pattern: a challenge type + validator in `src/challenges/`, data in `src/content/`, a screen in `src/screens/`, reusing `TopBar`, `CodeBlock`, and `xpForResult`.

## Not built yet

| Concern                   | Likely location | Notes                                                                                 |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| Shared/persistent state   | `src/state/`    | Only if prop passing gets painful or progress must survive a reload.                  |
| Python execution (future) | `src/python/`   | Likely in-browser (e.g. Pyodide in a Web Worker) to avoid a backend. Not decided yet. |
