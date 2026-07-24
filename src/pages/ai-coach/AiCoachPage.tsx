import { AnimatePresence, motion } from 'framer-motion';
import {
  Cross,
  Dumbbell,
  Heart,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  PageHeader,
  Skeleton,
  Textarea,
  Toggle,
} from '@/components/ui';
import { db } from '@/db/database';
import { cn, uid } from '@/lib/utils';
import {
  generateInsights,
  scoreLife,
  type Insight,
} from '@/services/ai/coach';
import {
  replyAsCoach,
  SUGGESTED_PROMPTS,
} from '@/services/ai/conversation';
import { buildLifeSnapshot } from '@/services/ai/snapshot';
import type { DataSnapshot } from '@/services/ai/types';
import {
  canListen,
  canSpeak,
  speakText,
  startListening,
  stopSpeaking,
} from '@/services/ai/voice';
import type { CoachChatMessage, G4Pillar } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

const PILLAR_ICON: Record<G4Pillar, typeof Sparkles> = {
  god: Cross,
  goals: Target,
  grinding: Dumbbell,
  gratitude: Heart,
};

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|“[^”]+”|"[^"]+")/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith('“') && part.endsWith('”')) ||
      (part.startsWith('"') && part.endsWith('"'))
    ) {
      return (
        <em key={i} className="text-accent/95">
          {part}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*/g, '')
    .replace(/[•]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function AiCoachPage() {
  const addToast = useUiStore((s) => s.addToast);
  const voiceEnabled = useSettingsStore((s) => s.coachVoiceEnabled);
  const setCoachVoiceEnabled = useSettingsStore((s) => s.setCoachVoiceEnabled);

  const messages =
    useLiveQuery(
      () => db.coachMessages.orderBy('createdAt').toArray(),
      [],
    ) ?? [];

  const [snapshot, setSnapshot] = useState<DataSnapshot | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const lastSpokenRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await buildLifeSnapshot();
      setSnapshot(snap);
      setInsights(generateInsights(snap));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      stopSpeaking();
      stopListenRef.current?.();
    };
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, thinking]);

  useEffect(() => {
    if (loading || !snapshot) return;
    void (async () => {
      const count = await db.coachMessages.count();
      if (count > 0) return;
      const opening = replyAsCoach('hello', snapshot);
      await db.coachMessages.add({
        id: uid(),
        role: 'coach',
        content: opening.message,
        intent: opening.intent,
        createdAt: new Date().toISOString(),
      });
    })();
  }, [loading, snapshot]);

  // Auto-speak newest coach message when voice mode is on
  useEffect(() => {
    if (!voiceEnabled || !canSpeak()) return;
    const last = [...messages].reverse().find((m) => m.role === 'coach');
    if (!last || lastSpokenRef.current === last.id) return;
    lastSpokenRef.current = last.id;
    setSpeakingId(last.id);
    void speakText(stripMarkdown(last.content), {
      onend: () => setSpeakingId(null),
    });
  }, [messages, voiceEnabled]);

  async function speakInsight(insight: Insight) {
    if (!canSpeak()) {
      addToast('warning', 'Voice is not supported in this browser.');
      return;
    }
    stopSpeaking();
    setSpeakingId(insight.id);
    await speakText(insight.speakText ?? insight.message, {
      onend: () => setSpeakingId(null),
    });
  }

  async function speakMessage(message: CoachChatMessage) {
    if (!canSpeak()) {
      addToast('warning', 'Voice is not supported in this browser.');
      return;
    }
    stopSpeaking();
    setSpeakingId(message.id);
    await speakText(stripMarkdown(message.content), {
      onend: () => setSpeakingId(null),
    });
  }

  function toggleListen() {
    if (listening) {
      stopListenRef.current?.();
      stopListenRef.current = null;
      setListening(false);
      return;
    }
    if (!canListen()) {
      addToast(
        'warning',
        'Microphone talk works best in Chrome or Edge on a secure (HTTPS) site.',
      );
      return;
    }
    setListening(true);
    stopListenRef.current = startListening({
      onResult: (transcript) => {
        setDraft(transcript);
        setListening(false);
        stopListenRef.current = null;
        void sendText(transcript);
      },
      onError: (error) => {
        setListening(false);
        stopListenRef.current = null;
        if (error === 'not-allowed') {
          addToast('danger', 'Microphone permission denied.');
        } else {
          addToast('warning', 'Could not hear you — try again.');
        }
      },
      onEnd: () => {
        setListening(false);
        stopListenRef.current = null;
      },
    });
  }

  async function sendText(text: string) {
    const clean = text.trim();
    if (!clean || !snapshot || thinking) return;
    setThinking(true);
    setDraft('');
    stopSpeaking();
    const now = new Date().toISOString();
    await db.coachMessages.add({
      id: uid(),
      role: 'user',
      content: clean,
      createdAt: now,
    });

    const fresh = await buildLifeSnapshot();
    setSnapshot(fresh);
    setInsights(generateInsights(fresh));

    await new Promise((r) => window.setTimeout(r, 320));
    const reply = replyAsCoach(clean, fresh);
    await db.coachMessages.add({
      id: uid(),
      role: 'coach',
      content: reply.message,
      intent: reply.intent,
      createdAt: new Date().toISOString(),
    });
    setThinking(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await sendText(draft);
  }

  async function clearChat() {
    stopSpeaking();
    await db.coachMessages.clear();
    lastSpokenRef.current = null;
    addToast('info', 'Coach chat cleared');
    if (snapshot) {
      const opening = replyAsCoach('hello', snapshot);
      await db.coachMessages.add({
        id: uid(),
        role: 'coach',
        content: opening.message,
        intent: opening.intent,
        createdAt: new Date().toISOString(),
      } satisfies CoachChatMessage);
    }
  }

  const score = snapshot ? scoreLife(snapshot) : null;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const activeReply = snapshot
    ? replyAsCoach(
        lastUser?.content ?? 'What should I focus on today?',
        snapshot,
      )
    : null;
  const followUps = activeReply?.followUps ?? SUGGESTED_PROMPTS.slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Coach"
        description="Tailored wisdom, quotes, and advice from your live progress — read it, or let the coach speak."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Toggle
              checked={voiceEnabled}
              onChange={(on) => {
                setCoachVoiceEnabled(on);
                if (!on) {
                  stopSpeaking();
                  setSpeakingId(null);
                }
                addToast(
                  'info',
                  on
                    ? 'Voice on — coach will speak replies'
                    : 'Voice off — text only',
                );
              }}
              label={voiceEnabled ? 'Voice on' : 'Voice off'}
            />
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              Rescan
            </Button>
            <Button variant="ghost" onClick={() => void clearChat()}>
              <Trash2 className="size-4" />
              Clear chat
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card glass>
          <p className="text-xs text-text-muted">Best-Self Score</p>
          <p className="mt-1 font-display text-3xl font-bold text-accent">
            {loading || score === null ? '—' : score}
          </p>
        </Card>
        <Card glass>
          <p className="text-xs text-text-muted">Today’s habits</p>
          <p className="mt-1 font-display text-3xl font-bold">
            {snapshot
              ? `${snapshot.habitsCompletedToday}/${snapshot.habitsTargetToday}`
              : '—'}
          </p>
        </Card>
        <Card glass>
          <p className="text-xs text-text-muted">Coach mode</p>
          <p className="mt-1 font-display text-lg font-semibold">
            {voiceEnabled ? 'Speak + text' : 'Text only'}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {canSpeak() ? 'Voice ready' : 'TTS unavailable'}
            {' · '}
            {canListen() ? 'Mic ready' : 'Mic limited'}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card glass padding="none" className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="size-4 text-accent" />
            <p className="font-display font-semibold">Talk with your coach</p>
            <Badge tone="accent" className="ml-auto">
              Local · Private
            </Badge>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loading && messages.length === 0 ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'max-w-[94%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'ml-auto bg-accent text-[#0b1220]'
                        : 'mr-auto border border-border bg-surface/80 text-text',
                    )}
                  >
                    {m.role === 'coach' ? renderContent(m.content) : m.content}
                    {m.role === 'coach' ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (speakingId === m.id) {
                              stopSpeaking();
                              setSpeakingId(null);
                            } else {
                              void speakMessage(m);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          {speakingId === m.id ? (
                            <>
                              <VolumeX className="size-3.5" /> Stop voice
                            </>
                          ) : (
                            <>
                              <Volume2 className="size-3.5" /> Hear this
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {thinking ? (
              <div className="mr-auto rounded-2xl border border-border bg-surface/80 px-3.5 py-2 text-sm text-text-muted">
                Reading your progress and gathering wisdom…
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {followUps.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={thinking || !snapshot}
                  onClick={() => void sendText(prompt)}
                  className="rounded-full border border-border bg-bg/50 px-2.5 py-1 text-xs text-text-muted transition hover:border-accent hover:text-text disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form className="flex items-end gap-2" onSubmit={onSubmit}>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  listening
                    ? 'Listening… speak now'
                    : 'Type or tap the mic — ask for habits, faith, money, fitness…'
                }
                rows={2}
                className="min-h-[2.75rem]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendText(draft);
                  }
                }}
              />
              <Button
                type="button"
                variant={listening ? 'danger' : 'secondary'}
                onClick={toggleListen}
                aria-label={listening ? 'Stop listening' : 'Talk to coach'}
                title="Talk to coach"
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
              <Button
                type="submit"
                disabled={thinking || !draft.trim() || !snapshot}
                aria-label="Send"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tailored insights</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => void refresh()}>
                <RefreshCw className="size-3.5" />
              </Button>
            </CardHeader>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : (
              <ul className="space-y-3">
                {insights.map((insight) => {
                  const Icon = PILLAR_ICON[insight.relatedPillar];
                  return (
                    <li
                      key={insight.id}
                      className="rounded-[var(--radius-md)] border border-border p-3"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <Icon className="size-3.5 text-accent" />
                        <Badge
                          tone={
                            insight.severity === 'success'
                              ? 'success'
                              : insight.severity === 'warning'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {insight.category}
                        </Badge>
                        <Badge tone={insight.relatedPillar}>
                          {insight.relatedPillar}
                        </Badge>
                        <button
                          type="button"
                          className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline"
                          onClick={() => {
                            if (speakingId === insight.id) {
                              stopSpeaking();
                              setSpeakingId(null);
                            } else {
                              void speakInsight(insight);
                            }
                          }}
                        >
                          {speakingId === insight.id ? (
                            <>
                              <VolumeX className="size-3.5" /> Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="size-3.5" /> Hear
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-medium text-text">{insight.message}</p>
                      {insight.quote ? (
                        <blockquote className="mt-2 border-l-2 border-accent/50 pl-3 text-xs italic text-text-muted">
                          “{insight.quote}”
                          {insight.quoteAuthor ? (
                            <span className="mt-1 block not-italic text-accent">
                              — {insight.quoteAuthor}
                            </span>
                          ) : null}
                        </blockquote>
                      ) : null}
                      {insight.wisdom ? (
                        <p className="mt-2 text-xs leading-relaxed text-text-muted">
                          <span className="font-semibold text-text">Wisdom: </span>
                          {insight.wisdom}
                        </p>
                      ) : null}
                      {insight.advice ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                          <span className="font-semibold text-text">Advice: </span>
                          {insight.advice}
                        </p>
                      ) : null}
                      {insight.motivation ? (
                        <p className="mt-1.5 text-xs font-medium text-accent/90">
                          {insight.motivation}
                        </p>
                      ) : null}
                      {insight.actions?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {insight.actions.map((a) => (
                            <Link
                              key={a.href + a.label}
                              to={a.href}
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              {a.label} →
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {activeReply?.actions?.length ? (
            <Card glass>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {activeReply.actions.map((a) => (
                  <Link
                    key={a.href + a.label}
                    to={a.href}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent"
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
