import type { ColumnType } from '../../types/csv.types';

interface ColumnBadgeProps {
  type: ColumnType;
}

const TYPE_CONFIG: Record<ColumnType, { label: string; className: string }> = {
  number: { label: '123', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  date: { label: '📅', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  boolean: { label: '✓', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  category: { label: 'Abc', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  text: { label: 'T', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

export function ColumnBadge({ type }: ColumnBadgeProps) {
  const { label, className } = TYPE_CONFIG[type] ?? TYPE_CONFIG.text;

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
