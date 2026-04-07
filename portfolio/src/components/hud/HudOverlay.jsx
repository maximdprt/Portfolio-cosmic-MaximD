import './hud.css'

function Bar({ pct, gradient, low }) {
  const fill = (low && pct < 0.25) ? 'linear-gradient(90deg,#cc2200,#ff4400)' : gradient
  return (
    <div className="hud-bar-track">
      <div className="hud-bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, background: fill }} />
    </div>
  )
}

export default function HudOverlay({ telemetry, planets, nearestPlanet, canLand }) {
  const { px = 0, py = 0, pz = 0, speed = 0, headingDeg = 0, boostFuel = 1, boosting = false, hull = 1 } = telemetry
  const MM = 180, SC = 0.010
  const sx = MM / 2 + px * SC, sy = MM / 2 + pz * SC

  return (
    <>
      {/* Top center: approach prompt */}
      <div className="hud-top-center">
        <div style={{ fontSize: 13, letterSpacing: 2, color: canLand ? '#8bf5ff' : '#2a4a65', textTransform: 'uppercase' }}>
          {canLand && nearestPlanet ? `⬡  Approche ${nearestPlanet.name} — Appuie sur E` : '✦  Exploration Spatiale'}
        </div>
      </div>

      {/* Top right: minimap */}
      <div className="hud-panel hud-minimap">
        <div className="hud-label">CARTE STELLAIRE</div>
        <svg width={MM} height={MM}>
          <circle cx={MM / 2} cy={MM / 2} r={MM / 2 - 3} fill="none" stroke="rgba(60,150,220,0.18)" />
          <circle cx={MM / 2} cy={MM / 2} r={MM / 4} fill="none" stroke="rgba(60,150,220,0.10)" />
          <line x1={MM / 2} y1={4} x2={MM / 2} y2={MM - 4} stroke="rgba(60,150,220,0.08)" strokeWidth={0.5} />
          <line x1={4} y1={MM / 2} x2={MM - 4} y2={MM / 2} stroke="rgba(60,150,220,0.08)" strokeWidth={0.5} />
          {planets.filter(p => p.name !== 'Moon').map(p => {
            const ppx = MM / 2 + p.position[0] * SC
            const ppy = MM / 2 + p.position[2] * SC
            const near = nearestPlanet?.name === p.name
            return (
              <g key={p.name}>
                {near && <circle cx={ppx} cy={ppy} r={9} fill="none" stroke="#8bffff" strokeWidth={1} opacity={0.55} />}
                {near && <circle cx={ppx} cy={ppy} r={13} fill="none" stroke="#8bffff" strokeWidth={0.4} opacity={0.25} />}
                <circle cx={ppx} cy={ppy} r={near ? 3.5 : 2.2} fill={near ? '#8bffff' : '#3a6a8a'} />
                {near && <text x={ppx + 6} y={ppy + 4} fill="#8bffff" fontSize={7} fontFamily="monospace" opacity={0.8}>{p.name}</text>}
              </g>
            )
          })}
          <circle cx={sx} cy={sy} r={4.5} fill="#00f3ff" />
          <circle cx={sx} cy={sy} r={8} fill="none" stroke="#00f3ff" strokeWidth={0.8} opacity={0.4} />
        </svg>
      </div>

      {/* Bottom right: speed / telemetry */}
      <div className="hud-panel hud-speed">
        <div className="hud-label">VITESSE</div>
        <div className="hud-speed-value" style={{ color: boosting ? '#00f3ff' : '#7de8ff' }}>
          {speed.toFixed(0)}<span className="hud-speed-unit">u/s</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <Bar pct={speed / 300} gradient={boosting ? 'linear-gradient(90deg,#00f3ff,#00ffbb)' : 'linear-gradient(90deg,#4ad6ff,#8bffff)'} />
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="hud-stat-row" style={{ color: boostFuel < 0.25 ? '#ff5533' : '#2a6880' }}>
            <span>PROPULSION</span><span>{Math.round(boostFuel * 100)}%</span>
          </div>
          <Bar pct={boostFuel} gradient="linear-gradient(90deg,#4488ff,#88aaff)" low />
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="hud-stat-row" style={{ color: hull < 0.25 ? '#ff5533' : '#2a6880' }}>
            <span>COQUE</span><span>{Math.round(hull * 100)}%</span>
          </div>
          <Bar pct={hull} gradient="linear-gradient(90deg,#00cc66,#44ff88)" low />
        </div>
        <div className="hud-coords">
          <div>X {px.toFixed(0)}  Y {py.toFixed(0)}  Z {pz.toFixed(0)}</div>
          <div>CAP {headingDeg.toFixed(0)}°</div>
        </div>
      </div>

      {/* Bottom left: controls */}
      <div className="hud-panel hud-controls">
        <div className="hud-label">CONTRÔLES</div>
        <table className="hud-controls-table">
          <tbody>
            {[['Z / W', 'Avancer'], ['S', 'Reculer'], ['Q / A', 'Gauche'], ['D', 'Droite'], ['Espace', 'Monter'], ['A / Ctrl', 'Descendre'], ['Shift', 'Boost'], ['E', 'Atterrir']].map(([k, v]) => (
              <tr key={k}><td className="hud-key-cell">{k}</td><td className="hud-val-cell">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
