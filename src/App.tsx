import { useEffect, useState } from 'react'
import type { ConceptId } from './challenges/foundations.ts'
import { foundations } from './content/foundations.ts'
import type { GameId } from './content/games.ts'
import { foundationsProgress, nextConcept } from './game/foundationsProgress.ts'
import { XP_CONCEPT } from './game/xp.ts'
import BugHuntScreen from './screens/BugHuntScreen.tsx'
import CodeBreakerScreen from './screens/CodeBreakerScreen.tsx'
import ConceptScreen from './screens/ConceptScreen.tsx'
import DataSorterScreen from './screens/DataSorterScreen.tsx'
import FoundationsScreen from './screens/FoundationsScreen.tsx'
import FunctionForgeScreen from './screens/FunctionForgeScreen.tsx'
import GameSelectScreen from './screens/GameSelectScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'

type Screen = 'home' | 'select' | 'foundations' | 'concept' | GameId

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [xp, setXp] = useState(0)

  // Python Foundations progression (session only).
  const [completed, setCompleted] = useState<ConceptId[]>([])
  const [conceptId, setConceptId] = useState<ConceptId>(foundations[0].id)
  // Games opened from a lesson return to the learning path.
  const [gameExit, setGameExit] = useState<'select' | 'foundations'>('select')

  // Every screen starts at the top, not at the previous screen's scroll.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen, conceptId])

  // Shared by every game so XP carries across the whole session.
  const earnXp = (amount: number) => setXp((total) => total + amount)

  function openConcept(id: ConceptId) {
    setConceptId(id)
    setScreen('concept')
  }

  /** Marks a concept done. The XP reward is given only the first time. */
  function completeConcept(id: ConceptId) {
    if (completed.includes(id)) return
    setCompleted([...completed, id])
    earnXp(XP_CONCEPT)
  }

  function openGame(id: GameId, from: 'select' | 'foundations') {
    setGameExit(from)
    setScreen(id)
  }

  const gameProps = {
    xp,
    onEarnXp: earnXp,
    onExit: () => setScreen(gameExit),
    exitLabel: gameExit === 'foundations' ? 'Foundations' : 'Games',
  }

  if (screen === 'bug-hunt') return <BugHuntScreen {...gameProps} />
  if (screen === 'code-breaker') return <CodeBreakerScreen {...gameProps} />
  if (screen === 'data-sorter') return <DataSorterScreen {...gameProps} />
  if (screen === 'function-forge') {
    return <FunctionForgeScreen {...gameProps} />
  }

  if (screen === 'select') {
    return (
      <GameSelectScreen
        xp={xp}
        onBack={() => setScreen('home')}
        onSelect={(id) => openGame(id, 'select')}
      />
    )
  }

  if (screen === 'foundations') {
    return (
      <FoundationsScreen
        xp={xp}
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
        xp={xp}
        concept={concept}
        index={index}
        total={foundations.length}
        alreadyCompleted={completed.includes(concept.id)}
        nextTitle={next?.title ?? null}
        onComplete={() => completeConcept(concept.id)}
        onBack={() => setScreen('foundations')}
        onPractise={() => concept.game && openGame(concept.game, 'foundations')}
        onNext={() => (next ? openConcept(next.id) : setScreen('foundations'))}
      />
    )
  }

  return (
    <HomeScreen
      xp={xp}
      learned={foundationsProgress(foundations, completed)}
      onLearn={() => setScreen('foundations')}
      onPlay={() => setScreen('select')}
    />
  )
}

export default App
