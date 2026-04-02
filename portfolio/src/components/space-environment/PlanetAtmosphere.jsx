import { useMemo } from 'react'
import * as THREE from 'three'
import atmosphereVert from '../../shaders/atmosphere.vert?raw'
import atmosphereFrag from '../../shaders/atmosphere.frag?raw'

export default function PlanetAtmosphere({ position, radius, color, intensity = 1 }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAtmosphereColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
        vertexShader: atmosphereVert,
        fragmentShader: atmosphereFrag,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, intensity],
  )

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius * 1.025, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
