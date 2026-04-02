/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import dustVert from '../../shaders/spaceDust.vert?raw'
import dustFrag from '../../shaders/spaceDust.frag?raw'

export default function SpaceDust({ shipRef }) {
  const pointsRef = useRef(null)
  const count = 2000
  const lastPositionRef = useRef(new THREE.Vector3())

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 800
      pos[i * 3 + 1] = (Math.random() - 0.5) * 800
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1200
    }
    return pos
  }, [count])

  const shaderConfig = useMemo(
    () => ({
      uniforms: {
        uSpeed: { value: 0 },
        uColor: { value: new THREE.Color('#AABBCC') },
      },
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!pointsRef.current || !shipRef?.current) return
    const points = pointsRef.current
    const ship = shipRef.current
    points.position.copy(ship.position)

    const shipVelocity = ship.userData.velocity || new THREE.Vector3().copy(ship.position).sub(lastPositionRef.current).divideScalar(Math.max(delta, 0.0001))
    lastPositionRef.current.copy(ship.position)
    const speed = shipVelocity.length()

    const posAttr = points.geometry.attributes.position
    const arr = posAttr.array
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3] -= shipVelocity.x * delta * 0.5
      arr[i3 + 1] -= shipVelocity.y * delta * 0.5
      arr[i3 + 2] -= shipVelocity.z * delta * 0.5
      if (arr[i3] > 400) arr[i3] -= 800
      if (arr[i3] < -400) arr[i3] += 800
      if (arr[i3 + 1] > 400) arr[i3 + 1] -= 800
      if (arr[i3 + 1] < -400) arr[i3 + 1] += 800
      if (arr[i3 + 2] > 600) arr[i3 + 2] -= 1200
      if (arr[i3 + 2] < -600) arr[i3 + 2] += 1200
    }
    posAttr.needsUpdate = true
    points.material.uniforms.uSpeed.value = speed
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial attach="material" args={[shaderConfig]} />
    </points>
  )
}
