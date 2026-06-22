// React Query hooks for Owner operations, mirroring usePets.
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createOwner,
  deleteOwner,
  getOwner,
  listOwners,
  updateOwner,
} from '../api/owners';
import type { OwnerCreate, OwnerListParams, OwnerUpdate } from '../types/owner';
import { queryKeys } from './queryKeys';

export function useOwnerList(params: OwnerListParams) {
  return useQuery({
    queryKey: queryKeys.owners.list(params),
    queryFn: () => listOwners(params),
    placeholderData: keepPreviousData,
  });
}

export function useOwner(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.owners.detail(id ?? -1),
    queryFn: () => getOwner(id as number),
    enabled: typeof id === 'number' && id > 0,
  });
}

/**
 * A large single-page owner list used to populate the owner picker in the Pet
 * form. Cached separately and kept fresh for a few minutes.
 */
export function useOwnerOptions() {
  return useQuery({
    queryKey: queryKeys.owners.options,
    queryFn: () => listOwners({ page: 1, page_size: 100, sort: 'full_name', order: 'asc' }),
    staleTime: 5 * 60 * 1000,
    select: (res) => res.data,
  });
}

export function useCreateOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OwnerCreate) => createOwner(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.owners.all });
    },
  });
}

export function useUpdateOwner(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OwnerUpdate) => updateOwner(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.owners.detail(id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.owners.all });
    },
  });
}

export function useDeleteOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOwner(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.owners.all });
    },
  });
}
