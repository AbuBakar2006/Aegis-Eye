import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface SeverityChartProps {
  high: number;
  medium: number;
  low: number;
}

const COLORS = {
  HIGH: '#EF4444',
  MEDIUM: '#F97316',
  LOW: '#EAB308',
};

export function SeverityChart({ high, medium, low }: SeverityChartProps) {
  const data = [
    { name: 'High', value: high, color: COLORS.HIGH },
    { name: 'Medium', value: medium, color: COLORS.MEDIUM },
    { name: 'Low', value: low, color: COLORS.LOW },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#141B2D',
            border: '1px solid #1E2D4F',
            borderRadius: 8,
            fontSize: 12,
            color: '#fff',
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
