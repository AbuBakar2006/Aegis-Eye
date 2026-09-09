import { cn } from '@/utils/cn';
import type { Severity } from '@/types/incident';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function SeverityBadge({ severity, size = 'md', pulse = false }: SeverityBadgeProps) {
  const configs = {
    HIGH: { label: 'HIGH', dot: 'bg-red-400', classes: 'severity-high' },
    MEDIUM: { label: 'MED', dot: 'bg-orange-400', classes: 'severity-medium' },
    LOW: { label: 'LOW', dot: 'bg-yellow-400', classes: 'severity-low' },
  };

  const config = configs[severity] ?? configs.LOW;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-mono font-semibold',
        config.classes,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot, pulse && 'animate-pulse')} />
      {config.label}
    </span>
  );
}
