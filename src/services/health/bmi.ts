/** WHO adult BMI classification + weight-goal planning (local, educational). */

export type BmiCategoryId =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese_i'
  | 'obese_ii'
  | 'obese_iii';

export type WeightRegimenId = 'gentle' | 'steady' | 'focused' | 'athletic';

export interface BmiRange {
  id: BmiCategoryId;
  label: string;
  min: number;
  max: number;
  color: string;
  advice: string;
}

/** WHO adult BMI cut-points (current standard bands). */
export const BMI_RANGES: BmiRange[] = [
  {
    id: 'underweight',
    label: 'Underweight',
    min: 0,
    max: 18.5,
    color: '#38BDF8',
    advice:
      'Prioritize strength training, protein-rich meals, and consistent sleep. Gain slowly if your clinician agrees.',
  },
  {
    id: 'normal',
    label: 'Healthy range',
    min: 18.5,
    max: 25,
    color: '#34D399',
    advice:
      'Maintain with protein-forward meals, daily steps, and 2–4 training sessions weekly. Protect sleep and stress.',
  },
  {
    id: 'overweight',
    label: 'Overweight',
    min: 25,
    max: 30,
    color: '#F0B429',
    advice:
      'Create a modest calorie deficit, walk daily, and lift 2–3×/week. Aim for slow fat loss so muscle stays.',
  },
  {
    id: 'obese_i',
    label: 'Obesity class I',
    min: 30,
    max: 35,
    color: '#F97316',
    advice:
      'Focus on habit stacking: protein at each meal, 7–10k steps, strength work, and fewer ultra-processed snacks.',
  },
  {
    id: 'obese_ii',
    label: 'Obesity class II',
    min: 35,
    max: 40,
    color: '#EF4444',
    advice:
      'Start with walking + resistance bands/bodyweight, high-protein plates, and sleep. Consider professional guidance.',
  },
  {
    id: 'obese_iii',
    label: 'Obesity class III',
    min: 40,
    max: 100,
    color: '#DC2626',
    advice:
      'Safety first: low-impact movement, protein, hydration, and medical support. Small weekly wins compound.',
  },
];

export const REGIMENS: Record<
  WeightRegimenId,
  {
    id: WeightRegimenId;
    label: string;
    weeklyKg: number;
    summary: string;
    dailyPlan: string[];
  }
> = {
  gentle: {
    id: 'gentle',
    label: 'Gentle',
    weeklyKg: 0.25,
    summary: '~0.25 kg/week — sustainable lifestyle pace',
    dailyPlan: [
      'Protein at every meal (~1.6–2.2 g/kg goal weight)',
      '7,000+ steps or 30 min brisk walk',
      '2 strength sessions / week',
      'Sleep 7–8 hours; water 2.5–3.5 L',
    ],
  },
  steady: {
    id: 'steady',
    label: 'Steady',
    weeklyKg: 0.5,
    summary: '~0.5 kg/week — classic evidence-based pace',
    dailyPlan: [
      '~300–500 kcal daily deficit (food quality first)',
      '8,000–10,000 steps',
      '3 strength sessions / week + 1 cardio',
      'Limit liquid calories; high-fiber veggies daily',
    ],
  },
  focused: {
    id: 'focused',
    label: 'Focused',
    weeklyKg: 0.75,
    summary: '~0.75 kg/week — disciplined short campaign',
    dailyPlan: [
      '~500–750 kcal deficit with meal structure',
      '10,000+ steps most days',
      '3–4 strength sessions + 1–2 cardio',
      'Track intake 5–6 days/week; weekly weigh-in',
    ],
  },
  athletic: {
    id: 'athletic',
    label: 'Athletic cut',
    weeklyKg: 1,
    summary: '~1.0 kg/week — aggressive; use short blocks only',
    dailyPlan: [
      'Strict meal plan + high protein; refeed 1 day/week',
      'Training 5–6 days (strength + conditioning)',
      'Steps 10–12k; sleep non-negotiable',
      'Not for beginners — stop if energy crashes',
    ],
  },
};

