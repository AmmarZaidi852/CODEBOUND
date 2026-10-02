import { useState } from 'react'
import type { GameId } from './content/games.ts'
import BugHuntScreen from './screens/BugHuntScreen.tsx'
import CodeBreakerScreen from './screens/CodeBreakerScreen.tsx'
import DataSorterScreen from './screens/DataSorterScreen.tsx'
import GameSelectScreen from './screens/GameSelectScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'

type Screen = 'home' | 'select' | GameId

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [xp, setXp] = useState(0)

  // Shared by every game so XP carries across the whole session.
  const earnXp = (amount: number) => setXp((total) => total + amount)
  const backToGames = () => setScreen('select')

  if (screen === 'bug-hunt') {
    return <BugHuntScreen xp={xp} onEarnXp={earnXp} onExit={backToGames} />
  }

  if (screen === 'code-breaker') {
    return <CodeBreakerScreen xp={xp} onEarnXp={earnXp} onExit={backToGames} />
  }

  if (screen === 'data-sorter') {
    return <DataSorterScreen xp={xp} onEarnXp={earnXp} onExit={backToGames} />
  }

  if (screen === 'select') {
    return (
      <GameSelectScreen
        xp={xp}
        onBack={() => setScreen('home')}
        onSelect={setScreen}
      />
    )
  }

  return <HomeScreen xp={xp} onPlay={() => setScreen('select')} />
}

export default App
