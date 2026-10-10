import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_STORAGE_KEY } from '@/api/apiClient';
import { http } from '@/api/http';
import { initialsOf } from '@/utils';

const AuthContext = createContext();
const CHILD_STORAGE_KEY = 'ssa_selected_child';

/**
 * Flattens the /auth/me response into the `currentUser` shape the pages use. Field names such as
 * studentId, teacherId, assignedClasses and linkedChildren are kept from the earlier mock users.
 */
function buildCurrentUser({ user, profile, children }) {
  const role = user.role.toLowerCase();
  const base = {
    userId: user.id,
    id: user.id,
    role,
    name: user.name,
    email: user.email,
    avatar: initialsOf(user.name),
    mustChangePassword: Boolean(user.mustChangePassword),
    // Admin staff roles: an empty list means a full administrator; otherwise the modules they may change.
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    staffTitle: user.staffTitle ?? null,
  };

  switch (role) {
    case 'teacher':
      return { ...base, ...profile, role, teacherId: profile.id, loginEmail: user.email, avatar: initialsOf(profile.name) };
    case 'student':
      return { ...base, ...toStudent(profile), role, loginEmail: user.email };
    case 'parent':
      return {
        ...base,
        ...profile,
        role,
        parentId: profile.id,
        loginEmail: user.email,
        avatar: initialsOf(profile.name),
        linkedChildren: children.map(toStudent),
      };
    default:
      return base;
  }
}

function toStudent(student) {
  return {
    ...student,
    studentId: student.id,
    section: student.className?.split('-')[1],
    dob: student.dateOfBirth,
    parent: student.guardian,
    avatar: initialsOf(student.name),
  };
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null); // { user, profile, children } from GET /auth/me
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [selectedChildId, setSelectedChildId] = useState(() => localStorage.getItem(CHILD_STORAGE_KEY));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('ssa_auth_user'); // left over from the old mock login
    setSession(null);
  }, []);

  const loadSession = useCallback(async () => {
    const me = await http.get('/auth/me');
    const next = { user: me.user, profile: me.profile ?? null, children: me.children ?? [] };
    setSession(next);
    return next;
  }, []);

  // Restore the session saved in this browser.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) return;
    loadSession()
      .catch((error) => {
        if (error.status === 401) clearSession();
      })
      .finally(() => setIsLoading(false));
  }, [loadSession, clearSession]);

  // Any request answered with 401 (expired session, backend restarted) signs the user out.
  useEffect(() => {
    window.addEventListener('ssa:unauthorized', clearSession);
    return () => window.removeEventListener('ssa:unauthorized', clearSession);
  }, [clearSession]);

  const currentUser = useMemo(() => (session ? buildCurrentUser(session) : null), [session]);

  const linkedChildren = currentUser?.linkedChildren ?? [];
  const selectedChild = linkedChildren.find((c) => c.studentId === selectedChildId) ?? linkedChildren[0] ?? null;

  const switchChild = useCallback((childId) => {
    setSelectedChildId(childId);
    localStorage.setItem(CHILD_STORAGE_KEY, childId);
  }, []);

  /** Called by the login form with the /auth/login response. Resolves once the profile is loaded. */
  const loginWithApi = useCallback(
    async (_apiUser, token) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      const next = await loadSession();
      return buildCurrentUser(next);
    },
    [loadSession],
  );

  const logout = useCallback(() => {
    http.post('/auth/logout').catch(() => {});
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isLoading,
        selectedChild,
        selectedChildId: selectedChild?.studentId ?? null,
        switchChild,
        loginWithApi,
        logout,
        refreshSession: loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
