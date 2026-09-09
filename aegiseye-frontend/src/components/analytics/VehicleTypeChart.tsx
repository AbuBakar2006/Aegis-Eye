import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Incident } from '@/types/incident';
import { capitalizeFirst } from '@/utils/format';

interface VehicleTypeChartProps {
  incidents: Incident[];
}

const BAR_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#22C55E', '#EAB308', '#06B6D4'];

export function VehicleTypeChart({ incidents }: VehicleTypeChartProps) {
  const counts: Record<string, number> = {};
  incidents.forEach((inc) => {
    inc.vehicles.forEach((v) => {
      const type = capitalizeFirst(v.type);
      counts[type] = (counts[type] || 0) + 1;
    });
  });

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4F" vertical={false} />
        <XAxis
          dataKey="type"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={{ stroke: '#1E2D4F' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#141B2D',
            border: '1px solid #1E2D4F',
            borderRadius: 8,
            fontSize: 12,
            color: '#fff',
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
