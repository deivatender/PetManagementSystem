// Owner domain types — mirror the frozen contract (§3.4, §3.5).
import type { BaseListParams } from './common';

/** Request body for POST/PUT /api/v1/owners (§3.4). */
export interface OwnerCreate {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export type OwnerUpdate = OwnerCreate;

/** Single-read response — includes derived `pet_count` (§3.4). */
export interface Owner {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  /** Derived count; present on single-read, omitted from list items. */
  pet_count?: number;
  created_at: string;
  updated_at: string;
}

/** List item — same shape as Owner but `pet_count` is not guaranteed. */
export type OwnerListItem = Owner;

export type OwnerSortField = 'full_name' | 'created_at';

/** Query params for GET /api/v1/owners (§3.5). */
export interface OwnerListParams extends BaseListParams {
  sort?: OwnerSortField;
}
