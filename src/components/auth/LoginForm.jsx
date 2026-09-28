import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, BookOpen, GraduationCap, Heart } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';

import { useAuth } from '@/context/AuthContext';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState('Teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRoleId === 'Teacher') {
      login('teacher', 'TCH-2026-001');
      navigate('/teacher/dashboard');
    } else if (selectedRoleId === 'Student') {
      login('student');
      navigate('/student/dashboard');
    } else if (selectedRoleId === 'Parent') {
      login('parent');
      navigate('/parent/dashboard');
    } else {
      login('admin');
      navigate(ROUTES.ADMIN_DASHBOARD);
    }
  };

  return (
    <div className="w-full max-w-[400px] sm:max-w-[420px] mx-auto px-2 py-2 sm:py-4">
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">
          Select your role and sign in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[2]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
          className="w-full h-11 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold rounded-2xl shadow-md shadow-[#FF6B2C]/20 flex items-center justify-between px-5 transition-all duration-200 cursor-pointer group mt-2"
        >
          <span className="text-xs sm:text-sm">Sign In as {selectedRole.label}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 stroke-[2.5]" />
        </button>
      </form>

      {/* School Registration Link */}
      <div className="text-center mt-3.5 text-xs text-slate-500 font-medium">
        New school?{' '}
        <button
          type="button"
          onClick={() => {}}
          className="text-[#FF6B2C] font-semibold hover:underline cursor-pointer ml-0.5"
        >
          Register School
        </button>
      </div>

      {/* Role Selector Grid */}
      <RoleSelector
        selectedRoleId={selectedRoleId}
        onSelectRole={setSelectedRoleId}
      />
    </div>
  );
};
