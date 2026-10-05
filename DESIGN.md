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
- Each area has one **tone**, set with `data-theme` on the screen root: Foundations green, Bug Hunt amber, Code Breaker magenta, Data Sorter cyan, Function Forge violet, the Arcade a neutral silver (where every area meets), and the Mastery Lab the system green. `--tone`, `--tone-dim` and `--tone-wash` follow it, so the same component recolours itself per game.
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
| Arcade         | Arcade cabinet; four chips in the area colours are wired into one screen                            |
| Mastery Lab    | Training console fed by a core chip (three arrows down into a screen with a segmented bar)          |

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

| State     | Meaning                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Unplayed  | Never answered correctly (it may have been attempted and missed).                                               |
| Completed | Answered correctly, but not cleared yet: the first attempt was wrong (or used a hint) and no clean solve since. |
| Recovered | Missed (or hinted) first, then solved correctly **without a hint** on a later attempt. Cleared.                 |
| Mastered  | The very first attempt was correct, without a hint. Only earned then, never by replaying. Cleared.              |

Two ways to clear a module: **first try → MASTERED**, or **miss → practice → RECOVERED**. The first clean solve after a miss is enough: no streaks, timers or repeats. Recovery pays no XP of its own (the first solve after a miss still pays its +75 top-up, as before). A recovered module never becomes mastered, and a mastered one is never recovered. A hinted solve doesn't recover a module; a later clean solve does. Recovery shows as a **RECOVERED** chip on the result strip, a RECOVERED mark on the HUD when replaying, and a Recovered tile on the completion screen. MASTERED keeps its first-try meaning everywhere.

**Game states**: **New** (nothing completed) · **In progress** (some completed) · **Complete** (all completed or recovered) · **Mastered** (all first-try mastered).

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

## Write modules (real code)

Every game mixes four kinds of play: **Choose** (pick a patch, condition or line), **Build** (assemble tokens, tap list tiles or arguments), **Predict** (what does this print / return?) and **Write** (type real Python). Write modules sit right after the challenge that introduces the same idea, so the player meets it by choosing or building first, then writes it.

| Game           | Write modules                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------- |
| Bug Hunt       | Ticket Counter (fix `+` to `*`), Broken Badge (join text and a number with `str()`)           |
| Code Breaker   | Vault Threshold (repair `>` to `>=`), Access Rule (write `pin == 1234 and level >= 3`)        |
| Data Sorter    | Fix the Reading (`readings[1] = 30`), Queue Intake (`queue.append(25)`)                       |
| Function Forge | Doubler (`return x * 2`), Adder (define `add(a, b)`), Use It (call `area(4, 6)` and print it) |

**Screen:** HUD → mission with a WRITE tag, the Goal (and a system readout or the starting list when needed) → Intel → the **code terminal** → hints → sticky **Check code**.

**The code terminal** is CODEBOUND's own editor, not an IDE: the same dark terminal frame as code blocks, line numbers, light keyword / string / number colouring (meaning never depends on colour), a tone-coloured caret and focus ring, and Reset. Enter keeps the indent and adds one level after `:`; Backspace in leading spaces removes one level; Tab is not captured, so keyboard users can always leave. Text is 16px so phones don't zoom; long lines scroll inside the editor.

**Checking.** Check is enabled once the code differs from the starter (and from the last checked version). The code runs in a small, controlled simulator of the Python subset the lessons teach (see `ARCHITECTURE.md`). **CODEBOUND never executes user code as real Python or as JavaScript.** Each module defines test cases (system values given, then expected output, final variables or function return values) and a few requirements (e.g. "use `append()`", "don't type the 24 yourself"). Equivalent solutions pass (`x * 2` or `2 * x`, `print("a", b)` or `"a " + str(b)`).

**Feedback says what the checker found, not just "wrong":** "When power = 50, your code printed LOCKED. It should print OPEN." · "You changed index 2, which is the third item…" · "`double(4)` printed 8 but returned None. Use `return`…" · "Line 3 · TypeError: can only concatenate str…". The player's output (or resulting list, as cells) is shown. The solution is never shown unless the player presses **Show solution**; otherwise the next step is **Try again**.

**Hints.** Three per module, revealed one at a time: an idea → the syntax → the shape (e.g. `total = price ___ count`). They never contain the finished line. Hints cost no XP. Rule: **a module solved after opening a hint is completed, not mastered** (the editor says so before and after the first hint).

