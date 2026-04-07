import { useFrame } from '@react-three/fiber'
import { Trail, useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { WORLD_HALF, WORLD_MARGIN, SPAWN } from '../../constants'

export default function ShipController({ shipStateRef, damageOverlayRef, damageRef, onShipMeshReady, enabled, onTelemetry }) {
  const shipRef   = useRef()
  const visualRef = useRef()
  const bodyRef   = useRef()

  const keys = useRef({ fwd:false, bwd:false, left:false, right:false, up:false, down:false, boost:false })
  const vel       = useRef(new THREE.Vector3())
  const pos       = useRef(SPAWN.clone())
  const bankAngle = useRef(0)
  const fuelRef   = useRef(1)
  const hullRef   = useRef(1)
  const lastTel   = useRef(0)

  const fighter = useGLTF('/dolph-1_-_light_fighter.glb')
  const trailL = useRef(), trailR = useRef(), thrL = useRef(), thrR = useRef()

  const S = useMemo(() => ({
    fwd:    new THREE.Vector3(),
    right:  new THREE.Vector3(),
    tVel:   new THREE.Vector3(),
    yawQ:   new THREE.Quaternion(),
    pitchQ: new THREE.Quaternion(),
    axisY:  new THREE.Vector3(0, 1, 0),
    axisX:  new THREE.Vector3(1, 0, 0),
    shipW:  new THREE.Vector3(),
    shipQ:  new THREE.Quaternion(),
  }), [])

  useEffect(() => {
    const dn = (e) => {
      const tag = e.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      const k = keys.current
      if (e.code === 'KeyW') k.fwd = true
      if (e.code === 'KeyS') k.bwd = true
      if (e.code === 'KeyA') k.left = true
      if (e.code === 'KeyD') k.right = true
      if (e.code === 'Space') { k.up = true; e.preventDefault() }
      if (e.code === 'KeyQ') k.down = true
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') { k.down = true; e.preventDefault() }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') k.boost = true
    }
    const up = (e) => {
      const k = keys.current
      if (e.code === 'KeyW') k.fwd = false
      if (e.code === 'KeyS') k.bwd = false
      if (e.code === 'KeyA') k.left = false
      if (e.code === 'KeyD') k.right = false
      if (e.code === 'Space') k.up = false
      if (e.code === 'KeyQ') k.down = false
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') k.down = false
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') k.boost = false
    }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => { if (onShipMeshReady && fighter?.scene) onShipMeshReady(fighter.scene) }, [fighter, onShipMeshReady])

  useFrame((state, rawDt) => {
    const ship = shipRef.current
    if (!ship) return
    const dt = Math.min(rawDt, 0.05)
    const k  = keys.current
    const on = enabled !== false

    // Boost fuel
    const wantBoost = on && k.boost && k.fwd
    const boosting  = wantBoost && fuelRef.current > 0.02
    if (boosting) fuelRef.current = Math.max(0, fuelRef.current - dt * 0.165)
    else          fuelRef.current = Math.min(1, fuelRef.current + dt * 0.20)

    // Trails visible only when boosting
    if (trailL.current) trailL.current.visible = boosting
    if (trailR.current) trailR.current.visible = boosting
    if (thrL.current) thrL.current.visible = boosting
    if (thrR.current) thrR.current.visible = boosting

    // Rotation -- nose follows direction keys
    const YAW = 1.75, PITCH = 1.55
    if (on) {
      const yawS = (k.left ? 1 : 0) - (k.right ? 1 : 0)
      if (yawS) { S.yawQ.setFromAxisAngle(S.axisY, YAW * dt * yawS); ship.quaternion.multiply(S.yawQ) }
      const pitchS = (k.up ? 1 : 0) - (k.down ? 1 : 0)
      if (pitchS) { S.pitchQ.setFromAxisAngle(S.axisX, PITCH * dt * pitchS); ship.quaternion.multiply(S.pitchQ) }
      ship.quaternion.normalize()
    }

    // Visual banking
    const yawIn = on ? (k.left ? 1 : 0) - (k.right ? 1 : 0) : 0
    bankAngle.current += (yawIn * 0.55 - bankAngle.current) * (1 - Math.exp(-9 * dt))
    if (visualRef.current) visualRef.current.rotation.z = bankAngle.current

    // Velocity
    const SPD = 95, BSPD = SPD * 3.4, STRAFE = 85, VERT = 85
    const ACCEL = boosting ? 5.8 : 4.2
    const DECEL = 2.5

    S.fwd.set(0, 0, -1).applyQuaternion(ship.quaternion)
    S.right.set(1, 0, 0).applyQuaternion(ship.quaternion)

    S.tVel.set(0, 0, 0)
    if (on) {
      if (k.fwd)   S.tVel.addScaledVector(S.fwd, boosting ? BSPD : SPD)
      if (k.bwd)   S.tVel.addScaledVector(S.fwd, -(SPD * 0.65))
      if (k.right) S.tVel.addScaledVector(S.right, STRAFE)
      if (k.left)  S.tVel.addScaledVector(S.right, -STRAFE)
      if (k.up)    S.tVel.y += VERT
      if (k.down)  S.tVel.y -= VERT
    }

    const anyKey = k.fwd || k.bwd || k.left || k.right || k.up || k.down
    if (on && anyKey) vel.current.lerp(S.tVel, 1 - Math.exp(-ACCEL * dt))
    else              vel.current.multiplyScalar(Math.exp(-DECEL * dt))
    if (vel.current.lengthSq() < 0.02) vel.current.set(0, 0, 0)

    // Integrate position
    pos.current.addScaledVector(vel.current, dt)

    const LO = -WORLD_HALF + WORLD_MARGIN, HI = WORLD_HALF - WORLD_MARGIN
    if (pos.current.x < LO) { pos.current.x = LO; vel.current.x = 0 }
    if (pos.current.x > HI) { pos.current.x = HI; vel.current.x = 0 }
    if (pos.current.y < LO) { pos.current.y = LO; vel.current.y = 0 }
    if (pos.current.y > HI) { pos.current.y = HI; vel.current.y = 0 }
    if (pos.current.z < LO) { pos.current.z = LO; vel.current.z = 0 }
    if (pos.current.z > HI) { pos.current.z = HI; vel.current.z = 0 }

    ship.position.copy(pos.current)
    if (bodyRef.current) bodyRef.current.setNextKinematicTranslation(pos.current)

    // Publish ship state for camera
    ship.getWorldPosition(S.shipW)
    ship.getWorldQuaternion(S.shipQ)
    shipStateRef.current.px = S.shipW.x
    shipStateRef.current.py = S.shipW.y
    shipStateRef.current.pz = S.shipW.z
    shipStateRef.current.qx = S.shipQ.x
    shipStateRef.current.qy = S.shipQ.y
    shipStateRef.current.qz = S.shipQ.z
    shipStateRef.current.qw = S.shipQ.w
    shipStateRef.current.speed = vel.current.length()
    shipStateRef.current.boosting = boosting

    // Damage
    damageRef.current = Math.max(0, damageRef.current - dt * 1.4)
    hullRef.current   = Math.min(1, hullRef.current + dt * 0.004)
    if (damageOverlayRef.current) damageOverlayRef.current.style.opacity = `${Math.min(0.65, damageRef.current * 0.65)}`

    // Telemetry ~10fps
    if (onTelemetry && state.clock.elapsedTime - lastTel.current > 0.1) {
      lastTel.current = state.clock.elapsedTime
      const heading = ((THREE.MathUtils.radToDeg(Math.atan2(S.fwd.x, -S.fwd.z)) % 360) + 360) % 360
      onTelemetry({ px: pos.current.x, py: pos.current.y, pz: pos.current.z, speed: vel.current.length(), headingDeg: heading, boostFuel: fuelRef.current, boosting, hull: hullRef.current })
    }
  }, -1)

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="ball"
      ccdEnabled={true}
      position={SPAWN.toArray()}
      onCollisionEnter={() => {
        damageRef.current = Math.min(1, damageRef.current + 0.30)
        hullRef.current   = Math.max(0, hullRef.current - 0.12)
        vel.current.multiplyScalar(-0.35)
      }}
    >
      <group ref={shipRef}>
        <group ref={visualRef}>
          <group rotation={[0, Math.PI, 0]} scale={0.92}>
            <primitive object={fighter.scene} />

            <Trail ref={trailL} width={0.5} length={7} color="#79eaff" attenuation={t => t*t*t}>
              <mesh ref={thrL} position={[-0.55, -0.1, 1.35]}>
                <sphereGeometry args={[0.05, 6, 6]} />
                <meshBasicMaterial color="#8cf7ff" transparent opacity={0.01} />
              </mesh>
            </Trail>
            <Trail ref={trailR} width={0.5} length={7} color="#79eaff" attenuation={t => t*t*t}>
              <mesh ref={thrR} position={[0.55, -0.1, 1.35]}>
                <sphereGeometry args={[0.05, 6, 6]} />
                <meshBasicMaterial color="#8cf7ff" transparent opacity={0.01} />
              </mesh>
            </Trail>
          </group>
        </group>
        <pointLight position={[0, 1.5, 2]} intensity={25} distance={55} color="#c0deff" />
      </group>
    </RigidBody>
  )
}

useGLTF.preload('/dolph-1_-_light_fighter.glb')
