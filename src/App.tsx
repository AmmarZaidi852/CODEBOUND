import { useState } from 'react'
import BugHuntScreen from './screens/BugHuntScreen.tsx'
import CodeBreakerScreen from './screens/CodeBreakerScreen.tsx'
import GameSelectScreen from './screens/GameSelectScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'

type Screen = 'home' | 'select' | 'bug-hunt' | 'code-breaker'

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

  if (screen === 'select') {
    return (
      <GameSelectScreen
        xp={xp}
        onBack={() => setScreen('home')}
        onSelect={(id) => {
          if (id === 'bug-hunt' || id === 'code-breaker') setScreen(id)
        }}
      />
    )
  }

  return <HomeScreen xp={xp} onPlay={() => setScreen('select')} />
}

export default App
