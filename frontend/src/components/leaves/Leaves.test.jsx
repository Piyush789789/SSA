import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, todayIso } from '@/utils';
import { pendingFirst } from './leaveUtils';

vi.mock('@/api/http', () => ({ http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
const auth = { current: { currentUser: { userId: 'U1', id: 'STU-1' } } };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth.current }));

const { http } = await import('@/api/http');
const { LeaveApplyForm, LeaveList } = await import('./Leaves');

const fromInput = () => screen.getByLabelText('From');
const toInput = () => screen.getByLabelText('To');
const reasonInput = () => screen.getByLabelText('Reason');
const setDate = (input, value) => fireEvent.change(input, { target: { value } });
const submit = () => fireEvent.submit(screen.getByRole('button', { name: /Apply/ }).closest('form'));

describe('pendingFirst', () => {
  it('puts pending first and keeps the order otherwise', () => {
    const list = [
      { id: 1, status: 'APPROVED' },
      { id: 2, status: 'PENDING' },
      { id: 3, status: 'REJECTED' },
      { id: 4, status: 'PENDING' },
    ];
    expect(pendingFirst(list).map((l) => l.id)).toEqual([2, 4, 1, 3]);
    expect(list[0].id).toBe(1); // not mutated
  });

  it('handles null', () => {
    expect(pendingFirst(null)).toEqual([]);
    expect(pendingFirst(undefined)).toEqual([]);
  });
});

