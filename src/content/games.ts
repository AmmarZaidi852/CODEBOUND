export type GameId =
  'bug-hunt' | 'code-breaker' | 'data-sorter' | 'function-forge'

export interface GameInfo {
  id: GameId
  name: string
  description: string
  /** Area status readout shown on the cartridge, e.g. "Corrupted". */
  status: string
  playable: boolean
}

export const games: GameInfo[] = [
  {
    id: 'bug-hunt',
    name: 'Bug Hunt',
    description: 'Fix broken Python code.',
    status: 'Corrupted',
    playable: true,
  },
  {
    id: 'code-breaker',
    name: 'Code Breaker',
    description: 'Use Python logic to unlock security systems.',
    status: 'Locked',
    playable: true,
  },
  {
    id: 'data-sorter',
    name: 'Data Sorter',
    description: 'Manipulate Python lists and data.',
    status: 'Online',
    playable: true,
  },
  {
    id: 'function-forge',
    name: 'Function Forge',
    description: 'Build and use Python functions.',
    status: 'Ready',
    playable: true,
  },
]
