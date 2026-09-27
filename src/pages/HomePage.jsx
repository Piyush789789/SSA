import { APP_CONFIG } from '@/config/env';

export const HomePage = () => {
  return (
    <div className="max-w-md w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-sm">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-7 h-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">
        {APP_CONFIG.schoolName}
      </h2>
      <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-6">
        {APP_CONFIG.appName}
      </p>

      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-sm mb-6">
        Project Setup Successful
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        The React + JavaScript + Vite frontend environment has been initialized and verified successfully.
      </p>
    </div>
  );
};
