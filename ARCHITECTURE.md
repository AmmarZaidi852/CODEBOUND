# CODEBOUND — Architecture

A frontend-only single-page app: **React + TypeScript + Vite**, tested with **Vitest** + Testing Library, linted with **ESLint**, formatted with **Prettier**. No backend.

## Current layout

```
index.html                  HTML entry
public/                     Static files served as-is (favicon)
src/
  main.tsx                  Mounts <App /> and loads global styles
  App.tsx                   Holds session state (screen, XP, completed concepts) and switches screens
  screens/                  Full-page screens: Home, GameSelect, Foundations, Concept, BugHunt, CodeBreaker, DataSorter, FunctionForge (+ per-challenge Round components)
  components/               Reusable UI (see below)
  content/                  Static data: game list, each game's challenges, Python Foundations concepts
  challenges/               Challenge types, deterministic validation, listOps (tiny list model)
  game/xp.ts                XP rewards and level maths
  game/useChallengeRun.ts   Shared state for playing through a challenge sequence
  game/foundationsProgress.ts  Unlock / current / progress rules for Python Foundations
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
  - `FunctionForgeChallenge`: module code with an optional `____` slot, an optional call shown as a pipeline, and a task that is `assemble` (tap code tokens in order, checked by exact sequence; `formatTokens` turns them into Python source), `args` (tap value tiles into parameter slots, checked by exact order; each task carries a tiny TypeScript mirror of its function, `run`, so the game can show what the player's own call returns and tests can prove the expected arguments hit the target), or `choose` (pick a line for the slot or predict a result).
  - `DataSorterChallenge`: a starting list, code, and a task that is either `pick` (tap a list cell, checked by index) or `build` (assemble a list from value tiles, checked by exact order). `ops` describes what the code does to the list; tests run them through `listOps.ts` to prove every answer and result matches Python.
- **Python Foundations** (`src/content/foundations.ts`, types in `src/challenges/foundations.ts`): 8 `Concept`s in learning order, each with a summary, tiny example, a `MicroChallenge` (`choice` or `pick`), an explanation, and the `game` that practises it. This is separate from game challenges on purpose: concepts are one-question lessons, not challenge runs.
  - Progression state is a `completed: ConceptId[]` list in `App.tsx`. `foundationsProgress.ts` derives everything else: the first concept is open, each later one unlocks when the previous is completed, and "current" is the first incomplete concept.
  - Completing a concept (answering its micro-challenge) awards `XP_CONCEPT` once; reviewing gives nothing.
  - A game opened from a concept gets `exitLabel="Foundations"` and returns to the path; opened from game selection it returns there.
  - Game cards list the concepts they practise, derived from each concept's `game`.
- **Validation** is deterministic and client-side: a chosen id, tapped index, or built list is compared with the challenge data. No Python is executed.
- **Styling** is plain CSS: shared tokens, buttons, and the `.game` column layout in `global.css`; each screen/component keeps its own CSS file next to it.

## Shared game building blocks

A game screen owns its layout and content, and composes these:

| Piece              | Role                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChallengeRun`  | Current index, optional single-choice selection, single submit (awards XP once), next, run XP, first-try count, finished, focus. Games enable submit only once they have an answer. |
| `RunProgress`      | "Game · 2/5" label and progress pips.                                                                                                                                               |
| `ConceptCard`      | Short concept primer.                                                                                                                                                               |
| `CodeBlock`        | Editor-style code with optional highlighted line and fillable slot.                                                                                                                 |
| `ChoiceList`       | Radio choices that lock and mark correct/wrong after submit.                                                                                                                        |
| `FunctionPipeline` | A call drawn as INPUT → `name()` → OUTPUT, with the output hidden until the function runs.                                                                                          |
| `ListCells`        | A Python list drawn as `[ cells ]` with optional zero-based index labels and clickable cells.                                                                                       |
| `FeedbackPanel`    | Success/fail header, XP earned (hidden when 0), why a wrong pick fails, explanation, and Next/Finish or custom `actions`.                                                           |
| `RunSummary`       | Completion screen: XP earned, challenges completed, solved first try, back to games.                                                                                                |

Games whose answer is more than one choice keep it in a per-challenge component remounted with `key` (see `DataSorterRound`, `FunctionForgeRound`).

To add a game: define its challenge type + validator in `src/challenges/`, its data in `src/content/`, a screen in `src/screens/` built from the pieces above, then mark it playable in `src/content/games.ts` and route to it in `App.tsx`.

## Not built yet

| Concern                   | Likely location | Notes                                                                                 |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| Shared/persistent state   | `src/state/`    | Only if prop passing gets painful or progress must survive a reload.                  |
| Python execution (future) | `src/python/`   | Likely in-browser (e.g. Pyodide in a Web Worker) to avoid a backend. Not decided yet. |
