import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const auth = { current: {} };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth.current }));

const { RequireRole, HOME_BY_ROLE } = await import('./RequireRole');
const { FullAdminRoute, SignedInRoute, HomeRedirect } = await import('./index');

const Where = () => {
  const location = useLocation();
  return (
    <div data-testid="where">
      {location.pathname}
      {location.state?.from ? ` from=${location.state.from}` : ''}
    </div>
  );
};

const renderAt = (path, element, routePath = path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

const signedIn = (user) => {
  auth.current = { currentUser: user, isLoading: false, logout: vi.fn(), refreshSession: vi.fn() };
};

describe('RequireRole', () => {
  beforeEach(() => signedIn(null));

  it('shows a loading message while the session is restored', () => {
    auth.current = { currentUser: null, isLoading: true };
    renderAt('/admin/students', <RequireRole role="admin">secret</RequireRole>);
    expect(screen.getByText('Signing you in…')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('sends signed-out visitors to the login page, remembering where they were going', () => {
    renderAt('/admin/students', <RequireRole role="admin">secret</RequireRole>);
    expect(screen.getByTestId('where')).toHaveTextContent('/login from=/admin/students');
  });

  it.each([
    ['teacher', '/teacher/dashboard'],
    ['student', '/student/dashboard'],
    ['parent', '/parent/dashboard'],
  ])('sends a %s to their own portal', (role, home) => {
    signedIn({ role });
    renderAt('/admin/fees', <RequireRole role="admin">secret</RequireRole>);
    expect(screen.getByTestId('where')).toHaveTextContent(home);
    expect(HOME_BY_ROLE[role]).toBe(home);
  });

  it('sends an unknown role to the login page', () => {
    signedIn({ role: 'janitor' });
    renderAt('/admin/fees', <RequireRole role="admin">secret</RequireRole>);
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });

  it('shows the page to the right role', () => {
    signedIn({ role: 'admin', permissions: [] });
    renderAt('/admin/fees', <RequireRole role="admin">secret</RequireRole>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('asks for a new password before anything else', () => {
    signedIn({ role: 'teacher', name: 'Meera', mustChangePassword: true });
    renderAt('/teacher/dashboard', <RequireRole role="teacher">secret</RequireRole>);
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.getByText('Set your own password')).toBeInTheDocument();
  });
});

describe('FullAdminRoute', () => {
  it('lets a full administrator in', () => {
    signedIn({ role: 'admin', permissions: [] });
    renderAt('/admin/settings', <FullAdminRoute>settings</FullAdminRoute>);
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('sends limited staff (with a permissions list) to the dashboard', () => {
    signedIn({ role: 'admin', permissions: ['FEES'], staffTitle: 'Accountant' });
    renderAt('/admin/settings', <FullAdminRoute>settings</FullAdminRoute>);
    expect(screen.getByTestId('where')).toHaveTextContent('/admin/dashboard');
  });

  it('still keeps non-admins out', () => {
    signedIn({ role: 'teacher', permissions: [] });
    renderAt('/admin/settings', <FullAdminRoute>settings</FullAdminRoute>);
    expect(screen.getByTestId('where')).toHaveTextContent('/teacher/dashboard');
  });

  it('signed-out visitors go to login', () => {
    signedIn(null);
    renderAt('/admin/backups', <FullAdminRoute>backups</FullAdminRoute>);
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });
});

describe('SignedInRoute and HomeRedirect', () => {
  it('SignedInRoute admits any role and redirects visitors', () => {
    signedIn({ role: 'parent' });
    renderAt('/calendar', <SignedInRoute>shared</SignedInRoute>);
    expect(screen.getByText('shared')).toBeInTheDocument();
  });

  it('SignedInRoute redirects signed-out visitors', () => {
    signedIn(null);
    renderAt('/calendar', <SignedInRoute>shared</SignedInRoute>);
    expect(screen.getByTestId('where')).toHaveTextContent('/login from=/calendar');
  });

  it('HomeRedirect goes to the portal or the login page', () => {
    signedIn({ role: 'student' });
    const { unmount } = renderAt('/', <HomeRedirect />);
    expect(screen.getByTestId('where')).toHaveTextContent('/student/dashboard');
    unmount();
    signedIn(null);
    renderAt('/', <HomeRedirect />);
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });
});
