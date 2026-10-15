import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { livre } from '../../testing/livres';
import { UPCOMING_KEY, groupCatalogue, parutionsByYear, recentLivres, slugify, uniqueValues } from './catalogue';

const keys = (groups: { key: string }[]) => groups.map((group) => group.key);
const titres = (groups: { livres: { titre: string }[] }[]) =>
  groups.flatMap((group) => group.livres.map((item) => item.titre));

describe('slugify', () => {
  it('produit une ancre lisible', () => {
    expect(slugify('Beaux-arts, musique')).toBe('beaux-arts-musique');
    expect(slugify('Économie')).toBe('economie');
  });

  it('ne renvoie jamais une ancre vide', () => {
    expect(slugify('???')).toBe('groupe');
  });
});

describe('groupCatalogue par genre', () => {
  it('suit l’ordre éditorial des genres, puis l’ordre alphabétique', () => {
    const groups = groupCatalogue(
      [
        livre({ genre: 'Zoologie' }),
        livre({ genre: 'Histoire' }),
        livre({ genre: 'Classiques de la littérature anglophone' }),
        livre({ genre: 'Astronomie' }),
      ],
      'genre',
      '',
    );
    expect(keys(groups)).toEqual([
      'Classiques de la littérature anglophone',
      'Histoire',
      'Astronomie',
      'Zoologie',
    ]);
  });

  it('regroupe les variantes de casse et range les genres vides à part', () => {
    const groups = groupCatalogue(
      [livre({ genre: 'histoire' }), livre({ genre: 'Histoire ' }), livre({ genre: '' })],
      'genre',
      '',
    );
    expect(keys(groups)).toEqual(['Histoire', 'Non classé']);
    expect(groups[0].livres).toHaveLength(2);
  });

  it('trie par nom d’auteur puis du plus récent au plus ancien', () => {
    const groups = groupCatalogue(
      [
        livre({ titre: 'B', auteur: 'Virginia WOOLF', date: '2010' }),
        livre({ titre: 'A', auteur: 'Jane AUSTEN', date: 'mars 2001' }),
        livre({ titre: 'C', auteur: 'Jane AUSTEN', date: 'juin 2001' }),
        livre({ titre: 'D', auteur: 'Jane AUSTEN', date: '2015' }),
      ],
      'genre',
      '',
    );
    expect(titres(groups)).toEqual(['D', 'C', 'A', 'B']);
  });

  it('fournit une ancre par groupe', () => {
    const [group] = groupCatalogue([livre({ genre: 'Beaux-arts, musique' })], 'genre', '');
    expect(group.anchor).toBe('beaux-arts-musique');
  });
});

describe('groupCatalogue par auteur', () => {
  it('classe sur le nom de famille du premier auteur', () => {
    const groups = groupCatalogue(
      [
        livre({ auteur: 'Alex WILLIAMS' }),
        livre({ auteur: 'Nick SRNICEK et Alex WILLIAMS' }),
        livre({ auteur: 'Jane AUSTEN' }),
        livre({ auteur: '' }),
      ],
      'auteur',
      '',
    );
    expect(keys(groups)).toEqual(['Jane AUSTEN', 'Non spécifié', 'Nick SRNICEK et Alex WILLIAMS', 'Alex WILLIAMS']);
  });
});

describe('groupCatalogue par éditeur', () => {
  it('trie les maisons par ordre alphabétique', () => {
    const groups = groupCatalogue(
      [livre({ editeur: 'Seuil' }), livre({ editeur: 'Albin Michel' }), livre({ editeur: '' })],
      'editeur',
      '',
    );
    expect(keys(groups)).toEqual(['Albin Michel', 'Non spécifié', 'Seuil']);
  });
});

