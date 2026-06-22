import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Field';
import { ErrorState, LoadingState } from '../../components/data/StateBlock';
import { useToast } from '../../components/feedback/toast';
import { useCreatePet, usePet, useUpdatePet } from '../../hooks/usePets';
import { useOwnerOptions } from '../../hooks/useOwners';
import { toApiError } from '../../api/client';
import { hasErrors, todayIso, validatePet, type FieldErrors } from '../../lib/validation';
import {
  GENDERS,
  PET_STATUSES,
  SPECIES,
  type PetCreate,
  type Species,
} from '../../types/pet';

const EMPTY: PetCreate = {
  name: '',
  species: '' as Species, // forces an explicit choice; validated before submit
  breed: '',
  date_of_birth: '',
  gender: undefined,
  status: 'Active',
  owner_id: undefined,
};

export function PetForm() {
  const { id } = useParams();
  const petId = id ? Number(id) : undefined;
  const isEdit = typeof petId === 'number';
  const navigate = useNavigate();
  const toast = useToast();

  const { data: owners } = useOwnerOptions();
  const existing = usePet(isEdit ? petId : undefined);
  const create = useCreatePet();
  const update = useUpdatePet(petId ?? -1);

  const [values, setValues] = useState<PetCreate>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<PetCreate>>({});

  // Hydrate the form once the existing pet loads (edit mode).
  useEffect(() => {
    if (isEdit && existing.data) {
      const p = existing.data;
      setValues({
        name: p.name,
        species: p.species,
        breed: p.breed ?? '',
        date_of_birth: p.date_of_birth ?? '',
        gender: p.gender ?? undefined,
        status: p.status,
        owner_id: p.owner_id ?? undefined,
      });
    }
  }, [isEdit, existing.data]);

  function setField<K extends keyof PetCreate>(key: K, value: PetCreate[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /** Strip empty optionals to null so we send a clean body to the server. */
  function toPayload(v: PetCreate): PetCreate {
    return {
      name: v.name.trim(),
      species: v.species,
      breed: v.breed?.trim() ? v.breed.trim() : null,
      date_of_birth: v.date_of_birth ? v.date_of_birth : null,
      gender: v.gender ?? null,
      status: v.status ?? 'Active',
      owner_id: v.owner_id ?? null,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clientErrors = validatePet(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    const payload = toPayload(values);
    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        toast.success('Pet updated.');
        navigate(`/pets/${petId}`);
      } else {
        const created = await create.mutateAsync(payload);
        toast.success('Pet created.');
        navigate(`/pets/${created.id}`);
      }
    } catch (err) {
      const apiError = toApiError(err);
      // Map server field-level errors (422) back onto the form (NFR-1).
      if (apiError.isValidation && apiError.details.length > 0) {
        setErrors(apiError.fieldErrors as FieldErrors<PetCreate>);
      }
      toast.error(apiError.message);
    }
  }

  if (isEdit && existing.isLoading) return <LoadingState label="Loading pet…" />;
  if (isEdit && existing.isError)
    return <ErrorState error={existing.error} onRetry={() => existing.refetch()} />;

  const saving = create.isPending || update.isPending;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={isEdit ? 'Edit pet' : 'Add pet'} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <TextField
          label="Name"
          required
          value={values.name}
          maxLength={100}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
          autoFocus
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Species"
            required
            value={values.species}
            onChange={(e) => setField('species', e.target.value as Species)}
            error={errors.species}
          >
            <option value="" disabled>
              Select species…
            </option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Breed"
            value={values.breed ?? ''}
            maxLength={100}
            onChange={(e) => setField('breed', e.target.value)}
            error={errors.breed}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Date of birth"
            type="date"
            value={values.date_of_birth ?? ''}
            max={todayIso()}
            onChange={(e) => setField('date_of_birth', e.target.value)}
            error={errors.date_of_birth}
            hint="Age is derived from this date."
          />

          <SelectField
            label="Gender"
            value={values.gender ?? ''}
            onChange={(e) => setField('gender', (e.target.value || undefined) as PetCreate['gender'])}
            error={errors.gender}
          >
            <option value="">Unspecified</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Status"
            value={values.status ?? 'Active'}
            onChange={(e) => setField('status', e.target.value as PetCreate['status'])}
            error={errors.status}
          >
            {PET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Owner"
            value={values.owner_id != null ? String(values.owner_id) : ''}
            onChange={(e) => setField('owner_id', e.target.value ? Number(e.target.value) : undefined)}
            error={errors.owner_id}
            hint="Optional — a pet can be unassigned."
          >
            <option value="">Unassigned</option>
            {owners?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Create pet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
