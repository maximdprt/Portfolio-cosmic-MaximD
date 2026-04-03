/* eslint-disable no-unused-vars, react-hooks/immutability */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, Trail, useGLTF, useTexture } from '@react-three/drei'
import { InstancedRigidBodies, Physics, RigidBody } from '@react-three/rapier'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

const PLANET_CONTENT = {
  Earth: {
    key: 'Aqualis',
    theme: '#4fc3ff',
    title: 'Aqualis',
    subtitle: 'Qui je suis',
    body: 'Bio, photo et valeurs. Un profil clair, humain, et oriente vers la collaboration.',
  },
  Mars: {
    key: 'Forge Prime',
    theme: '#ff9a52',
    title: 'Forge Prime',
    subtitle: 'Mes projets',
    body: 'Cards interactives: projets, stack technique, challenges et resultats.',
  },
  Venus: {
    key: 'Synthos',
    theme: '#58d68d',
    title: 'Synthos',
    subtitle: 'Mes competences',
    body: 'Arbres de skills animes: frontend, 3D, backend, UX et tooling.',
  },
  Neptune: {
    key: 'Nexara',
    theme: '#be8dff',
    title: 'Nexara',
    subtitle: 'Contact',
    body: 'Formulaire flottant, liens pros et moyens rapides pour me joindre.',
  },
  Sun: {
    key: 'Station Zero',
    theme: '#d9d9df',
    title: 'Station Zero',
    subtitle: 'CV',
    body: 'Acces direct au CV telechargeable et resume professionnel.',
  },
}

// World size for a closed "box" space (visual + clamp).
const WORLD_HALF_SIZE = 6000
const WORLD_MARGIN = 180

function Starfield({ count = 22000, radius = 12000 }) {
  const geometry = useMemo(() => {
    // Deterministic-ish RNG so the scene looks the same across refreshes.
    const rand = (() => {
      let seed = 1337
      return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
    })()

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random point on/in a sphere (more natural than a cube).
      const u = rand()
      const v = rand()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      // Mix near + far stars so space is always visible from spawn.
      const near = rand() < 0.35
      const r = near ? 250 + 1800 * rand() : radius * (0.72 + 0.28 * rand())

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.cos(phi)
      const z = r * Math.sin(phi) * Math.sin(theta)

      positions[i * 3 + 0] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Slight blue/white variety.
      const b = 0.85 + 0.15 * rand()
      const g = 0.85 + 0.15 * rand()
      const rC = 0.8 + 0.2 * rand()
      colors[i * 3 + 0] = rC
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [count, radius])

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.34}
        sizeAttenuation
        vertexColors
        transparent
        opacity={1}
        depthWrite={false}
      />
    </points>
  )
}

function CubeStarfield({ count = 26000, boxHalf = WORLD_HALF_SIZE }) {
  const geometry = useMemo(() => {
    // Deterministic-ish RNG so the scene looks the same across refreshes.
    const rand = (() => {
      let seed = 424242
      return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
    })()

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random point inside a cube => looks more like a boxed "sky".
      const x = (rand() * 2 - 1) * boxHalf
      const y = (rand() * 2 - 1) * boxHalf
      const z = (rand() * 2 - 1) * boxHalf

      positions[i * 3 + 0] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Slight blue/white variety.
      const b = 0.85 + 0.15 * rand()
      const g = 0.85 + 0.15 * rand()
      const r = 0.8 + 0.2 * rand()
      colors[i * 3 + 0] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [count, boxHalf])

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.32} sizeAttenuation vertexColors transparent opacity={1} depthWrite={false} />
    </points>
  )
}

