import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// These tests type a lot; give them room on a busy machine.
configure({ asyncUtilTimeout: 5000 });
vi.setConfig({ testTimeout: 30000 });

vi.mock('@/api/http', async () => {
  const actual = await vi.importActual('@/api/http');
  return { ...actual, http: { get: vi.fn(), put: vi.fn(), post: vi.fn() } };
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

  describe('question-wise papers', () => {
    const QSHEET = {
      schedule: {
        id: 'P1',
        className: '5-B',
        subject: 'Maths',
        maxMarks: 20,
        questions: [
          { label: 'Q1', maxMarks: 5 },
          { label: 'Q2', maxMarks: 5 },
          { label: 'Q3', maxMarks: 10 },
        ],
      },
      rows: [
        { studentId: 'S1', studentName: 'Asha', rollNumber: 1, obtainedMarks: null, absent: false, status: 'Not Entered', questionMarks: null },
        { studentId: 'S2', studentName: 'Bina', rollNumber: 2, obtainedMarks: 9, absent: false, status: 'Draft', questionMarks: [4, null, 5] },
        { studentId: 'S3', studentName: 'Chetan', rollNumber: 3, obtainedMarks: 12, absent: false, status: 'Draft', questionMarks: null },
      ],
    };
    const cell = (q, name) => screen.getByRole('textbox', { name: `${q} marks for ${name}` });

    beforeEach(() => {
      vi.mocked(http.post).mockReset();
      vi.mocked(http.get).mockImplementation(async (path) => {
        if (path.startsWith('/exam-schedules?')) return [{ id: 'P1', subject: 'Maths', maxMarks: 20, date: '2026-10-01' }];
        if (path === '/exam-schedules/P1/marks') return JSON.parse(JSON.stringify(QSHEET));
        throw new Error(path);
      });
    });

    it('shows one box per question, a live total, validation and sends questionMarks', async () => {
      const onSaved = vi.fn();
      vi.mocked(http.put).mockResolvedValue(QSHEET);
      renderTable({ onSaved });
      await screen.findByText('Asha');
      expect(cell('Q2', 'Bina')).toHaveValue('');
      expect(within(rowOf('Bina')).getByLabelText('Total')).toHaveTextContent('9');
      expect(within(rowOf('Chetan')).getByText('total only')).toBeInTheDocument();

      await userEvent.type(cell('Q1', 'Asha'), '4');
      await userEvent.keyboard('{Enter}');
      expect(cell('Q2', 'Asha')).toHaveFocus(); // Enter moves across
      await userEvent.keyboard('7');
      expect(within(rowOf('Asha')).getByRole('alert')).toHaveTextContent('Q2: Must be 0–5');
      await userEvent.click(screen.getByRole('button', { name: /Save Draft/ }));
      expect(screen.getByText('Please fix the highlighted question marks before saving.')).toBeInTheDocument();
      expect(http.put).not.toHaveBeenCalled();

      await userEvent.clear(cell('Q2', 'Asha'));
      await userEvent.type(cell('Q2', 'Asha'), '3.5');
      expect(within(rowOf('Asha')).getByLabelText('Total')).toHaveTextContent('7.5');
      await userEvent.click(screen.getByRole('button', { name: /Submit Marks/ }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Marks submitted successfully.'));
      expect(http.put).toHaveBeenCalledWith('/exam-schedules/P1/marks', {
        submit: true,
        entries: [
          { studentId: 'S1', absent: false, clear: false, questionMarks: [4, 3.5, null] },
          { studentId: 'S2', absent: false, clear: false, questionMarks: [4, null, 5] },
          { studentId: 'S3', obtainedMarks: 12, absent: false, clear: false },
        ],
      });
    });

    it('edits the questions with the split helper and saves them', async () => {
      vi.mocked(http.put).mockResolvedValue(QSHEET.schedule);
      renderTable();
      await screen.findByText('Asha');
      await userEvent.click(screen.getByRole('button', { name: 'Edit questions' }));
      const count = screen.getByLabelText('Number of questions');
      await userEvent.clear(count);
      await userEvent.type(count, '3');
      await userEvent.click(screen.getByRole('button', { name: /Split 20 marks equally/ }));
      expect(screen.getByText(/Adds up to/)).toHaveTextContent('Adds up to 20 of 20');

      await userEvent.clear(screen.getByLabelText('Max marks of question 3'));
      expect(screen.getByText(/Adds up to/)).toHaveTextContent('Adds up to 13.5 of 20');
      expect(screen.getByRole('button', { name: 'Save questions' })).toBeDisabled();
      await userEvent.type(screen.getByLabelText('Max marks of question 3'), '6.5');

      await userEvent.click(screen.getByRole('button', { name: 'Save questions' }));
      await waitFor(() =>
        expect(http.put).toHaveBeenCalledWith('/exam-schedules/P1/questions', {
          questions: [
            { label: 'Q1', maxMarks: 7 },
            { label: 'Q2', maxMarks: 6.5 },
            { label: 'Q3', maxMarks: 6.5 },
          ],
        }),
      );
    });

    it('checks an uploaded CSV with a dry run, then saves the valid rows', async () => {
      vi.mocked(http.post)
        .mockResolvedValueOnce({
          dryRun: true, total: 2, valid: 1, saved: 0, failed: 1,
          rows: [
            { row: 2, studentId: 'S1', studentName: 'Asha', status: 'OK', message: null, total: 9 },
            { row: 3, studentId: 'S9', studentName: null, status: 'ERROR', message: 'Not a student of class 5-B', total: null },
          ],
        })
        .mockResolvedValueOnce({
          dryRun: false, total: 2, valid: 1, saved: 1, failed: 1,
          rows: [
            { row: 2, studentId: 'S1', studentName: 'Asha', status: 'SAVED', message: null, total: 9 },
            { row: 3, studentId: 'S9', studentName: null, status: 'ERROR', message: 'Not a student of class 5-B', total: null },
          ],
        });
      renderTable();
      await screen.findByText('Asha');
      const file = new File(['Student ID,Name,Q1,Q2,Q3,Absent\nS1,Asha,4,5,\nS9,X,1,1,1,\n'], 'marks.csv', { type: 'text/csv' });
      await userEvent.upload(screen.getByTestId('marks-file-input'), file);

      expect(await screen.findByText('Not a student of class 5-B')).toBeInTheDocument();
      expect(http.post).toHaveBeenCalledWith('/exam-schedules/P1/marks/import', {
        dryRun: true,
        rows: [
          { row: 2, studentId: 'S1', absent: false, questionMarks: [4, 5, null] },
          { row: 3, studentId: 'S9', absent: false, questionMarks: [1, 1, 1] },
        ],
      });
      expect(screen.getByText('1 valid')).toBeInTheDocument();
      expect(screen.getByText('1 errors')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Save 1 students' }));
      expect(await screen.findByText(/1 students saved as Draft/)).toBeInTheDocument();
      expect(vi.mocked(http.post).mock.calls[1][1].dryRun).toBe(false);
      expect(http.get).toHaveBeenCalledWith('/exam-schedules/P1/marks');
    });
  });
});
