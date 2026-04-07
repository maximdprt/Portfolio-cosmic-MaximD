import { motion, AnimatePresence } from 'framer-motion'
import { PLANET_CONTENT } from '../../constants'
import './hud.css'

export default function PlanetOverlay({ planet, onClose }) {
  if (!planet) return null
  const info = PLANET_CONTENT[planet.name] ?? { theme: '#8bd7ff', title: planet.name, subtitle: 'Exploration', body: 'Contenu à personnaliser.' }

  return (
    <AnimatePresence>
      <motion.div
        key="bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="planet-overlay-bg"
      >
        <motion.div
          initial={{ y: 44, opacity: 0, scale: 0.93 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="planet-overlay-card"
          style={{ borderColor: `${info.theme}44` }}
        >
          <div className="planet-overlay-subtitle" style={{ color: info.theme }}>{info.subtitle}</div>
          <h2 className="planet-overlay-title">{info.title}</h2>
          <p className="planet-overlay-body">{info.body}</p>
          <div className="planet-overlay-actions">
            <button onClick={onClose} className="planet-overlay-btn planet-overlay-btn--secondary" style={{ borderColor: `${info.theme}55` }}>← Fermer</button>
            <button className="planet-overlay-btn planet-overlay-btn--primary" style={{ background: info.theme }}>Ouvrir →</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
