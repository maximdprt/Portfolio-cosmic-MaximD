export function smoothDampScalar(cur, tgt, velObj, key, smoothTime, dt, maxSpd = Infinity) {
  const st = Math.max(0.0001, smoothTime)
  const w  = 2.0 / st
  const x  = w * dt
  const ex = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x)
  let ch   = cur - tgt
  const mc = maxSpd * st
  ch       = Math.max(-mc, Math.min(mc, ch))
  const orig = tgt
  tgt = cur - ch
  const tmp = (velObj[key] + w * ch) * dt
  velObj[key] = (velObj[key] - w * tmp) * ex
  let out = tgt + (ch + tmp) * ex
  if ((orig - cur > 0) === (out > orig)) { out = orig; velObj[key] = 0 }
  return out
}

export function smoothDampVec3(cur, tgt, velObj, kx, ky, kz, smoothTime, dt, maxSpd = Infinity, outVec) {
  outVec.x = smoothDampScalar(cur.x, tgt.x, velObj, kx, smoothTime, dt, maxSpd)
  outVec.y = smoothDampScalar(cur.y, tgt.y, velObj, ky, smoothTime, dt, maxSpd)
  outVec.z = smoothDampScalar(cur.z, tgt.z, velObj, kz, smoothTime, dt, maxSpd)
  return outVec
}
