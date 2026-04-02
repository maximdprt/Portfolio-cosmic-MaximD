import * as THREE from 'three'

export default function SunCorona({ radius = 120 }) {
  return (
    <sprite scale={[radius * 3, radius * 3, 1]}>
      <spriteMaterial color="#FFF5E1" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  )
}
