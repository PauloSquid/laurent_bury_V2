import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeFirebase } from '../../testing/firebase';
import { livre } from '../../testing/livres';
import { BATCH_SIZE, LivresService, REMOTE_UNAVAILABLE, chunks } from './livres.service';

const SEED = [
  { titre: 'Emma', auteur: 'Jane AUSTEN', date: '2001', editeur: 'Folio', genre: 'Classiques', image_url: null },
  { titre: 'Persuasion', auteur: 'Jane AUSTEN', date: '2002', editeur: 'Folio', genre: 'Classiques' },
];

async function setup(firebaseEnabled: boolean): Promise<{ service: LivresService; http: HttpTestingController }> {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), fakeFirebase(firebaseEnabled)],
  });
  const service = TestBed.inject(LivresService);
  const http = TestBed.inject(HttpTestingController);
  http.expectOne('/data/livres.json').flush(SEED);
  await new Promise((resolve) => setTimeout(resolve));
  return { service, http };
}

describe('LivresService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('sans Firebase', () => {
    it('charge le catalogue embarqué', async () => {
      const { service } = await setup(false);
      expect(service.loading()).toBe(false);
      expect(service.livres().map((item) => item.titre)).toEqual(['Emma', 'Persuasion']);
      expect(service.livres()[0].image_url).toBe('');
      expect(service.canEdit()).toBe(true);
    });

    it('enregistre un ajout dans le navigateur', async () => {
      const { service } = await setup(false);
      await service.add(livre({ titre: 'Orgueil et Préjugés' }));
      expect(service.livres()[0].titre).toBe('Orgueil et Préjugés');
      expect(service.editedLocally()).toBe(true);
      expect(JSON.parse(localStorage.getItem('lb-livres-v1') ?? '[]')).toHaveLength(3);
    });

    it('modifie et supprime un livre', async () => {
      const { service } = await setup(false);
      const [emma] = service.livres();
      await service.update({ ...emma, titre: 'Emma (nouvelle traduction)' });
      expect(service.livres()[0].titre).toBe('Emma (nouvelle traduction)');
      await service.remove(emma.id);
      expect(service.livres().map((item) => item.titre)).toEqual(['Persuasion']);
    });

    it('retrouve les modifications au rechargement, puis revient à l’origine', async () => {
      localStorage.setItem('lb-livres-v1', JSON.stringify([livre({ id: 'gardé', titre: 'Gardé' })]));
      const { service } = await setup(false);
      expect(service.livres().map((item) => item.id)).toEqual(['gardé']);
      service.resetLocal();
      expect(service.livres()).toHaveLength(2);
      expect(localStorage.getItem('lb-livres-v1')).toBeNull();
    });

    it('ignore un cache illisible', async () => {
      localStorage.setItem('lb-livres-v1', '{pas du json');
      const { service } = await setup(false);
      expect(service.livres()).toHaveLength(2);
    });
  });

  describe('avec Firebase', () => {
    const REST = 'https://firestore.googleapis.com/v1/projects/demo-laurent-bury/databases/(default)/documents/livres';
    const document = (id: string, titre: string) => ({
      name: `projects/demo-laurent-bury/databases/(default)/documents/livres/${id}`,
      fields: { titre: { stringValue: titre }, auteur: { stringValue: 'Jane AUSTEN' } },
    });
    const remote = (http: HttpTestingController) => http.expectOne((request) => request.url === REST);
    const settle = () => new Promise((resolve) => setTimeout(resolve));

    it('affiche le catalogue publié dans Firestore et autorise les modifications', async () => {
      const { service, http } = await setup(true);
      remote(http).flush({ documents: [document('a', 'Emma'), document('b', 'Sanditon'), document('c', 'Lady Susan')] });
      await settle();
      expect(service.source()).toBe('firebase');
      expect(service.canEdit()).toBe(true);
      expect(service.livres().map((item) => item.id)).toEqual(['a', 'b', 'c']);
    });

    it('suit la pagination de l’API', async () => {
      const { service, http } = await setup(true);
      const first = remote(http);
      expect(first.request.params.get('pageToken')).toBeNull();
      first.flush({ documents: [document('a', 'Emma')], nextPageToken: 'suite' });
      await settle();
      const second = remote(http);
      expect(second.request.params.get('pageToken')).toBe('suite');
      second.flush({ documents: [document('b', 'Persuasion')] });
      await settle();
      expect(service.livres().map((item) => item.id)).toEqual(['a', 'b']);
    });

    it('garde le catalogue embarqué et propose l’import si Firestore est vide', async () => {
      const { service, http } = await setup(true);
      remote(http).flush({});
      await settle();
      expect(service.remoteEmpty()).toBe(true);
      expect(service.canEdit()).toBe(false);
      expect(service.livres().map((item) => item.titre)).toEqual(['Emma', 'Persuasion']);
    });

    it('avertit si Firestore refuse la lecture', async () => {
      const { service, http } = await setup(true);
      remote(http).flush({}, { status: 403, statusText: 'Forbidden' });
      await settle();
      expect(service.remoteWarning()).toContain('refuse la lecture');
      expect(service.canEdit()).toBe(false);
    });

    it('n’utilise pas le cache du navigateur', async () => {
      localStorage.setItem('lb-livres-v1', JSON.stringify([livre({ titre: 'Ancien brouillon' })]));
      const { service, http } = await setup(true);
      remote(http).flush({});
      expect(service.livres().map((item) => item.titre)).toEqual(['Emma', 'Persuasion']);
    });

    it('refuse de modifier tant que Firestore n’est pas joignable, sans rien écrire en local', async () => {
      const { service, http } = await setup(true);
      remote(http).flush({}, { status: 500, statusText: 'Erreur' });
      await settle();
      expect(service.canEdit()).toBe(false);
      await expect(service.add(livre())).rejects.toThrow(REMOTE_UNAVAILABLE);
      await expect(service.update(service.livres()[0])).rejects.toThrow(REMOTE_UNAVAILABLE);
      await expect(service.remove(service.livres()[0].id)).rejects.toThrow(REMOTE_UNAVAILABLE);
      expect(localStorage.getItem('lb-livres-v1')).toBeNull();
      expect(service.livres()).toHaveLength(2);
    });
  });

  it('signale un catalogue introuvable', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), fakeFirebase(false)],
    });
    const service = TestBed.inject(LivresService);
    TestBed.inject(HttpTestingController)
      .expectOne('/data/livres.json')
      .flush('absent', { status: 404, statusText: 'Not Found' });
    await new Promise((resolve) => setTimeout(resolve));
    expect(service.error()).toBeTruthy();
    expect(service.loading()).toBe(false);
  });
});

describe('chunks', () => {
  it('découpe en lots sous la limite de Firestore', () => {
    const lots = chunks(Array.from({ length: 1000 }, (_, index) => index), BATCH_SIZE);
    expect(lots.map((lot) => lot.length)).toEqual([450, 450, 100]);
    expect(BATCH_SIZE).toBeLessThanOrEqual(500);
  });

  it('renvoie une liste vide pour une liste vide', () => {
    expect(chunks([], 10)).toEqual([]);
  });
});
