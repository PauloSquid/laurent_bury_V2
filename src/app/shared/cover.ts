import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { fold } from '../core/dates';
import { Livre } from '../core/models';

/** Teintes des couvertures de remplacement, assez sombres pour un texte crème lisible. */
export const COVER_TONES = [
  '#1c2822',
  '#69281f',
  '#2b3a4e',
  '#4a3346',
  '#5b4a2e',
  '#3c4b52',
  '#5a2a2a',
  '#33463a',
] as const;

/** Même genre, même teinte : la liste garde un rythme même quand les images manquent. */
export function coverTone(genre: string): string {
  const key = fold(genre.trim());
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  return COVER_TONES[hash % COVER_TONES.length];
}

@Component({
  selector: 'app-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cover">
      @if (showImage()) {
        <img
          #img
          [src]="src()"
          [alt]="'Couverture de ' + livre().titre"
          loading="lazy"
          referrerpolicy="no-referrer"
          (error)="markFailed()"
        />
      } @else {
        <div class="cover-type" [style.--cover-tone]="tone()" aria-hidden="true">
          @if (livre().auteur) {
            <span class="cover-type-author">{{ livre().auteur }}</span>
          }
          <span class="cover-type-title">{{ livre().titre }}</span>
        </div>
      }
    </div>
  `,
})
export class Cover {
  readonly livre = input.required<Pick<Livre, 'titre' | 'auteur' | 'genre' | 'image_url'>>();
  private readonly img = viewChild<ElementRef<HTMLImageElement>>('img');
  private readonly failedSrc = signal<string | null>(null);
  readonly src = computed(() => this.livre().image_url);
  readonly tone = computed(() => coverTone(this.livre().genre));
  readonly showImage = computed(() => {
    const src = this.src();
    return Boolean(src) && this.failedSrc() !== src;
  });

  constructor() {
    // Sur une page pré-rendue, l’image peut échouer avant que l’application ne démarre.
    afterNextRender(() => {
      const element = this.img()?.nativeElement;
      if (element?.complete && element.naturalWidth === 0) this.markFailed();
    });
  }

  markFailed(): void {
    this.failedSrc.set(this.src());
  }
}
