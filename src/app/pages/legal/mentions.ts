import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BASE_DONNEES, EDITEUR, HEBERGEUR, LEGAL_UPDATED } from '../../core/site';

@Component({
  selector: 'app-mentions',
  imports: [RouterLink],
  templateUrl: './mentions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsPage {
  readonly editeur = EDITEUR;
  readonly hebergeur = HEBERGEUR;
  readonly baseDonnees = BASE_DONNEES;
  readonly updated = LEGAL_UPDATED;
}
