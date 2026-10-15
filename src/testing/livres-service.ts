import { Provider, computed, signal } from '@angular/core';
import { LivresService } from '../app/core/livres.service';
import { Livre } from '../app/core/models';

/** Double de LivresService dont on pilote l’état depuis le test. */
export function fakeLivresService(livres: Livre[] = []) {
  const state = {
    livres: signal(livres),
    loading: signal(false),
    error: signal<string | null>(null),
    remoteWarning: signal<string | null>(null),
    source: signal<'local' | 'firebase'>('firebase'),
    remoteEmpty: signal(false),
    editedLocally: signal(false),
    editable: signal(true),
    canEdit: computed((): boolean => false),
  };
  state.canEdit = computed(() => state.editable());
  return state;
}

export function provideFakeLivres(fake: ReturnType<typeof fakeLivresService>): Provider {
  return { provide: LivresService, useValue: fake };
}
