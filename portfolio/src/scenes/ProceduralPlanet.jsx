import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vLocalPos = position;
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  uniform vec3 uCamPos;
  uniform vec3 uLightDir;

  uniform vec3 uOceanColor;
  uniform vec3 uDesertColor;
  uniform vec3 uCloudColor;

  uniform float uOceanLevel;
  uniform float uDesertLevel;
  uniform float uCloudLevel;
  uniform float uCloudiness;

  uniform float uTime;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Local direction from the planet center (translation shouldn't affect the procedural pattern).
    vec3 dir = normalize(vLocalPos);

    // Slow rotation for moving clouds/terrain detail.
    float t = uTime * 0.06;
    mat2 rot = mat2(cos(t), -sin(t), sin(t), cos(t));
    vec3 q = dir;
    q.xz = rot * q.xz;

    float height = fbm(q * 6.0);
    float detail = fbm(q * 14.0);

    // Ocean mask: below uOceanLevel -> ocean.
    float ocean = 1.0 - smoothstep(uOceanLevel - 0.07, uOceanLevel + 0.07, height);

    // Desert mask: above uDesertLevel -> desert.
    float desert = smoothstep(uDesertLevel - 0.06, uDesertLevel + 0.06, height);

    // Clouds are mostly on top of land, but can also drift over oceans.
    float clouds = smoothstep(uCloudLevel - 0.08, uCloudLevel + 0.08, detail);
    clouds *= (0.35 + 0.65 * (1.0 - ocean));
    clouds *= uCloudiness;

    vec3 base = mix(uOceanColor, uDesertColor, desert);
    base = mix(base, uCloudColor, clamp(clouds, 0.0, 1.0));

    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);

    float ndl = max(dot(N, L), 0.0);

    // Slight rim to separate from the dark background.
    vec3 V = normalize(uCamPos - vWorldPos);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);

    vec3 color = base * (0.18 + 0.82 * ndl);
    color += rim * vec3(0.25, 0.45, 0.9) * 0.35;

    gl_FragColor = vec4(color, 1.0);
  }
`

export default function ProceduralPlanet({
  position = [0, 0, 0],
  radius = 1,
  lightDir,
  theme = {
    oceanColor: '#0a3f9a',
    desertColor: '#d9b27a',
    cloudColor: '#e8f5ff',
    oceanLevel: 0.42,
    desertLevel: 0.6,
    cloudLevel: 0.63,
    cloudiness: 0.9,
  },
}) {
  const materialRef = useRef(null)

  const material = useMemo(() => {
    const oceanColor = new THREE.Color(theme.oceanColor)
    const desertColor = new THREE.Color(theme.desertColor)
    const cloudColor = new THREE.Color(theme.cloudColor)

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCamPos: { value: new THREE.Vector3() },
        uLightDir: { value: lightDir.clone() },
        uOceanColor: { value: oceanColor },
        uDesertColor: { value: desertColor },
        uCloudColor: { value: cloudColor },
        uOceanLevel: { value: theme.oceanLevel },
        uDesertLevel: { value: theme.desertLevel },
        uCloudLevel: { value: theme.cloudLevel },
        uCloudiness: { value: theme.cloudiness },
      },
      vertexShader,
      fragmentShader,
    })
  }, [
    lightDir,
    theme.oceanColor,
    theme.desertColor,
    theme.cloudColor,
    theme.oceanLevel,
    theme.desertLevel,
    theme.cloudLevel,
    theme.cloudiness,
  ])

  useFrame((state) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    materialRef.current.uniforms.uCamPos.value.copy(state.camera.position)
  })

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 72, 72]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  )
}

