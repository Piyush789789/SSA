import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

vi.mock('@/api/authApi', () => ({ authApi: { login: vi.fn() } }));
vi.mock('@/api/http', () => ({ http: { get: vi.fn(), post: vi.fn() } }));

const { authApi } = await import('@/api/authApi');
const { http } = await import('@/api/http');
const { AuthProvider } = await import('@/context/AuthContext');
const { LoginForm } = await import('./LoginForm');
const { TOKEN_STORAGE_KEY } = await import('@/api/apiClient');

const renderLogin = () =>
  renderWithProviders(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>,
    { route: '/login' },
  );

const fill = async (user, login, password) => {
  await user.type(screen.getByPlaceholderText(/student ID/i), login);
  await user.type(screen.getByPlaceholderText('Enter your password'), password);
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset();
    vi.mocked(http.get).mockReset();
  });

  it('defaults to Teacher and switches role from the role cards', async () => {
    const user = userEvent.setup();
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in as teacher/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Parent' }));
    expect(screen.getByRole('button', { name: /sign in as parent/i })).toBeInTheDocument();
    expect(screen.getByText(/Signing in as/)).toHaveTextContent('Signing in as Parent');
  });

  it('signs in and goes to the portal of the returned role', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({ success: true, token: 'jwt-1', user: { role: 'ADMIN' } });
    vi.mocked(http.get).mockResolvedValue({ user: { id: 'U1', name: 'Admin', email: 'a@x.in', role: 'ADMIN' } });
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Admin' }));
    await fill(user, '  admin@ssa.in ', 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in as admin/i }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/dashboard'));
    expect(authApi.login).toHaveBeenCalledWith('admin@ssa.in', 'secret123', 'Admin');
    expect(http.get).toHaveBeenCalledWith('/auth/me');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-1');
  });

  it('returns to the page the user was sent away from (e.g. after the session expired)', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({ success: true, token: 'jwt-1', user: { role: 'ADMIN' } });
    vi.mocked(http.get).mockResolvedValue({ user: { id: 'U1', name: 'Admin', email: 'a@x.in', role: 'ADMIN' } });
    renderWithProviders(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
      { route: '/login', state: { from: '/admin/fees' } },
    );
    await user.click(screen.getByRole('button', { name: 'Admin' }));
    await fill(user, 'admin@ssa.in', 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in as admin/i }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/fees'));
  });

  it("does not follow a remembered page of another portal or the login page itself", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({ success: true, token: 'jwt-1', user: { role: 'TEACHER' } });
    vi.mocked(http.get).mockResolvedValue({
      user: { id: 'U2', name: 'T', email: 't@x.in', role: 'TEACHER' },
      profile: { id: 'TCH-1', name: 'T' },
    });
    renderWithProviders(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
      { route: '/login', state: { from: '/admin/fees' } },
    );
    await fill(user, 't@x.in', 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in as teacher/i }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/teacher/dashboard'));
  });

  it("shows the server's message for a wrong password and stays on the page", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email/ID or password' } },
      message: 'Request failed with status code 401',
    });
    renderLogin();
    await fill(user, 'teacher@ssa.in', 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in as teacher/i }));

    expect(await screen.findByText('Invalid email/ID or password')).toBeInTheDocument();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in as teacher/i })).toBeEnabled();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('clears the error when another role is picked', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue({ response: { data: { message: 'Bad login' } } });
    renderLogin();
    await fill(user, 'x', 'y');
    await user.click(screen.getByRole('button', { name: /sign in as/i }));
    expect(await screen.findByText('Bad login')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Student' }));
    expect(screen.queryByText('Bad login')).not.toBeInTheDocument();
  });

  it('explains a network error', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(new Error('Network Error'));
    renderLogin();
    await fill(user, 'x', 'y');
    await user.click(screen.getByRole('button', { name: /sign in as/i }));
    expect(await screen.findByText(/Unable to reach backend server/)).toBeInTheDocument();
  });

  it('shows the message of an unsuccessful response', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({ success: false, message: 'Account disabled' });
    renderLogin();
    await fill(user, 'x', 'y');
    await user.click(screen.getByRole('button', { name: /sign in as/i }));
    expect(await screen.findByText('Account disabled')).toBeInTheDocument();
  });

  it('reports a failed profile load instead of a misleading "invalid credentials", and keeps no token', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({ success: true, token: 'jwt-2', user: { role: 'TEACHER' } });
    vi.mocked(http.get).mockRejectedValue(Object.assign(new Error('No teacher record is linked to this login'), { status: 403 }));
    renderLogin();
    await fill(user, 't@x.in', 'pw123456');
    await user.click(screen.getByRole('button', { name: /sign in as/i }));
    expect(await screen.findByText('No teacher record is linked to this login')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const input = screen.getByPlaceholderText('Enter your password');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
