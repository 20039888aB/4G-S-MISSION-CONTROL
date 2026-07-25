import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import { calcBmi } from '@/services/health/bmi';
import { useSettingsStore } from '@/stores/settingsStore';
import type { BodyPhoto } from '@/types';

export function useBodyPhotosLive() {
  return useLiveQuery(
    () => db.bodyPhotos.orderBy('date').reverse().toArray(),
    [],
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

export async function createBodyPhoto(input: {
  date: string;
  file: File;
  weightKg?: number;
  waistCm?: number;
  notes?: string;
}): Promise<string> {
  if (!input.file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (input.file.size > 2_500_000) {
    throw new Error('Keep photos under ~2.5 MB for local storage.');
  }
  const imageData = await readFileAsDataUrl(input.file);
  const height = useSettingsStore.getState().profileHeightCm;
  const id = uid();
  const row: BodyPhoto = {
    id,
    date: input.date.slice(0, 10),
    imageData,
    weightKg: input.weightKg,
    waistCm: input.waistCm,
    bmi: calcBmi(input.weightKg, height) ?? undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await db.bodyPhotos.add(row);
  return id;
}

export async function updateBodyPhoto(
  id: string,
  patch: Partial<Pick<BodyPhoto, 'date' | 'weightKg' | 'waistCm' | 'notes' | 'bmi'>>,
): Promise<void> {
  const height = useSettingsStore.getState().profileHeightCm;
  const bmi =
    patch.weightKg != null ? calcBmi(patch.weightKg, height) ?? undefined : patch.bmi;
  await db.bodyPhotos.update(id, { ...patch, bmi });
}

export async function deleteBodyPhoto(id: string): Promise<void> {
  await db.bodyPhotos.delete(id);
}
