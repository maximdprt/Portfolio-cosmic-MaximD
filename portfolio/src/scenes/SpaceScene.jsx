import { Canvas, useThree } from '@react-three/fiber'
import { useProgress, useTexture, useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SPAWN } from '../constants'
import '../components/hud/hud.css'
import SpaceSkybox from '../components/environment/SpaceSkybox'
import Starfield from '../components/environment/Starfield'
import MilkyWay from '../components/environment/MilkyWay'
import NebulaBackdrop from '../components/environment/NebulaBackdrop'
import Planet from '../components/planets/Planet'
import AsteroidBelt from '../components/asteroids/AsteroidBelt'
import ShipController from '../components/ship/ShipController'
import CameraFollow from '../components/camera/CameraFollow'
import HudOverlay from '../components/hud/HudOverlay'
import PlanetOverlay from '../components/hud/PlanetOverlay'
import OnboardingOverlay from '../components/hud/OnboardingOverlay'
import CorridorAsteroids from '../components/asteroids/CorridorAsteroids'

// ── Preload ALL assets at module level ───────────────────────────────────────
const PLANET_MAPS = [
  '/mercurymap.png', '/venusmap.png', '/earthmap.png', '/marsmap.png',
  '/jupitermap.png', '/saturnmap.png', '/uranusmap.png', '/neptunemap.png',
  '/plutomap.png', '/moonmap.png', '/sunmap.png',
]
PLANET_MAPS.forEach(url => useTexture.preload(url))
useGLTF.preload('/dolph-1_-_light_fighter.glb')

function LandingDirector({ trigger, planet, onComplete }) {
  const { camera } = useThree()
  const prog = useRef({ v: 0 }), to = useRef(new THREE.Vector3())
  useEffect(() => {
    if (!trigger || !planet) return
    prog.current.v = 0
    to.current.set(...planet.position).add(new THREE.Vector3(0, planet.radius * 0.5, planet.radius * 2))
    const tw = gsap.to(prog.current, { v: 1, duration: 1.5, ease: 'power2.inOut', onComplete })
    return () => tw.kill()
  }, [trigger, planet, camera, onComplete])
  return null
}

function LoadingOverlay({ progress }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#04050b',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace", color: '#7de8ff', zIndex: 100,
      transition: 'opacity 0.6s', opacity: progress >= 100 ? 0 : 1,
      pointerEvents: progress >= 100 ? 'none' : 'all',
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6, marginBottom: 32, color: '#bfe9ff' }}>
        COSMIC VOYAGER
      </div>
      <div style={{ width: 280, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #4ad6ff, #00f3ff)',
          width: `${progress}%`, transition: 'width 200ms ease-out',
        }} />
      </div>
      <div style={{ marginTop: 18, fontSize: 11, letterSpacing: 2, color: '#2a6880' }}>
        CHARGEMENT {Math.round(progress)}%
      </div>
    </div>
  )
}

