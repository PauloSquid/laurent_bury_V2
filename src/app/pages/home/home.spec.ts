import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { livre } from '../../../testing/livres';
import { fakeLivresService, provideFakeLivres } from '../../../testing/livres-service';
import { HomePage, firstYear } from './home';

describe('firstYear', () => {
  const today = new Date(2026, 9, 15);

  it('donne l’année de la première traduction parue', () => {
    expect(firstYear([livre({ date: 'mai 2004' }), livre({ date: '1993' }), livre({ date: '' })], today)).toBe(1993);
  });

  it('ignore les titres annoncés et les livres sans titre', () => {
    expect(firstYear([livre({ date: '2027' }), livre({ titre: ' ', date: '1980' }), livre({ date: '2010' })], today)).toBe(2010);
  });

  it('renvoie null sans date exploitable', () => {
    expect(firstYear([livre({ date: '' })], today)).toBeNull();
  });
});

describe('Accueil', () => {
  let fake: ReturnType<typeof fakeLivresService>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15));
    fake = fakeLivresService([
      livre({ id: 'a', titre: 'Récent', date: 'septembre 2026', editeur: 'Seuil' }),
      livre({ id: 'b', titre: 'Ancien', date: '1993', editeur: 'Gallimard' }),
      livre({ id: 'c', titre: 'Bientôt', date: 'mars 2027', editeur: 'Seuil' }),
    ]);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideFakeLivres(fake)] });
  });
  afterEach(() => vi.useRealTimers());

  function render() {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche les chiffres du catalogue avec l’année de la première traduction', () => {
    const stats = [...render().querySelectorAll('.stat')].map(
      (stat) => `${stat.querySelector('b')?.textContent?.trim()} ${stat.querySelector('span')?.textContent?.trim()}`,
    );
    expect(stats).toEqual(['3 traductions', '2 maisons d’édition', '1993 première traduction']);
  });

  it('relie chaque couverture de l’étagère à son livre', () => {
    const liens = [...render().querySelectorAll<HTMLAnchorElement>('.shelf a.tome')].map((a) => a.getAttribute('href'));
    expect(liens).toEqual(['/dernieres-parutions#livre-c', '/dernieres-parutions#livre-a']);
  });

  it('signale le titre à paraître', () => {
    const root = render();
    expect(root.querySelectorAll('.shelf .soon')).toHaveLength(1);
    expect(root.querySelector('.shelf .soon')?.closest('a')?.textContent).toContain('Bientôt');
  });

  it('expose l’étagère comme une liste nommée', () => {
    const shelf = render().querySelector('.shelf');
    expect(shelf?.getAttribute('role')).toBe('list');
    expect(shelf?.getAttribute('aria-labelledby')).toBe('titre-etagere');
  });
});
