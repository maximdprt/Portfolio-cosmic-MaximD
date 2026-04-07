import * as THREE from 'three'

export const WORLD_HALF   = 18000
export const WORLD_MARGIN = 500
export const SPAWN        = new THREE.Vector3(0, 0, 700)
export const PHYSICS_HZ   = 50

export const PLANET_CONTENT = {
  Earth:   { theme: '#4fc3ff', title: 'Aqualis',      subtitle: 'Qui je suis',     body: 'Bio, photo et valeurs. Un profil clair, humain, et orienté vers la collaboration.' },
  Mars:    { theme: '#ff9a52', title: 'Forge Prime',  subtitle: 'Mes projets',     body: 'Cards interactives : projets, stack technique, challenges et résultats.' },
  Venus:   { theme: '#58d68d', title: 'Synthos',      subtitle: 'Mes compétences', body: 'Arbres de skills animés : frontend, 3D, backend, UX et tooling.' },
  Neptune: { theme: '#be8dff', title: 'Nexara',       subtitle: 'Contact',         body: 'Formulaire flottant, liens pros et moyens rapides pour me joindre.' },
  Sun:     { theme: '#ffd580', title: 'Station Zero', subtitle: 'CV',              body: 'Accès direct au CV téléchargeable et résumé professionnel.' },
}

export const ATMO_COLOR = {
  Mercury: '#bbaa88', Venus: '#ffcc66', Earth: '#4fc3ff', Mars: '#ff7744',
  Jupiter: '#d4a96a', Saturn: '#e8c87a', Uranus: '#7de8e8', Neptune: '#5588ff',
  Moon: '#888888', Pluto: '#aaaacc', Sun: '#ff8820',
}
