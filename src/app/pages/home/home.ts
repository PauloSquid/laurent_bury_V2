import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { recentLivres } from '../../core/catalogue';
import { isUpcoming, yearOf } from '../../core/dates';
import { LivresService } from '../../core/livres.service';
import { Livre } from '../../core/models';
import { Cover } from '../../shared/cover';
import { UpcomingPipe } from '../../shared/upcoming.pipe';

/** Année de la première traduction parue (les titres annoncés ne comptent pas). */
export function firstYear(livres: Livre[], today: Date = new Date()): number | null {
  const years = livres
    .filter((livre) => livre.titre.trim() && !isUpcoming(livre.date, today))
    .map((livre) => yearOf(livre.date))
    .filter((year): year is number => year !== null);
  return years.length ? Math.min(...years) : null;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, Cover, UpcomingPipe],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly livresService = inject(LivresService);
  private readonly shelfEl = viewChild<ElementRef<HTMLElement>>('shelfList');
  readonly loading = this.livresService.loading;
  readonly shelf = computed(() => recentLivres(this.livresService.livres()));
  readonly atStart = signal(true);
  readonly atEnd = signal(false);
  readonly stats = computed(() => {
    const livres = this.livresService.livres().filter((livre) => livre.titre.trim());
    return {
      livres: livres.length,
      editeurs: new Set(livres.map((livre) => livre.editeur).filter(Boolean)).size,
      depuis: firstYear(livres),
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.shelfEl()?.nativeElement;
      if (!element) return;
      this.updateEdges();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.updateEdges());
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Les fondus et les flèches suivent ce qu’il reste à faire défiler de chaque côté. */
  updateEdges(): void {
    const element = this.shelfEl()?.nativeElement;
    if (!element) return;
    this.atStart.set(element.scrollLeft <= 4);
    this.atEnd.set(element.scrollLeft + element.clientWidth >= element.scrollWidth - 4);
  }

  scrollShelf(direction: 1 | -1): void {
    const element = this.shelfEl()?.nativeElement;
    if (!element) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }
}
