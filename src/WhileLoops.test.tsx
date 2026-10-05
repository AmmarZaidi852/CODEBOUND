import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { tierOf } from './challenges/meta.ts'
import { arcadeChallenges } from './content/arcade.ts'
import { codeBreakerModules, gameModules } from './content/gameChallenges.ts'
import type { GameId } from './content/games.ts'
import { stuckLoop, whileModules } from './content/whileChallenges.ts'
import { arcadeStatus } from './progression/arcade.ts'
import { conceptStatus, labQueue, labRanking } from './progression/lab.ts'
import {
  applyAnswer,
  bossState,
  challengeKey,
  continueIndex,
  gameStates,
  newProgress,
  tierCounts,
  type Progress,
} from './progression/progress.ts'
import { loadProgress, saveProgress } from './progression/storage.ts'
import { answerModule, nextModule, writeCode } from './test/play.ts'
import { expectStep } from './test/progress.ts'
import { expectTotalXp } from './test/render.tsx'

/*
 * Phase 15 adds three `while` modules to Code Breaker's ADVANCED tier.
 * A save from before Phase 15 has every other module, but none of these.
 */

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

const gameIds = Object.keys(gameModules) as GameId[]
const whileIds = new Set(whileModules.map((m) => m.id))
const isNew = (m: { id: string }) => whileIds.has(m.id)
const tiers = codeBreakerModules.map(tierOf)
const BOSS = tiers.indexOf('boss')
const FIRST_NEW = codeBreakerModules.findIndex(isNew)

/**
 * Every pre-Phase 15 module solved first try, except Code Breaker's boss:
 * left unplayed ('ready' before Phase 15) or cleared after a miss.
 */
function olderSave(boss: 'ready' | 'cleared'): Progress {
  let p = newProgress()
  for (const game of gameIds) {
    for (const m of gameModules[game]) {
      if (isNew(m)) continue
      const isBoss = game === 'code-breaker' && tierOf(m) === 'boss'
      if (isBoss && boss === 'ready') continue
      if (isBoss) p = applyAnswer(p, game, m.id, false).progress
      p = applyAnswer(p, game, m.id, true).progress
    }
  }
  for (const m of arcadeChallenges) {
    p = applyAnswer(p, 'arcade', m.id, true).progress
  }
  return p
}

const states = (p: Progress) =>
  gameStates(
    p,
    'code-breaker',
    codeBreakerModules.map((m) => m.id),
  )

const cartridge = () =>
  within(screen.getByRole('heading', { name: 'Code Breaker' }).closest('li')!)

describe('a save from before Phase 15', () => {
  it('keeps Core and the Arcade; a ready boss is locked until the new modules are done', () => {
    let p = olderSave('ready')
    const before = states(p)
    expect(tierCounts(before, tiers, 'core')).toEqual({ done: 7, total: 7 })
    expect(tierCounts(before, tiers, 'advanced')).toEqual({
      done: 4,
      total: 7,
    })
    expect(bossState(before, tiers)).toBe('locked')
    expect(continueIndex(before)).toBe(FIRST_NEW)
    expect(arcadeStatus(p)).toBe('new')

    for (const m of whileModules) {
      p = applyAnswer(p, 'code-breaker', m.id, true).progress
    }
    expect(bossState(states(p), tiers)).toBe('ready')
    expect(continueIndex(states(p))).toBe(BOSS)
  })

  it('a cleared boss stays cleared, with every earlier record and the XP kept', () => {
    const p = olderSave('cleared')
    saveProgress(p)
    const loaded = loadProgress()
    expect(loaded.xp).toBe(p.xp)
    expect(loaded.challenges).toEqual(p.challenges)
    expect(bossState(states(loaded), tiers)).toBe('cleared')
    expect(continueIndex(states(loaded))).toBe(FIRST_NEW)
  })

  it('ready → locked → ready in the app, playing the new modules from Continue', () => {
    const p = olderSave('ready')
    saveProgress(p)
    render(<App />)
    click('PLAY')
    expect(cartridge().getByText('Core 07/07')).toBeInTheDocument()
    expect(cartridge().getByText('Advanced 04/07')).toBeInTheDocument()
    expect(cartridge().getByText('Boss Locked')).toBeInTheDocument()

    click('Continue Code Breaker')
    expectStep('Code Breaker', FIRST_NEW + 1, codeBreakerModules.length)
    whileModules.forEach((m, i) => {
      answerModule(m, true)
      expect(screen.getByText('+100 XP')).toBeInTheDocument()
      nextModule(i === whileModules.length - 1)
    })
    expectTotalXp(p.xp + 300)
    expect(
      screen.getByText(
        'Boss module ready: one program that brings it all together.',
      ),
    ).toBeInTheDocument()
    click('Play Boss')
    expectStep('Code Breaker', BOSS + 1, codeBreakerModules.length)
    click('← Games')
    expect(cartridge().getByText('Advanced 07/07')).toBeInTheDocument()
    expect(cartridge().getByText('Boss Ready')).toBeInTheDocument()
  })

  it('a cleared boss is offered as Replay Boss after the new modules', () => {
    saveProgress(olderSave('cleared'))
    render(<App />)
    click('PLAY')
    expect(cartridge().getByText('Boss Cleared')).toBeInTheDocument()
    click('Continue Code Breaker')
    whileModules.forEach((m, i) => {
      answerModule(m, true)
      nextModule(i === whileModules.length - 1)
    })
    expect(
      screen.getByText('Boss already cleared: replay it any time.'),
    ).toBeInTheDocument()
    click('Replay Boss')
    expectStep('Code Breaker', BOSS + 1, codeBreakerModules.length)
  })
})

