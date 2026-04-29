import * as THREE from 'three'

export default function SpaceSkybox() {
  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[17000, 16, 16]} />
      <meshBasicMaterial color="#0b1528" side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}
