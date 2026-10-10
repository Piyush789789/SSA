import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/i18n/I18nProvider';

vi.mock('@/api/http', () => ({ http: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ currentUser: { role: 'teacher' } }) }));
const { http } = await import('@/api/http');
const { WhatsAppClassView } = await import('./WhatsAppClassView');

const STUDENTS = {
  '5-B': [
    { id: 'S1', name: 'Asha', className: '5-B', rollNumber: 1, guardian: { name: 'Ramesh', phone: '9876512345' } },
    { id: 'S2', name: 'Bina', className: '5-B', rollNumber: 2, guardian: { name: 'Gita', phone: '' } },
    { id: 'S3', name: 'Chetan', className: '5-B', rollNumber: 3, guardian: { name: 'Hari', phone: '+91 90000 11111' } },
  ],
  '6-A': [{ id: 'S9', name: 'Zoya', className: '6-A', guardian: { name: 'Z', phone: '9123456789' } }],
};

describe('WhatsAppClassView', () => {
  let open;
  beforeEach(() => {
    vi.mocked(http.get).mockReset().mockImplementation(async (path) => {
      if (path === '/settings') return { schoolName: 'SSA' };
      const m = path.match(/^\/classes\/(.+)\/students$/);
      if (m) return STUDENTS[decodeURIComponent(m[1])];
      throw new Error(path);
    });
    open = vi.spyOn(window, 'open').mockImplementation(() => null);
  });
  afterEach(() => open.mockRestore());

  const renderView = () =>
    render(
      <I18nProvider>
        <WhatsAppClassView classes={['5-B', '6-A']} />
      </I18nProvider>,
    );

  it('shows progress starting at 0 (not "{sent}") and walks down the class', async () => {
    const user = userEvent.setup();
    renderView();
    expect(await screen.findByText('Asha')).toBeInTheDocument();
    expect(screen.getByText('0 of 2 families messaged')).toBeInTheDocument();
    expect(screen.getByText('No phone number saved')).toBeInTheDocument();
    expect(screen.getByText('Preview for Asha')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Send to next: Asha' }));
    expect(new URL(open.mock.calls[0][0]).pathname).toBe('/919876512345');
    expect(new URL(open.mock.calls[0][0]).searchParams.get('text')).toContain('Asha (Class 5-B)');
    expect(screen.getByText('1 of 2 families messaged')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Send to next: Chetan' }));
    expect(new URL(open.mock.calls[1][0]).pathname).toBe('/919000011111');
    expect(screen.getByRole('button', { name: 'All done' })).toBeDisabled();
  });

  it('skipping moves to the next family; changing class resets progress', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText('Asha');
    await user.click(screen.getAllByTitle('Skip')[0]);
    expect(screen.getByRole('button', { name: 'Send to next: Chetan' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Class'), '6-A');
    expect(await screen.findByText('Zoya')).toBeInTheDocument();
    expect(screen.getByText('0 of 1 families messaged')).toBeInTheDocument();
  });

  it('an empty message cannot be sent', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText('Asha');
    await user.clear(screen.getByLabelText('Message'));
    expect(screen.getByRole('button', { name: /Send to next/ })).toBeDisabled();
  });
});
