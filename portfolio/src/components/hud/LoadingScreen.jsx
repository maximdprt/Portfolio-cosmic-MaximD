import './hud.css'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-title">COSMIC VOYAGER</div>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" />
      </div>
      <div className="loading-hint">CHARGEMENT DES SYSTÈMES...</div>
    </div>
  )
}
