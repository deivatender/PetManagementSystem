import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('disables Previous on the first page and advances on Next', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        pagination={{ page: 1, page_size: 20, total: 45, total_pages: 3 }}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByText(/showing/i)).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders nothing when there are no rows', () => {
    const { container } = render(
      <Pagination
        pagination={{ page: 1, page_size: 20, total: 0, total_pages: 0 }}
        onPageChange={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
