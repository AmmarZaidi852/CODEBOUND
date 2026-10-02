# CODEBOUND — Design

## Vision

CODEBOUND is a simple game-style Python learning platform where players learn programming by completing interactive challenges and games.

**The learning experience is the main product.** Game elements exist to make practicing Python feel engaging, not to replace it.

## Principles

- Fun interactive learning comes first; visual spectacle comes last.
- It should feel like a polished indie learning game — not an enterprise LMS, and not a sprawling RPG.
- Coding should feel like playing.

## Look & feel

Dark, clean, modern, game-like, slightly futuristic, responsive, focused. No childish UI, excessive animation, giant dashboards, or cluttered HUDs.

## Core loop

**Learn a concept → Try a tiny example → Play a challenge → Get feedback → Progress**

Home offers two ways in: **Start / Continue Learning** (the Python Foundations path) and **Play** (straight to game selection). The path guides; it never traps the player in a course.

- Correct answer: +100 XP. Wrong answer: +25 XP, because a miss still teaches something. A wrong answer always explains why that choice fails.
- Level up every 300 XP.
- Finishing a Foundations concept for the first time gives a small +25 XP.

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
- **Code Breaker** (playable): break 5 security locks with logic instead of fixing bugs. Each lock shows a rule and the system's current values. The player picks the condition or operator that enforces the rule (it fills a slot in the lock's code), or predicts what the code prints. Lessons cover `if`, comparison operators, `if / elif / else`, `and` / `or` / `not`, and combined conditions. A lock status badge shows Locked → Unlocked / Still locked.
- **Function Forge** (playable): configure 7 function "modules" (define → call → one parameter → `return` → two parameters → trace → build). The player assembles code from tokens, taps arguments into a call's parameter slots, or picks a line / predicts a return value. The code updates live, and an INPUT → `function()` → OUTPUT pipeline shows the call; after running, a wrong call shows what it really returned (e.g. `-7` or a `NameError`). Module status goes Idle → Online / Fault.
- **Data Sorter** (playable): organise data in 7 terminals by working with the list itself instead of picking from text answers. The player taps a cell ("what is at index 2?", "what does `pop(2)` remove?") or builds the resulting list from value tiles (assignment, `append()`, combined operations, `for`-loop output with `len()`). Lists are drawn as cells with zero-based index labels. Feedback shows the resulting list, what happened step by step, and the rule to remember.

_More detailed game design will be added only as phases are authorized._
