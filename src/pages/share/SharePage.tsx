import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Badge, Card, CardHeader, CardTitle, Progress } from '@/components/ui';
import { decodeAccountabilityCard } from '@/services/mission/accountability';
import { formatDate } from '@/lib/utils';

/** Public read-only accountability card (no login required). */
export default function SharePage() {
  const { payload } = useParams();
  const card = useMemo(
    () => (payload ? decodeAccountabilityCard(payload) : null),
    [payload],
  );

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
        <Card className="max-w-md">
          <CardTitle>Scorecard unavailable</CardTitle>
          <p className="mt-2 text-sm text-text-muted">
            This accountability link is invalid or expired.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="mark" showWordmark={false} />
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
              G4 Accountability
            </p>
            <p className="font-display text-xl font-bold">{card.name}</p>
          </div>
        </div>

        <Card glass>
          <CardHeader>
            <CardTitle>Weekly callsign</CardTitle>
            <Badge tone="accent">{card.weekKey}</Badge>
          </CardHeader>
          <p className="font-display text-2xl font-bold text-accent">{card.callsign}</p>
          <p className="mt-2 text-sm text-text-muted">
            Overall mission score{' '}
            <span className="font-semibold text-text">{card.overall}</span>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Habits today {card.habitsDone}/{card.habitsTarget}
          </p>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['God', card.god, 'god'],
              ['Goals', card.goals, 'goals'],
              ['Grinding', card.grinding, 'grinding'],
              ['Gratitude', card.gratitude, 'gratitude'],
            ] as const
          ).map(([label, value, tone]) => (
            <Card key={label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-text-muted">{label}</span>
                <Badge tone={tone}>{value}</Badge>
              </div>
              <Progress value={value} size="sm" />
            </Card>
          ))}
        </div>

        {card.note ? (
          <Card>
            <p className="text-sm text-text-muted">{card.note}</p>
          </Card>
        ) : null}

        <p className="text-center text-[11px] text-text-muted">
          Read-only snapshot · {formatDate(card.generatedAt, 'MMM d, yyyy HH:mm')} · No private
          journals included
        </p>
      </div>
    </div>
  );
}
