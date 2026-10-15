import { Livre } from '../app/core/models';

let counter = 0;

/** Fabrique un livre de test ; seuls les champs utiles au test sont à préciser. */
export function livre(partial: Partial<Livre> = {}): Livre {
  counter += 1;
  return {
    id: `test-${counter}`,
    auteur: 'Charles DICKENS',
    titre: `Titre ${counter}`,
    date: 'mars 2020',
    editeur: 'Gallimard',
    genre: 'Classiques de la littérature anglophone',
    info_supplementaires: '',
    image_url: '',
    ...partial,
  };
}
