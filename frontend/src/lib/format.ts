// Display formatting helpers. All API timestamps are UTC ISO strings (§7).

/** Format an ISO datetime as a short local date, e.g. "10 Jun 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Format an ISO datetime with time, e.g. "10 Jun 2026, 09:00". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Render a possibly-empty value with an em-dash placeholder. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/** Human age label from the server-computed `age` value. */
export function formatAge(age: number | null | undefined): string {
  if (age === null || age === undefined) return '—';
  if (age === 0) return '< 1 yr';
  return `${age} yr${age === 1 ? '' : 's'}`;
}
