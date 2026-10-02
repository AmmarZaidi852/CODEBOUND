import { useState } from 'react'
import BugHuntScreen from './screens/BugHuntScreen.tsx'
import GameSelectScreen from './screens/GameSelectScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'

type Screen = 'home' | 'select' | 'bug-hunt'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [xp, setXp] = useState(0)

  if (screen === 'bug-hunt') {
    return (
      <BugHuntScreen
        xp={xp}
        onEarnXp={(amount) => setXp((total) => total + amount)}
        onExit={() => setScreen('select')}
      />
    )
  }

  if (screen === 'select') {
    return (
      <GameSelectScreen
        xp={xp}
        onBack={() => setScreen('home')}
        onSelect={(id) => {
          if (id === 'bug-hunt') setScreen('bug-hunt')
        }}
      />
    )
  }

  return <HomeScreen xp={xp} onPlay={() => setScreen('select')} />
}

export default App
