import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { useCSVStore } from '../../store/csvStore';

interface ScatterPlotViewProps {
  xColumn: string;
  yColumn: string;
  title: string;
}

export function ScatterPlotView({ xColumn, yColumn, title }: ScatterPlotViewProps) {
  const { rawData } = useCSVStore();

  const data = useMemo(() => {
    const points = rawData
      .map(r => ({
        x: parseFloat((r[xColumn] ?? '').replace(',', '.')),
        y: parseFloat((r[yColumn] ?? '').replace(',', '.')),
      }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));

    // Sample up to 500 points to keep chart performant
    if (points.length <= 500) return points;
    const step = Math.ceil(points.length / 500);
    return points.filter((_, i) => i % step === 0);
  }, [rawData, xColumn, yColumn]);

  if (data.length === 0) {
    return <div className="text-gray-400 text-center py-8">Dados insuficientes</div>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="x"
            name={xColumn}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ value: xColumn, position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yColumn}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ value: yColumn, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: 12,
            }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter data={data} fill="#f59e0b" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-gray-400 mt-1">{data.length} pontos plotados</p>
    </div>
  );
}
