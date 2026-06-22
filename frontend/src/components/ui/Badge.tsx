import { cn } from './cn';
import type { PetStatus } from '../../types/pet';

// Status colours chosen for AA contrast against their backgrounds.
const STATUS_STYLES: Record<PetStatus, string> = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-slate-200 text-slate-700',
  Deceased: 'bg-slate-800 text-white',
  Rehomed: 'bg-amber-100 text-amber-800',
};

export function StatusBadge({ status }: { status: PetStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700',
        className,
      )}
    >
      {children}
    </span>
  );
}
