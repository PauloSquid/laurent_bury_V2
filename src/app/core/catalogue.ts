import { compareFr, fold, isUpcoming, monthOf, surnameKey, yearOf } from './dates';
import { Livre, Tri } from './models';

export interface CatalogueGroup {
  key: string;
  anchor: string;
  livres: Livre[];
}

const GENRE_ORDER = [
  'Classiques de la littérature anglophone',
  'Biographies et études littéraires',
  'Romans contemporains',
  'Romans policiers',
  'Romans policiers, thrillers',
  'Fantasy, Romance',
  'Fantasy',
  'Histoire',
  'Monde contemporain',
  'Philosophie',
  'Economie',
  'Sociologie',
  'Développement personnel',
  'Beaux-arts, musique',
  'Divers',
];

const GENRE_CANON = new Map(GENRE_ORDER.map((genre) => [genre.toLowerCase(), genre]));

export function slugify(value: string): string {
  const slug = fold(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'groupe';
}

function canonGenre(genre: string): string {
  const trimmed = genre.trim();
  if (!trimmed) return 'Non classé';
  return GENRE_CANON.get(trimmed.toLowerCase()) ?? trimmed;
}

function compareMonthDesc(a: string, b: string): number {
  return (monthOf(b) ?? -1) - (monthOf(a) ?? -1);
}

function compareYearDesc(a: string, b: string): number {
  const yearA = yearOf(a);
  const yearB = yearOf(b);
  if (yearA === yearB) return 0;
  if (yearA === null) return 1;
  if (yearB === null) return -1;
  return yearB - yearA;
}

function compareByAuthorThenDate(a: Livre, b: Livre): number {
  const nameA = surnameKey(a.auteur);
  const nameB = surnameKey(b.auteur);
  if (nameA !== nameB) {
    if (!nameA) return 1;
    if (!nameB) return -1;
    return compareFr(nameA, nameB);
  }
  const byYear = compareYearDesc(a.date, b.date);
  if (byYear) return byYear;
  const byMonth = compareMonthDesc(a.date, b.date);
  if (byMonth) return byMonth;
  const byAuthor = compareFr(a.auteur.toLowerCase().trim(), b.auteur.toLowerCase().trim());
  if (byAuthor) return byAuthor;
  return compareFr(a.titre, b.titre);
}

function matchesQuery(livre: Livre, query: string): boolean {
  if (!query) return true;
  const haystack = fold(
    [livre.titre, livre.auteur, livre.editeur, livre.genre, livre.date, livre.info_supplementaires].join(
      ' ',
    ),
  );
  return haystack.includes(query);
}

function pushGroup(groups: Map<string, Livre[]>, key: string, livre: Livre): void {
  const list = groups.get(key);
  if (list) list.push(livre);
  else groups.set(key, [livre]);
}

export function groupCatalogue(livres: Livre[], tri: Tri, rawQuery: string): CatalogueGroup[] {
  const query = fold(rawQuery.trim());
  const visible = livres.filter((livre) => livre.titre.trim() && matchesQuery(livre, query));
  const groups = new Map<string, Livre[]>();

  if (tri === 'genre') {
    for (const livre of visible) pushGroup(groups, canonGenre(livre.genre), livre);
    return sortKeys(groups, (a, b) => {
      const rankA = GENRE_ORDER.indexOf(a);
      const rankB = GENRE_ORDER.indexOf(b);
      const orderA = rankA >= 0 ? rankA : GENRE_ORDER.length + 1;
      const orderB = rankB >= 0 ? rankB : GENRE_ORDER.length + 1;
      return orderA === orderB ? compareFr(a, b) : orderA - orderB;
    }).map(([key, items]) => toGroup(key, items.sort(compareByAuthorThenDate)));
  }

  if (tri === 'editeur') {
    for (const livre of visible) pushGroup(groups, livre.editeur.trim() || 'Non spécifié', livre);
    return sortKeys(groups, compareFr).map(([key, items]) =>
      toGroup(key, items.sort(compareByAuthorThenDate)),
    );
  }

  if (tri === 'auteur') {
    for (const livre of visible) pushGroup(groups, livre.auteur.trim() || 'Non spécifié', livre);
    return sortKeys(groups, (a, b) => {
      const nameA = a === 'Non spécifié' ? a : surnameKey(a);
      const nameB = b === 'Non spécifié' ? b : surnameKey(b);
      const byName = compareFr(nameA, nameB);
      return byName || compareFr(a, b);
    }).map(([key, items]) =>
      toGroup(
        key,
        items.sort((a, b) => {
          const byYear = compareYearDesc(a.date, b.date);
          if (byYear) return byYear;
          const byMonth = compareMonthDesc(a.date, b.date);
          if (byMonth) return byMonth;
          return compareFr(a.titre, b.titre);
        }),
      ),
    );
  }

  for (const livre of visible) {
    const year = yearOf(livre.date);
    pushGroup(groups, year ? String(year) : 'Sans date', livre);
  }
  return sortKeys(groups, (a, b) => {
    if (a === 'Sans date') return 1;
    if (b === 'Sans date') return -1;
    return Number(b) - Number(a);
  }).map(([key, items]) =>
    toGroup(
      key,
      items.sort((a, b) => {
        const byMonth = compareMonthDesc(a.date, b.date);
        if (byMonth) return byMonth;
        return compareFr(a.titre, b.titre);
      }),
    ),
  );
}

export const UPCOMING_KEY = 'À paraître';

/** Les titres annoncés d’abord (du plus proche au plus lointain), puis les quatre dernières années. */
export function parutionsByYear(livres: Livre[], today: Date = new Date()): CatalogueGroup[] {
  const minimum = today.getFullYear() - 4;
  const groups = new Map<string, Livre[]>();
  const upcoming: Livre[] = [];
  for (const livre of livres) {
    if (!livre.titre.trim()) continue;
    if (isUpcoming(livre.date, today)) {
      upcoming.push(livre);
      continue;
    }
    const year = yearOf(livre.date);
    if (year === null || year < minimum) continue;
    pushGroup(groups, String(year), livre);
  }
  const byYear = sortKeys(groups, (a, b) => Number(b) - Number(a)).map(([key, items]) =>
    toGroup(
      key,
      items.sort((a, b) => {
        const byMonth = compareMonthDesc(a.date, b.date);
        if (byMonth) return byMonth;
        return compareFr(a.titre, b.titre);
      }),
    ),
  );
  if (!upcoming.length) return byYear;
  upcoming.sort((a, b) => {
    const byYear = compareYearDesc(b.date, a.date);
    if (byYear) return byYear;
    const byMonth = compareMonthDesc(b.date, a.date);
    if (byMonth) return byMonth;
    return compareFr(a.titre, b.titre);
  });
  return [toGroup(UPCOMING_KEY, upcoming), ...byYear];
}

export function recentLivres(livres: Livre[], limit = 8, today: Date = new Date()): Livre[] {
  return parutionsByYear(livres, today)
    .flatMap((group) => group.livres)
    .slice(0, limit);
}

export function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(compareFr);
}

function sortKeys(
  groups: Map<string, Livre[]>,
  compare: (a: string, b: string) => number,
): Array<[string, Livre[]]> {
  return [...groups.entries()].sort((a, b) => compare(a[0], b[0]));
}

function toGroup(key: string, livres: Livre[]): CatalogueGroup {
  return { key, anchor: slugify(key), livres };
}
