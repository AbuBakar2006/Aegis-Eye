import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { IncidentTable } from '@/components/incidents/IncidentTable';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Severity } from '@/types/incident';

const SEVERITY_OPTIONS: (Severity | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

export default function Incidents() {
  const { data: incidents, isLoading, error, refetch } = useIncidents();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    let result = incidents ?? [];
    if (severityFilter !== 'ALL') {
      result = result.filter((i) => i.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.cameraId.toLowerCase().includes(q) ||
          i.vehicles.some((v) => v.type.toLowerCase().includes(q))
      );
    }
    return result;
  }, [incidents, search, severityFilter]);

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Incident History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {incidents?.length ?? 0} total incidents — AI-detected accident events
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors border border-white/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by ID, location, camera, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex gap-1">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  severityFilter === s
                    ? s === 'ALL'
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                      : s === 'HIGH'
                      ? 'bg-red-500/30 text-red-400 border border-red-500/40'
                      : s === 'MEDIUM'
                      ? 'bg-orange-500/30 text-orange-400 border border-orange-500/40'
                      : 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/40'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <div className="text-xs text-gray-600">
        Showing {filtered.length} of {incidents?.length ?? 0} incidents
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No incidents found"
          message={
            search || severityFilter !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'No incidents have been recorded yet.'
          }
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <IncidentTable incidents={filtered} />
        </div>
      )}
    </div>
  );
}
