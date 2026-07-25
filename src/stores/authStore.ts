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

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  isSetupComplete: boolean;
  username: string | null;
  displayName: string | null;
  initialize: () => Promise<void>;
  setup: (
    username: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
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
  // Prefer localStorage so PWA updates / tab closes don't force a fresh start.
  localStorage.setItem(SESSION_KEY, json);
  sessionStorage.removeItem(SESSION_KEY);
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
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
      await db.open();
      await seedDefaultsIfEmpty();

      const credentials = await db.credentials.toCollection().first();
      const setupComplete = Boolean(credentials);
      const session = readSession();

      if (setupComplete && session?.username) {
        const profile = await db.profiles
          .where('username')
          .equals(session.username)
          .first();

        if (profile && credentials?.username === session.username) {
          set({
            isAuthenticated: true,
            isInitialized: true,
            isSetupComplete: true,
            username: profile.username,
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
    })();

    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },

  setup: async (username, password, displayName) => {
    const existing = await db.credentials.count();
    if (existing > 0 || get().isSetupComplete) {
      throw new Error('Setup already completed.');
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
    const credentials = await db.credentials
      .where('username')
      .equals(username.trim())
      .first();

    if (!credentials) return false;

    const ok = await verifyPassword(password, credentials.passwordHash);
    if (!ok) return false;

    const profile = await db.profiles
      .where('username')
      .equals(credentials.username)
      .first();

    writeSession(credentials.username);
    set({
      isAuthenticated: true,
      isSetupComplete: true,
      username: credentials.username,
      displayName: profile?.displayName ?? credentials.username,
    });
    return true;
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
