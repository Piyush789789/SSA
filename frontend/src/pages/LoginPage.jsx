import React from 'react';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';

export const LoginPage = () => {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white font-sans text-slate-900 antialiased overflow-x-hidden lg:overflow-hidden">
      {/* Left Branding Panel (~40%) */}
      <div className="lg:col-span-5 xl:col-span-5 lg:h-full lg:overflow-hidden">
        <BrandPanel />
      </div>

      {/* Right Login Panel (~60%) */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-slate-50/40 lg:h-full lg:overflow-y-auto custom-scrollbar">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
