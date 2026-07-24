import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAtmosphere } from '@/components/auth/AuthAtmosphere';
import { Logo } from '@/components/brand/Logo';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const PILLARS = [
  { key: 'God', blurb: 'Faith, prayer, and spiritual grounding.' },
  { key: 'Goals', blurb: 'Clear targets and deliberate progress.' },
  { key: 'Grinding', blurb: 'Daily discipline and relentless execution.' },
  { key: 'Gratitude', blurb: 'Joy, reflection, and abundance mindset.' },
] as const;

export default function SetupPage() {
  const navigate = useNavigate();
  const setup = useAuthStore((s) => s.setup);
  const addToast = useUiStore((s) => s.addToast);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
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
      setError(err instanceof Error ? err.message : 'Setup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthAtmosphere>
      <div className="glass rounded-[1.25rem] p-6 sm:p-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <Logo size="lg" variant="full" showWordmark showMotto={false} />
          <p className="mt-3 max-w-sm text-sm text-text-muted">
            First launch. Create your local-first operator profile — everything stays on this device.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={pillar.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
              className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-3"
            >
              <p className="font-display text-sm font-semibold text-[#F0B429]">{pillar.key}</p>
              <p className="mt-1 text-[11px] leading-snug text-text-muted">{pillar.blurb}</p>
            </motion.div>
          ))}
        </div>

        <form className="space-y-3.5" onSubmit={onSubmit}>
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
            <p className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <motion.div whileTap={{ scale: 0.98 }} className="pt-1">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Initialize Mission Control
            </Button>
          </motion.div>
        </form>
      </div>
    </AuthAtmosphere>
  );
}
