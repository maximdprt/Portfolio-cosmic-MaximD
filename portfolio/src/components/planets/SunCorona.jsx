import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'

export default function SunCorona({ radius }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN,vV; void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=-normalize(mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 vN,vV; uniform float uTime; void main(){float rim=1.0-abs(dot(vN,vV));float g=pow(rim,1.6);float p=0.88+0.12*sin(uTime*0.7);vec3 c=mix(vec3(1,.75,.20),vec3(1,.38,.05),g);gl_FragColor=vec4(c*p,g*0.9);}`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide,
  }), [])

  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius * 1.12, 32, 32]} />
        <primitive ref={ref} object={mat} attach="material" />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.55, 16, 16]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
