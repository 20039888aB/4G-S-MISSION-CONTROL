import { useLiveQuery } from 'dexie-react-hooks';
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { db } from '@/db/database';
import { percent, uid } from '@/lib/utils';
import type {
  Asset,
  Budget,
  FinanceCategory,
  FinanceTransaction,
  Liability,
  SavingsGoal,
  TransactionType,
} from '@/types';

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  'salary',
  'business',
  'freelance',
  'gift',
  'food',
  'transport',
  'housing',
  'utilities',
  'health',
  'education',
  'entertainment',
  'savings',
  'investment',
  'tithe',
  'other',
];

export const INCOME_CATEGORIES: FinanceCategory[] = [
  'salary',
  'business',
  'freelance',
  'gift',
  'investment',
  'other',
];

export const EXPENSE_CATEGORIES: FinanceCategory[] = [
  'food',
  'transport',
  'housing',
  'utilities',
  'health',
  'education',
  'entertainment',
  'savings',
  'investment',
  'tithe',
  'other',
];

export function monthKey(date = new Date()): string {
  return format(date, 'yyyy-MM');
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  currency: string;
  category: FinanceCategory;
  description?: string;
  date: string;
  account?: string;
  tags?: string[];
};

export type BudgetInput = {
  name: string;
  category: FinanceCategory;
  amount: number;
  currency: string;
  period?: Budget['period'];
  startDate?: string;
  endDate?: string;
};

export type SavingsGoalInput = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
};

export type AssetInput = {
  name: string;
  category: string;
  value: number;
  currency: string;
  notes?: string;
};

export type LiabilityInput = {
  name: string;
  category: string;
  balance: number;
  currency: string;
  interestRate?: number;
  dueDate?: string;
  notes?: string;
};

function byDateDesc(a: { date: string; createdAt: string }, b: typeof a) {
  const d = b.date.localeCompare(a.date);
  if (d !== 0) return d;
  return b.createdAt.localeCompare(a.createdAt);
}

export function useTransactionsLive(filterMonth?: string) {
  return useLiveQuery(async () => {
    const rows = await db.transactions.toArray();
    const filtered = filterMonth
      ? rows.filter((t) => t.date.startsWith(filterMonth))
      : rows;
    return filtered.sort(byDateDesc);
  }, [filterMonth ?? 'all']);
}

