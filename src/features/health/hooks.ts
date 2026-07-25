import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import { bmiLabel, calcBmi } from '@/services/health/bmi';
import { useSettingsStore } from '@/stores/settingsStore';
import type { BodyMeasurement, HealthMetric, Workout } from '@/types';

export { bmiLabel, calcBmi };

export const WORKOUT_TYPES = [
  'running',
  'walking',
  'cycling',
  'gym',
  'other',
] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysAgoKey(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function lastNDateKeys(n: number, from = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => daysAgoKey(n - 1 - i, from));
}

function byDateDesc<T extends { date: string; createdAt: string }>(a: T, b: T) {
  const d = b.date.localeCompare(a.date);
  if (d !== 0) return d;
  return b.createdAt.localeCompare(a.createdAt);
}

export type HealthMetricInput = {
  date: string;
  sleepHours?: number;
  waterMl?: number;
  steps?: number;
  energy?: number;
  mood?: number;
  weightKg?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  bloodSugar?: number;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
};

export type WorkoutInput = {
  date: string;
  type: string;
  durationMinutes: number;
  calories?: number;
  intensity?: Workout['intensity'];
  notes?: string;
};

export type BodyMeasurementInput = {
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  heightCm?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  neckCm?: number;
  notes?: string;
};

function optNum(value?: number): number | undefined {
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  return value;
}

export function useHealthMetricsLive() {
  return useLiveQuery(async () => {
    const rows = await db.healthMetrics.toArray();
    return rows.sort(byDateDesc);
  }, []);
}

export function useWorkoutsLive() {
  return useLiveQuery(async () => {
    const rows = await db.workouts.toArray();
    return rows.sort(byDateDesc);
  }, []);
}

export function useBodyMeasurementsLive() {
  return useLiveQuery(async () => {
    const rows = await db.bodyMeasurements.toArray();
    return rows.sort(byDateDesc);
  }, []);
}

