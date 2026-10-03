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
      replay: false,
    })
    const wrong = answer(newProgress(), 'a', false)
    expect(wrong.outcome).toEqual({
      xpEarned: 25,
      mastered: false,
      replay: false,
    })
  })

  it('marks a first-try success mastered and a later success completed', () => {
    const first = answer(newProgress(), 'a', true).progress
    expect(gameStates(first, 'bug-hunt', ['a'])).toEqual(['mastered'])

    const missed = answer(newProgress(), 'a', false).progress
    expect(gameStates(missed, 'bug-hunt', ['a'])).toEqual(['unplayed'])
    const fixed = answer(missed, 'a', true)
    expect(gameStates(fixed.progress, 'bug-hunt', ['a'])).toEqual(['completed'])
    expect(fixed.outcome.mastered).toBe(false)
  })

  it('never pays twice: replays earn nothing, a later fix tops up to 100', () => {
    let p = answer(newProgress(), 'a', true).progress
    const replay = answer(p, 'a', true)
    expect(replay.outcome).toEqual({
      xpEarned: 0,
      mastered: false,
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
      xp: 100,
    })
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
