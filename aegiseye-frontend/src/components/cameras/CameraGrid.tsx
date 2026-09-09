import { useState } from 'react';
import { Grid, Grid2x2 } from 'lucide-react';
import type { Camera } from '@/types/camera';
import { CameraFeed } from './CameraFeed';
import { cn } from '@/utils/cn';

interface CameraGridProps {
  cameras: Camera[];
}

type GridLayout = '2x2' | '3x2' | '1x1';

export function CameraGrid({ cameras }: CameraGridProps) {
  const [layout, setLayout] = useState<GridLayout>('2x2');

  const gridCols = {
    '1x1': 'grid-cols-1 max-w-2xl mx-auto',
    '2x2': 'grid-cols-1 md:grid-cols-2',
    '3x2': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  };

  // Find which cameras should show demo simulation (alert or first online one)
  const alertCamera = cameras.find((c) => c.status === 'ALERT');

  return (
    <div>
      {/* Layout toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500">Layout:</span>
        {(['2x2', '3x2', '1x1'] as GridLayout[]).map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-mono transition-colors',
              layout === l
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
            )}
          >
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600">
          {cameras.filter((c) => c.status === 'ONLINE' || c.status === 'ALERT').length} / {cameras.length} online
        </span>
      </div>

      <div className={cn('grid gap-4', gridCols[layout])}>
        {cameras.map((camera) => (
          <CameraFeed
            key={camera.id}
            camera={camera}
            showDemo={alertCamera ? camera.id === alertCamera.id : false}
          />
        ))}
      </div>
    </div>
  );
}
