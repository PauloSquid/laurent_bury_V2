/** Coordonnées reprises dans les pages légales (elles figurent déjà sur la page CV). */
export const EDITEUR = {
  nom: 'Laurent Bury',
  activite: 'Traducteur littéraire indépendant',
  adresse: ['27, rue Jean-Jacques Rousseau', '75001 Paris', 'France'],
  telephone: '06 43 10 69 40',
  telephoneLien: 'tel:+33643106940',
  email: 'bury.laurent@neuf.fr',
} as const;

export const HEBERGEUR = {
  nom: 'Vercel Inc.',
  adresse: ['440 N Barranca Ave #4133', 'Covina, CA 91723, États-Unis'],
  telephone: '+1 559 288 7060',
  site: 'https://vercel.com',
} as const;

/** Prestataire de la base de données du catalogue (Cloud Firestore). */
export const BASE_DONNEES = {
  nom: 'Google Ireland Limited (Firebase)',
  adresse: 'Gordon House, Barrow Street, Dublin 4, Irlande',
} as const;

export const LEGAL_UPDATED = '15 octobre 2026';
