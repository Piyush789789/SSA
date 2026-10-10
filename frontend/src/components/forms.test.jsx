import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/api/http', () => ({ http: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
const refreshSession = vi.fn();
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ refreshSession, currentUser: { name: 'Meera' }, logout: vi.fn() }) }));

const { http } = await import('@/api/http');
const { ChangePasswordForm } = await import('./common/ChangePassword');
const { CollectPaymentModal } = await import('./fees/CollectPaymentModal');
const { FeeHeadModal } = await import('./fees/FeeHeadModal');
const { NoticeFormModal } = await import('./notices/NoticeFormModal');
const { MyBusCard } = await import('./transport/MyBusCard');

beforeEach(() => {
  vi.mocked(http.get).mockReset();
  vi.mocked(http.post).mockReset();
  vi.mocked(http.put).mockReset();
  refreshSession.mockReset().mockResolvedValue(undefined);
});

describe('ChangePasswordForm', () => {
  const fillPasswords = async (current, next, confirm) => {
    await userEvent.type(screen.getByLabelText('Current password'), current);
    await userEvent.type(screen.getByLabelText('New password'), next);
    await userEvent.type(screen.getByLabelText('Repeat new password'), confirm);
    await userEvent.click(screen.getByRole('button', { name: /Change password/ }));
  };

  it.each([
    ['short1', 'Use at least 8 characters.'],
    ['abcdefgh', 'Use both letters and numbers.'],
    ['12345678', 'Use both letters and numbers.'],
  ])('rejects %s', async (pw, message) => {
    render(<ChangePasswordForm />);
    await fillPasswords('old', pw, pw);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('rejects a mismatched repeat', async () => {
    render(<ChangePasswordForm />);
    await fillPasswords('old', 'abcd1234', 'abcd12345');
    expect(screen.getByText('The two new passwords do not match.')).toBeInTheDocument();
  });

  it('changes the password, refreshes the session and calls onDone', async () => {
    vi.mocked(http.post).mockResolvedValue(null);
    const onDone = vi.fn();
    render(<ChangePasswordForm onDone={onDone} />);
    await fillPasswords('old-pass', 'abcd1234', 'abcd1234');
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(http.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'old-pass', newPassword: 'abcd1234' });
    expect(refreshSession).toHaveBeenCalled();
  });

  it('shows the server error (e.g. wrong current password)', async () => {
    vi.mocked(http.post).mockRejectedValue(new Error('Current password is wrong'));
    render(<ChangePasswordForm />);
    await fillPasswords('bad', 'abcd1234', 'abcd1234');
    expect(await screen.findByText('Current password is wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change password/ })).toBeEnabled();
  });
});

describe('CollectPaymentModal', () => {
  const due = { id: 'D1', title: 'Tuition', studentName: 'Asha', studentId: 'S1', amount: 5000, concession: 500, paid: 1000, pending: 3500 };
  const renderModal = (props = {}) =>
    render(<CollectPaymentModal isOpen feeDue={due} paymentModes={['Cash', 'UPI']} onClose={vi.fn()} {...props} />);
  const amountInput = () => screen.getByPlaceholderText('Enter amount');
  const submit = () => fireEvent.submit(amountInput().closest('form'));

  it('pre-fills the remaining balance and shows totals', () => {
    renderModal();
    expect(amountInput()).toHaveValue(3500);
    expect(screen.getByText('₹4,500')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('Cash');
  });

  it.each([
    ['0', 'Please enter a whole-rupee amount greater than ₹0.'],
    ['-5', 'Please enter a whole-rupee amount greater than ₹0.'],
    ['10.5', 'Please enter a whole-rupee amount greater than ₹0.'],
    ['3501', 'Amount cannot exceed the remaining balance of ₹3,500.'],
  ])('rejects %s', async (value, message) => {
    renderModal();
    fireEvent.change(amountInput(), { target: { value } });
    submit();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('records a part payment with the chosen mode', async () => {
    const onPaid = vi.fn();
    vi.mocked(http.post).mockResolvedValue({ receiptNo: 'R1' });
    renderModal({ onPaid });
    fireEvent.change(amountInput(), { target: { value: '1000' } });
    await userEvent.selectOptions(screen.getByRole('combobox'), 'UPI');
    await userEvent.type(screen.getByPlaceholderText(/Cheque no/), '  UTR123 ');
    submit();
    await waitFor(() => expect(onPaid).toHaveBeenCalledWith({ receiptNo: 'R1' }));
    expect(http.post).toHaveBeenCalledWith('/fees/payments', { feeDueId: 'D1', amount: 1000, paymentMode: 'UPI', remarks: 'UTR123' });
  });

  it('needs a payment mode', async () => {
    renderModal({ paymentModes: [] });
    submit();
    expect(await screen.findByText('Please choose a payment mode.')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CollectPaymentModal isOpen={false} feeDue={due} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FeeHeadModal', () => {
  const renderModal = (props = {}) =>
    render(
      <FeeHeadModal
        isOpen
        classes={['1-A', '2-A']}
        frequencies={['Monthly', 'Yearly']}
        academicYear="2026-27"
        onClose={vi.fn()}
        {...props}
      />,
    );
  const submit = () => fireEvent.submit(screen.getByPlaceholderText(/Tuition Fee/).closest('form'));

  it('lists every missing field', async () => {
    renderModal();
    submit();
    expect(await screen.findByText('Fee Head Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Amount must be a whole number greater than ₹0.')).toBeInTheDocument();
    expect(screen.getByText('Select at least one class.')).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('rejects a fractional amount', async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/4500/), { target: { name: 'amount', value: '99.5' } });
    submit();
    expect(await screen.findByText('Amount must be a whole number greater than ₹0.')).toBeInTheDocument();
  });

  it('creates a fee head for the selected classes', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    vi.mocked(http.post).mockResolvedValue({ id: 'H1' });
    renderModal({ onSaved, onClose });
    await userEvent.type(screen.getByPlaceholderText(/Tuition Fee/), '  Tuition Q1 ');
    await userEvent.type(screen.getByPlaceholderText(/4500/), '4500');
    await userEvent.click(screen.getByRole('button', { name: 'Select all' }));
    await userEvent.click(screen.getByRole('button', { name: '2-A' })); // deselect
    await userEvent.click(screen.getByRole('button', { name: 'Add Fee Head' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 'H1' }));
    expect(http.post).toHaveBeenCalledWith('/fees/heads', {
      title: 'Tuition Q1',
      amount: 4500,
      frequency: 'Monthly',
      dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      academicYear: '2026-27',
      classNames: ['1-A'],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('edits an existing fee head with PUT', async () => {
    vi.mocked(http.put).mockResolvedValue({ id: 'H1' });
    renderModal({
      feeHeadToEdit: { id: 'H1', title: 'Bus', amount: 1200, frequency: 'Yearly', dueDate: '2026-11-01', classNames: ['2-A'], academicYear: '2025-26' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(http.put).toHaveBeenCalled());
    expect(http.put).toHaveBeenCalledWith('/fees/heads/H1', {
      title: 'Bus',
      amount: 1200,
      frequency: 'Yearly',
      dueDate: '2026-11-01',
      academicYear: '2025-26',
      classNames: ['2-A'],
    });
  });
});

describe('NoticeFormModal', () => {
  it('requires a title and description', async () => {
    const onSave = vi.fn();
    render(<NoticeFormModal isOpen onSave={onSave} onClose={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Notice title'), '   ');
    fireEvent.submit(screen.getByPlaceholderText('Notice title').closest('form'));
    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves trimmed values and shows a server error', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Title too long'));
    render(<NoticeFormModal isOpen onSave={onSave} onClose={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Notice title'), ' Holiday ');
    await userEvent.type(screen.getByPlaceholderText(/Write notice details/), ' Closed on Monday ');
    await userEvent.click(screen.getByRole('button', { name: 'Publish Notice' }));
    expect(onSave).toHaveBeenCalledWith({ title: 'Holiday', description: 'Closed on Monday', priority: 'medium', audience: 'ALL' });
    expect(await screen.findByText('Title too long')).toBeInTheDocument();
  });

  it('pre-fills an edited notice with a lower-case priority', () => {
    render(
      <NoticeFormModal
        isOpen
        noticeToEdit={{ id: 'N1', title: 'T', description: 'D', priority: 'HIGH', audience: 'PARENTS' }}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText('Notice title')).toHaveValue('T');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });
});

describe('MyBusCard', () => {
  it('is hidden when the student has no bus (server sends no data)', async () => {
    vi.mocked(http.get).mockResolvedValue(null);
    const { container } = render(<MyBusCard studentId="S1" hideWhenNone />);
    await waitFor(() => expect(http.get).toHaveBeenCalledWith('/transport/students/S1'));
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('says "no bus" instead of spinning forever when shown', async () => {
    vi.mocked(http.get).mockResolvedValue(null);
    render(<MyBusCard studentId="S1" />);
    await waitFor(() => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument());
    expect(screen.getByText('No school bus assigned.')).toBeInTheDocument();
  });

  it('shows the route and stop times', async () => {
    vi.mocked(http.get).mockResolvedValue({
      assignment: { stopName: 'Gate 2' },
      route: { name: 'Route 5', vehicleNumber: 'UP32 AB 1234' },
      stop: { name: 'Gate 2', pickupTime: '07:15', dropTime: '14:05' },
    });
    render(<MyBusCard studentId="S1" />);
    expect(await screen.findByText('Route 5')).toBeInTheDocument();
    expect(screen.getByText('7:15 AM')).toBeInTheDocument();
    expect(screen.getByText('2:05 PM')).toBeInTheDocument();
  });
});