describe('LeaveApplyForm', () => {
  beforeEach(() => {
    vi.mocked(http.post).mockReset().mockResolvedValue({ id: 'L1' });
  });

  it('starts with today and needs a reason', () => {
    render(<LeaveApplyForm />);
    expect(fromInput()).toHaveValue(todayIso());
    expect(toInput()).toHaveValue(todayIso());
    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();
  });

  it('moves the end date forward when the start date passes it', () => {
    render(<LeaveApplyForm />);
    const later = addDays(todayIso(), 5);
    setDate(fromInput(), later);
    expect(toInput()).toHaveValue(later);
    expect(toInput()).toHaveAttribute('min', later);
  });

  it('sends the application for a child and resets the form', async () => {
    const onApplied = vi.fn();
    render(<LeaveApplyForm studentId="STU-9" forName="Anu" onApplied={onApplied} />);
    expect(screen.getByText('For Anu')).toBeInTheDocument();
    const from = addDays(todayIso(), 1);
    const to = addDays(todayIso(), 3);
    setDate(fromInput(), from);
    setDate(toInput(), to);
    await userEvent.type(reasonInput(), '  Fever  ');
    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));
    await screen.findByText('Leave application sent.');
    expect(http.post).toHaveBeenCalledWith('/leaves', { studentId: 'STU-9', fromDate: from, toDate: to, reason: 'Fever' });
    expect(onApplied).toHaveBeenCalled();
    expect(reasonInput()).toHaveValue('');
    expect(fromInput()).toHaveValue(todayIso());
  });

  it('teachers apply without a studentId', async () => {
    render(<LeaveApplyForm />);
    await userEvent.type(reasonInput(), 'Wedding');
    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));
    await waitFor(() => expect(http.post).toHaveBeenCalled());
    expect(http.post.mock.calls[0][1].studentId).toBeUndefined();
  });

  it('rejects more than 60 days', async () => {
    render(<LeaveApplyForm />);
    setDate(toInput(), addDays(todayIso(), 60)); // 61 days inclusive
    await userEvent.type(reasonInput(), 'Long trip');
    submit();
    expect(await screen.findByText('One application can cover at most 60 days.')).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('accepts exactly 60 days', async () => {
    render(<LeaveApplyForm />);
    setDate(toInput(), addDays(todayIso(), 59));
    await userEvent.type(reasonInput(), 'Long trip');
    submit();
    await waitFor(() => expect(http.post).toHaveBeenCalled());
  });

  it('rejects an end date before the start date', async () => {
    render(<LeaveApplyForm />);
    setDate(toInput(), addDays(todayIso(), -2));
    await userEvent.type(reasonInput(), 'x');
    submit();
    expect(await screen.findByText('The end date is before the start date.')).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('rejects a start more than 30 days ago', async () => {
    render(<LeaveApplyForm />);
    setDate(fromInput(), addDays(todayIso(), -31));
    await userEvent.type(reasonInput(), 'Old leave');
    submit();
    expect(await screen.findByText('The leave cannot start more than 30 days ago.')).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('accepts a start exactly 30 days ago', async () => {
    render(<LeaveApplyForm />);
    setDate(fromInput(), addDays(todayIso(), -30));
    await userEvent.type(reasonInput(), 'Old leave');
    submit();
    await waitFor(() => expect(http.post).toHaveBeenCalled());
  });

  it('shows the server error', async () => {
    vi.mocked(http.post).mockRejectedValue(new Error('Overlaps an existing leave'));
    render(<LeaveApplyForm />);
    await userEvent.type(reasonInput(), 'x');
    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));
    expect(await screen.findByText('Overlaps an existing leave')).toBeInTheDocument();
    expect(reasonInput()).toHaveValue('x');
  });
});

describe('LeaveList', () => {
  const leaves = [
    {
      id: 'L1',
      status: 'PENDING',
      fromDate: '2026-10-12',
      toDate: '2026-10-14',
      reason: 'Fever',
      appliedById: 'U1',
      appliedAt: '2026-10-10T09:00:00',
      personName: 'Anu',
      className: '3-A',
    },
    {
      id: 'L2',
      status: 'APPROVED',
      fromDate: '2026-10-01',
      toDate: '2026-10-01',
      reason: 'Trip',
      appliedById: 'U9',
      appliedAt: '2026-09-28T09:00:00',
      reviewedByName: 'Admin',
      reviewNote: 'Ok',
      applicantType: 'STAFF',
      personName: 'Meera',
    },
  ];

  beforeEach(() => {
    auth.current = { currentUser: { userId: 'U1', id: 'STU-1' } };
    vi.mocked(http.post).mockReset().mockResolvedValue(null);
    vi.mocked(http.delete).mockReset().mockResolvedValue(null);
  });

  it('shows ranges with day counts, people and review notes', () => {
    render(<LeaveList leaves={leaves} showPerson />);
    expect(screen.getByText('12 Oct 2026 – 14 Oct 2026 (3 days)')).toBeInTheDocument();
    expect(screen.getByText('1 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText('Class 3-A')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText(/Approved by Admin/)).toBeInTheDocument();
  });

  it('lets the applicant withdraw a pending leave after confirming', async () => {
    const onChanged = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<LeaveList leaves={leaves} onChanged={onChanged} />);
    expect(screen.getAllByRole('button', { name: /Withdraw/ })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /Withdraw/ }));
    expect(http.delete).toHaveBeenCalledWith('/leaves/L1');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    confirm.mockRestore();
  });

  it('does nothing when the withdrawal is cancelled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<LeaveList leaves={leaves} />);
    await userEvent.click(screen.getByRole('button', { name: /Withdraw/ }));
    expect(http.delete).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('reviewers approve with a trimmed note or reject', async () => {
    auth.current = { currentUser: { userId: 'ADMIN', id: 'ADMIN' } };
    render(<LeaveList leaves={leaves} canDecide={() => true} />);
    await userEvent.type(screen.getByPlaceholderText('Note (optional)'), '  get well  ');
    await userEvent.click(screen.getByRole('button', { name: /Approve/ }));
    expect(http.post).toHaveBeenCalledWith('/leaves/L1/decision', { approve: true, note: 'get well' });
    await userEvent.click(screen.getByRole('button', { name: /Reject/ }));
    expect(http.post).toHaveBeenLastCalledWith('/leaves/L1/decision', { approve: false, note: 'get well' });
  });

  it('shows decision errors', async () => {
    vi.mocked(http.post).mockRejectedValue(new Error('Already decided'));
    render(<LeaveList leaves={leaves} canDecide={() => true} />);
    await userEvent.click(screen.getByRole('button', { name: /Reject/ }));
    expect(await screen.findByText('Already decided')).toBeInTheDocument();
  });

  it('shows the empty text', () => {
    render(<LeaveList leaves={[]} emptyText="Nothing yet" />);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });
});
