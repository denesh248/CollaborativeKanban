import React from 'react';

export default function Layout({ children, user, onLogout }) {
  // Determine role badge styling
  const primaryRole = user?.tenants?.[0]?.role || (user?.organizations?.[0]?.role) || 'MEMBER';

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ORG_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TENANT_ADMIN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans">
      {/* Top Professional Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs tracking-tight">
              CK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">
                  CollabKanban
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Real-Time Multi-Tenant Collaboration
              </p>
            </div>
          </div>

          {/* User Profile & Role Info (When Authenticated) */}
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Organization & User Role Pill */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {user.organizations?.[0]?.name || 'Apex Global Technologies'}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getRoleBadgeClass(primaryRole)}`}>
                  {primaryRole.replace('_', ' ')}
                </span>
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono leading-tight">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.fullName?.charAt(0) || 'U'}
              </div>

              {/* Clean Sign Out Button */}
              <button
                onClick={onLogout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-all cursor-pointer"
                title="Sign out of your session"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Authentication Portal
            </div>
          )}
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Modern Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-3.5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">CollabKanban Workspace</span>
            <span className="text-slate-300">•</span>
            <span>Optimistic Concurrency & Real-Time Sync</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Node.js • Express • PostgreSQL • Socket.IO
          </div>
        </div>
      </footer>
    </div>
  );
}
