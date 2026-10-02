import { useState } from 'react'
import GameSelectScreen from './screens/GameSelectScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'

type Screen = 'home' | 'select'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [xp] = useState(0)

  if (screen === 'select') {
    return (
      <GameSelectScreen
        xp={xp}
        onBack={() => setScreen('home')}
        onSelect={() => {}}
      />
    )
  }

  return <HomeScreen xp={xp} onPlay={() => setScreen('select')} />
}

export default App
