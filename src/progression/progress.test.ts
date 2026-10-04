import { describe, expect, it } from 'vitest'
import { levelForXp } from '../game/xp.ts'
import {
  applyAnswer,
  applyConcept,
  applyRunEnd,
  challengeKey,
  continueIndex,
  gameStates,
  gameStatus,
  newProgress,
  type Progress,
} from './progress.ts'

const answer = (p: Progress, id: string, correct: boolean) =>
  applyAnswer(p, 'bug-hunt', id, correct)

describe('progression rules', () => {
  it('starts a fresh player with nothing done', () => {
    const p = newProgress()
    expect(p.xp).toBe(0)
    expect(levelForXp(p.xp)).toBe(1)
    expect(p.concepts).toEqual([])
    expect(p.challenges).toEqual({})
  })

  it('pays the existing rewards on a first attempt', () => {
    const right = answer(newProgress(), 'a', true)
    expect(right.outcome).toEqual({
      xpEarned: 100,
      mastered: true,
      recovered: false,
      replay: false,
    })
    const wrong = answer(newProgress(), 'a', false)
    expect(wrong.outcome).toEqual({
      xpEarned: 25,
      mastered: false,
      recovered: false,
      replay: false,
    })
  })

  it('marks a first-try success mastered and a later clean success recovered', () => {
    const first = answer(newProgress(), 'a', true).progress
    expect(gameStates(first, 'bug-hunt', ['a'])).toEqual(['mastered'])

    const missed = answer(newProgress(), 'a', false).progress
    expect(gameStates(missed, 'bug-hunt', ['a'])).toEqual(['unplayed'])
    const fixed = answer(missed, 'a', true)
    expect(gameStates(fixed.progress, 'bug-hunt', ['a'])).toEqual(['recovered'])
    expect(fixed.outcome.mastered).toBe(false)
    expect(fixed.outcome.recovered).toBe(true)
  })

  it('never pays twice: replays earn nothing, a later fix tops up to 100', () => {
    let p = answer(newProgress(), 'a', true).progress
    const replay = answer(p, 'a', true)
    expect(replay.outcome).toEqual({
      xpEarned: 0,
      mastered: false,
      recovered: false,
      replay: true,
    })
    expect(answer(p, 'a', false).outcome.xpEarned).toBe(0)
    expect(replay.progress.xp).toBe(100)

    p = answer(newProgress(), 'b', false).progress
    expect(answer(p, 'b', false).outcome.xpEarned).toBe(0)
    const fix = answer(p, 'b', true)
    expect(fix.outcome.xpEarned).toBe(75)
    expect(fix.progress.xp).toBe(100)
    expect(answer(fix.progress, 'b', true).outcome.xpEarned).toBe(0)
  })

  it('keeps mastery even if a replay is answered wrong', () => {
    const p = answer(answer(newProgress(), 'a', true).progress, 'a', false)
    expect(p.progress.challenges[challengeKey('bug-hunt', 'a')]).toEqual({
      solved: true,
      mastered: true,
      recovered: false,
      xp: 100,
    })
  })

  it('a hint keeps the XP but prevents mastery on that attempt', () => {
    const hinted = applyAnswer(newProgress(), 'bug-hunt', 'a', true, true)
    expect(hinted.outcome).toEqual({
      xpEarned: 100,
      mastered: false,
      recovered: false,
      replay: false,
    })
    expect(gameStates(hinted.progress, 'bug-hunt', ['a'])).toEqual([
      'completed',
    ])
    // Replaying later without a hint cannot master it retroactively; a clean
    // solve recovers it instead (no XP: it already paid 100).
    const again = applyAnswer(hinted.progress, 'bug-hunt', 'a', true)
    expect(gameStates(again.progress, 'bug-hunt', ['a'])).toEqual(['recovered'])
    expect(again.outcome).toMatchObject({ xpEarned: 0, mastered: false })
  })

  it('a hint opened before a wrong first attempt changes nothing else', () => {
    const p = applyAnswer(newProgress(), 'bug-hunt', 'a', false, true)
    expect(p.outcome.xpEarned).toBe(25)
    const fixed = applyAnswer(p.progress, 'bug-hunt', 'a', true)
    expect(fixed.outcome.xpEarned).toBe(75)
    expect(fixed.progress.xp).toBe(100)
  })

  it('derives game status with recovered modules counted as complete', () => {
    expect(gameStatus(['recovered', 'unplayed'])).toBe('in-progress')
    expect(gameStatus(['recovered', 'mastered'])).toBe('complete')
  })

  it('pays a concept once', () => {
    const once = applyConcept(newProgress(), 'variables')
    expect(once.xpEarned).toBe(25)
    const twice = applyConcept(once.progress, 'variables')
    expect(twice.xpEarned).toBe(0)
    expect(twice.progress.concepts).toEqual(['variables'])
  })

  it('derives game status from challenge states', () => {
    expect(gameStatus(['unplayed', 'unplayed'])).toBe('new')
    expect(gameStatus(['completed', 'unplayed'])).toBe('in-progress')
    expect(gameStatus(['completed', 'mastered'])).toBe('complete')
    expect(gameStatus(['mastered', 'mastered'])).toBe('mastered')
  })

  it('continues at the first unfinished challenge, or 0 when all are done', () => {
    expect(continueIndex(['mastered', 'unplayed', 'unplayed'])).toBe(1)
    expect(continueIndex(['mastered', 'completed', 'unplayed'])).toBe(2)
    expect(continueIndex(['mastered', 'completed'])).toBe(0)
    expect(continueIndex(['unplayed'])).toBe(0)
  })

  it('counts runs and keeps the best full run', () => {
    let p = applyRunEnd(newProgress(), 'bug-hunt', {
      fullRun: true,
      correct: 3,
    })
    p = applyRunEnd(p, 'bug-hunt', { fullRun: true, correct: 2 })
    p = applyRunEnd(p, 'bug-hunt', { fullRun: false, correct: 5 })
    expect(p.games['bug-hunt']).toEqual({ runs: 3, bestRun: 3 })
  })
})

