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
    description: 'Fix broken Python code.',
    concept: 'Python basics',
    playable: true,
  },
  {
    id: 'code-breaker',
    name: 'Code Breaker',
    description: 'Use Python logic to unlock security systems.',
    concept: 'Conditions & logic',
    playable: true,
  },
  {
    id: 'data-sorter',
    name: 'Data Sorter',
    description: 'Manipulate Python lists and data.',
    concept: 'Lists',
    playable: false,
  },
]
