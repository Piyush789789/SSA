import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

vi.mock('@/api/http', async () => {
  const actual = await vi.importActual('@/api/http');
  return { ...actual, http: { get: vi.fn(), post: vi.fn() } };
});
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { role: 'student', studentId: 'STU-1', id: 'STU-1', name: 'Asha', className: '5-B' } }),
}));

const { http } = await import('@/api/http');
const { StudentFeesPage } = await import('./StudentFeesPage');

const DUES = [
  { id: 'D1', title: 'Tuition Q2', dueDate: '2026-10-15', amount: 6000, concession: 1000, paid: 0, pending: 5000, status: 'Pending' },
  { id: 'D2', title: 'Bus fee', dueDate: '2026-10-20', amount: 1000, concession: 0, paid: 0, pending: 1000, status: 'Pending' },
  { id: 'D3', title: 'Admission', dueDate: '2026-04-01', amount: 2000, concession: 0, paid: 2000, pending: 0, status: 'Paid' },
  { id: 'D4', title: 'Exam fee', dueDate: '2026-09-01', amount: 800, concession: 0, paid: 300, pending: 500, status: 'Overdue' },
];
const DEPOSITS = [
  { id: 'X1', feeDueId: 'D1', amount: 1500, status: 'PENDING', mode: 'UPI' },
  { id: 'X2', feeDueId: 'D1', amount: 500, status: 'PENDING', mode: 'UPI' },
  { id: 'X3', feeDueId: 'D1', amount: 4000, status: 'REJECTED', mode: 'UPI' },
  { id: 'X4', feeDueId: 'D2', amount: 1000, status: 'PENDING', mode: 'Cash' },
  { id: 'X5', feeDueId: 'D4', amount: 300, status: 'APPROVED', mode: 'Cash' },
];

let onlineEnabled;
const serve = () =>
  vi.mocked(http.get).mockImplementation(async (path) => {
    if (path === '/fees/students/STU-1/summary')
      return { total: 9800, paid: 2300, pending: 6500, overdue: 500, concession: 1000, dues: DUES.map((d) => ({ ...d })) };
    if (path.startsWith('/fees/payments')) return [];
    if (path.startsWith('/fees/deposits')) return DEPOSITS;
    if (path === '/meta') return { depositModes: ['UPI', 'Cash'] };
    if (path === '/online-payments/status') return { enabled: onlineEnabled };
    throw new Error(`unexpected GET ${path}`);
  });

const rowOf = (title) => screen.getByText(title).closest('tr');

