import { Provider } from '@angular/core';
import { FirebaseClient } from '../app/core/firebase';

/** Remplace Firebase : `enabled` simule un projet configuré, sans jamais contacter Google. */
export function fakeFirebase(enabled: boolean): Provider {
  return { provide: FirebaseClient, useValue: { enabled, projectId: 'demo-laurent-bury', app: async () => null } };
}
