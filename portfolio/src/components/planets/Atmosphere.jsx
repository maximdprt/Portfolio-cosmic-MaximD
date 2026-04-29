import * as THREE from 'three'
import { useMemo } from 'react'

export default function Atmosphere({ radius, color }) {
  const c = useMemo(() => new THREE.Color(color), [color])
  const shader = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: c }, uIntensity: { value: 0.7 } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDir = -normalize(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform vec3 uColor;
      uniform float uIntensity;
      void main() {
        float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
        fresnel = pow(fresnel, 2.5);
        gl_FragColor = vec4(uColor, fresnel * uIntensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  }), [c])
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius * 1.1, 32, 32]} />
        <primitive object={shader} attach="material" />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.04, 32, 32]} />
        <meshBasicMaterial color={c} transparent opacity={0.055} blending={THREE.AdditiveBlending} side={THREE.FrontSide} depthWrite={false} />
      </mesh>
    </>
  )
}
