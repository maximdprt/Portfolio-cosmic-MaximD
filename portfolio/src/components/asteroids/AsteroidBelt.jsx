import { InstancedRigidBodies } from '@react-three/rapier'
import * as THREE from 'three'
import { useMemo } from 'react'
import { mkRng } from '../../utils/rng'

export default function AsteroidBelt({
  center = [0, 0, 0],
  innerR = 600,
  outerR = 4000,
  count = 200,
  ySpread = 55,
  seed = 1234,
  color = '#7a8898',
}) {
  const geos = useMemo(() => [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
  ], [])

  const groups = useMemo(() => {
    const rand = mkRng(seed), out = [[], [], []]
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = innerR + (outerR - innerR) * rand()
      const y = (rand() * 2 - 1) * ySpread
      const id = Math.min(2, Math.floor(rand() * 3))
      out[id].push({
        key: `a${seed}-${i}`,
        position: [center[0] + Math.cos(a) * r, center[1] + y, center[2] + Math.sin(a) * r],
        rotation: [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2],
        scale: [1.2 + rand() * 5, 1.2 + rand() * 5, 1.2 + rand() * 5],
      })
    }
    return out
  }, [center, count, innerR, outerR, seed, ySpread])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.04 }), [color])

  return (
    <group>
      {groups.map((inst, idx) => inst.length > 0 && (
        <InstancedRigidBodies key={`${seed}-${idx}`} instances={inst} type="fixed" colliders="ball">
          <instancedMesh args={[geos[idx], mat, inst.length]} />
        </InstancedRigidBodies>
      ))}
    </group>
  )
}
