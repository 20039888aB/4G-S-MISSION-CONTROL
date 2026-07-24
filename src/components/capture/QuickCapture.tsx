import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { createHabit } from '@/features/habits/hooks';
import { createGoal } from '@/features/goals/hooks';
import { createNote } from '@/features/notes/hooks';
import { createTask } from '@/features/tasks/hooks';
import { useUiStore } from '@/stores/uiStore';

type CaptureKind = 'task' | 'habit' | 'goal' | 'note';

const KIND_OPTS: { value: CaptureKind; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'habit', label: 'Habit' },
  { value: 'goal', label: 'Goal' },
  { value: 'note', label: 'Note / Idea' },
];

export function QuickCapture() {
  const commandOpen = useUiStore((s) => s.commandPaletteOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const addToast = useUiStore((s) => s.addToast);

  const [kind, setKind] = useState<CaptureKind>('task');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === 'Escape') setCommandOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandOpen, setCommandOpen]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      if (kind === 'task') {
        await createTask({
          title: title.trim(),
          description: details.trim() || undefined,
          priority: 'medium',
          tags: [],
        });
        addToast('success', 'Task captured');
      } else if (kind === 'habit') {
        await createHabit({
          name: title.trim(),
          description: details.trim() || undefined,
          frequency: 'daily',
          icon: '✨',
        });
        addToast('success', 'Habit added');
      } else if (kind === 'goal') {
        await createGoal({
          title: title.trim(),
          description: details.trim() || undefined,
          status: 'active',
          progress: 0,
          milestones: [],
        });
        addToast('success', 'Goal created');
      } else {
        await createNote({
          title: title.trim(),
          body: details.trim(),
          type: 'idea',
          tags: ['quick-capture'],
        });
        addToast('success', 'Note saved');
      }
      setTitle('');
      setDetails('');
      setCommandOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-[#0b1220] shadow-lg transition hover:brightness-105 sm:right-6 sm:bottom-6"
        aria-label="Quick capture"
      >
        <Plus className="size-6" />
      </button>

      <AnimatePresence>
        {commandOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label="Quick capture"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="glass w-full max-w-lg rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-semibold">Quick Capture</p>
                  <p className="text-xs text-text-muted">
                    Ctrl/⌘ + K · Add habits, goals, tasks, or notes instantly
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-text-muted hover:bg-surface"
                  onClick={() => setCommandOpen(false)}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form className="space-y-3" onSubmit={onSubmit}>
                <Select
                  label="Capture as"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as CaptureKind)}
                  options={KIND_OPTS}
                />
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    kind === 'habit'
                      ? 'e.g. Cold shower'
                      : kind === 'goal'
                        ? 'e.g. Launch side hustle'
                        : 'What do you need to capture?'
                  }
                  autoFocus
                />
                <Textarea
                  label="Details (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
                <Button type="submit" className="w-full" loading={busy}>
                  Save to Mission Control
                </Button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