function SpaceCubeSkybox({ boxHalf = WORLD_HALF_SIZE }) {
  return (
    <mesh>
      <boxGeometry args={[boxHalf * 2, boxHalf * 2, boxHalf * 2]} />
      <meshBasicMaterial color="#020308" side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function NebulaAndFog() {
  const { scene } = useThree()
  const nebulaRef = useRef(null)
  const tmpColor = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    tmpColor.set('#0a1328')
    scene.fog = new THREE.FogExp2(tmpColor, 0.00012)
    return () => {
      scene.fog = null
    }
  }, [scene, tmpColor])

  const material = useMemo(() => {
    const vertexShader = `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;

      varying vec3 vDir;

      uniform float uTime;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float n000 = hash(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));

        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);

        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);

        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vDir);

        float t = uTime * 0.02;
        vec3 p = dir;
        // Very light distortion so the nebula feels alive.
        p += vec3(0.0, t, 0.0);

        float n = fbm(p * 3.2);
        float glow = smoothstep(0.25, 0.8, n);

        vec3 deep = vec3(0.01, 0.03, 0.08);
        vec3 mid = vec3(0.02, 0.12, 0.35);
        vec3 hot = vec3(0.15, 0.45, 1.0);

        vec3 col = mix(deep, mid, glow);
        col += hot * pow(glow, 2.2) * 0.08;

        // Alpha designed for a subtle but visible nebula.
        float alpha = glow * 0.22;
        gl_FragColor = vec4(col, alpha);
      }
    `

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
  }, [])

  useFrame((state) => {
    if (!nebulaRef.current) return
    nebulaRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh>
      <sphereGeometry args={[8500, 80, 80]} />
      <primitive ref={nebulaRef} object={material} attach="material" />
    </mesh>
  )
}

function PulsingRing({ lightColor = '#6ed9ff' }) {
  const ringMatRef = useRef(null)
  const groupRef = useRef(null)
  const color = useMemo(() => new THREE.Color(lightColor), [lightColor])

  useFrame((state) => {
    const mat = ringMatRef.current
    if (!mat) return

    const camDist = state.camera.position.length()
    const proximity = 1 - THREE.MathUtils.clamp(camDist / 18, 0, 1)
    const t = state.clock.elapsedTime
    const pulse = 0.25 + 0.75 * proximity * (0.5 + 0.5 * Math.sin(t * 4.5))

    mat.opacity = 0.06 + pulse * 0.85
    if (groupRef.current) {
      const s = 1 + 0.03 * pulse
      groupRef.current.scale.setScalar(s)
    }

    // Small color breathing.
    const hsl = {}
    color.getHSL(hsl)
    mat.color.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + 0.06 * pulse, 0, 1))
  })

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.2, 7.75, 160]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={lightColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function FloatingName({ name = 'COSMIC VOYAGER' }) {
  const ref = useRef(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.y = 4.6 + Math.sin(t * 1.2) * 0.22
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.22
  })

  return (
    <Text
      ref={ref}
      position={[0, 9.2, 0]}
      fontSize={1.6}
      color="#bfe9ff"
      anchorX="center"
      anchorY="middle"
      maxWidth={16}
      lineHeight={1.1}
    >
      {name}
    </Text>
  )
}

function HudOverlay({ telemetry, planets, nearestPlanet, canLand }) {
  const speed = telemetry.speed ?? 0
  const pos = telemetry.position ?? new THREE.Vector3()
  const heading = telemetry.headingDeg ?? 0
  const boost = telemetry.boostLevel ?? 0
  const miniMapSize = 150
  const scale = 0.018
  const shipX = miniMapSize / 2 + pos.x * scale
  const shipY = miniMapSize / 2 + pos.z * scale

  return (
    <>
      <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', width: 280, pointerEvents: 'none' }}>
        <div style={{ color: canLand ? '#8bf5ff' : '#b7d4f0', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>
          {canLand && nearestPlanet ? `APPROCHE ${nearestPlanet.name} - APPUIE SUR E` : 'EXPLORATION SPATIALE'}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 16, bottom: 16, pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace', color: '#7de8ff', background: 'rgba(2,10,20,0.55)', border: '1px solid rgba(120,220,255,0.3)', borderRadius: 10, padding: 10, width: 260 }}>
        <div>VITESSE: {speed.toFixed(1)} u/s</div>
        <div>X: {pos.x.toFixed(1)} Y: {pos.y.toFixed(1)} Z: {pos.z.toFixed(1)}</div>
        <div>CAP: {heading.toFixed(0)}°</div>
        <div style={{ marginTop: 8, height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ width: `${Math.round(boost * 100)}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#4ad6ff,#8bffff)' }} />
        </div>
      </div>

      <div style={{ position: 'absolute', right: 16, bottom: 16, pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace', color: '#7de8ff', background: 'rgba(2,10,20,0.55)', border: '1px solid rgba(120,220,255,0.3)', borderRadius: 10, padding: 10 }}>
        <div style={{ marginBottom: 6 }}>MINI-MAP</div>
        <svg width={miniMapSize} height={miniMapSize} style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 8 }}>
          <circle cx={miniMapSize / 2} cy={miniMapSize / 2} r={miniMapSize / 2 - 8} fill="none" stroke="rgba(120,220,255,0.35)" />
          {planets.map((p) => (
            <circle key={p.name} cx={miniMapSize / 2 + p.position[0] * scale} cy={miniMapSize / 2 + p.position[2] * scale} r={3} fill={nearestPlanet?.name === p.name ? '#8bffff' : '#8bb0d4'} />
          ))}
          <circle cx={shipX} cy={shipY} r={4} fill="#00f3ff" />
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 52, right: 16, width: 120, height: 120, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(120,220,255,0.35)' }} />
        <motion.div
          animate={{ scale: canLand ? [1, 1.25, 1] : 1, opacity: canLand ? [0.25, 0.5, 0.25] : 0.15 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: '1px solid rgba(120,220,255,0.45)' }}
        />
      </div>

      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace', color: '#8fdfff', textAlign: 'center' }}>
        <span>N</span> · <span>E</span> · <span>S</span> · <span>W</span> <span style={{ marginLeft: 8 }}>({heading.toFixed(0)}°)</span>
      </div>
    </>
  )
}

function PlanetOverlay({ planet, onClose }) {
  if (!planet) return null
  const info = PLANET_CONTENT[planet.name] ?? {
    title: planet.name,
    subtitle: 'Exploration',
    body: 'Contenu planetes a personnaliser.',
    theme: '#8bd7ff',
  }
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 10 }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ width: 'min(780px, 92vw)', borderRadius: 16, border: `1px solid ${info.theme}`, background: 'rgba(8,14,26,0.88)', color: '#d8efff', fontFamily: 'JetBrains Mono, monospace', padding: 20 }}
        >
          <div style={{ color: info.theme, fontSize: 14 }}>{info.subtitle}</div>
          <h2 style={{ margin: '4px 0 10px 0' }}>{info.title}</h2>
          <p style={{ lineHeight: 1.6 }}>{info.body}</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${info.theme}`, background: 'transparent', color: '#d8efff' }}>
              Fermer
            </button>
            <button style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: info.theme, color: '#00121b' }}>
              Ouvrir details
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function LandingDirector({ trigger, planet, onComplete }) {
  const { camera } = useThree()
  const progressRef = useRef({ value: 0 })
  const startPos = useRef(new THREE.Vector3())
  const targetPos = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!trigger || !planet) return
    progressRef.current.value = 0
    startPos.current.copy(camera.position)
    const p = new THREE.Vector3(...planet.position)
    targetPos.current.copy(p).add(new THREE.Vector3(0, planet.radius * 0.6, planet.radius * 2.2))
    const tween = gsap.to(progressRef.current, {
      value: 1,
      duration: 1.35,
      ease: 'power2.inOut',
      onComplete,
    })
    return () => tween.kill()
  }, [camera, onComplete, planet, trigger])

  useFrame(() => {
    if (!planet || progressRef.current.value <= 0) return
    camera.position.lerpVectors(startPos.current, targetPos.current, progressRef.current.value)
    lookAt.current.set(planet.position[0], planet.position[1], planet.position[2])
    camera.lookAt(lookAt.current)
  })

  return null
}

