export interface Livre {
  id: string;
  auteur: string;
  titre: string;
  date: string;
  editeur: string;
  genre: string;
  info_supplementaires: string;
  image_url: string;
}

export type Tri = 'genre' | 'auteur' | 'editeur' | 'date';

export function isTri(value: string | null): value is Tri {
  return value === 'genre' || value === 'auteur' || value === 'editeur' || value === 'date';
}

export function newLivreId(): string {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(10)), (byte) => (byte % 36).toString(36));
  return `lv${Date.now().toString(36)}${random.join('')}`;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function livreFromUnknown(id: string, value: unknown): Livre {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id,
    auteur: asString(row['auteur']),
    titre: asString(row['titre']),
    date: asString(row['date']),
    editeur: asString(row['editeur']),
    genre: asString(row['genre']),
    info_supplementaires: asString(row['info_supplementaires']),
    image_url: asString(row['image_url']),
  };
}

function hashId(livre: Omit<Livre, 'id'>): string {
  const source = [livre.titre, livre.auteur, livre.date, livre.editeur].join('|').toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `lv${(hash >>> 0).toString(36)}`;
}

export function withStableIds(rows: unknown[]): Livre[] {
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const draft = livreFromUnknown('', row);
    // Un export de Firestore garde l’identifiant du document ; sinon on le déduit du contenu.
    const stored = asString((row as Record<string, unknown> | null)?.['id']);
    let id = stored || hashId(draft);
    if (seen.has(id)) id = `${id}-${index}`;
    seen.add(id);
    return { ...draft, id };
  });
}

export function toFirestoreLivre(livre: Livre): Record<string, string> {
  return {
    auteur: livre.auteur,
    titre: livre.titre,
    date: livre.date,
    editeur: livre.editeur,
    genre: livre.genre,
    info_supplementaires: livre.info_supplementaires,
    image_url: livre.image_url,
  };
}

/** Document tel que le renvoie l’API REST de Firestore. */
export interface FirestoreRestDocument {
  name: string;
  fields?: Record<string, { stringValue?: string } | undefined>;
}

export function livreFromRest(document: FirestoreRestDocument): Livre {
  const fields = document.fields ?? {};
  const row: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) row[key] = value?.stringValue ?? '';
  return livreFromUnknown(document.name.split('/').pop() ?? '', row);
}