**Attempts and mastery** (same rules as every module):

- Opening, editing, Reset and hints are not attempts. Pressing Check is.
- First Check correct (no hint) → **Mastered**, +100. First Check wrong → +25, then the player may retry; the first correct Check after that pays +75 (100 total) and is **Completed**. Further checks pay 0.
- Replays pay nothing ("Replay · no XP") and never remove mastery.

## Difficulty tiers

Each game is played in three short sections, so a session stays small and the next step is always clear:

| Tier     | Modules             | What it asks                                                               |
| -------- | ------------------- | -------------------------------------------------------------------------- |
| CORE     | the game's own 7–10 | One idea at a time (the modules above, write modules included).            |
| ADVANCED | 4–5                 | Two or more taught ideas combined; a mix of Choose, Build, Predict, Write. |
| BOSS     | 1                   | One real program that brings 3+ ideas together. Always Write.              |

| Game           | Advanced                                                                                                                | Boss                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Bug Hunt       | Member Discount (choose), Average Score (write), Life Counter (choose), Score Bonus (write)                             | Shop Checkout (three bugs) |
| Code Breaker   | Override Switch (predict), Shift Scheduler (write), Twin Gates (predict), Cooling Relay (choose)                        | Vault Core                 |
| Data Sorter    | Threshold Filter (build), Count Alerts (write), Inventory Shuffle (build), Shifted Slot (choose), Running Total (build) | Sensor Repair              |
| Function Forge | Fee Calculator (predict), Score Total (write), Double Trace (predict), Bonus Chain (predict), Power Limiter (write)     | Shipping Rule              |

The first two Advanced modules of each game came with the tiers (Phase 9). The rest (Phase 13) ask the player to trace or repair code: a variable updated across lines, `or` versus `and`, `elif` boundaries, list indexes that shift after a `pop`, a total carried through a loop, returned values reused.

Advanced and boss modules only use concepts the player has already been taught by that game's Foundations lessons and core modules.

- **A run plays one section.** Its completion screen stamps _Core complete_, _Advanced complete_, _Boss cleared_ or _Boss mastered_ and suggests the next step: Retry unfinished, Play Advanced, Play Boss, or Replay.
- **The boss unlocks** once every CORE and ADVANCED module is complete (a missed module still has to be solved). Continue walks CORE → ADVANCED → BOSS.
- **Same rules everywhere:** XP, mastery, hints and replay work exactly as for any module. A first-try boss is _mastered_; a missed or hinted one is _cleared_.
- **Where it shows:** cartridges read `CORE 07/07 · ADVANCED 01/04 · BOSS LOCKED / READY / CLEARED / MASTERED`; missions carry a small ADVANCED / BOSS MODULE tag; the boss gets a heavier frame and a _SYSTEM CRITICAL · FINAL TEST_ strip. The Conditions, Lists, Loops and Functions lessons mention where the idea is combined later.
- **When a boss is already cleared** (replaying the Advanced section of a finished game), the completion screen says _Boss already cleared_ / _mastered_ and offers **Replay Boss**, never "Boss module ready".
- **Saves from before new Advanced modules were added** (Phase 13) keep everything they earned: XP, records, boss cleared / mastered and the Arcade unlock. The game reads _In progress_ again (`ADVANCED 02/04 · BOSS MASTERED`), Continue opens the first new module, and each new module pays the normal XP. The Mastery Lab lists them as _New challenge_, so Home's Lab panel reads _Practise your next targets_ until they are cleared. The boss is not locked again.

## Arcade Run

A replayable **mode**, not a fifth game: one short run that mixes ideas from all four games, so the player has to recognise what each problem needs outside the game where they learned it. It teaches no new Python and has no XP or progression of its own.

**Unlock.** Once every CORE module of all four games is complete (missed-then-solved counts; mastery is not needed, nor any Advanced or Boss module). Before that the cartridge reads _Arcade locked_ with "Complete the Core modules in all four games." and `CORE n/4 GAMES`. The unlock is derived from saved progress, so it survives reloads.

**The run: 8 modules**, a deliberate curve, never the same interaction three times in a row:

