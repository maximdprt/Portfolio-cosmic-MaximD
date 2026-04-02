attribute float aSize;
attribute vec3 aColor;
attribute float aBrightness;
varying vec3 vColor;
varying float vBrightness;
uniform float uTime;

void main() {
  vColor = aColor;
  vBrightness = aBrightness;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (800.0 / length(mvPosition.xyz));
  gl_Position = projectionMatrix * mvPosition;
}
