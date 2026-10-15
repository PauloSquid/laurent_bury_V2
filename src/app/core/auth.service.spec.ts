import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { fakeFirebase } from '../../testing/firebase';
import { AuthService } from './auth.service';

describe('AuthService en mode local', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [fakeFirebase(false)] });
  });

  it('démarre déconnecté', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.mode()).toBe('local');
    expect(auth.ready()).toBe(true);
    expect(auth.user()).toBeNull();
  });

  it('refuse un mauvais mot de passe', async () => {
    const auth = TestBed.inject(AuthService);
    await expect(auth.login('', 'mauvais')).rejects.toThrow('Mot de passe incorrect.');
    expect(auth.user()).toBeNull();
  });

  it('connecte puis déconnecte avec le bon mot de passe', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('', environment.localAdminPassword);
    expect(auth.user()).not.toBeNull();
    expect(sessionStorage.getItem('lb-admin')).toBe('1');
    await auth.logout();
    expect(auth.user()).toBeNull();
    expect(sessionStorage.getItem('lb-admin')).toBeNull();
  });

  it('retrouve la session dans le même onglet', () => {
    sessionStorage.setItem('lb-admin', '1');
    expect(TestBed.inject(AuthService).user()).not.toBeNull();
  });
});

describe('AuthService avec Firebase', () => {
  it('passe en mode Firebase et signale une configuration absente', async () => {
    TestBed.configureTestingModule({ providers: [fakeFirebase(true)] });
    const auth = TestBed.inject(AuthService);
    expect(auth.mode()).toBe('firebase');
    await expect(auth.login('a@b.fr', 'x')).rejects.toThrow('Firebase n’est pas configuré.');
  });
});
