import { RenderMode, ServerRoute } from '@angular/ssr';

/** Pages publiques pré-rendues au build ; l’admin et la page 404 restent rendues dans le navigateur. */
export const PRERENDERED_PATHS = [
  '',
  'traduction',
  'dernieres-parutions',
  'travaux-presse',
  'cv-contact',
  'mentions-legales',
  'confidentialite',
] as const;

export const serverRoutes: ServerRoute[] = [
  ...PRERENDERED_PATHS.map((path) => ({ path, renderMode: RenderMode.Prerender }) as ServerRoute),
  { path: 'admin', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
