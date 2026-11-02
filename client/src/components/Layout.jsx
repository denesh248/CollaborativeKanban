import React from 'react';

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Workspace Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              CK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">CollabKanban</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Real-Time Enterprise Board</p>
            </div>
          </div>

          {/* Scope Preview: Organization & Branch Indicator */}
          {user && (
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
              <span>Org: {user.organizations?.[0]?.name || 'ABC Technologies'}</span>
              <span className="text-slate-300">/</span>
              <span>Branch: {user.tenants?.[0]?.name || 'Branches'}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'app'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {user ? 'My Workspace' : 'Sign In'}
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              System Overview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Real-Time Collaborative Kanban</span>
          <span className="font-mono text-slate-400">Multi-Tenant Architecture</span>
        </div>
      </footer>
    </div>
  );
}