describe('groupCatalogue par date', () => {
  it('va de l’année la plus récente à la plus ancienne, sans date en dernier', () => {
    const groups = groupCatalogue(
      [livre({ date: '2001' }), livre({ date: '' }), livre({ date: 'mai 2024' }), livre({ date: '1998' })],
      'date',
      '',
    );
    expect(keys(groups)).toEqual(['2024', '2001', '1998', 'Sans date']);
  });

  it('trie les mois de décembre à janvier dans une année', () => {
    const groups = groupCatalogue(
      [
        livre({ titre: 'Hiver', date: 'janvier 2020' }),
        livre({ titre: 'Automne', date: 'octobre 2020' }),
        livre({ titre: 'Printemps', date: 'avril 2020' }),
      ],
      'date',
      '',
    );
    expect(titres(groups)).toEqual(['Automne', 'Printemps', 'Hiver']);
  });
});

describe('recherche', () => {
  const catalogue = [
    livre({ titre: 'Les Hauts de Hurlevent', auteur: 'Emily BRONTË', editeur: 'Gallimard' }),
    livre({ titre: 'Mrs Dalloway', auteur: 'Virginia WOOLF', editeur: 'Stock', info_supplementaires: 'préface' }),
  ];

  it('ignore les accents et la casse', () => {
    expect(titres(groupCatalogue(catalogue, 'genre', 'bronte'))).toEqual(['Les Hauts de Hurlevent']);
    expect(titres(groupCatalogue(catalogue, 'genre', 'HURLEVENT'))).toEqual(['Les Hauts de Hurlevent']);
  });

  it('cherche dans l’éditeur et les informations supplémentaires', () => {
    expect(titres(groupCatalogue(catalogue, 'genre', 'stock'))).toEqual(['Mrs Dalloway']);
    expect(titres(groupCatalogue(catalogue, 'genre', 'Préface'))).toEqual(['Mrs Dalloway']);
  });

  it('ne renvoie rien si rien ne correspond', () => {
    expect(groupCatalogue(catalogue, 'genre', 'introuvable')).toEqual([]);
  });

  it('écarte les livres sans titre', () => {
    expect(titres(groupCatalogue([livre({ titre: '  ' }), ...catalogue], 'genre', ''))).toHaveLength(2);
  });
});

describe('parutions récentes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('met les titres annoncés en tête, puis les quatre dernières années', () => {
    const groups = parutionsByYear([
      livre({ date: 'mars 2027' }),
      livre({ date: '2026' }),
      livre({ date: '2022' }),
      livre({ date: '2021' }),
      livre({ date: '' }),
    ]);
    expect(keys(groups)).toEqual([UPCOMING_KEY, '2026', '2022']);
  });

  it('range les titres annoncés du plus proche au plus lointain', () => {
    const groups = parutionsByYear([
      livre({ titre: 'Lointain', date: 'mai 2028' }),
      livre({ titre: 'Paru', date: 'septembre 2026' }),
      livre({ titre: 'Proche', date: 'novembre 2026' }),
      livre({ titre: 'Ensuite', date: 'février 2027' }),
    ]);
    expect(groups[0].livres.map((item) => item.titre)).toEqual(['Proche', 'Ensuite', 'Lointain']);
    expect(groups[0].anchor).toBe('a-paraitre');
    expect(keys(groups)).toEqual([UPCOMING_KEY, '2026']);
  });

  it('n’ajoute pas de groupe vide quand rien n’est annoncé', () => {
    expect(keys(parutionsByYear([livre({ date: '2025' })]))).toEqual(['2025']);
  });

  it('limite l’étagère de l’accueil', () => {
    const many = Array.from({ length: 12 }, (_, index) => livre({ titre: `T${index}`, date: '2026' }));
    expect(recentLivres(many)).toHaveLength(8);
    expect(recentLivres(many, 3)).toHaveLength(3);
  });
});

describe('uniqueValues', () => {
  it('dédoublonne, nettoie et trie', () => {
    expect(uniqueValues([' Seuil', 'Albin Michel', 'Seuil', '', 'éditions'])).toEqual([
      'Albin Michel',
      'éditions',
      'Seuil',
    ]);
  });
});
