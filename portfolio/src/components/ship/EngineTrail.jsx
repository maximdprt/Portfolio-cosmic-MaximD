import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'

const COUNT = 80

export default function EngineTrail({ shipStateRef }) {
  const pointsRef = useRef()
  const matRef = useRef()
  const lifeRef = useRef()
  const posRef = useRef()
  const posAttrRef = useRef()
  const lifeAttrRef = useRef()
  const geom = useMemo(() => new THREE.BufferGeometry(), [])
  const scratch = useMemo(() => ({
    q: new THREE.Quaternion(),
    w: new THREE.Vector3(),
    emitter: new THREE.Vector3(),
    offset: new THREE.Vector3(0, 0.3, 1.2),
    drift: new THREE.Vector3(),
  }), [])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#5cc8ff') },
      uBoost: { value: 1 },
      uSize: { value: 22 },
    },
    vertexShader: `
      attribute float aLife;
      uniform float uBoost;
      uniform float uSize;
      varying float vLife;
      void main() {
        vLife = aLife;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * max(0.2, aLife) * uBoost;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vLife;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        float alpha = (1.0 - smoothstep(0.1, 1.0, d)) * vLife * vLife;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useEffect(() => {
    lifeRef.current = new Float32Array(COUNT)
    posRef.current = new Float32Array(COUNT * 3)
    posAttrRef.current = new THREE.BufferAttribute(posRef.current, 3)
    lifeAttrRef.current = new THREE.BufferAttribute(new Float32Array(COUNT), 1)
    geom.setAttribute('position', posAttrRef.current)
    geom.setAttribute('aLife', lifeAttrRef.current)
    return () => {
      geom.dispose()
      mat.dispose()
    }
  }, [geom, mat])

  useFrame((_, dt) => {
    if (!matRef.current || !lifeRef.current || !posRef.current || !posAttrRef.current || !lifeAttrRef.current) return
    const life = lifeRef.current
    const pos = posRef.current
    const ss = shipStateRef.current
    scratch.w.set(ss.px, ss.py, ss.pz)
    scratch.q.set(ss.qx, ss.qy, ss.qz, ss.qw)
    scratch.emitter.copy(scratch.offset).applyQuaternion(scratch.q).add(scratch.w)
    scratch.drift.set(0, 0, Math.max(0.4, ss.speed * 0.25) * dt)
    const boosting = ss.boosting
    matRef.current.uniforms.uBoost.value += ((boosting ? 1.35 : 1) - matRef.current.uniforms.uBoost.value) * Math.min(1, dt * 8)
    matRef.current.uniforms.uColor.value.set(boosting ? '#00f3ff' : '#5cc8ff')
    const emit = boosting ? 4 : 2

    for (let i = 0; i < COUNT; i++) {
      const l = life[i] - dt * 1.6
      life[i] = l
      if (l <= 0 && i < emit) {
        const j = i * 3
        pos[j] = scratch.emitter.x
        pos[j + 1] = scratch.emitter.y
        pos[j + 2] = scratch.emitter.z
        life[i] = 1
      } else if (l > 0) {
        const j = i * 3
        pos[j] += scratch.drift.x
        pos[j + 1] += scratch.drift.y
        pos[j + 2] += scratch.drift.z
      }
    }

    lifeAttrRef.current.array.set(life)
    lifeAttrRef.current.needsUpdate = true
    posAttrRef.current.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geom} frustumCulled={false}>
      <primitive ref={matRef} object={mat} attach="material" />
    </points>
  )
}
