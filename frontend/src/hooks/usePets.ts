// React Query hooks for Pet operations. Server state lives here; components
// own only local UI state. Mutations invalidate the relevant caches on success.
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createPet,
  deletePet,
  getPet,
  listPets,
  updatePet,
} from '../api/pets';
import type { PetCreate, PetListParams, PetUpdate } from '../types/pet';
import { queryKeys } from './queryKeys';

export function usePetList(params: PetListParams) {
  return useQuery({
    queryKey: queryKeys.pets.list(params),
    queryFn: () => listPets(params),
    // Keep the previous page visible while the next one loads (smooth paging).
    placeholderData: keepPreviousData,
  });
}

export function usePet(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.pets.detail(id ?? -1),
    queryFn: () => getPet(id as number),
    enabled: typeof id === 'number' && id > 0,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PetCreate) => createPet(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}

export function useUpdatePet(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PetUpdate) => updatePet(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.pets.detail(id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePet(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}
