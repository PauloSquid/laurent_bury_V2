import { Injectable } from '@angular/core';
import { environment, isFirebaseConfigured } from '../../environments/environment';

export async function firebaseApp(): Promise<import('firebase/app').FirebaseApp | null> {
  if (!isFirebaseConfigured()) return null;
  const { getApp, getApps, initializeApp } = await import('firebase/app');
  if (getApps().length) return getApp();
  return initializeApp(environment.firebase);
}

/** Point d’accès unique à Firebase, remplaçable dans les tests. */
@Injectable({ providedIn: 'root' })
export class FirebaseClient {
  readonly enabled = isFirebaseConfigured();
  readonly projectId = environment.firebase.projectId;

  app(): Promise<import('firebase/app').FirebaseApp | null> {
    return firebaseApp();
  }
}

export function errorCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return '';
}

export function errorText(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
