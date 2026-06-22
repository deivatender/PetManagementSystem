import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ErrorState, LoadingState } from '../../components/data/StateBlock';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { useToast } from '../../components/feedback/toast';
import { useDeletePet, usePet } from '../../hooks/usePets';
import { toApiError } from '../../api/client';
import { formatAge, formatDate, formatDateTime, orDash } from '../../lib/format';

function DescItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

export function PetDetail() {
  const { id } = useParams();
  const petId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const { data: pet, isLoading, isError, error, refetch } = usePet(petId);
  const remove = useDeletePet();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <LoadingState label="Loading pet…" />;
  if (isError) {
    const apiError = toApiError(error);
    if (apiError.status === 404) {
      return (
        <ErrorState error={apiError} />
      );
    }
    return <ErrorState error={apiError} onRetry={() => refetch()} />;
  }
  if (!pet) return null;

  async function handleDelete() {
    try {
      await remove.mutateAsync(petId);
      toast.success(`Deleted ${pet!.name}.`);
      navigate('/pets');
    } catch (err) {
      toast.error(toApiError(err).message);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={pet.name}
        description={`${pet.species}${pet.breed ? ` · ${pet.breed}` : ''}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/pets/${pet.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <dl>
          <DescItem label="Status">
            <StatusBadge status={pet.status} />
          </DescItem>
          <DescItem label="Species">{pet.species}</DescItem>
          <DescItem label="Breed">{orDash(pet.breed)}</DescItem>
          <DescItem label="Date of birth">{formatDate(pet.date_of_birth)}</DescItem>
          <DescItem label="Age">{formatAge(pet.age)}</DescItem>
          <DescItem label="Gender">{orDash(pet.gender)}</DescItem>
          <DescItem label="Owner">
            {pet.owner ? (
              <Link to={`/owners/${pet.owner.id}`} className="text-brand-600 hover:underline">
                {pet.owner.full_name}
              </Link>
            ) : (
              'Unassigned'
            )}
          </DescItem>
          <DescItem label="Created">{formatDateTime(pet.created_at)}</DescItem>
          <DescItem label="Last updated">{formatDateTime(pet.updated_at)}</DescItem>
        </dl>
      </div>

      <div className="mt-4">
        <Link to="/pets" className="text-sm text-brand-600 hover:underline">
          ← Back to pets
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete pet?"
        destructive
        confirmLabel="Delete"
        loading={remove.isPending}
        message={
          <>
            This permanently deletes <strong>{pet.name}</strong>. This action cannot be undone.
            To keep history instead, set the status to Inactive, Deceased or Rehomed.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
