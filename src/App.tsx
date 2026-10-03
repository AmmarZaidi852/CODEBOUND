import { useEffect, useState } from 'react'
import type { ConceptId } from './challenges/foundations.ts'
import { foundations } from './content/foundations.ts'
import type { GameId } from './content/games.ts'
import { foundationsProgress, nextConcept } from './game/foundationsProgress.ts'
import type { RunStart } from './game/useChallengeRun.ts'
import { useProgress } from './progression/ProgressContext.ts'
import ProgressProvider from './progression/ProgressProvider.tsx'
import BugHuntScreen from './screens/BugHuntScreen.tsx'
import CodeBreakerScreen from './screens/CodeBreakerScreen.tsx'
import ConceptScreen from './screens/ConceptScreen.tsx'
import DataSorterScreen from './screens/DataSorterScreen.tsx'
import FoundationsScreen from './screens/FoundationsScreen.tsx'
import FunctionForgeScreen from './screens/FunctionForgeScreen.tsx'
import GameSelectScreen from './screens/GameSelectScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'

type Screen = 'home' | 'select' | 'foundations' | 'concept' | 'game'

/** The game being played, how it was entered, and where it starts. */
interface Run {
  game: GameId
  /** Games opened from a lesson return to the learning path. */
  from: 'select' | 'foundations'
  startAt: RunStart
  /** Bumped to remount the game for another run. */
  attempt: number
}

const gameScreens = {
  'bug-hunt': BugHuntScreen,
  'code-breaker': CodeBreakerScreen,
  'data-sorter': DataSorterScreen,
  'function-forge': FunctionForgeScreen,
}

/** Switches screens. All saved state lives in ProgressProvider. */
function Screens() {
  const { progress, completeConcept } = useProgress()
  const completed = progress.concepts

  const [screen, setScreen] = useState<Screen>('home')
  const [conceptId, setConceptId] = useState<ConceptId>(foundations[0].id)
  const [run, setRun] = useState<Run | null>(null)

  // Every screen starts at the top, not at the previous screen's scroll.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen, conceptId, run])

  function openConcept(id: ConceptId) {
    setConceptId(id)
    setScreen('concept')
  }

  function openGame(game: GameId, from: Run['from'], startAt: RunStart) {
    setRun({ game, from, startAt, attempt: (run?.attempt ?? 0) + 1 })
    setScreen('game')
  }

  if (screen === 'game' && run) {
    const Game = gameScreens[run.game]
    return (
      <Game
        key={run.attempt}
        startAt={run.startAt}
        onExit={() => setScreen(run.from)}
        exitLabel={run.from === 'foundations' ? 'Foundations' : 'Games'}
        onPlayAgain={(startAt) => openGame(run.game, run.from, startAt)}
      />
    )
  }

  if (screen === 'select') {
    return (
      <GameSelectScreen
        onBack={() => setScreen('home')}
        onSelect={(id, startAt) => openGame(id, 'select', startAt)}
      />
    )
  }

  if (screen === 'foundations') {
    return (
      <FoundationsScreen
        completed={completed}
        onBack={() => setScreen('home')}
        onOpen={openConcept}
      />
    )
  }

  if (screen === 'concept') {
    const index = foundations.findIndex((c) => c.id === conceptId)
    const concept = foundations[index]
    const next = nextConcept(foundations, concept.id)
    return (
      <ConceptScreen
        key={concept.id}
        concept={concept}
        index={index}
        total={foundations.length}
        alreadyCompleted={completed.includes(concept.id)}
        nextTitle={next?.title ?? null}
        onComplete={() => completeConcept(concept.id)}
        onBack={() => setScreen('foundations')}
        onPractise={() =>
          concept.game && openGame(concept.game, 'foundations', 'continue')
        }
        onNext={() => (next ? openConcept(next.id) : setScreen('foundations'))}
      />
    )
  }

  return (
    <HomeScreen
      learned={foundationsProgress(foundations, completed)}
      onLearn={() => setScreen('foundations')}
      onPlay={() => setScreen('select')}
    />
  )
}

function App() {
  return (
    <ProgressProvider>
      <Screens />
    </ProgressProvider>
  )
}

export default App
