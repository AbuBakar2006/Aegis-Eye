import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import type { Incident } from '@/types/incident';

interface IncidentTrendChartProps {
  incidents: Incident[];
  days?: number;
}

export function IncidentTrendChart({ incidents, days = 7 }: IncidentTrendChartProps) {
  // Build last N days data
  const data = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = incidents.filter((inc) =>
      inc.timestamp.startsWith(dateStr)
    ).length;
    return {
      date: format(date, 'MMM d'),
      incidents: count,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4F" />
        <XAxis
          dataKey="date"
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
        <Line
          type="monotone"
          dataKey="incidents"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', r: 3 }}
          activeDot={{ r: 5, fill: '#60A5FA' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
