import { useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'

export default function SaturnRings({ position, innerRadius = 75, outerRadius = 120 }) {
  const [alphaMap, setAlphaMap] = useState(null)

  useEffect(() => {
    const fallback = new THREE.Texture()
    const loader = new THREE.TextureLoader()
    loader.load(
      '/textures/planets/saturn_ring_alpha.png',
      (tex) => setAlphaMap(tex),
      undefined,
      () => setAlphaMap(fallback),
    )
  }, [])
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(innerRadius, outerRadius, 128)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const r = Math.sqrt(x * x + y * y)
      const u = (r - innerRadius) / (outerRadius - innerRadius)
      uv.setXY(i, u, 0.5)
    }
    uv.needsUpdate = true
    return g
  }, [innerRadius, outerRadius])

  return (
    <mesh position={position} rotation={[THREE.MathUtils.degToRad(27), 0, 0]} geometry={geometry}>
      <meshStandardMaterial
        alphaMap={alphaMap}
        transparent
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  )
}
