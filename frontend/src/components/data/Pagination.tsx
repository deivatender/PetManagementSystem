import { Button } from '../ui/Button';
import type { Pagination as PaginationMeta } from '../../types/common';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

/** Page-based pager matching the contract envelope (§3.3). */
export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, page_size, total, total_pages } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * page_size + 1;
  const to = Math.min(page * page_size, total);

  return (
    <nav
      className="flex items-center justify-between border-t border-slate-200 px-2 py-3"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-600" aria-live="polite">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span>{' '}
        of <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {total_pages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
