import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { BASE_DONNEES, EDITEUR, HEBERGEUR } from '../../core/site';
import { ConfidentialitePage } from './confidentialite';
import { MentionsPage } from './mentions';

function text(component: typeof MentionsPage | typeof ConfidentialitePage): string {
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
}

describe('Pages légales', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('les mentions légales identifient l’éditeur, le directeur de publication et l’hébergeur', () => {
    const page = text(MentionsPage);
    expect(page).toContain(EDITEUR.nom);
    expect(page).toContain(EDITEUR.adresse[0]);
    expect(page).toContain(EDITEUR.email);
    expect(page).toContain(EDITEUR.telephone);
    expect(page).toContain('Directeur de la publication');
    expect(page).toContain(HEBERGEUR.nom);
    expect(page).toContain(HEBERGEUR.adresse[0]);
    expect(page).toContain(HEBERGEUR.telephone);
    expect(page).toContain(BASE_DONNEES.nom);
    expect(page).toContain('Propriété intellectuelle');
  });

  it('la politique de confidentialité couvre les points du RGPD', () => {
    const page = text(ConfidentialitePage);
    for (const point of ['Responsable du traitement', 'Vercel', 'Base légale', 'Cookies', 'Vos droits', 'CNIL', 'États-Unis']) {
      expect(page).toContain(point);
    }
    expect(page).toContain(EDITEUR.email);
  });
});
