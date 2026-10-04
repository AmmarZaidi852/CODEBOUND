import { tierLabels, tierOf, type Tier } from '../challenges/meta.ts'
import type { GameId } from '../content/games.ts'
import type { RunStart, RunStats } from '../game/useChallengeRun.ts'
import { levelForXp, levelProgress, XP_PER_LEVEL } from '../game/xp.ts'
import {
  bossState,
  gameStates,
  gameStatus,
  statusLabels,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import PixelProgress from './PixelProgress.tsx'
import PixelSprite from './PixelSprite.tsx'
import './RunSummary.css'

interface RunSummaryProps {
  game: GameId
  gameName: string
  title: string
  message: string
  /** The game's modules in play order (for saved state and tiers). */
  modules: readonly { id: string; tier?: Tier }[]
  stats: RunStats
  onExit: () => void
  exitLabel?: string
  /** Plays again: "continue" retries unfinished, a tier opens that section. */
  onPlayAgain: (startAt: RunStart) => void
}

/** What to suggest after a run, from the saved state of every module. */
function nextStep(
  section: Tier,
  states: readonly string[],
  tiers: readonly Tier[],
  boss: ReturnType<typeof bossState>,
): { text: string; action: RunStart | null; label: string } | null {
  const left = states.filter(
    (s, i) => tiers[i] === section && s === 'unplayed',
  ).length
  if (left > 0) {
    return {
      text: `${left} module${left === 1 ? '' : 's'} left to complete.`,
      action: 'continue',
      label: 'Retry unfinished',
    }
  }
  const next = tiers.slice(tiers.lastIndexOf(section) + 1)[0]
  if (next === 'advanced') {
    return {
      text: 'Advanced modules unlocked: they combine what you just practised.',
      action: 'advanced',
      label: 'Play Advanced',
    }
  }
  if (next === 'boss') {
    return boss === 'locked'
      ? {
          text: 'Boss locked: complete every Core and Advanced module first.',
          action: 'continue',
          label: 'Retry unfinished',
        }
      : {
          text: 'Boss module ready: one program that brings it all together.',
          action: 'boss',
          label: 'Play Boss',
        }
  }
  return null
}

/** Completion screen: what this run achieved, and where the game stands. */
function RunSummary({
  game,
  gameName,
  title,
  message,
  modules,
  stats,
  onExit,
  exitLabel = 'Back to games',
  onPlayAgain,
}: RunSummaryProps) {
  const { progress } = useProgress()
  const states = gameStates(
    progress,
    game,
    modules.map((m) => m.id),
  )
  const tiers = modules.map(tierOf)
  const boss = bossState(states, tiers)
  const status = gameStatus(states)
  const total = states.length
  const done = states.filter((s) => s !== 'unplayed').length
  const mastered = states.filter((s) => s === 'mastered').length
  const recovered = states.filter((s) => s === 'recovered').length
  const level = levelForXp(progress.xp)
  const step = nextStep(stats.section, states, tiers, boss)
  const sectionDone = states.every(
    (s, i) => tiers[i] !== stats.section || s !== 'unplayed',
  )

  const stamp =
    status === 'mastered'
      ? 'Game mastered'
      : stats.section === 'boss' && boss === 'mastered'
        ? 'Boss mastered'
        : stats.section === 'boss' && boss === 'cleared'
          ? 'Boss cleared'
          : status === 'complete'
            ? 'Mission complete'
            : sectionDone
              ? `${tierLabels[stats.section]} complete`
              : 'Run complete'

  return (
    <main className="run-summary">
      <div className="run-summary__art" aria-hidden="true">
        <span className="run-summary__burst" />
        <PixelSprite id={game} />
      </div>
      <p className="run-summary__stamp">
        {gameName} · {stats.replay ? 'Replay' : stamp}
      </p>
      <h1 className="run-summary__title">{title}</h1>
      <p>{message}</p>
      <dl
        className={`run-summary__stats${recovered > 0 ? ' run-summary__stats--five' : ''}`}
      >
        <div className="run-summary__stat--xp">
          <dt>XP earned</dt>
          <dd>+{stats.runXp}</dd>
        </div>
        <div>
          <dt>Correct this run</dt>
          <dd>
            {stats.correct}/{stats.played}
          </dd>
        </div>
        <div>
          <dt>Modules complete</dt>
          <dd>
            {done}/{total}
          </dd>
        </div>
        <div>
          <dt>Mastered</dt>
          <dd>
            {mastered}/{total}
          </dd>
        </div>
        {recovered > 0 && (
          <div>
            <dt>Recovered</dt>
            <dd>{recovered}</dd>
          </div>
        )}
      </dl>
      <div className="run-summary__progress">
        <span>Game status: {statusLabels[status]}</span>
        <PixelProgress
          value={done}
          total={total}
          segments={states}
          className="run-summary__level-bar"
        />
      </div>
      <p className="run-summary__next">
        {stats.replay && stats.runXp === 0
          ? 'Replay run: XP for these modules was already earned. '
          : ''}
        {step
          ? step.text
          : status === 'mastered'
            ? 'Every module mastered on the first try.'
            : `Every module complete · ${mastered} of ${total} mastered on the first try${recovered > 0 ? `, ${recovered} recovered through practice` : ''}.`}
      </p>
      <div className="run-summary__level">
        <span>Level {level}</span>
        <PixelProgress
          value={Math.floor(levelProgress(progress.xp) * 10)}
          total={10}
          className="run-summary__level-bar"
        />
        <span>
          {XP_PER_LEVEL - (progress.xp % XP_PER_LEVEL)} XP to level {level + 1}
        </span>
      </div>
      <div className="run-summary__actions">
        <button
          type="button"
          className="btn btn--primary btn--large btn--go"
          onClick={onExit}
        >
          {exitLabel}
        </button>
        <button
          type="button"
          className="btn btn--large"
          onClick={() => onPlayAgain(step?.action ?? 'start')}
        >
          {step?.label ?? `Replay ${gameName}`}
        </button>
      </div>
    </main>
  )
}

export default RunSummary