function TexturedPlanet({ position, radius, mapUrl, emissive = false, rotationSpeed = 0.08, onMeshReady }) {
  const meshRef = useRef(null)
  const map = useTexture(mapUrl)

  useFrame((_, dt) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += rotationSpeed * dt
  })

  return (
    <RigidBody type="fixed" colliders="ball" position={position}>
      <mesh
        ref={(mesh) => {
          meshRef.current = mesh
          if (mesh && onMeshReady) onMeshReady(mesh)
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={map}
          emissive={emissive ? '#ffd68a' : '#000000'}
          emissiveIntensity={emissive ? 0.7 : 0}
          roughness={emissive ? 0.95 : 0.9}
          metalness={0}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.08, 32, 32]} />
        <meshBasicMaterial
          color={emissive ? '#ffdca8' : '#7ec8ff'}
          transparent
          opacity={emissive ? 0.14 : 0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </RigidBody>
  )
}

function WarpTunnel({ active }) {
  const group = useRef(null)
  useFrame((state, dt) => {
    if (!group.current) return
    const target = active ? 1 : 0
    // Beam strictly shown while boosting (no lingering visible state).
    group.current.visible = Boolean(active)
    const s = THREE.MathUtils.lerp(group.current.scale.x, target, 1 - Math.exp(-8 * dt))
    group.current.scale.set(s, s, s)
    group.current.rotation.z = state.clock.elapsedTime * 0.25
  })
  return (
    <group ref={group} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.8, 6.5, 42, 24, 1, true]} />
        <meshBasicMaterial color="#9fe6ff" transparent opacity={0.12} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function NebulaBackdrops() {
  const textures = useTexture(['/earthmap.png', '/neptunemap.png', '/venusmap.png'])
  return (
    <group>
      <mesh position={[-1400, 620, -5200]} rotation={[0, 0.4, 0]}>
        <planeGeometry args={[3800, 2200]} />
        <meshBasicMaterial map={textures[0]} transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[1800, -420, -6400]} rotation={[0.08, -0.6, 0]}>
        <planeGeometry args={[4200, 2600]} />
        <meshBasicMaterial map={textures[1]} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[300, 920, -7600]} rotation={[-0.1, 0.15, 0]}>
        <planeGeometry args={[5000, 3200]} />
        <meshBasicMaterial map={textures[2]} transparent opacity={0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function ObstacleField({
  count = 260,
  innerRadius = 420,
  outerRadius = 3380,
  center = [0, 0, 0],
  ySpread = 30,
  baseScale = 2.2,
  seed = 1234,
  color = '#8a98a8',
  onMeshReady,
}) {
  const geometries = useMemo(
    () => [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
    ],
    [],
  )

  const groups = useMemo(() => {
    const rand = (() => {
      let s = seed | 0
      return () => {
        s = (s * 1664525 + 1013904223) | 0
        return ((s >>> 0) & 0xffffffff) / 0x100000000
      }
    })()

    const out = [[], [], []]
    const geoCount = out.length
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2
      const radius = innerRadius + (outerRadius - innerRadius) * rand()
      const height = (rand() * 2 - 1) * ySpread
      const x = center[0] + Math.cos(angle) * radius
      const y = center[1] + height
      const z = center[2] + Math.sin(angle) * radius
      const rawGeoId = Math.floor(rand() * geoCount)
      const geoId = Number.isFinite(rawGeoId) ? THREE.MathUtils.clamp(rawGeoId, 0, geoCount - 1) : 0
      const sx = baseScale * (0.7 + rand() * 1.4)
      const sy = baseScale * (0.7 + rand() * 1.4)
      const sz = baseScale * (0.7 + rand() * 1.4)

      if (!out[geoId]) out[geoId] = []
      out[geoId].push({
        key: `${seed}-${i}`,
        position: [x, y, z],
        rotation: [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2],
        scale: [sx, sy, sz],
      })
    }
    return out
  }, [baseScale, center, count, innerRadius, outerRadius, seed, ySpread])

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.94,
        metalness: 0.02,
      }),
    [color],
  )

  return (
    <group>
      {groups.map((instances, idx) => (
        <InstancedRigidBodies key={`${seed}-${idx}`} instances={instances} type="fixed" colliders="ball">
          <instancedMesh
            ref={(mesh) => {
              if (mesh && onMeshReady) onMeshReady(mesh)
            }}
            args={[geometries[idx], material, instances.length]}
            castShadow={false}
            receiveShadow={false}
          />
        </InstancedRigidBodies>
      ))}
    </group>
  )
}

