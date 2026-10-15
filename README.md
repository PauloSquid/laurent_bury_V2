# Laurent Bury, traducteur

Refonte du site de [Laurent Bury](https://www.laurentburytraducteur.com), traducteur littéraire depuis plus de trente ans. Le contenu d’origine est conservé : le catalogue, les parutions, le parcours et les travaux de presse. La lecture, elle, change. Près de 280 ouvrages tiennent dans une page que l’on parcourt comme une bibliographie, pas comme une grille de cartes.

Le site public présente le travail. Un espace d’administration permet de tenir la liste des livres à jour, sans toucher au code.

## Fonctionnalités

**Accueil.** Une page d’entrée éditoriale : le mot de bienvenue, le portrait, le volume du catalogue et une étagère des titres les plus récents.

**Catalogue.** Recherche en direct sur le titre, l’auteur, l’éditeur, le genre et la date. Quatre classements :

- par genre, avec un raccourci vers chaque section
- par auteur, filtré sur l’initiale du nom
- par maison d’édition
- par année, avec le même type de sélecteur

Un bouton ramène en haut de page après un long défilement.

**Dernières parutions.** Les titres des quatre dernières années, regroupés par année, du plus récent au plus ancien.

**Travaux de presse.** Collaborations, dossiers d’opéra, textes pour la scène et notices de disques.

**CV et contact.** Parcours, publications et moyens de joindre Laurent Bury.

**Administration.** Connexion, ajout, modification et suppression d’un livre, recherche, tri, et aperçu de la couverture dans son cadre. Sans Firebase, les changements restent dans le navigateur. Une fois le projet branché, le catalogue se publie dans Firestore, et les modifications sont bloquées tant que Firestore n’est pas joignable : rien ne s’enregistre en silence dans le navigateur.

**Mentions légales et confidentialité.** Éditeur, directeur de publication, hébergeur, propriété intellectuelle, et politique de confidentialité conforme au RGPD. Les coordonnées sont centralisées dans `src/app/core/site.ts`.

## Technique

| | |
| --- | --- |
| Interface | Angular 21, composants autonomes, signaux, pages chargées à la demande |
| Rendu | Pages publiques pré-rendues au build (HTML complet pour les moteurs de recherche) |
| Données | Firestore pour le catalogue, lu par son API REST publique ; fichier local en secours |
| Compte admin | Firebase Authentication (le SDK Firebase n’est chargé que dans l’admin) |
| Hébergement | Vercel (`vercel.json`), en-têtes de sécurité, vraie page 404 |
| Polices | Fraunces, Newsreader et Outfit hébergées avec le site (aucun appel à Google Fonts) |
| Intégration | Vercel construit et publie à chaque push ; GitHub Actions teste et déploie les règles Firestore |

Les règles Firestore ouvrent la lecture à tous et réservent l’écriture au compte administrateur, identifié par son UID dans `firestore.rules`. Chaque livre écrit est vérifié : champs attendus uniquement, texte, titre non vide, longueurs bornées, adresse de couverture en `http(s)`. Les pages publiques gardent les adresses d’origine (`/traduction`, `/dernieres-parutions`, `/travaux-presse`, `/cv-contact`) pour ne pas casser les liens déjà en circulation.

## Lancer le projet

```bash
npm install
npm start
```

Le site s’ouvre sur [http://localhost:4200](http://localhost:4200). Le catalogue de départ est dans `public/data/livres.json`. L’administration est sur `/admin`.

Tant que `src/environments/environment.ts` n’a pas de configuration Firebase, l’admin utilise le mot de passe `localAdminPassword` et n’enregistre rien en ligne.

Pour voir le site pré-rendu tel qu’il sera publié :

```bash
npm run build
npx serve dist/laurent-bury/browser
```

## Tests

| Commande | Ce qui est vérifié |
| --- | --- |
| `npm test` | Tests unitaires (Vitest) : dates, tri et recherche du catalogue, modèles, services, pages et routes |
| `npm run test:rules` | Règles Firestore dans l’émulateur (Java 21 requis) : lecture publique, écriture admin seule, validation des champs |
| `npm run test:build` | Site produit par `npm run build` : pages pré-rendues, catalogue dans le HTML, 404, polices locales, en-têtes |
| `npm run test:all` | Tout ce qui précède |

`npm run test:watch` relance les tests unitaires à chaque modification.

## Publier

1. Créer un projet Firebase, activer la connexion e-mail / mot de passe, créer l’utilisateur administrateur, puis une base Firestore. Reporter son UID (Authentication → Utilisateurs) dans la fonction `isAdmin` de `firestore.rules`.
2. Coller la configuration Web dans `src/environments/environment.ts`.
3. Déployer les règles, se connecter à `/admin` et importer les ouvrages.
4. Importer le dépôt dans Vercel : `vercel.json` fixe la commande de build et le dossier publié, rien d’autre n’est à régler.
5. Dans les secrets GitHub, ajouter `FIREBASE_SERVICE_ACCOUNT` : la clé JSON d’un compte de service ayant le rôle **Administrateur Firebase Rules**, pour déployer les règles Firestore.

À chaque push, Vercel lance `npm run vercel-build` : tests unitaires, récupération du catalogue publié dans Firestore (`npm run sync`), build, puis vérification du site produit. Si un test échoue, le déploiement est annulé. Sur `main`, GitHub Actions teste aussi les règles Firestore (dans l’émulateur, qui demande Java) avant de les déployer.

Les livres modifiés dans l’admin sont visibles tout de suite une fois la page chargée, car le site relit Firestore. Le HTML pré-rendu (celui que lisent les moteurs de recherche) ne les reprend qu’au déploiement suivant : pour le rafraîchir sans changer le code, relancer le dernier déploiement depuis Vercel (Deployments → Redeploy).

Les pages publiques sont des fichiers HTML statiques ; seule `/admin` est réécrite vers `index.csr.html`. Toute autre adresse inconnue reçoit `404.html` avec un vrai code 404.
