import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAtmosphere } from '@/components/auth/AuthAtmosphere';
import { Logo } from '@/components/brand/Logo';
import { Button, Input } from '@/components/ui';
import { useTimedQuote } from '@/hooks/useTimedQuote';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const REMEMBER_KEY = 'g4_remember_username';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addToast = useUiStore((s) => s.addToast);
  const { quote, greeting } = useTimedQuote();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await login(username.trim(), password);
      if (!ok) {
        setError('Invalid username or password.');
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

  return (
    <AuthAtmosphere>
      <div className="glass rounded-[1.25rem] p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" variant="full" showWordmark showMotto={false} />
          <p className="mt-3 text-sm text-[#F0B429]">
            {greeting.greeting} · {greeting.label} · {greeting.clockLabel}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.blockquote
            key={quote?.id ?? quote?.text ?? 'fallback'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="mb-6 rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-4 py-3 text-left"
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

        <form className="space-y-4" onSubmit={onSubmit}>
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
        </form>
      </div>
    </AuthAtmosphere>
  );
}
