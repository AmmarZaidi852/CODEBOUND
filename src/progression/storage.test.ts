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
        'bug-hunt:a': { solved: true, mastered: true, xp: 100 },
        'bug-hunt:b': { solved: false, mastered: false, xp: 0 },
      },
      games: { 'bug-hunt': { runs: 2, bestRun: 0 } },
    })
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
