import { describe, expect, it } from 'vitest';
import { hasErrors, validateOwner, validatePet } from './validation';
import type { PetCreate } from '../types/pet';

describe('validateOwner', () => {
  it('requires a full name', () => {
    const errors = validateOwner({ full_name: '' });
    expect(errors.full_name).toBeDefined();
  });

  it('rejects an invalid email', () => {
    const errors = validateOwner({ full_name: 'Jane', email: 'not-an-email' });
    expect(errors.email).toBeDefined();
  });

  it('accepts a valid owner with optional fields omitted', () => {
    const errors = validateOwner({ full_name: 'Jane Smith' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('flags an over-length phone', () => {
    const errors = validateOwner({ full_name: 'Jane', phone: '1'.repeat(21) });
    expect(errors.phone).toBeDefined();
  });
});

describe('validatePet', () => {
  const base: PetCreate = { name: 'Max', species: 'Dog' };

  it('requires a name and species', () => {
    const errors = validatePet({ name: '', species: '' as PetCreate['species'] });
    expect(errors.name).toBeDefined();
    expect(errors.species).toBeDefined();
  });

  it('rejects a future date of birth', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const errors = validatePet({ ...base, date_of_birth: future });
    expect(errors.date_of_birth).toBeDefined();
  });

  it('accepts a valid pet', () => {
    const errors = validatePet({ ...base, date_of_birth: '2020-01-01', gender: 'Male' });
    expect(hasErrors(errors)).toBe(false);
  });
});
