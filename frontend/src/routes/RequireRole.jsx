import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingMessage } from '@/components/common/AsyncState';
import { ForcedPasswordChange } from '@/components/common/ChangePassword';

export const HOME_BY_ROLE = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard',
};

/**
 * Shows `children` only to a signed-in user with `role`. Signed-out visitors go to the login page; users of
 * another role go to their own portal. The backend enforces the same rules on every request.
 */
export const RequireRole = ({ role, children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMessage text="Signing you in…" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (currentUser.role !== role) {
    return <Navigate to={HOME_BY_ROLE[currentUser.role] ?? '/login'} replace />;
  }
  if (currentUser.mustChangePassword) {
    return <ForcedPasswordChange />;
  }
  return children;
};

export default RequireRole;
