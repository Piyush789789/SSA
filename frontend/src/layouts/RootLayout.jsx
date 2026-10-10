import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common/Header';

export const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SSA Shiv Shanti Adarsh Academy — Student ERP Frontend
      </footer>
    </div>
  );
};
