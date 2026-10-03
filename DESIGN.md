# CODEBOUND — Design

## Vision

CODEBOUND is a simple game-style Python learning platform where players learn programming by completing interactive challenges and games.

**The learning experience is the main product.** Game elements exist to make practicing Python feel engaging, not to replace it.

## Principles

- Fun interactive learning comes first; visual spectacle comes last.
- It should feel like a polished indie learning game — not an enterprise LMS, and not a sprawling RPG.
- Coding should feel like playing.

## Look & feel

**Retro game + polished modern UX.** CODEBOUND looks like a retro computer / arcade title: CRT terminals, cartridges, pixel art, status readouts. It should feel like _playing a game that teaches Python_, never like a website with game mechanics bolted on, and never like a 1990s web page.

Avoid: SaaS dashboards, LMS layouts, childish "coding for kids" UI, rainbow neon, constant flashing, full-screen scanlines or CRT distortion, giant animations, HUD clutter.

## Visual language

All tokens live in `src/styles/global.css`. Components use tokens, never raw colours.

### Typography

| Role    | Font                                  | Use                                                                                    |
| ------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Display | **Jersey 10** (`--font-display`, OFL) | Logo, headings, buttons, short uppercase labels and status readouts. Never paragraphs. |
| Body    | system UI stack (`--font-sans`)       | Every sentence of teaching text, explanations, descriptions.                           |
| Code    | system monospace (`--font-mono`)      | Code, values, list cells, tokens. Ligatures off so `>=` stays `>=`.                    |

Jersey 10 was chosen over Pixelify Sans because Pixelify drew C like O and 5 like S at UI sizes. It is self-hosted (latin subset), scaled with `size-adjust`, and the browser may not fake bold.

### Colour

- Surfaces: near-black navy page (`--color-bg`), panels (`--color-surface`), inset terminals (`--color-inset`).
- **Green** is the brand and Foundations colour. Success is green; errors are red. Both always come with words and an icon, never colour alone.
- Each area has one **tone**, set with `data-theme` on the screen root: Foundations green, Bug Hunt amber, Code Breaker magenta, Data Sorter cyan, Function Forge violet. `--tone`, `--tone-dim` and `--tone-wash` follow it, so the same component recolours itself per game.
- Text on a solid tone fill uses `--color-on-tone` (near-black).

### Shapes and details

- Square corners (`--radius: 2px`), 2px borders, a 3px "pressable" base under buttons and tiles that disappears when pressed.
- `.panel`: framed box with small tone-coloured corner brackets. Used for HUDs, missions and workbenches.
- Scanlines appear only inside art frames (and very faintly behind code). Never over body text.
- One blinking cursor per screen at most. Idle status LEDs blink. Nothing else loops except the "current" progress segment's slow pulse.
- Glow is limited to small LEDs.

### Pixel art

All artwork is original, drawn as character grids in `src/art/sprites.ts` and rendered as SVG (`PixelSprite`). It is tiny (a few paths per sprite) and decorative (`aria-hidden`). Game sprites use tone pixels, so they match their area.

| Sprite         | Motif                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Home hero      | Retro terminal with code on screen, keyboard, plugged-in cartridge, circuit traces, blinking cursor |
| Foundations    | Training cartridge with a `>_` label, plus its manual                                               |
| Bug Hunt       | Corrupted terminal (red glitch line) with a bug crawling off it                                     |
| Code Breaker   | Security padlock, digital key, encrypted bits                                                       |
| Data Sorter    | Data crates sorted by height on an indexed shelf, one dropping into its slot                        |
| Function Forge | Input block → machine with gears and a `»` display → output block                                   |

### Buttons

- **Primary** (`.btn--primary`): solid tone fill. One per screen state (Start Learning, Apply patch, Next challenge…). A disabled primary keeps a faint tone outline so the next step stays visible.
- **Default** (`.btn`): outlined, for secondary choices (PLAY on Home, Review, Next concept).
- **Ghost** (`.btn--ghost`): navigation (← Games) and utilities (Reset).
- `.btn--go` adds a pixel ▶ arrow to forward actions.

## Screen patterns

- **Home = title screen:** hero terminal art, CODEBOUND logo, tagline, one primary path (Start / Continue / Review), PLAY, Foundations progress as a segmented bar, player XP badge.
- **Game selection = cartridge shelf:** each game is a cartridge: art window (CART 01, status LED), name in its tone, description, the concepts it teaches, one Play button.
- **Every challenge, top to bottom:**
  1. **HUD** (`GameHud`): sprite, game name, `MODULE 02 / 05` with a segmented bar, and a status readout (System: Corrupted → Patched / Still corrupted; Security: Locked → Unlocked / Still locked; Data core: Online → Sorted / Mismatch; Forge: Ready → Online / Fault; Training: Active → Complete).
  2. **Mission**: challenge number, title, objective.
  3. **Intel**: the short concept primer.
  4. **Interaction**: code + the controls. This is the largest part of the screen.
  5. **Action bar**: sticky at the bottom with a hint ("Pick a patch" → "Patch loaded") and the one primary action.
- **Feedback:** a SYSTEM ONLINE / SYSTEM ERROR strip with the XP earned, then the same plain-language teaching underneath (why your pick failed, the answer, why). The game framing never replaces the explanation.
- **Completion:** sprite with a one-shot pixel burst and a stamp ("BUG HUNT · RUN COMPLETE / MISSION COMPLETE / GAME MASTERED", or "· REPLAY"), then four tiles: XP earned this run, correct this run, modules complete (saved), mastered (saved). Below: game status with saved segments, what is left ("2 modules left to complete." / "Every module complete · 4 of 5 mastered"), the level meter, and actions: back (primary) plus **Retry unfinished** or **Replay**.
- **Foundations = training campaign:** numbered rows marked Complete (tick), Current (highlighted, primary Start) or Locked (dashed, dimmed).
- **Lessons = training terminals:** "Training module 03", a `>` prompt before the one-line idea, the example, then the "Code terminal · Try it" challenge.

