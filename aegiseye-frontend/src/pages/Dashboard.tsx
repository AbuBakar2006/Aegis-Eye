import { motion } from 'framer-motion';
import { AlertTriangle, Camera, CheckCircle2, TrendingUp, Activity, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIncidents } from '@/hooks/useIncidents';
import { useCameras } from '@/hooks/useCameras';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { BackendStatus } from '@/components/shared/BackendStatus';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { ErrorState } from '@/components/shared/ErrorState';
import { SeverityChart } from '@/components/analytics/SeverityChart';
import { formatTimeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, color, subtitle, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card glow-border p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: incidents, isLoading: incLoading, error: incError, refetch } = useIncidents();
  const { data: cameras } = useCameras();

  const today = new Date().toISOString().slice(0, 10);
  const todayIncidents = incidents?.filter((i) => i.timestamp.startsWith(today)) ?? [];
  const highCount = todayIncidents.filter((i) => i.severity === 'HIGH').length;
  const medCount = todayIncidents.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = todayIncidents.filter((i) => i.severity === 'LOW').length;
  const onlineCameras = cameras?.filter((c) => c.status === 'ONLINE' || c.status === 'ALERT').length ?? 0;
  const alertCameras = cameras?.filter((c) => c.status === 'ALERT').length ?? 0;

  const recentIncidents = [...(incidents ?? [])].slice(0, 5);

  if (incLoading) return <PageLoader />;
  if (incError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">System Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time accident detection monitoring — {formatTimeAgo(new Date().toISOString())}
          </p>
        </div>
        <BackendStatus />
      </div>

      {/* Alert banner */}
      {alertCameras > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-alert-flash"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-medium">
            {alertCameras} camera{alertCameras > 1 ? 's' : ''} currently reporting an active incident
          </span>
          <Link
            to="/cameras"
            className="ml-auto text-xs text-red-400 underline hover:text-red-300"
          >
            View Cameras →
          </Link>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Incidents Today"
          value={todayIncidents.length}
          icon={AlertTriangle}
          color="bg-red-500/80"
          subtitle={`${highCount} high severity`}
          delay={0}
        />
        <StatCard
          label="Active Cameras"
          value={`${onlineCameras}/${cameras?.length ?? 0}`}
          icon={Camera}
          color="bg-blue-600/80"
          subtitle={alertCameras > 0 ? `${alertCameras} in alert` : 'All clear'}
          delay={0.05}
        />
        <StatCard
          label="Alerts Sent"
          value={todayIncidents.filter((i) => i.alertStatus === 'SENT').length}
          icon={Zap}
          color="bg-green-600/80"
          subtitle="Emergency notifications"
          delay={0.1}
        />
        <StatCard
          label="Total Incidents"
          value={incidents?.length ?? 0}
          icon={Activity}
          color="bg-purple-600/80"
          subtitle="All time"
          delay={0.15}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent incidents */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Incidents
            </h3>
            <Link
              to="/incidents"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentIncidents.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500 text-sm">
              No incidents recorded today
            </div>
          ) : (
            recentIncidents.map((incident, i) => (
              <IncidentCard key={incident.id} incident={incident} index={i} />
            ))
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Severity distribution */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Severity Distribution
            </h3>
            {incidents && incidents.length > 0 ? (
              <>
                <SeverityChart
                  high={incidents.filter((i) => i.severity === 'HIGH').length}
                  medium={incidents.filter((i) => i.severity === 'MEDIUM').length}
                  low={incidents.filter((i) => i.severity === 'LOW').length}
                />
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'High', count: incidents.filter((i) => i.severity === 'HIGH').length, color: 'bg-red-500' },
                    { label: 'Medium', count: incidents.filter((i) => i.severity === 'MEDIUM').length, color: 'bg-orange-500' },
                    { label: 'Low', count: incidents.filter((i) => i.severity === 'LOW').length, color: 'bg-yellow-500' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-gray-400">{s.label}</span>
                      <span className="ml-auto text-white font-mono">{s.count}</span>
                      <div className="confidence-bar w-16">
                        <div
                          className="confidence-fill"
                          style={{
                            width: `${incidents.length > 0 ? (s.count / incidents.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-600 text-sm py-8">No data</p>
            )}
          </div>

          {/* Camera status summary */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Camera className="w-4 h-4 text-blue-400" />
              Camera Status
            </h3>
            <div className="space-y-2">
              {cameras?.map((cam) => (
                <div key={cam.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      cam.status === 'ONLINE' ? 'bg-green-400' :
                      cam.status === 'ALERT' ? 'bg-red-400 animate-pulse' :
                      cam.status === 'MAINTENANCE' ? 'bg-yellow-400' :
                      'bg-gray-600'
                    )}
                  />
                  <span className="text-gray-400 font-mono">{cam.id}</span>
                  <span className="text-gray-500 truncate">{cam.name}</span>
                  <span
                    className={cn(
                      'ml-auto font-mono',
                      cam.status === 'ONLINE' ? 'text-green-400' :
                      cam.status === 'ALERT' ? 'text-red-400' :
                      'text-gray-600'
                    )}
                  >
                    {cam.status}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/cameras"
              className="mt-4 block text-center text-xs text-blue-400 hover:text-blue-300 transition-colors border-t border-aegis-border-dark pt-3"
            >
              Open Live Cameras →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