| #   | Module                 | From           | Kind    | Ideas                                                  |
| --- | ---------------------- | -------------- | ------- | ------------------------------------------------------ |
| 1   | Average Disaster       | Bug Hunt       | Choose  | variables, operators                                   |
| 2   | Delivery Gate _(new)_  | Arcade         | Write   | `>=`, `and`, `not`                                     |
| 3   | Purge Slot             | Data Sorter    | Choose  | lists, indexing                                        |
| 4   | Signal Doubler         | Data Sorter    | Build   | loops                                                  |
| 5   | Trace It               | Function Forge | Predict | functions                                              |
| 6   | Score Total (advanced) | Function Forge | Write   | functions + lists + loops                              |
| 7   | Override Switch (adv.) | Code Breaker   | Predict | and / or / not with brackets                           |
| 8   | Shield Breach _(new)_  | Arcade         | Write   | **Final Run**: function, loop, `if`, maths, three bugs |

Modules are referenced by id, so each challenge keeps one definition and its progress is shared with its game (solving Score Total here also completes it in Function Forge). Only two challenges are new, and both use taught syntax only. Delivery Gate moves Code Breaker's idea into a new setting ("at least 5 packages and the dock not locked"). Shield Breach is the Final Run: repair a function that resets its total inside the loop, adds the whole hit instead of the part above the shield, and prints instead of returning.

**Screen.** Each module is played by its own game's round, in that game's colours, under one HUD: `ARCADE RUN · MODULE 03 / 08`. The last module carries a _FINAL RUN_ tag and an _Arcade final · Every system at once_ strip (it is not called a boss). After a miss, one quiet line names the module's concepts and points to Python Foundations; the run is never interrupted.

**Rules (unchanged):** XP, mastery, hints and replays work exactly as in the games. Each challenge pays its best result once (+100 first try, +25 then +75, replays 0), whichever mode it is played in; there is no multiplier and no completion bonus. Mastery is the normal one (first check, no hint, saved per challenge); a wrong Arcade answer never removes it.

**Continue / Replay.** Position and counts are saved after every answer. Leaving or reloading keeps the run: the cartridge shows _In progress · Module 04 / 08_ with **Continue Arcade** (back to that module) and Replay (a new run from 01). A finished run shows **Replay Arcade**.

**Completion.** _Run complete_: XP earned, correct /8, first try /8, accuracy (correct checks ÷ all checks), checks, how many of the 8 are mastered in saved progress, the concepts covered, and the best run. Then Back to games / Replay run.

**Best run.** Recorded only when a run reaches module 8. It keeps one record, compared by correct, then first-try solves, then accuracy: `BEST 7/8 · 6 FIRST TRY · 78%`. A better replay replaces it (_New best run_); a worse one doesn't. Beating it pays no XP. "First try" is counted for the run (solved on its first check without a hint), because saved mastery can't change on a replay.

**Home** shows a small `ARCADE READY · 8 MODULE RUN` (or _in progress_) line once unlocked; the main Learning / Play buttons are unchanged. **Reset local progress** clears the Arcade run and best run with everything else.

## Mastery Lab

A training room that answers "I have played CODEBOUND. What should I practise next?". It is not a game and has no XP, streaks or rewards of its own: it only points at existing modules.

**Access.** Once the player has solved one challenge, Home shows a small secondary panel (_MASTERY LAB · 3 modules need practice_ / _All current modules mastered_, with **Open Lab** / **Review**). The main Learning / Play buttons are unchanged.

**Next targets (top 5).** Every released module the player can open now is ranked by a fixed set of rules. There is no randomness, so the same progress always gives the same list:

| #   | Reason tag        | Module                                            |
| --- | ----------------- | ------------------------------------------------- |
| 1   | MISSED BEFORE     | answered, still not solved                        |
| 2   | NOT MASTERED      | a core module solved with a hint, not cleared yet |
| 3   | ADVANCED PRACTICE | an advanced module solved, not cleared yet        |
| 4   | BOSS PRACTICE     | a boss solved, not cleared yet                    |
| 5   | NEW CHALLENGE     | unlocked, never played                            |
| 6   | (never listed)    | recovered: cleared through practice               |
| 7   | (never listed)    | mastered: cleared on the first try                |

Ties take turns across games (each game's first, then each game's second…), so the list mixes areas. "Open now" mirrors the games: Core always, Advanced once that game's Core is complete, the Boss once it is ready, the Arcade's own modules once the Arcade unlocks. Locked or unreleased modules never appear. Each card shows rank, title, game and tier (_Arcade · Final Run_ for Shield Breach), the reason tag, its concepts and **Practice**.

