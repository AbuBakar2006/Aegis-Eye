import { motion } from 'framer-motion';
import { Clock, MapPin, Video, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Incident } from '@/types/incident';
import { SeverityBadge } from './SeverityBadge';
import { formatTimeAgo, formatConfidence, vehicleTypeIcon, capitalizeFirst } from '@/utils/format';

interface IncidentCardProps {
  incident: Incident;
  index?: number;
}

export function IncidentCard({ incident, index = 0 }: IncidentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/incidents/${incident.id}`}
        className="block glass-card glow-border p-4 transition-all duration-200 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={incident.severity} pulse={incident.severity === 'HIGH'} />
              <span className="text-xs font-mono text-blue-400">{incident.id}</span>
              <span className="text-xs text-gray-600 ml-auto">{incident.cameraId}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-300 mb-1">
              <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="truncate">{incident.location}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(incident.timestamp)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-500">Confidence</div>
              <div className="text-sm font-mono text-white">{formatConfidence(incident.confidence)}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>

        {/* Vehicles */}
        {incident.vehicles.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {incident.vehicles.map((v, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300"
              >
                <span>{vehicleTypeIcon(v.type)}</span>
                <span>{capitalizeFirst(v.type)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Action icons */}
        <div className="mt-3 flex items-center gap-3">
          {incident.blackboxAvailable && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400">
              <Video className="w-3 h-3" /> Clip
            </span>
          )}
          {incident.reportUrl && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <FileText className="w-3 h-3" /> Report
            </span>
          )}
          <span
            className={`ml-auto text-[10px] font-mono ${
              incident.alertStatus === 'SENT' ? 'text-green-400' : 'text-gray-500'
            }`}
          >
            ALERT {incident.alertStatus}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
