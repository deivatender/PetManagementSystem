// Typed API layer for Pets — one function per contract endpoint (§3.5).
import { apiClient } from './client';
import { buildQuery } from './params';
import type { PaginatedResponse } from '../types/common';
import type { Pet, PetCreate, PetListItem, PetListParams, PetUpdate } from '../types/pet';

const BASE = '/pets';

export async function listPets(params: PetListParams = {}): Promise<PaginatedResponse<PetListItem>> {
  const query = buildQuery({ ...params });
  const { data } = await apiClient.get<PaginatedResponse<PetListItem>>(BASE, { params: query });
  return data;
}

export async function getPet(id: number): Promise<Pet> {
  const { data } = await apiClient.get<Pet>(`${BASE}/${id}`);
  return data;
}

export async function createPet(body: PetCreate): Promise<Pet> {
  const { data } = await apiClient.post<Pet>(BASE, body);
  return data;
}

export async function updatePet(id: number, body: PetUpdate): Promise<Pet> {
  const { data } = await apiClient.put<Pet>(`${BASE}/${id}`, body);
  return data;
}

export async function deletePet(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

/**
 * Fetch the filtered pet list as CSV (NFR-5). Returns a Blob; accepts the same
 * filter/search params as the list endpoint.
 */
export async function exportPetsCsv(params: PetListParams = {}): Promise<Blob> {
  const query = buildQuery({ ...params });
  const { data } = await apiClient.get(`${BASE}/export/csv`, {
    params: query,
    responseType: 'blob',
  });
  return data as Blob;
}
