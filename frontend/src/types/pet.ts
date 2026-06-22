// Pet domain types — mirror the frozen contract (§3.4, §3.5).
import type { BaseListParams } from './common';

export const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Reptile', 'Other'] as const;
export type Species = (typeof SPECIES)[number];

export const GENDERS = ['Male', 'Female', 'Unknown'] as const;
export type Gender = (typeof GENDERS)[number];

export const PET_STATUSES = ['Active', 'Inactive', 'Deceased', 'Rehomed'] as const;
export type PetStatus = (typeof PET_STATUSES)[number];

/** Inline owner summary embedded on a single Pet read (§3.4). */
export interface PetOwnerSummary {
  id: number;
  full_name: string;
}

/** Request body for POST/PUT /api/v1/pets (§3.4). */
export interface PetCreate {
  name: string;
  species: Species;
  breed?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  status?: PetStatus;
  owner_id?: number | null;
}

export type PetUpdate = PetCreate;

/** Single-read response — includes derived `age` and inline `owner` (§3.4). */
export interface Pet {
  id: number;
  name: string;
  species: Species;
  breed: string | null;
  date_of_birth: string | null;
  /** Whole years computed server-side from DOB; null when DOB absent. */
  age: number | null;
  gender: Gender | null;
  status: PetStatus;
  owner_id: number | null;
  /** Present on single-read only; list items carry `owner_id` only. */
  owner?: PetOwnerSummary | null;
  created_at: string;
  updated_at: string;
}

/** List item — `owner` summary is not included by the list endpoint. */
export type PetListItem = Omit<Pet, 'owner'>;

export type PetSortField = 'name' | 'created_at';

/** Query params for GET /api/v1/pets (§3.5). */
export interface PetListParams extends BaseListParams {
  sort?: PetSortField;
  species?: Species;
  status?: PetStatus;
  owner_id?: number;
}
