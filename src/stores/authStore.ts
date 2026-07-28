import { create } from 'zustand';
import { db, seedDefaultsIfEmpty } from '@/db/database';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { uid } from '@/lib/utils';
import type { AuthCredentials, UserProfile } from '@/types';

/** Persist across reloads/updates (not wiped by service-worker cache swaps). */
const SESSION_KEY = 'g4_session';

interface SessionPayload {
  username: string;
  authenticatedAt: string;
}

export interface LocalAccountHint {
  username: string;
  displayName: string;
}

export type LoginResult = 'ok' | 'unknown_user' | 'bad_password';

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  isSetupComplete: boolean;
  username: string | null;
  displayName: string | null;
  initialize: () => Promise<void>;
  /** Re-check IndexedDB for an existing account (after updates / recovery). */
  refreshSetupState: () => Promise<boolean>;
  /** Username / display name stored on this device (no password needed). */
  getLocalAccount: () => Promise<LocalAccountHint | null>;
  setup: (
    username: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  login: (username: string, password: string) => Promise<LoginResult>;
  /**
   * Device-local password reset. Safe because all data lives only on this phone —
   * owning the device is the recovery factor.
   */
  resetPasswordOnDevice: (newPassword: string) => Promise<void>;
  logout: () => void;
}

function readSession(): SessionPayload | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

function writeSession(username: string): void {
  const payload: SessionPayload = {
    username,
    authenticatedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(payload);
  localStorage.setItem(SESSION_KEY, json);
  sessionStorage.removeItem(SESSION_KEY);
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

async function findCredentialsByUsername(
  username: string,
): Promise<AuthCredentials | undefined> {
  const trimmed = username.trim();
  if (!trimmed) return undefined;

  const exact = await db.credentials.where('username').equals(trimmed).first();
  if (exact) return exact;

  // Case-insensitive fallback (phones / autocorrect).
  const all = await db.credentials.toArray();
  const lower = trimmed.toLowerCase();
  return all.find((c) => c.username.toLowerCase() === lower);
}

async function countAccounts(): Promise<number> {
  try {
    await db.open();
    return await db.credentials.count();
  } catch {
    return 0;
  }
}

let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isInitialized: false,
  isSetupComplete: false,
  username: null,
  displayName: null,

  initialize: async () => {
    if (get().isInitialized) return;
    if (initializePromise) {
      await initializePromise;
      return;
    }

    initializePromise = (async () => {
      try {
        await db.open();
        await seedDefaultsIfEmpty();

        const setupComplete = (await db.credentials.count()) > 0;
        const session = readSession();

        if (setupComplete && session?.username) {
          const credentials = await findCredentialsByUsername(session.username);
          const profile = credentials
            ? await db.profiles
                .where('username')
                .equals(credentials.username)
                .first()
            : undefined;

          if (credentials && profile) {
            set({
              isAuthenticated: true,
              isInitialized: true,
              isSetupComplete: true,
              username: credentials.username,
              displayName: profile.displayName,
            });
            return;
          }
          clearSession();
        }

        set({
          isAuthenticated: false,
          isInitialized: true,
          isSetupComplete: setupComplete,
          username: null,
          displayName: null,
        });
      } catch (err) {
        console.error('[G4] Auth/DB init failed', err);
        // If the DB still has credentials, prefer Login over Setup.
        const setupComplete = (await countAccounts()) > 0;
        set({
          isAuthenticated: false,
          isInitialized: true,
          isSetupComplete: setupComplete,
          username: null,
          displayName: null,
        });
      }
    })();

    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },

  refreshSetupState: async () => {
    const setupComplete = (await countAccounts()) > 0;
    set({ isSetupComplete: setupComplete });
    return setupComplete;
  },

  getLocalAccount: async () => {
    await db.open();
    const credentials = await db.credentials.toCollection().first();
    if (!credentials) return null;
    const profile = await db.profiles
      .where('username')
      .equals(credentials.username)
      .first();
    return {
      username: credentials.username,
      displayName: profile?.displayName ?? credentials.username,
    };
  },

  setup: async (username, password, displayName) => {
    await db.open();
    const existing = await db.credentials.count();
    if (existing > 0) {
      // Keep UI flag in sync so callers switch to Login instead of Setup.
      set({ isSetupComplete: true });
      throw new Error(
        'An account already exists on this device. Use Log in instead.',
      );
    }
    if (get().isSetupComplete) {
      // Stale flag with empty DB — clear and allow setup.
      set({ isSetupComplete: false });
    }

    const now = new Date().toISOString();
    const trimmedUser = username.trim();
    const trimmedName = displayName.trim() || trimmedUser;

    const credentials: AuthCredentials = {
      id: uid(),
      username: trimmedUser,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };

    const profile: UserProfile = {
      id: uid(),
      username: trimmedUser,
      displayName: trimmedName,
      motto: 'God • Goals • Grinding • Gratitude',
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction('rw', db.credentials, db.profiles, async () => {
      await db.credentials.add(credentials);
      await db.profiles.add(profile);
    });

    writeSession(trimmedUser);
    set({
      isAuthenticated: true,
      isSetupComplete: true,
      isInitialized: true,
      username: trimmedUser,
      displayName: trimmedName,
    });
  },

  login: async (username, password) => {
    await db.open();
    const credentials = await findCredentialsByUsername(username);
    if (!credentials) return 'unknown_user';

    const ok = await verifyPassword(password, credentials.passwordHash);
    if (!ok) return 'bad_password';

    const profile = await db.profiles
      .where('username')
      .equals(credentials.username)
      .first();

    writeSession(credentials.username);
    set({
      isAuthenticated: true,
      isSetupComplete: true,
      isInitialized: true,
      username: credentials.username,
      displayName: profile?.displayName ?? credentials.username,
    });
    return 'ok';
  },

  resetPasswordOnDevice: async (newPassword) => {
    await db.open();
    const credentials = await db.credentials.toCollection().first();
    if (!credentials) {
      throw new Error('No account found on this device.');
    }
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(newPassword);
    await db.credentials.update(credentials.id, {
      passwordHash,
      updatedAt: now,
    });

    const profile = await db.profiles
      .where('username')
      .equals(credentials.username)
      .first();

    writeSession(credentials.username);
    set({
      isAuthenticated: true,
      isSetupComplete: true,
      isInitialized: true,
      username: credentials.username,
      displayName: profile?.displayName ?? credentials.username,
    });
  },

  logout: () => {
    clearSession();
    set({
      isAuthenticated: false,
      username: null,
      displayName: null,
    });
  },
}));
