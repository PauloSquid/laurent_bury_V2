import { describe, expect, it } from 'vitest';
import { isTri, livreFromRest, livreFromUnknown, newLivreId, toFirestoreLivre, withStableIds } from './models';

describe('livreFromUnknown', () => {
  it('nettoie les champs et remplace les valeurs non textuelles', () => {
    const livre = livreFromUnknown('id1', {
      titre: '  Emma ',
      auteur: null,
      date: 2020,
      info_supplementaires: { a: 1 },
      priorite: 3,
    });
    expect(livre).toEqual({
      id: 'id1',
      titre: 'Emma',
      auteur: '',
      date: '',
      editeur: '',
      genre: '',
      info_supplementaires: '',
      image_url: '',
    });
  });

  it('accepte une entrée qui n’est pas un objet', () => {
    expect(livreFromUnknown('x', null).titre).toBe('');
    expect(livreFromUnknown('x', 'texte').titre).toBe('');
  });
});

describe('withStableIds', () => {
  const rows = [
    { titre: 'Emma', auteur: 'Jane AUSTEN', date: '2001', editeur: 'Folio' },
    { titre: 'Persuasion', auteur: 'Jane AUSTEN', date: '2002', editeur: 'Folio' },
  ];

  it('donne le même identifiant d’un chargement à l’autre', () => {
    expect(withStableIds(rows).map((row) => row.id)).toEqual(withStableIds(rows).map((row) => row.id));
  });

  it('distingue deux livres différents', () => {
    const [a, b] = withStableIds(rows);
    expect(a.id).not.toBe(b.id);
  });

  it('distingue deux doublons exacts', () => {
    const [a, b] = withStableIds([rows[0], rows[0]]);
    expect(a.id).not.toBe(b.id);
  });

  it('garde l’identifiant d’un export Firestore', () => {
    expect(withStableIds([{ ...rows[0], id: 'doc-firestore' }])[0].id).toBe('doc-firestore');
  });
});

describe('toFirestoreLivre', () => {
  it('n’envoie que les sept champs attendus par les règles, sans l’identifiant', () => {
    const data = toFirestoreLivre(livreFromUnknown('id', { titre: 'Emma' }));
    expect(Object.keys(data).sort()).toEqual(
      ['auteur', 'date', 'editeur', 'genre', 'image_url', 'info_supplementaires', 'titre'].sort(),
    );
    expect(Object.values(data).every((value) => typeof value === 'string')).toBe(true);
  });
});

describe('outils', () => {
  it('reconnaît les classements', () => {
    expect(['genre', 'auteur', 'editeur', 'date'].every(isTri)).toBe(true);
    expect(isTri('titre')).toBe(false);
    expect(isTri(null)).toBe(false);
  });

  it('génère des identifiants uniques et courts', () => {
    const ids = new Set(Array.from({ length: 200 }, newLivreId));
    expect(ids.size).toBe(200);
    expect([...ids].every((id) => id.length <= 64)).toBe(true);
  });
});

describe('livreFromRest', () => {
  it('lit un document de l’API REST de Firestore', () => {
    const livre = livreFromRest({
      name: 'projects/p/databases/(default)/documents/livres/lv42',
      fields: { titre: { stringValue: 'Emma' }, date: { stringValue: '2001' }, autre: {} },
    });
    expect(livre.id).toBe('lv42');
    expect(livre.titre).toBe('Emma');
    expect(livre.date).toBe('2001');
    expect(livre.auteur).toBe('');
  });
});
