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

## GitHub workflow (mandatory, every phase)

Before starting work: check `git status` and `git diff`.

After **each** meaningful completed piece (not just at the end of a phase):

1. Run tests: `npm test`
2. Run lint: `npm run lint` (and `npm run format:check`)
3. Run the build: `npm run build`
4. Verify the app still works (in the browser via `npm run dev` when UI changed).
5. Review `git status` and `git diff`.
6. Make a small, focused commit with a clear message, e.g.
   `feat: add challenge selection screen`, `feat: add bug hunt game`, `fix: correct challenge validation`, `ui: improve game interface`, `docs: ...`, `chore: ...`
7. **Push to GitHub immediately** (`git push`). Completed work must not stay local-only.

Rules:

- Keep commits small and logically grouped — never one giant commit per phase.
- Never force-push, rewrite history, or reset/delete remote work unless the user explicitly authorizes it.
- If authentication, the remote, or any GitHub configuration problem blocks a push: **stop** and tell the user exactly what needs fixing. Do not keep going with local-only commits.
- At the end of each phase: update `PROJECT_MEMORY.md`, push, confirm the final commit is on the remote (`git status` shows up to date with `origin/main`), and report the **commit hash, commit message, and push status**. The working tree must be clean.

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
