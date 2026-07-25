import { jsPDF } from 'jspdf';
import { db } from '@/db/database';
import { formatDate } from '@/lib/utils';
import {
  bmiLabel,
  buildWeightPlan,
  calcBmi,
  healthyWeightRange,
  type WeightRegimenId,
} from '@/services/health/bmi';
import { useSettingsStore } from '@/stores/settingsStore';

const NAVY = '#0b1220';
const NAVY_ELEVATED = '#121a2b';
const GOLD = '#f0b429';
const TEXT = '#e8edf7';
const MUTED = '#93a0b8';
const SUCCESS = '#34d399';
const BORDER = '#2a3548';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('./logo-main.jpeg');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('logo read failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawHeaderBar(doc: jsPDF, title: string, pageW: number) {
  doc.setFillColor(...hexToRgb(NAVY));
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setFillColor(...hexToRgb(GOLD));
  doc.rect(0, 28, pageW, 1.6, 'F');
  doc.setTextColor(...hexToRgb(GOLD));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('G4 MISSION CONTROL', 14, 12);
  doc.setTextColor(...hexToRgb(TEXT));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(title, 14, 20);
  doc.setTextColor(...hexToRgb(MUTED));
  doc.setFontSize(8);
  doc.text(formatDate(new Date(), 'MMM d, yyyy · HH:mm'), pageW - 14, 16, {
    align: 'right',
  });
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, page: number, total: number) {
  doc.setDrawColor(...hexToRgb(BORDER));
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 12, pageW - 14, pageH - 12);
  doc.setTextColor(...hexToRgb(MUTED));
  doc.setFontSize(8);
  doc.text('God • Goals • Grinding • Gratitude  ·  Local private export', 14, pageH - 7);
  doc.text(`Page ${page} / ${total}`, pageW - 14, pageH - 7, { align: 'right' });
}

function sectionTitle(doc: jsPDF, y: number, label: string): number {
  doc.setFillColor(...hexToRgb(NAVY_ELEVATED));
  doc.roundedRect(14, y, 182, 8, 1.5, 1.5, 'F');
  doc.setFillColor(...hexToRgb(GOLD));
  doc.rect(14, y, 1.8, 8, 'F');
  doc.setTextColor(...hexToRgb(GOLD));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(label.toUpperCase(), 20, y + 5.5);
  return y + 14;
}

function kv(doc: jsPDF, x: number, y: number, key: string, value: string) {
  doc.setTextColor(...hexToRgb(MUTED));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(key, x, y);
  doc.setTextColor(...hexToRgb(TEXT));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(value, x, y + 5);
}

function ensureSpace(
  doc: jsPDF,
  y: number,
  need: number,
  pageW: number,
  pageH: number,
  title: string,
): number {
  if (y + need < pageH - 18) return y;
  doc.addPage();
  paintPageBg(doc, pageW, pageH);
  drawHeaderBar(doc, title, pageW);
  return 38;
}

function paintPageBg(doc: jsPDF, pageW: number, pageH: number) {
  doc.setFillColor(...hexToRgb(NAVY));
  doc.rect(0, 0, pageW, pageH, 'F');
}

function pill(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) {
  doc.setFillColor(...hexToRgb(NAVY_ELEVATED));
  doc.setDrawColor(...hexToRgb(BORDER));
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setTextColor(...hexToRgb(MUTED));
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + 4, y + 5);
  doc.setTextColor(...hexToRgb(GOLD));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(value, x + 4, y + 13);
}

