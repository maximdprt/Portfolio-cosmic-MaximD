varying vec3 vColor;
varying float vBrightness;
uniform float uTime;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float circle = 1.0 - smoothstep(0.15, 0.5, d);
  float twinkle = sin(uTime * 0.5 + vBrightness * 6.28) * 0.15 + 0.85;
  float alpha = circle * vBrightness * twinkle;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
