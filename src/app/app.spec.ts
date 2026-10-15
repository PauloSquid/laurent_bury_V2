import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeLivresService, provideFakeLivres } from '../testing/livres-service';
import { App } from './app';
import { routes } from './app.routes';
import { PRERENDERED_PATHS } from './app.routes.server';

async function boot(url: string) {
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Routes', () => {
  it('conserve les adresses de l’ancien site', () => {
    const paths = routes.map((route) => route.path);
    for (const legacy of ['traduction', 'dernieres-parutions', 'travaux-presse', 'cv-contact']) {
      expect(paths).toContain(legacy);
    }
  });

  it('donne un titre et une description à chaque page', () => {
    for (const route of routes) {
      expect(route.title, route.path).toBeTruthy();
      expect(route.data?.['description'], route.path).toBeTruthy();
    }
  });

  it('pré-rend toutes les pages publiques, et elles seules', () => {
    const publiques = routes.map((route) => route.path!).filter((path) => path !== 'admin' && path !== '**');
    expect([...PRERENDERED_PATHS].sort()).toEqual(publiques.sort());
  });
});

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideFakeLivres(fakeLivresService())] });
  });

  it('affiche les liens légaux dans le pied de page', async () => {
    const root = await boot('/');
    const liens = [...root.querySelectorAll('.footer-legal a')].map((a) => a.getAttribute('href'));
    expect(liens).toEqual(['/mentions-legales', '/confidentialite']);
  });

  it('met à jour le titre, la description et l’indexation', async () => {
    const meta = TestBed.inject(Meta);
    await boot('/cv-contact');
    expect(TestBed.inject(Title).getTitle()).toBe('CV / Contact | Laurent Bury');
    expect(meta.getTag('name="description"')?.content).toContain('contacter Laurent Bury');
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
  });

  it('affiche une page introuvable non indexée pour une adresse inconnue', async () => {
    const root = await boot('/page-qui-n-existe-pas');
    expect(root.querySelector('h1')?.textContent).toContain('Page introuvable');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex');
  });

  it('n’indexe pas l’administration', async () => {
    await boot('/admin');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex');
  });

  it('ouvre et referme le menu', async () => {
    const root = await boot('/');
    const button = root.querySelector<HTMLButtonElement>('.menu-btn')!;
    button.click();
    TestBed.tick();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#navigation')?.classList).toContain('is-open');
  });
});
