# CODEBOUND — Architecture

A frontend-only single-page app: **React + TypeScript + Vite**, tested with **Vitest** + Testing Library, linted with **ESLint**, formatted with **Prettier**. No backend.

## Current layout

```
index.html                  HTML entry
public/                     Static files served as-is (favicon)
src/
  main.tsx                  Mounts <App /> and loads global styles
  App.tsx                   Wraps everything in ProgressProvider; switches screens and tracks the game being played
  screens/                  Full-page screens: Home, GameSelect, Foundations, Concept, BugHunt, CodeBreaker, DataSorter, FunctionForge (+ per-challenge Round components)
  components/               Reusable UI (see below)
  art/                      Pixel-art toolkit (pixel.ts: grid → SVG paths) and the original sprites (sprites.ts)
  content/                  Static data: game list, each game's challenges, Python Foundations concepts
  challenges/               Challenge types, deterministic validation, listOps (tiny list model), code.ts (write modules + checkCode)
  python/                   Controlled simulator for the taught Python subset: lexer, parser, interpreter (no eval, no real Python)
  game/xp.ts                XP rewards and level maths
  game/useChallengeRun.ts   Shared state for one run through a game; asks progression for XP and mastery
  progression/              Saved player progress: model + rules (progress.ts), localStorage (storage.ts), React context (ProgressProvider, useProgress)
  game/foundationsProgress.ts  Unlock / current / progress rules for Python Foundations
  styles/global.css         Design tokens, area themes (data-theme), display font, buttons, panels, mission layout
  test/setup.ts             Vitest setup (jest-dom matchers, cleanup, scrollTo stub)
  test/progress.ts          expectStep(): asserts the HUD shows MODULE n / total
```

Tests sit next to the code they cover (`*.test.ts[x]`).

## How it fits together

- **Screens** are chosen by a plain `useState` in `App.tsx`. No router.
- **Progress** has one source of truth: `ProgressProvider` (`src/progression/`). Screens read it with `useProgress()` and change it only through its actions: `answer(game, challengeId, correct)` (returns XP earned / mastered / replay), `completeConcept(id)`, `finishRun(game, run)`, `reset()`.
  - `progress.ts` is pure: the `Progress` model (`version`, `xp`, `concepts`, `challenges` keyed `game:challengeId` → `{ solved, mastered, xp }`, `games` → `{ runs, bestRun }`) and the rules (`applyAnswer`, `applyConcept`, `applyRunEnd`, `challengeState`, `gameStatus`, `continueIndex`). Level is never stored; `levelForXp` derives it.
  - `storage.ts` is the only code that touches `localStorage` (key `codebound.progress`). Loading validates everything (`sanitize`): missing data, invalid JSON, an unknown version, or blocked storage give a fresh player; bad fields are dropped. Saves and clears never throw.
  - The provider loads before the first render (so a reload shows no XP or level-up animation) and saves inside the same `commit()` that updates state.
  - `useChallengeRun(game, challenges, startAt)` picks the first module (`continue` → first unfinished, `start` → 01), reports each answer to `answer()`, and calls `finishRun()` at the end. Screens get `startAt` and `onPlayAgain(startAt)`; `App` remounts the game with a new `key` for another run.
  - `content/gameChallenges.ts` defines each game's **module list** (its own challenges with write modules interleaved, in play order), `gameChallengeIds` for reading saved state, and `writeModuleCounts` for the cartridges.
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
- **Validation** is deterministic and client-side: a chosen id, tapped index, or built list is compared with the challenge data.
- **Write modules** (`CodeChallenge`, `kind: 'code'`, in `src/challenges/code.ts`; content in `src/content/codeChallenges.ts`) are shared by all games. A game's module list is `(TheirChallenge | CodeChallenge)[]`; screens check `isCodeChallenge()` and render `CodeRound` with a per-game `CodeRoundTheme` (art, status words, titles, label).
  - `checkCode(challenge, source)` runs the player's code once per test case in the simulator (`runProgram(source, given)`), compares printed lines, final variables (`vars`) and function calls (`calls`, via `result.call(name, args)`), then checks `requirements` as token sequences (`uses` any-of, `avoids`). The first failure is explained by a challenge `mistakes` entry or a generic message; it returns `{ correct, message, output, error, list }` and never throws.
  - `src/python/` is a small tokenizer → parser → tree-walking interpreter for exactly the taught subset: ints, floats, strings, booleans, None, lists; `+ - * / // % **`, comparisons (chained), `and / or / not`; assignment (names and list items), `+= -= *=`; `if / elif / else`, `for` over range / list / str, `def` with parameters and `return`, `pass`; `print`, `len`, `range`, `str`, `int`, `list.append`, `list.pop`. Values print like Python (`5.0`, `['a', 1]`) and errors use Python's names and messages. Anything else (`while`, `import`, classes, lambda, f-strings, …) is refused as unsupported. Safety: no `eval`/`Function`, no access to JavaScript or the page (unknown names are `NameError`), max 20,000 steps, `range()` capped at 1,000 items, call depth 50.
  - Hints: `CodeRound` passes `hinted` to `submit`, which reaches `applyAnswer(..., hinted)`; a hinted correct first attempt is recorded `mastered: false`. `useChallengeRun.retry()` clears a wrong result so the same module can be checked again.
