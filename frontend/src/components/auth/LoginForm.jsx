import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSwitch } from '@/components/common/LanguageSwitch';
import { useI18n } from '@/i18n/translate';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, BookOpen, GraduationCap, Heart, AlertCircle, Loader2 } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/authApi';
import { HOME_BY_ROLE } from '@/routes/RequireRole';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { loginWithApi } = useAuth();
  const { t } = useI18n();
  const [selectedRoleId, setSelectedRoleId] = useState('Teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedRole = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'Teacher':
        return BookOpen;
      case 'Student':
        return GraduationCap;
      case 'Parent':
        return Heart;
      case 'Admin':
      default:
        return Shield;
    }
  };

  const RoleIndicatorIcon = getRoleIcon(selectedRoleId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password, selectedRoleId);
      if (response && response.success && response.user) {
        const user = await loginWithApi(response.user, response.token);
        navigate(HOME_BY_ROLE[user.role] ?? ROUTES.LOGIN, { replace: true });
      } else {
        setErrorMessage(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Unable to reach backend server. Please check that the Spring Boot server is running.'
          : 'Invalid credentials or connection error');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] sm:max-w-[420px] mx-auto px-2 py-2 sm:py-4">
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t('common.welcomeBack')}
        </h2>
        <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">
          Select your role and sign in
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email or ID
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[2]" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email, or student ID like STU-2026-0503"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 transition-all duration-150"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[2]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-10 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 transition-all duration-150"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 stroke-[2]" />
              ) : (
                <Eye className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          </div>
        </div>

        {/* Selected Role Indicator Pill */}
        <div className="bg-[#FFF5F0] border border-[#FF6B2C]/20 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-[#EA580C] mt-3.5">
          <RoleIndicatorIcon className="w-4 h-4 text-[#FF6B2C] stroke-[2.2]" />
          <span>Signing in as <strong className="font-bold">{selectedRole.label}</strong></span>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] disabled:opacity-70 text-white font-semibold rounded-2xl shadow-md shadow-[#FF6B2C]/20 flex items-center justify-between px-5 transition-all duration-200 cursor-pointer group mt-2"
        >
          <span className="text-xs sm:text-sm">
            {isLoading ? 'Signing in...' : `Sign In as ${selectedRole.label}`}
          </span>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 stroke-[2.5]" />
          )}
        </button>
      </form>

      {/* Admission enquiry (public form, no login) */}
      <div className="text-center mt-3.5 text-xs text-slate-500 font-medium">
        {t('enquiry.loginPrompt')}{' '}
        <Link to={ROUTES.ADMISSION_ENQUIRY} className="text-[#FF6B2C] font-semibold hover:underline ml-0.5">
          {t('enquiry.loginLink')}
        </Link>
      </div>
      <div className="flex justify-center mt-3">
        <LanguageSwitch />
      </div>

      {/* Role Selector Grid */}
      <RoleSelector
        selectedRoleId={selectedRoleId}
        onSelectRole={(role) => {
          setSelectedRoleId(role);
          setErrorMessage('');
        }}
      />
    </div>
  );
};
