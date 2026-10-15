import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { livre } from '../../testing/livres';
import { COVER_TONES, Cover, coverTone } from './cover';

function render(image_url: string, extra: Partial<ReturnType<typeof livre>> = {}) {
  const fixture = TestBed.createComponent(Cover);
  fixture.componentRef.setInput('livre', livre({ titre: 'Emma', auteur: 'Jane AUSTEN', image_url, ...extra }));
  fixture.detectChanges();
  return fixture;
}

const breakImage = (fixture: ReturnType<typeof render>) => {
  fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
  fixture.detectChanges();
};

describe('Cover', () => {
  it('affiche l’image sans transmettre la page d’origine', () => {
    const img = render('https://exemple.fr/emma.jpg').nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://exemple.fr/emma.jpg');
    expect(img.alt).toBe('Couverture de Emma');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('remplace une image cassée par une couverture composée', () => {
    const fixture = render('https://exemple.fr/cassee.jpg');
    breakImage(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.cover-type-title')?.textContent?.trim()).toBe('Emma');
    expect(root.querySelector('.cover-type-author')?.textContent?.trim()).toBe('Jane AUSTEN');
  });

  it('cache la couverture composée aux lecteurs d’écran, le titre étant déjà à côté', () => {
    const fixture = render('');
    expect(fixture.nativeElement.querySelector('.cover-type').getAttribute('aria-hidden')).toBe('true');
  });

  it('omet la ligne d’auteur quand il est inconnu', () => {
    expect(render('', { auteur: '' }).nativeElement.querySelector('.cover-type-author')).toBeNull();
  });

  it('teinte la couverture selon le genre', () => {
    const fixture = render('', { genre: 'Histoire' });
    const style = (fixture.nativeElement.querySelector('.cover-type') as HTMLElement).style;
    expect(style.getPropertyValue('--cover-tone')).toBe(coverTone('Histoire'));
  });

  it('réessaie quand l’adresse change', () => {
    const fixture = render('https://exemple.fr/cassee.jpg');
    breakImage(fixture);
    fixture.componentRef.setInput('livre', livre({ titre: 'Emma', image_url: 'https://exemple.fr/bonne.jpg' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
  });
});

describe('coverTone', () => {
  it('donne toujours la même teinte au même genre, casse et accents compris', () => {
    expect(coverTone('Économie')).toBe(coverTone('economie '));
  });

  it('pioche dans la palette, même sans genre', () => {
    for (const genre of ['', 'Histoire', 'Fantasy', 'Romans policiers, thrillers']) {
      expect(COVER_TONES).toContain(coverTone(genre));
    }
  });
});
