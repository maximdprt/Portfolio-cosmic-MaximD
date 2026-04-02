/* eslint-disable react-hooks/purity */
import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

function FallbackStarfield() {
  const geometry = useMemo(() => {
    const count = 15000
    const radius = 50000
    const pos = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = radius
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.cos(phi)
      const z = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      const t = Math.random()
      if (t < 0.33) {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else if (t < 0.66) {
        colors[i * 3] = 0.8
        colors[i * 3 + 1] = 0.9
        colors[i * 3 + 2] = 1
      } else {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 0.93
        colors[i * 3 + 2] = 0.8
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

export default function SpaceSkybox() {
  const { scene, gl } = useThree()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let disposed = false
    const loader = new RGBELoader()
    loader.load(
      '/textures/skybox/starmap_4k.hdr',
      (texture) => {
        if (disposed) return
        texture.mapping = THREE.EquirectangularReflectionMapping
        const pmrem = new THREE.PMREMGenerator(gl)
        const env = pmrem.fromEquirectangular(texture).texture
        scene.background = env
        scene.environment = env
        scene.backgroundIntensity = 0.4
        scene.environmentIntensity = 0.15
        setLoaded(true)
        texture.dispose()
        pmrem.dispose()
      },
      undefined,
      () => {
        setLoaded(false)
      },
    )
    return () => {
      disposed = true
    }
  }, [gl, scene])

  return !loaded ? <FallbackStarfield /> : null
}
