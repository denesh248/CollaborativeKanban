import React from 'react';

export default function Overview() {
  const models = [
    { name: 'Organization', desc: 'Parent corporate entity (e.g. ABC Technologies)', count: '1 record' },
    { name: 'Tenant', desc: 'Independent branch workspace (Hyderabad, Bangalore, Chennai)', count: '3 branches' },
    { name: 'User', desc: 'Employee accounts with bcrypt hashed passwords', count: '5 users' },
    { name: 'Membership', desc: 'RBAC link (Org Admin, Tenant Admin, Member)', count: '6 assignments' },
    { name: 'Board', desc: 'Kanban project boards strictly scoped to a tenant', count: '2 boards' },
    { name: 'Column', desc: 'Workflow stages with position ordering (To Do, In Progress, Testing, Done)', count: '5 columns' },
    { name: 'Task', desc: 'Work items with integer positions & OCC version counters', count: '5 tasks' },
    { name: 'ActivityLog', desc: 'Tenant-scoped audit trail (preserved on user deletion)', count: '3 logs' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-indigo-700 rounded-2xl p-6 text-white shadow-md">
        <div className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
          System Overview
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Project Foundation & Multi-Tenant Setup</h1>
        <p className="text-indigo-100 text-sm mt-1 max-w-2xl leading-relaxed">
          The monorepo structure is established with React + JavaScript on the frontend, Express + Node.js (ES modules) on the backend, and PostgreSQL + Prisma ORM with all 8 core models.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-500/40 text-xs">
          <div>
            <div className="text-indigo-200">Architecture</div>
            <div className="font-semibold text-white mt-0.5">Monorepo (client/ + server/)</div>
          </div>
          <div>
            <div className="text-indigo-200">Language</div>
            <div className="font-semibold text-white mt-0.5">Pure JavaScript (ES Modules)</div>
          </div>
          <div>
            <div className="text-indigo-200">Database Engine</div>
            <div className="font-semibold text-white mt-0.5">PostgreSQL + Prisma</div>
          </div>
          <div>
            <div className="text-indigo-200">Isolation Level</div>
            <div className="font-semibold text-white mt-0.5">Tenant-Scoped Foreign Keys</div>
          </div>
        </div>
      </div>

      {/* Database Schema Models Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base">Eight Database Models Implemented</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Prisma Schema Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {models.map((model, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm font-mono">{model.name}</span>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {model.count}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{model.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Health Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-1">
            Backend Server (Node.js + Express)
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configured with native ES modules (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">"type": "module"</code>), CORS, JSON parsers, and health endpoint at <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">/api/health</code>.
          </p>
          <div className="mt-3 text-xs text-emerald-700 font-medium">
            Health check verified
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-1">
            Frontend Client (React 18 + Vite)
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configured with Vite, Tailwind CSS, clean components, and simple interactive drag-and-drop using <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">@dnd-kit</code>.
          </p>
          <div className="mt-3 text-xs text-indigo-700 font-medium">
            Vite dev server ready
          </div>
        </div>
      </div>
    </div>
  );
}
