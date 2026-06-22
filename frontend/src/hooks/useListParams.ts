import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortOrder } from '../types/common';

/**
 * Backs list-page state (page, page_size, sort, order, search, and arbitrary
 * filters) with the URL query string so paging/filtering is shareable and
 * survives the back button. Returns a typed getter plus setters that reset the
 * page to 1 whenever a filter/sort/search changes.
 */
export function useListParams(defaults: { sort: string; order?: SortOrder; pageSize?: number }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback(
    (key: string): string | undefined => searchParams.get(key) ?? undefined,
    [searchParams],
  );

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('page_size')) || defaults.pageSize || 20;
  const sort = searchParams.get('sort') || defaults.sort;
  const order = (searchParams.get('order') as SortOrder) || defaults.order || 'desc';
  const search = searchParams.get('search') ?? '';

  /** Merge updates into the query string. Non-page changes reset page to 1. */
  const update = useCallback(
    (changes: Record<string, string | number | undefined>, opts?: { keepPage?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (!opts?.keepPage && !('page' in changes)) next.set('page', '1');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback((p: number) => update({ page: p }, { keepPage: true }), [update]);

  const setSort = useCallback(
    (field: string) => {
      // Toggle order if clicking the active field, else default to asc.
      const nextOrder: SortOrder = sort === field && order === 'asc' ? 'desc' : 'asc';
      update({ sort: field, order: nextOrder });
    },
    [sort, order, update],
  );

  const setSearch = useCallback((value: string) => update({ search: value || undefined }), [update]);

  const clearAll = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  return useMemo(
    () => ({
      page,
      pageSize,
      sort,
      order,
      search,
      get,
      update,
      setPage,
      setSort,
      setSearch,
      clearAll,
    }),
    [page, pageSize, sort, order, search, get, update, setPage, setSort, setSearch, clearAll],
  );
}
