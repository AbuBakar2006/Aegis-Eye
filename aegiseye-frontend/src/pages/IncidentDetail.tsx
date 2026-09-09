import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Camera, Gauge, Download,
  Video, FileText, CheckCircle2, AlertCircle, Box, Zap,
} from 'lucide-react';
import { useIncident } from '@/hooks/useIncidents';
import { SeverityBadge } from '@/components/incidents/SeverityBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { incidentService } from '@/api/incidents';
import { useAppStore } from '@/store/appStore';
import {
  formatTimestamp, formatConfidence, formatTimeAgo,
  vehicleTypeIcon, capitalizeFirst, formatGps,
} from '@/utils/format';
import { useState } from 'react';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading, error, refetch } = useIncident(id!);
  const demoMode = useAppStore((s) => s.demoMode);
  const [downloading, setDownloading] = useState<'clip' | 'report' | null>(null);

  const handleDownload = async (type: 'clip' | 'report') => {
    if (!incident) return;
    if (demoMode) {
      alert('Demo Mode: Downloads are available when connected to the real backend.');
      return;
    }
    setDownloading(type);
    try {
      if (type === 'clip') await incidentService.downloadClip(incident.id);
      else await incidentService.downloadReport(incident.id);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!incident) return <EmptyState title="Incident not found" />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Incidents
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SeverityBadge severity={incident.severity} size="md" pulse={incident.severity === 'HIGH'} />
              <span className="text-lg font-bold font-mono text-blue-400">{incident.id}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              {incident.location}
            </div>
            {incident.gps && (
              <p className="text-xs font-mono text-gray-600 ml-6">
                {formatGps(incident.gps.lat, incident.gps.lng)}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimestamp(incident.timestamp)}</span>
            </div>
            <div className="text-xs text-gray-600">{formatTimeAgo(incident.timestamp)}</div>
          </div>
        </div>
      </motion.div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — Metadata */}
        <div className="space-y-4">
          {/* Detection info */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-white border-b border-aegis-border-dark pb-2">
              Detection Metadata
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Camera', value: incident.cameraId, icon: Camera },
                { label: 'Confidence', value: formatConfidence(incident.confidence), icon: Gauge },
                { label: 'Severity Score', value: incident.opticalFlowScore?.toFixed(1) ?? 'N/A', icon: Gauge },
                { label: 'Alert Status', value: incident.alertStatus, icon: Zap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>
                  <div className="text-sm font-mono text-white">{value}</div>
                </div>
              ))}
            </div>

            {/* Confidence bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Detection Confidence</span>
                <span className="text-white">{formatConfidence(incident.confidence)}</span>
              </div>
              <div className="confidence-bar">
                <motion.div
                  className="confidence-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${incident.confidence * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Vehicles */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white border-b border-aegis-border-dark pb-2 mb-4">
              Vehicle Classification
            </h3>
            {incident.vehicles.length === 0 ? (
              <p className="text-xs text-gray-500">No vehicles classified</p>
            ) : (
              <div className="space-y-3">
                {incident.vehicles.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xl">{vehicleTypeIcon(v.type)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white">{capitalizeFirst(v.type)}</span>
                        <span className="text-gray-500 font-mono">{formatConfidence(v.confidence)}</span>
                      </div>
                      <div className="confidence-bar">
                        <motion.div
                          className="confidence-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${v.confidence * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Alert status */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white border-b border-aegis-border-dark pb-2 mb-4">
              Alert & Response
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: 'Emergency Alert',
                  status: incident.alertStatus === 'SENT',
                  text: incident.alertStatus,
                },
                {
                  label: 'Blackbox Available',
                  status: incident.blackboxAvailable,
                  text: incident.blackboxAvailable ? 'Saved' : 'Not available',
                },
              ].map(({ label, status, text }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    {status ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-gray-600" />
                    )}
                    <span className={status ? 'text-green-400' : 'text-gray-600'}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right — Clip + Report */}
        <div className="space-y-4">
          {/* Blackbox clip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white border-b border-aegis-border-dark pb-2 mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-400" />
              10-Second Blackbox Clip
            </h3>
            {incident.blackboxAvailable ? (
              <div className="space-y-3">
                {/* Video player — real URL if backend provides it */}
                <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center border border-aegis-border-dark camera-placeholder">
                  {incident.clipUrl && !demoMode ? (
                    <video
                      src={incident.clipUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <Video className="w-8 h-8 opacity-30" />
                      <span className="text-xs">
                        {demoMode ? 'Clip available when connected to backend' : 'Loading clip...'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload('clip')}
                  disabled={downloading === 'clip'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloading === 'clip' ? 'Downloading...' : 'Download Clip (.mp4)'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 text-sm">
                Blackbox clip not available for this incident.
              </div>
            )}
          </motion.div>

          {/* PDF Report */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white border-b border-aegis-border-dark pb-2 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-400" />
              Insurance PDF Report
            </h3>
            <div className="space-y-3">
              <div className="rounded-lg p-4 bg-white/[0.02] border border-aegis-border-dark text-xs text-gray-500 space-y-1.5">
                <p>📄 <strong className="text-gray-400">Report ID:</strong> {incident.id}</p>
                <p>📍 <strong className="text-gray-400">Location:</strong> {incident.location}</p>
                <p>🕐 <strong className="text-gray-400">Timestamp:</strong> {formatTimestamp(incident.timestamp)}</p>
                <p>⚠️ <strong className="text-gray-400">Severity:</strong> {incident.severity}</p>
                <p>🚗 <strong className="text-gray-400">Vehicles:</strong> {incident.vehicles.map((v) => capitalizeFirst(v.type)).join(', ') || 'Unknown'}</p>
                <p>📊 <strong className="text-gray-400">Confidence:</strong> {formatConfidence(incident.confidence)}</p>
              </div>
              <button
                onClick={() => handleDownload('report')}
                disabled={downloading === 'report'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading === 'report' ? 'Downloading...' : 'Download Report (.pdf)'}
              </button>
            </div>
          </motion.div>

          {/* Description */}
          {incident.description && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-white border-b border-aegis-border-dark pb-2 mb-3">
                Description
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{incident.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
