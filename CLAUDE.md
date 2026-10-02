# CODEBOUND — Development Rules

CODEBOUND is a simple, game-style Python learning platform: **learn Python by playing interactive games and solving coding challenges.** It should feel like a polished indie learning game, not an enterprise LMS.

Priority order: **fun interactive learning > complexity > visual spectacle.**

## Core rules

- **Incremental development.** Work only on the phase the user has explicitly authorized. Never start the next phase without permission.
- **Simple architecture.** Prefer the simplest solution that is easy to understand and modify. Keep the codebase clean and approachable.
- **No unnecessary complexity.** Do not over-engineer, do not add dependencies without a clear need, and do not build features "because they might be useful later".
- **Do not build future systems early.** No empty scaffolding for hypothetical features.
- **Not a massive RPG.** Keep game systems small and in service of learning.
- **No backend unless genuinely required.**
- **Never add without explicit request:** authentication, accounts, multiplayer, leaderboards, social systems.
- **Preserve working functionality.** Every change must leave the app running, tested, and buildable.
- Use existing Claude Code skills/workflows when they fit, instead of inventing elaborate custom systems. Leave room for the user to do work themselves.

## Workflow after each meaningful piece of work

1. Run tests: `npm test`
2. Run lint: `npm run lint` (and `npm run format:check`)
3. Run the build: `npm run build`
4. Verify the app in the browser (`npm run dev`) when UI changed.
5. Check `git status` and inspect `git diff`.
6. Make a small, focused commit with a clear message, e.g.
   `feat: add game shell`, `fix: correct challenge validation`, `ui: improve challenge interface`, `docs: ...`, `chore: ...`
7. Push to GitHub.

- Do not bundle unrelated changes into one giant commit.
- Never force-push or rewrite history unless the user explicitly says so.
- At the end of each phase, update `PROJECT_MEMORY.md`.

## Visual direction

Dark, clean, modern, game-like, slightly futuristic, responsive, focused.
Avoid: childish educational UI, excessive animation, giant dashboards, complicated menus, unnecessary HUD elements, over-designed RPG systems.

## Commands

| Command                | Purpose                       |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start the dev server          |
| `npm test`             | Run Vitest once               |
| `npm run test:watch`   | Vitest in watch mode          |
| `npm run lint`         | ESLint                        |
| `npm run format`       | Prettier (write)              |
| `npm run format:check` | Prettier (check only)         |
| `npm run typecheck`    | TypeScript project check      |
| `npm run build`        | Type-check + production build |

## Key docs

- `PROJECT_MEMORY.md` — current phase and status
- `DESIGN.md` — product vision
- `ARCHITECTURE.md` — where code lives
