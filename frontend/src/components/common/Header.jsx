import { APP_CONFIG } from '@/config/env';

export const Header = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            SSA
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 leading-tight">
              {APP_CONFIG.schoolName}
            </h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
              {APP_CONFIG.appName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            System Online
          </span>
        </div>
      </div>
    </header>
  );
};
