import { motion } from 'framer-motion';
import {
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
  Progress,
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
  categoryLabel,
  createAsset,
  createBudget,
  createLiability,
  createSavingsGoal,
  createTransaction,
  deleteAsset,
  deleteBudget,
  deleteLiability,
  deleteSavingsGoal,
  deleteTransaction,
  estimateSavingsEta,
  EXPENSE_CATEGORIES,
  FINANCE_CATEGORIES,
  INCOME_CATEGORIES,
  monthKey,
  todayKey,
  updateAsset,
  updateBudget,
  updateLiability,
  updateSavingsGoal,
  updateSavingsProgress,
  updateTransaction,
  useAssetsLive,
  useBudgetsWithSpend,
  useFinanceOverview,
  useLiabilitiesLive,
  useSavingsGoalsLive,
  useTransactionsLive,
} from '@/features/finance/hooks';
import { formatCurrency, formatDate, percent } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import type {
  Asset,
  Budget,
  FinanceCategory,
  FinanceTransaction,
  Liability,
  SavingsGoal,
  TransactionType,
} from '@/types';

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

function TransactionForm({
  currency,
  initial,
  onDone,
}: {
  currency: string;
  initial?: FinanceTransaction;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : '',
  );
  const [category, setCategory] = useState<FinanceCategory>(
    initial?.category ?? 'food',
  );
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);

  const categories =
    type === 'income'
      ? INCOME_CATEGORIES
      : type === 'expense'
        ? EXPENSE_CATEGORIES
        : FINANCE_CATEGORIES;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    const input = {
      type,
      amount: value,
      currency: initial?.currency ?? currency,
      category,
      date,
      description,
    };
    try {
      if (initial) {
        await updateTransaction(initial.id, input);
        addToast('success', 'Transaction updated');
      } else {
        await createTransaction(input);
        addToast('success', 'Transaction saved');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Select
        label="Type"
        value={type}
        onChange={(e) => {
          const next = e.target.value as TransactionType;
          setType(next);
          setCategory(
            next === 'income'
              ? 'salary'
              : next === 'expense'
                ? 'food'
                : 'other',
          );
        }}
        options={[
          { value: 'income', label: 'Income' },
          { value: 'expense', label: 'Expense' },
          { value: 'transfer', label: 'Transfer' },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={`Amount (${currency})`}
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as FinanceCategory)}
        options={categories.map((c) => ({
          value: c,
          label: categoryLabel(c),
        }))}
      />
      <Textarea
        label="Notes"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update transaction' : 'Save transaction'}
        </Button>
      </div>
    </form>
  );
}