/** Branded multi-page Mission Report PDF (local data only). */
export async function downloadMissionReportPdf(): Promise<void> {
  const logo = await loadLogoDataUrl();
  const settings = useSettingsStore.getState();

  const [
    profile,
    habits,
    habitLogs,
    goals,
    tasks,
    metrics,
    workouts,
    bodies,
    transactions,
    gratitude,
    journal,
    prayers,
    notifications,
    achievements,
    unlocked,
  ] = await Promise.all([
    db.profiles.toCollection().first(),
    db.habits.filter((h) => !h.archived).toArray(),
    db.habitLogs.toArray(),
    db.goals.toArray(),
    db.tasks.toArray(),
    db.healthMetrics.toArray(),
    db.workouts.toArray(),
    db.bodyMeasurements.toArray(),
    db.transactions.toArray(),
    db.gratitudeEntries.toArray(),
    db.journalEntries.toArray(),
    db.prayerLogs.toArray(),
    db.notifications.orderBy('createdAt').reverse().limit(12).toArray(),
    db.achievements.toArray(),
    db.unlockedAchievements.toArray(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const habitsDoneToday = new Set(
    habitLogs.filter((l) => l.date.slice(0, 10) === today && l.count > 0).map((l) => l.habitId),
  ).size;

  const latestWeight =
    [...bodies, ...metrics]
      .filter((r) => typeof r.weightKg === 'number')
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0]
      ?.weightKg;
  const heightCm =
    settings.profileHeightCm ||
    bodies.find((b) => typeof b.heightCm === 'number')?.heightCm;
  const bmi = calcBmi(latestWeight, heightCm);
  const healthy = heightCm ? healthyWeightRange(heightCm) : null;

  let planSummary = 'Set a target weight in Health to unlock ETA planning.';
  if (latestWeight && settings.targetWeightKg) {
    const plan = buildWeightPlan({
      currentKg: latestWeight,
      targetKg: settings.targetWeightKg,
      heightCm,
      regimenId: settings.weightRegimenId as WeightRegimenId,
      startKg: settings.startWeightKg,
    });
    planSummary =
      plan.direction === 'maintain'
        ? 'Near target — maintain with protein, steps, and sleep.'
        : `${plan.direction === 'lose' ? 'Lose' : 'Gain'} ${Math.abs(plan.deltaKg)} kg via ${plan.regimen.label} (~${plan.weeklyKg} kg/wk) → ~${plan.weeks} weeks (ETA ${formatDate(plan.etaDate, 'MMM d, yyyy')}).`;
  }

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const reportTitle = 'Mission Report';

  // —— Cover ——
  paintPageBg(doc, pageW, pageH);
  doc.setFillColor(...hexToRgb(GOLD));
  doc.rect(0, 0, pageW, 4, 'F');

  if (logo) {
    try {
      doc.addImage(logo, 'JPEG', pageW / 2 - 22, 28, 44, 44);
    } catch {
      /* ignore logo decode issues */
    }
  }

  doc.setTextColor(...hexToRgb(GOLD));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('G4 MISSION CONTROL', pageW / 2, 88, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(TEXT));
  doc.text('God  •  Goals  •  Grinding  •  Gratitude', pageW / 2, 98, {
    align: 'center',
  });

  doc.setFillColor(...hexToRgb(NAVY_ELEVATED));
  doc.roundedRect(28, 112, pageW - 56, 42, 3, 3, 'F');
  doc.setDrawColor(...hexToRgb(GOLD));
  doc.setLineWidth(0.4);
  doc.roundedRect(28, 112, pageW - 56, 42, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(GOLD));
  doc.text('Personal Mission Report', pageW / 2, 126, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(TEXT));
  const name = profile?.displayName || profile?.username || 'Operator';
  doc.text(`Prepared for ${name}`, pageW / 2, 136, { align: 'center' });
  doc.setTextColor(...hexToRgb(MUTED));
  doc.text(formatDate(new Date(), 'EEEE, MMMM d, yyyy'), pageW / 2, 144, {
    align: 'center',
  });

  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(MUTED));
  doc.text(
    'Offline-first · Stored on this device · Private export',
    pageW / 2,
    pageH - 24,
    { align: 'center' },
  );

  // —— Snapshot ——
  doc.addPage();
  paintPageBg(doc, pageW, pageH);
  drawHeaderBar(doc, reportTitle, pageW);
  let y = 38;
  y = sectionTitle(doc, y, 'Mission snapshot');

  const pillW = 42;
  const gap = 4;
  const startX = 14;
  const pills = [
    ['Habits today', `${habitsDoneToday}/${habits.length}`],
    ['Active goals', String(goals.filter((g) => g.status === 'active').length)],
    ['Open tasks', String(tasks.filter((t) => t.status !== 'done').length)],
    ['Workouts', String(workouts.length)],
  ] as const;
  pills.forEach(([label, value], i) => {
    pill(doc, startX + i * (pillW + gap), y, pillW, 18, label, value);
  });
  y += 26;

  const pills2 = [
    ['Weight', latestWeight != null ? `${latestWeight} kg` : '—'],
    ['BMI', bmi != null ? `${bmi}` : '—'],
    ['Gratitude', String(gratitude.length)],
    ['Prayers logged', String(prayers.length)],
  ] as const;
  pills2.forEach(([label, value], i) => {
    pill(doc, startX + i * (pillW + gap), y, pillW, 18, label, value);
  });
  y += 28;

  y = sectionTitle(doc, y, 'Health & BMI');
  kv(doc, 18, y, 'Classification', bmi != null ? bmiLabel(bmi) : 'Log weight + height');
  kv(
    doc,
    78,
    y,
    'Healthy range',
    healthy ? `${healthy.minKg}–${healthy.maxKg} kg` : '—',
  );
  kv(doc, 148, y, 'Height', heightCm != null ? `${heightCm} cm` : '—');
  y += 16;

  doc.setFillColor(...hexToRgb(NAVY_ELEVATED));
  doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
  doc.setTextColor(...hexToRgb(GOLD));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('WEIGHT PLAN', 20, y + 7);
  doc.setTextColor(...hexToRgb(TEXT));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const planLines = doc.splitTextToSize(planSummary, 170);
  doc.text(planLines, 20, y + 14);
  y += 36;

  y = sectionTitle(doc, y, 'Finance pulse');
  kv(doc, 18, y, 'Income logged', `${settings.currency} ${income.toLocaleString()}`);
  kv(doc, 90, y, 'Expenses logged', `${settings.currency} ${expense.toLocaleString()}`);
  kv(
    doc,
    160,
    y,
    'Net',
    `${settings.currency} ${(income - expense).toLocaleString()}`,
  );
  y += 18;

  y = sectionTitle(doc, y, 'Achievements');
  doc.setTextColor(...hexToRgb(TEXT));
  doc.setFontSize(10);
  doc.text(`${unlocked.length} unlocked of ${achievements.length} defined`, 18, y);
  y += 10;

  // —— Habits & Goals ——
  y = ensureSpace(doc, y, 40, pageW, pageH, reportTitle);
  y = sectionTitle(doc, y, 'Habits');
  doc.setFontSize(8);
  for (const h of habits.slice(0, 18)) {
    y = ensureSpace(doc, y, 6, pageW, pageH, reportTitle);
    const done = habitsDoneToday && habitLogs.some(
      (l) => l.habitId === h.id && l.date.slice(0, 10) === today && l.count > 0,
    );
    doc.setTextColor(...hexToRgb(done ? SUCCESS : MUTED));
    doc.text(done ? '●' : '○', 18, y);
    doc.setTextColor(...hexToRgb(TEXT));
    doc.text(h.name, 24, y);
    y += 5;
  }
  if (habits.length > 18) {
    doc.setTextColor(...hexToRgb(MUTED));
    doc.text(`+ ${habits.length - 18} more habits in the app`, 18, y);
    y += 8;
  } else {
    y += 4;
  }

  y = ensureSpace(doc, y, 30, pageW, pageH, reportTitle);
  y = sectionTitle(doc, y, 'Goals');
  for (const g of goals.slice(0, 12)) {
    y = ensureSpace(doc, y, 8, pageW, pageH, reportTitle);
    doc.setTextColor(...hexToRgb(TEXT));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(g.title, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(GOLD));
    doc.text(`${g.progress}% · ${g.status}`, 140, y);
    y += 6;
  }

  // —— Notifications ——
  y = ensureSpace(doc, y, 30, pageW, pageH, reportTitle);
  y = sectionTitle(doc, y, 'Recent notifications');
  if (notifications.length === 0) {
    doc.setTextColor(...hexToRgb(MUTED));
    doc.setFontSize(9);
    doc.text('No notifications stored yet.', 18, y);
    y += 8;
  } else {
    for (const n of notifications) {
      y = ensureSpace(doc, y, 12, pageW, pageH, reportTitle);
      doc.setTextColor(...hexToRgb(GOLD));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(n.title, 18, y);
      doc.setTextColor(...hexToRgb(MUTED));
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(n.createdAt, 'MMM d'), 170, y, { align: 'right' });
      y += 4;
      doc.setTextColor(...hexToRgb(TEXT));
      doc.setFontSize(8);
      const body = doc.splitTextToSize(n.body, 170);
      doc.text(body.slice(0, 2), 18, y);
      y += Math.min(body.length, 2) * 4 + 3;
    }
  }

  // —— Closing ——
  y = ensureSpace(doc, y, 40, pageW, pageH, reportTitle);
  y = sectionTitle(doc, y, 'Journal & spiritual');
  kv(doc, 18, y, 'Journal entries', String(journal.length));
  kv(doc, 90, y, 'Gratitude notes', String(gratitude.length));
  kv(doc, 160, y, 'Prayer logs', String(prayers.length));
  y += 16;

  doc.setFillColor(...hexToRgb(NAVY_ELEVATED));
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
  doc.setTextColor(...hexToRgb(GOLD));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OPERATOR NOTE', 20, y + 7);
  doc.setTextColor(...hexToRgb(TEXT));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'This PDF is a snapshot of local IndexedDB data. Keep grinding with purpose.',
    20,
    y + 14,
  );

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) drawFooter(doc, pageW, pageH, i, total);
  }

  const stamp = formatDate(new Date(), 'yyyy-MM-dd-HHmm');
  doc.save(`g4-mission-report-${stamp}.pdf`);
}
