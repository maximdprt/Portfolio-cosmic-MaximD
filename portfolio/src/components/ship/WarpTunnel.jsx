import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

export default function WarpTunnel({ active, shipStateRef }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.visible = active
    if (!active) return
    ref.current.rotation.z = clock.elapsedTime * 0.45
    const ss = shipStateRef.current
    ref.current.position.set(ss.px, ss.py, ss.pz)
  })

  return (
    <group ref={ref} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.5, 8, 60, 24, 1, true]} />
        <meshBasicMaterial color="#5cc8ff" transparent opacity={0.09} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.5, 12, 45, 16, 1, true]} />
        <meshBasicMaterial color="#2255cc" transparent opacity={0.04} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
