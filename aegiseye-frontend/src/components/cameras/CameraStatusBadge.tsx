import { cn } from '@/utils/cn';
import type { CameraStatus } from '@/types/camera';

interface CameraStatusBadgeProps {
  status: CameraStatus;
  showLabel?: boolean;
}

export function CameraStatusBadge({ status, showLabel = true }: CameraStatusBadgeProps) {
  const configs = {
    ONLINE: { dot: 'status-dot-online', label: 'Online', text: 'text-green-400' },
    OFFLINE: { dot: 'status-dot-offline', label: 'Offline', text: 'text-gray-500' },
    ALERT: { dot: 'status-dot-alert', label: 'ALERT', text: 'text-red-400 font-semibold' },
    MAINTENANCE: { dot: 'status-dot-maintenance', label: 'Maint.', text: 'text-yellow-400' },
  };

  const config = configs[status] ?? configs.OFFLINE;

  return (
    <div className="flex items-center gap-1.5">
      <span className={config.dot} />
      {showLabel && <span className={cn('text-xs', config.text)}>{config.label}</span>}
    </div>
  );
}
