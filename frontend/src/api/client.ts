import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ErrorDetail, ErrorEnvelope } from '../types/common';

/**
 * Base URL from config (§3.1). Defaults to the same-origin `/api/v1` path so
 * local dev works through the Vite proxy with no extra setup.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/**
 * Normalised application error. Every rejected request from this client is
 * converted into an `ApiError` so callers (and the UI) never deal with raw
 * Axios shapes. `fieldErrors` is keyed by field name for direct form binding.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetail[];

  constructor(params: { status: number; code: string; message: string; details?: ErrorDetail[] }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details ?? [];
  }

  /** True when the server rejected the request body (422). */
  get isValidation(): boolean {
    return this.status === 422 || this.code === 'VALIDATION_ERROR';
  }

  /** Field-level errors keyed by field name, for binding to form inputs. */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const d of this.details) {
      if (d.field && !map[d.field]) map[d.field] = d.message;
    }
    return map;
  }
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorEnvelope).error === 'object'
  );
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

/**
 * Response interceptor that maps the server's error envelope (§3.2) — and any
 * transport/timeout failure — into a single `ApiError` type.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network error / timeout / server unreachable — no HTTP response.
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          status: 0,
          code: 'NETWORK_ERROR',
          message:
            error.code === 'ECONNABORTED'
              ? 'The request timed out. Please try again.'
              : 'Unable to reach the server. Check your connection and try again.',
        }),
      );
    }

    const { status, data } = error.response;

    if (isErrorEnvelope(data)) {
      return Promise.reject(
        new ApiError({
          status,
          code: data.error.code,
          message: data.error.message,
          details: data.error.details,
        }),
      );
    }

    // Fallback for any non-conforming error body.
    return Promise.reject(
      new ApiError({
        status,
        code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message:
          typeof (data as { message?: string })?.message === 'string'
            ? (data as { message: string }).message
            : `Request failed with status ${status}.`,
      }),
    );
  },
);

/** Coerce an unknown thrown value into an ApiError for consistent UI handling. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError({
    status: 0,
    code: 'UNKNOWN',
    message: err instanceof Error ? err.message : 'An unexpected error occurred.',
  });
}
