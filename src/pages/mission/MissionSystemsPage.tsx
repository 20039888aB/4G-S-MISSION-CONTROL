import { useLiveQuery } from 'dexie-react-hooks';
import {
  Crosshair,
  Flame,
  Link2,
  ScrollText,
  Share2,
  Swords,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui';
import { db } from '@/db/database';
import { ensureMissionTables } from '@/db/ensureTables';
import {
  checkInCovenant,
  createCovenant,
  deleteCovenant,
  sealCovenant,
  updateCovenant,
  useCovenantsLive,
} from '@/features/covenants/hooks';
import {
  createFaithGrindLink,
  deleteFaithGrindLink,
  updateFaithGrindLink,
  useFaithGrindLinksLive,
} from '@/features/faithGrind/hooks';
import {
  deleteWarRoomSession,
  exportWarRoomPdf,
  runSundayWarRoom,
  updateWarRoomNotes,
  useWarRoomSessionsLive,
} from '@/features/warRoom/hooks';
import { useMissionScores } from '@/hooks/useMissionScores';
import {
  accountabilityShareUrl,
  buildAccountabilityCard,
} from '@/services/mission/accountability';
import {
  buildCallsign,
  pillarsFromMission,
} from '@/services/mission/callsign';
import { useUiStore } from '@/stores/uiStore';
import type { CovenantDuration, FaithGrindLink, StreakCovenant } from '@/types';

export default function MissionSystemsPage() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const scores = useMissionScores();
  const pillars = useMemo(() => pillarsFromMission(scores), [scores]);
  const identity = useMemo(() => buildCallsign(pillars), [pillars]);
  const covenants = useCovenantsLive();
  const links = useFaithGrindLinksLive();
  const warRooms = useWarRoomSessionsLive();
  const habits = useLiveQuery(async () => {
    try {
      return await db.habits.filter((h) => !h.archived).sortBy('sortOrder');
    } catch {
      return [];
    }
  }, []);
  const addToast = useUiStore((s) => s.addToast);

  const [covOpen, setCovOpen] = useState(false);
  const [editingCov, setEditingCov] = useState<StreakCovenant | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FaithGrindLink | null>(null);
  const [shareNote, setShareNote] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [busyPdf, setBusyPdf] = useState(false);

  useEffect(() => {
    let alive = true;
    void ensureMissionTables()
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setBootError(err instanceof Error ? err.message : 'Could not open mission storage.');
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onShare() {
    try {
      const card = await buildAccountabilityCard(scores, shareNote);
      const url = accountabilityShareUrl(card);
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        addToast('success', 'Scorecard link copied.');
      } catch {
        addToast('info', 'Link ready — copy it below.');
      }
    } catch {
      addToast('danger', 'Could not build scorecard.');
    }
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Mission" title="Mission Systems" description="Loading…" />
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        eyebrow="Mission"
        title="Mission Systems"
        description="Callsign, covenants, Sunday War Room, Faith × Grind, and accountability."
      />

      {bootError ? (
        <Card className="border-warning/40">
          <p className="text-sm text-warning">Storage notice: {bootError}</p>
          <p className="mt-1 text-xs text-text-muted">
            You can still use Callsign. If tabs fail, reload app files from Settings or the update
            banner — your data is not deleted.
          </p>
        </Card>
      ) : null}

      <Tabs defaultValue="callsign">
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="callsign">Callsign</TabsTrigger>
          <TabsTrigger value="covenants">Covenants</TabsTrigger>
          <TabsTrigger value="warroom">War Room</TabsTrigger>
          <TabsTrigger value="faith">Faith × Grind</TabsTrigger>
          <TabsTrigger value="account">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="callsign">
          <Card glass>
            <CardHeader>
              <div className="flex min-w-0 items-center gap-2">
                <Crosshair className="size-4 shrink-0 text-accent" />
                <CardTitle>Living 4G Callsign</CardTitle>
              </div>
              <Badge tone="accent">{identity.rank}</Badge>
            </CardHeader>
            <p className="break-words font-display text-2xl font-bold text-accent sm:text-3xl">
              {scores.loading ? '…' : identity.callsign}
            </p>
            <p className="mt-2 text-sm text-text-muted">{identity.blurb}</p>
            <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ['God', pillars.god, 'god'],
                  ['Goals', pillars.goals, 'goals'],
                  ['Grinding', pillars.grinding, 'grinding'],
                  ['Gratitude', pillars.gratitude, 'gratitude'],
                ] as const
              ).map(([label, value, tone]) => (
                <div key={label} className="rounded-md border border-border p-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-text-muted">{label}</span>
                    <Badge tone={tone}>{value}</Badge>
                  </div>
                  <Progress value={Number.isFinite(value) ? value : 0} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="covenants">
          <div className="mb-3 flex justify-end">
            <Button
              onClick={() => {
                setEditingCov(null);
                setCovOpen(true);
              }}
            >
              New covenant
            </Button>
          </div>
          {!covenants?.length ? (
            <EmptyState
              icon={ScrollText}
              title="No covenants yet"
              description="Name a 7 / 21 / 40-day vow and check in daily."
            />
          ) : (
            <ul className="space-y-3">
              {covenants.map((c) => {
                const checkIns = Array.isArray(c.checkIns) ? c.checkIns : [];
                const kept = checkIns.filter((x) => x?.kept).length;
                const days = c.durationDays || 1;
                const pct = Math.round((kept / days) * 100);
                return (
                  <Card key={c.id}>
                    <CardHeader>
                      <CardTitle className="break-words">{c.name}</CardTitle>
                      <Badge
                        tone={
                          c.status === 'sealed'
                            ? 'success'
                            : c.status === 'broken'
                              ? 'danger'
                              : 'accent'
                        }
                      >
                        {c.status}
                      </Badge>
                    </CardHeader>
                    <p className="text-sm text-text-muted">{c.vow}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {c.startDate} → {c.endDate} · {days} days · {kept} kept
                    </p>
                    <Progress value={pct} className="mt-2" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void checkInCovenant(c.id, true)
                            .then(() => addToast('success', 'Day kept'))
                            .catch(() => addToast('danger', 'Check-in failed'))
                        }
                      >
                        Check-in kept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void checkInCovenant(c.id, false)
                            .then(() => addToast('warning', 'Marked broken day'))
                            .catch(() => addToast('danger', 'Update failed'))
                        }
                      >
                        Missed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCov(c);
                          setCovOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void sealCovenant(c.id, 'Ceremony complete.')
                            .then(() => addToast('success', 'Covenant sealed'))
                            .catch(() => addToast('danger', 'Seal failed'))
                        }
                      >
                        Seal ceremony
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          void deleteCovenant(c.id)
                            .then(() => addToast('info', 'Deleted'))
                            .catch(() => addToast('danger', 'Delete failed'))
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="warroom">
          <Card glass className="mb-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Swords className="size-4 text-accent" />
                <CardTitle>Sunday War Room</CardTitle>
              </div>
            </CardHeader>
            <p className="mb-3 text-sm text-text-muted">
              Generate this week’s debrief, reward lens, and branded PDF snapshot.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  void runSundayWarRoom(scores)
                    .then((s) => addToast('success', `War Room ready · ${s.callsign}`))
                    .catch(() => addToast('danger', 'War Room failed'))
                }
              >
                Run War Room
              </Button>
              <Button
                variant="secondary"
                loading={busyPdf}
                onClick={() => {
                  setBusyPdf(true);
                  void exportWarRoomPdf()
                    .then(() => addToast('success', 'PDF downloaded'))
                    .catch(() => addToast('danger', 'PDF export failed'))
                    .finally(() => setBusyPdf(false));
                }}
              >
                Export weekly PDF
              </Button>
            </div>
          </Card>
          {!warRooms?.length ? (
            <EmptyState
              icon={Flame}
              title="No sessions yet"
              description="Run your first War Room."
            />
          ) : (
            <ul className="space-y-3">
              {warRooms.map((w) => (
                <Card key={w.id}>
                  <CardHeader>
                    <CardTitle>{w.weekKey}</CardTitle>
                    <Badge tone={w.rewardEarned ? 'success' : 'warning'}>
                      {w.rewardEarned ? 'Reward path' : 'Keep grinding'}
                    </Badge>
                  </CardHeader>
                  <p className="font-medium text-accent">{w.callsign}</p>
                  <p className="mt-1 text-sm text-text-muted">{w.debrief}</p>
                  <Textarea
                    className="mt-2"
                    label="Notes"
                    value={w.notes ?? ''}
                    onChange={(e) => void updateWarRoomNotes(w.id, e.target.value)}
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void deleteWarRoomSession(w.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="faith">
          <div className="mb-3 flex justify-end">
            <Button
              onClick={() => {
                setEditingLink(null);
                setLinkOpen(true);
              }}
            >
              Link habit ↔ scripture
            </Button>
          </div>
          {!links?.length ? (
            <EmptyState
              icon={Link2}
              title="No Faith × Grind links"
              description="Completing habits can auto-seed prompts — or create custom links."
            />
          ) : (
            <ul className="space-y-3">
              {links.map((l) => {
                const habitName =
                  habits?.find((h) => h.id === l.habitId)?.name ?? 'Habit';
                return (
                  <Card key={l.id}>
                    <CardHeader>
                      <CardTitle className="break-words">{habitName}</CardTitle>
                      <Badge tone={l.active ? 'success' : 'neutral'}>
                        {l.active ? 'Active' : 'Paused'} · {l.unlockCount ?? 0} unlocks
                      </Badge>
                    </CardHeader>
                    <p className="text-sm text-accent">{l.scripture}</p>
                    <p className="mt-1 text-xs text-text-muted">{l.reflectionPrompt}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void updateFaithGrindLink(l.id, { active: !l.active })
                        }
                      >
                        {l.active ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingLink(l);
                          setLinkOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void deleteFaithGrindLink(l.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="account">
          <Card glass>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="size-4 text-accent" />
                <CardTitle>Accountability scorecard</CardTitle>
              </div>
            </CardHeader>
            <p className="mb-3 text-sm text-text-muted">
              Share a read-only weekly card (scores + habits only). No journals or finances.
            </p>
            <Textarea
              label="Optional note to partner"
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              rows={2}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void onShare()}>Generate & copy link</Button>
            </div>
            {shareUrl ? (
              <p className="mt-3 break-all rounded-md border border-border bg-bg/50 p-2 text-xs text-text-muted">
                {shareUrl}
              </p>
            ) : null}
          </Card>
        </TabsContent>
      </Tabs>

      <CovenantModal
        open={covOpen}
        initial={editingCov}
        habitOptions={(habits ?? []).map((h) => ({ value: h.id, label: h.name }))}
        onClose={() => setCovOpen(false)}
        onSaved={() => {
          setCovOpen(false);
          addToast('success', 'Covenant saved');
        }}
      />

      <FaithLinkModal
        open={linkOpen}
        initial={editingLink}
        habitOptions={(habits ?? []).map((h) => ({ value: h.id, label: h.name }))}
        onClose={() => setLinkOpen(false)}
        onSaved={() => {
          setLinkOpen(false);
          addToast('success', 'Faith link saved');
        }}
      />
    </div>
  );
}

function CovenantModal({
  open,
  onClose,
  onSaved,
  initial,
  habitOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: StreakCovenant | null;
  habitOptions: { value: string; label: string }[];
}) {
  const [name, setName] = useState('');
  const [vow, setVow] = useState('');
  const [duration, setDuration] = useState<CovenantDuration>(21);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [habitId, setHabitId] = useState('');
  const [saving, setSaving] = useState(false);
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setVow(initial?.vow ?? '');
    setDuration(initial?.durationDays ?? 21);
    setStartDate(initial?.startDate ?? new Date().toISOString().slice(0, 10));
    setHabitId(initial?.habitIds?.[0] ?? habitOptions[0]?.value ?? '');
  }, [open, initial, habitOptions]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) {
        await updateCovenant(initial.id, {
          name,
          vow,
          habitIds: habitId ? [habitId] : [],
        });
      } else {
        await createCovenant({
          name,
          vow,
          durationDays: duration,
          startDate,
          habitIds: habitId ? [habitId] : [],
        });
      }
      onSaved();
    } catch {
      addToast('danger', 'Could not save covenant.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit covenant' : 'New covenant'}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea
          label="Vow"
          value={vow}
          onChange={(e) => setVow(e.target.value)}
          required
          rows={3}
        />
        {!initial ? (
          <>
            <Select
              label="Duration"
              value={String(duration)}
              onChange={(e) => setDuration(Number(e.target.value) as CovenantDuration)}
              options={[
                { value: '7', label: '7 days' },
                { value: '21', label: '21 days' },
                { value: '40', label: '40 days' },
              ]}
            />
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </>
        ) : null}
        <Select
          label="Linked habit"
          value={habitId}
          onChange={(e) => setHabitId(e.target.value)}
          options={[{ value: '', label: 'None' }, ...habitOptions]}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FaithLinkModal({
  open,
  onClose,
  onSaved,
  initial,
  habitOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: FaithGrindLink | null;
  habitOptions: { value: string; label: string }[];
}) {
  const [habitId, setHabitId] = useState('');
  const [scripture, setScripture] = useState('');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    if (!open) return;
    setHabitId(initial?.habitId ?? habitOptions[0]?.value ?? '');
    setScripture(initial?.scripture ?? '');
    setPrompt(initial?.reflectionPrompt ?? '');
  }, [open, initial, habitOptions]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!habitId) {
      addToast('warning', 'Create a habit first, then link scripture.');
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await updateFaithGrindLink(initial.id, {
          habitId,
          scripture,
          reflectionPrompt: prompt,
        });
      } else {
        await createFaithGrindLink({ habitId, scripture, reflectionPrompt: prompt });
      }
      onSaved();
    } catch {
      addToast('danger', 'Could not save faith link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit link' : 'Faith × Grind link'}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Select
          label="Habit"
          value={habitId}
          onChange={(e) => setHabitId(e.target.value)}
          options={
            habitOptions.length
              ? habitOptions
              : [{ value: '', label: 'No habits yet — create one first' }]
          }
        />
        <Textarea
          label="Scripture"
          value={scripture}
          onChange={(e) => setScripture(e.target.value)}
          required
          rows={2}
        />
        <Textarea
          label="Reflection prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={2}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
