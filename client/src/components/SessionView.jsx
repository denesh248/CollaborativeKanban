import React, { useState } from 'react';
import KanbanBoard from './kanban/KanbanBoard.jsx';

export default function SessionView({ user, token }) {
  // Default to the first authorized branch
  const [activeTenant, setActiveTenant] = useState(user.tenants?.[0] || null);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ORG_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TENANT_ADMIN':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sleek Workspace Context & Branch Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Branch Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user.organizations?.[0]?.name || 'Apex Global Technologies'}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Branches:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {user.tenants && user.tenants.length > 0 ? (
              user.tenants.map((tenant) => {
                const isActive = activeTenant?.id === tenant.id;
                return (
                  <button
                    key={tenant.id}
                    onClick={() => setActiveTenant(tenant)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{tenant.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        isActive
                          ? 'bg-indigo-800/60 text-indigo-100'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {tenant.role}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">No assigned branches</span>
            )}
          </div>
        </div>

        {/* User Scope Summary */}
        <div className="flex items-center gap-3 text-xs border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
          <div className="text-slate-500">
            Signed in as <strong className="text-slate-800">{user.fullName}</strong>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getRoleBadgeClass(activeTenant?.role || 'MEMBER')}`}>
            {activeTenant?.role || 'MEMBER'}
          </span>
        </div>
      </div>

      {/* Primary Kanban Board View */}
      {activeTenant ? (
        <KanbanBoard tenant={activeTenant} token={token} user={user} />
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          Please select an authorized branch above to open the Kanban board.
        </div>
      )}
    </div>
  );
}
