import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { X, ShieldCheck } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Private Security Bar - Fixed at the very top */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 z-40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-200">DefesAi Admin OS</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Ambiente Operacional Seguro</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            99.98% Uptime
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Motor CTB v1</span>
        </div>
      </div>

      {/* Main Workspace Row - Height constrained to prevent document body scrolling */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        {/* Desktop Admin Sidebar - Independent Scroll Container */}
        <aside className="hidden md:flex w-64 h-full shrink-0 flex-col bg-slate-950 border-r border-slate-900 overflow-hidden z-20">
          <AdminSidebar />
        </aside>

        {/* Mobile Drawer Overlay */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] bg-slate-950 h-full shadow-2xl flex flex-col z-10 overflow-hidden">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white z-20"
                aria-label="Fechar menu administrativo"
              >
                <X className="w-5 h-5" />
              </button>
              <AdminSidebar onNavigate={() => setMobileDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area - Independent Scroll Container */}
        <div className="flex-1 h-full min-w-0 flex flex-col overflow-y-auto bg-[#0b1120]">
          <AdminHeader
            onToggleMobileMenu={() => setMobileDrawerOpen(true)}
            pageTitle={pageTitle}
            pageSubtitle={pageSubtitle}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto outline-none"
          >
            {children}
          </main>

          {/* Admin Footer */}
          <footer className="shrink-0 p-4 border-t border-slate-900 bg-slate-950 text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
            <div>
              <span>DefesAi Plataforma Privada de Tecnologia Jurídica © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>NVIDIA NIM AI • 9Router</span>
              <span>PagBank Orders v2</span>
              <span>LGPD Auditada</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
