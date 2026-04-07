import { Canvas, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SPAWN, PHYSICS_HZ } from '../constants'
import '../components/hud/hud.css'
import SpaceSkybox from '../components/environment/SpaceSkybox'
import Starfield from '../components/environment/Starfield'
import MilkyWay from '../components/environment/MilkyWay'
import Planet from '../components/planets/Planet'
import AsteroidBelt from '../components/asteroids/AsteroidBelt'
import ShipController from '../components/ship/ShipController'
import CameraFollow from '../components/camera/CameraFollow'
import HudOverlay from '../components/hud/HudOverlay'
import PlanetOverlay from '../components/hud/PlanetOverlay'
import LoadingScreen from '../components/hud/LoadingScreen'

function LandingDirector({ trigger, planet, onComplete }) {
  const { camera } = useThree()
  const prog = useRef({ v: 0 }), from = useRef(new THREE.Vector3()), to = useRef(new THREE.Vector3()), look = useRef(new THREE.Vector3())
  useEffect(() => {
    if (!trigger || !planet) return
    prog.current.v = 0; from.current.copy(camera.position)
    to.current.set(...planet.position).add(new THREE.Vector3(0, planet.radius * 0.5, planet.radius * 2))
    const tw = gsap.to(prog.current, { v: 1, duration: 1.5, ease: 'power2.inOut', onComplete })
    return () => tw.kill()
  }, [trigger, planet, camera, onComplete])
  useEffect(() => {}, [])
  return null
}

export default function SpaceScene() {
  const planets = useMemo(() => {
    const SC = 7.0, BZ = 500, ZS = 1600, XB = 5500, XS = 700, YF = 0.25
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

  const shipStateRef = useRef({ px: SPAWN.x, py: SPAWN.y, pz: SPAWN.z, qx: 0, qy: 0, qz: 0, qw: 1, speed: 0, boosting: false })
  const damageOverlayRef = useRef()
  const damageRef = useRef(0)
  const collidablesRef = useRef([])

  const [telemetry, setTelemetry] = useState({ px: SPAWN.x, py: SPAWN.y, pz: SPAWN.z, speed: 0, headingDeg: 0, boostFuel: 1, boosting: false, hull: 1 })
  const [landTrig, setLandTrig] = useState(0)
  const [isCinematic, setIsCinematic] = useState(false)
  const [overlayPlanet, setOverlayPlanet] = useState(null)
  const [landPlanet, setLandPlanet] = useState(null)
  const [fadeOp, setFadeOp] = useState(0)
  const [showTitle, setShowTitle] = useState(true)

  useEffect(() => { const t = setTimeout(() => setShowTitle(false), 5000); return () => clearTimeout(t) }, [])

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
  }, [planets, telemetry.px, telemetry.py, telemetry.pz])

  const canLand = Boolean(nearestPlanet && nearestPlanet.distance < Math.max(260, nearestPlanet.radius * 0.22) && !isCinematic && !overlayPlanet)
  const registerMesh = useCallback(m => { if (m && !collidablesRef.current.includes(m)) collidablesRef.current.push(m) }, [])

  useEffect(() => {
    const onKey = e => {
      if (e.key.toLowerCase() !== 'e' || !canLand || !nearestPlanet) return
      setLandPlanet(nearestPlanet); setIsCinematic(true); setLandTrig(v => v + 1)
      const o1 = { v: 0 }; gsap.to(o1, { v: 1, duration: 0.5, ease: 'power2.in', onUpdate() { setFadeOp(o1.v) } })
      setTimeout(() => { setOverlayPlanet(nearestPlanet); setIsCinematic(false) }, 1500)
      setTimeout(() => { const o2 = { v: 1 }; gsap.to(o2, { v: 0, duration: 0.5, ease: 'power2.out', onUpdate() { setFadeOp(o2.v) } }) }, 1600)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canLand, nearestPlanet])

  return (
    <>
      <div ref={damageOverlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0, background: 'radial-gradient(ellipse at center, rgba(200,10,10,0.08) 0%, rgba(130,0,0,0.88) 100%)', transition: 'opacity 80ms' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: fadeOp, pointerEvents: 'none', zIndex: 9 }} />

      {showTitle && (
        <div className="title-overlay" style={{ opacity: showTitle ? 1 : 0 }}>
          <div className="title-text">COSMIC VOYAGER</div>
        </div>
      )}

      <HudOverlay telemetry={telemetry} planets={planets} nearestPlanet={nearestPlanet} canLand={canLand} />
      <PlanetOverlay planet={overlayPlanet} onClose={() => setOverlayPlanet(null)} />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 6, 32], fov: 72, near: 0.5, far: 24000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor('#010208', 1)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.22} color="#121a2c" />
          <hemisphereLight skyColor="#1a2840" groundColor="#03030c" intensity={0.20} />
          <pointLight position={[0, 0, 0]} intensity={5.5} distance={24000} color="#ffe8c0" decay={1.5} />

          <SpaceSkybox />
          <Starfield />
          <MilkyWay />

          <LandingDirector trigger={landTrig} planet={isCinematic ? landPlanet : null} onComplete={() => {}} />

          <Physics gravity={[0, 0, 0]} timeStep={1 / PHYSICS_HZ}>
            <ShipController
              shipStateRef={shipStateRef}
              damageOverlayRef={damageOverlayRef}
              damageRef={damageRef}
              onShipMeshReady={registerMesh}
              enabled={!overlayPlanet && !isCinematic}
              onTelemetry={setTelemetry}
            />
            <AsteroidBelt center={[0, 0, -6800]} innerR={900} outerR={5000} count={200} ySpread={70} seed={7777} color="#6e7e8a" />
            {planets.map(p => (
              <Planet key={p.name} name={p.name} position={p.position} radius={p.radius} mapUrl={p.mapUrl} emissive={Boolean(p.emissive)} rotSpeed={p.rotSpeed ?? 0.02} onMeshReady={registerMesh} />
            ))}
          </Physics>

          <CameraFollow shipStateRef={shipStateRef} active={!overlayPlanet && !isCinematic} />

          <EffectComposer multisampling={0}>
            <Bloom intensity={0.85} mipmapBlur luminanceThreshold={0.16} luminanceSmoothing={0.30} />
            <Vignette darkness={0.45} offset={0.16} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </>
  )
}
