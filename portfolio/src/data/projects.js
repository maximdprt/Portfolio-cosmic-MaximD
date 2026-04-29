export const PROJECTS = {
  // ───────────────────────────────────────────────────────────────────────────
  // EARTH — Lacanau Beach Handball Xperience
  // ───────────────────────────────────────────────────────────────────────────
  Earth: {
    planet: 'Earth',
    index: 1,
    total: 4,
    title: 'Lacanau Beach Handball Xperience',
    subtitle: 'Site événementiel multilingue',
    theme: '#4fc3ff',
    image: '/projects/lbhx.jpg',
    url: 'https://site-lbhx.vercel.app/',
    description:
      "Site officiel du LBHX, le concept N°1 de Beach Handball en France. Plateforme événementielle " +
      "complète pour la 6ᵉ édition (12-14 juin 2026) accueillant des équipes internationales sur la " +
      "plage de Lacanau-Océan. Le site centralise l'inscription des équipes, la communication " +
      "partenaires, la billetterie boutique et le recrutement des volontaires, dans une interface " +
      "immersive multilingue (FR/EN/ES/DE) pour toucher un public européen.",
    highlights: [
      "Interface multilingue 4 langues avec sélecteur dynamique",
      "Hero vidéo en arrière-plan pour une immersion immédiate",
      "CTA différenciés (inscription équipe / volontariat) selon profil utilisateur",
      "Intégration HelloAsso pour les inscriptions et paiements",
      "Boutique merchandising et page partenaires",
    ],
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'i18n (next-intl)',
      'Vercel',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // MARS — Massage Aura Performance
  // ───────────────────────────────────────────────────────────────────────────
  Mars: {
    planet: 'Mars',
    index: 2,
    total: 4,
    title: 'Massage Aura Performance',
    subtitle: 'Site vitrine avec réservation en ligne',
    theme: '#d4a26a',
    image: '/projects/massage.jpg',
    url: 'https://massage-aura-performance.fr/',
    description:
      "Site vitrine d'une praticienne certifiée en massages sportifs et bien-être à Lacanau Océan. " +
      "Identité visuelle haut de gamme (palette or et taupe, typographie serif élégante) traduisant " +
      "l'univers du soin et de l'apaisement. Le site présente le catalogue de prestations, le cadre " +
      "(cabinet et domicile), et intègre un système de réservation pour fluidifier la prise de " +
      "rendez-vous depuis le mobile comme depuis le desktop.",
    highlights: [
      "Direction artistique premium : gradient or sur fond doux, typographies sérif/sans-serif",
      "Hero parallaxe avec image de soin en arrière-plan flouté",
      "Architecture orientée conversion (CTA Réserver présent dans la nav)",
      "Pages dédiées : Nos Massages, Infos, Contact, Réservation",
      "SEO local optimisé pour Lacanau-Océan et Médoc Atlantique",
    ],
    stack: [
      'Next.js',
      'React',
      'Tailwind CSS',
      'Framer Motion',
      'Système de réservation intégré',
      'Hébergement domaine custom .fr',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // VENUS — Lacanau Volley-Ball
  // ───────────────────────────────────────────────────────────────────────────
  Venus: {
    planet: 'Venus',
    index: 3,
    total: 4,
    title: 'Lacanau Volley Club',
    subtitle: 'Site de club avec espace membre',
    theme: '#ff8a3d',
    image: '/projects/volley.jpg',
    url: 'https://www.lacanauvolley.fr/',
    description:
      "Site officiel de l'AS Lacanau Section Volley-Ball, club entre océan et forêt depuis 2010. " +
      "Pratique indoor (mardi, jeudi au COSEC) et beach volley le dimanche à Ardilouse. La " +
      "plateforme combine identité forte (typographie XXL Lacanau / Volley en orange signature), " +
      "présentation des activités, actualités du club, galerie photo, et un espace de connexion " +
      "membres pour gérer les essais gratuits et l'inscription en ligne.",
    highlights: [
      "Hero typographique massif avec accent orange identitaire",
      "Cards d'horaires de séances avec icônes contextuelles",
      "Espace membres authentifié (Se Connecter)",
      "Parcours d'essai gratuit en deux clics",
      "Architecture multi-pages (Le Club, Activités, Actualités, Galerie, Rejoindre)",
    ],
    stack: [
      'Next.js',
      'React',
      'Tailwind CSS',
      'Framer Motion',
      'Authentification utilisateur',
      'CMS pour les actualités',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // NEPTUNE — Lacanau Ocehand
  // ───────────────────────────────────────────────────────────────────────────
  Neptune: {
    planet: 'Neptune',
    index: 4,
    total: 4,
    title: 'Lacanau Ocehand',
    subtitle: 'Site de club Champions de France 2024',
    theme: '#1f7ae0',
    image: '/projects/ocehand.jpg',
    url: 'https://temp-next-five.vercel.app/',
    description:
      "Site officiel du Lacanau Ocehand, club de handball moderne sur la côte atlantique, Champions " +
      "de France Départementaux 2024. Refonte qui met en avant l'image victorieuse du club (hero " +
      "vidéo célébration trophée Bercy), tout en structurant clairement l'information pour les " +
      "licenciés (équipes, saison en cours, événements) et les futurs membres (rejoindre le club). " +
      "Intégration d'une passerelle vers le LBHX pour valoriser l'écosystème événementiel du club.",
    highlights: [
      "Hero vidéo plein écran avec moment célébration Champions de France",
      "Badge identitaire Champions de France 2024 visible dès l'arrivée",
      "Architecture saison-centrée (Saison 24-25 dédiée)",
      "Cross-sell vers le LBHX (CTA Beach Xperience dans la nav)",
      "Structure pensée pour la croissance du club (150+ licenciés, 9 équipes)",
    ],
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Background vidéo optimisé',
      'Vercel',
    ],
  },
}

export const PROJECT_PLANETS = Object.keys(PROJECTS)

export function getProjectByPlanet(planetName) {
  return PROJECTS[planetName] ?? null
}

export function isProjectPlanet(planetName) {
  return planetName in PROJECTS
}
