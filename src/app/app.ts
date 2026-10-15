import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LivresService } from './core/livres.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  readonly menuOpen = signal(false);
  readonly showTop = signal(false);
  readonly year = new Date().getFullYear();

  constructor() {
    inject(LivresService);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const onScroll = () => this.showTop.set(window.scrollY > 480);
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.menuOpen.set(false);
        this.showTop.set(false);
        let route = this.router.routerState.root;
        while (route.firstChild) route = route.firstChild;
        const hidden = event.urlAfterRedirects.startsWith('/admin') || route.snapshot.data['noindex'] === true;
        this.meta.updateTag({ name: 'robots', content: hidden ? 'noindex' : 'index, follow' });
        const description = route.snapshot.data['description'];
        if (typeof description === 'string') {
          this.meta.updateTag({ name: 'description', content: description });
        }
      });
  }

  toTop(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const far = window.scrollY > 2400;
    window.scrollTo({ top: 0, behavior: reduce || far ? 'auto' : 'smooth' });
  }
}
