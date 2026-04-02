uniform float uSpeed;
varying float vAlpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float dist = length(mvPosition.xyz);
  float baseSize = 1.5;
  float speedBoost = min(uSpeed * 0.01, 3.0);
  gl_PointSize = (baseSize + speedBoost) * (300.0 / dist);
  vAlpha = smoothstep(600.0, 50.0, dist) * (0.3 + min(uSpeed * 0.005, 0.7));
  gl_Position = projectionMatrix * mvPosition;
}