describe('StudentFeesPage – Pay online amounts', () => {
  beforeEach(() => {
    onlineEnabled = true;
    vi.mocked(http.get).mockReset();
    vi.mocked(http.post).mockReset();
    serve();
  });
  afterEach(() => {
    delete window.Razorpay;
  });

  it('offers to pay what is pending minus deposits still being verified', async () => {
    renderWithProviders(<StudentFeesPage />, { route: '/student/fees' });
    await screen.findByText('Tuition Q2');
    await waitFor(() => expect(within(rowOf('Tuition Q2')).getByRole('button', { name: /Pay online/ })).toBeEnabled());

    // D1: 5000 pending − (1500 + 500) verifying = 3000; rejected deposits do not count.
    expect(within(rowOf('Tuition Q2')).getByText('₹2,000 being verified')).toBeInTheDocument();
    // D2: fully covered by a deposit being verified → no payment buttons.
    expect(within(rowOf('Bus fee')).queryByRole('button', { name: /Pay online/ })).not.toBeInTheDocument();
    expect(within(rowOf('Bus fee')).getByText('Awaiting verification')).toBeInTheDocument();
    // D3: paid.
    expect(within(rowOf('Admission')).queryByRole('button', { name: /Pay online/ })).not.toBeInTheDocument();
    // D4: approved deposits are already in `paid`, so the full pending amount is payable.
    expect(within(rowOf('Exam fee')).getByRole('button', { name: /Pay online/ })).toBeInTheDocument();
  });

  it('creates the order for the payable amount, confirms the payment and shows the receipt', async () => {
    const user = userEvent.setup();
    let options;
    const open = vi.fn();
    window.Razorpay = vi.fn(function Razorpay(opts) {
      options = opts;
      this.open = open;
      this.on = vi.fn();
    });
    vi.mocked(http.post).mockImplementation(async (path, body) => {
      if (path === '/online-payments/orders')
        return { keyId: 'rzp_test', amountPaise: body.amount * 100, currency: 'INR', orderId: 'order_1', schoolName: 'SSA' };
      if (path === '/online-payments/confirm')
        return { receiptNo: 'RCPT-77', amount: 3000, feeTitle: 'Tuition Q2', paidAt: '2026-10-10T11:00:00' };
      throw new Error(path);
    });

    renderWithProviders(<StudentFeesPage />, { route: '/student/fees' });
    await screen.findByText('Tuition Q2');
    const payButton = await within(rowOf('Tuition Q2')).findByRole('button', { name: /Pay online/ });
    await user.click(payButton);

    expect(http.post).toHaveBeenCalledWith('/online-payments/orders', { feeDueId: 'D1', amount: 3000 });
    expect(open).toHaveBeenCalled();
    expect(options).toMatchObject({ key: 'rzp_test', amount: 300000, currency: 'INR', order_id: 'order_1' });

    const summaryCalls = () => vi.mocked(http.get).mock.calls.filter(([p]) => p.endsWith('/summary')).length;
    const before = summaryCalls();
    await options.handler({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' });
    expect(http.post).toHaveBeenCalledWith('/online-payments/confirm', {
      orderId: 'order_1',
      paymentId: 'pay_1',
      signature: 'sig',
    });
    expect(await screen.findByText('RCPT-77')).toBeInTheDocument();
    await waitFor(() => expect(summaryCalls()).toBeGreaterThan(before));
  });

  it('keeps the payment ID visible when confirming fails', async () => {
    const user = userEvent.setup();
    let options;
    window.Razorpay = vi.fn(function Razorpay(opts) {
      options = opts;
      this.open = vi.fn();
      this.on = vi.fn();
    });
    vi.mocked(http.post).mockImplementation(async (path) => {
      if (path === '/online-payments/orders') return { orderId: 'o' };
      throw new Error('Signature mismatch.');
    });
    renderWithProviders(<StudentFeesPage />, { route: '/student/fees' });
    await user.click(await within(await screen.findByText('Exam fee').then((n) => n.closest('tr'))).findByRole('button', { name: /Pay online/ }));
    expect(http.post).toHaveBeenCalledWith('/online-payments/orders', { feeDueId: 'D4', amount: 500 });
    await options.handler({ razorpay_order_id: 'o', razorpay_payment_id: 'pay_9', razorpay_signature: 's' });
    expect(await screen.findByText(/Signature mismatch\. If money was deducted, keep the payment ID pay_9/)).toBeInTheDocument();
  });

  it('shows no Pay online buttons when online payment is switched off', async () => {
    onlineEnabled = false;
    renderWithProviders(<StudentFeesPage />, { route: '/student/fees' });
    await screen.findByText('Tuition Q2');
    await waitFor(() => expect(within(rowOf('Tuition Q2')).getByRole('button', { name: /Deposit fee/ })).toBeEnabled());
    expect(screen.queryByRole('button', { name: /Pay online/ })).not.toBeInTheDocument();
  });

  it('the Unpaid filter hides paid dues', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StudentFeesPage />, { route: '/student/fees' });
    await screen.findByText('Admission');
    await user.click(screen.getByRole('button', { name: 'Unpaid' }));
    expect(screen.queryByText('Admission')).not.toBeInTheDocument();
    expect(screen.getByText('Tuition Q2')).toBeInTheDocument();
  });
});