function ShipController({
  damageOverlayRef,
  damageRef,
  collidableMeshes,
  onShipMeshReady,
  controlsEnabled,
  onTelemetry,
}) {
  const shipRef = useRef(null)
  const shipBodyRef = useRef(null)
  const keysRef = useRef({
    z: false,
    s: false,
    q: false,
    d: false,
    a: false,
    space: false,
    shift: false,
  })

  const vel = useRef(new THREE.Vector3())
  // Spawn point tuned so the first planet is reached in ~30s (no boost).
  const SPAWN_Z = 800
  const pos = useRef(new THREE.Vector3(0, 0, SPAWN_Z))
  const yaw = useRef(0)
  const inputSmoothedRef = useRef(new THREE.Vector3())
  const noseDirSmoothedRef = useRef(new THREE.Vector3(0, 0, -1))
  const fighterModel = useGLTF('/dolph-1_-_light_fighter.glb')
  const tmpCamTarget = useMemo(() => new THREE.Vector3(), [])
  const tmpLookAt = useMemo(() => new THREE.Vector3(), [])
  const tmpShipWorld = useMemo(() => new THREE.Vector3(), [])
  const tmpShipQuat = useMemo(() => new THREE.Quaternion(), [])
  const tmpCamOffset = useMemo(() => new THREE.Vector3(), [])
  const tmpSpringDisplacement = useMemo(() => new THREE.Vector3(), [])
  const tmpSpringAccel = useMemo(() => new THREE.Vector3(), [])
  const tmpFocusOffset = useMemo(() => new THREE.Vector3(), [])
  const tmpDesiredQuat = useMemo(() => new THREE.Quaternion(), [])
  const tmpEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])
  const tmpMoveDir = useMemo(() => new THREE.Vector3(), [])
  const tmpLocalForward = useMemo(() => new THREE.Vector3(0, 0, -1), [])
  const tmpRayDirLocal = useMemo(() => new THREE.Vector3(), [])
  const tmpRayDirWorld = useMemo(() => new THREE.Vector3(), [])
  const tmpInputFrontDir = useMemo(() => new THREE.Vector3(), [])
  const tmpVelDir = useMemo(() => new THREE.Vector3(), [])
  const tmpVelDirFront = useMemo(() => new THREE.Vector3(), [])
  const tmpBlendDir = useMemo(() => new THREE.Vector3(), [])
  const raycasterRef = useRef(new THREE.Raycaster())
  const camVelRef = useRef(new THREE.Vector3())
  const cameraLocalRef = useRef(new THREE.Vector3(0, 2.4, 8))
  const cameraDistanceRef = useRef(8)
  const leftTrailRef = useRef(null)
  const rightTrailRef = useRef(null)
  const leftThrusterRef = useRef(null)
  const rightThrusterRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (e) => {
      // Avoid interfering with inputs (if you ever add UI).
      const t = e.target
      const tag = t && typeof t.tagName === 'string' ? t.tagName.toLowerCase() : ''
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      if (e.key === 'z' || e.key === 'Z') keysRef.current.z = true
      if (e.key === 's' || e.key === 'S') keysRef.current.s = true
      if (e.key === 'q' || e.key === 'Q') keysRef.current.q = true
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = true
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = true
      if (e.code === 'Space') {
        keysRef.current.space = true
        e.preventDefault()
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') keysRef.current.shift = true
    }

    const onKeyUp = (e) => {
      if (e.key === 'z' || e.key === 'Z') keysRef.current.z = false
      if (e.key === 's' || e.key === 'S') keysRef.current.s = false
      if (e.key === 'q' || e.key === 'Q') keysRef.current.q = false
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = false
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = false
      if (e.code === 'Space') keysRef.current.space = false
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') keysRef.current.shift = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (onShipMeshReady && fighterModel?.scene) onShipMeshReady(fighterModel.scene)
  }, [fighterModel, onShipMeshReady])

  useFrame((state, dt) => {
    const ship = shipRef.current
    if (!ship) return

    const frameDt = Math.min(dt, 0.05)
    const keys = keysRef.current
    const boosting = Boolean(keys.shift)
    // Hide the blue trails unless we're boosting.
    if (leftTrailRef.current) leftTrailRef.current.visible = boosting
    if (rightTrailRef.current) rightTrailRef.current.visible = boosting
    if (leftThrusterRef.current) leftThrusterRef.current.visible = boosting
    if (rightThrusterRef.current) rightThrusterRef.current.visible = boosting

    const baseSpeed = 9.5
    const speed = keys.shift ? baseSpeed * 2 : baseSpeed

    // Raw input in world axes.
    // Z: forward (-Z), S: backward (+Z), D: right (+X), Q: left (-X).
    const rawInput = controlsEnabled
      ? new THREE.Vector3(
        (keys.d ? 1 : 0) - (keys.q ? 1 : 0),
        (keys.space ? 1 : 0) - (keys.a ? 1 : 0),
        (keys.s ? 1 : 0) - (keys.z ? 1 : 0),
      )
      : new THREE.Vector3()

    // Prevent faster diagonal input.
    if (rawInput.lengthSq() > 1) rawInput.normalize()

    // Low-pass filter input direction for smooth motion (reduces jitter).
    const inputSmooth = 1 - Math.exp(-(keys.shift ? 12.0 : 10.0) * frameDt)
    inputSmoothedRef.current.lerp(rawInput, inputSmooth)

    const input = inputSmoothedRef.current
    if (input.lengthSq() > 1) input.normalize()

    const hasInput = input.lengthSq() > 0.0001
    const targetVel = input.clone().multiplyScalar(speed)

    // Rotation target (nose) logic:
    // - D/Q (right/left) => nose tilts toward displacement
    // - Z => nose stays in front
    // - S, when it's the only key => nose stays in front (pure backward walk)
    const reverseOnly =
      Boolean(keys.s) &&
      !keys.z &&
      !keys.d &&
      !keys.q &&
      !keys.space &&
      !keys.a

    if (reverseOnly) {
      yaw.current = 0
      tmpDesiredQuat.identity()
      noseDirSmoothedRef.current.set(0, 0, -1)
    } else if (hasInput) {
      // Nose aim: keep "front-facing" (z negative) even while S/backward,
      // so the ship does not flip 180° when going backward.
      tmpInputFrontDir.copy(input)
      tmpInputFrontDir.z = -Math.abs(tmpInputFrontDir.z)
      if (tmpInputFrontDir.lengthSq() < 0.0001) tmpInputFrontDir.set(0, 0, -1)
      tmpInputFrontDir.normalize()

      // Blend input direction with actual velocity direction for natural feel.
      const velSpeedSq = vel.current.lengthSq()
      if (velSpeedSq > 0.0001) {
        tmpVelDir.copy(vel.current).normalize()
        tmpVelDirFront.copy(tmpVelDir)
        tmpVelDirFront.z = -Math.abs(tmpVelDirFront.z)
        if (tmpVelDirFront.lengthSq() < 0.0001) tmpVelDirFront.copy(tmpInputFrontDir)
        tmpVelDirFront.normalize()
      } else {
        tmpVelDirFront.copy(tmpInputFrontDir)
      }

      const inputWeight = 0.78
      tmpBlendDir.copy(tmpInputFrontDir).multiplyScalar(inputWeight).addScaledVector(tmpVelDirFront, 1 - inputWeight)
      if (tmpBlendDir.lengthSq() < 0.0001) tmpBlendDir.copy(tmpInputFrontDir)
      tmpBlendDir.normalize()

      // Extra smoothing for nose direction to prevent micro-jitter.
      const noseSmooth = 1 - Math.exp(-8.0 * frameDt)
      noseDirSmoothedRef.current.lerp(tmpBlendDir, noseSmooth)
      if (noseDirSmoothedRef.current.lengthSq() < 0.0001) noseDirSmoothedRef.current.set(0, 0, -1)
      noseDirSmoothedRef.current.normalize()

      yaw.current = Math.atan2(noseDirSmoothedRef.current.x, -noseDirSmoothedRef.current.z)
      tmpDesiredQuat.setFromUnitVectors(tmpLocalForward, noseDirSmoothedRef.current)
    } else {
      // Avoid any snap when no input.
      tmpDesiredQuat.copy(ship.quaternion)
    }

    // Smooth ship rotation (no brutal snap).
    const rotSmooth = 2.2
    const shipLerpAlpha = 1 - Math.exp(-(rotSmooth * frameDt))
    ship.quaternion.slerp(tmpDesiredQuat, shipLerpAlpha)

    // Inertial motion with drag:
    // - while input exists: accelerate toward targetVel smoothly
    // - while no input: exponential drag to keep motion smooth (no "lerp to zero" twitch)
    if (hasInput) {
      const accelSmooth = keys.shift ? 4.6 : 3.6
      const velLerpAlpha = 1 - Math.exp(-(accelSmooth * frameDt))
      vel.current.lerp(targetVel, velLerpAlpha)
    } else {
      const drag = 1.25 // higher = stops sooner
      vel.current.multiplyScalar(Math.exp(-drag * frameDt))
    }
    // Kill sub-pixel jitter when nearly stopped.
    if (vel.current.lengthSq() < 0.000001) vel.current.set(0, 0, 0)

    pos.current.addScaledVector(vel.current, frameDt)

    // Keep the ship inside the closed square/box volume.
    const min = -WORLD_HALF_SIZE + WORLD_MARGIN
    const max = WORLD_HALF_SIZE - WORLD_MARGIN
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, min, max)
    pos.current.y = THREE.MathUtils.clamp(pos.current.y, min, max)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, min, max)
    ship.position.copy(pos.current)
    if (shipBodyRef.current) shipBodyRef.current.setNextKinematicTranslation(pos.current)

    // Fixed follow camera (medium distance), always behind and above.
    const targetArmLength = 25.5
    const pivotOffsetY = 1.0
    const sphereRadius = 0.5
    const targetCamLocal = new THREE.Vector3(0, 6.8, targetArmLength)
    cameraLocalRef.current.lerp(targetCamLocal, 1 - Math.exp(-10 * frameDt))

    ship.getWorldPosition(tmpShipWorld)
    ship.getWorldQuaternion(tmpShipQuat)

    // Anti-clipping: raycast + sphere radius margin.
    let blockedDistance = targetArmLength
    if (collidableMeshes && collidableMeshes.current.length > 0) {
      const pivotWorld = tmpShipWorld.clone().add(new THREE.Vector3(0, pivotOffsetY, 0))
      tmpRayDirLocal.copy(cameraLocalRef.current).sub(new THREE.Vector3(0, pivotOffsetY, 0)).normalize()
      tmpRayDirWorld.copy(tmpRayDirLocal).applyQuaternion(tmpShipQuat).normalize()
      const raycaster = raycasterRef.current
      raycaster.set(pivotWorld, tmpRayDirWorld)
      raycaster.near = 0
      raycaster.far = targetArmLength
      const hits = raycaster.intersectObjects(collidableMeshes.current, true)
      if (hits.length > 0) blockedDistance = Math.max(1.5, hits[0].distance - sphereRadius)
    }
    if (blockedDistance < cameraLocalRef.current.z) {
      cameraLocalRef.current.z = THREE.MathUtils.lerp(
        cameraLocalRef.current.z,
        blockedDistance,
        1 - Math.exp(-10 * frameDt),
      )
    } else {
      cameraLocalRef.current.z = THREE.MathUtils.lerp(cameraLocalRef.current.z, targetArmLength, 1 - Math.exp(-7 * frameDt))
    }

    tmpCamOffset.copy(cameraLocalRef.current).applyQuaternion(tmpShipQuat)
    tmpCamTarget.copy(tmpShipWorld).add(tmpCamOffset)

    // Critically-smoothed camera: no spring oscillation (less shake).
    const camLerpAlpha = 1 - Math.exp(-18 * frameDt)
    state.camera.position.lerp(tmpCamTarget, camLerpAlpha)

    tmpFocusOffset.set(0, 1.6, -3.0).applyQuaternion(tmpShipQuat)
    tmpLookAt.copy(tmpShipWorld).add(tmpFocusOffset)
    state.camera.lookAt(tmpLookAt)

    damageRef.current = Math.max(0, damageRef.current - frameDt * 0.9)
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, 75, 1 - Math.exp(-12 * frameDt))
    state.camera.updateProjectionMatrix()
    if (damageOverlayRef.current) damageOverlayRef.current.style.opacity = `${Math.min(0.5, damageRef.current * 0.55)}`

    if (onTelemetry) {
      const headingDeg = ((THREE.MathUtils.radToDeg(yaw.current) % 360) + 360) % 360
      onTelemetry({
        position: pos.current.clone(),
        speed: vel.current.length(),
        headingDeg,
        boostLevel: keys.shift ? 1 : 0.5,
        boosting: keys.shift,
      })
    }
  })

  return (
    <RigidBody
      ref={shipBodyRef}
      type="kinematicPosition"
      colliders="ball"
      position={[0, 0, SPAWN_Z]}
      onCollisionEnter={() => {
        damageRef.current = Math.min(1, damageRef.current + 0.34)
      }}
    >
      <group ref={shipRef}>
        {/* Imported GLB fighter model */}
        <group rotation={[0, Math.PI, 0]} scale={0.85}>
          <primitive object={fighterModel.scene} />
          <Trail ref={leftTrailRef} width={0.55} length={6} color="#79eaff" attenuation={(t) => t * t}>
            <mesh ref={leftThrusterRef} position={[-0.55, -0.1, 1.35]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#8cf7ff" transparent opacity={0.01} />
            </mesh>
          </Trail>
          <Trail ref={rightTrailRef} width={0.55} length={6} color="#79eaff" attenuation={(t) => t * t}>
            <mesh ref={rightThrusterRef} position={[0.55, -0.1, 1.35]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#8cf7ff" transparent opacity={0.01} />
            </mesh>
          </Trail>
        </group>
        <pointLight position={[0, 1.7, 2.2]} intensity={18} distance={42} color="#bcdcff" />
      </group>
    </RigidBody>
  )
}

useGLTF.preload('/dolph-1_-_light_fighter.glb')

export default function SpaceScene() {
  const sunPos = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const lightPos = useMemo(() => new THREE.Vector3(0, 22, 12), [])
  const lightDir = useMemo(
    () => new THREE.Vector3().subVectors(sunPos, lightPos).normalize(),
    [sunPos, lightPos],
  )

  const planets = useMemo(() => {
    // Place les planètes sur une "spirale" (progression en Z régulière)
    // pour éviter toute ligne droite tout en garantissant un temps de trajet suffisant.
    // Ordre réel conservé : Mercure -> ... -> Pluton (+ Lune près de la Terre).
    const radiusScale = 3.0
    const shipSpawnZ = 800
    const zSpacing = 420 // ~44s à vitesse max (sans boost), plus que le minimum demandé
    const xyBase = 1200
    const xyStep = 110
    const yFactor = 0.32

    const makePlanet = (def, i) => {
      const angle = i * 0.85
      const rXY = xyBase + i * xyStep
      const x = Math.cos(angle) * rXY
      const y = Math.sin(angle) * rXY * yFactor
      const z = shipSpawnZ - zSpacing * (i + 1)
      return { ...def, position: [x, y, z], radius: def.baseRadius * radiusScale }
    }

    const MercuryDef = { name: 'Mercury', mapUrl: '/mercurymap.png', baseRadius: 28 }
    const VenusDef = { name: 'Venus', mapUrl: '/venusmap.png', baseRadius: 36 }
    const EarthDef = { name: 'Earth', mapUrl: '/earthmap.png', baseRadius: 42 }
    const MarsDef = { name: 'Mars', mapUrl: '/marsmap.png', baseRadius: 34 }
    const JupiterDef = { name: 'Jupiter', mapUrl: '/jupitermap.png', baseRadius: 76 }
    const SaturnDef = { name: 'Saturn', mapUrl: '/saturnmap.png', baseRadius: 68 }
    const UranusDef = { name: 'Uranus', mapUrl: '/uranusmap.png', baseRadius: 52 }
    const NeptuneDef = { name: 'Neptune', mapUrl: '/neptunemap.png', baseRadius: 54 }
    const PlutoDef = { name: 'Pluto', mapUrl: '/plutomap.png', baseRadius: 30 }

    const Mercury = makePlanet(MercuryDef, 0)
    const Venus = makePlanet(VenusDef, 1)
    const Earth = makePlanet(EarthDef, 2)
    const Mars = makePlanet(MarsDef, 3)
    const Jupiter = makePlanet(JupiterDef, 4)
    const Saturn = makePlanet(SaturnDef, 5)
    const Uranus = makePlanet(UranusDef, 6)
    const Neptune = makePlanet(NeptuneDef, 7)
    const Pluto = makePlanet(PlutoDef, 8)

    const Sun = { name: 'Sun', mapUrl: '/sunmap.png', position: [0, 0, 0], radius: 120 * radiusScale, emissive: true }

    // Moon: positionnée autour de la Terre (dans la même direction depuis le Soleil).
    const earthVec = new THREE.Vector3(...Earth.position).normalize()
    const moonDistance = Earth.radius * 1.55
    const Moon = {
      name: 'Moon',
      mapUrl: '/moonmap.png',
      position: [
        Earth.position[0] + earthVec.x * moonDistance,
        Earth.position[1] + earthVec.y * moonDistance,
        Earth.position[2] + earthVec.z * moonDistance,
      ],
      radius: 24 * radiusScale,
    }

    return [Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Moon]
  }, [])

  const lightRef = useRef(null)
  const lightTargetRef = useRef(null)
  const damageOverlayRef = useRef(null)
  const damageRef = useRef(0)
  const collidableMeshesRef = useRef([])
  const [telemetry, setTelemetry] = useState({
    position: new THREE.Vector3(0, 0, 800),
    speed: 0,
    headingDeg: 0,
    boostLevel: 0.5,
    boosting: false,
  })
  const [landingTrigger, setLandingTrigger] = useState(0)
  const [isCinematic, setIsCinematic] = useState(false)
  const [overlayPlanet, setOverlayPlanet] = useState(null)
  const [landingPlanet, setLandingPlanet] = useState(null)
  const [fadeOpacity, setFadeOpacity] = useState(0)

  const nearestPlanet = useMemo(() => {
    let best = null
    let bestDistance = Number.POSITIVE_INFINITY
    const shipPos = telemetry.position
    for (const p of planets) {
      if (p.name === 'Sun') continue
      const d = shipPos.distanceTo(new THREE.Vector3(...p.position)) - p.radius
      if (d < bestDistance) {
        bestDistance = d
        best = { ...p, distance: d }
      }
    }
    return best
  }, [planets, telemetry.position])
  const canLand = Boolean(nearestPlanet && nearestPlanet.distance < 140 && !isCinematic && !overlayPlanet)

  const registerCollidableMesh = (mesh) => {
    if (!mesh) return
    if (!collidableMeshesRef.current.includes(mesh)) collidableMeshesRef.current.push(mesh)
  }

  useEffect(() => {
    if (!lightRef.current || !lightTargetRef.current) return
    lightRef.current.target = lightTargetRef.current
    lightRef.current.target.updateMatrixWorld()
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() !== 'e') return
      if (!canLand || !nearestPlanet) return
      setLandingPlanet(nearestPlanet)
      setIsCinematic(true)
      setLandingTrigger((v) => v + 1)
      gsap.to(
        { value: 0 },
        {
          value: 1,
          duration: 0.55,
          onUpdate() {
            setFadeOpacity(this.targets()[0].value)
          },
        },
      )
      setTimeout(() => {
        setOverlayPlanet(nearestPlanet)
        setIsCinematic(false)
      }, 1350)
      setTimeout(() => {
        gsap.to(
          { value: 1 },
          {
            value: 0,
            duration: 0.55,
            onUpdate() {
              setFadeOpacity(this.targets()[0].value)
            },
          },
        )
      }, 1450)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canLand, nearestPlanet])

  return (
    <>
      <div
        ref={damageOverlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0,
          background: 'radial-gradient(circle at center, rgba(255,30,30,0.2), rgba(120,0,0,0.78))',
          transition: 'opacity 40ms linear',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: fadeOpacity, pointerEvents: 'none', zIndex: 9 }} />
      <HudOverlay telemetry={telemetry} planets={planets} nearestPlanet={nearestPlanet} canLand={canLand} />
      <PlanetOverlay planet={overlayPlanet} onClose={() => setOverlayPlanet(null)} />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 28], fov: 75, near: 0.1, far: 20000 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#020308', 1)
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.34} />
          <hemisphereLight skyColor="#1a2840" groundColor="#05050c" intensity={0.28} />

          {/* Closed "box space" + stars around the whole scene */}
          <SpaceCubeSkybox boxHalf={WORLD_HALF_SIZE} />
          <CubeStarfield boxHalf={WORLD_HALF_SIZE} count={26000} />

          {/* Directional light emulating a central star. */}
          <directionalLight
            ref={lightRef}
            position={[lightPos.x, lightPos.y, lightPos.z]}
            intensity={2.6}
            color="#ffdcb0"
          />
          <object3D ref={lightTargetRef} position={[sunPos.x, sunPos.y, sunPos.z]} />

          <WarpTunnel active={telemetry.boosting && !overlayPlanet && !isCinematic} />
          <LandingDirector
            trigger={landingTrigger}
            planet={isCinematic ? landingPlanet : null}
            onComplete={() => {}}
          />

          <Physics gravity={[0, 0, 0]} timeStep="vary">
            {/* Player ship + keyboard controls */}
            <ShipController
              damageOverlayRef={damageOverlayRef}
              damageRef={damageRef}
              collidableMeshes={collidableMeshesRef}
              onShipMeshReady={registerCollidableMesh}
              controlsEnabled={!isCinematic && !overlayPlanet}
              onTelemetry={setTelemetry}
            />
            {planets.map((p, idx) => (
              <TexturedPlanet
                key={`${p.name}-${idx}`}
                position={p.position}
                radius={p.radius}
                mapUrl={p.mapUrl}
                emissive={Boolean(p.emissive)}
                rotationSpeed={0.035 + idx * 0.01}
                onMeshReady={registerCollidableMesh}
              />
            ))}
          </Physics>
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.65} mipmapBlur luminanceThreshold={0.2} />
            <ChromaticAberration offset={[0.0005, 0.0005]} />
            <Vignette darkness={0.35} offset={0.2} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </>
  )
}

