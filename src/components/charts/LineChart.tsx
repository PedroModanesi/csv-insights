import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { useCSVStore } from '../../store/csvStore';

interface LineChartViewProps {
  xColumn: string;
  yColumn: string;
  title: string;
}

export function LineChartView({ xColumn, yColumn, title }: LineChartViewProps) {
  const { rawData, columnTypes } = useCSVStore();

  const data = useMemo(() => {
    const rows = rawData
      .map(r => ({
        x: r[xColumn] ?? '',
        y: parseFloat((r[yColumn] ?? '').replace(',', '.')),
        ts: Date.parse(r[xColumn] ?? ''),
      }))
      .filter(r => !isNaN(r.y) && !isNaN(r.ts))
      .sort((a, b) => a.ts - b.ts);

    // Limit to 200 points to keep chart readable
    if (rows.length <= 200) return rows;
    const step = Math.ceil(rows.length / 200);
    return rows.filter((_, i) => i % step === 0);
  }, [rawData, xColumn, yColumn]);

  if (data.length === 0) {
    return <div className="text-gray-400 text-center py-8">Dados insuficientes</div>;
  }

  const isDateX = columnTypes[xColumn] === 'date';

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            angle={-35}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: 12,
            }}
            formatter={(v) => [v as number, yColumn]}
            labelFormatter={(label) => isDateX ? `Data: ${label}` : label}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#10b981"
            strokeWidth={2}
            dot={data.length <= 50}
            name={yColumn}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
