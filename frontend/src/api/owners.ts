// Typed API layer for Owners — one function per contract endpoint (§3.5).
import { apiClient } from './client';
import { buildQuery } from './params';
import type { PaginatedResponse } from '../types/common';
import type { Owner, OwnerCreate, OwnerListItem, OwnerListParams, OwnerUpdate } from '../types/owner';

const BASE = '/owners';

export async function listOwners(
  params: OwnerListParams = {},
): Promise<PaginatedResponse<OwnerListItem>> {
  const query = buildQuery({ ...params });
  const { data } = await apiClient.get<PaginatedResponse<OwnerListItem>>(BASE, { params: query });
  return data;
}

export async function getOwner(id: number): Promise<Owner> {
  const { data } = await apiClient.get<Owner>(`${BASE}/${id}`);
  return data;
}

export async function createOwner(body: OwnerCreate): Promise<Owner> {
  const { data } = await apiClient.post<Owner>(BASE, body);
  return data;
}

export async function updateOwner(id: number, body: OwnerUpdate): Promise<Owner> {
  const { data } = await apiClient.put<Owner>(`${BASE}/${id}`, body);
  return data;
}

export async function deleteOwner(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

/**
 * Fetch the filtered owner list as CSV (NFR-5). Returns a Blob the caller can
 * hand to the browser download helper. Accepts the same params as the list.
 */
export async function exportOwnersCsv(params: OwnerListParams = {}): Promise<Blob> {
  const query = buildQuery({ ...params });
  const { data } = await apiClient.get(`${BASE}/export/csv`, {
    params: query,
    responseType: 'blob',
  });
  return data as Blob;
}
