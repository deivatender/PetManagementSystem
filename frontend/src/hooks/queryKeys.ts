// Centralised TanStack Query keys so cache invalidation stays consistent.
import type { OwnerListParams } from '../types/owner';
import type { PetListParams } from '../types/pet';

export const queryKeys = {
  pets: {
    all: ['pets'] as const,
    list: (params: PetListParams) => ['pets', 'list', params] as const,
    detail: (id: number) => ['pets', 'detail', id] as const,
  },
  owners: {
    all: ['owners'] as const,
    list: (params: OwnerListParams) => ['owners', 'list', params] as const,
    detail: (id: number) => ['owners', 'detail', id] as const,
    // Lightweight options list for the owner picker in the Pet form.
    options: ['owners', 'options'] as const,
  },
};
