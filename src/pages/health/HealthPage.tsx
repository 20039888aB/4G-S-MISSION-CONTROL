import { motion } from 'framer-motion';
import {
  Activity,
  Droplets,
  Dumbbell,
  Moon,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui';
import {
  createBodyPhoto,
  deleteBodyPhoto,
  updateBodyPhoto,
  useBodyPhotosLive,
} from '@/features/bodyPhotos/hooks';
import { BmiPlannerCard } from '@/features/health/BmiPlannerCard';
import { QuickMetricTile } from '@/features/health/QuickMetricEditor';
import {
  bmiLabel,
  createBodyMeasurement,
  createHealthMetric,
  createWorkout,
  deleteBodyMeasurement,
  deleteHealthMetric,
  deleteWorkout,
  todayKey,
  updateBodyMeasurement,
  updateHealthMetric,
  updateWorkout,
  useBodyMeasurementsLive,
  useHealthMetricsLive,
  useHealthOverview,
  useWorkoutsLive,
  WORKOUT_TYPES,
} from '@/features/health/hooks';
import { formatDate } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { BodyMeasurement, HealthMetric, Workout } from '@/types';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

function chartTooltipStyle() {
  return {
    background: 'var(--bg-elevated, #111827)',
    border: '1px solid var(--border, #334155)',
    borderRadius: 8,
    color: 'var(--text, #e2e8f0)',
  };
}

function parseOptional(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function numStr(value?: number): string {
  return value != null ? String(value) : '';
}

function Sparkline({
  data,
  color,
}: {
  data: { date: string; value: number }[];
  color: string;
}) {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-16 items-center text-xs text-text-muted">
        No recent data
      </div>
    );
  }
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricForm({
  initial,
  onDone,
}: {
  initial?: HealthMetric;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [weightKg, setWeightKg] = useState(numStr(initial?.weightKg));
  const [systolic, setSystolic] = useState(
    numStr(initial?.bloodPressureSystolic),
  );
  const [diastolic, setDiastolic] = useState(
    numStr(initial?.bloodPressureDiastolic),
  );
  const [heartRate, setHeartRate] = useState(numStr(initial?.heartRate));
  const [spo2Pct, setSpo2Pct] = useState(numStr(initial?.spo2Pct));
  const [temperatureC, setTemperatureC] = useState(numStr(initial?.temperatureC));
  const [bloodSugar, setBloodSugar] = useState(numStr(initial?.bloodSugar));
  const [sleepHours, setSleepHours] = useState(numStr(initial?.sleepHours));
  const [waterMl, setWaterMl] = useState(numStr(initial?.waterMl));
  const [calories, setCalories] = useState(numStr(initial?.calories));
  const [proteinG, setProteinG] = useState(numStr(initial?.proteinG));
  const [carbsG, setCarbsG] = useState(numStr(initial?.carbsG));
  const [fatG, setFatG] = useState(numStr(initial?.fatG));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const input = {
      date,
      weightKg: parseOptional(weightKg),
      bloodPressureSystolic: parseOptional(systolic),
      bloodPressureDiastolic: parseOptional(diastolic),
      heartRate: parseOptional(heartRate),
      spo2Pct: parseOptional(spo2Pct),
      temperatureC: parseOptional(temperatureC),
      bloodSugar: parseOptional(bloodSugar),
      sleepHours: parseOptional(sleepHours),
      waterMl: parseOptional(waterMl),
      calories: parseOptional(calories),
      proteinG: parseOptional(proteinG),
      carbsG: parseOptional(carbsG),
      fatG: parseOptional(fatG),
      notes,
    };
    try {
      if (initial) {
        await updateHealthMetric(initial.id, input);
        addToast('success', 'Metrics updated');
      } else {
        await createHealthMetric(input);
        addToast('success', 'Metrics logged');
      }
      onDone();
    } catch {
      setError('Could not save metrics.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Weight (kg)"
          type="number"
          step="0.1"
          min="0"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
        <Input
          label="Heart rate (bpm)"
          type="number"
          min="0"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
        />
        <Input
          label="SpO₂ (%)"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={spo2Pct}
          onChange={(e) => setSpo2Pct(e.target.value)}
        />
        <Input
          label="Temperature (°C)"
          type="number"
          step="0.1"
          value={temperatureC}
          onChange={(e) => setTemperatureC(e.target.value)}
        />
        <Input
          label="BP systolic"
          type="number"
          min="0"
          value={systolic}
          onChange={(e) => setSystolic(e.target.value)}
        />
        <Input
          label="BP diastolic"
          type="number"
          min="0"
          value={diastolic}
          onChange={(e) => setDiastolic(e.target.value)}
        />
        <Input
          label="Blood sugar"
          type="number"
          step="0.1"
          min="0"
          value={bloodSugar}
          onChange={(e) => setBloodSugar(e.target.value)}
        />
        <Input
          label="Sleep (hours)"
          type="number"
          step="0.1"
          min="0"
          max="24"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
        />
        <Input
          label="Water (ml)"
          type="number"
          min="0"
          value={waterMl}
          onChange={(e) => setWaterMl(e.target.value)}
        />
        <Input
          label="Calories"
          type="number"
          min="0"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <Input
          label="Protein (g)"
          type="number"
          min="0"
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
        />
        <Input
          label="Carbs (g)"
          type="number"
          min="0"
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
        />
        <Input
          label="Fat (g)"
          type="number"
          min="0"
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
        />
      </div>
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="submit" loading={saving}>
          {initial ? 'Update metrics' : 'Save metrics'}
        </Button>
      </div>
    </form>
  );
}

function WorkoutForm({
  initial,
  onDone,
}: {
  initial?: Workout;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [type, setType] = useState(initial?.type ?? 'running');
  const [durationMinutes, setDurationMinutes] = useState(
    String(initial?.durationMinutes ?? 30),
  );
  const [calories, setCalories] = useState(numStr(initial?.calories));
  const [intensity, setIntensity] = useState(initial?.intensity ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const mins = Number(durationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) return;
    setSaving(true);
    const intensityValue =
      intensity === 'easy' || intensity === 'moderate' || intensity === 'hard'
        ? intensity
        : undefined;
    try {
      if (initial) {
        await updateWorkout(initial.id, {
          date,
          type,
          durationMinutes: mins,
          calories: parseOptional(calories),
          intensity: intensityValue,
          notes,
        });
        addToast('success', 'Workout updated');
      } else {
        await createWorkout({
          date,
          type,
          durationMinutes: mins,
          calories: parseOptional(calories),
          intensity: intensityValue,
          notes,
        });
        addToast('success', 'Workout logged');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        options={WORKOUT_TYPES.map((t) => ({
          value: t,
          label: t.charAt(0).toUpperCase() + t.slice(1),
        }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Duration (minutes)"
          type="number"
          min="1"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          required
        />
        <Input
          label="Calories burned"
          type="number"
          min="0"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>
      <Select
        label="Intensity"
        value={intensity}
        onChange={(e) => setIntensity(e.target.value)}
        placeholder="Optional"
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'hard', label: 'Hard' },
        ]}
      />
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update workout' : 'Save workout'}
        </Button>
      </div>
    </form>
  );
}

function BodyForm({
  initial,
  onDone,
}: {
  initial?: BodyMeasurement;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [weightKg, setWeightKg] = useState(numStr(initial?.weightKg));
  const [heightCm, setHeightCm] = useState(numStr(initial?.heightCm));
  const [bodyFatPct, setBodyFatPct] = useState(numStr(initial?.bodyFatPct));
  const [chestCm, setChestCm] = useState(numStr(initial?.chestCm));
  const [waistCm, setWaistCm] = useState(numStr(initial?.waistCm));
  const [hipsCm, setHipsCm] = useState(numStr(initial?.hipsCm));
  const [armsCm, setArmsCm] = useState(numStr(initial?.armsCm));
  const [thighsCm, setThighsCm] = useState(numStr(initial?.thighsCm));
  const [neckCm, setNeckCm] = useState(numStr(initial?.neckCm));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input = {
      date,
      weightKg: parseOptional(weightKg),
      heightCm: parseOptional(heightCm),
      bodyFatPct: parseOptional(bodyFatPct),
      chestCm: parseOptional(chestCm),
      waistCm: parseOptional(waistCm),
      hipsCm: parseOptional(hipsCm),
      armsCm: parseOptional(armsCm),
      thighsCm: parseOptional(thighsCm),
      neckCm: parseOptional(neckCm),
      notes,
    };
    try {
      if (initial) {
        await updateBodyMeasurement(initial.id, input);
        addToast('success', 'Measurements updated');
      } else {
        await createBodyMeasurement(input);
        addToast('success', 'Measurements logged');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Weight (kg)"
          type="number"
          step="0.1"
          min="0"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
        <Input
          label="Height (cm)"
          type="number"
          step="0.1"
          min="0"
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          hint="Used for BMI"
        />
        <Input
          label="Body fat %"
          type="number"
          step="0.1"
          min="0"
          value={bodyFatPct}
          onChange={(e) => setBodyFatPct(e.target.value)}
        />
        <Input
          label="Chest (cm)"
          type="number"
          step="0.1"
          min="0"
          value={chestCm}
          onChange={(e) => setChestCm(e.target.value)}
        />
        <Input
          label="Waist (cm)"
          type="number"
          step="0.1"
          min="0"
          value={waistCm}
          onChange={(e) => setWaistCm(e.target.value)}
        />
        <Input
          label="Hips (cm)"
          type="number"
          step="0.1"
          min="0"
          value={hipsCm}
          onChange={(e) => setHipsCm(e.target.value)}
        />
        <Input
          label="Arms (cm)"
          type="number"
          step="0.1"
          min="0"
          value={armsCm}
          onChange={(e) => setArmsCm(e.target.value)}
        />
        <Input
          label="Thighs (cm)"
          type="number"
          step="0.1"
          min="0"
          value={thighsCm}
          onChange={(e) => setThighsCm(e.target.value)}
        />
        <Input
          label="Neck (cm)"
          type="number"
          step="0.1"
          min="0"
          value={neckCm}
          onChange={(e) => setNeckCm(e.target.value)}
        />
      </div>
      <Textarea
        label="Progress notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update measurements' : 'Save measurements'}
        </Button>
      </div>
    </form>
  );
}

export default function HealthPage() {
  const overview = useHealthOverview();
  const metrics = useHealthMetricsLive();
  const workouts = useWorkoutsLive();
  const bodies = useBodyMeasurementsLive();
  const photos = useBodyPhotosLive();
  const addToast = useUiStore((s) => s.addToast);
  const [photoDate, setPhotoDate] = useState(todayKey());
  const [photoWeight, setPhotoWeight] = useState('');
  const [photoWaist, setPhotoWaist] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);

  const [metricOpen, setMetricOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<HealthMetric | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editingBody, setEditingBody] = useState<BodyMeasurement | null>(null);

  const loading = overview === undefined;

  const weightChartData = useMemo(
    () =>
      (overview?.weightTrend ?? []).map((p) => ({
        ...p,
        label: formatDate(p.date, 'MMM d'),
      })),
    [overview?.weightTrend],
  );

  const workoutChartData = useMemo(
    () =>
      (overview?.workoutFrequency ?? []).map((p) => ({
        ...p,
        label: formatDate(p.date, 'MMM d'),
      })),
    [overview?.workoutFrequency],
  );

  return (
    <div className="space-y-2">
      <PageHeader
        eyebrow="Grinding"
        title="Health"
        description="Sleep, training, hydration, and body metrics."
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="runway">Photo runway</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <motion.div {...fade} className="space-y-4">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Latest weight"
                  value={
                    overview.latestWeight != null
                      ? `${overview.latestWeight} kg`
                      : '—'
                  }
                  hint={
                    overview.latestWeightDate
                      ? formatDate(overview.latestWeightDate)
                      : 'Log weight to track'
                  }
                  icon={Scale}
                  glass
                />
                <StatCard
                  label="BMI"
                  value={overview.bmi != null ? overview.bmi : '—'}
                  hint={
                    overview.bmi != null
                      ? bmiLabel(overview.bmi)
                      : 'Needs weight + height'
                  }
                  icon={Activity}
                  accentClassName="bg-success/15 text-success"
                />
                <StatCard
                  label="Avg sleep (7d)"
                  value={
                    overview.avgSleep != null ? `${overview.avgSleep} h` : '—'
                  }
                  hint="Target ~7.5 hours"
                  icon={Moon}
                />
                <StatCard
                  label="Avg water (7d)"
                  value={
                    overview.avgWater != null
                      ? `${Math.round(overview.avgWater / 100) / 10} L`
                      : '—'
                  }
                  hint={`${overview.workoutsThisMonth} workouts this month`}
                  icon={Droplets}
                  accentClassName="bg-goals/15 text-goals"
                />
              </div>
            )}

            {!loading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <QuickMetricTile
                  metricKey="weightKg"
                  value={
                    overview.latestWeight != null
                      ? String(overview.latestWeight)
                      : '—'
                  }
                  unit="kg"
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="bp"
                  value={
                    overview.latestMetric?.bloodPressureSystolic != null &&
                    overview.latestMetric?.bloodPressureDiastolic != null
                      ? `${overview.latestMetric.bloodPressureSystolic}/${overview.latestMetric.bloodPressureDiastolic}`
                      : '—'
                  }
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="heartRate"
                  value={
                    overview.latestMetric?.heartRate != null
                      ? String(overview.latestMetric.heartRate)
                      : '—'
                  }
                  unit="bpm"
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="spo2Pct"
                  value={
                    overview.latestMetric?.spo2Pct != null
                      ? String(overview.latestMetric.spo2Pct)
                      : '—'
                  }
                  unit="%"
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="temperatureC"
                  value={
                    overview.latestMetric?.temperatureC != null
                      ? String(overview.latestMetric.temperatureC)
                      : '—'
                  }
                  unit="°C"
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="bloodSugar"
                  value={
                    overview.latestMetric?.bloodSugar != null
                      ? String(overview.latestMetric.bloodSugar)
                      : '—'
                  }
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="sleepHours"
                  value={
                    overview.latestMetric?.sleepHours != null
                      ? String(overview.latestMetric.sleepHours)
                      : '—'
                  }
                  unit="h"
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="waterMl"
                  value={
                    overview.latestMetric?.waterMl != null
                      ? String(overview.latestMetric.waterMl)
                      : '—'
                  }
                  unit="ml"
                  latest={overview.latestMetric}
                />
                <QuickMetricTile
                  metricKey="steps"
                  value={
                    overview.latestMetric?.steps != null
                      ? String(overview.latestMetric.steps)
                      : '—'
                  }
                  latest={overview.latestMetric}
                />
              </div>
            ) : null}

            {!loading ? (
              <BmiPlannerCard
                currentWeightKg={overview.latestWeight}
                heightCm={overview.heightCm}
                bmi={overview.bmi}
              />
            ) : (
              <Skeleton className="h-64" />
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card glass>
                <CardHeader>
                  <CardTitle>Sleep (7 days)</CardTitle>
                </CardHeader>
                {loading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <Sparkline
                    data={overview.sleepSpark}
                    color="var(--color-accent, #f0b429)"
                  />
                )}
              </Card>
              <Card glass>
                <CardHeader>
                  <CardTitle>Water (7 days)</CardTitle>
                </CardHeader>
                {loading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <Sparkline data={overview.waterSpark} color="#38BDF8" />
                )}
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weight trend</CardTitle>
                </CardHeader>
                {loading ? (
                  <Skeleton className="h-56" />
                ) : weightChartData.length === 0 ? (
                  <EmptyState
                    icon={Scale}
                    title="No weight data yet"
                    description="Log weight under Metrics or Body to see your trend."
                  />
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 11 }}
                          width={36}
                        />
                        <Tooltip contentStyle={chartTooltipStyle()} />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--color-accent, #f0b429)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workout frequency (30d)</CardTitle>
                </CardHeader>
                {loading ? (
                  <Skeleton className="h-56" />
                ) : overview && overview.workoutsThisMonth === 0 ? (
                  <EmptyState
                    icon={Dumbbell}
                    title="No workouts logged"
                    description="Add sessions under Workouts to chart frequency."
                  />
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workoutChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          width={28}
                        />
                        <Tooltip contentStyle={chartTooltipStyle()} />
                        <Area
                          type="step"
                          dataKey="count"
                          stroke="#22C55E"
                          fill="#22C55E"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="metrics">
          <motion.div {...fade} className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingMetric(null);
                  setMetricOpen(true);
                }}
              >
                <Plus className="size-4" />
                Log metrics
              </Button>
            </div>
            <Card>
              {!metrics ? (
                <Skeleton className="h-40" />
              ) : metrics.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No metrics yet"
                  description="Track weight, vitals, sleep, water, and macros."
                  action={
                    <Button
                      onClick={() => {
                        setEditingMetric(null);
                        setMetricOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Log first entry
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-border text-xs text-text-muted uppercase">
                      <tr>
                        <th className="px-2 py-2 font-medium">Date</th>
                        <th className="px-2 py-2 font-medium">Weight</th>
                        <th className="px-2 py-2 font-medium">BP</th>
                        <th className="px-2 py-2 font-medium">HR</th>
                        <th className="px-2 py-2 font-medium">Sugar</th>
                        <th className="px-2 py-2 font-medium">Sleep</th>
                        <th className="px-2 py-2 font-medium">Water</th>
                        <th className="px-2 py-2 font-medium">Cals</th>
                        <th className="px-2 py-2 font-medium">Macros</th>
                        <th className="px-2 py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-2 py-2.5 whitespace-nowrap">
                            {formatDate(m.date)}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.weightKg != null ? `${m.weightKg}` : '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.bloodPressureSystolic != null &&
                            m.bloodPressureDiastolic != null
                              ? `${m.bloodPressureSystolic}/${m.bloodPressureDiastolic}`
                              : '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.heartRate ?? '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.bloodSugar ?? '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.sleepHours != null ? `${m.sleepHours}h` : '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.waterMl != null ? `${m.waterMl}ml` : '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            {m.calories ?? '—'}
                          </td>
                          <td className="px-2 py-2.5 text-xs text-text-muted">
                            {m.proteinG != null ||
                            m.carbsG != null ||
                            m.fatG != null
                              ? `P${m.proteinG ?? '—'} C${m.carbsG ?? '—'} F${m.fatG ?? '—'}`
                              : '—'}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Edit metric"
                                onClick={() => {
                                  setEditingMetric(m);
                                  setMetricOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Delete metric"
                                onClick={() => {
                                  void deleteHealthMetric(m.id).then(() =>
                                    addToast('success', 'Metric deleted'),
                                  );
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="workouts">
          <motion.div {...fade} className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingWorkout(null);
                  setWorkoutOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add workout
              </Button>
            </div>
            <Card>
              {!workouts ? (
                <Skeleton className="h-40" />
              ) : workouts.length === 0 ? (
                <EmptyState
                  icon={Dumbbell}
                  title="No workouts yet"
                  description="Log running, walking, cycling, gym, or other sessions."
                  action={
                    <Button
                      onClick={() => {
                        setEditingWorkout(null);
                        setWorkoutOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add first workout
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {workouts.map((w) => (
                    <li
                      key={w.id}
                      className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
                        <Dumbbell className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium capitalize text-text">
                            {w.type}
                          </p>
                          {w.intensity ? (
                            <Badge tone="neutral">{w.intensity}</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-text-muted">
                          {formatDate(w.date)} · {w.durationMinutes} min
                          {w.calories != null ? ` · ${w.calories} kcal` : ''}
                        </p>
                        {w.notes ? (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {w.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit workout"
                          onClick={() => {
                            setEditingWorkout(w);
                            setWorkoutOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete workout"
                          onClick={() => {
                            void deleteWorkout(w.id).then(() =>
                              addToast('success', 'Workout deleted'),
                            );
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="body">
          <motion.div {...fade} className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingBody(null);
                  setBodyOpen(true);
                }}
              >
                <Plus className="size-4" />
                Log measurements
              </Button>
            </div>
            <Card>
              {!bodies ? (
                <Skeleton className="h-40" />
              ) : bodies.length === 0 ? (
                <EmptyState
                  icon={Ruler}
                  title="No body measurements"
                  description="Track chest, waist, hips, arms, and progress notes."
                  action={
                    <Button
                      onClick={() => {
                        setEditingBody(null);
                        setBodyOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Log first measurement
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {bodies.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text">
                            {formatDate(b.date)}
                          </p>
                          {b.weightKg != null ? (
                            <Badge tone="accent">{b.weightKg} kg</Badge>
                          ) : null}
                          {b.bodyFatPct != null ? (
                            <Badge tone="neutral">{b.bodyFatPct}% bf</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-text-muted">
                          {(() => {
                            const parts = [
                              b.heightCm != null ? `H ${b.heightCm}` : null,
                              b.chestCm != null ? `C ${b.chestCm}` : null,
                              b.waistCm != null ? `W ${b.waistCm}` : null,
                              b.hipsCm != null ? `Hi ${b.hipsCm}` : null,
                              b.armsCm != null ? `A ${b.armsCm}` : null,
                              b.thighsCm != null ? `T ${b.thighsCm}` : null,
                              b.neckCm != null ? `N ${b.neckCm}` : null,
                            ].filter(Boolean);
                            return parts.length > 0
                              ? `${parts.join(' · ')} cm`
                              : 'No tape measures';
                          })()}
                        </p>
                        {b.notes ? (
                          <p className="text-xs text-text-muted">{b.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit measurement"
                          onClick={() => {
                            setEditingBody(b);
                            setBodyOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete measurement"
                          onClick={() => {
                            void deleteBodyMeasurement(b.id).then(() =>
                              addToast('success', 'Measurement deleted'),
                            );
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="runway">
          <motion.div {...fade} className="space-y-4">
            <Card glass>
              <CardHeader>
                <CardTitle>Body composition runway</CardTitle>
              </CardHeader>
              <p className="mb-3 text-sm text-text-muted">
                Photo timeline with weight, waist, and BMI overlay — stored only on this device.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Date"
                  type="date"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={photoWeight}
                  onChange={(e) => setPhotoWeight(e.target.value)}
                />
                <Input
                  label="Waist (cm)"
                  type="number"
                  value={photoWaist}
                  onChange={(e) => setPhotoWaist(e.target.value)}
                />
                <Input
                  label="Photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoBusy(true);
                    void createBodyPhoto({
                      date: photoDate,
                      file,
                      weightKg: parseOptional(photoWeight),
                      waistCm: parseOptional(photoWaist),
                      notes: photoNotes,
                    })
                      .then(() => {
                        addToast('success', 'Photo added to runway');
                        setPhotoNotes('');
                      })
                      .catch((err: Error) =>
                        addToast('danger', err.message || 'Upload failed'),
                      )
                      .finally(() => setPhotoBusy(false));
                  }}
                  disabled={photoBusy}
                />
              </div>
              <Textarea
                className="mt-2"
                label="Notes"
                value={photoNotes}
                onChange={(e) => setPhotoNotes(e.target.value)}
                rows={2}
              />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Waist / BMI / Weight overlay</CardTitle>
              </CardHeader>
              {(photos ?? []).length === 0 ? (
                <EmptyState
                  icon={Scale}
                  title="No runway photos yet"
                  description="Add a photo with weight or waist to chart progress."
                />
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[...(photos ?? [])]
                        .slice()
                        .reverse()
                        .map((p) => ({
                          label: formatDate(p.date, 'MMM d'),
                          weight: p.weightKg,
                          waist: p.waistCm,
                          bmi: p.bmi,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={36} />
                      <Tooltip contentStyle={chartTooltipStyle()} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--color-accent, #f0b429)"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="waist"
                        stroke="#38BDF8"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="bmi"
                        stroke="#34D399"
                        strokeWidth={2}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(photos ?? []).map((p) => (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-[var(--radius-md)] border border-border"
                >
                  <img
                    src={p.imageData}
                    alt={`Body ${p.date}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-medium">{formatDate(p.date)}</p>
                    <p className="text-xs text-text-muted">
                      {p.weightKg != null ? `${p.weightKg} kg` : '—'}
                      {p.waistCm != null ? ` · waist ${p.waistCm}` : ''}
                      {p.bmi != null ? ` · BMI ${p.bmi}` : ''}
                    </p>
                    <Input
                      label="Edit notes"
                      value={p.notes ?? ''}
                      onChange={(e) =>
                        void updateBodyPhoto(p.id, { notes: e.target.value })
                      }
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        void deleteBodyPhoto(p.id).then(() =>
                          addToast('info', 'Photo removed'),
                        )
                      }
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Modal
        open={metricOpen}
        onClose={() => {
          setMetricOpen(false);
          setEditingMetric(null);
        }}
        title={editingMetric ? 'Edit health metrics' : 'Log health metrics'}
        description="Weight, vitals, sleep, water, and macros."
        size="lg"
      >
        <MetricForm
          key={editingMetric?.id ?? 'new-metric'}
          initial={editingMetric ?? undefined}
          onDone={() => {
            setMetricOpen(false);
            setEditingMetric(null);
          }}
        />
      </Modal>
      <Modal
        open={workoutOpen}
        onClose={() => {
          setWorkoutOpen(false);
          setEditingWorkout(null);
        }}
        title={editingWorkout ? 'Edit workout' : 'Add workout'}
        description="Type, duration, calories, and notes."
      >
        <WorkoutForm
          key={editingWorkout?.id ?? 'new-workout'}
          initial={editingWorkout ?? undefined}
          onDone={() => {
            setWorkoutOpen(false);
            setEditingWorkout(null);
          }}
        />
      </Modal>
      <Modal
        open={bodyOpen}
        onClose={() => {
          setBodyOpen(false);
          setEditingBody(null);
        }}
        title={
          editingBody ? 'Edit body measurements' : 'Body measurements'
        }
        description="Tape measures and optional progress notes."
        size="lg"
      >
        <BodyForm
          key={editingBody?.id ?? 'new-body'}
          initial={editingBody ?? undefined}
          onDone={() => {
            setBodyOpen(false);
            setEditingBody(null);
          }}
        />
      </Modal>
    </div>
  );
}
