import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'

export default function NebulaBackdrop() {
  const { scene } = useThree()

  useEffect(() => {
    scene.fog = new THREE.FogExp2(new THREE.Color('#040a16'), 0.000045)
    return () => { scene.fog = null }
  }, [scene])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float; varying vec3 vDir; uniform float uTime;
      float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<6;i++){v+=a*n(p);p*=2.1;a*=0.5;}return v;}
      void main(){
        vec3 d=normalize(vDir); float t=uTime*0.012;
        float n1=fbm(d*2.8+vec3(0,t,t*0.4)),n2=fbm(d*5.0+vec3(t*0.6,0,0));
        float g1=smoothstep(0.28,0.72,n1),g2=smoothstep(0.32,0.78,n2);
        vec3 c=mix(vec3(0.01,0.02,0.08),vec3(0.04,0.07,0.24),g1);
        c+=vec3(0.10,0.03,0.28)*pow(g1,2.8)*0.18;
        c+=vec3(0,0.08,0.18)*g2*0.4;
        float w=fbm(d*1.6+vec3(1.2,0.5,0));
        c+=vec3(0.25,0.12,0.04)*smoothstep(0.55,0.85,w)*0.08;
        gl_FragColor=vec4(c,g1*0.30+g2*0.08);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
  }), [])

  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime })

  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[16000, 24, 24]} />
      <primitive ref={ref} object={mat} attach="material" />
    </mesh>
  )
}
