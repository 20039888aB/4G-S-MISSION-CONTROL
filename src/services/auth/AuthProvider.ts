import { db } from '@/db/database';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { uid } from '@/lib/utils';
import type { AuthCredentials, UserProfile } from '@/types';

export interface AuthSetupInput {
  username: string;
  password: string;
  displayName: string;
}

export interface AuthLoginInput {
  username: string;
  password: string;
}

export interface AuthProvider {
  setup(input: AuthSetupInput): Promise<void>;
  login(input: AuthLoginInput): Promise<boolean>;
  logout(): Promise<void>;
  isSetupComplete(): Promise<boolean>;
}

export class LocalAuthProvider implements AuthProvider {
  async setup(input: AuthSetupInput): Promise<void> {
    const existing = await db.credentials.count();
    if (existing > 0) {
      throw new Error('Local auth setup already complete.');
    }

    const now = new Date().toISOString();
    const username = input.username.trim();
    const displayName = input.displayName.trim() || username;

    const credentials: AuthCredentials = {
      id: uid(),
      username,
      passwordHash: await hashPassword(input.password),
      createdAt: now,
      updatedAt: now,
    };

    const profile: UserProfile = {
      id: uid(),
      username,
      displayName,
      motto: 'God • Goals • Grinding • Gratitude',
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction('rw', db.credentials, db.profiles, async () => {
      await db.credentials.add(credentials);
      await db.profiles.add(profile);
    });
  }

  async login(input: AuthLoginInput): Promise<boolean> {
    const credentials = await db.credentials
      .where('username')
      .equals(input.username.trim())
      .first();

    if (!credentials) return false;
    return verifyPassword(input.password, credentials.passwordHash);
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem('g4_session');
  }

  async isSetupComplete(): Promise<boolean> {
    const count = await db.credentials.count();
    return count > 0;
  }
}

let provider: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (!provider) {
    provider = new LocalAuthProvider();
  }
  return provider;
}
