import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCSVStore } from '../../store/csvStore';

interface BarChartViewProps {
  column: string;
  title: string;
}

export function BarChartView({ column, title }: BarChartViewProps) {
  const { columnStats } = useCSVStore();
  const stats = columnStats[column];

  if (!stats || (stats.type !== 'category' && stats.type !== 'boolean')) {
    return <div className="text-gray-400 text-center py-8">Dados insuficientes</div>;
  }

  const frequencies = stats.type === 'category'
    ? stats.frequencies
    : { 'Verdadeiro': stats.trueCount, 'Falso': stats.falseCount };

  const data = Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            angle={-35}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Contagem" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
