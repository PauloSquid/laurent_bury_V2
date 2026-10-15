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

@Component({
  selector: 'app-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cover">
      @if (showImage()) {
        <img
          #img
          [src]="src()"
          [alt]="alt()"
          loading="lazy"
          referrerpolicy="no-referrer"
          (error)="markFailed()"
        />
      } @else {
        <span class="cover-fallback" aria-hidden="true"></span>
      }
    </div>
  `,
})
export class Cover {
  readonly src = input('');
  readonly alt = input('Couverture');
  private readonly img = viewChild<ElementRef<HTMLImageElement>>('img');
  private readonly failedSrc = signal<string | null>(null);
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
