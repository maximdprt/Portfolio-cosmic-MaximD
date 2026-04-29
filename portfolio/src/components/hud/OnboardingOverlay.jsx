import * as Motion from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

export default function OnboardingOverlay({ open, onStart, reducedMotion, touchDevice }) {
  const trIn = reducedMotion ? { duration: 0 } : { duration: 0.6, ease: EASE }

  return (
    <Motion.AnimatePresence>
      {open && (
        <Motion.motion.div className="onboarding-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}>
          <Motion.motion.div className="onboarding-card" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={trIn}>
            <div className="onboarding-title">✦ COSMIC VOYAGER ✦</div>
            <div className="onboarding-subtitle">PORTFOLIO INTERACTIF DE MAXIME D.</div>

            <div className="onboarding-sep">MISSION</div>
            <p className="onboarding-body">Explore le systeme solaire a bord de ton vaisseau.<br />Quatre planetes hebergent mes projets.<br />Approche-toi et appuie sur <span className="kbd">E</span> pour les decouvrir.</p>

            <div className="onboarding-sep">CONTROLES</div>
            <div className="onboarding-controls">
              <div><span className="kbd">Z / S</span> Avancer / Reculer</div>
              <div><span className="kbd">Q / D</span> Tourner gauche / droite</div>
              <div><span className="kbd">Espace / A</span> Monter / Descendre</div>
              <div><span className="kbd">Shift</span> Boost (vitesse x2)</div>
              <div><span className="kbd">E</span> Atterrir sur une planete proche</div>
              <div><span className="kbd">H</span> Rouvrir cette aide</div>
              <div><span className="kbd">Echap</span> Fermer un overlay projet</div>
            </div>

            <div className="onboarding-sep">ASTUCE</div>
            <p className="onboarding-body">Une mini-carte en haut a droite te montre la position des planetes. Les planetes avec un projet clignotent.</p>
            {touchDevice && <p className="onboarding-warning">Cette experience necessite un clavier. Pour une version mobile, contacte Maxime.</p>}
            <button className="onboarding-start" onClick={onStart} autoFocus>COMMENCER L'EXPLORATION</button>
          </Motion.motion.div>
        </Motion.motion.div>
      )}
    </Motion.AnimatePresence>
  )
}
