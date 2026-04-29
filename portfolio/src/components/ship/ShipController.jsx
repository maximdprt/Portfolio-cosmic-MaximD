import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { WORLD_HALF, WORLD_MARGIN, SPAWN } from '../../constants'

// ── Physics constants ────────────────────────────────────────────────────────
const THRUST = 220
const BOOST_MULT = 2.4
const MAX_SPEED = 180
const MAX_BOOST_SPEED = 380
const LINEAR_DAMPING = 0.985
const ANGULAR_DAMPING = 0.88
const YAW_RATE = 1.8
const PITCH_RATE = 1.1
const YAW_ACCEL = 5.0
const PITCH_ACCEL = 3.6
const ROLL_FROM_YAW = 0.42
const SHIP_COLLISION_RADIUS = 22

export default function ShipController({ shipStateRef, planets = [], onShipMeshReady, enabled, onTelemetry }) {
  const shipRef   = useRef()
  const visualRef = useRef()
  // ── Input state ─────────────────────────────────────────────────────────────
  const keys = useRef({ fwd: false, bwd: false, left: false, right: false, up: false, down: false, boost: false })

  // ── Physics state ────────────────────────────────────────────────────────────
  const vel      = useRef(new THREE.Vector3())
  const angVel   = useRef({ yaw: 0, pitch: 0 })
  const pos      = useRef(SPAWN.clone())
  const bankAngle = useRef(0)
  const fuelRef   = useRef(1)
  const lastTel   = useRef(0)
  const lightRef = useRef()

  // ── Model ───────────────────────────────────────────────────────────────────
  const fighter = useGLTF('/dolph-1_-_light_fighter.glb')
  const fighterModel = useMemo(() => {
    if (!fighter?.scene) return null
    const model = fighter.scene.clone(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    model.position.sub(center)
    model.scale.setScalar(18.0 / maxDim)
    return model
  }, [fighter])

  // ── Scratch vectors (no GC in useFrame) ─────────────────────────────────────
  const S = useMemo(() => ({
    fwd:     new THREE.Vector3(),
    shipW:   new THREE.Vector3(),
    shipQ:   new THREE.Quaternion(),
    toCenter: new THREE.Vector3(),
  }), [])
  const collisionBodies = useMemo(() => (
    planets
      .filter((p) => p.name !== 'Sun')
      .map((p) => ({ center: new THREE.Vector3(...p.position), radius: p.radius }))
  ), [planets])

  // ── Keyboard listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e) => {
      const tag = e.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      const k = keys.current
      const key = e.key?.toLowerCase()
      if (key === 'z') k.fwd   = true
      if (key === 's') k.bwd   = true
      if (key === 'q') k.left  = true
      if (key === 'd') k.right = true
      if (key === 'a') k.down  = true
      if (e.code === 'Space')  { k.up   = true; e.preventDefault() }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') k.boost = true
    }
    const up = (e) => {
      const k = keys.current
      const key = e.key?.toLowerCase()
      if (key === 'z') k.fwd   = false
      if (key === 's') k.bwd   = false
      if (key === 'q') k.left  = false
      if (key === 'd') k.right = false
      if (key === 'a') k.down  = false
      if (e.code === 'Space')  k.up   = false
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') k.boost = false
    }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => { if (onShipMeshReady && fighterModel) onShipMeshReady(fighterModel) }, [fighterModel, onShipMeshReady])

  // ── Main update ─────────────────────────────────────────────────────────────
  useFrame((state, rawDt) => {
    const ship = shipRef.current
    if (!ship) return
    const dt  = Math.min(rawDt, 0.05)
    const k   = keys.current
    const on  = enabled !== false

    // ── Boost & fuel ──────────────────────────────────────────────────────────
    const boosting = on && k.boost && k.fwd
    fuelRef.current = 1

    // ── Angular velocity (smooth ramp-up / ramp-down) ─────────────────────────
    const yawInput   = on ? (k.left  ? 1 : 0) - (k.right ? 1 : 0) : 0
    const pitchInput = on ? (k.up ? 1 : 0) - (k.down ? 1 : 0) : 0

    angVel.current.yaw = THREE.MathUtils.clamp(
      angVel.current.yaw + yawInput * YAW_ACCEL * dt,
      -YAW_RATE, YAW_RATE
    )
    angVel.current.pitch = THREE.MathUtils.clamp(
      angVel.current.pitch + pitchInput * PITCH_ACCEL * dt,
      -PITCH_RATE, PITCH_RATE
    )
    const angularDamp = Math.pow(ANGULAR_DAMPING, dt * 60)
    if (yawInput === 0) angVel.current.yaw *= angularDamp
    if (pitchInput === 0) angVel.current.pitch *= angularDamp

    // ── Apply rotations (local-space, preserves orientation) ─────────────────
    if (on) {
      ship.rotateY(angVel.current.yaw   * dt)
      ship.rotateX(angVel.current.pitch * dt)
    }

    // ── Visual banking ────────────────────────────────────────────────────────
    bankAngle.current += (yawInput * ROLL_FROM_YAW - bankAngle.current) * (1 - Math.exp(-9 * dt))
    if (visualRef.current) {
      visualRef.current.rotation.z = bankAngle.current
    }

    // ── Thrust along local forward axis ───────────────────────────────────────
    const thrustFwd = on ? (k.fwd ? 1 : k.bwd ? -1 : 0) : 0
    if (thrustFwd !== 0) {
      S.fwd.set(0, 0, -1).applyQuaternion(ship.quaternion)
      const thrust = THRUST * (boosting ? BOOST_MULT : 1)
      vel.current.addScaledVector(S.fwd, thrustFwd * thrust * dt)
    }

    // ── Clamp speed ───────────────────────────────────────────────────────────
    const maxSpd = boosting ? MAX_BOOST_SPEED : MAX_SPEED
    const spd = vel.current.length()
    if (spd > maxSpd) vel.current.normalize().multiplyScalar(maxSpd)

    // ── Apply velocity & damping ──────────────────────────────────────────────
    pos.current.addScaledVector(vel.current, dt)
    // Damping only when no thrust input, so 200/300 caps are actually reachable.
    if (thrustFwd === 0) {
      const damp = Math.pow(LINEAR_DAMPING, dt * 60)
      vel.current.multiplyScalar(damp)
    }
    if (vel.current.lengthSq() < 0.01) vel.current.set(0, 0, 0)

    // ── Planet collisions (sphere vs sphere) ─────────────────────────────────
    for (let i = 0; i < collisionBodies.length; i++) {
      const body = collisionBodies[i]
      S.toCenter.copy(pos.current).sub(body.center)
      const minDist = body.radius + SHIP_COLLISION_RADIUS
      const d2 = S.toCenter.lengthSq()
      if (d2 === 0 || d2 >= minDist * minDist) continue
      const d = Math.sqrt(d2)
      S.toCenter.multiplyScalar(1 / d)
      pos.current.copy(body.center).addScaledVector(S.toCenter, minDist)
      const vn = vel.current.dot(S.toCenter)
      if (vn < 0) vel.current.addScaledVector(S.toCenter, -vn)
    }

    // ── World bounds ──────────────────────────────────────────────────────────
    const LO = -WORLD_HALF + WORLD_MARGIN, HI = WORLD_HALF - WORLD_MARGIN
    if (pos.current.x < LO) { pos.current.x = LO; vel.current.x = 0 }
    if (pos.current.x > HI) { pos.current.x = HI; vel.current.x = 0 }
    if (pos.current.y < LO) { pos.current.y = LO; vel.current.y = 0 }
    if (pos.current.y > HI) { pos.current.y = HI; vel.current.y = 0 }
    if (pos.current.z < LO) { pos.current.z = LO; vel.current.z = 0 }
    if (pos.current.z > HI) { pos.current.z = HI; vel.current.z = 0 }

    ship.position.copy(pos.current)

    // ── Publish ship state ────────────────────────────────────────────────────
    ship.getWorldPosition(S.shipW)
    ship.getWorldQuaternion(S.shipQ)
    shipStateRef.current.px       = S.shipW.x
    shipStateRef.current.py       = S.shipW.y
    shipStateRef.current.pz       = S.shipW.z
    shipStateRef.current.qx       = S.shipQ.x
    shipStateRef.current.qy       = S.shipQ.y
    shipStateRef.current.qz       = S.shipQ.z
    shipStateRef.current.qw       = S.shipQ.w
    shipStateRef.current.speed    = vel.current.length()
    shipStateRef.current.boosting = boosting
    shipStateRef.current.yawVel = angVel.current.yaw
    shipStateRef.current.yawInput = yawInput
    if (lightRef.current) lightRef.current.intensity = 25

    // ── Telemetry ~10fps ──────────────────────────────────────────────────────
    if (onTelemetry && state.clock.elapsedTime - lastTel.current > 0.1) {
      lastTel.current = state.clock.elapsedTime
      S.fwd.set(0, 0, -1).applyQuaternion(ship.quaternion)
      const heading = ((THREE.MathUtils.radToDeg(Math.atan2(S.fwd.x, -S.fwd.z)) % 360) + 360) % 360
      onTelemetry({ px: pos.current.x, py: pos.current.y, pz: pos.current.z, speed: vel.current.length(), headingDeg: heading, boostFuel: fuelRef.current, boosting })
    }
  }, -1)

  return (
    <group ref={shipRef}>
      <group ref={visualRef}>
        <group rotation={[0, Math.PI, 0]}>
          {fighterModel && <primitive object={fighterModel} />}
        </group>
      </group>
      <pointLight
        ref={lightRef}
        position={[0, 1.5, 2]}
        intensity={25}
        distance={55}
        color="#c0deff"
      />
    </group>
  )
}

useGLTF.preload('/dolph-1_-_light_fighter.glb')
