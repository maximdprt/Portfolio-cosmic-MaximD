import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

export function generateCurveBeltTransforms(config) {
  const noise3D = createNoise3D()
  const curveLength = config.curve.getLength()
  const total = Math.max(1, config.count ?? Math.floor(curveLength * (config.density ?? 1)))
  const transforms = new Array(total)

  for (let i = 0; i < total; i++) {
    const t = i / total
    const clusterNoise = noise3D(t * 5, 0, 0) * 0.02
    const tOffset = THREE.MathUtils.clamp(t + clusterNoise, 0, 1)
    const point = config.curve.getPointAt(tOffset)

    const angle = Math.random() * Math.PI * 2
    const radiusNoise = noise3D(t * 3, angle, 0)
    const radius = config.tubeRadius * (0.1 + Math.abs(radiusNoise) * 0.9)

    const tangent = config.curve.getTangentAt(tOffset).normalize()
    const up = Math.abs(tangent.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize()

    const offsetX = Math.cos(angle) * radius
    const offsetY = Math.sin(angle) * radius
    const minScale = config.asteroidScaleRange[0]
    const maxScale = config.asteroidScaleRange[1]

    transforms[i] = {
      x: point.x + binormal.x * offsetX + normal.x * offsetY,
      y: point.y + binormal.y * offsetX + normal.y * offsetY,
      z: point.z + binormal.z * offsetX + normal.z * offsetY,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      scale: THREE.MathUtils.lerp(minScale, maxScale, Math.pow(Math.random(), 2.5)),
    }
  }

  return transforms
}

export function generateClusterBeltTransforms(config) {
  const transforms = new Array(config.count)
  const center = config.clusterCenter
  const minScale = config.asteroidScaleRange[0]
  const maxScale = config.asteroidScaleRange[1]

  for (let i = 0; i < config.count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const radius = config.clusterRadius * Math.cbrt(Math.random())

    let x = radius * Math.sin(phi) * Math.cos(theta)
    let y = radius * Math.cos(phi)
    let z = radius * Math.sin(phi) * Math.sin(theta)

    if (config.ringLike) y *= 0.12

    transforms[i] = {
      x: center.x + x,
      y: center.y + y,
      z: center.z + z,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      scale: randomInRange(minScale, maxScale),
    }
  }

  return transforms
}

export function generateBeltTransforms(config) {
  if (config.type === 'cluster') return generateClusterBeltTransforms(config)
  return generateCurveBeltTransforms(config)
}