**Practice.** It opens the canonical module exactly as in its game (same round, HUD, labels and colours), under a slim _MASTERY LAB · reason_ strip. Answers are recorded through the game's own `answer()`. XP, mastery, hints and replays therefore follow the normal rules: +100 first try, +25 for a first miss, +75 for the first solve after a miss, then 0. There are no multipliers or bonuses. After the normal feedback, a compact result shows the saved state (Mastered / Recovered / Completed, not cleared / Not solved yet), the XP this practice, what can still be earned, the next target, and **Next practice** / **Back to Lab**. Next practice opens the top recommendation other than the module just practised.

**Concept status.** One row per Foundations concept: a segmented bar and count of cleared modules using it (mastered segments brighter), plus a word (_Mastered_ / _Recovered_ when everything is cleared and some recovered / _Practice_ / _Not started_). The detail reads e.g. _5 / 7 mastered · 1 recovered · 1 to clear_. Every row is a button that opens that concept's top three recommendations and a **Practice <concept>** button. It also says whether the lesson is done. No new lessons; it only connects concepts to existing modules.

**All current modules cleared.** When every released module is mastered or recovered, the targets give way to _ALL CURRENT MODULES CLEARED_ with the first-try mastered and recovered counts, **Replay Arcade**, **Review Foundations** and **Back to Home**. Only when every module is first-try mastered does it say _ALL CURRENT MODULES MASTERED_ instead. Home's Lab panel uses the same two phrases. The wording leaves room for future content.

## Python Foundations

Eight short lessons in order: Variables → Data types → Operators → Conditions → Lists → Indexing → Loops → Functions. Each is one screen: a one-sentence idea, a tiny example, one quick micro-challenge, and feedback. Then the player either practises in the linked game or moves to the next concept.

| Concepts                                         | Practised in   |
| ------------------------------------------------ | -------------- |
| Variables, Data types                            | Bug Hunt       |
| Operators, Conditions                            | Code Breaker   |
| Lists, Indexing, Loops                           | Data Sorter    |
| Functions (`def`, parameters, `return`, calling) | Function Forge |

Variables starts open. Answering a concept's micro-challenge completes it and unlocks the next. Completed concepts stay open for review. Each lesson's Try it notes that its linked game has **Write** modules where you type the code yourself.

## Games

- **Bug Hunt** (playable, 12 modules: 7 core + 4 advanced + 1 boss): find the broken line in a short script and choose the patch that fixes it (variables, arithmetic, strings, booleans, if/else), plus 2 write modules where the player fixes the code by typing.
- **Code Breaker** (playable, 12 modules: 5 locks + 2 write modules + 4 advanced + 1 boss; in the write modules the player repairs or writes the condition and it is tested against several system states): break security locks with logic instead of fixing bugs. Each lock shows a rule and the system's current values. The player picks the condition or operator that enforces the rule (it fills a slot in the lock's code), or predicts what the code prints. Lessons cover `if`, comparison operators, `if / elif / else`, `and` / `or` / `not`, and combined conditions. The HUD's security status shows Locked → Unlocked / Still locked.
- **Function Forge** (playable, 16 modules: 10 core + 5 advanced + 1 boss): configure function "modules" (define → call → one parameter → `return` → write a `return` → two parameters → write a two-parameter function → trace → build → write a call). The player assembles code from tokens, taps arguments into a call's parameter slots, or picks a line / predicts a return value. The code updates live, and an INPUT → `function()` → OUTPUT pipeline shows the call; after running, a wrong call shows what it really returned (e.g. `-7` or a `NameError`). Forge status goes Ready → Online / Fault.
- **Data Sorter** (playable, 15 modules: 7 terminals + 2 write modules + 5 advanced + 1 boss; in the write modules the player types the list operation and sees the resulting list as cells): organise data by working with the list itself instead of picking from text answers. The player taps a cell ("what is at index 2?", "what does `pop(2)` remove?") or builds the resulting list from value tiles (assignment, `append()`, combined operations, `for`-loop output with `len()`). Lists are drawn as cells with zero-based index labels. Feedback shows the resulting list, what happened step by step, and the rule to remember.

_More detailed game design will be added only as phases are authorized._
