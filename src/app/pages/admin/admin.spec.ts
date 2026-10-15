import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { livre } from '../../../testing/livres';
import { fakeLivresService, provideFakeLivres } from '../../../testing/livres-service';
import { AuthService } from '../../core/auth.service';
import { AdminPage } from './admin';

let livres: ReturnType<typeof fakeLivresService>;
let user: ReturnType<typeof signal<string | null>>;

function render() {
  const fixture = TestBed.createComponent(AdminPage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const button = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.trim() === label);

describe('Administration', () => {
  beforeEach(() => {
    livres = fakeLivresService([livre({ titre: 'Emma' }), livre({ titre: 'Persuasion' })]);
    user = signal<string | null>('admin@exemple.fr');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideFakeLivres(livres),
        {
          provide: AuthService,
          useValue: { user, ready: signal(true), mode: signal('firebase'), login: async () => {}, logout: async () => {} },
        },
      ],
    });
  });

  it('demande une connexion par e-mail', () => {
    user.set(null);
    const root = render();
    expect(root.querySelector('input[type="email"]')).not.toBeNull();
    expect(root.querySelector('table')).toBeNull();
  });

  it('liste les livres une fois connecté', () => {
    const root = render();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(button(root, 'Ajouter un livre')?.disabled).toBe(false);
  });

  it('bloque les modifications quand Firestore n’est pas joignable', () => {
    livres.editable.set(false);
    const root = render();
    expect(button(root, 'Ajouter un livre')?.disabled).toBe(true);
    expect(button(root, 'Modifier')?.disabled).toBe(true);
    expect(button(root, 'Supprimer')?.disabled).toBe(true);
    expect(root.textContent).toContain('Connexion à Firestore');
  });

  it('propose l’import quand Firestore est vide', () => {
    livres.editable.set(false);
    livres.remoteEmpty.set(true);
    const root = render();
    expect(button(root, 'Importer les 2 ouvrages')).toBeTruthy();
  });

  it('affiche l’avertissement de lecture refusée', () => {
    livres.editable.set(false);
    livres.remoteWarning.set('Firestore refuse la lecture pour le moment.');
    const root = render();
    expect(root.textContent).toContain('Firestore refuse la lecture');
    expect(root.textContent).not.toContain('Connexion à Firestore');
  });

  it('filtre la liste', () => {
    const root = render();
    const input = root.querySelector<HTMLInputElement>('#filtre-admin')!;
    input.value = 'persu';
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});
