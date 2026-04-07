import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useRef } from 'react'

export default function Planet({ position, radius, mapUrl, emissive, rotSpeed, onMeshReady }) {
  const ref = useRef()
  const map = useTexture(mapUrl)
  map.minFilter = THREE.LinearMipmapLinearFilter

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += rotSpeed * dt })

  return (
    <RigidBody type="fixed" colliders="ball" position={position}>
      <mesh ref={m => { ref.current = m; if (m && onMeshReady) onMeshReady(m) }}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          map={map}
          emissive={emissive ? '#ffd68a' : '#000'}
          emissiveIntensity={emissive ? 0.85 : 0}
          roughness={emissive ? 0.95 : 0.85}
          metalness={0.01}
        />
      </mesh>
    </RigidBody>
  )
}
