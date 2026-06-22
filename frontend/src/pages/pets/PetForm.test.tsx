import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../test/renderWithProviders';
import { PetForm } from './PetForm';

describe('PetForm (create)', () => {
  it('shows client-side validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/pets/new" element={<PetForm />} />
      </Routes>,
      { route: '/pets/new' },
    );

    await user.click(screen.getByRole('button', { name: /create pet/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/species is required/i)).toBeInTheDocument();
  });

  it('clears a field error once the user corrects it', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/pets/new" element={<PetForm />} />
      </Routes>,
      { route: '/pets/new' },
    );

    await user.click(screen.getByRole('button', { name: /create pet/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), 'Max');

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });
});
