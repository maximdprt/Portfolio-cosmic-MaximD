import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

export function createAsteroidGeometry(detail, seed = 1) {
  const geometry = new THREE.IcosahedronGeometry(1, detail)
  const pos = geometry.attributes.position
  const noise3D = createNoise3D(() => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  })

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const n = noise3D(x * 1.5, y * 1.5, z * 1.5)
    const d = 1 + n * 0.35
    pos.setXYZ(i, x * d, y * d, z * d)
  }

  geometry.computeVertexNormals()
  return geometry
}

export function createAsteroidGeometryVariants() {
  const seeds = [101, 211, 307, 401, 509]
  return seeds.map((seed, idx) => {
    const detail = idx < 2 ? 3 : idx < 4 ? 2 : 1
    return createAsteroidGeometry(detail, seed)
  })
}
