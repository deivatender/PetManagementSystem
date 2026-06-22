// Client-side validation — UX-only mirror of the server rules (§3.4, NFR-1).
// The server remains the source of truth; this just gives fast inline feedback.
import type { OwnerCreate } from '../types/owner';
import type { PetCreate } from '../types/pet';
import { GENDERS, PET_STATUSES, SPECIES } from '../types/pet';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// Pragmatic email check — the server does authoritative validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Today's date as an ISO `YYYY-MM-DD` string, for max-date constraints. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateOwner(values: OwnerCreate): FieldErrors<OwnerCreate> {
  const errors: FieldErrors<OwnerCreate> = {};

  const fullName = values.full_name?.trim() ?? '';
  if (!fullName) {
    errors.full_name = 'Full name is required.';
  } else if (fullName.length > 150) {
    errors.full_name = 'Full name must be 150 characters or fewer.';
  }

  if (values.email && values.email.trim()) {
    if (!EMAIL_RE.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.';
    } else if (values.email.trim().length > 255) {
      errors.email = 'Email must be 255 characters or fewer.';
    }
  }

  if (values.phone && values.phone.trim().length > 20) {
    errors.phone = 'Phone must be 20 characters or fewer.';
  }

  if (values.address && values.address.trim().length > 255) {
    errors.address = 'Address must be 255 characters or fewer.';
  }

  return errors;
}

export function validatePet(values: PetCreate): FieldErrors<PetCreate> {
  const errors: FieldErrors<PetCreate> = {};

  const name = values.name?.trim() ?? '';
  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  if (!values.species) {
    errors.species = 'Species is required.';
  } else if (!SPECIES.includes(values.species)) {
    errors.species = 'Select a valid species.';
  }

  if (values.breed && values.breed.trim().length > 100) {
    errors.breed = 'Breed must be 100 characters or fewer.';
  }

  if (values.date_of_birth) {
    if (values.date_of_birth > todayIso()) {
      errors.date_of_birth = 'Date of birth must not be in the future.';
    }
  }

  if (values.gender && !GENDERS.includes(values.gender)) {
    errors.gender = 'Select a valid gender.';
  }

  if (values.status && !PET_STATUSES.includes(values.status)) {
    errors.status = 'Select a valid status.';
  }

  return errors;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
