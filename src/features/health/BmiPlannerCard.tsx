import { Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  Select,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  BMI_RANGES,
  bmiGaugePosition,
  buildWeightPlan,
  classifyBmi,
  REGIMENS,
  type WeightRegimenId,
} from '@/services/health/bmi';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

export function BmiPlannerCard({
  currentWeightKg,
  heightCm,
  bmi,
}: {
  currentWeightKg?: number;
  heightCm?: number;
  bmi?: number | null;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const profileHeightCm = useSettingsStore((s) => s.profileHeightCm);
  const targetWeightKg = useSettingsStore((s) => s.targetWeightKg);
  const startWeightKg = useSettingsStore((s) => s.startWeightKg);
  const weightRegimenId = useSettingsStore((s) => s.weightRegimenId);
  const setProfileHeightCm = useSettingsStore((s) => s.setProfileHeightCm);
  const setTargetWeightKg = useSettingsStore((s) => s.setTargetWeightKg);
  const setStartWeightKg = useSettingsStore((s) => s.setStartWeightKg);
  const setWeightRegimenId = useSettingsStore((s) => s.setWeightRegimenId);

  const [heightDraft, setHeightDraft] = useState(
    String(profileHeightCm ?? heightCm ?? ''),
  );
  const [targetDraft, setTargetDraft] = useState(
    String(targetWeightKg ?? ''),
  );
  const [startDraft, setStartDraft] = useState(String(startWeightKg ?? ''));

  const effectiveHeight = profileHeightCm ?? heightCm;
  const category = bmi != null ? classifyBmi(bmi) : null;

  const plan = useMemo(() => {
    if (currentWeightKg == null || targetWeightKg == null) return null;
    return buildWeightPlan({
      currentKg: currentWeightKg,
      targetKg: targetWeightKg,
      heightCm: effectiveHeight,
      regimenId: weightRegimenId,
      startKg: startWeightKg,
    });
  }, [
    currentWeightKg,
    targetWeightKg,
    effectiveHeight,
    weightRegimenId,
    startWeightKg,
  ]);

  function savePlan() {
    const h = Number(heightDraft);
    const t = Number(targetDraft);
    const s = startDraft.trim() === '' ? undefined : Number(startDraft);
    if (!Number.isFinite(h) || h < 100 || h > 250) {
      addToast('warning', 'Enter a valid height in cm (100–250).');
      return;
    }
    if (!Number.isFinite(t) || t < 30 || t > 400) {
      addToast('warning', 'Enter a valid target weight in kg.');
      return;
    }
    setProfileHeightCm(h);
    setTargetWeightKg(t);
    if (s != null && Number.isFinite(s)) setStartWeightKg(s);
    else if (currentWeightKg != null && startWeightKg == null) {
      setStartWeightKg(currentWeightKg);
    }
    addToast('success', 'BMI plan saved on this device.');
  }

  return (
    <Card glass className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="size-4 text-accent" />
          <CardTitle>BMI & weight mission</CardTitle>
        </div>
        {category ? <Badge tone="accent">{category.label}</Badge> : null}
      </CardHeader>

      {bmi != null ? (
        <div className="mb-4">
          <div className="mb-1 flex items-end justify-between">
            <p className="font-display text-3xl font-bold text-accent">{bmi}</p>
            <p className="text-xs text-text-muted">WHO adult BMI</p>
          </div>
          <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-surface">
            <div className="absolute inset-0 flex">
              {BMI_RANGES.map((r) => (
                <div
                  key={r.id}
                  className="h-full flex-1"
                  style={{ background: r.color, opacity: 0.55 }}
                  title={`${r.label} (${r.min}–${r.max})`}
                />
              ))}
            </div>
            <div
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent shadow"
              style={{ left: `${bmiGaugePosition(bmi)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-text-muted">
            <span>&lt;18.5</span>
            <span>18.5–25</span>
            <span>25–30</span>
            <span>30+</span>
          </div>
          {plan?.healthyRange ? (
            <p className="mt-2 text-xs text-text-muted">
              Healthy weight for your height:{' '}
              <span className="font-medium text-text">
                {plan.healthyRange.minKg}–{plan.healthyRange.maxKg} kg
              </span>
            </p>
          ) : null}
          {category ? (
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              {category.advice}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mb-4 text-sm text-text-muted">
          Log your weight and set height below to unlock BMI ranges and a goal timeline.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Height (cm)"
          type="number"
          value={heightDraft}
          onChange={(e) => setHeightDraft(e.target.value)}
          placeholder="175"
        />
        <Input
          label="Target weight (kg)"
          type="number"
          value={targetDraft}
          onChange={(e) => setTargetDraft(e.target.value)}
          placeholder="72"
        />
        <Input
          label="Start weight (kg)"
          type="number"
          value={startDraft}
          onChange={(e) => setStartDraft(e.target.value)}
          placeholder={currentWeightKg != null ? String(currentWeightKg) : '80'}
        />
        <Select
          label="Regimen"
          value={weightRegimenId}
          onChange={(e) => setWeightRegimenId(e.target.value as WeightRegimenId)}
          options={Object.values(REGIMENS).map((r) => ({
            value: r.id,
            label: `${r.label} (~${r.weeklyKg} kg/wk)`,
          }))}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={savePlan}>
          Save plan
        </Button>
      </div>

      {plan ? (
        <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-border bg-bg/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                plan.direction === 'lose'
                  ? 'warning'
                  : plan.direction === 'gain'
                    ? 'neutral'
                    : 'success'
              }
            >
              {plan.direction === 'lose'
                ? `Lose ${Math.abs(plan.deltaKg)} kg`
                : plan.direction === 'gain'
                  ? `Gain ${Math.abs(plan.deltaKg)} kg`
                  : 'Maintain'}
            </Badge>
            <Badge tone="accent">{plan.regimen.label}</Badge>
            {plan.weeks > 0 ? (
              <span className="text-xs text-text-muted">
                ~{plan.weeks} weeks · ETA {formatDate(plan.etaDate, 'MMM d, yyyy')}
              </span>
            ) : null}
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-text-muted">
              <span>Plan progress</span>
              <span>{plan.progressPct}%</span>
            </div>
            <Progress value={plan.progressPct} />
          </div>

          <p className="text-sm text-text">
            {plan.direction === 'maintain'
              ? 'You’re within ~0.3 kg of target. Lock in habits and re-check weekly.'
              : `At ~${plan.weeklyKg} kg/week (${plan.approxDailyKcalAdjust} kcal/day adjust), expect about ${plan.days} days to reach ${targetWeightKg} kg.`}
          </p>

          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-accent uppercase">
              What to do
            </p>
            <ul className="space-y-1 text-xs leading-relaxed text-text-muted">
              {plan.tips.slice(0, 5).map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-accent">▸</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {currentWeightKg != null ? (
            <p className="text-[11px] text-text-muted">
              Current {currentWeightKg} kg
              {plan.targetBmi != null ? ` · Target BMI ~${plan.targetBmi}` : ''}
              {plan.currentBmi != null ? ` · Now BMI ${plan.currentBmi}` : ''}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