describe('recovery', () => {
  const key = challengeKey('bug-hunt', 'a')
  const hinted = (p: Progress, correct: boolean) =>
    applyAnswer(p, 'bug-hunt', 'a', correct, true)

  it('a first-try miss is neither mastered nor recovered', () => {
    const p = answer(newProgress(), 'a', false).progress
    expect(p.challenges[key]).toEqual({
      solved: false,
      mastered: false,
      recovered: false,
      xp: 25,
    })
  })

  it('the first clean solve after a miss recovers it, paying only the +75 top-up', () => {
    const missed = answer(newProgress(), 'a', false).progress
    const fixed = answer(missed, 'a', true)
    expect(fixed.outcome).toEqual({
      xpEarned: 75,
      mastered: false,
      recovered: true,
      replay: true,
    })
    expect(fixed.progress.challenges[key]).toEqual({
      solved: true,
      mastered: false,
      recovered: true,
      xp: 100,
    })
  })

  it('a hinted solve after a miss does not recover; a later clean one does', () => {
    let p = answer(newProgress(), 'a', false).progress
    const withHint = hinted(p, true)
    expect(withHint.outcome).toMatchObject({ xpEarned: 75, recovered: false })
    p = withHint.progress
    expect(gameStates(p, 'bug-hunt', ['a'])).toEqual(['completed'])
    const clean = answer(p, 'a', true)
    expect(clean.outcome).toMatchObject({ xpEarned: 0, recovered: true })
  })

  it('a recovered challenge never becomes mastered, and stays recovered', () => {
    let p = answer(newProgress(), 'a', false).progress
    p = answer(p, 'a', true).progress
    for (const correct of [true, false, true]) {
      const r = answer(p, 'a', correct)
      expect(r.outcome).toMatchObject({
        xpEarned: 0,
        mastered: false,
        recovered: false,
      })
      p = r.progress
    }
    expect(p.challenges[key]).toEqual({
      solved: true,
      mastered: false,
      recovered: true,
      xp: 100,
    })
  })

  it('a mastered challenge never becomes recovered', () => {
    let p = answer(newProgress(), 'a', true).progress
    p = answer(p, 'a', false).progress
    p = answer(p, 'a', true).progress
    expect(p.challenges[key]).toMatchObject({
      mastered: true,
      recovered: false,
    })
    expect(gameStates(p, 'bug-hunt', ['a'])).toEqual(['mastered'])
  })

  it('a wrong answer pays its normal +25 and never recovers', () => {
    const p = answer(answer(newProgress(), 'a', false).progress, 'a', false)
    expect(p.outcome).toMatchObject({ xpEarned: 0, recovered: false })
  })
})
