import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAtmosphere } from '@/components/auth/AuthAtmosphere';
import { Logo } from '@/components/brand/Logo';
import { Button, Input, Skeleton } from '@/components/ui';
import { useTimedQuote } from '@/hooks/useTimedQuote';
import { hardRefreshApp } from '@/lib/hardRefresh';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const REMEMBER_KEY = 'g4_remember_username';

const PILLARS = [
  { key: 'God', blurb: 'Faith, prayer, and spiritual grounding.' },
  { key: 'Goals', blurb: 'Clear targets and deliberate progress.' },
  { key: 'Grinding', blurb: 'Daily discipline and relentless execution.' },
  { key: 'Gratitude', blurb: 'Joy, reflection, and abundance mindset.' },
] as const;

type Mode = 'checking' | 'login' | 'setup' | 'reset';

/**
 * Single auth screen — picks Login vs Setup from IndexedDB so users never get
 * stuck on Setup when an account already exists (or vice versa).
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setup = useAuthStore((s) => s.setup);
  const getLocalAccount = useAuthStore((s) => s.getLocalAccount);
  const resetPasswordOnDevice = useAuthStore((s) => s.resetPasswordOnDevice);
  const refreshSetupState = useAuthStore((s) => s.refreshSetupState);
  const addToast = useUiStore((s) => s.addToast);
  const { quote, greeting } = useTimedQuote();

  const [mode, setMode] = useState<Mode>('checking');
  const [accountHint, setAccountHint] = useState<{
    username: string;
    displayName: string;
  } | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }

    let alive = true;
    void (async () => {
      try {
        const hasAccount = await refreshSetupState();
        if (!alive) return;
        if (!hasAccount) {
          setMode('setup');
          return;
        }
        const hint = await getLocalAccount();
        if (!alive) return;
        if (hint) {
          setAccountHint(hint);
          setUsername((prev) => prev || hint.username);
        }
        setMode('login');
      } catch {
        if (!alive) return;
        setMode('login');
      }
    })();

    return () => {
      alive = false;
    };
  }, [getLocalAccount, refreshSetupState]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (result === 'unknown_user') {
        const hint = accountHint ?? (await getLocalAccount());
        setError(
          hint
            ? `Username not recognized. On this device it is “${hint.username}”.`
            : 'No matching username on this device.',
        );
        if (hint) setUsername(hint.username);
        return;
      }
      if (result === 'bad_password') {
        setError('Password is incorrect. You can reset it below — your data stays on this phone.');
        return;
      }
      if (remember) localStorage.setItem(REMEMBER_KEY, username.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      addToast('success', `${greeting.greeting}. Welcome back.`);
      navigate('/', { replace: true });
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onReset(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordOnDevice(password);
      localStorage.setItem(
        REMEMBER_KEY,
        accountHint?.username ?? username.trim(),
      );
      addToast('success', 'Password updated. Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setLoading(false);
    }
  }

  async function onSetup(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await setup(username.trim(), password, displayName.trim() || username.trim());
      addToast('success', 'Mission Control is online. Welcome aboard.');
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Setup failed.';
      if (/already exists|already completed|log in/i.test(message)) {
        const hint = await getLocalAccount();
        if (hint) {
          setAccountHint(hint);
          setUsername(hint.username);
        }
        await refreshSetupState();
        setMode('login');
        setConfirm('');
        setError('An account already exists on this device. Log in below.');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'checking') {
    return (
      <AuthAtmosphere>
        <div className="glass w-full max-w-md space-y-4 rounded-[1.25rem] p-8">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthAtmosphere>
    );
  }

  return (
    <AuthAtmosphere>
      <div className="glass w-full max-w-md rounded-[1.25rem] p-6 sm:p-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <Logo size="lg" variant="full" showWordmark showMotto={false} />
          {mode === 'setup' ? (
            <p className="mt-3 max-w-sm text-sm text-text-muted">
              First launch. Create your local-first operator profile — everything stays on this
              device.
            </p>
          ) : mode === 'reset' ? (
            <p className="mt-3 max-w-sm text-sm text-text-muted">
              Set a new password for this device. Your Mission Control data is kept.
            </p>
          ) : (
            <p className="mt-3 text-sm text-[#F0B429]">
              {greeting.greeting} · {greeting.label} · {greeting.clockLabel}
            </p>
          )}
        </div>

        {mode === 'login' ? (
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={quote?.id ?? quote?.text ?? 'fallback'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="mb-6 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-left"
            >
              <p className="text-sm text-[#e8edf7]/90 italic">
                &ldquo;
                {quote?.text ??
                  'Small consistent actions lead to extraordinary success.'}
                &rdquo;
              </p>
              <footer className="mt-2 text-xs text-[#F0B429]">
                — {quote?.author ?? 'G4 Mission Control'}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        ) : null}

        {mode === 'setup' ? (
          <div className="mb-6 grid grid-cols-2 gap-2">
            {PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="rounded-md border border-white/10 bg-white/5 p-3"
              >
                <p className="font-display text-sm font-semibold text-[#F0B429]">{pillar.key}</p>
                <p className="mt-1 text-[11px] leading-snug text-text-muted">{pillar.blurb}</p>
              </motion.div>
            ))}
          </div>
        ) : null}

        {mode === 'login' && accountHint ? (
          <p className="mb-4 rounded-md border border-[#F0B429]/25 bg-[#F0B429]/10 px-3 py-2 text-center text-sm text-[#e8edf7]">
            Account on this device:{' '}
            <span className="font-semibold text-[#F0B429]">{accountHint.username}</span>
            {accountHint.displayName !== accountHint.username ? (
              <span className="text-text-muted"> ({accountHint.displayName})</span>
            ) : null}
          </p>
        ) : null}

        {mode === 'login' ? (
          <form className="space-y-4" onSubmit={onLogin}>
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute top-8 right-2 rounded-md p-2 text-text-muted hover:text-text"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-border"
              />
              Remember me
            </label>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Enter Mission Control
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setError(null);
                setPassword('');
                setConfirm('');
                setMode('reset');
              }}
            >
              Forgot password — reset on this device
            </Button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 text-center text-xs text-text-muted hover:text-[#F0B429]"
              onClick={() => void hardRefreshApp({ hash: '#/login' })}
            >
              <RefreshCw className="size-3.5" />
              Missing reset button? Refresh app files
            </button>
          </form>
        ) : null}

        {mode === 'reset' ? (
          <form className="space-y-3.5" onSubmit={onReset}>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-muted">
              Resetting password for{' '}
              <span className="font-medium text-[#F0B429]">
                {accountHint?.username ?? (username || 'this device')}
              </span>
              . Habits, goals, and journals stay intact.
            </div>
            <div className="relative">
              <Input
                label="New password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 bottom-2.5 text-text-muted hover:text-text"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Input
              label="Confirm new password"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />

            {error ? (
              <p className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Save new password & enter
            </Button>

            <button
              type="button"
              className="w-full text-center text-sm text-text-muted hover:text-[#F0B429]"
              onClick={() => {
                setError(null);
                setPassword('');
                setConfirm('');
                setMode('login');
              }}
            >
              Back to login
            </button>
          </form>
        ) : null}

        {mode === 'setup' ? (
          <form className="space-y-3.5" onSubmit={onSetup}>
            <Input
              label="Display name"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Commander"
              autoComplete="name"
            />
            <Input
              label="Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 bottom-2.5 text-text-muted hover:text-text"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Input
              label="Confirm password"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />

            {error ? (
              <p className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Initialize Mission Control
            </Button>

            <button
              type="button"
              className="w-full text-center text-sm text-[#F0B429] hover:underline"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
            >
              Already have an account? Log in
            </button>
          </form>
        ) : null}
      </div>
    </AuthAtmosphere>
  );
}
