import * as THREE from 'three'

export default function SpaceSkybox() {
  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[17000, 32, 32]} />
      <meshBasicMaterial color="#020308" side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}
