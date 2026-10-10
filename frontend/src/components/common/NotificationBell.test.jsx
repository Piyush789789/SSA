import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

vi.mock('@/api/http', () => ({ http: { get: vi.fn(), post: vi.fn() } }));
const { http } = await import('@/api/http');
const { NotificationBell } = await import('./NotificationBell');

const ITEMS = [
  { id: 'n1', title: 'Fee due', body: 'Pay by Friday', category: 'FEES', link: '/fees?due=12', createdAt: '2026-10-06T10:30:00' },
  { id: 'n2', title: 'Holiday', category: 'NOTICE', link: '/notices', createdAt: '2026-10-05T09:00:00', readAt: '2026-10-05T10:00:00' },
  { id: 'n3', title: 'Hello', category: 'OTHER', link: null, createdAt: '2026-10-04T09:00:00' },
];

let unread;
const setupServer = () => {
  vi.mocked(http.get).mockImplementation(async (path) => {
    if (path === '/notifications/unread-count') return { unread };
    if (path.startsWith('/notifications')) return ITEMS.map((i) => ({ ...i }));
    throw new Error(`unexpected ${path}`);
  });
  vi.mocked(http.post).mockResolvedValue(null);
};

const renderBell = (portal = 'parent') => renderWithProviders(<NotificationBell portal={portal} />, { route: '/parent/dashboard' });

describe('NotificationBell', () => {
  beforeEach(() => {
    unread = 2;
    vi.mocked(http.get).mockReset();
    vi.mocked(http.post).mockReset();
    setupServer();
  });

  it('shows the unread badge', async () => {
    renderBell();
    expect(await screen.findByRole('button', { name: 'Notifications (2 unread)' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('caps the badge at 99+ and hides it at 0', async () => {
    unread = 250;
    const { unmount } = renderBell();
    expect(await screen.findByText('99+')).toBeInTheDocument();
    unmount();
    unread = 0;
    renderBell();
    await waitFor(() => expect(http.get).toHaveBeenCalledWith('/notifications/unread-count'));
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('keeps working when the count request fails', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('offline'));
    renderBell();
    await waitFor(() => expect(http.get).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('opens the list and marks one read when clicked, then navigates to its page', async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByRole('button', { name: 'Notifications (2 unread)' }));
    expect(await screen.findByText('Fee due')).toBeInTheDocument();
    expect(screen.getByText('2 unread')).toBeInTheDocument();
    expect(http.get).toHaveBeenCalledWith('/notifications?limit=50');

    await user.click(screen.getByText('Fee due'));
    expect(http.post).toHaveBeenCalledWith('/notifications/n1/read');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/parent/fees'));
  });

  it('marking a notification without a page keeps the panel open and lowers the count', async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByText('Hello'));
    expect(http.post).toHaveBeenCalledWith('/notifications/n3/read');
    expect(await screen.findByText('1 unread')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not mark an already read notification again', async () => {
    const user = userEvent.setup();
    renderBell('teacher');
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByText('Holiday'));
    expect(http.post).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/teacher/notices'));
  });

  it('a link with no page in this portal is not followed', async () => {
    const user = userEvent.setup();
    renderBell('teacher');
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByText('Fee due')); // teachers have no fees page
    expect(http.post).toHaveBeenCalledWith('/notifications/n1/read');
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });

  it('mark all read clears the badge', async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    await screen.findByText('Fee due');
    await user.click(screen.getByRole('button', { name: /Mark all read/ }));
    expect(http.post).toHaveBeenCalledWith('/notifications/read-all');
    expect(await screen.findByText('All caught up')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark all read/ })).toBeDisabled();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('shows the error when the list cannot load', async () => {
    const user = userEvent.setup();
    renderBell();
    await screen.findByRole('button', { name: /2 unread/ });
    vi.mocked(http.get).mockImplementation(async (path) => {
      if (path === '/notifications/unread-count') return { unread: 2 };
      throw new Error('Cannot reach the server.');
    });
    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(await screen.findByText('Cannot reach the server.')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    const user = userEvent.setup();
    unread = 0;
    vi.mocked(http.get).mockImplementation(async (path) => (path.includes('unread') ? { unread: 0 } : []));
    renderBell();
    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(await screen.findByText('No notifications yet.')).toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('polls the unread count every minute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderBell();
    await act(async () => {});
    const countCalls = () => vi.mocked(http.get).mock.calls.filter(([p]) => p === '/notifications/unread-count').length;
    expect(countCalls()).toBe(1);
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(countCalls()).toBe(2);
  });
});