export function useHealthOverview() {
  const profileHeight = useSettingsStore((s) => s.profileHeightCm);
  return useLiveQuery(async () => {
    const since = daysAgoKey(29);
    const [metrics, workouts, bodies] = await Promise.all([
      db.healthMetrics.where('date').aboveOrEqual(since).toArray(),
      db.workouts.where('date').aboveOrEqual(since).toArray(),
      db.bodyMeasurements.toArray(),
    ]);

    metrics.sort(byDateDesc);
    workouts.sort(byDateDesc);
    bodies.sort(byDateDesc);

    const latestBodyWithWeight = bodies.find((b) => typeof b.weightKg === 'number');
    const latestMetricWeight = metrics.find((m) => typeof m.weightKg === 'number');
    const latestWeight =
      latestBodyWithWeight?.weightKg ?? latestMetricWeight?.weightKg;
    const latestWeightDate =
      latestBodyWithWeight?.date ?? latestMetricWeight?.date;

    const heightCm =
      profileHeight ||
      bodies.find((b) => typeof b.heightCm === 'number')?.heightCm;
    const bmi = calcBmi(latestWeight, heightCm);

    const recent7 = lastNDateKeys(7);
    const sleepRecent = metrics
      .filter((m) => recent7.includes(m.date.slice(0, 10)) && m.sleepHours != null)
      .map((m) => m.sleepHours!);
    const waterRecent = metrics
      .filter((m) => recent7.includes(m.date.slice(0, 10)) && m.waterMl != null)
      .map((m) => m.waterMl!);

    const avgSleep =
      sleepRecent.length > 0
        ? Math.round(
            (sleepRecent.reduce((s, v) => s + v, 0) / sleepRecent.length) * 10,
          ) / 10
        : null;
    const avgWater =
      waterRecent.length > 0
        ? Math.round(waterRecent.reduce((s, v) => s + v, 0) / waterRecent.length)
        : null;

    const weightSeries = [...bodies, ...metrics]
      .filter((r): r is (BodyMeasurement | HealthMetric) & { weightKg: number } =>
        typeof r.weightKg === 'number',
      )
      .map((r) => ({ date: r.date.slice(0, 10), weight: r.weightKg }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Dedupe by date keeping last value
    const weightByDate = new Map<string, number>();
    for (const point of weightSeries) {
      weightByDate.set(point.date, point.weight);
    }
    const weightTrend = [...weightByDate.entries()].map(([date, weight]) => ({
      date,
      weight,
    }));

    const keys30 = lastNDateKeys(30);
    const workoutByDate = new Map<string, number>();
    for (const key of keys30) workoutByDate.set(key, 0);
    for (const w of workouts) {
      const key = w.date.slice(0, 10);
      if (workoutByDate.has(key)) {
        workoutByDate.set(key, (workoutByDate.get(key) ?? 0) + 1);
      }
    }
    const workoutFrequency = keys30.map((date) => ({
      date,
      count: workoutByDate.get(date) ?? 0,
    }));

    const sleepSpark = recent7.map((date) => {
      const row = metrics.find((m) => m.date.slice(0, 10) === date);
      return { date, value: row?.sleepHours ?? 0 };
    });
    const waterSpark = recent7.map((date) => {
      const row = metrics.find((m) => m.date.slice(0, 10) === date);
      return { date, value: row?.waterMl ?? 0 };
    });

    return {
      latestWeight,
      latestWeightDate,
      heightCm,
      bmi,
      avgSleep,
      avgWater,
      workoutsThisMonth: workouts.length,
      weightTrend,
      workoutFrequency,
      sleepSpark,
      waterSpark,
      latestMetric: metrics[0] ?? null,
      latestBody: bodies[0] ?? null,
    };
  }, [profileHeight]);
}

export async function createHealthMetric(
  input: HealthMetricInput,
): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: HealthMetric = {
    id,
    date: input.date.slice(0, 10),
    sleepHours: optNum(input.sleepHours),
    waterMl: optNum(input.waterMl),
    steps: optNum(input.steps),
    energy: optNum(input.energy),
    mood: optNum(input.mood),
    weightKg: optNum(input.weightKg),
    bloodPressureSystolic: optNum(input.bloodPressureSystolic),
    bloodPressureDiastolic: optNum(input.bloodPressureDiastolic),
    heartRate: optNum(input.heartRate),
    bloodSugar: optNum(input.bloodSugar),
    calories: optNum(input.calories),
    proteinG: optNum(input.proteinG),
    carbsG: optNum(input.carbsG),
    fatG: optNum(input.fatG),
    notes: input.notes?.trim() || undefined,
    createdAt: now,
  };
  await db.healthMetrics.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'metric_logged',
    summary: `Logged health metrics for ${row.date}`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateHealthMetric(
  id: string,
  input: HealthMetricInput,
): Promise<void> {
  const existing = await db.healthMetrics.get(id);
  if (!existing) return;
  const row: HealthMetric = {
    id,
    date: input.date.slice(0, 10),
    sleepHours: optNum(input.sleepHours),
    waterMl: optNum(input.waterMl),
    steps: optNum(input.steps),
    energy: optNum(input.energy),
    mood: optNum(input.mood),
    weightKg: optNum(input.weightKg),
    bloodPressureSystolic: optNum(input.bloodPressureSystolic),
    bloodPressureDiastolic: optNum(input.bloodPressureDiastolic),
    heartRate: optNum(input.heartRate),
    bloodSugar: optNum(input.bloodSugar),
    calories: optNum(input.calories),
    proteinG: optNum(input.proteinG),
    carbsG: optNum(input.carbsG),
    fatG: optNum(input.fatG),
    notes: input.notes?.trim() || undefined,
    createdAt: existing.createdAt,
  };
  await db.healthMetrics.put(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'metric_updated',
    summary: `Updated health metrics for ${row.date}`,
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteHealthMetric(id: string): Promise<void> {
  await db.healthMetrics.delete(id);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'metric_deleted',
    summary: 'Deleted a health metric entry',
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function createWorkout(input: WorkoutInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: Workout = {
    id,
    date: input.date.slice(0, 10),
    type: input.type.trim() || 'other',
    durationMinutes: input.durationMinutes,
    calories: optNum(input.calories),
    intensity: input.intensity,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
  };
  await db.workouts.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'workout_logged',
    summary: `Logged ${row.type} workout (${row.durationMinutes} min)`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateWorkout(
  id: string,
  input: WorkoutInput,
): Promise<void> {
  const existing = await db.workouts.get(id);
  if (!existing) return;
  const row: Workout = {
    id,
    date: input.date.slice(0, 10),
    type: input.type.trim() || 'other',
    durationMinutes: input.durationMinutes,
    calories: optNum(input.calories),
    intensity: input.intensity,
    notes: input.notes?.trim() || undefined,
    createdAt: existing.createdAt,
  };
  await db.workouts.put(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'workout_updated',
    summary: `Updated ${row.type} workout (${row.durationMinutes} min)`,
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workouts.delete(id);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'workout_deleted',
    summary: 'Deleted a workout',
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function createBodyMeasurement(
  input: BodyMeasurementInput,
): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: BodyMeasurement = {
    id,
    date: input.date.slice(0, 10),
    weightKg: optNum(input.weightKg),
    bodyFatPct: optNum(input.bodyFatPct),
    heightCm: optNum(input.heightCm),
    waistCm: optNum(input.waistCm),
    chestCm: optNum(input.chestCm),
    hipsCm: optNum(input.hipsCm),
    armsCm: optNum(input.armsCm),
    thighsCm: optNum(input.thighsCm),
    neckCm: optNum(input.neckCm),
    notes: input.notes?.trim() || undefined,
    createdAt: now,
  };
  await db.bodyMeasurements.add(row);
  if (row.heightCm != null) {
    useSettingsStore.getState().setProfileHeightCm(row.heightCm);
  }
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'body_logged',
    summary: `Logged body measurements for ${row.date}`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateBodyMeasurement(
  id: string,
  input: BodyMeasurementInput,
): Promise<void> {
  const existing = await db.bodyMeasurements.get(id);
  if (!existing) return;
  const row: BodyMeasurement = {
    id,
    date: input.date.slice(0, 10),
    weightKg: optNum(input.weightKg),
    bodyFatPct: optNum(input.bodyFatPct),
    heightCm: optNum(input.heightCm),
    waistCm: optNum(input.waistCm),
    chestCm: optNum(input.chestCm),
    hipsCm: optNum(input.hipsCm),
    armsCm: optNum(input.armsCm),
    thighsCm: optNum(input.thighsCm),
    neckCm: optNum(input.neckCm),
    notes: input.notes?.trim() || undefined,
    createdAt: existing.createdAt,
  };
  await db.bodyMeasurements.put(row);
  if (row.heightCm != null) {
    useSettingsStore.getState().setProfileHeightCm(row.heightCm);
  }
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'body_updated',
    summary: `Updated body measurements for ${row.date}`,
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  await db.bodyMeasurements.delete(id);
  await db.activityLogs.add({
    id: uid(),
    entity: 'health',
    action: 'body_deleted',
    summary: 'Deleted a body measurement',
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}
