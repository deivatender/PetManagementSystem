/**
 * Build a URLSearchParams from a params object, dropping `undefined`, `null`,
 * and empty-string values so we never send blank query params to the API.
 * Shared by the list and CSV-export calls.
 */
export function buildQuery(params: Record<string, unknown>): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  return search;
}
