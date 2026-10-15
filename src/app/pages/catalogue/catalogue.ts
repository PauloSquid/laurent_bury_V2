import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { groupCatalogue } from '../../core/catalogue';
import { surnameInitial } from '../../core/dates';
import { LivresService } from '../../core/livres.service';
import { isTri, Tri } from '../../core/models';
import { Cover } from '../../shared/cover';
import { UpcomingPipe } from '../../shared/upcoming.pipe';

@Component({
  selector: 'app-catalogue',
  imports: [Cover, UpcomingPipe],
  templateUrl: './catalogue.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CataloguePage {
  private readonly livresService = inject(LivresService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = this.livresService.loading;
  readonly error = this.livresService.error;
  readonly query = signal('');
  readonly tri = signal<Tri>('genre');
  readonly selection = signal('');
  readonly tris: ReadonlyArray<{ id: Tri; label: string }> = [
    { id: 'genre', label: 'Par genre' },
    { id: 'auteur', label: 'Par auteur' },
    { id: 'editeur', label: 'Par éditeur' },
    { id: 'date', label: 'Par date' },
  ];

  readonly grouped = computed(() => groupCatalogue(this.livresService.livres(), this.tri(), this.query()));
  readonly chips = computed(() => {
    const groups = this.grouped();
    if (this.tri() === 'auteur') {
      return [...new Set(groups.map((group) => surnameInitial(group.key)))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      );
    }
    if (this.tri() === 'date') return groups.map((group) => group.key);
    return [];
  });
  readonly groups = computed(() => {
    const selection = this.selection();
    const groups = this.grouped();
    if (!selection) return groups;
    if (this.tri() === 'auteur') return groups.filter((group) => surnameInitial(group.key) === selection);
    if (this.tri() === 'date') return groups.filter((group) => group.key === selection);
    return groups;
  });
  readonly total = computed(() => this.groups().reduce((sum, group) => sum + group.livres.length, 0));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const tri = params.get('tri');
      this.tri.set(isTri(tri) ? tri : 'genre');
    });
    effect(() => {
      this.tri();
      untracked(() => this.selection.set(''));
    });
  }

  setTri(tri: Tri): void {
    void this.router.navigate(['/traduction'], { queryParams: { tri } });
  }

  scrollTo(anchor: string): void {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  jump(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
