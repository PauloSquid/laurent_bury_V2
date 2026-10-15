import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EDITEUR, LEGAL_UPDATED } from '../../core/site';

@Component({
  selector: 'app-confidentialite',
  imports: [RouterLink],
  templateUrl: './confidentialite.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidentialitePage {
  readonly editeur = EDITEUR;
  readonly updated = LEGAL_UPDATED;
}
