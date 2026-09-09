import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpDown, Download, Eye, Video, FileText } from 'lucide-react';
import type { Incident, Severity } from '@/types/incident';
import { SeverityBadge } from './SeverityBadge';
import { formatTimestamp, formatConfidence, vehicleTypeIcon, capitalizeFirst } from '@/utils/format';
import { incidentService } from '@/api/incidents';
import { useAppStore } from '@/store/appStore';

interface IncidentTableProps {
  incidents: Incident[];
}

type SortKey = 'timestamp' | 'severity' | 'confidence';

const SEVERITY_ORDER: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function IncidentTable({ incidents }: IncidentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const demoMode = useAppStore((s) => s.demoMode);

  const sorted = [...incidents].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
    else if (sortKey === 'severity') cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    else if (sortKey === 'confidence') cmp = a.confidence - b.confidence;
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleDownload = async (type: 'clip' | 'report', id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (demoMode) {
      alert('Demo Mode: Downloads available when connected to backend.');
      return;
    }
    setDownloading(`${type}-${id}`);
    try {
      if (type === 'clip') await incidentService.downloadClip(id);
      else await incidentService.downloadReport(id);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const SortBtn = ({ col }: { col: SortKey }) => (
    <button onClick={() => toggleSort(col)} className="ml-1 text-gray-600 hover:text-gray-400">
      <ArrowUpDown className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-aegis-border-dark">
            {[
              { label: 'ID', key: null },
              { label: 'Timestamp', key: 'timestamp' as SortKey },
              { label: 'Camera', key: null },
              { label: 'Location', key: null },
              { label: 'Severity', key: 'severity' as SortKey },
              { label: 'Confidence', key: 'confidence' as SortKey },
              { label: 'Vehicles', key: null },
              { label: 'Alert', key: null },
              { label: 'Actions', key: null },
            ].map(({ label, key }) => (
              <th
                key={label}
                className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {label}
                {key && <SortBtn col={key} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-aegis-border-dark">
          {sorted.map((incident, i) => (
            <motion.tr
              key={incident.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-4 font-mono text-blue-400 text-xs">{incident.id}</td>
              <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                {formatTimestamp(incident.timestamp)}
              </td>
              <td className="py-3 px-4 text-gray-300 text-xs font-mono">{incident.cameraId}</td>
              <td className="py-3 px-4 text-gray-300 text-xs max-w-[180px]">
                <span className="truncate block">{incident.location}</span>
              </td>
              <td className="py-3 px-4">
                <SeverityBadge severity={incident.severity} size="sm" />
              </td>
              <td className="py-3 px-4 font-mono text-gray-300 text-xs">
                {formatConfidence(incident.confidence)}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  {incident.vehicles.slice(0, 3).map((v, vi) => (
                    <span key={vi} title={capitalizeFirst(v.type)}>
                      {vehicleTypeIcon(v.type)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-mono ${
                    incident.alertStatus === 'SENT' ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {incident.alertStatus}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/incidents/${incident.id}`}
                    className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="View detail"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  {incident.blackboxAvailable && (
                    <button
                      onClick={(e) => handleDownload('clip', incident.id, e)}
                      disabled={downloading === `clip-${incident.id}`}
                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                      title="Download clip"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDownload('report', incident.id, e)}
                    disabled={downloading === `report-${incident.id}`}
                    className="p-1.5 rounded-md text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    title="Download report"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
