import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo } from 'react'

const ARM_BACK = 26
const ARM_UP   = 5.5
const LOOK_AHEAD = 6
const FOV = 72

export default function CameraFollow({ shipStateRef, active }) {
  const C = useMemo(() => ({
    camOff:     new THREE.Vector3(),
    focusOff:   new THREE.Vector3(),
    lookTarget: new THREE.Vector3(),
    shipQ:      new THREE.Quaternion(),
    shipW:      new THREE.Vector3(),
  }), [])

  useFrame((state) => {
    if (!active) return
    const ss = shipStateRef.current

    C.shipW.set(ss.px, ss.py, ss.pz)
    C.shipQ.set(ss.qx, ss.qy, ss.qz, ss.qw)

    C.camOff.set(0, ARM_UP, ARM_BACK).applyQuaternion(C.shipQ)
    state.camera.position.copy(C.shipW).add(C.camOff)

    C.focusOff.set(0, 1.0, -LOOK_AHEAD).applyQuaternion(C.shipQ)
    C.lookTarget.copy(C.shipW).add(C.focusOff)
    state.camera.lookAt(C.lookTarget)

    if (state.camera.fov !== FOV) {
      state.camera.fov = FOV
      state.camera.updateProjectionMatrix()
    }
  }, 1)

  return null
}
