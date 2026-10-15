import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { livre } from '../../../testing/livres';
import { fakeLivresService, provideFakeLivres } from '../../../testing/livres-service';
import { CataloguePage } from './catalogue';

const LIVRES = [
  livre({ titre: 'Emma', auteur: 'Jane AUSTEN', genre: 'Classiques de la littérature anglophone', date: '2001' }),
  livre({ titre: 'Le Capital au XXIe siècle', auteur: 'Thomas PIKETTY', genre: 'Economie', date: '2013' }),
  livre({ titre: 'Mrs Dalloway', auteur: 'Virginia WOOLF', genre: 'Classiques de la littérature anglophone', date: '2013' }),
];

let fake: ReturnType<typeof fakeLivresService>;

async function open(url = '/traduction') {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, CataloguePage);
  harness.detectChanges();
  return harness.routeNativeElement as HTMLElement;
}

const headings = (root: HTMLElement) =>
  [...root.querySelectorAll('h2')].map((h) => h.firstChild?.textContent?.trim());
const count = (root: HTMLElement) => root.querySelector('.count')?.textContent?.replace(/\s+/g, ' ').trim();

describe('Page Traductions', () => {
  beforeEach(() => {
    fake = fakeLivresService(LIVRES);
    TestBed.configureTestingModule({
      providers: [provideFakeLivres(fake), provideRouter([{ path: 'traduction', component: CataloguePage }])],
    });
  });

  it('classe par genre par défaut', async () => {
    const root = await open();
    expect(headings(root)).toEqual(['Classiques de la littérature anglophone', 'Economie']);
    expect(count(root)).toBe('3 livres');
    expect(root.querySelector('[aria-pressed="true"]')?.textContent?.trim()).toBe('Par genre');
  });

  it('lit le classement dans l’adresse', async () => {
    const root = await open('/traduction?tri=date');
    expect(headings(root)).toEqual(['2013', '2001']);
  });

  it('revient au genre pour un classement inconnu', async () => {
    const root = await open('/traduction?tri=nimporte');
    expect(headings(root)[0]).toBe('Classiques de la littérature anglophone');
  });

  it('filtre pendant la saisie', async () => {
    const root = await open();
    const input = root.querySelector<HTMLInputElement>('#recherche')!;
    input.value = 'woolf';
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
    expect(count(root)).toContain('1 livre');
    expect(root.textContent).toContain('Mrs Dalloway');
    expect(root.textContent).not.toContain('Emma');
  });

  it('filtre par initiale en classement par auteur', async () => {
    const root = await open('/traduction?tri=auteur');
    const initiale = [...root.querySelectorAll<HTMLButtonElement>('.index button')].find(
      (button) => button.textContent?.trim() === 'P',
    )!;
    initiale.click();
    TestBed.tick();
    expect(headings(root)).toEqual(['Thomas PIKETTY']);
  });

  it('affiche le chargement puis les erreurs', async () => {
    fake.loading.set(true);
    fake.error.set('Le catalogue n’a pas pu être chargé.');
    const root = await open();
    expect(root.textContent).toContain('Chargement du catalogue');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('pas pu être chargé');
  });
});
