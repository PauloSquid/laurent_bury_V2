import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { FirebaseClient, errorCode, errorText } from './firebase';

const SESSION_KEY = 'lb-admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseClient);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly user = signal<string | null>(null);
  readonly ready = signal(false);
  readonly mode = signal<'local' | 'firebase'>(this.firebase.enabled ? 'firebase' : 'local');

  constructor() {
    if (!this.browser) {
      this.ready.set(true);
      return;
    }
    if (this.mode() === 'local') {
      this.user.set(sessionStorage.getItem(SESSION_KEY) === '1' ? 'session locale' : null);
      this.ready.set(true);
      return;
    }
    void this.listen();
  }

  async login(email: string, password: string): Promise<void> {
    if (this.mode() === 'local') {
      if (!environment.localAdminPassword || password !== environment.localAdminPassword) {
        throw new Error('Mot de passe incorrect.');
      }
      sessionStorage.setItem(SESSION_KEY, '1');
      this.user.set('session locale');
      return;
    }

    try {
      const app = await this.firebase.app();
      if (!app) throw new Error('Firebase n’est pas configuré.');
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(getAuth(app), email.trim(), password);
    } catch (error) {
      const code = errorCode(error);
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        throw new Error('Identifiants incorrects.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives. Réessayez dans quelques minutes.');
      }
      throw new Error(errorText(error, 'Connexion impossible. Vérifiez la configuration Firebase.'));
    }
  }

  async logout(): Promise<void> {
    if (this.mode() === 'local') {
      sessionStorage.removeItem(SESSION_KEY);
      this.user.set(null);
      return;
    }
    const app = await this.firebase.app();
    if (!app) return;
    const { getAuth, signOut } = await import('firebase/auth');
    await signOut(getAuth(app));
  }

  private async listen(): Promise<void> {
    try {
      const app = await this.firebase.app();
      if (!app) {
        this.ready.set(true);
        return;
      }
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      onAuthStateChanged(getAuth(app), (user) => {
        this.user.set(user?.email ?? null);
        this.ready.set(true);
      });
    } catch {
      this.ready.set(true);
    }
  }
}
