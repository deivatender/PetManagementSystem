import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/data/SearchInput';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Pagination } from '../../components/data/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/data/StateBlock';
import { useToast } from '../../components/feedback/toast';
import { usePetList } from '../../hooks/usePets';
import { useOwnerOptions } from '../../hooks/useOwners';
import { useListParams } from '../../hooks/useListParams';
import { exportPetsCsv } from '../../api/pets';
import { downloadBlob } from '../../lib/download';
import { toApiError } from '../../api/client';
import { formatAge, formatDate, orDash } from '../../lib/format';
import {
  PET_STATUSES,
  SPECIES,
  type PetListItem,
  type PetListParams,
  type PetStatus,
  type Species,
} from '../../types/pet';

const selectClass =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500';

export function PetList() {
  const navigate = useNavigate();
  const toast = useToast();
  const lp = useListParams({ sort: 'created_at', order: 'desc' });
  const { data: owners } = useOwnerOptions();
  const [exporting, setExporting] = useState(false);

  const species = lp.get('species') as Species | undefined;
  const status = lp.get('status') as PetStatus | undefined;
  const ownerId = lp.get('owner_id');

  const params: PetListParams = {
    page: lp.page,
    page_size: lp.pageSize,
    sort: lp.sort as PetListParams['sort'],
    order: lp.order,
    search: lp.search || undefined,
    species,
    status,
    owner_id: ownerId ? Number(ownerId) : undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = usePetList(params);

  const ownerName = (id: number | null) =>
    id == null ? '—' : owners?.find((o) => o.id === id)?.full_name ?? `#${id}`;

  const columns: Column<PetListItem>[] = [
    { key: 'name', header: 'Name', sortField: 'name', render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    { key: 'species', header: 'Species', render: (p) => p.species },
    { key: 'breed', header: 'Breed', hideBelow: 'md', render: (p) => orDash(p.breed) },
    { key: 'age', header: 'Age', hideBelow: 'sm', render: (p) => formatAge(p.age) },
    { key: 'owner', header: 'Owner', hideBelow: 'lg', render: (p) => ownerName(p.owner_id) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'created', header: 'Added', sortField: 'created_at', hideBelow: 'lg', render: (p) => formatDate(p.created_at) },
  ];

  const hasFilters = Boolean(species || status || ownerId || lp.search);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportPetsCsv(params);
      downloadBlob(blob, 'pets.csv');
      toast.success('Pet list exported to CSV.');
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pets"
        description="Browse, search and manage pet records."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exporting}
              disabled={data?.pagination.total === 0}
            >
              Export CSV
            </Button>
            <Button onClick={() => navigate('/pets/new')}>+ Add pet</Button>
          </>
        }
      />

      {/* Filters + search */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={lp.search}
          onChange={lp.setSearch}
          placeholder="Search name or breed…"
          label="Search pets"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="filter-species">
            Filter by species
          </label>
          <select
            id="filter-species"
            className={selectClass}
            value={species ?? ''}
            onChange={(e) => lp.update({ species: e.target.value || undefined })}
          >
            <option value="">All species</option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-status">
            Filter by status
          </label>
          <select
            id="filter-status"
            className={selectClass}
            value={status ?? ''}
            onChange={(e) => lp.update({ status: e.target.value || undefined })}
          >
            <option value="">All statuses</option>
            {PET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-owner">
            Filter by owner
          </label>
          <select
            id="filter-owner"
            className={selectClass}
            value={ownerId ?? ''}
            onChange={(e) => lp.update({ owner_id: e.target.value || undefined })}
          >
            <option value="">All owners</option>
            {owners?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={lp.clearAll}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content states */}
      {isLoading ? (
        <LoadingState label="Loading pets…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data && data.data.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/pets/${p.id}`)}
            sort={{ field: lp.sort, order: lp.order }}
            onSortChange={lp.setSort}
            isFetching={isFetching}
          />
          <Pagination pagination={data.pagination} onPageChange={lp.setPage} />
        </div>
      ) : (
        <EmptyState
          title={hasFilters ? 'No pets match your filters' : 'No pets yet'}
          description={
            hasFilters
              ? 'Try adjusting or clearing the filters above.'
              : 'Get started by adding your first pet record.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={lp.clearAll}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => navigate('/pets/new')}>+ Add pet</Button>
            )
          }
        />
      )}
    </div>
  );
}
