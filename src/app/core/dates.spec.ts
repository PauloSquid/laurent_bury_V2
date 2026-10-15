import { describe, expect, it } from 'vitest';
import { compareFr, fold, isUpcoming, lastName, monthOf, surnameInitial, surnameKey, yearOf } from './dates';

describe('fold', () => {
  it('retire accents et majuscules', () => {
    expect(fold('Éléonore À Noël')).toBe('eleonore a noel');
  });
});

describe('yearOf', () => {
  it.each([
    ['mars 2026', 2026],
    ['2007', 2007],
    ['septembre 1997', 1997],
    ['à paraître en 2027', 2027],
  ])('lit l’année dans « %s »', (date, year) => {
    expect(yearOf(date)).toBe(year);
  });

  it.each(['', 'à paraître', '1850', '12345'])('renvoie null pour « %s »', (date) => {
    expect(yearOf(date)).toBeNull();
  });
});

describe('monthOf', () => {
  it.each([
    ['janvier 2021', 1],
    ['février 2026', 2],
    ['fevrier 2026', 2],
    ['mars 2005', 3],
    ['avril 2016', 4],
    ['mai 2004', 5],
    ['juin 2025', 6],
    ['juillet 2009', 7],
    ['août 2009', 8],
    ['aout 2009', 8],
    ['septembre 2014', 9],
    ['octobre 2021', 10],
    ['novembre 2018', 11],
    ['décembre 2019', 12],
    ['Décembre 2019', 12],
    ['03/2020', 3],
    ['12-2020', 12],
  ])('lit le mois dans « %s »', (date, month) => {
    expect(monthOf(date)).toBe(month);
  });

  it.each(['', '2007', 'à paraître'])('renvoie null pour « %s »', (date) => {
    expect(monthOf(date)).toBeNull();
  });
});

describe('surnameKey', () => {
  it.each([
    ['Charles DICKENS', 'dickens'],
    ['Sinclair McKAY', 'mckay'],
    ['Louise van SWAAJ', 'swaaj'],
    ['David WILLS...', 'wills'],
    ['Nick SRNICEK et Alex WILLIAMS', 'srnicek'],
    ['Jane AUSTEN et Seth GRAHAME-SMITH', 'austen'],
    ['Ph. PORTIER, A. LANCIEN et A.-L. ZWILLING (dir.)', 'portier'],
    ['Anne CASE and Angus DEATON', 'case'],
    ['  ', ''],
  ])('« %s » se classe à « %s »', (auteur, key) => {
    expect(surnameKey(auteur)).toBe(key);
  });
});

describe('surnameInitial', () => {
  it('donne l’initiale sans accent', () => {
    expect(surnameInitial('Émile ZOLA')).toBe('Z');
    expect(surnameInitial('Jean ÉCHENOZ')).toBe('E');
  });

  it('range les noms sans lettre sous #', () => {
    expect(surnameInitial('')).toBe('#');
    expect(surnameInitial('1984')).toBe('#');
  });
});

describe('lastName', () => {
  it('prend le dernier mot en minuscules', () => {
    expect(lastName(' Virginia  WOOLF ')).toBe('woolf');
  });
});

describe('compareFr', () => {
  it('ignore la casse et les accents', () => {
    expect(compareFr('éditeur', 'Editeur')).toBe(0);
    expect(compareFr('Zola', 'émile')).toBeGreaterThan(0);
  });
});

describe('isUpcoming', () => {
  const today = new Date(2026, 9, 15); // 15 octobre 2026

  it.each(['mars 2027', '2027', 'novembre 2026', 'décembre 2026', '12/2026'])('« %s » est à paraître', (date) => {
    expect(isUpcoming(date, today)).toBe(true);
  });

  it.each(['octobre 2026', 'septembre 2026', '2026', 'mars 2025', '', 'à paraître'])(
    '« %s » n’est pas à paraître',
    (date) => {
      expect(isUpcoming(date, today)).toBe(false);
    },
  );
});