function BudgetForm({
  currency,
  initial,
  onDone,
}: {
  currency: string;
  initial?: Budget;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<FinanceCategory>(
    initial?.category ?? 'food',
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    const input = {
      name,
      category,
      amount: value,
      currency: initial?.currency ?? currency,
      period: initial?.period ?? ('monthly' as const),
      startDate: initial?.startDate ?? todayKey(),
      endDate: initial?.endDate,
    };
    try {
      if (initial) {
        await updateBudget(initial.id, input);
        addToast('success', 'Budget updated');
      } else {
        await createBudget(input);
        addToast('success', 'Budget created');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Groceries"
        required
      />
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as FinanceCategory)}
        options={EXPENSE_CATEGORIES.map((c) => ({
          value: c,
          label: categoryLabel(c),
        }))}
      />
      <Input
        label={`Monthly limit (${currency})`}
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update budget' : 'Create budget'}
        </Button>
      </div>
    </form>
  );
}

function SavingsForm({
  currency,
  initial,
  onDone,
}: {
  currency: string;
  initial?: SavingsGoal;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [name, setName] = useState(initial?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(
    initial ? String(initial.targetAmount) : '',
  );
  const [currentAmount, setCurrentAmount] = useState(
    initial ? String(initial.currentAmount) : '0',
  );
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const target = Number(targetAmount);
    const current = Number(currentAmount || 0);
    if (!name.trim() || !Number.isFinite(target) || target <= 0) return;
    setSaving(true);
    const input = {
      name,
      targetAmount: target,
      currentAmount: Number.isFinite(current) ? current : 0,
      currency: initial?.currency ?? currency,
      targetDate: targetDate || undefined,
    };
    try {
      if (initial) {
        await updateSavingsGoal(initial.id, input);
        addToast('success', 'Savings goal updated');
      } else {
        await createSavingsGoal(input);
        addToast('success', 'Savings goal created');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Goal name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Emergency fund"
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={`Target (${currency})`}
          type="number"
          min="0"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
        />
        <Input
          label={`Current (${currency})`}
          type="number"
          min="0"
          step="0.01"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
        />
      </div>
      <Input
        label="Target date"
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update goal' : 'Create goal'}
        </Button>
      </div>
    </form>
  );
}

function AssetForm({
  currency,
  initial,
  onDone,
}: {
  currency: string;
  initial?: Asset;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'cash');
  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) return;
    setSaving(true);
    const input = {
      name,
      category,
      value: amount,
      currency: initial?.currency ?? currency,
      notes,
    };
    try {
      if (initial) {
        await updateAsset(initial.id, input);
        addToast('success', 'Asset updated');
      } else {
        await createAsset(input);
        addToast('success', 'Asset added');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Asset name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'bank', label: 'Bank' },
            { value: 'investment', label: 'Investment' },
            { value: 'property', label: 'Property' },
            { value: 'vehicle', label: 'Vehicle' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <Input
          label={`Value (${currency})`}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update asset' : 'Add asset'}
        </Button>
      </div>
    </form>
  );
}

function LiabilityForm({
  currency,
  initial,
  onDone,
}: {
  currency: string;
  initial?: Liability;
  onDone: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'loan');
  const [balance, setBalance] = useState(
    initial ? String(initial.balance) : '',
  );
  const [interestRate, setInterestRate] = useState(
    initial?.interestRate != null ? String(initial.interestRate) : '',
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(balance);
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) return;
    const rate = interestRate.trim() === '' ? undefined : Number(interestRate);
    setSaving(true);
    const input = {
      name,
      category,
      balance: amount,
      currency: initial?.currency ?? currency,
      interestRate: rate != null && Number.isFinite(rate) ? rate : undefined,
      dueDate: dueDate || undefined,
      notes,
    };
    try {
      if (initial) {
        await updateLiability(initial.id, input);
        addToast('success', 'Liability updated');
      } else {
        await createLiability(input);
        addToast('success', 'Liability added');
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Liability name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: 'loan', label: 'Loan' },
            { value: 'credit_card', label: 'Credit card' },
            { value: 'mortgage', label: 'Mortgage' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <Input
          label={`Balance (${currency})`}
          type="number"
          min="0"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
        />
        <Input
          label="Interest rate %"
          type="number"
          min="0"
          step="0.01"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {initial ? 'Update liability' : 'Add liability'}
        </Button>
      </div>
    </form>
  );
}

export default function FinancePage() {
  const currency = useSettingsStore((s) => s.currency) || 'KES';
  const addToast = useUiStore((s) => s.addToast);
  const month = monthKey();
  const overview = useFinanceOverview(month);
  const transactions = useTransactionsLive();
  const budgets = useBudgetsWithSpend(month);
  const savings = useSavingsGoalsLive();
  const assets = useAssetsLive();
  const liabilities = useLiabilitiesLive();

  const [txOpen, setTxOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [liabilityOpen, setLiabilityOpen] = useState(false);

  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingSavings, setEditingSavings] = useState<SavingsGoal | null>(
    null,
  );
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(
    null,
  );

  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>(
    'all',
  );
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txMonthFilter, setTxMonthFilter] = useState(month);

  const loading = overview === undefined;

  const filteredTx = useMemo(() => {
    if (!transactions) return undefined;
    return transactions.filter((t) => {
      if (txMonthFilter && !t.date.startsWith(txMonthFilter)) return false;
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
      if (txCategoryFilter !== 'all' && t.category !== txCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [transactions, txMonthFilter, txTypeFilter, txCategoryFilter]);

  const cashFlowData = useMemo(
    () =>
      (overview?.cashFlowByDay ?? []).map((d) => ({
        ...d,
        label: formatDate(d.date, 'MMM d'),
      })),
    [overview?.cashFlowByDay],
  );

  return (
    <div className="space-y-2">
      <PageHeader
        eyebrow="Goals"
        title="Finance"
        description="Cashflow, budgets, savings, and net worth."
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="networth">Net Worth</TabsTrigger>
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
                  label="Income (month)"
                  value={formatCurrency(overview.income, currency)}
                  hint={formatDate(`${month}-01`, 'MMMM yyyy')}
                  icon={TrendingUp}
                  accentClassName="bg-success/15 text-success"
                  glass
                />
                <StatCard
                  label="Expenses (month)"
                  value={formatCurrency(overview.expenses, currency)}
                  hint={`${overview.transactionCount} transactions`}
                  icon={TrendingDown}
                  accentClassName="bg-danger/15 text-danger"
                />
                <StatCard
                  label="Net worth"
                  value={formatCurrency(overview.netWorth, currency)}
                  hint={`Assets ${formatCurrency(overview.assetTotal, currency)}`}
                  icon={Landmark}
                />
                <StatCard
                  label="Savings progress"
                  value={`${overview.savingsPct}%`}
                  hint={
                    overview.savingsTarget > 0
                      ? `${formatCurrency(overview.savingsCurrent, currency)} / ${formatCurrency(overview.savingsTarget, currency)}`
                      : 'No goals yet'
                  }
                  icon={PiggyBank}
                  accentClassName="bg-goals/15 text-goals"
                />
              </div>
            )}

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Cash flow</CardTitle>
                  <p className="text-sm text-text-muted">
                    Cumulative income vs expenses this month
                  </p>
                </div>
                {!loading ? (
                  <Badge
                    tone={
                      overview.netCashflow >= 0 ? 'success' : 'danger'
                    }
                  >
                    Net {formatCurrency(overview.netCashflow, currency)}
                  </Badge>
                ) : null}
              </CardHeader>
              {loading ? (
                <Skeleton className="h-64" />
              ) : cashFlowData.length === 0 ||
                (overview.income === 0 && overview.expenses === 0) ? (
                <EmptyState
                  icon={Wallet}
                  title="No cash flow yet"
                  description="Add income or expenses to see this month’s chart."
                  action={
                    <Button
                      onClick={() => {
                        setEditingTx(null);
                        setTxOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add transaction
                    </Button>
                  }
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={56} />
                      <Tooltip
                        contentStyle={chartTooltipStyle()}
                        formatter={(value) =>
                          formatCurrency(Number(value ?? 0), currency)
                        }
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#22C55E"
                        fill="#22C55E"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expenses"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="transactions">
          <motion.div {...fade} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                <Select
                  label="Month"
                  value={txMonthFilter}
                  onChange={(e) => setTxMonthFilter(e.target.value)}
                  options={[
                    { value: month, label: formatDate(`${month}-01`, 'MMMM yyyy') },
                    {
                      value: monthKey(
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() - 1,
                          1,
                        ),
                      ),
                      label: 'Previous month',
                    },
                    { value: '', label: 'All time' },
                  ]}
                />
                <Select
                  label="Type"
                  value={txTypeFilter}
                  onChange={(e) =>
                    setTxTypeFilter(e.target.value as 'all' | TransactionType)
                  }
                  options={[
                    { value: 'all', label: 'All types' },
                    { value: 'income', label: 'Income' },
                    { value: 'expense', label: 'Expense' },
                    { value: 'transfer', label: 'Transfer' },
                  ]}
                />
                <Select
                  label="Category"
                  value={txCategoryFilter}
                  onChange={(e) => setTxCategoryFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All categories' },
                    ...FINANCE_CATEGORIES.map((c) => ({
                      value: c,
                      label: categoryLabel(c),
                    })),
                  ]}
                />
              </div>
              <Button
                onClick={() => {
                  setEditingTx(null);
                  setTxOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add transaction
              </Button>
            </div>

            <Card>
              {!filteredTx ? (
                <Skeleton className="h-40" />
              ) : filteredTx.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No transactions"
                  description="Log income and expenses in KES (or your currency)."
                  action={
                    <Button
                      onClick={() => {
                        setEditingTx(null);
                        setTxOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add first transaction
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {filteredTx.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className={
                          t.type === 'income'
                            ? 'flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-success/15 text-success'
                            : t.type === 'expense'
                              ? 'flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-danger/15 text-danger'
                              : 'flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent'
                        }
                      >
                        {t.type === 'income' ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text">
                            {t.description?.trim() || categoryLabel(t.category)}
                          </p>
                          <Badge tone="neutral">
                            {categoryLabel(t.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted">
                          {formatDate(t.date)} · {t.type}
                        </p>
                      </div>
                      <p
                        className={
                          t.type === 'income'
                            ? 'font-display font-semibold text-success'
                            : t.type === 'expense'
                              ? 'font-display font-semibold text-danger'
                              : 'font-display font-semibold text-text'
                        }
                      >
                        {t.type === 'expense' ? '−' : t.type === 'income' ? '+' : ''}
                        {formatCurrency(t.amount, t.currency || currency)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit transaction"
                          onClick={() => {
                            setEditingTx(t);
                            setTxOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete transaction"
                          onClick={() => {
                            void deleteTransaction(t.id).then(() =>
                              addToast('success', 'Transaction deleted'),
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

        <TabsContent value="budgets">
          <motion.div {...fade} className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingBudget(null);
                  setBudgetOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add budget
              </Button>
            </div>
            <Card>
              {!budgets ? (
                <Skeleton className="h-40" />
              ) : budgets.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No budgets yet"
                  description="Set monthly category limits and track spend."
                  action={
                    <Button
                      onClick={() => {
                        setEditingBudget(null);
                        setBudgetOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Create budget
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-4">
                  {budgets.map((b) => (
                    <li key={b.id} className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-text">{b.name}</p>
                          <p className="text-sm text-text-muted">
                            {categoryLabel(b.category)} ·{' '}
                            {formatCurrency(b.spent, b.currency)} of{' '}
                            {formatCurrency(b.amount, b.currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            tone={
                              b.pct >= 100
                                ? 'danger'
                                : b.pct >= 80
                                  ? 'warning'
                                  : 'success'
                            }
                          >
                            {Math.round(b.pct)}%
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Edit budget"
                            onClick={() => {
                              setEditingBudget(b);
                              setBudgetOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Delete budget"
                            onClick={() => {
                              void deleteBudget(b.id).then(() =>
                                addToast('success', 'Budget deleted'),
                              );
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Progress
                        value={b.spent}
                        max={Math.max(b.amount, 1)}
                        barClassName={
                          b.pct >= 100
                            ? 'bg-danger'
                            : b.pct >= 80
                              ? 'bg-warning'
                              : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="savings">
          <motion.div {...fade} className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingSavings(null);
                  setSavingsOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add goal
              </Button>
            </div>
            <Card>
              {!savings ? (
                <Skeleton className="h-40" />
              ) : savings.length === 0 ? (
                <EmptyState
                  icon={PiggyBank}
                  title="No savings goals"
                  description="Set a target, track current progress, and ETA."
                  action={
                    <Button
                      onClick={() => {
                        setEditingSavings(null);
                        setSavingsOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Create goal
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-5">
                  {savings.map((g) => {
                    const pct = percent(
                      g.currentAmount,
                      Math.max(g.targetAmount, 1),
                    );
                    const eta = estimateSavingsEta(g);
                    return (
                      <li key={g.id} className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-text">{g.name}</p>
                            <p className="text-sm text-text-muted">
                              {formatCurrency(g.currentAmount, g.currency)} /{' '}
                              {formatCurrency(g.targetAmount, g.currency)}
                              {eta ? ` · ETA ${eta}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone="accent">{Math.round(pct)}%</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Edit savings goal"
                              onClick={() => {
                                setEditingSavings(g);
                                setSavingsOpen(true);
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Delete savings goal"
                              onClick={() => {
                                void deleteSavingsGoal(g.id).then(() =>
                                  addToast('success', 'Savings goal deleted'),
                                );
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                        <Progress
                          value={g.currentAmount}
                          max={Math.max(g.targetAmount, 1)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void updateSavingsProgress(
                                g.id,
                                g.currentAmount + 1000,
                              )
                            }
                          >
                            +1,000
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void updateSavingsProgress(
                                g.id,
                                g.currentAmount + 5000,
                              )
                            }
                          >
                            +5,000
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="networth">
          <motion.div {...fade} className="space-y-4">
            {!overview ? (
              <Skeleton className="h-28" />
            ) : (
              <StatCard
                label="Net worth"
                value={formatCurrency(overview.netWorth, currency)}
                hint={`Assets ${formatCurrency(overview.assetTotal, currency)} − Liabilities ${formatCurrency(overview.liabilityTotal, currency)}`}
                icon={Landmark}
                glass
              />
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingAsset(null);
                      setAssetOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </CardHeader>
                {!assets ? (
                  <Skeleton className="h-32" />
                ) : assets.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No assets"
                    description="Add cash, bank, property, or investments."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {assets.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text">{a.name}</p>
                          <p className="text-xs text-text-muted capitalize">
                            {a.category.replace('_', ' ')}
                          </p>
                        </div>
                        <p className="font-display font-semibold text-success">
                          {formatCurrency(a.value, a.currency || currency)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit asset"
                          onClick={() => {
                            setEditingAsset(a);
                            setAssetOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete asset"
                          onClick={() => {
                            void deleteAsset(a.id).then(() =>
                              addToast('success', 'Asset deleted'),
                            );
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liabilities</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingLiability(null);
                      setLiabilityOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </CardHeader>
                {!liabilities ? (
                  <Skeleton className="h-32" />
                ) : liabilities.length === 0 ? (
                  <EmptyState
                    icon={TrendingDown}
                    title="No liabilities"
                    description="Track loans, cards, and other balances."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {liabilities.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text">{l.name}</p>
                          <p className="text-xs text-text-muted capitalize">
                            {l.category.replace('_', ' ')}
                            {l.interestRate != null
                              ? ` · ${l.interestRate}%`
                              : ''}
                          </p>
                        </div>
                        <p className="font-display font-semibold text-danger">
                          {formatCurrency(l.balance, l.currency || currency)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit liability"
                          onClick={() => {
                            setEditingLiability(l);
                            setLiabilityOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete liability"
                          onClick={() => {
                            void deleteLiability(l.id).then(() =>
                              addToast('success', 'Liability deleted'),
                            );
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Modal
        open={txOpen}
        onClose={() => {
          setTxOpen(false);
          setEditingTx(null);
        }}
        title={editingTx ? 'Edit transaction' : 'Add transaction'}
        description={`Amounts in ${currency}.`}
      >
        <TransactionForm
          key={editingTx?.id ?? 'new-tx'}
          currency={currency}
          initial={editingTx ?? undefined}
          onDone={() => {
            setTxOpen(false);
            setEditingTx(null);
          }}
        />
      </Modal>
      <Modal
        open={budgetOpen}
        onClose={() => {
          setBudgetOpen(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? 'Edit budget' : 'Create budget'}
        description="Monthly category spending limit."
      >
        <BudgetForm
          key={editingBudget?.id ?? 'new-budget'}
          currency={currency}
          initial={editingBudget ?? undefined}
          onDone={() => {
            setBudgetOpen(false);
            setEditingBudget(null);
          }}
        />
      </Modal>
      <Modal
        open={savingsOpen}
        onClose={() => {
          setSavingsOpen(false);
          setEditingSavings(null);
        }}
        title={editingSavings ? 'Edit savings goal' : 'Savings goal'}
        description="Target, current amount, and optional date."
      >
        <SavingsForm
          key={editingSavings?.id ?? 'new-savings'}
          currency={currency}
          initial={editingSavings ?? undefined}
          onDone={() => {
            setSavingsOpen(false);
            setEditingSavings(null);
          }}
        />
      </Modal>
      <Modal
        open={assetOpen}
        onClose={() => {
          setAssetOpen(false);
          setEditingAsset(null);
        }}
        title={editingAsset ? 'Edit asset' : 'Add asset'}
      >
        <AssetForm
          key={editingAsset?.id ?? 'new-asset'}
          currency={currency}
          initial={editingAsset ?? undefined}
          onDone={() => {
            setAssetOpen(false);
            setEditingAsset(null);
          }}
        />
      </Modal>
      <Modal
        open={liabilityOpen}
        onClose={() => {
          setLiabilityOpen(false);
          setEditingLiability(null);
        }}
        title={editingLiability ? 'Edit liability' : 'Add liability'}
      >
        <LiabilityForm
          key={editingLiability?.id ?? 'new-liability'}
          currency={currency}
          initial={editingLiability ?? undefined}
          onDone={() => {
            setLiabilityOpen(false);
            setEditingLiability(null);
          }}
        />
      </Modal>
    </div>
  );
}
