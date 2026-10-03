import { describe, expect, it } from 'vitest'
import { bugHuntChallenges } from '../content/bugHuntChallenges.ts'
import { ticketTotal } from '../content/codeChallenges.ts'
import { codeBreakerChallenges } from '../content/codeBreakerChallenges.ts'
import { dataSorterChallenges } from '../content/dataSorterChallenges.ts'
import {
  feeCalculator,
  overrideSwitch,
  shopCheckout,
  thresholdFilter,
} from '../content/depthChallenges.ts'
import { functionForgeChallenges } from '../content/functionForgeChallenges.ts'
import { interactionOf } from './interaction.ts'
import { tierOf } from './meta.ts'

const byId = <T extends { id: string }>(list: T[], id: string) =>
  list.find((c) => c.id === id)!

describe('interaction type', () => {
  it('is read from each module shape', () => {
    expect(interactionOf(bugHuntChallenges[0])).toBe('choose')
    expect(interactionOf(byId(codeBreakerChallenges, 'combined'))).toBe(
      'choose',
    )
    expect(interactionOf(overrideSwitch)).toBe('predict')
    expect(interactionOf(byId(dataSorterChallenges, 'indexing'))).toBe('choose')
    expect(interactionOf(thresholdFilter)).toBe('build')
    expect(interactionOf(byId(functionForgeChallenges, 'define'))).toBe('build')
    expect(interactionOf(byId(functionForgeChallenges, 'one-parameter'))).toBe(
      'build',
    )
    expect(interactionOf(byId(functionForgeChallenges, 'call'))).toBe('choose')
    expect(interactionOf(feeCalculator)).toBe('predict')
    expect(interactionOf(ticketTotal)).toBe('write')
  })
})

describe('tier', () => {
  it('defaults to CORE and reads ADVANCED and BOSS', () => {
    expect(tierOf(bugHuntChallenges[0])).toBe('core')
    expect(tierOf(ticketTotal)).toBe('core')
    expect(tierOf(overrideSwitch)).toBe('advanced')
    expect(tierOf(shopCheckout)).toBe('boss')
  })
})
