import { describe, expect, it } from 'vitest'
import { gameChallengeIds, gameModuleTiers } from '../content/gameChallenges.ts'
import { games } from '../content/games.ts'
import {
  applyArcadeAnswer,
  arcadeStatus,
  arcadeUnlocked,
  isBetterRun,
  leaveArcadeModule,
  startArcade,
  type ArcadeAnswer,
} from './arcade.ts'
import {
  applyAnswer,
  challengeKey,
  newProgress,
  type ChallengeSource,
  type Progress,
} from './progress.ts'
import { loadProgress, sanitize, saveProgress } from './storage.ts'

// A short stand-in run: two existing challenges and one Arcade-only one.
const refs: { source: ChallengeSource; id: string }[] = [
  { source: 'bug-hunt', id: 'variables' },
  { source: 'code-breaker', id: 'vault-threshold' },
  { source: 'arcade', id: 'final' },
]
const TOTAL = refs.length

/** A copy of `obj` without `key`. */
const without = <T extends object>(obj: T, key: string) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key))

const right: ArcadeAnswer = { correct: true, hinted: false, canRetry: false }
const wrong: ArcadeAnswer = { correct: false, hinted: false, canRetry: false }
const wrongWrite: ArcadeAnswer = { ...wrong, canRetry: true }
const rightWrite: ArcadeAnswer = { ...right, canRetry: true }

/** Answers the current module. */
function answer(p: Progress, a: ArcadeAnswer) {
  return applyArcadeAnswer(p, refs[p.arcade.run!.at], TOTAL, a)
}

/** Plays a whole run from `p`, one answer list per module. */
function play(p: Progress, answers: ArcadeAnswer[][]) {
  let progress = startArcade(p)
  for (const [i, list] of answers.entries()) {
    for (const a of list) progress = answer(progress, a).progress
    progress = leaveArcadeModule(progress, i, TOTAL).progress
  }
  return progress
}

/** Every CORE module of the given games solved. */
function coreDone(ids = games.map((g) => g.id)) {
  let p = newProgress()
  for (const game of ids) {
    gameChallengeIds[game].forEach((id, i) => {
      if (gameModuleTiers[game][i] === 'core') {
        p = applyAnswer(p, game, id, true).progress
      }
    })
  }
  return p
}

describe('arcade unlock', () => {
  it('is locked for a new player and until every core tier is complete', () => {
    expect(arcadeUnlocked(newProgress())).toBe(false)
    expect(arcadeStatus(newProgress())).toBe('locked')
    expect(arcadeUnlocked(coreDone(['bug-hunt', 'code-breaker']))).toBe(false)
    // One missing core module keeps it locked.
    const p = coreDone()
    const key = challengeKey('function-forge', 'define')
    expect(
      arcadeUnlocked({ ...p, challenges: without(p.challenges, key) }),
    ).toBe(false)
  })

  it('unlocks once all four core tiers are complete, missed or not', () => {
    expect(arcadeUnlocked(coreDone())).toBe(true)
    expect(arcadeStatus(coreDone())).toBe('new')
    // Completed after a miss still counts; mastery is not required.
    const key = challengeKey('bug-hunt', 'variables')
    let p: Progress = {
      ...coreDone(),
      challenges: without(coreDone().challenges, key),
    }
    p = applyAnswer(p, 'bug-hunt', 'variables', false).progress
    expect(arcadeUnlocked(p)).toBe(false)
    p = applyAnswer(p, 'bug-hunt', 'variables', true).progress
    expect(p.challenges[key].mastered).toBe(false)
    expect(arcadeUnlocked(p)).toBe(true)
  })

  it('does not need any advanced or boss module', () => {
    const p = coreDone()
    const advanced = Object.keys(p.challenges).filter((k) =>
      ['member-discount', 'shop-checkout', 'shipping-rule'].some((id) =>
        k.endsWith(`:${id}`),
      ),
    )
    expect(advanced).toEqual([])
    expect(arcadeUnlocked(p)).toBe(true)
  })

  it('stays unlocked after a reload', () => {
    saveProgress(coreDone())
    expect(arcadeUnlocked(loadProgress())).toBe(true)
  })
})

