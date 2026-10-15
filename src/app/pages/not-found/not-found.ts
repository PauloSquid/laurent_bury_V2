import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head wrap">
      <div>
        <p class="kicker">Erreur 404</p>
        <h1>Page introuvable</h1>
      </div>
      <p class="lede">Cette page n’existe pas ou a été déplacée.</p>
    </header>
    <div class="wrap prose">
      <section>
        <p>
          Vous pouvez revenir à l’<a routerLink="/">accueil</a> ou parcourir le
          <a routerLink="/traduction">catalogue des traductions</a>.
        </p>
      </section>
    </div>
  `,
})
export class NotFoundPage {}
