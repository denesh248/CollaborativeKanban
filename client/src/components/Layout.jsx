import React from 'react';
import { KanbanSquare, Building2, GitBranch, Users, Activity, ShieldCheck, LogIn } from 'lucide-react';

export default function Layout({ children, activeTab, setActiveTab }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Workspace Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">CollabKanban</span>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-Time Enterprise Board</p>
            </div>
          </div>

          {/* Scope Preview: Organization & Branch Selectors (Mock preview for Phase 1) */}
          <div className="hidden md:flex items-center gap-3 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white shadow-xs text-xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>ABC Technologies</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white shadow-xs text-xs font-medium text-slate-700">
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hyderabad Branch</span>
            </div>
          </div>

          {/* Header Action Badges */}
          <div className="flex items-center gap-3">
            {/* Live Presence Badge Placeholder */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Backend Ready</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('login')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </span>
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Phase 1 Overview
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Real-Time Collaborative Kanban • FDE Intern Assignment</span>
          <span className="font-mono text-slate-400">Phase 1: Project Foundation & Database Setup</span>
        </div>
      </footer>
    </div>
  );
}
