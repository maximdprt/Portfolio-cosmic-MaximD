import { useFrame } from '@react-three/fiber'
import { useTexture, Detailed } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'

// NOTE: pour un meilleur rendu, utiliser des textures 2048x1024 ou 4096x2048
// (NASA Visible Earth, solarsystemscope.com/textures sont d'excellentes sources)
export default function Planet({ position, radius, mapUrl, emissive, rotSpeed, onMeshReady }) {
  const sphereRef = useRef()
  const rawMap = useTexture(mapUrl)
  const map = useMemo(() => {
    const tx = rawMap.clone()
    tx.minFilter = THREE.LinearMipmapLinearFilter
    tx.magFilter = THREE.LinearFilter
    tx.anisotropy = 8
    tx.needsUpdate = true
    return tx
  }, [rawMap])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map,
    emissive: emissive ? new THREE.Color('#ffd68a') : new THREE.Color('#355f9a'),
    emissiveIntensity: emissive ? 1.15 : 0.22,
    emissiveMap: map,
    roughness: emissive ? 0.85 : 0.62,
    metalness: 0.04,
  }), [map, emissive])

  useFrame((_, dt) => { if (sphereRef.current) sphereRef.current.rotation.y += rotSpeed * dt })

  return (
    <group position={position}>
      <Detailed distances={[0, radius * 8, radius * 25]}>
        <mesh ref={m => { sphereRef.current = m; if (m && onMeshReady) onMeshReady(m) }} material={material}>
          <sphereGeometry args={[radius, 64, 64]} />
        </mesh>
        <mesh material={material}>
          <sphereGeometry args={[radius, 32, 32]} />
        </mesh>
        <mesh material={material}>
          <sphereGeometry args={[radius, 16, 16]} />
        </mesh>
      </Detailed>
    </group>
  )
}