- **Styling** is plain CSS: shared tokens, buttons, `.panel`, `.mission` and the `.game` column layout in `global.css`; each screen/component keeps its own CSS file next to it. A screen sets `data-theme="<game id>"` (or `foundations`) on its root, and every component inside picks up that area's `--tone`. See `DESIGN.md` → Visual language.
- **Art** is data: each sprite is a list of equal-length strings, one character per pixel, composed from small parts with `compose()`. `gridToPaths()` merges runs into one SVG path per colour. Tests check every sprite is rectangular and uses known colours.
- **Navigation:** `App.tsx` scrolls to the top whenever the screen (or lesson) changes; browser scroll restoration is off because a reload always opens Home (saved progress is restored, the current screen is not).

## Shared game building blocks

A game screen owns its layout and content, and composes these:

| Piece                 | Role                                                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChallengeRun`     | Start module (continue / start), current index, optional single-choice selection, single submit (XP and mastery from progression), next, run stats, saved challenge states, finished, focus. Games enable submit only once they have an answer. |
| `GameHud`             | Top strip: area sprite, game name, `MODULE 02 / 05` + segmented progressbar, optional `StatusBadge`.                                                                                                                                            |
| `StatusBadge`         | LED + "Label: Value" readout with idle / ok / fail states (`role="status"`).                                                                                                                                                                    |
| `PixelProgress`       | Segmented bar `[■■□□]`; exposes a `progressbar` when given a label, decorative otherwise.                                                                                                                                                       |
| `ActionBar`           | Sticky bottom bar: hint + the one primary action (Apply patch, Submit, Run module, Check answer).                                                                                                                                               |
| `ConceptCard`         | Short "Intel" concept primer.                                                                                                                                                                                                                   |
| `CodeBlock`           | Editor-style code with optional highlighted line and fillable slot.                                                                                                                                                                             |
| `ChoiceList`          | Lettered radio choices that lock and mark correct (✓) / wrong (✕) after submit.                                                                                                                                                                 |
| `FunctionPipeline`    | A call drawn as INPUT → `name()` → OUTPUT, with the output hidden until the function runs.                                                                                                                                                      |
| `ListCells`           | A Python list drawn as `[ cells ]` with optional zero-based index labels and clickable cells.                                                                                                                                                   |
| `FeedbackPanel`       | SYSTEM ONLINE / SYSTEM ERROR strip with XP earned (hidden when 0), why a wrong pick fails, explanation, and Next/Finish or custom `actions`.                                                                                                    |
| `RunSummary`          | Completion screen from saved progress: stamp, XP this run, correct this run, modules complete, mastered, game status, what is left, level meter, back + Retry unfinished / Replay.                                                              |
| `XpBadge`             | Level chip, 10-segment XP bar, total; floats "+100" (or "· LEVEL UP") when XP rises. `large` variant on Home.                                                                                                                                   |
| `PixelSprite`         | Renders a sprite from `src/art/sprites.ts` as crisp SVG.                                                                                                                                                                                        |
| `CodeTerminal`        | The code editor: textarea over a highlighted copy, line numbers, Enter auto-indent / Backspace dedent, Reset, read-only after a check.                                                                                                          |
| `CodeRound` (screens) | A whole write module: HUD, mission + goal, readout / starting list, Intel, `CodeTerminal`, hints, Check code, feedback with Try again / Show solution.                                                                                          |
| `TopBar`              | ← back button + `XpBadge`.                                                                                                                                                                                                                      |

Games whose answer is more than one choice keep it in a per-challenge component remounted with `key` (see `DataSorterRound`, `FunctionForgeRound`).

To add a game: define its challenge type + validator in `src/challenges/`, its data in `src/content/`, a screen in `src/screens/` built from the pieces above, then add it to `src/content/games.ts` (with a cartridge `status`), give it a sprite in `src/art/sprites.ts` and a tone in `global.css` (`[data-theme='<id>']`), and route to it in `App.tsx`.

## Not built yet

| Concern               | Likely location | Notes                                                                                                                                                                                  |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full Python execution | —               | Not planned. Write modules use the controlled subset simulator in `src/python/`; a real runtime (e.g. Pyodide in a Web Worker) would only be considered if lessons outgrow the subset. |
