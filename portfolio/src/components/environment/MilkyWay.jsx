import * as THREE from 'three'
import { useMemo } from 'react'
import { mkRng } from '../../utils/rng'

export default function MilkyWay() {
  const geo = useMemo(() => {
    const rand = mkRng(9999), N = 6000
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const th = 2 * Math.PI * rand(), ba = (rand() - 0.5) * 0.25, r = 12000 + rand() * 1500
      const y = Math.sin(ba) * r, fr = Math.cos(ba) * r
      pos[i * 3] = fr * Math.cos(th); pos[i * 3 + 1] = y; pos[i * 3 + 2] = fr * Math.sin(th)
      const br = 0.12 + rand() * 0.18
      col[i * 3] = br * 0.7; col[i * 3 + 1] = br * 0.8; col[i * 3 + 2] = br
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.6} vertexColors transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}
