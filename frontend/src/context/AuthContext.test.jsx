import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/api/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const { http } = await import('@/api/http');
const { AuthProvider, buildCurrentUser, useAuth } = await import('./AuthContext');
const { TOKEN_STORAGE_KEY } = await import('@/api/apiClient');

const adminUser = { id: 'U1', name: 'Asha Admin', email: 'admin@ssa.in', role: 'ADMIN', permissions: [] };

describe('buildCurrentUser', () => {
  it('admin: full administrator by default', () => {
    const u = buildCurrentUser({ user: adminUser, profile: null, children: [] });
    expect(u).toMatchObject({
      id: 'U1',
      userId: 'U1',
      role: 'admin',
      name: 'Asha Admin',
      avatar: 'AA',
      mustChangePassword: false,
      permissions: [],
      staffTitle: null,
    });
  });

  it('limited staff admin keeps permissions and staff title', () => {
    const u = buildCurrentUser({
      user: { ...adminUser, permissions: ['FEES'], staffTitle: 'Accountant', mustChangePassword: true },
      profile: null,
      children: [],
    });
    expect(u.permissions).toEqual(['FEES']);
    expect(u.staffTitle).toBe('Accountant');
    expect(u.mustChangePassword).toBe(true);
  });

  it('treats a missing permissions list as none', () => {
    const u = buildCurrentUser({ user: { ...adminUser, permissions: undefined }, profile: null, children: [] });
    expect(u.permissions).toEqual([]);
  });

  it('teacher: merges the teacher record', () => {
    const u = buildCurrentUser({
      user: { id: 'U2', name: 'login name', email: 'meera@ssa.in', role: 'TEACHER' },
      profile: { id: 'TCH-1', name: 'Meera Joshi', email: 'meera.j@ssa.in', assignedClasses: ['5-B'], subjects: ['Maths'] },
      children: [],
    });
    expect(u).toMatchObject({
      role: 'teacher',
      userId: 'U2',
      id: 'TCH-1',
      teacherId: 'TCH-1',
      name: 'Meera Joshi',
      loginEmail: 'meera@ssa.in',
      avatar: 'MJ',
      assignedClasses: ['5-B'],
      permissions: [],
      mustChangePassword: false,
    });
  });

  it('student: maps student fields', () => {
    const u = buildCurrentUser({
      user: { id: 'U3', name: 'Ravi', email: 'STU-2026-0001', role: 'STUDENT', mustChangePassword: true },
      profile: {
        id: 'STU-2026-0001',
        name: 'Ravi Kumar',
        className: '5-B',
        dateOfBirth: '2015-04-02',
        guardian: { name: 'Mohan', phone: '9876512345' },
      },
      children: [],
    });
    expect(u).toMatchObject({
      role: 'student',
      studentId: 'STU-2026-0001',
      section: 'B',
      dob: '2015-04-02',
      parent: { name: 'Mohan', phone: '9876512345' },
      avatar: 'RK',
      loginEmail: 'STU-2026-0001',
      mustChangePassword: true,
    });
  });

  it('parent: lists children as students', () => {
    const u = buildCurrentUser({
      user: { id: 'U4', name: 'P', email: 'p@x.in', role: 'PARENT' },
      profile: { id: 'PAR-1', name: 'Sita Devi', childIds: ['S1', 'S2'] },
      children: [
        { id: 'S1', name: 'Anu', className: '3-A' },
        { id: 'S2', name: 'Bablu', className: 'UKG' },
      ],
    });
    expect(u.parentId).toBe('PAR-1');
    expect(u.avatar).toBe('SD');
    expect(u.linkedChildren).toHaveLength(2);
    expect(u.linkedChildren[0]).toMatchObject({ studentId: 'S1', section: 'A', avatar: 'A' });
    expect(u.linkedChildren[1]).toMatchObject({ studentId: 'S2', section: undefined });
  });
});

const Probe = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="role">{auth.role ?? 'none'}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="child">{auth.selectedChildId ?? 'none'}</span>
      <button type="button" onClick={() => auth.switchChild('S2')}>switch</button>
      <button type="button" onClick={() => auth.logout()}>logout</button>
      <button
        type="button"
        onClick={() => auth.loginWithApi(null, 'tok-1').catch((e) => (window.__loginError = e.message))}
      >
        login
      </button>
    </div>
  );
};

const parentMe = {
  user: { id: 'U4', name: 'P', email: 'p@x.in', role: 'PARENT' },
  profile: { id: 'PAR-1', name: 'Sita' },
  children: [
    { id: 'S1', name: 'Anu', className: '3-A' },
    { id: 'S2', name: 'Bablu', className: '4-A' },
  ],
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(http.get).mockReset();
    vi.mocked(http.post).mockReset().mockResolvedValue(null);
    delete window.__loginError;
  });

  it('is signed out without a saved token and does not call the server', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(http.get).not.toHaveBeenCalled();
  });

  it('restores a saved session, selects the first child and switches children', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'saved');
    vi.mocked(http.get).mockResolvedValue(parentMe);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('parent'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('child')).toHaveTextContent('S1');
    act(() => screen.getByText('switch').click());
    expect(screen.getByTestId('child')).toHaveTextContent('S2');
    expect(localStorage.getItem('ssa_selected_child')).toBe('S2');
  });

  it('drops a saved token the server rejects with 401', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired');
    vi.mocked(http.get).mockRejectedValue(Object.assign(new Error('Session expired'), { status: 401 }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('signs out on the ssa:unauthorized event and on logout', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'saved');
    vi.mocked(http.get).mockResolvedValue({ user: adminUser });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('admin'));
    act(() => window.dispatchEvent(new Event('ssa:unauthorized')));
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('logout tells the server and clears the token', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'saved');
    vi.mocked(http.get).mockResolvedValue({ user: adminUser });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('admin'));
    const apiClient = (await import('@/api/apiClient')).default;
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });
    act(() => screen.getByText('logout').click());
    // The token must be sent explicitly: it is removed from storage before axios' interceptor would read it.
    expect(post).toHaveBeenCalledWith('/auth/logout', null, { headers: { Authorization: 'Bearer saved' } });
    post.mockRestore();
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('loginWithApi stores the token and loads the profile', async () => {
    vi.mocked(http.get).mockResolvedValue({ user: adminUser });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => screen.getByText('login').click());
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('admin'));
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('tok-1');
  });

  it('loginWithApi does not leave the token behind when the profile cannot be loaded', async () => {
    vi.mocked(http.get).mockRejectedValue(Object.assign(new Error('No teacher record is linked'), { status: 403 }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => screen.getByText('login').click());
    await waitFor(() => expect(window.__loginError).toBe('No teacher record is linked'));
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });

  it('useAuth outside the provider throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