export function useBudgetsLive() {
  return useLiveQuery(async () => {
    const rows = await db.budgets.toArray();
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

export function useSavingsGoalsLive() {
  return useLiveQuery(async () => {
    const rows = await db.savingsGoals.toArray();
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

export function useAssetsLive() {
  return useLiveQuery(async () => {
    const rows = await db.assets.toArray();
    return rows.sort((a, b) => b.value - a.value);
  }, []);
}

export function useLiabilitiesLive() {
  return useLiveQuery(async () => {
    const rows = await db.liabilities.toArray();
    return rows.sort((a, b) => b.balance - a.balance);
  }, []);
}

export interface BudgetWithSpend extends Budget {
  spent: number;
  remaining: number;
  pct: number;
}

export function useBudgetsWithSpend(month = monthKey()) {
  return useLiveQuery(async () => {
    const [budgets, transactions] = await Promise.all([
      db.budgets.toArray(),
      db.transactions.filter((t) => t.date.startsWith(month)).toArray(),
    ]);

    const monthly = budgets.filter((b) => b.period === 'monthly');
    const result: BudgetWithSpend[] = monthly.map((budget) => {
      const spent = transactions
        .filter(
          (t) => t.type === 'expense' && t.category === budget.category,
        )
        .reduce((s, t) => s + t.amount, 0);
      const remaining = budget.amount - spent;
      return {
        ...budget,
        spent,
        remaining,
        pct: percent(spent, Math.max(budget.amount, 1)),
      };
    });

    return result.sort((a, b) => b.pct - a.pct);
  }, [month]);
}

export function estimateSavingsEta(
  goal: SavingsGoal,
  monthlyContribution?: number,
): string | null {
  if (goal.currentAmount >= goal.targetAmount) return 'Reached';
  const remaining = goal.targetAmount - goal.currentAmount;

  if (goal.targetDate) {
    const days = differenceInCalendarDays(
      parseISO(goal.targetDate),
      new Date(),
    );
    if (days <= 0) return 'Past target date';
    return `${days} days to target`;
  }

  if (monthlyContribution && monthlyContribution > 0) {
    const months = Math.ceil(remaining / monthlyContribution);
    const eta = addDays(new Date(), months * 30);
    return `~${months} mo (${format(eta, 'MMM yyyy')})`;
  }

  return null;
}

export function useFinanceOverview(month = monthKey()) {
  return useLiveQuery(async () => {
    const [transactions, assets, liabilities, savingsGoals] =
      await Promise.all([
        db.transactions.filter((t) => t.date.startsWith(month)).toArray(),
        db.assets.toArray(),
        db.liabilities.toArray(),
        db.savingsGoals.toArray(),
      ]);

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const netCashflow = income - expenses;

    const assetTotal = assets.reduce((s, a) => s + a.value, 0);
    const liabilityTotal = liabilities.reduce((s, l) => s + l.balance, 0);
    const netWorth = assetTotal - liabilityTotal;

    const savingsTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
    const savingsCurrent = savingsGoals.reduce(
      (s, g) => s + g.currentAmount,
      0,
    );
    const savingsPct =
      savingsTarget > 0 ? percent(savingsCurrent, savingsTarget) : 0;

    // Daily cash flow for the month
    const monthStart = startOfMonth(parseISO(`${month}-01`));
    const daysInView = Math.min(
      differenceInCalendarDays(new Date(), monthStart) + 1,
      31,
    );
    const cashFlowByDay: { date: string; income: number; expense: number; net: number }[] =
      [];
    let runningIncome = 0;
    let runningExpense = 0;
    for (let i = 0; i < daysInView; i++) {
      const d = addDays(monthStart, i);
      const key = format(d, 'yyyy-MM-dd');
      const dayTx = transactions.filter((t) => t.date.startsWith(key));
      runningIncome += dayTx
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      runningExpense += dayTx
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      cashFlowByDay.push({
        date: key,
        income: runningIncome,
        expense: runningExpense,
        net: runningIncome - runningExpense,
      });
    }

    return {
      income,
      expenses,
      netCashflow,
      assetTotal,
      liabilityTotal,
      netWorth,
      savingsTarget,
      savingsCurrent,
      savingsPct,
      cashFlowByDay,
      transactionCount: transactions.length,
    };
  }, [month]);
}

export async function createTransaction(
  input: TransactionInput,
): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: FinanceTransaction = {
    id,
    type: input.type,
    amount: Math.abs(input.amount),
    currency: input.currency,
    category: input.category,
    description: input.description?.trim() || undefined,
    date: input.date.slice(0, 10),
    account: input.account?.trim() || undefined,
    tags: input.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.transactions.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'transaction_created',
    summary: `${row.type === 'income' ? 'Income' : row.type === 'expense' ? 'Expense' : 'Transfer'}: ${row.amount} ${row.currency}`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.transactions.update(id, {
    type: input.type,
    amount: Math.abs(input.amount),
    currency: input.currency,
    category: input.category,
    description: input.description?.trim() || undefined,
    date: input.date.slice(0, 10),
    account: input.account?.trim() || undefined,
    tags: input.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
    updatedAt: now,
  });
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'transaction_updated',
    summary: `Updated ${input.type}: ${Math.abs(input.amount)} ${input.currency}`,
    entityId: id,
    createdAt: now,
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'transaction_deleted',
    summary: 'Deleted a transaction',
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function createBudget(input: BudgetInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: Budget = {
    id,
    name: input.name.trim(),
    category: input.category,
    amount: Math.abs(input.amount),
    currency: input.currency,
    period: input.period ?? 'monthly',
    startDate: input.startDate ?? todayKey(),
    endDate: input.endDate,
    createdAt: now,
    updatedAt: now,
  };
  await db.budgets.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'budget_created',
    summary: `Budget “${row.name}” (${row.amount} ${row.currency})`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateBudget(
  id: string,
  input: BudgetInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.budgets.update(id, {
    name: input.name.trim(),
    category: input.category,
    amount: Math.abs(input.amount),
    currency: input.currency,
    period: input.period ?? 'monthly',
    startDate: input.startDate ?? todayKey(),
    endDate: input.endDate,
    updatedAt: now,
  });
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'budget_updated',
    summary: `Updated budget “${input.name.trim()}”`,
    entityId: id,
    createdAt: now,
  });
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id);
}

export async function createSavingsGoal(
  input: SavingsGoalInput,
): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: SavingsGoal = {
    id,
    name: input.name.trim(),
    targetAmount: Math.abs(input.targetAmount),
    currentAmount: Math.max(0, input.currentAmount),
    currency: input.currency,
    targetDate: input.targetDate || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.savingsGoals.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'savings_created',
    summary: `Savings goal “${row.name}”`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateSavingsProgress(
  id: string,
  currentAmount: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db.savingsGoals.update(id, {
    currentAmount: Math.max(0, currentAmount),
    updatedAt: now,
  });
}

export async function updateSavingsGoal(
  id: string,
  input: SavingsGoalInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.savingsGoals.update(id, {
    name: input.name.trim(),
    targetAmount: Math.abs(input.targetAmount),
    currentAmount: Math.max(0, input.currentAmount),
    currency: input.currency,
    targetDate: input.targetDate || undefined,
    updatedAt: now,
  });
  await db.activityLogs.add({
    id: uid(),
    entity: 'finance',
    action: 'savings_updated',
    summary: `Updated savings goal “${input.name.trim()}”`,
    entityId: id,
    createdAt: now,
  });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await db.savingsGoals.delete(id);
}

export async function createAsset(input: AssetInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: Asset = {
    id,
    name: input.name.trim(),
    category: input.category.trim() || 'other',
    value: Math.abs(input.value),
    currency: input.currency,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.assets.add(row);
  return id;
}

export async function updateAsset(
  id: string,
  input: AssetInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.assets.update(id, {
    name: input.name.trim(),
    category: input.category.trim() || 'other',
    value: Math.abs(input.value),
    currency: input.currency,
    notes: input.notes?.trim() || undefined,
    updatedAt: now,
  });
}

export async function deleteAsset(id: string): Promise<void> {
  await db.assets.delete(id);
}

export async function createLiability(input: LiabilityInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: Liability = {
    id,
    name: input.name.trim(),
    category: input.category.trim() || 'other',
    balance: Math.abs(input.balance),
    currency: input.currency,
    interestRate: input.interestRate,
    dueDate: input.dueDate || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.liabilities.add(row);
  return id;
}

export async function updateLiability(
  id: string,
  input: LiabilityInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.liabilities.update(id, {
    name: input.name.trim(),
    category: input.category.trim() || 'other',
    balance: Math.abs(input.balance),
    currency: input.currency,
    interestRate: input.interestRate,
    dueDate: input.dueDate || undefined,
    notes: input.notes?.trim() || undefined,
    updatedAt: now,
  });
}

export async function deleteLiability(id: string): Promise<void> {
  await db.liabilities.delete(id);
}
