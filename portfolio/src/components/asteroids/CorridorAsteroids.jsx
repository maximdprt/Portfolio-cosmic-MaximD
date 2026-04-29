import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'

const SPREAD         = 80
const MAP_RADIUS     = 16000
const MIN_DIST       = 200

// ── Seeded PRNG ──────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Build flat per-instance arrays (called once at mount) ────────────────────
function buildInstances(planets) {
  const rng      = mulberry32(9182)
  const filtered = planets.filter(p => p.name !== 'Sun' && p.name !== 'Moon')
  const isLowPerf = window.matchMedia('(max-width: 800px)').matches || navigator.hardwareConcurrency < 4
  const CORRIDOR_COUNT = isLowPerf ? 8 : 15
  const RANDOM_COUNT = isLowPerf ? 30 : 60

  const positions  = []  // THREE.Vector3
  const quats      = []  // THREE.Quaternion (accumulates rotation each frame)
  const scales     = []  // number
  const deltas     = []  // THREE.Quaternion — pre-baked per-frame rotation delta
  const geoIdxs    = []  // 0/1/2

  const _up  = new THREE.Vector3(0, 1, 0)
  const _tmp = new THREE.Vector3()

  const addAsteroid = (pos) => {
    const scale  = 0.4 + rng() * 2.2
    const geoIdx = Math.floor(rng() * 3)
    const euler  = new THREE.Euler(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2)
    const quat   = new THREE.Quaternion().setFromEuler(euler)

    // Pre-bake delta: tiny rotation applied each frame (no decompose needed)
    const rx = (rng() - 0.5) * 0.006
    const ry = (rng() - 0.5) * 0.004
    const rz = (rng() - 0.5) * 0.008
    const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz))

    positions.push(pos.clone())
    quats.push(quat)
    scales.push(scale)
    deltas.push(delta)
    geoIdxs.push(geoIdx)
  }

  // Corridor asteroids between adjacent planet pairs
  for (let i = 0; i < filtered.length - 1; i++) {
    const pA = new THREE.Vector3(...filtered[i].position)
    const pB = new THREE.Vector3(...filtered[i + 1].position)
    const dir   = new THREE.Vector3().subVectors(pB, pA).normalize()
    const perp1 = new THREE.Vector3().crossVectors(dir, _up).normalize()
    const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize()

    for (let j = 0; j < CORRIDOR_COUNT; j++) {
      const t   = (j + 1) / (CORRIDOR_COUNT + 1)
      const pos = new THREE.Vector3().lerpVectors(pA, pB, t)
      pos.addScaledVector(perp1, (rng() - 0.5) * SPREAD * 2)
      pos.addScaledVector(perp2, (rng() - 0.5) * SPREAD * 2)
      pos.y += (rng() - 0.5) * 60
      addAsteroid(pos)
    }
  }

  // Random background asteroids
  let attempts = 0, placed = 0
  while (placed < RANDOM_COUNT && attempts < RANDOM_COUNT * 10) {
    attempts++
    _tmp.set(
      (rng() - 0.5) * MAP_RADIUS * 2,
      (rng() - 0.5) * 400,
      (rng() - 0.5) * MAP_RADIUS * 2,
    )
    const tooClose = planets.some(p => _tmp.distanceTo(new THREE.Vector3(...p.position)) < MIN_DIST)
    if (!tooClose) { addAsteroid(_tmp); placed++ }
  }

  // Group by geoIdx for instancing
  const groups = [
    { positions: [], quats: [], scales: [], deltas: [] },
    { positions: [], quats: [], scales: [], deltas: [] },
    { positions: [], quats: [], scales: [], deltas: [] },
  ]
  for (let i = 0; i < positions.length; i++) {
    const g = groups[geoIdxs[i]]
    g.positions.push(positions[i])
    g.quats.push(quats[i])
    g.scales.push(scales[i])
    g.deltas.push(deltas[i])
  }
  return groups
}

// ── Scratch objects (one per component, reused every frame) ──────────────────
const _mat   = new THREE.Matrix4()
const _scaleV = new THREE.Vector3()

export default function CorridorAsteroids({ planets }) {
  const meshRefs = [useRef(), useRef(), useRef()]

  const geos = useMemo(() => [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
  ], [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7a8898', roughness: 0.92, metalness: 0.04,
  }), [])
  const mats = useMemo(() => ([
    new THREE.MeshStandardMaterial({ color: '#7d8ea1', roughness: 0.92, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: '#8a7f74', roughness: 0.92, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: '#5e697a', roughness: 0.92, metalness: 0.04 }),
  ]), [])

  const groups = useMemo(() => buildInstances(planets), [planets])

  // Set initial matrices on first render
  useMemo(() => {
    groups.forEach((g, gi) => {
      const mesh = meshRefs[gi].current
      if (!mesh) return
      g.positions.forEach((pos, i) => {
        _scaleV.setScalar(g.scales[i])
        _mat.compose(pos, g.quats[i], _scaleV)
        mesh.setMatrixAt(i, _mat)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups])

  // Animate tumble — zero GC, no decompose
  useFrame(() => {
    groups.forEach((g, gi) => {
      const mesh = meshRefs[gi].current
      if (!mesh || g.positions.length === 0) return
      for (let i = 0; i < g.positions.length; i++) {
        g.quats[i].multiply(g.deltas[i])        // accumulate rotation in-place
        _scaleV.setScalar(g.scales[i])
        _mat.compose(g.positions[i], g.quats[i], _scaleV)
        mesh.setMatrixAt(i, _mat)
      }
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <group>
      {groups.map((g, gi) => g.positions.length > 0 && (
        <instancedMesh
          key={gi}
          ref={meshRefs[gi]}
          args={[geos[gi], mats[gi] || mat, g.positions.length]}
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
