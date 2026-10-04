import type { GameId } from '../content/games.ts'
import type { CodeRoundTheme } from './CodeRound.tsx'

const pad = (n: number) => String(n).padStart(2, '0')

/** How each game dresses its "write" modules. */
export const codeThemes: Record<GameId, (index: number) => CodeRoundTheme> = {
  'bug-hunt': (index) => ({
    art: 'bug-hunt',
    name: 'Bug Hunt',
    status: {
      label: 'System',
      idle: 'Corrupted',
      ok: 'Patched',
      fail: 'Still corrupted',
    },
    titles: { ok: 'Bug squashed!', fail: 'Not quite' },
    label: `Bug ${pad(index + 1)} · Write the fix`,
  }),
  'code-breaker': (index) => ({
    art: 'code-breaker',
    name: 'Code Breaker',
    status: {
      label: 'Security',
      idle: 'Locked',
      ok: 'Unlocked',
      fail: 'Still locked',
    },
    titles: { ok: 'Lock broken!', fail: 'Access denied' },
    label: `Security Node ${pad(index + 1)} · Write the logic`,
  }),
  'data-sorter': (index) => ({
    art: 'data-sorter',
    name: 'Data Sorter',
    status: {
      label: 'Data core',
      idle: 'Online',
      ok: 'Sorted',
      fail: 'Mismatch',
    },
    titles: { ok: 'Data sorted!', fail: 'Not quite' },
    label: `Data Terminal ${pad(index + 1)} · Write the code`,
  }),
  'function-forge': (index) => ({
    art: 'function-forge',
    name: 'Function Forge',
    status: {
      label: 'Forge',
      idle: 'Ready',
      ok: 'Online',
      fail: 'Fault',
    },
    titles: { ok: 'Module online!', fail: 'Module fault' },
    label: `Function Module ${pad(index + 1)} · Write the function`,
  }),
}
