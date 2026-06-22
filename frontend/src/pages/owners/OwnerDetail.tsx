import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ErrorState, LoadingState } from '../../components/data/StateBlock';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { useToast } from '../../components/feedback/toast';
import { useDeleteOwner, useOwner } from '../../hooks/useOwners';
import { toApiError } from '../../api/client';
import { formatDateTime, orDash } from '../../lib/format';

function DescItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

export function OwnerDetail() {
  const { id } = useParams();
  const ownerId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const { data: owner, isLoading, isError, error, refetch } = useOwner(ownerId);
  const remove = useDeleteOwner();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <LoadingState label="Loading owner…" />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!owner) return null;

  const petCount = owner.pet_count ?? 0;
  const hasPets = petCount > 0;

  async function handleDelete() {
    try {
      await remove.mutateAsync(ownerId);
      toast.success(`Deleted ${owner!.full_name}.`);
      navigate('/owners');
    } catch (err) {
      const apiError = toApiError(err);
      // FR-7 delete guard: server returns 409 when the owner still has pets.
      if (apiError.status === 409) {
        toast.error('This owner still has pets. Reassign or remove them first.');
      } else {
        toast.error(apiError.message);
      }
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={owner.full_name}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/owners/${owner.id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              // Disable when the owner has pets — the action would be rejected (FR-7).
              disabled={hasPets}
              title={hasPets ? 'Reassign or remove this owner’s pets before deleting' : undefined}
            >
              Delete
            </Button>
          </>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <dl>
          <DescItem label="Email">{orDash(owner.email)}</DescItem>
          <DescItem label="Phone">{orDash(owner.phone)}</DescItem>
          <DescItem label="Address">{orDash(owner.address)}</DescItem>
          <DescItem label="Pets">
            <span className="flex items-center gap-2">
              <Badge>{petCount}</Badge>
              {hasPets && (
                <Link
                  to={`/pets?owner_id=${owner.id}`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  View pets
                </Link>
              )}
            </span>
          </DescItem>
          <DescItem label="Created">{formatDateTime(owner.created_at)}</DescItem>
          <DescItem label="Last updated">{formatDateTime(owner.updated_at)}</DescItem>
        </dl>
      </div>

      {hasPets && (
        <p className="mt-3 text-sm text-slate-500">
          This owner has {petCount} pet{petCount === 1 ? '' : 's'}. To delete the owner, first
          reassign or remove their pets.
        </p>
      )}

      <div className="mt-4">
        <Link to="/owners" className="text-sm text-brand-600 hover:underline">
          ← Back to owners
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete owner?"
        destructive
        confirmLabel="Delete"
        loading={remove.isPending}
        message={
          <>
            This permanently deletes <strong>{owner.full_name}</strong>. This action cannot be
            undone.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
