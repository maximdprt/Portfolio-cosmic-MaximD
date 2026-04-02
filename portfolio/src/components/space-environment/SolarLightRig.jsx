/* eslint-disable react-hooks/immutability */
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

export default function SolarLightRig() {
  const { gl } = useThree()

  useEffect(() => {
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.useLegacyLights = false
  }, [gl])

  return (
    <>
      <pointLight
        position={[0, 0, 0]}
        intensity={3}
        color="#FFF5E1"
        distance={0}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={50000}
        shadow-bias={-0.0001}
      />
      <ambientLight intensity={0.03} color="#1a1a2e" />
    </>
  )
}
