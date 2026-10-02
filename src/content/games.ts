export type GameId = 'bug-hunt' | 'code-breaker' | 'data-sorter'

export interface GameInfo {
  id: GameId
  name: string
  description: string
  concept: string
  playable: boolean
}

export const games: GameInfo[] = [
  {
    id: 'bug-hunt',
    name: 'Bug Hunt',
    description: 'Broken code incoming. Find the bug and patch it.',
    concept: 'Python basics',
    playable: true,
  },
  {
    id: 'code-breaker',
    name: 'Code Breaker',
    description: 'Crack security checks using Python conditions.',
    concept: 'Conditions',
    playable: false,
  },
  {
    id: 'data-sorter',
    name: 'Data Sorter',
    description: 'Wrangle messy data into shape with Python lists.',
    concept: 'Lists',
    playable: false,
  },
]
