# Changelog

## Refonte complete Cosmic Voyager

- Ajout d'un onboarding interactif avec sauvegarde locale, reouverture via `H`, mode clavier tactile et focus visible.
- Refonte de l'overlay planete pour afficher les 4 projets (Earth, Mars, Venus, Neptune) avec placeholders, fallback image, bouton lien externe et fermeture (`Echap`, clic backdrop, bouton).
- Ajout des donnees projets dans `portfolio/src/data/projects.js`.
- Amelioration du HUD: mini-map enrichie (tooltips, pulse projets, triangle directionnel), distance planete la plus proche, prompt d'atterrissage dynamique.
- Boost du vaisseau corrige et rendu utile (fuel drain/refill, damping framerate-independent, FOV dynamique, shake, recule camera en boost).
- Ajout d'un trail moteur GPU (`EngineTrail`) et activation du tunnel warp en boost.
- Planetes modernisees: LOD via `Detailed`, integration atmospheres Fresnel, anneaux de Saturne, corona solaire amelioree + flares.
- Activation de la nebuleuse (`NebulaBackdrop`) et upgrade du starfield (twinkle + distance fade + count configurable).
- Polish des asteroides de corridor (teintes variees, quantite adaptee low-perf).
- Nettoyage de la logique obsolete de degats/coque.
- Optimisation build Vite: `terser`, `manualChunks`, `target es2020`, `host true`.
- Nettoyage deps: retrait de `@react-three/rapier`, ajout `terser`, ajout `r3f-perf` en dev.