export default function SpaceScene() {
  const { progress, active } = useProgress()
  const isReady = !active && progress >= 100
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const touchDevice = useMemo(() => 'ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches, [])
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('cosmic_onboarded'))

  const planets = useMemo(() => {
    const SC = 14.0, BZ = 500, ZS = 1600, XB = 5500, XS = 700, YF = 0.25
    const mk = (d, i) => {
      const a = i * 1.1, r = XB + i * XS
      return { ...d, radius: d.baseR * SC, position: [Math.cos(a) * r, Math.sin(a) * r * YF, BZ - ZS * (i + 1)] }
    }
    const defs = [
      { name: 'Mercury', mapUrl: '/mercurymap.png', baseR: 28, rotSpeed: 0.012 },
      { name: 'Venus',   mapUrl: '/venusmap.png',   baseR: 37, rotSpeed: 0.008 },
      { name: 'Earth',   mapUrl: '/earthmap.png',   baseR: 44, rotSpeed: 0.022 },
      { name: 'Mars',    mapUrl: '/marsmap.png',    baseR: 35, rotSpeed: 0.018 },
      { name: 'Jupiter', mapUrl: '/jupitermap.png', baseR: 82, rotSpeed: 0.045 },
      { name: 'Saturn',  mapUrl: '/saturnmap.png',  baseR: 72, rotSpeed: 0.038 },
      { name: 'Uranus',  mapUrl: '/uranusmap.png',  baseR: 55, rotSpeed: 0.028 },
      { name: 'Neptune', mapUrl: '/neptunemap.png', baseR: 58, rotSpeed: 0.025 },
      { name: 'Pluto',   mapUrl: '/plutomap.png',   baseR: 30, rotSpeed: 0.006 },
    ]
    const list = defs.map(mk)
    const earth = list.find(p => p.name === 'Earth')
    const ev = new THREE.Vector3(...earth.position).normalize()
    const md = earth.radius * 1.75
    const Moon = { name: 'Moon', mapUrl: '/moonmap.png', baseR: 22, rotSpeed: 0.015, radius: 22 * SC, position: [earth.position[0] + ev.x * md, earth.position[1] + ev.y * md, earth.position[2] + ev.z * md] }
    const Sun = { name: 'Sun', mapUrl: '/sunmap.png', baseR: 120, rotSpeed: 0.004, radius: 120 * SC, position: [0, 0, 0], emissive: true }
    return [Sun, ...list, Moon]
  }, [])

  const shipStateRef    = useRef({ px: SPAWN.x, py: SPAWN.y, pz: SPAWN.z, qx: 0, qy: 0, qz: 0, qw: 1, speed: 0, boosting: false, yawVel: 0, yawInput: 0 })
  const collidablesRef   = useRef([])

  const [telemetry, setTelemetry]     = useState({ px: SPAWN.x, py: SPAWN.y, pz: SPAWN.z, speed: 0, headingDeg: 0, boostFuel: 1, boosting: false })
  const [landTrig, setLandTrig]       = useState(0)
  const [isCinematic, setIsCinematic] = useState(false)
  const [overlayPlanet, setOverlayPlanet] = useState(null)
  const [landPlanet, setLandPlanet]   = useState(null)
  const [fadeOp, setFadeOp]           = useState(0)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'h') setShowOnboarding(true)
      if (e.code === 'Escape') setOverlayPlanet(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nearestPlanet = useMemo(() => {
    let best = null, bestD = Infinity
    const { px, py, pz } = telemetry
    for (const p of planets) {
      if (p.name === 'Sun') continue
      const [ex, ey, ez] = p.position
      const dx = px - ex, dy = py - ey, dz = pz - ez
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) - p.radius
      if (d < bestD) { bestD = d; best = { ...p, distance: d } }
    }
    return best
  }, [planets, telemetry])

  const canLand = Boolean(nearestPlanet && nearestPlanet.distance < Math.max(260, nearestPlanet.radius * 0.22) && !isCinematic && !overlayPlanet)
  const registerMesh = useCallback(m => { if (m && !collidablesRef.current.includes(m)) collidablesRef.current.push(m) }, [])

  useEffect(() => {
    const onKey = e => {
      if (e.key.toLowerCase() !== 'e' || !canLand || !nearestPlanet || showOnboarding) return
      setLandPlanet(nearestPlanet); setIsCinematic(true); setLandTrig(v => v + 1)
      const o1 = { v: 0 }; gsap.to(o1, { v: 1, duration: 0.5, ease: 'power2.in', onUpdate() { setFadeOp(o1.v) } })
      setTimeout(() => { setOverlayPlanet(nearestPlanet); setIsCinematic(false) }, 1500)
      setTimeout(() => { const o2 = { v: 1 }; gsap.to(o2, { v: 0, duration: 0.5, ease: 'power2.out', onUpdate() { setFadeOp(o2.v) } }) }, 1600)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canLand, nearestPlanet, showOnboarding])

  return (
    <>
      <LoadingOverlay progress={progress} />

      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: fadeOp, pointerEvents: 'none', zIndex: 9 }} />
      <OnboardingOverlay
        open={isReady && showOnboarding}
        reducedMotion={reducedMotion}
        touchDevice={touchDevice}
        onStart={() => {
          localStorage.setItem('cosmic_onboarded', '1')
          setShowOnboarding(false)
        }}
      />
      {!overlayPlanet && <HudOverlay telemetry={telemetry} planets={planets} nearestPlanet={nearestPlanet} canLand={canLand} />}
      <PlanetOverlay planet={overlayPlanet} onClose={() => setOverlayPlanet(null)} reducedMotion={reducedMotion} />

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 6, 32], fov: 72, near: 1, far: 22000 }}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false, depth: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#060b16', 1)
          gl.shadowMap.enabled = false
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.36} color="#1e3150" />
          <hemisphereLight skyColor="#2c4770" groundColor="#0a1020" intensity={0.32} />
          <pointLight position={[0, 0, 0]} intensity={6.8} distance={22000} color="#ffe8c0" decay={1.4} />

          <SpaceSkybox />
          <Starfield count={window.matchMedia('(max-width: 800px)').matches ? 14000 : 28000} />
          <MilkyWay />
          <NebulaBackdrop quality="high" />

          <LandingDirector trigger={landTrig} planet={isCinematic ? landPlanet : null} onComplete={() => {}} />

          <ShipController
            shipStateRef={shipStateRef}
            planets={planets}
            onShipMeshReady={registerMesh}
            enabled={isReady && !overlayPlanet && !isCinematic && !showOnboarding}
            onTelemetry={setTelemetry}
          />
          <AsteroidBelt center={[0, 0, -6800]} innerR={900} outerR={5000} count={200} ySpread={70} seed={7777} color="#6e7e8a" />
          {planets.map(p => (
            <Planet
              key={p.name}
              name={p.name}
              position={p.position}
              radius={p.radius}
              mapUrl={p.mapUrl}
              emissive={Boolean(p.emissive)}
              rotSpeed={p.rotSpeed ?? 0.02}
              onMeshReady={registerMesh}
            />
          ))}

          <CorridorAsteroids planets={planets} />
          <CameraFollow shipStateRef={shipStateRef} active={!overlayPlanet && !isCinematic && !showOnboarding} />

          <EffectComposer multisampling={0}>
            <Bloom intensity={1.0} mipmapBlur luminanceThreshold={0.14} luminanceSmoothing={0.32} />
            <Vignette darkness={0.30} offset={0.14} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </>
  )
}