describe('Stuck Loop in the code terminal', () => {
  function openStuckLoop() {
    saveProgress(olderSave('ready'))
    render(<App />)
    click('PLAY')
    click('Continue Code Breaker')
    for (const m of whileModules.slice(0, 2)) {
      answerModule(m, true)
      nextModule(false)
    }
    expect(
      screen.getByRole('heading', { level: 1, name: 'Stuck Loop' }),
    ).toBeInTheDocument()
  }

  it('stops the endless starter safely, then a fix recovers it (+25, then +75)', () => {
    openStuckLoop()
    const xp = olderSave('ready').xp + 200
    writeCode(`${stuckLoop.starter.join('\n')}\n# still stuck`)
    expect(screen.getByText(/The loop never ends/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Timeout: `?while heat >= 50`? never became False\. Does the loop change `?heat`?\?/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expectTotalXp(xp + 25)

    click('Try again')
    writeCode(stuckLoop.solution.join('\n'))
    expect(screen.getByText('+75 XP')).toBeInTheDocument()
    expect(
      screen.getByText('Recovered', { selector: '.feedback__recovered' }),
    ).toBeInTheDocument()
    expectTotalXp(xp + 100)
    expect(
      loadProgress().challenges[challengeKey('code-breaker', 'stuck-loop')],
    ).toEqual({ solved: true, mastered: false, recovered: true, xp: 100 })
  })

  it('a hinted first-try solve completes it but does not master it', () => {
    openStuckLoop()
    click('Show hint 1 of 3')
    writeCode(stuckLoop.solution.join('\n'))
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(
      screen.queryByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeNull()
    expect(
      loadProgress().challenges[challengeKey('code-breaker', 'stuck-loop')],
    ).toMatchObject({ solved: true, mastered: false, recovered: false })
  })
})

describe('While loops in the Mastery Lab', () => {
  it('adds a While loops concept row counting the three modules', () => {
    const row = conceptStatus(newProgress()).find((c) => c.id === 'while')!
    expect(row).toMatchObject({ title: 'While loops', total: 3, mastered: 0 })
    const all = olderSave('cleared')
    expect(conceptStatus(all).find((c) => c.id === 'while')).toMatchObject({
      label: 'new',
      mastered: 0,
    })
  })

  it('lists the new modules as new challenges once Code Breaker Core is done, never before', () => {
    const p = olderSave('ready')
    const fresh = labRanking(p).filter((t) => t.priority === 'new')
    expect(new Set(fresh.map((t) => t.id))).toEqual(whileIds)
    // The ready-again boss is not offered while it is locked.
    expect(
      labRanking(p).some(
        (t) => t.source === 'code-breaker' && t.tier === 'boss',
      ),
    ).toBe(false)

    let started = newProgress()
    started = applyAnswer(started, 'code-breaker', 'basic-if', true).progress
    expect(labRanking(started).some((t) => isNew(t))).toBe(false)
  })

  it('opens the While loops row with Practice While loops', () => {
    saveProgress(olderSave('ready'))
    render(<App />)
    click('Open Lab')
    expect(labQueue(olderSave('ready')).map((t) => t.id)).toEqual([...whileIds])
    const row = screen.getByRole('button', { name: /^While loops/ })
    expect(within(row).getByText('0/3')).toBeInTheDocument()
    fireEvent.click(row)
    const detail = within(document.getElementById('lab-concept-detail')!)
    expect(detail.getByText('Countdown Lock')).toBeInTheDocument()
    click('Practice While loops')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Countdown Lock' }),
    ).toBeInTheDocument()
  })
})

describe('the Arcade after Phase 15', () => {
  it('stays unlocked and unchanged for an older save', () => {
    saveProgress(olderSave('ready'))
    render(<App />)
    expect(screen.getByText('Arcade ready · 8 module run')).toBeInTheDocument()
  })
})
