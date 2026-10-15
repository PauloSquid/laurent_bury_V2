import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, PendingTasks, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseClient, errorText } from './firebase';
import {
  FirestoreRestDocument,
  Livre,
  livreFromRest,
  livreFromUnknown,
  newLivreId,
  toFirestoreLivre,
  withStableIds,
} from './models';

const STORAGE_KEY = 'lb-livres-v1';
/** Firestore limite un lot à 500 écritures. */
export const BATCH_SIZE = 450;

export const REMOTE_UNAVAILABLE =
  'Firestore n’est pas disponible : importez d’abord le catalogue, ou rechargez la page, avant de modifier les ouvrages.';

@Injectable({ providedIn: 'root' })
export class LivresService {
  private readonly http = inject(HttpClient);
  private readonly firebase = inject(FirebaseClient);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly items = signal<Livre[]>([]);
  private seed: Livre[] = [];

  readonly livres = this.items.asReadonly();
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly remoteWarning = signal<string | null>(null);
  readonly source = signal<'local' | 'firebase'>('local');
  readonly remoteEmpty = signal(false);
  readonly editedLocally = signal(false);
  /** Avec Firebase, on n’écrit que dans Firestore : jamais en silence dans le navigateur. */
  readonly canEdit = computed(() => !this.firebase.enabled || this.source() === 'firebase');

  constructor() {
    void inject(PendingTasks).run(() => this.init());
  }

  async add(livre: Livre): Promise<void> {
    const next = { ...livre, id: livre.id || newLivreId() };
    if (await this.persistRemote(next)) {
      this.upsert(next);
      return;
    }
    this.writeLocal([next, ...this.items().filter((item) => item.id !== next.id)]);
  }

  async update(livre: Livre): Promise<void> {
    if (await this.persistRemote(livre)) {
      this.upsert(livre);
      return;
    }
    this.writeLocal(this.items().map((item) => (item.id === livre.id ? livre : item)));
  }

  async remove(id: string): Promise<void> {
    if (this.firebase.enabled) {
      const app = await this.remoteApp();
      const { deleteDoc, doc, getFirestore } = await import('firebase/firestore');
      await deleteDoc(doc(getFirestore(app), 'livres', id));
      this.items.update((list) => list.filter((item) => item.id !== id));
      return;
    }
    this.writeLocal(this.items().filter((item) => item.id !== id));
  }

  async publishToFirebase(): Promise<void> {
    const app = await this.firebase.app();
    if (!app) throw new Error('Firebase n’est pas configuré.');
    const { doc, getFirestore, writeBatch } = await import('firebase/firestore');
    const db = getFirestore(app);
    for (const chunk of chunks(this.items(), BATCH_SIZE)) {
      const batch = writeBatch(db);
      for (const livre of chunk) batch.set(doc(db, 'livres', livre.id), toFirestoreLivre(livre));
      await batch.commit();
    }
    this.source.set('firebase');
    this.remoteEmpty.set(false);
  }

  resetLocal(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.items.set(this.seed);
    this.editedLocally.set(false);
    this.source.set('local');
  }

  private async init(): Promise<void> {
    try {
      const rows = await firstValueFrom(this.http.get<unknown[]>('/data/livres.json'));
      this.seed = withStableIds(Array.isArray(rows) ? rows : []);
      const cached = this.browser && !this.firebase.enabled ? this.readCache() : null;
      this.items.set(cached ?? this.seed);
      this.editedLocally.set(cached !== null);
    } catch (error) {
      this.error.set(errorText(error, 'Le catalogue n’a pas pu être chargé.'));
    } finally {
      this.loading.set(false);
    }

    if (this.browser && this.firebase.enabled) void this.refreshRemote();
  }

  /**
   * Lit le catalogue publié par l’API REST publique de Firestore. Le SDK Firebase n’est chargé
   * que pour écrire, dans l’admin : il laisserait sinon une base IndexedDB chez chaque visiteur.
   */
  async refreshRemote(): Promise<void> {
    try {
      const rows: Livre[] = [];
      let pageToken = '';
      do {
        const page = await firstValueFrom(
          this.http.get<{ documents?: FirestoreRestDocument[]; nextPageToken?: string }>(this.restUrl(), {
            params: pageToken ? { pageSize: 300, pageToken } : { pageSize: 300 },
          }),
        );
        rows.push(...(page.documents ?? []).map(livreFromRest));
        pageToken = page.nextPageToken ?? '';
      } while (pageToken);

      this.remoteWarning.set(null);
      this.remoteEmpty.set(rows.length === 0);
      this.source.set(rows.length ? 'firebase' : 'local');
      if (rows.length) this.items.set(rows);
    } catch {
      this.source.set('local');
      this.remoteWarning.set(
        'Firestore refuse la lecture pour le moment. Le catalogue d’origine reste affiché et les modifications sont bloquées.',
      );
    }
  }

  private restUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${this.firebase.projectId}/databases/(default)/documents/livres`;
  }

  /** Renvoie true si l’écriture est partie dans Firestore, false en mode local. */
  private async persistRemote(livre: Livre): Promise<boolean> {
    if (!this.firebase.enabled) return false;
    const app = await this.remoteApp();
    const { doc, getFirestore, setDoc } = await import('firebase/firestore');
    await setDoc(doc(getFirestore(app), 'livres', livre.id), toFirestoreLivre(livre));
    return true;
  }

  private async remoteApp(): Promise<import('firebase/app').FirebaseApp> {
    if (this.source() !== 'firebase') throw new Error(REMOTE_UNAVAILABLE);
    const app = await this.firebase.app();
    if (!app) throw new Error('Firebase n’est pas configuré.');
    return app;
  }

  private upsert(livre: Livre): void {
    this.items.update((list) => {
      const index = list.findIndex((item) => item.id === livre.id);
      if (index === -1) return [livre, ...list];
      const next = [...list];
      next[index] = livre;
      return next;
    });
  }

  private writeLocal(next: Livre[]): void {
    this.items.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.editedLocally.set(true);
    this.source.set('local');
  }

  private readCache(): Livre[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      return parsed.map((row) => {
        const storedId =
          row && typeof row === 'object' && 'id' in row && typeof row.id === 'string' ? row.id : '';
        return livreFromUnknown(storedId || newLivreId(), row);
      });
    } catch {
      return null;
    }
  }
}

export function chunks<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size));
  return out;
}