describe('arcade run progression', () => {
  it('a new run starts at module 1 and is in progress', () => {
    const p = startArcade(coreDone())
    expect(p.arcade.run?.at).toBe(0)
    expect(arcadeStatus(p)).toBe('in-progress')
  })

  it('moves on once a module is settled; a missed write module waits for a retry', () => {
    let p = startArcade(coreDone())
    p = answer(p, right).progress
    expect(p.arcade.run?.at).toBe(1)
    p = answer(p, wrongWrite).progress
    expect(p.arcade.run).toMatchObject({ at: 1, tries: 1 })
    p = answer(p, rightWrite).progress
    expect(p.arcade.run).toMatchObject({ at: 2, tries: 0, correct: 2 })
  })

  it('leaving an unsolved module moves on once; repeating it does nothing', () => {
    let p = startArcade(coreDone())
    p = answer(p, right).progress
    p = answer(p, wrongWrite).progress
    const left = leaveArcadeModule(p, 1, TOTAL).progress
    expect(left.arcade.run?.at).toBe(2)
    expect(leaveArcadeModule(left, 1, TOTAL).progress).toBe(left)
  })

  it('a replay (new run) starts again at module 1', () => {
    let p = startArcade(coreDone())
    p = answer(p, right).progress
    expect(startArcade(p).arcade.run?.at).toBe(0)
  })

  it('completes after the last module and keeps the run count', () => {
    const p = play(coreDone(), [[right], [right], [right]])
    expect(p.arcade.run).toBeNull()
    expect(p.arcade.runs).toBe(1)
    expect(arcadeStatus(p)).toBe('complete')
  })

  it('reports the finished run from the answer that ends it', () => {
    let p = startArcade(coreDone())
    p = answer(p, right).progress
    p = answer(p, right).progress
    const last = answer(p, right)
    expect(last.finished).toMatchObject({ correct: 3, firstTry: 3, checks: 3 })
    expect(answer(p, wrongWrite).finished).toBeNull()
  })

  it('an interrupted run survives a reload', () => {
    let p = startArcade(coreDone())
    p = answer(p, right).progress
    p = answer(p, wrongWrite).progress
    saveProgress(p)
    expect(loadProgress().arcade.run).toEqual(p.arcade.run)
  })
})

describe('arcade XP and mastery use the normal rules', () => {
  it('first try +100 and mastered; the run pays exactly that', () => {
    // `variables` was already solved in Bug Hunt, so the arcade pays 0.
    const r = answer(startArcade(coreDone()), right)
    expect(r.outcome).toEqual({ xpEarned: 0, mastered: false, replay: true })
    const fresh = startArcade(newProgress())
    const first = answer(fresh, right)
    expect(first.outcome).toEqual({
      xpEarned: 100,
      mastered: true,
      replay: false,
    })
    expect(first.progress.arcade.run?.xp).toBe(100)
    expect(first.progress.xp).toBe(100)
  })

  it('wrong then right pays +25 then +75 and is completed, not mastered', () => {
    let p = startArcade(newProgress())
    p = answer(p, right).progress
    const miss = answer(p, wrongWrite)
    expect(miss.outcome.xpEarned).toBe(25)
    const fix = answer(miss.progress, rightWrite)
    expect(fix.outcome.xpEarned).toBe(75)
    const record =
      fix.progress.challenges[challengeKey('code-breaker', 'vault-threshold')]
    expect(record).toEqual({ solved: true, mastered: false, xp: 100 })
    expect(fix.progress.arcade.run).toMatchObject({ correct: 2, firstTry: 1 })
  })

  it('replays pay 0 and the run has no multiplier', () => {
    const first = play(newProgress(), [[right], [rightWrite], [rightWrite]])
    expect(first.xp).toBe(300)
    const again = play(first, [[right], [rightWrite], [rightWrite]])
    expect(again.xp).toBe(300)
  })

  it('a hint prevents mastery and the first-try count', () => {
    let p = startArcade(newProgress())
    p = answer(p, right).progress
    const hinted = answer(p, { ...rightWrite, hinted: true })
    expect(hinted.outcome).toMatchObject({ xpEarned: 100, mastered: false })
    expect(hinted.progress.arcade.run?.firstTry).toBe(1)
  })

  it('a wrong answer in the arcade never removes existing mastery', () => {
    const mastered = applyAnswer(newProgress(), 'bug-hunt', 'variables', true)
    const r = answer(startArcade(mastered.progress), wrong)
    expect(r.outcome.xpEarned).toBe(0)
    expect(
      r.progress.challenges[challengeKey('bug-hunt', 'variables')],
    ).toEqual({ solved: true, mastered: true, xp: 100 })
  })

  it('arcade-only challenges are saved under their own source', () => {
    const p = play(newProgress(), [[right], [rightWrite], [rightWrite]])
    expect(p.challenges[challengeKey('arcade', 'final')]).toEqual({
      solved: true,
      mastered: true,
      xp: 100,
    })
  })
})

