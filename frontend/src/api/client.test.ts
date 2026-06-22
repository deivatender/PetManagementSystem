import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from './client';

describe('ApiError', () => {
  it('exposes field errors keyed by field name', () => {
    const err = new ApiError({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: [
        { field: 'name', message: 'field required' },
        { field: 'date_of_birth', message: 'must not be in the future' },
      ],
    });

    expect(err.isValidation).toBe(true);
    expect(err.fieldErrors).toEqual({
      name: 'field required',
      date_of_birth: 'must not be in the future',
    });
  });

  it('treats a 422 with no code as a validation error', () => {
    const err = new ApiError({ status: 422, code: 'OTHER', message: 'bad' });
    expect(err.isValidation).toBe(true);
  });

  it('is not a validation error for a 409', () => {
    const err = new ApiError({ status: 409, code: 'CONFLICT', message: 'duplicate' });
    expect(err.isValidation).toBe(false);
    expect(err.fieldErrors).toEqual({});
  });
});

describe('toApiError', () => {
  it('passes through an existing ApiError', () => {
    const original = new ApiError({ status: 404, code: 'NOT_FOUND', message: 'gone' });
    expect(toApiError(original)).toBe(original);
  });

  it('wraps a plain Error', () => {
    const wrapped = toApiError(new Error('boom'));
    expect(wrapped).toBeInstanceOf(ApiError);
    expect(wrapped.message).toBe('boom');
  });
});
