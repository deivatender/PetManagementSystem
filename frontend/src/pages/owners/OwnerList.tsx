import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/data/SearchInput';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Pagination } from '../../components/data/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/data/StateBlock';
import { useToast } from '../../components/feedback/toast';
import { useOwnerList } from '../../hooks/useOwners';
import { useListParams } from '../../hooks/useListParams';
import { exportOwnersCsv } from '../../api/owners';
import { downloadBlob } from '../../lib/download';
import { toApiError } from '../../api/client';
import { formatDate, orDash } from '../../lib/format';
import type { OwnerListItem, OwnerListParams } from '../../types/owner';

export function OwnerList() {
  const navigate = useNavigate();
  const toast = useToast();
  const lp = useListParams({ sort: 'created_at', order: 'desc' });
  const [exporting, setExporting] = useState(false);

  const params: OwnerListParams = {
    page: lp.page,
    page_size: lp.pageSize,
    sort: lp.sort as OwnerListParams['sort'],
    order: lp.order,
    search: lp.search || undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useOwnerList(params);

  const columns: Column<OwnerListItem>[] = [
    { key: 'name', header: 'Name', sortField: 'full_name', render: (o) => <span className="font-medium text-slate-900">{o.full_name}</span> },
    { key: 'email', header: 'Email', hideBelow: 'md', render: (o) => orDash(o.email) },
    { key: 'phone', header: 'Phone', hideBelow: 'sm', render: (o) => orDash(o.phone) },
    { key: 'address', header: 'Address', hideBelow: 'lg', render: (o) => orDash(o.address) },
    { key: 'created', header: 'Added', sortField: 'created_at', hideBelow: 'lg', render: (o) => formatDate(o.created_at) },
  ];

  const hasFilters = Boolean(lp.search);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportOwnersCsv(params);
      downloadBlob(blob, 'owners.csv');
      toast.success('Owner list exported to CSV.');
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Owners"
        description="Browse, search and manage owner records."
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
            <Button onClick={() => navigate('/owners/new')}>+ Add owner</Button>
          </>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={lp.search}
          onChange={lp.setSearch}
          placeholder="Search name, email or phone…"
          label="Search owners"
        />
      </div>

      {isLoading ? (
        <LoadingState label="Loading owners…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data && data.data.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/owners/${o.id}`)}
            sort={{ field: lp.sort, order: lp.order }}
            onSortChange={lp.setSort}
            isFetching={isFetching}
          />
          <Pagination pagination={data.pagination} onPageChange={lp.setPage} />
        </div>
      ) : (
        <EmptyState
          title={hasFilters ? 'No owners match your search' : 'No owners yet'}
          description={
            hasFilters
              ? 'Try a different search term.'
              : 'Get started by adding your first owner.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={lp.clearAll}>
                Clear search
              </Button>
            ) : (
              <Button onClick={() => navigate('/owners/new')}>+ Add owner</Button>
            )
          }
        />
      )}
    </div>
  );
}
