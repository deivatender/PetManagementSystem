import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { TextAreaField, TextField } from '../../components/ui/Field';
import { ErrorState, LoadingState } from '../../components/data/StateBlock';
import { useToast } from '../../components/feedback/toast';
import { useCreateOwner, useOwner, useUpdateOwner } from '../../hooks/useOwners';
import { toApiError } from '../../api/client';
import { hasErrors, validateOwner, type FieldErrors } from '../../lib/validation';
import type { OwnerCreate } from '../../types/owner';

const EMPTY: OwnerCreate = { full_name: '', email: '', phone: '', address: '' };

export function OwnerForm() {
  const { id } = useParams();
  const ownerId = id ? Number(id) : undefined;
  const isEdit = typeof ownerId === 'number';
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useOwner(isEdit ? ownerId : undefined);
  const create = useCreateOwner();
  const update = useUpdateOwner(ownerId ?? -1);

  const [values, setValues] = useState<OwnerCreate>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<OwnerCreate>>({});

  useEffect(() => {
    if (isEdit && existing.data) {
      const o = existing.data;
      setValues({
        full_name: o.full_name,
        email: o.email ?? '',
        phone: o.phone ?? '',
        address: o.address ?? '',
      });
    }
  }, [isEdit, existing.data]);

  function setField<K extends keyof OwnerCreate>(key: K, value: OwnerCreate[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toPayload(v: OwnerCreate): OwnerCreate {
    return {
      full_name: v.full_name.trim(),
      email: v.email?.trim() ? v.email.trim() : null,
      phone: v.phone?.trim() ? v.phone.trim() : null,
      address: v.address?.trim() ? v.address.trim() : null,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clientErrors = validateOwner(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    const payload = toPayload(values);
    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        toast.success('Owner updated.');
        navigate(`/owners/${ownerId}`);
      } else {
        const created = await create.mutateAsync(payload);
        toast.success('Owner created.');
        navigate(`/owners/${created.id}`);
      }
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.isValidation && apiError.details.length > 0) {
        setErrors(apiError.fieldErrors as FieldErrors<OwnerCreate>);
      } else if (apiError.status === 409) {
        // Duplicate email is the only 409 on owner create/update.
        setErrors((prev) => ({ ...prev, email: apiError.message }));
      }
      toast.error(apiError.message);
    }
  }

  if (isEdit && existing.isLoading) return <LoadingState label="Loading owner…" />;
  if (isEdit && existing.isError)
    return <ErrorState error={existing.error} onRetry={() => existing.refetch()} />;

  const saving = create.isPending || update.isPending;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={isEdit ? 'Edit owner' : 'Add owner'} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <TextField
          label="Full name"
          required
          value={values.full_name}
          maxLength={150}
          onChange={(e) => setField('full_name', e.target.value)}
          error={errors.full_name}
          autoFocus
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            value={values.email ?? ''}
            maxLength={255}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
            hint="Must be unique if provided."
          />
          <TextField
            label="Phone"
            value={values.phone ?? ''}
            maxLength={20}
            onChange={(e) => setField('phone', e.target.value)}
            error={errors.phone}
          />
        </div>

        <TextAreaField
          label="Address"
          rows={3}
          value={values.address ?? ''}
          maxLength={255}
          onChange={(e) => setField('address', e.target.value)}
          error={errors.address}
        />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Create owner'}
          </Button>
        </div>
      </form>
    </div>
  );
}
