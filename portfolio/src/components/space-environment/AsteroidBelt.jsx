/* eslint-disable react-hooks/purity */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateBeltTransforms } from '../../generators/asteroidBeltGenerator'

const colorPalette = ['#555555', '#666666', '#777777', '#888888', '#6e7378']

export default function AsteroidBelt({ beltConfig, geometry }) {
  const meshRef = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const transforms = useMemo(() => generateBeltTransforms(beltConfig), [beltConfig])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        roughness: THREE.MathUtils.lerp(0.85, 0.95, Math.random()),
        metalness: THREE.MathUtils.lerp(0.1, 0.3, Math.random()),
        flatShading: true,
        envMapIntensity: 0.3,
      }),
    [],
  )

  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    for (let i = 0; i < transforms.length; i++) {
      const t = transforms[i]
      dummy.position.set(t.x, t.y, t.z)
      dummy.rotation.set(t.rx, t.ry, t.rz)
      dummy.scale.setScalar(t.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [dummy, transforms])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.002
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, transforms.length]}
      castShadow
      receiveShadow
      frustumCulled
    />
  )
}
