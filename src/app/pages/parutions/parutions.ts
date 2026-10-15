import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { UPCOMING_KEY, parutionsByYear } from '../../core/catalogue';
import { LivresService } from '../../core/livres.service';
import { Cover } from '../../shared/cover';

@Component({
  selector: 'app-parutions',
  imports: [Cover],
  templateUrl: './parutions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParutionsPage {
  private readonly livresService = inject(LivresService);
  readonly loading = this.livresService.loading;
  readonly error = this.livresService.error;
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  /** Livre ouvert depuis l’étagère de l’accueil (#livre-<id>), mis en évidence. */
  readonly target = computed(() => this.fragment()?.replace(/^livre-/, '') ?? null);
  readonly upcomingKey = UPCOMING_KEY;
  readonly years = computed(() => parutionsByYear(this.livresService.livres()));

  constructor() {
    // La page est chargée à la demande : on rejoint le livre une fois la grille affichée.
    afterNextRender(() => {
      const fragment = this.fragment();
      if (fragment) document.getElementById(fragment)?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
  }
}
