import { Suspense } from 'react'
import SpaceScene from './scenes/SpaceScene.jsx'
import LoadingScreen from './components/hud/LoadingScreen.jsx'

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
      <Suspense fallback={<LoadingScreen />}>
        <SpaceScene />
      </Suspense>
    </div>
  )
}
