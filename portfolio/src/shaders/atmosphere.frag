uniform vec3 uAtmosphereColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
  float glow = pow(rim, 3.0) * 1.5 * uIntensity;
  gl_FragColor = vec4(uAtmosphereColor, glow);
}
