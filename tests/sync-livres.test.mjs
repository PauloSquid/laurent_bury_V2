import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromDocument } from '../scripts/sync-livres.mjs';

test('convertit un document Firestore en ligne du catalogue', () => {
  const row = fromDocument({
    name: 'projects/p/databases/(default)/documents/livres/lv123',
    fields: { titre: { stringValue: 'Emma' }, auteur: { stringValue: 'Jane AUSTEN' }, inconnu: { stringValue: 'x' } },
  });
  assert.deepEqual(row, {
    id: 'lv123',
    titre: 'Emma',
    auteur: 'Jane AUSTEN',
    date: '',
    editeur: '',
    genre: '',
    info_supplementaires: '',
    image_url: '',
  });
});

test('accepte un document sans champs', () => {
  assert.equal(fromDocument({ name: 'a/livres/vide' }).titre, '');
});
