import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Wifi, AlertTriangle, Clock, Activity } from 'lucide-react';
import type { Camera as CameraType } from '@/types/camera';
import { CameraStatusBadge } from './CameraStatusBadge';
import { formatShortTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/appStore';
import { Link } from 'react-router-dom';

interface CameraFeedProps {
  camera: CameraType;
  showDemo?: boolean;
}

// Demo simulation stages for Demo Mode
const DEMO_STAGES = [
  { id: 'normal', label: 'Monitoring...', duration: 4000 },
  { id: 'motion', label: 'Motion Detected', duration: 1500 },
  { id: 'detecting', label: 'AI Processing...', duration: 2000 },
  { id: 'accident', label: 'ACCIDENT DETECTED', duration: 3000 },
  { id: 'classifying', label: 'Classifying Vehicles...', duration: 2000 },
  { id: 'severity', label: 'Severity: HIGH', duration: 2000 },
  { id: 'blackbox', label: 'Blackbox Saved', duration: 1500 },
  { id: 'alert', label: 'Alert Sent ✓', duration: 2000 },
];

export function CameraFeed({ camera, showDemo = false }: CameraFeedProps) {
  const demoMode = useAppStore((s) => s.demoMode);
  const setActiveAlert = useAppStore((s) => s.setActiveAlert);
  const [tick, setTick] = useState(Date.now());
  const [demoStage, setDemoStage] = useState(0);

  // Live clock for timestamp overlay
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Demo simulation loop (only on alert cameras in demo mode)
  useEffect(() => {
    if (!demoMode || !showDemo) return;

    const stage = DEMO_STAGES[demoStage];
    const timer = setTimeout(() => {
      const next = (demoStage + 1) % DEMO_STAGES.length;
      setDemoStage(next);
      if (DEMO_STAGES[next].id === 'accident') {
        setActiveAlert('AE-2026-0041');
      } else if (DEMO_STAGES[next].id === 'normal') {
        setActiveAlert(null);
      }
    }, stage.duration);

    return () => clearTimeout(timer);
  }, [demoMode, showDemo, demoStage, setActiveAlert]);

  const currentDemoStage = DEMO_STAGES[demoStage];
  const isAccidentStage =
    currentDemoStage.id === 'accident' ||
    currentDemoStage.id === 'classifying' ||
    currentDemoStage.id === 'severity';
  const isAlertCamera = camera.status === 'ALERT';

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden border bg-aegis-bg-card flex flex-col',
        isAlertCamera || (showDemo && isAccidentStage)
          ? 'border-red-500/60 shadow-lg shadow-red-500/10 animate-alert-flash'
          : 'border-aegis-border-dark'
      )}
    >
      {/* Video / Feed area */}
      <div className="relative aspect-video bg-black flex-shrink-0 camera-placeholder">
        {/* Real stream — only rendered when backend provides a URL */}
        {!demoMode && camera.streamUrl && camera.status !== 'OFFLINE' ? (
          camera.streamFormat === 'mjpeg' ? (
            // MJPEG: render as <img> with continuous refresh
            <img
              src={camera.streamUrl}
              alt={`${camera.name} feed`}
              className="w-full h-full object-cover"
            />
          ) : (
            // HLS / WebRTC / other — use <video>
            <video
              src={camera.streamUrl}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          )
        ) : (
          /* Demo / No stream placeholder */
          <div className="absolute inset-0 flex items-center justify-center">
            {camera.status === 'OFFLINE' ? (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <Wifi className="w-8 h-8 opacity-30" />
                <span className="text-xs">No Signal</span>
              </div>
            ) : (
              /* Animated placeholder representing live feed */
              <div className="w-full h-full relative overflow-hidden">
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/3 to-transparent animate-pulse-slow" />
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <Camera className="w-10 h-10 text-blue-400" />
                    <span className="text-xs text-blue-400 font-mono">{camera.id}</span>
                  </div>
                </div>
                {/* Demo overlay */}
                {demoMode && showDemo && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentDemoStage.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-end justify-start p-3"
                    >
                      <div
                        className={cn(
                          'px-2 py-1 rounded text-xs font-mono font-bold',
                          isAccidentStage
                            ? 'bg-red-500/80 text-white'
                            : currentDemoStage.id === 'alert' || currentDemoStage.id === 'blackbox'
                            ? 'bg-green-500/80 text-white'
                            : currentDemoStage.id === 'motion' || currentDemoStage.id === 'detecting'
                            ? 'bg-yellow-500/80 text-black'
                            : 'bg-blue-500/20 text-blue-300'
                        )}
                      >
                        {currentDemoStage.label}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
                {/* Vehicle classification overlay (demo) */}
                {demoMode && showDemo && currentDemoStage.id === 'classifying' && (
                  <div className="absolute top-2 right-2 space-y-1">
                    {[
                      { label: 'Car', conf: '97%' },
                      { label: 'Motorcycle', conf: '91%' },
                    ].map((v) => (
                      <motion.div
                        key={v.label}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="px-2 py-0.5 rounded bg-blue-500/70 text-white text-[10px] font-mono"
                      >
                        {v.label} {v.conf}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recording indicator */}
        {camera.status !== 'OFFLINE' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono text-white/80">REC</span>
          </div>
        )}

        {/* FPS / timestamp overlay */}
        <div className="absolute top-2 right-2 text-[10px] font-mono text-white/50 text-right">
          {camera.fps ? `${camera.fps} FPS` : ''}
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white/50">
          {formatShortTime(new Date(tick).toISOString())}
        </div>

        {/* Alert overlay */}
        <AnimatePresence>
          {(isAlertCamera || (showDemo && isAccidentStage)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 border-2 border-red-500 rounded-xl pointer-events-none"
            >
              <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-center text-[10px] font-mono font-bold py-0.5">
                ⚠ INCIDENT DETECTED
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info panel */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400">{camera.id}</span>
              <CameraStatusBadge status={camera.status} />
            </div>
            <p className="text-sm text-white font-medium mt-0.5 truncate">{camera.name}</p>
            <p className="text-xs text-gray-500 truncate">{camera.location}</p>
          </div>
          {camera.activeIncident && (
            <Link
              to={`/incidents/${camera.activeIncident}`}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              View
            </Link>
          )}
        </div>

        {/* AI overlay info */}
        {camera.overlayInfo && camera.status !== 'OFFLINE' && (
          <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-aegis-border-dark pt-2">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>{camera.overlayInfo.vehiclesDetected} vehicles</span>
            </div>
            {camera.overlayInfo.confidence && (
              <div>
                <span className="text-blue-400">{Math.round(camera.overlayInfo.confidence * 100)}%</span>{' '}
                confidence
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              <span className={camera.overlayInfo.isProcessing ? 'text-green-400' : 'text-gray-600'}>
                {camera.overlayInfo.isProcessing ? 'AI Active' : 'Idle'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
