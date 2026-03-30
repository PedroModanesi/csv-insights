import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { useCSVStore } from '../../store/csvStore';

interface HistogramViewProps {
  column: string;
  title: string;
}

const BUCKET_COUNT = 10;

export function HistogramView({ column, title }: HistogramViewProps) {
  const { rawData, columnStats } = useCSVStore();
  const stats = columnStats[column];

  const data = useMemo(() => {
    if (!stats || stats.type !== 'number') return [];

    const values = rawData
      .map(r => parseFloat((r[column] ?? '').replace(',', '.')))
      .filter(n => !isNaN(n) && isFinite(n));

    if (values.length === 0) return [];

    const { min, max } = stats;
    if (min === max) return [{ label: String(min), count: values.length }];

    const bucketSize = (max - min) / BUCKET_COUNT;
    const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => ({
      label: (min + i * bucketSize).toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
      count: 0,
    }));

    for (const v of values) {
      const idx = Math.min(Math.floor((v - min) / bucketSize), BUCKET_COUNT - 1);
      buckets[idx].count++;
    }

    return buckets;
  }, [rawData, column, stats]);

  if (data.length === 0) {
    return <div className="text-gray-400 text-center py-8">Dados insuficientes</div>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }} barCategoryGap="5%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6b7280' }}
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
            formatter={(v) => [v as number, 'Frequência']}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Frequência" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
