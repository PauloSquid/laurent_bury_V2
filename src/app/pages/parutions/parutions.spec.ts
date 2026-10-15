import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';
import { livre } from '../../../testing/livres';
import { fakeLivresService, provideFakeLivres } from '../../../testing/livres-service';
import { ParutionsPage } from './parutions';

describe('Page Dernières parutions', () => {
  it('met en évidence le livre ouvert depuis l’accueil', async () => {
    const year = new Date().getFullYear();
    TestBed.configureTestingModule({
      providers: [
        provideFakeLivres(fakeLivresService([livre({ id: 'x', date: String(year) }), livre({ id: 'y', date: String(year) })])),
        provideRouter([{ path: 'dernieres-parutions', component: ParutionsPage }]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dernieres-parutions#livre-y', ParutionsPage);
    harness.detectChanges();
    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('#livre-x')?.classList).not.toContain('is-target');
    expect(root.querySelector('#livre-y')?.classList).toContain('is-target');
  });
});