describe('arcade best run', () => {
  const perfect = [[right], [rightWrite], [rightWrite]]
  const shaky = [[wrong], [wrongWrite, rightWrite], [rightWrite]]

  it('records correct, first-try and accuracy for a finished run', () => {
    const p = play(coreDone(), shaky)
    // 2 of 3 solved, 1 on its first check; 2 correct of 4 checks.
    expect(p.arcade.best).toEqual({ correct: 2, firstTry: 1, accuracy: 50 })
  })

  it('an incomplete run is never recorded', () => {
    let p = startArcade(coreDone())
    p = answer(p, right).progress
    p = answer(p, right).progress
    expect(p.arcade.best).toBeNull()
    expect(p.arcade.runs).toBe(0)
  })

  it('a better run replaces the best; a worse one does not', () => {
    const first = play(coreDone(), shaky)
    const better = play(first, perfect)
    expect(better.arcade.best).toEqual({
      correct: 3,
      firstTry: 3,
      accuracy: 100,
    })
    const worse = play(better, shaky)
    expect(worse.arcade.best).toEqual(better.arcade.best)
    expect(worse.arcade.runs).toBe(3)
  })

  it('ties prefer more first-try solves, then accuracy', () => {
    const base = { correct: 3, firstTry: 2, accuracy: 60 }
    expect(isBetterRun({ ...base, firstTry: 3 }, base)).toBe(true)
    expect(isBetterRun({ ...base, accuracy: 75 }, base)).toBe(true)
    expect(isBetterRun(base, base)).toBe(false)
    expect(isBetterRun({ ...base, correct: 2, firstTry: 2 }, base)).toBe(false)
  })
})

describe('arcade storage', () => {
  it('older saves without an arcade record load with an empty one', () => {
    const old = without(newProgress(), 'arcade')
    expect(sanitize(old).arcade).toEqual({ run: null, runs: 0, best: null })
  })

  it('drops a corrupt run or best record', () => {
    const p = sanitize({
      ...newProgress(),
      arcade: {
        run: { at: 1, correct: 5, checks: 2, correctChecks: 9 },
        runs: 'x',
        best: { correct: 1, firstTry: 4, accuracy: 50 },
      },
    })
    expect(p.arcade).toEqual({ run: null, runs: 0, best: null })
  })

  it('drops a run whose position is past the end of the run', () => {
    const run = {
      at: 8,
      tries: 0,
      correct: 0,
      firstTry: 0,
      checks: 0,
      correctChecks: 0,
      xp: 0,
    }
    expect(
      sanitize({ ...newProgress(), arcade: { run, runs: 0, best: null } })
        .arcade.run,
    ).toBeNull()
    expect(
      sanitize({
        ...newProgress(),
        arcade: { run: { ...run, at: 7 }, runs: 0, best: null },
      }).arcade.run,
    ).toEqual({ ...run, at: 7 })
  })

  it('caps accuracy at 100', () => {
    const p = sanitize({
      ...newProgress(),
      arcade: {
        run: null,
        runs: 1,
        best: { correct: 3, firstTry: 1, accuracy: 250 },
      },
    })
    expect(p.arcade.best?.accuracy).toBe(100)
  })
})
