import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/dashboard/AdminPageShell', () => ({
  AdminPageShell: ({ title, children }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));
vi.mock('@/api/files', () => ({ postSlow: vi.fn(), downloadFile: vi.fn(), saveBlob: vi.fn() }));

const files = await import('@/api/files');
const { ImportStudentsPage } = await import('./ImportStudentsPage');

const CSV = 'name,class\nAsha,5-B\n,5-B\nRavi,6-A\n';

const DRY_RUN = {
  total: 3,
  valid: 2,
  failed: 1,
  rows: [
    { row: 2, name: 'Asha', status: 'OK' },
    { row: 3, name: '', status: 'ERROR', message: 'Name is required' },
    { row: 4, name: 'Ravi', status: 'OK' },
  ],
};

const IMPORTED = {
  total: 3,
  created: 2,
  failed: 1,
  rows: [
    { row: 2, name: 'Asha', status: 'CREATED', id: 'STU-1' },
    { row: 3, name: '', status: 'ERROR', message: 'Name is required' },
    { row: 4, name: 'Ravi', status: 'CREATED', id: 'STU-2' },
  ],
  logins: [
    { name: 'Asha', loginId: 'STU-1', temporaryPassword: 'pw1, "x"' },
    { name: 'Ravi', loginId: 'STU-2', temporaryPassword: 'pw2' },
  ],
};

const chooseCsv = async (user, text = CSV, name = 'students.csv') => {
  const input = document.querySelector('input[type="file"]');
  await user.upload(input, new File([text], name, { type: 'text/csv' }));
};

describe('ImportStudentsPage', () => {
  beforeEach(() => {
    vi.mocked(files.postSlow).mockReset();
    vi.mocked(files.saveBlob).mockReset();
    vi.mocked(files.downloadFile).mockReset().mockResolvedValue(undefined);
  });

  it('cannot check before a file is chosen', () => {
    render(<ImportStudentsPage />);
    expect(screen.getByRole('button', { name: /Check file/ })).toBeDisabled();
  });

  it('downloads the template', async () => {
    const user = userEvent.setup();
    render(<ImportStudentsPage />);
    await user.click(screen.getByRole('button', { name: /Template/ }));
    expect(files.downloadFile).toHaveBeenCalledWith('/import/students/template', 'students-template.csv');
  });

  it('checks the file (dry run), then imports and offers the logins as CSV', async () => {
    const user = userEvent.setup();
    vi.mocked(files.postSlow).mockResolvedValueOnce(DRY_RUN).mockResolvedValueOnce(IMPORTED);
    render(<ImportStudentsPage />);

    await chooseCsv(user);
    expect(await screen.findByText('students.csv')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Check file/ }));

    expect(files.postSlow).toHaveBeenNthCalledWith(1, '/import/students', { csv: CSV, dryRun: true, createLogins: true });
    expect(await screen.findByText(/2 of 3 rows are ready to import, 1 has errors and will be skipped./)).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    // Errors are listed first.
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('ERROR')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /Create logins/ }));
    await user.click(screen.getByRole('button', { name: 'Import 2 students' }));

    expect(files.postSlow).toHaveBeenNthCalledWith(2, '/import/students', { csv: CSV, dryRun: false, createLogins: false });
    expect(await screen.findByText('2 students admitted')).toBeInTheDocument();
    expect(screen.getByText('1 row was skipped because of errors.')).toBeInTheDocument();
    expect(screen.getByText('New logins (2)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Download as CSV/ }));
    const [blob, fileName] = vi.mocked(files.saveBlob).mock.calls[0];
    expect(fileName).toMatch(/^student-logins-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(await blob.text()).toBe('Name,Login,Temporary password\r\nAsha,STU-1,"pw1, ""x"""\r\nRavi,STU-2,pw2');

    await user.click(screen.getByRole('button', { name: 'Import another file' }));
    expect(screen.getByRole('button', { name: /Check file/ })).toBeDisabled();
    expect(screen.queryByText('students.csv')).not.toBeInTheDocument();
  });

  it('singular wording and no import when nothing is valid', async () => {
    const user = userEvent.setup();
    vi.mocked(files.postSlow).mockResolvedValueOnce({ total: 1, valid: 0, failed: 1, rows: [DRY_RUN.rows[1]] });
    render(<ImportStudentsPage />);
    await chooseCsv(user);
    await user.click(screen.getByRole('button', { name: /Check file/ }));
    expect(await screen.findByRole('button', { name: 'Import 0 students' })).toBeDisabled();
  });

  it('choosing another file clears the previous check', async () => {
    const user = userEvent.setup();
    vi.mocked(files.postSlow).mockResolvedValueOnce(DRY_RUN);
    render(<ImportStudentsPage />);
    await chooseCsv(user);
    await user.click(screen.getByRole('button', { name: /Check file/ }));
    await screen.findByText('Check result');
    await chooseCsv(user, 'name,class\nZoya,1-A\n', 'other.csv');
    await waitFor(() => expect(screen.queryByText('Check result')).not.toBeInTheDocument());
    expect(screen.getByText('other.csv')).toBeInTheDocument();
  });

  it('shows server errors and allows retrying', async () => {
    const user = userEvent.setup();
    vi.mocked(files.postSlow).mockRejectedValueOnce(new Error('The file has no header row'));
    render(<ImportStudentsPage />);
    await chooseCsv(user);
    await user.click(screen.getByRole('button', { name: /Check file/ }));
    expect(await screen.findByText('The file has no header row')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check file/ })).toBeEnabled();
  });

  it('an empty file shows "no rows"', async () => {
    const user = userEvent.setup();
    vi.mocked(files.postSlow).mockResolvedValueOnce({ total: 0, valid: 0, failed: 0, rows: [] });
    render(<ImportStudentsPage />);
    await chooseCsv(user, 'name,class\n');
    await user.click(screen.getByRole('button', { name: /Check file/ }));
    expect(await screen.findByText('The file has no rows.')).toBeInTheDocument();
  });
});
