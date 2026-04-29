import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

const ARM_BACK   = 15
const ARM_UP     = 6
const LOOK_AHEAD = 6
const FOV_BASE   = 80
const CAMERA_LAG = 0.18
const SPEED_BASELINE = 200
const SPEED_REF = 1200  
const SPEED_BACK_MAX = 0.8

export default function CameraFollow({ shipStateRef, active }) {
  const C = useRef({
    camOff:      new THREE.Vector3(),
    focusOff:    new THREE.Vector3(),
    lookTarget:  new THREE.Vector3(),
    lookDesired: new THREE.Vector3(),
    camSmooth:   new THREE.Vector3(),
    shipQ:       new THREE.Quaternion(),
    shipW:       new THREE.Vector3(),
    desired:     new THREE.Vector3(),
    boostBack:   0,
    side:        new THREE.Vector3(),
  })

  useFrame((state, delta) => {
    if (!active) return
    const ss = shipStateRef.current

    const c = C.current
    c.shipW.set(ss.px, ss.py, ss.pz)
    c.shipQ.set(ss.qx, ss.qy, ss.qz, ss.qw)

    // Keep ship fixed on screen with a minimum distance equivalent to speed 200.
    const virtualSpeed = Math.max(SPEED_BASELINE, ss.speed || 0)
    const speedBack = THREE.MathUtils.clamp((virtualSpeed / SPEED_REF) * SPEED_BACK_MAX, 0, SPEED_BACK_MAX)

    c.boostBack = 0

    // Desired camera position in ship-local space
    c.camOff.set(0, ARM_UP, ARM_BACK + speedBack + c.boostBack).applyQuaternion(c.shipQ)
    c.desired.copy(c.shipW).add(c.camOff)

    // Smooth lerp — no .clone() allocation
    c.camSmooth.lerp(c.desired, Math.min(1, CAMERA_LAG + delta * 2))
    state.camera.position.copy(c.camSmooth)

    // Look slightly ahead of ship — reuse lookDesired scratch, no .clone()
    c.focusOff.set(0, 1.0, -LOOK_AHEAD).applyQuaternion(c.shipQ)
    c.side.set(1, 0, 0).applyQuaternion(c.shipQ).multiplyScalar((ss.yawVel || 0) * 2.6)
    c.focusOff.add(c.side)
    c.lookDesired.copy(c.shipW).add(c.focusOff)
    c.lookTarget.lerp(c.lookDesired, 0.32)
    state.camera.lookAt(c.lookTarget)

    state.camera.fov += (FOV_BASE - state.camera.fov) * Math.min(1, delta * 4)
    state.camera.updateProjectionMatrix()
  }, 1)

  return null
}
