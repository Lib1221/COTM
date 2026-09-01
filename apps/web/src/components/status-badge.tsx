import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '@/lib/types';

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }
> = {
  PLANNED: { label: 'Planned', variant: 'secondary' },
  ONGOING: { label: 'Ongoing', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
