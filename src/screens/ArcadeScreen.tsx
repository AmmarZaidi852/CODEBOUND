import ArcadeSummary from '../components/ArcadeSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { ARCADE_FINAL } from '../content/arcade.ts'
import { foundations } from '../content/foundations.ts'
import { useArcadeRun } from '../game/useArcadeRun.ts'
import type { ArcadeRun } from '../progression/progress.ts'
import { arcadeCodeTheme, codeThemes } from './codeThemes.ts'
import ModuleRound from './ModuleRound.tsx'
import './ArcadeScreen.css'

interface ArcadeScreenProps {
  onExit: () => void
  /** Starts a new run from module 01. */
  onReplay: () => void
}

const emptyRun: ArcadeRun = {
  at: 0,
  tries: 0,
  correct: 0,
  firstTry: 0,
  checks: 0,
  correctChecks: 0,
  xp: 0,
}

/**
 * The Arcade Run: modules from every game in one short run. Each module is
 * played by its own game's round, in that game's colours, under one HUD.
 */
function ArcadeScreen({ onExit, onReplay }: ArcadeScreenProps) {
  const run = useArcadeRun()

  if (run.finished) {
    return (
      <div className="screen" data-theme="arcade">
        <TopBar backLabel="Games" onBack={onExit} />
        <ArcadeSummary
          run={run.final ?? emptyRun}
          bestBefore={run.bestBefore}
          onExit={onExit}
          onReplay={onReplay}
        />
      </div>
    )
  }

  const { current, index } = run
  const fromArcade = current.source === 'arcade'
  const theme =
    current.source === 'arcade'
      ? arcadeCodeTheme(index, index === ARCADE_FINAL)
      : codeThemes[current.source](index)
  const missed = run.result !== null && !run.result.correct
  const review = foundations.filter((c) =>
    current.module.concepts.includes(c.id),
  )

  return (
    <div className="screen" data-theme={fromArcade ? 'arcade' : current.source}>
      <TopBar backLabel="Games" onBack={onExit} />
      <main className="game">
        <ModuleRound
          key={`${current.source}:${current.id}`}
          module={current.module}
          theme={theme}
          hud={{ art: 'arcade', name: 'Arcade Run' }}
          index={index}
          total={run.total}
          states={run.states}
          result={run.result}
          isLast={run.isLast}
          onSubmit={run.submit}
          onRetry={run.retry}
          onNext={run.next}
          titleRef={run.titleRef}
          feedbackRef={run.feedbackRef}
        />
        {missed && (
          <p className="arcade__review">
            Want a refresher? {review.map((c) => c.title).join(' · ')}{' '}
            {review.length === 1 ? 'is' : 'are'} covered in Python Foundations.
            Your run is saved if you step out.
          </p>
        )}
      </main>
    </div>
  )
}

export default ArcadeScreen
