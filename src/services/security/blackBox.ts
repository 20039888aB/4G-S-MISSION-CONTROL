import { exportAllData, importAllData } from '@/db/backup';
import { formatDate } from '@/lib/utils';

const MAGIC = 'G4BLACKBOX1';

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations: 120_000,
      hash: 'SHA-256',
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  u8.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function fromB64(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Password-encrypted offline migrate package (no cloud). */
export async function downloadBlackBox(password: string): Promise<void> {
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  const payload = await exportAllData();
  const json = JSON.stringify(payload);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
    },
    key,
    new TextEncoder().encode(json),
  );

  const pack = {
    magic: MAGIC,
    createdAt: new Date().toISOString(),
    salt: b64(salt),
    iv: b64(iv),
    data: b64(cipher),
  };

  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `g4-blackbox-${formatDate(new Date(), 'yyyy-MM-dd-HHmm')}.g4box`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBlackBox(file: File, password: string): Promise<void> {
  const text = await file.text();
  const pack = JSON.parse(text) as {
    magic?: string;
    salt?: string;
    iv?: string;
    data?: string;
  };
  if (pack.magic !== MAGIC || !pack.salt || !pack.iv || !pack.data) {
    throw new Error('Not a valid G4 black box file.');
  }
  const salt = fromB64(pack.salt);
  const iv = fromB64(pack.iv);
  const data = fromB64(pack.data);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
    },
    key,
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
  );
  const json = new TextDecoder().decode(plain);
  await importAllData(JSON.parse(json));
}
