import * as Motion from 'framer-motion'
import { useEffect, useState } from 'react'
import { PROJECTS } from '../../data/projects'
import './hud.css'

export default function PlanetOverlay({ planet, onClose, reducedMotion }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') onClose?.() }
    if (planet) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [planet, onClose])
  if (!planet) return null
  const info = PROJECTS[planet.name]
  const minimal = !info
  const tr = reducedMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }

  return (
    <Motion.AnimatePresence>
      <Motion.motion.div
        key="bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
        className="planet-overlay-bg"
        onClick={onClose}
      >
        <Motion.motion.div
          initial={{ y: 60, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.96 }}
          transition={tr}
          className="planet-overlay-card"
          style={{ borderColor: `${(info?.theme || '#4fc3ff')}33`, boxShadow: `0 0 60px ${(info?.theme || '#4fc3ff')}22` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="planet-close-btn" onClick={onClose}>✕</button>
          {minimal ? (
            <div className="planet-minimal">
              <h2 className="planet-overlay-title">{planet.name}</h2>
              <p className="planet-overlay-body">Aucun projet sur {planet.name}. Continue ton exploration ✦</p>
              <button className="planet-overlay-btn planet-overlay-btn--secondary" onClick={onClose}>Fermer</button>
            </div>
          ) : (
            <>
              <div className="planet-overlay-grid">
                <Motion.motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.15 }}>
                  <div className="project-shot-wrap" style={{ borderColor: `${info.theme}44` }}>
                    {imgLoading && <div className="project-skeleton" />}
                    {!imgFailed ? (
                      <img key={planet.name} loading="lazy" src={info.image} alt={info.title} className="project-shot" onError={() => setImgFailed(true)} onLoad={() => setImgLoading(false)} />
                    ) : (
                      <div className="project-fallback" style={{ background: `linear-gradient(135deg, ${info.theme}55, rgba(0,0,0,0.65))` }}>{info.planet} 🪐</div>
                    )}
                  </div>
                </Motion.motion.div>
                <Motion.motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.25 }}>
                  <div className="planet-overlay-subtitle" style={{ color: info.theme }}>PROJET {String(info.index).padStart(2, '0')} / {String(info.total).padStart(2, '0')}</div>
                  <h2 className="planet-overlay-title">{info.title}</h2>
                  <p className="planet-overlay-sub">{info.subtitle}</p>
                  <p className="planet-overlay-body">{info.description || <em className="overlay-placeholder">// Description a venir - bientot en ligne</em>}</p>
                  <div className="overlay-stack-title">STACK TECHNIQUE</div>
                  {Array.isArray(info.stack) && info.stack.length > 0 ? <p className="planet-overlay-body">{info.stack.join(' / ')}</p> : <em className="overlay-placeholder">// Stack a completer</em>}
                  <div className="planet-overlay-actions">
                    <a className="planet-overlay-btn planet-overlay-btn--primary" style={{ background: info.theme }} href={info.url} target="_blank" rel="noopener noreferrer">VOIR LE SITE →</a>
                  </div>
                </Motion.motion.div>
              </div>
              <div className="planet-overlay-footer">PLANETE : {planet.name.toUpperCase()}   COORDS : {Math.round(planet.position[0])}, {Math.round(planet.position[1])}, {Math.round(planet.position[2])}</div>
            </>
          )}
        </Motion.motion.div>
      </Motion.motion.div>
    </Motion.AnimatePresence>
  )
}
