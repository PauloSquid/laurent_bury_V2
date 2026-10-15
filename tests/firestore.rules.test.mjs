// Tests des règles Firestore, à lancer avec l’émulateur : npm run test:rules
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, setLogLevel, updateDoc } from 'firebase/firestore';

setLogLevel('silent');

const ADMIN_UID = readFileSync('firestore.rules', 'utf8').match(/request\.auth\.uid == '([^']+)'/)[1];
const livre = {
  auteur: 'Charles Dickens',
  titre: 'De grandes espérances',
  date: 'mars 2024',
  editeur: 'Gallimard',
  genre: 'Classiques de la littérature anglophone',
  info_supplementaires: '',
  image_url: 'https://exemple.fr/couverture.jpg',
};

let env;
const admin = () => env.authenticatedContext(ADMIN_UID).firestore();
const intrus = () => env.authenticatedContext('quelqu-un-d-autre').firestore();
const anonyme = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-laurent-bury',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'livres/existant'), livre));
});
after(() => env.cleanup());

describe('lecture', () => {
  test('tout le monde peut lire un livre', () => assertSucceeds(getDoc(doc(anonyme(), 'livres/existant'))));
  test('tout le monde peut lister le catalogue', () => assertSucceeds(getDocs(collection(anonyme(), 'livres'))));
  test('les autres collections sont fermées', () => assertFails(getDoc(doc(admin(), 'autre/x'))));
});

describe('écriture réservée à l’admin', () => {
  test('l’admin crée un livre', () => assertSucceeds(setDoc(doc(admin(), 'livres/nouveau'), livre)));
  test('l’admin modifie un livre', () =>
    assertSucceeds(setDoc(doc(admin(), 'livres/existant'), { ...livre, titre: 'Oliver Twist' })));
  test('l’admin supprime un livre', () => assertSucceeds(deleteDoc(doc(admin(), 'livres/existant'))));
  test('un visiteur ne peut pas créer', () => assertFails(setDoc(doc(anonyme(), 'livres/x'), livre)));
  test('un autre compte ne peut pas créer', () => assertFails(setDoc(doc(intrus(), 'livres/x'), livre)));
  test('un autre compte ne peut pas modifier', () =>
    assertFails(updateDoc(doc(intrus(), 'livres/existant'), { titre: 'Piraté' })));
  test('un autre compte ne peut pas supprimer', () => assertFails(deleteDoc(doc(intrus(), 'livres/existant'))));
  test('l’admin ne peut pas écrire ailleurs', () => assertFails(setDoc(doc(admin(), 'autre/x'), { a: 1 })));
});

describe('validation des champs', () => {
  const refuse = (nom, data) =>
    test(nom, () => assertFails(setDoc(doc(admin(), 'livres/x'), data)));

  test('une couverture vide est acceptée', () =>
    assertSucceeds(setDoc(doc(admin(), 'livres/x'), { ...livre, image_url: '' })));
  test('une couverture en http est acceptée', () =>
    assertSucceeds(setDoc(doc(admin(), 'livres/x'), { ...livre, image_url: 'http://exemple.fr/a.jpg' })));
  refuse('titre vide', { ...livre, titre: '' });
  refuse('titre fait d’espaces', { ...livre, titre: '   ' });
  refuse('titre trop long', { ...livre, titre: 'x'.repeat(301) });
  refuse('champ inconnu', { ...livre, priorite: 1 });
  refuse('champ manquant', (({ genre, ...reste }) => reste)(livre));
  refuse('nombre au lieu de texte', { ...livre, date: 2024 });
  refuse('valeur nulle', { ...livre, auteur: null });
  refuse('adresse javascript:', { ...livre, image_url: 'javascript:alert(1)' });
  refuse('adresse data:', { ...livre, image_url: 'data:image/png;base64,AAAA' });
  refuse('informations trop longues', { ...livre, info_supplementaires: 'x'.repeat(1001) });
  test('identifiant trop long refusé', () =>
    assertFails(setDoc(doc(admin(), `livres/${'a'.repeat(65)}`), livre)));
  test('une modification partielle invalide est refusée', () =>
    assertFails(updateDoc(doc(admin(), 'livres/existant'), { titre: '' })));
});
