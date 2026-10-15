// Récupère le catalogue publié dans Firestore et l’écrit dans public/data/livres.json,
// pour que les pages pré-rendues reflètent les modifications faites dans l’admin.
// La lecture est publique (voir firestore.rules) : aucune clé n’est nécessaire.
// En cas d’échec ou de base vide, le fichier existant est conservé.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PROJECT = 'laurentburytraducteur';
const FIELDS = ['auteur', 'titre', 'date', 'editeur', 'genre', 'info_supplementaires', 'image_url'];
const TARGET = 'public/data/livres.json';
const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/livres`;

export function fromDocument(document) {
  const fields = document.fields ?? {};
  const row = { id: document.name.split('/').pop() };
  for (const field of FIELDS) row[field] = fields[field]?.stringValue ?? '';
  return row;
}

async function fetchAll() {
  const rows = [];
  let pageToken = '';
  do {
    const url = `${base}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Firestore a répondu ${response.status}`);
    const body = await response.json();
    for (const document of body.documents ?? []) rows.push(fromDocument(document));
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const rows = await fetchAll();
    if (!rows.length) {
      console.log('sync-livres : Firestore est vide, le catalogue du dépôt est conservé.');
    } else {
      const before = JSON.parse(readFileSync(TARGET, 'utf8')).length;
      writeFileSync(TARGET, `${JSON.stringify(rows, null, 2)}\n`);
      console.log(`sync-livres : ${rows.length} ouvrages récupérés (${before} dans le dépôt).`);
    }
  } catch (error) {
    console.warn(`sync-livres : ${error.message}. Le catalogue du dépôt est conservé.`);
  }
}
