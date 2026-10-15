import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    title: 'Laurent Bury, traducteur',
    data: {
      description:
        'Bienvenue sur le site de Laurent Bury, traducteur littéraire depuis plus de trente ans. Traductions, dernières parutions, CV et contact.',
    },
  },
  {
    path: 'traduction',
    loadComponent: () => import('./pages/catalogue/catalogue').then((m) => m.CataloguePage),
    title: 'Traductions | Laurent Bury',
    data: {
      description:
        'Les traductions de Laurent Bury, classées par genre, auteur, maison d’édition ou date.',
    },
  },
  {
    path: 'dernieres-parutions',
    loadComponent: () => import('./pages/parutions/parutions').then((m) => m.ParutionsPage),
    title: 'Dernières parutions | Laurent Bury',
    data: {
      description: 'Les derniers titres traduits par Laurent Bury, parus ou à paraître.',
    },
  },
  {
    path: 'travaux-presse',
    loadComponent: () => import('./pages/presse/presse').then((m) => m.PressePage),
    title: 'Travaux pour la presse | Laurent Bury',
    data: {
      description:
        'Critiques, dossiers de presse et traductions de Laurent Bury pour l’opéra, la presse et le disque.',
    },
  },
  {
    path: 'cv-contact',
    loadComponent: () => import('./pages/cv/cv').then((m) => m.CvPage),
    title: 'CV / Contact | Laurent Bury',
    data: {
      description: 'Parcours, publications et moyens de contacter Laurent Bury, traducteur.',
    },
  },
  {
    path: 'mentions-legales',
    loadComponent: () => import('./pages/legal/mentions').then((m) => m.MentionsPage),
    title: 'Mentions légales | Laurent Bury',
    data: { description: 'Éditeur, hébergeur et propriété intellectuelle du site de Laurent Bury.' },
  },
  {
    path: 'confidentialite',
    loadComponent: () => import('./pages/legal/confidentialite').then((m) => m.ConfidentialitePage),
    title: 'Politique de confidentialité | Laurent Bury',
    data: { description: 'Données personnelles, cookies et droits des visiteurs du site de Laurent Bury.' },
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPage),
    title: 'Administration | Laurent Bury',
    data: { description: 'Gestion de la liste des traductions.' },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
    title: 'Page introuvable | Laurent Bury',
    data: { description: 'Cette page n’existe pas ou a été déplacée.', noindex: true },
  },
];
