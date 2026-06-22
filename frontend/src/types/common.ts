// Shared API envelope types — mirror the frozen contract (§3.2, §3.3).

/** One field-level validation error, present on 422 responses. */
export interface ErrorDetail {
  field: string;
  message: string;
}

/** Standard error envelope returned for every non-2xx response (§3.2). */
export interface ErrorEnvelope {
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR' | string;
    message: string;
    details?: ErrorDetail[];
  };
}

/** Pagination block on list responses (§3.3). */
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Paginated list envelope (§3.3). */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type SortOrder = 'asc' | 'desc';

/** Query params common to both list endpoints (§3.5). */
export interface BaseListParams {
  page?: number;
  page_size?: number;
  order?: SortOrder;
  search?: string;
}
