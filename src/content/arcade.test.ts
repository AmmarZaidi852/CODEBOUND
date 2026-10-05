import { describe, expect, it } from 'vitest'
import { checkCode, type CodeChallenge } from '../challenges/code.ts'
import { interactionOf } from '../challenges/interaction.ts'
import { tierOf } from '../challenges/meta.ts'
import {
  ARCADE_FINAL,
  arcadeChallenges,
  arcadeModules,
  deliveryGate,
  resolveArcadeRef,
  shieldBreach,
} from './arcade.ts'
import { foundations } from './foundations.ts'
import { gameModules } from './gameChallenges.ts'

const code = (...lines: string[]) => lines.join('\n')
const verdict = (c: CodeChallenge, ...lines: string[]) =>
  checkCode(c, code(...lines))
const gate = (condition: string) =>
  verdict(
    deliveryGate,
    `if ${condition}:`,
    '    print("ACCEPTED")',
    'else:',
    '    print("REJECTED")',
  )
const damage = (...body: string[]) =>
  verdict(shieldBreach, 'def damage(hits, shield):', ...body)

describe('arcade run selection', () => {
  it('is a short run of 8 modules', () => {
    expect(arcadeModules).toHaveLength(8)
  })

  it('references each challenge by id and reuses its one definition', () => {
    for (const { source, id, module } of arcadeModules) {
      const list = source === 'arcade' ? arcadeChallenges : gameModules[source]
      // The very same object the game plays: same content, same validation.
      expect(list).toContain(module)
      expect(module.id).toBe(id)
    }
    expect(() => resolveArcadeRef({ source: 'bug-hunt', id: 'nope' })).toThrow()
  })

  it('never repeats a module', () => {
    const keys = arcadeModules.map((m) => `${m.source}:${m.id}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('adds at most three new challenges, none copied from a game', () => {
    expect(arcadeChallenges.length).toBeLessThanOrEqual(3)
    const gameIds = Object.values(gameModules).flatMap((ms) =>
      ms.map((m) => m.id),
    )
    for (const c of arcadeChallenges) expect(gameIds).not.toContain(c.id)
  })

  it('mixes every game and every interaction', () => {
    const sources = new Set(arcadeModules.map((m) => m.source))
    expect(sources).toEqual(
      new Set([
        'bug-hunt',
        'code-breaker',
        'data-sorter',
        'function-forge',
        'arcade',
      ]),
    )
    expect(new Set(arcadeModules.map((m) => interactionOf(m.module)))).toEqual(
      new Set(['choose', 'build', 'predict', 'write']),
    )
    // Never the same interaction three times in a row.
    const kinds = arcadeModules.map((m) => interactionOf(m.module))
    kinds.slice(2).forEach((k, i) => {
      expect(k === kinds[i] && k === kinds[i + 1]).toBe(false)
    })
  })

  it('climbs from core to advanced to one final mixed challenge', () => {
    const tiers = arcadeModules.map((m) => tierOf(m.module))
    expect(tiers.slice(0, 5)).toEqual(Array(5).fill('core'))
    expect(tiers.slice(5)).toEqual(['advanced', 'advanced', 'advanced'])
    expect(tiers).not.toContain('boss')
    const final = arcadeModules[ARCADE_FINAL]
    expect(final.source).toBe('arcade')
    expect(interactionOf(final.module)).toBe('write')
    expect(final.module.concepts.length).toBeGreaterThanOrEqual(3)
  })

  it('covers every Foundations concept, and uses no other', () => {
    const taught = new Set(foundations.map((c) => c.id))
    const used = new Set(arcadeModules.flatMap((m) => m.module.concepts))
    for (const c of used) expect(taught.has(c)).toBe(true)
    expect(used).toEqual(taught)
  })
})

describe('arcade-only write modules', () => {
  it.each(arcadeChallenges.map((c) => [c.id, c] as const))(
    '%s: the solution passes; the starter, malformed and unsupported code fail',
    (_, challenge) => {
      expect(checkCode(challenge, challenge.solution.join('\n')).correct).toBe(
        true,
      )
      for (const source of [
        challenge.starter.join('\n'),
        '',
        'def (',
        'try:\n    pass',
        'import os',
      ]) {
        const v = checkCode(challenge, source)
        expect(v.correct).toBe(false)
        expect(v.message.length).toBeGreaterThan(10)
      }
    },
  )

  it.each(arcadeChallenges.map((c) => [c.id, c] as const))(
    '%s: three hints that never contain a finished line',
    (_, challenge) => {
      expect(challenge.hints).toHaveLength(3)
      const starter = challenge.starter.map((l) => l.trim())
      const lines = challenge.solution
        .map((l) => l.trim())
        .filter((l) => l && !starter.includes(l) && l !== 'else:')
      for (const hint of challenge.hints) {
        for (const line of lines) expect(hint).not.toContain(line)
      }
    },
  )

  it('Delivery Gate: equivalent conditions pass', () => {
    for (const c of [
      'packages >= 5 and not locked',
      'not locked and packages >= 5',
      'packages > 4 and locked == False',
      'packages >= 5 and locked != True',
    ]) {
      expect(gate(c).correct, c).toBe(true)
    }
  })

  it('Delivery Gate: diagnoses the boundary, a missing rule, and `or`', () => {
    expect(gate('packages > 5 and not locked').message).toContain(
      '`>` leaves 5 out',
    )
    expect(gate('packages >= 5').message).toContain('never checks `locked`')
    expect(gate('packages >= 5 or not locked').message).toContain('use `and`')
    // Typing one answer cannot work for every delivery.
    expect(verdict(deliveryGate, 'print("ACCEPTED")').correct).toBe(false)
  })

  it('Shield Breach: equivalent repairs pass', () => {
    expect(
      damage(
        '    total = 0',
        '    for h in hits:',
        '        if h >= shield:',
        '            total += h - shield',
        '    return total',
      ).correct,
    ).toBe(true)
    expect(
      damage(
        '    result = 0',
        '    for hit in hits:',
        '        if hit - shield > 0:',
        '            result = result + (hit - shield)',
        '    return result',
      ).correct,
    ).toBe(true)
  })

  it('Shield Breach: diagnoses each of its three bugs', () => {
    expect(damage(...shieldBreach.starter.slice(1)).message).toContain(
      'sends nothing back',
    )
    expect(
      damage(
        '    for hit in hits:',
        '        total = 0',
        '        if hit > shield:',
        '            total = total + hit - shield',
        '    return total',
      ).message,
    ).toContain('only holds the last hit')
    expect(
      damage(
        '    total = 0',
        '    for hit in hits:',
        '        if hit > shield:',
        '            total = total + hit',
        '    return total',
      ).message,
    ).toContain('subtract the shield')
    expect(
      damage(
        '    total = 0',
        '    for hit in hits:',
        '        if hit > shield:',
        '            total = total + hit - shield',
        '        return total',
      ).message,
    ).toContain('first pass of the loop')
    expect(
      damage(
        '    for hit in hits:',
        '        if hit > shield:',
        '            total = total + hit - shield',
        '    return total',
      ).message,
    ).toContain('Start it at 0 before the loop')
  })

  it('Shield Breach: a typed answer fails the other cases', () => {
    const v = damage('    return 7')
    expect(v.correct).toBe(false)
    expect(v.message).toContain('should return `0`')
  })
})
