import * as THREE from 'three'
import { useMemo } from 'react'
import { mkRng } from '../../utils/rng'

export default function Starfield() {
  const geo = useMemo(() => {
    const rand = mkRng(1337)
    const N = 28000
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const sz  = new Float32Array(N)
    const pals = [[1, .97, .95], [.75, .85, 1], [1, .95, .80], [.90, .93, 1]]
    for (let i = 0; i < N; i++) {
      const th = 2 * Math.PI * rand(), ph = Math.acos(2 * rand() - 1)
      const r = 11000 + rand() * 5000
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.cos(ph)
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
      const p = pals[Math.floor(rand() * pals.length)]
      const br = 0.5 + rand() * 0.5
      col[i * 3] = p[0] * br; col[i * 3 + 1] = p[1] * br; col[i * 3 + 2] = p[2] * br
      sz[i] = 0.5 + rand() * 1.2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSize',    new THREE.BufferAttribute(sz,  1))
    return g
  }, [])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aSize; attribute vec3 color; varying vec3 vColor;
      void main(){
        vColor = color;
        gl_PointSize = aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        float a = 1.0 - smoothstep(0.3, 1.0, d);
        gl_FragColor = vec4(vColor, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])

  return <points geometry={geo} frustumCulled={false}><primitive object={mat} attach="material" /></points>
}
