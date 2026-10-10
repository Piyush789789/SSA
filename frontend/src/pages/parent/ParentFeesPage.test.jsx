import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

vi.mock('@/api/http', async () => {
  const actual = await vi.importActual('@/api/http');
  return { ...actual, http: { get: vi.fn(), post: vi.fn() } };
});
const child = { studentId: 'STU-7', name: 'Anu', className: '3-A' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { role: 'parent', name: 'Sita', linkedChildren: [child] },
    selectedChild: child,
    switchChild: vi.fn(),
  }),
}));

const { http } = await import('@/api/http');
const { ParentFeesPage } = await import('./ParentFeesPage');

const DUES = [
  { id: 'D1', title: 'Tuition', dueDate: '2026-10-15', amount: 4000, concession: 0, paid: 1000, pending: 3000, status: 'Partial' },
  { id: 'D2', title: 'Library', dueDate: '2026-10-20', amount: 300, concession: 0, paid: 0, pending: 300, status: 'Pending' },
];
const DEPOSITS = [
  { id: 'X1', feeDueId: 'D1', amount: 1200, status: 'PENDING' },
  { id: 'X2', feeDueId: 'D2', amount: 300, status: 'PENDING' },
];

describe('ParentFeesPage – Pay online', () => {
  beforeEach(() => {
    vi.mocked(http.post).mockReset();
    vi.mocked(http.get).mockReset().mockImplementation(async (path) => {
      if (path === '/fees/students/STU-7/summary') return { total: 4300, paid: 1000, pending: 3300, dues: DUES };
      if (path.startsWith('/fees/payments')) return [];
      if (path.startsWith('/fees/deposits')) return DEPOSITS;
      if (path === '/meta') return { depositModes: ['UPI'] };
      if (path === '/online-payments/status') return { enabled: true };
      throw new Error(`unexpected GET ${path}`);
    });
  });

  it("loads the selected child's fees and pays pending minus deposits awaiting verification", async () => {
    const user = userEvent.setup();
    window.Razorpay = vi.fn(function Razorpay() {
      this.open = vi.fn();
      this.on = vi.fn();
    });
    vi.mocked(http.post).mockResolvedValue({ orderId: 'o1' });
    renderWithProviders(<ParentFeesPage />, { route: '/parent/fees' });

    await screen.findAllByText(/Tuition/);
    const rowFor = (title) => screen.getAllByRole('row').find((r) => within(r).queryAllByText(new RegExp(title)).length > 0 && within(r).queryByText('Details'));
    const row = rowFor('Tuition');
    expect(http.get).toHaveBeenCalledWith('/fees/payments?studentId=STU-7');
    const library = rowFor('Library');
    await waitFor(() => expect(within(row).getByRole('button', { name: /Pay online/ })).toBeInTheDocument());
    expect(within(library).queryByRole('button', { name: /Pay online/ })).not.toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: /Pay online/ }));
    expect(http.post).toHaveBeenCalledWith('/online-payments/orders', { feeDueId: 'D1', amount: 1800 });
    delete window.Razorpay;
  });
});
