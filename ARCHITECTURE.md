# CODEBOUND — Architecture

A frontend-only single-page app: **React + TypeScript + Vite**, tested with **Vitest** + Testing Library, linted with **ESLint**, formatted with **Prettier**. No backend.

## Current layout

```
index.html            HTML entry
public/               Static files served as-is (favicon)
src/
  main.tsx            Mounts <App /> and loads global styles
  App.tsx             Top-level component; decides which screen is shown
  App.test.tsx        Smoke test
  screens/            Full-page game screens (currently: TitleScreen)
  styles/global.css   Design tokens (CSS variables) and base styles
  test/setup.ts       Vitest setup (jest-dom matchers, cleanup)
```

Styling is plain CSS: shared tokens live in `src/styles/global.css`; each component keeps its own CSS file next to it.

## Where future pieces will live

These folders are **not created yet** — add each one only when its phase is authorized.

| Concern                    | Planned location  | Notes                                                                                 |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| Reusable UI components     | `src/components/` | Buttons, panels, code editor wrapper, etc.                                            |
| Game screens               | `src/screens/`    | Already exists. One file (+ CSS) per screen.                                          |
| Challenge / lesson content | `src/content/`    | Plain TypeScript data (prompts, starter code, tests). Content separate from UI.       |
| Game state                 | `src/state/`      | Start with React state/context; only reach for a library if it's genuinely needed.    |
| Challenge validation       | `src/challenges/` | Logic that checks a player's solution against a challenge's expectations.             |
| Python execution (future)  | `src/python/`     | Likely in-browser (e.g. Pyodide in a Web Worker) to avoid a backend. Not decided yet. |

Screen switching starts as simple state in `App.tsx`; add a router only if it's actually needed.
