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

**Home → Choose a game → Read a short concept → Solve a challenge → Instant feedback + explanation → Earn XP → Continue**

- Correct answer: +100 XP. Wrong answer: +25 XP, because a miss still teaches something. A wrong answer always explains why that choice fails.
- Level up every 300 XP.

## Games

- **Bug Hunt** (playable): find the broken line in a short script and choose the patch that fixes it. 5 beginner challenges: variables, arithmetic, strings, booleans, if/else.
- **Code Breaker** (playable): break 5 security locks with logic instead of fixing bugs. Each lock shows a rule and the system's current values. The player picks the condition or operator that enforces the rule (it fills a slot in the lock's code), or predicts what the code prints. Lessons cover `if`, comparison operators, `if / elif / else`, `and` / `or` / `not`, and combined conditions. A lock status badge shows Locked → Unlocked / Still locked.
- **Data Sorter** (locked): lists.

_More detailed game design will be added only as phases are authorized._
