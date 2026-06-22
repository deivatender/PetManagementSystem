import type { ReactNode } from 'react';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { toApiError } from '../../api/client';

/** Centred loading state for a page or table region. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner size="lg" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Error state with the normalised message and an optional retry. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = toApiError(error);
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 py-12 px-6 text-center"
    >
      <p className="text-sm font-medium text-red-800">Something went wrong</p>
      <p className="max-w-md text-sm text-red-700">{apiError.message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Empty state with a call to action (e.g. "Add the first pet"). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-16 px-6 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
