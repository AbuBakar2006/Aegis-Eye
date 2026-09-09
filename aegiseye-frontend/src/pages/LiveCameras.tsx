import { useCameras } from '@/hooks/useCameras';
import { CameraGrid } from '@/components/cameras/CameraGrid';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { ErrorState } from '@/components/shared/ErrorState';
import { motion } from 'framer-motion';
import { Camera, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export default function LiveCameras() {
  const { data: cameras, isLoading, error, refetch } = useCameras();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const online = cameras?.filter((c) => c.status === 'ONLINE' || c.status === 'ALERT').length ?? 0;
  const offline = cameras?.filter((c) => c.status === 'OFFLINE').length ?? 0;
  const alert = cameras?.filter((c) => c.status === 'ALERT').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Live Camera Feeds</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time CCTV monitoring with AI accident detection overlay
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400">{online} Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-500">{offline} Offline</span>
          </div>
          {alert > 0 && (
            <div className="flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">{alert} Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Note about stream format */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400/70"
      >
        <Camera className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          <strong className="text-blue-400">Stream format:</strong> Connect the backend and set{' '}
          <code className="font-mono bg-white/5 px-1 rounded">streamUrl</code> per camera (MJPEG / HLS / WebRTC).
          In Demo Mode, animated feed placeholders are shown.
        </span>
      </motion.div>

      {/* Camera grid */}
      {cameras && cameras.length > 0 ? (
        <CameraGrid cameras={cameras} />
      ) : (
        <div className="text-center py-16 text-gray-500">No cameras configured.</div>
      )}
    </div>
  );
}