export function calcBmi(weightKg?: number, heightCm?: number): number | null {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function classifyBmi(bmi: number): BmiRange {
  return (
    BMI_RANGES.find((r) => bmi >= r.min && bmi < r.max) ??
    BMI_RANGES[BMI_RANGES.length - 1]!
  );
}

export function bmiLabel(bmi: number): string {
  return classifyBmi(bmi).label;
}

/** Healthy weight band for height using BMI 18.5–24.9. */
export function healthyWeightRange(heightCm: number): { minKg: number; maxKg: number } | null {
  if (!heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  const minKg = Math.round(18.5 * m * m * 10) / 10;
  const maxKg = Math.round(24.9 * m * m * 10) / 10;
  return { minKg, maxKg };
}

export function weightForBmi(heightCm: number, bmi: number): number {
  const m = heightCm / 100;
  return Math.round(bmi * m * m * 10) / 10;
}

export interface WeightPlanResult {
  direction: 'lose' | 'gain' | 'maintain';
  deltaKg: number;
  weeklyKg: number;
  weeks: number;
  days: number;
  etaDate: string;
  targetBmi: number | null;
  currentBmi: number | null;
  category: BmiRange | null;
  regimen: (typeof REGIMENS)[WeightRegimenId];
  tips: string[];
  progressPct: number;
  healthyRange: { minKg: number; maxKg: number } | null;
  approxDailyKcalAdjust: number;
}

export function buildWeightPlan(input: {
  currentKg: number;
  targetKg: number;
  heightCm?: number;
  regimenId: WeightRegimenId;
  startKg?: number;
}): WeightPlanResult {
  const regimen = REGIMENS[input.regimenId] ?? REGIMENS.steady;
  const delta = Math.round((input.currentKg - input.targetKg) * 10) / 10;
  const abs = Math.abs(delta);
  const direction: WeightPlanResult['direction'] =
    abs < 0.3 ? 'maintain' : delta > 0 ? 'lose' : 'gain';

  const weeklyKg = regimen.weeklyKg;
  const weeks = direction === 'maintain' ? 0 : Math.ceil(abs / weeklyKg);
  const days = weeks * 7;
  const eta = new Date();
  eta.setDate(eta.getDate() + days);

  const currentBmi = calcBmi(input.currentKg, input.heightCm);
  const targetBmi = calcBmi(input.targetKg, input.heightCm);
  const category = currentBmi != null ? classifyBmi(currentBmi) : null;
  const healthyRange =
    input.heightCm != null ? healthyWeightRange(input.heightCm) : null;

  const start = input.startKg ?? input.currentKg;
  const total = Math.abs(start - input.targetKg);
  const done = Math.abs(start - input.currentKg);
  const progressPct =
    total <= 0.01 ? 100 : Math.min(100, Math.max(0, Math.round((done / total) * 100)));

  // ~7700 kcal ≈ 1 kg body fat (rule of thumb)
  const approxDailyKcalAdjust =
    direction === 'maintain' ? 0 : Math.round((weeklyKg * 7700) / 7) * (direction === 'lose' ? -1 : 1);

  const tips: string[] = [];
  if (direction === 'lose') {
    tips.push(
      `To lose ~${weeklyKg} kg/week, aim near a ${Math.abs(approxDailyKcalAdjust)} kcal daily deficit.`,
    );
    tips.push(...regimen.dailyPlan);
    if (category) tips.push(category.advice);
    if (weeklyKg >= 1) {
      tips.push('Aggressive pace: use for 2–4 weeks max, then switch to Steady.');
    }
  } else if (direction === 'gain') {
    tips.push(
      `To gain ~${weeklyKg} kg/week, add about ${Math.abs(approxDailyKcalAdjust)} kcal/day with protein + strength.`,
    );
    tips.push('Train compound lifts 3×/week; sleep and progressive overload matter most.');
  } else {
    tips.push('You’re near target — maintain with protein, steps, and weekly weigh-ins.');
    if (category) tips.push(category.advice);
  }

  return {
    direction,
    deltaKg: delta,
    weeklyKg,
    weeks,
    days,
    etaDate: eta.toISOString().slice(0, 10),
    targetBmi,
    currentBmi,
    category,
    regimen,
    tips,
    progressPct,
    healthyRange,
    approxDailyKcalAdjust,
  };
}

export function bmiGaugePosition(bmi: number): number {
  // Map BMI 15–40 onto 0–100%
  const clamped = Math.min(40, Math.max(15, bmi));
  return ((clamped - 15) / 25) * 100;
}
