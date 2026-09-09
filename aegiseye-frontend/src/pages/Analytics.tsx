import { motion } from 'framer-motion';
import { TrendingUp, PieChart, BarChart3, Activity, Clock } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { SeverityChart } from '@/components/analytics/SeverityChart';
import { IncidentTrendChart } from '@/components/analytics/IncidentTrendChart';
import { VehicleTypeChart } from '@/components/analytics/VehicleTypeChart';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { ErrorState } from '@/components/shared/ErrorState';
import { formatConfidence } from '@/utils/format';

interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}

function ChartCard({ title, icon: Icon, children, delay = 0 }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-blue-400" />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

export default function Analytics() {
  const { data: incidents, isLoading, error, refetch } = useIncidents();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const inc = incidents ?? [];
  const highCount = inc.filter((i) => i.severity === 'HIGH').length;
  const medCount = inc.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = inc.filter((i) => i.severity === 'LOW').length;
  const avgConf = inc.length > 0
    ? inc.reduce((sum, i) => sum + i.confidence, 0) / inc.length
    : 0;
  const blackboxCount = inc.filter((i) => i.blackboxAvailable).length;
  const alertSent = inc.filter((i) => i.alertStatus === 'SENT').length;

  // Peak hours analysis
  const hourCounts: Record<number, number> = {};
  inc.forEach((i) => {
    const h = new Date(i.timestamp).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Analytics & Insights</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Statistical analysis of AI-detected incidents
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: inc.length, sub: 'All time' },
          { label: 'Avg Confidence', value: formatConfidence(avgConf), sub: 'Detection accuracy' },
          { label: 'Blackbox Clips', value: blackboxCount, sub: 'Evidence preserved' },
          { label: 'Alerts Sent', value: alertSent, sub: 'Emergency notifications' },
        ].map(({ label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Incident Trend (Last 7 Days)" icon={TrendingUp} delay={0.1}>
          {inc.length > 0 ? (
            <IncidentTrendChart incidents={inc} days={7} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          )}
        </ChartCard>

        <ChartCard title="Severity Distribution" icon={PieChart} delay={0.15}>
          {inc.length > 0 ? (
            <>
              <SeverityChart high={highCount} medium={medCount} low={lowCount} />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { label: 'High', count: highCount, pct: inc.length ? ((highCount / inc.length) * 100).toFixed(0) : 0, color: 'text-red-400' },
                  { label: 'Medium', count: medCount, pct: inc.length ? ((medCount / inc.length) * 100).toFixed(0) : 0, color: 'text-orange-400' },
                  { label: 'Low', count: lowCount, pct: inc.length ? ((lowCount / inc.length) * 100).toFixed(0) : 0, color: 'text-yellow-400' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
                    <div className="text-xs text-gray-500">{s.label} ({s.pct}%)</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Vehicle Types Involved" icon={BarChart3} delay={0.2}>
          {inc.length > 0 ? (
            <VehicleTypeChart incidents={inc} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          )}
        </ChartCard>

        <ChartCard title="Insights" icon={Activity} delay={0.25}>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <div className="text-xs text-blue-400 font-medium mb-1">🕐 Peak Incident Hour</div>
              <div className="text-white text-sm">
                {peakHour
                  ? `${parseInt(peakHour[0]).toString().padStart(2, '0')}:00 — ${peakHour[1]} incident${peakHour[1] > 1 ? 's' : ''}`
                  : 'Insufficient data'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <div className="text-xs text-red-400 font-medium mb-1">⚠️ High Severity Rate</div>
              <div className="text-white text-sm">
                {inc.length > 0
                  ? `${((highCount / inc.length) * 100).toFixed(0)}% of incidents are HIGH severity`
                  : 'No data'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <div className="text-xs text-green-400 font-medium mb-1">📊 Detection Accuracy</div>
              <div className="text-white text-sm">
                {inc.length > 0
                  ? `Average confidence: ${formatConfidence(avgConf)}`
                  : 'No data'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <div className="text-xs text-purple-400 font-medium mb-1">📦 Evidence Rate</div>
              <div className="text-white text-sm">
                {inc.length > 0
                  ? `${((blackboxCount / inc.length) * 100).toFixed(0)}% of incidents have blackbox clips`
                  : 'No data'}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
