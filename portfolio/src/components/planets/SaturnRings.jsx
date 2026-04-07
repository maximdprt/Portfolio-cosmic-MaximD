import * as THREE from 'three'
import { useMemo } from 'react'

export default function SaturnRings({ radius }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 vUv; void main(){float r=vUv.x;float e=smoothstep(0.0,0.06,r)*(1.0-smoothstep(0.86,1.0,r));float d=0.5*(0.5+0.5*sin(r*88.0))+0.32*(0.5+0.5*sin(r*37.0+1.4))+0.18*(0.5+0.5*sin(r*210.0));vec3 c=mix(vec3(0.62,0.52,0.38),vec3(0.90,0.82,0.62),d);gl_FragColor=vec4(c,e*d*0.78);}`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }), [])

  return (
    <mesh rotation={[Math.PI * 0.07, 0, Math.PI * 0.04]}>
      <ringGeometry args={[radius * 1.3, radius * 2.35, 160, 4]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