## Motion and feedback

Short and never blocking: buttons press down, cards lift on hover, a correct answer pops the XP chip, a wrong answer shakes the panel once (0.3s), the top-bar badge floats "+100" (or "+100 · LEVEL UP") for about a second. `prefers-reduced-motion` turns all of it off.

## Accessibility

Body text stays in the system font. Muted text clears 4.5:1. Focus rings are tone-coloured and offset. Status changes are announced through `role="status"`. Progress bars expose `progressbar` values. Results always show words and icons as well as colour. Tap targets are at least about 44px. Pages stay usable at 375px with no horizontal scrolling.

## Core loop

**Learn a concept → Try a tiny example → Play a challenge → Get feedback → Progress**, and across visits: **PLAY → PROGRESS → MASTER → REPLAY**.

Home offers two ways in: **Start / Continue / Review Learning** (the Python Foundations path) and **Play** (straight to game selection). The path guides; it never traps the player in a course.

- Correct answer: +100 XP. Wrong answer: +25 XP, because a miss still teaches something. A wrong answer always explains why that choice fails.
- Level up every 300 XP.
- Finishing a Foundations concept for the first time gives a small +25 XP.
- Each challenge pays out only once (see Progression below), so replaying is for practice, not for XP.

## Progression and mastery

Progress is saved in the browser (`localStorage`) and restored on every visit: XP (level is always computed from it), completed Foundations concepts, every challenge's result, and finished runs per game. No accounts, no backend.

**Challenge states**

| State     | Meaning                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| Unplayed  | Never answered correctly (it may have been attempted and missed).                        |
| Completed | Answered correctly, but the first attempt was wrong.                                     |
| Mastered  | The very first attempt was correct. Mastery can only be earned then, never by replaying. |

**Game states**: **New** (nothing completed) · **In progress** (some completed) · **Complete** (all completed) · **Mastered** (all mastered).

**XP once per challenge.** A challenge pays the XP of its best result, once:

| Situation                                | XP                      |
| ---------------------------------------- | ----------------------- |
| First attempt, correct                   | +100 (and Mastered)     |
| First attempt, wrong                     | +25                     |
| Later, first correct answer after a miss | +75 (tops it up to 100) |
| Any other replay answer                  | 0 ("Replay · no XP")    |

So every challenge is worth at most 100 XP in total, and repeating content cannot farm XP. Concepts pay +25 once.

**Continue and replay.** Entering a game in progress **continues** at the first unfinished module and plays on to the end. **Replay** always starts at module 01. A replay uses the same challenges and explanations; the HUD marks modules already done as COMPLETE / MASTERED, and the saved result is only ever improved (missed → completed), never lowered.

**Where it shows:** cartridge status light + `MODULES 03 / 05` + saved segments (mastered segments have a bright top edge) and Play / Continue + Replay / Replay buttons; the in-game HUD; a MASTERED chip on a first-try win; the completion screen; Home's XP badge and Foundations bar.

**Reset.** A small "Reset local progress" text link sits in Home's footer. It opens an inline confirmation (Cancel focused first, Escape cancels); **Erase progress** removes only CODEBOUND's saved key and starts a fresh player.

## Python Foundations

Eight short lessons in order: Variables → Data types → Operators → Conditions → Lists → Indexing → Loops → Functions. Each is one screen: a one-sentence idea, a tiny example, one quick micro-challenge, and feedback. Then the player either practises in the linked game or moves to the next concept.

| Concepts                                         | Practised in   |
| ------------------------------------------------ | -------------- |
| Variables, Data types                            | Bug Hunt       |
| Operators, Conditions                            | Code Breaker   |
| Lists, Indexing, Loops                           | Data Sorter    |
| Functions (`def`, parameters, `return`, calling) | Function Forge |

Variables starts open. Answering a concept's micro-challenge completes it and unlocks the next. Completed concepts stay open for review.

## Games

- **Bug Hunt** (playable): find the broken line in a short script and choose the patch that fixes it. 5 beginner challenges: variables, arithmetic, strings, booleans, if/else.
- **Code Breaker** (playable): break 5 security locks with logic instead of fixing bugs. Each lock shows a rule and the system's current values. The player picks the condition or operator that enforces the rule (it fills a slot in the lock's code), or predicts what the code prints. Lessons cover `if`, comparison operators, `if / elif / else`, `and` / `or` / `not`, and combined conditions. The HUD's security status shows Locked → Unlocked / Still locked.
- **Function Forge** (playable): configure 7 function "modules" (define → call → one parameter → `return` → two parameters → trace → build). The player assembles code from tokens, taps arguments into a call's parameter slots, or picks a line / predicts a return value. The code updates live, and an INPUT → `function()` → OUTPUT pipeline shows the call; after running, a wrong call shows what it really returned (e.g. `-7` or a `NameError`). Forge status goes Ready → Online / Fault.
- **Data Sorter** (playable): organise data in 7 terminals by working with the list itself instead of picking from text answers. The player taps a cell ("what is at index 2?", "what does `pop(2)` remove?") or builds the resulting list from value tiles (assignment, `append()`, combined operations, `for`-loop output with `len()`). Lists are drawn as cells with zero-based index labels. Feedback shows the resulting list, what happened step by step, and the rule to remember.

_More detailed game design will be added only as phases are authorized._
