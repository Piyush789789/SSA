import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/api/http', async () => {
  const actual = await vi.importActual('@/api/http');
  return { ...actual, http: { get: vi.fn(), put: vi.fn() } };
});
const { http } = await import('@/api/http');
const { MarksEntryTable } = await import('./MarksEntryTable');

const BANDS = [
  { min: 90, max: 100, grade: 'A1' },
  { min: 33, max: 89, grade: 'C' },
  { min: 0, max: 32, grade: 'E' },
];
const SHEET = {
  schedule: { id: 'P1', maxMarks: 50 },
  rows: [
    { studentId: 'S1', studentName: 'Asha', rollNumber: 1, obtainedMarks: null, absent: false, status: 'Not Entered' },
    { studentId: 'S2', studentName: 'Bina', rollNumber: 2, obtainedMarks: 30, absent: false, status: 'Draft' },
    { studentId: 'S3', studentName: 'Chetan', rollNumber: 3, obtainedMarks: null, absent: false, status: 'Not Entered' },
  ],
};

const rowOf = (name) => screen.getByText(name).closest('tr');
const marksInput = (name) => within(rowOf(name)).getByPlaceholderText('—');

describe('MarksEntryTable', () => {
  beforeEach(() => {
    vi.mocked(http.put).mockReset();
    vi.mocked(http.get).mockReset().mockImplementation(async (path) => {
      if (path.startsWith('/exam-schedules?')) return [{ id: 'P1', subject: 'Maths', maxMarks: 50, date: '2026-10-01' }];
      if (path === '/exam-schedules/P1/marks') return JSON.parse(JSON.stringify(SHEET));
      throw new Error(path);
    });
  });

  const renderTable = (props = {}) =>
    render(<MarksEntryTable exams={[{ id: 'E1', name: 'Half Yearly', classes: ['5-B'] }]} selectedExamId="E1" gradeBands={BANDS} {...props} />);

  it('shows an empty state without exams', () => {
    render(<MarksEntryTable exams={[]} />);
    expect(screen.getByText(/No examinations yet/)).toBeInTheDocument();
  });

  it('validates the range and blocks saving until fixed', async () => {
    renderTable();
    await screen.findByText('Asha');
    fireEvent.change(marksInput('Asha'), { target: { value: '51' } });
    expect(screen.getByText('Marks must be 0–50.')).toBeInTheDocument();
    fireEvent.change(marksInput('Chetan'), { target: { value: '-1' } });
    expect(screen.getAllByText('Marks must be 0–50.')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: /Save Draft/ }));
    expect(screen.getByText('Please fix the highlighted marks before saving.')).toBeInTheDocument();
    expect(http.put).not.toHaveBeenCalled();

    fireEvent.change(marksInput('Asha'), { target: { value: '50' } });
    await userEvent.click(within(rowOf('Chetan')).getByRole('checkbox')); // absent clears the error
    expect(screen.queryByText('Marks must be 0–50.')).not.toBeInTheDocument();
  });

  it('shows percent and grade as marks are typed', async () => {
    renderTable();
    await screen.findByText('Asha');
    fireEvent.change(marksInput('Asha'), { target: { value: '45' } });
    expect(within(rowOf('Asha')).getByText('90%')).toBeInTheDocument();
    expect(within(rowOf('Asha')).getByText('A1')).toBeInTheDocument();
    fireEvent.change(marksInput('Asha'), { target: { value: '0' } });
    expect(within(rowOf('Asha')).getByText('E')).toBeInTheDocument();
  });

  it('saves marks, absences and clears an emptied saved mark', async () => {
    const onSaved = vi.fn();
    vi.mocked(http.put).mockResolvedValue(SHEET);
    renderTable({ onSaved });
    await screen.findByText('Asha');
    fireEvent.change(marksInput('Asha'), { target: { value: '42' } });
    fireEvent.change(marksInput('Bina'), { target: { value: '' } });
    await userEvent.click(within(rowOf('Chetan')).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /Submit Marks/ }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Marks submitted successfully.'));
    expect(http.put).toHaveBeenCalledWith('/exam-schedules/P1/marks', {
      submit: true,
      entries: [
        { studentId: 'S1', obtainedMarks: 42, absent: false, clear: false },
        { studentId: 'S2', obtainedMarks: null, absent: false, clear: true },
        { studentId: 'S3', obtainedMarks: null, absent: true, clear: false },
      ],
    });
  });

  it('shows the server error', async () => {
    vi.mocked(http.put).mockRejectedValue(new Error('Marks are locked'));
    renderTable();
    await screen.findByText('Asha');
    await userEvent.click(screen.getByRole('button', { name: /Save Draft/ }));
    expect(await screen.findByText('Marks are locked')).toBeInTheDocument();
  });
});
