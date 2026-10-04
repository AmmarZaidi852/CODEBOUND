import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyAnswer, newProgress, PROGRESS_VERSION } from './progress.ts'
import {
  clearProgress,
  loadProgress,
  sanitize,
  saveProgress,
  STORAGE_KEY,
} from './storage.ts'

describe('progress storage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gives a fresh player when nothing is saved', () => {
    expect(loadProgress()).toEqual(newProgress())
  })

  it('restores exactly what was saved', () => {
    const saved = {
      ...applyAnswer(newProgress(), 'bug-hunt', 'variables', true).progress,
      concepts: ['variables' as const],
      games: { 'bug-hunt': { runs: 1, bestRun: 4 } },
    }
    saveProgress(saved)
    expect(loadProgress()).toEqual(saved)
  })

  it('recovers from corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadProgress()).toEqual(newProgress())
  })

  it('starts fresh on an unknown schema version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, xp: 900 }))
    expect(loadProgress()).toEqual(newProgress())
  })

  it('drops invalid fields instead of trusting them', () => {
    expect(
      sanitize({
        version: PROGRESS_VERSION,
        xp: -40,
        concepts: ['variables', 'variables', 'not-a-concept', 7],
        challenges: {
          'bug-hunt:a': { solved: true, mastered: true, xp: 100 },
          'bug-hunt:b': { solved: false, mastered: true, xp: '50' },
          'no-such-game:c': { solved: true, mastered: true, xp: 100 },
          'bug-hunt:d': 'oops',
        },
        games: { 'bug-hunt': { runs: 2.7, bestRun: null }, nope: {} },
      }),
    ).toEqual({
      version: PROGRESS_VERSION,
      xp: 0,
      concepts: ['variables'],
      challenges: {
        'bug-hunt:a': {
          solved: true,
          mastered: true,
          recovered: false,
          xp: 100,
        },
        'bug-hunt:b': {
          solved: false,
          mastered: false,
          recovered: false,
          xp: 0,
        },
      },
      games: { 'bug-hunt': { runs: 2, bestRun: 0 } },
      arcade: { run: null, runs: 0, best: null },
    })
  })

  it('loads saves from before recovery existed, and keeps recovery consistent', () => {
    const p = sanitize({
      ...newProgress(),
      challenges: {
        'bug-hunt:old': { solved: true, mastered: false, xp: 100 },
        'bug-hunt:rec': {
          solved: true,
          mastered: false,
          recovered: true,
          xp: 100,
        },
        'bug-hunt:both': {
          solved: true,
          mastered: true,
          recovered: true,
          xp: 100,
        },
        'bug-hunt:unsolved': {
          solved: false,
          mastered: false,
          recovered: true,
          xp: 25,
        },
      },
    })
    expect(p.challenges['bug-hunt:old'].recovered).toBe(false)
    expect(p.challenges['bug-hunt:rec'].recovered).toBe(true)
    // Recovery never sits alongside mastery, or on an unsolved challenge.
    expect(p.challenges['bug-hunt:both']).toMatchObject({
      mastered: true,
      recovered: false,
    })
    expect(p.challenges['bug-hunt:unsolved'].recovered).toBe(false)
  })

  it('keeps working when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadProgress()).toEqual(newProgress())
    expect(() => saveProgress(newProgress())).not.toThrow()
  })

  it('clears only its own key', () => {
    localStorage.setItem('other-app', 'keep me')
    saveProgress(newProgress())
    clearProgress()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('other-app')).toBe('keep me')
  })
})
