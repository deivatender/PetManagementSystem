import type { ReactNode } from 'react';
import type { SortOrder } from '../../types/common';
import { cn } from '../ui/cn';

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. */
  render: (row: T) => ReactNode;
  /** When set, the column header becomes a sort toggle for this field. */
  sortField?: string;
  className?: string;
  /** Hide on narrow screens for responsive layout. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  /** Whole-row click handler (e.g. navigate to detail). */
  onRowClick?: (row: T) => void;
  /** Current sort, used to render the active header indicator. */
  sort?: { field: string; order: SortOrder };
  onSortChange?: (field: string) => void;
  /** Dim the table while a background refetch is in flight. */
  isFetching?: boolean;
}

const HIDE_CLASS: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

/** Generic, accessible, responsive table with optional column sorting. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  sort,
  onSortChange,
  isFetching = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-slate-200 text-sm', isFetching && 'opacity-60')}>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => {
              const isSorted = sort && col.sortField === sort.field;
              const ariaSort = isSorted
                ? sort!.order === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(
                    'px-4 py-3 text-left font-semibold text-slate-600',
                    col.hideBelow && HIDE_CLASS[col.hideBelow],
                    col.className,
                  )}
                >
                  {col.sortField && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(col.sortField as string)}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {col.header}
                      <span aria-hidden="true" className="text-xs">
                        {isSorted ? (sort!.order === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'cursor-pointer hover:bg-slate-50')}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-slate-700',
                    col.hideBelow && HIDE_CLASS[col.hideBelow],
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
