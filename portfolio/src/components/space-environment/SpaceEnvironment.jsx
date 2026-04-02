/* eslint-disable react-hooks/immutability, react-hooks/refs */
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, ToneMapping, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import SpaceSkybox from './SpaceSkybox'
import DistantStars from './DistantStars'
import SolarLightRig from './SolarLightRig'
import PlanetAtmosphere from './PlanetAtmosphere'
import SaturnRings from './SaturnRings'
import AsteroidBelt from './AsteroidBelt'
import SpaceDust from './SpaceDust'
import SunCorona from './SunCorona'
import { BELT_CONFIGS } from '../../configs/beltConfigs'
import { createAsteroidGeometryVariants } from '../../generators/asteroidGeometry'

const PLANETS = [
  { name: 'earth', position: [0, 0, -300], radius: 42, map: '/earthmap.png' },
  { name: 'moon', position: [42, 8, -620], radius: 24, map: '/moonmap.png' },
  { name: 'mercury', position: [-55, -7, -930], radius: 28, map: '/mercurymap.png' },
  { name: 'venus', position: [74, 10, -1240], radius: 36, map: '/venusmap.png' },
  { name: 'mars', position: [-96, -12, -1560], radius: 34, map: '/marsmap.png' },
  { name: 'jupiter', position: [120, 18, -1890], radius: 76, map: '/jupitermap.png' },
  { name: 'saturn', position: [-138, -14, -2230], radius: 68, map: '/saturnmap.png' },
  { name: 'uranus', position: [165, 20, -2580], radius: 52, map: '/uranusmap.png' },
  { name: 'neptune', position: [-188, -22, -2940], radius: 54, map: '/neptunemap.png' },
  { name: 'pluto', position: [206, 16, -3310], radius: 30, map: '/plutomap.png' },
]

const ATMOS = {
  earth: { color: '#4488FF', intensity: 1 },
  venus: { color: '#FFD080', intensity: 1 },
  mars: { color: '#FF8844', intensity: 0.3 },
  jupiter: { color: '#DDAA77', intensity: 1 },
  saturn: { color: '#EED088', intensity: 1 },
  uranus: { color: '#88DDEE', intensity: 1 },
  neptune: { color: '#4466FF', intensity: 1 },
}

function CameraFreeFlight({ probeRef }) {
  const { camera } = useThree()
  const keysRef = useRef({})

  useFrame((_, dt) => {
    const speed = 120 * dt
    if (keysRef.current.w) camera.position.z -= speed
    if (keysRef.current.s) camera.position.z += speed
    if (keysRef.current.a) camera.position.x -= speed
    if (keysRef.current.d) camera.position.x += speed
    if (keysRef.current.q) camera.position.y += speed
    if (keysRef.current.e) camera.position.y -= speed
    probeRef.current.position.copy(camera.position)
    probeRef.current.userData.velocity = new THREE.Vector3(0, 0, 0)
  })

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key.toLowerCase()] = true
    }
    const up = (e) => {
      keysRef.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return null
}

function PlanetMeshes() {
  const maps = useTexture(PLANETS.map((p) => p.map))
  const textures = useMemo(() => {
    const out = {}
    for (let i = 0; i < PLANETS.length; i++) out[PLANETS[i].name] = maps[i]
    return out
  }, [maps])

  return (
    <>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[120, 72, 72]} />
        <meshStandardMaterial color="#fff1d4" emissive="#FFF5E1" emissiveIntensity={5} toneMapped={false} />
      </mesh>
      <SunCorona radius={120} />
      {PLANETS.map((p) => (
        <mesh key={p.name} position={p.position}>
          <sphereGeometry args={[p.radius, 72, 72]} />
          <meshStandardMaterial map={textures[p.name]} roughness={0.9} metalness={0.05} />
        </mesh>
      ))}
      {PLANETS.filter((p) => ATMOS[p.name]).map((p) => (
        <PlanetAtmosphere key={`${p.name}-atmo`} position={p.position} radius={p.radius} color={ATMOS[p.name].color} intensity={ATMOS[p.name].intensity} />
      ))}
      <SaturnRings position={PLANETS.find((p) => p.name === 'saturn').position} />
    </>
  )
}

function PerformanceProbe() {
  const { gl } = useThree()
  useFrame(() => {
    gl.info.autoReset = true
  })
  return null
}

export default function SpaceEnvironment() {
  const asteroidVariants = useMemo(() => createAsteroidGeometryVariants(), [])
  const probeRef = useRef(new THREE.Object3D())

  return (
    <>
      <primitive object={probeRef.current} />
      <CameraFreeFlight probeRef={probeRef} />
      <SpaceSkybox />
      <DistantStars />
      <SolarLightRig />
      <PlanetMeshes />
      {BELT_CONFIGS.map((config, index) => (
        <AsteroidBelt key={config.name} beltConfig={config} geometry={asteroidVariants[index % asteroidVariants.length]} />
      ))}
      <SpaceDust shipRef={probeRef} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur radius={0.85} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.3} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
        <ChromaticAberration offset={[0.0006, 0.0006]} radialModulation modulationOffset={0.5} />
      </EffectComposer>

      <PerformanceProbe />
    </>
  )
}
