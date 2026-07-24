import type { LucideIcon } from 'lucide-react';
import { Rocket } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '@/components/ui';

export function ComingOnlinePage({
  title,
  description,
  icon: Icon = Rocket,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Module"
      />
      <Card glass className="min-h-[280px]">
        <EmptyState
          icon={Icon}
          title="Coming online"
          description={`${title} is wired into Mission Control. Full controls land in the next build wave.`}
        />
      </Card>
    </div>
  );
}
