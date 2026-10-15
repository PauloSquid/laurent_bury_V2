import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Cover } from './cover';

function render(src: string) {
  const fixture = TestBed.createComponent(Cover);
  fixture.componentRef.setInput('src', src);
  fixture.componentRef.setInput('alt', 'Couverture de Emma');
  fixture.detectChanges();
  return fixture;
}

describe('Cover', () => {
  it('affiche l’image sans transmettre la page d’origine', () => {
    const img = render('https://exemple.fr/emma.jpg').nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://exemple.fr/emma.jpg');
    expect(img.alt).toBe('Couverture de Emma');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('remplace une image cassée par un aplat', () => {
    const fixture = render('https://exemple.fr/cassee.jpg');
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.cover-fallback')).not.toBeNull();
  });

  it('réessaie quand l’adresse change', () => {
    const fixture = render('https://exemple.fr/cassee.jpg');
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.componentRef.setInput('src', 'https://exemple.fr/bonne.jpg');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
  });

  it('affiche l’aplat sans adresse', () => {
    expect(render('').nativeElement.querySelector('img')).toBeNull();
  });
});
