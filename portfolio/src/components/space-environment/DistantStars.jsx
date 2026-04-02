/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import starsVert from '../../shaders/stars.vert?raw'
import starsFrag from '../../shaders/stars.frag?raw'

function StarLayer({ count, radius }) {
  const matRef = useRef(null)
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brightness = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

      sizes[i] = THREE.MathUtils.lerp(0.3, 2.5, Math.random())
      brightness[i] = THREE.MathUtils.lerp(0.4, 1.0, Math.random())
      const t = Math.random()
      if (t < 0.33) {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else if (t < 0.66) {
        colors[i * 3] = 0.85
        colors[i * 3 + 1] = 0.92
        colors[i * 3 + 2] = 1
      } else {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 0.92
        colors[i * 3 + 2] = 0.82
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    return geo
  }, [count, radius])

  useFrame((state) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={starsVert}
        fragmentShader={starsFrag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function DistantStars() {
  return (
    <group>
      <StarLayer count={5000} radius={20000} />
      <StarLayer count={3000} radius={35000} />
      <StarLayer count={2000} radius={50000} />
    </group>
  )
}
