import * as THREE from 'three'

export const PLANET_POSITIONS = {
  earth: new THREE.Vector3(0, 0, -300),
  mars: new THREE.Vector3(-96, -12, -1560),
  jupiter: new THREE.Vector3(120, 18, -1890),
  saturn: new THREE.Vector3(-138, -14, -2230),
  neptune: new THREE.Vector3(-188, -22, -2940),
}

export const BELT_CONFIGS = [
  {
    name: 'main-belt',
    type: 'curve',
    count: 8000,
    tubeRadius: 400,
    asteroidScaleRange: [2, 25],
    curve: new THREE.CatmullRomCurve3(
      [
        PLANET_POSITIONS.mars.clone().add(new THREE.Vector3(500, 0, 0)),
        PLANET_POSITIONS.mars.clone().add(new THREE.Vector3(1500, 200, 800)),
        PLANET_POSITIONS.jupiter.clone().add(new THREE.Vector3(-1500, -100, -600)),
        PLANET_POSITIONS.jupiter.clone().add(new THREE.Vector3(-500, 0, 0)),
      ],
      false,
      'catmullrom',
      0.5,
    ),
  },
  {
    name: 'inner-scatter',
    type: 'curve',
    count: 3000,
    tubeRadius: 200,
    asteroidScaleRange: [1, 10],
    curve: new THREE.CatmullRomCurve3([
      PLANET_POSITIONS.earth.clone().add(new THREE.Vector3(120, 60, -120)),
      PLANET_POSITIONS.earth.clone().add(new THREE.Vector3(-220, -80, -600)),
      PLANET_POSITIONS.mars.clone().add(new THREE.Vector3(220, 40, 300)),
    ]),
  },
  {
    name: 'jupiter-trojans-l4',
    type: 'cluster',
    count: 4000,
    clusterCenter: PLANET_POSITIONS.jupiter.clone().add(new THREE.Vector3(-700, 120, 520)),
    clusterRadius: 800,
    asteroidScaleRange: [3, 20],
  },
  {
    name: 'jupiter-trojans-l5',
    type: 'cluster',
    count: 4000,
    clusterCenter: PLANET_POSITIONS.jupiter.clone().add(new THREE.Vector3(700, -120, -520)),
    clusterRadius: 800,
    asteroidScaleRange: [3, 20],
  },
  {
    name: 'kuiper-belt',
    type: 'curve',
    count: 6000,
    tubeRadius: 600,
    asteroidScaleRange: [5, 40],
    curve: new THREE.CatmullRomCurve3([
      PLANET_POSITIONS.neptune.clone().add(new THREE.Vector3(-200, 120, -400)),
      PLANET_POSITIONS.neptune.clone().add(new THREE.Vector3(1200, -300, -1200)),
      PLANET_POSITIONS.neptune.clone().add(new THREE.Vector3(-1800, 400, -2600)),
      PLANET_POSITIONS.neptune.clone().add(new THREE.Vector3(900, -160, -4200)),
    ]),
  },
  {
    name: 'saturn-ring-debris',
    type: 'cluster',
    count: 2000,
    clusterCenter: PLANET_POSITIONS.saturn.clone(),
    clusterRadius: 260,
    asteroidScaleRange: [0.5, 5],
    ringLike: true,
  },
]
