import * as THREE from 'three'
import { useMemo } from 'react'

export default function Atmosphere({ radius, color }) {
  const c = useMemo(() => new THREE.Color(color), [color])
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius * 1.10, 24, 24]} />
        <meshBasicMaterial color={c} transparent opacity={0.10} blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.04, 24, 24]} />
        <meshBasicMaterial color={c} transparent opacity={0.055} blending={THREE.AdditiveBlending} side={THREE.FrontSide} depthWrite={false} />
      </mesh>
    </>
  )
}
