// client/src/components/kanban/ActivityFeed.jsx
// Displays real-time activity audit logs for the current branch

import React from 'react';

const getActionBadgeClass = (action) => {
  switch (action) {
    case 'CREATED':
      return 'bg-emerald-100 text-emerald-800';
    case 'MOVED':
      return 'bg-indigo-100 text-indigo-800';
    case 'DELETED':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export default function ActivityFeed({ activityLogs = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Activity Audit Trail
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Live Stream
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {activityLogs.length} Events Logged
        </span>
      </div>

      {/* Log Entries List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto text-xs pr-1">
        {activityLogs.length > 0 ? (
          activityLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getActionBadgeClass(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>
                <span className="font-semibold text-slate-800">
                  {log.user?.fullName || 'System User'}
                </span>
                <span className="text-slate-500 truncate">
                  {log.action === 'MOVED' && log.details?.fromColumn
                    ? `moved task from "${log.details.fromColumn}" to "${log.details.toColumn}"`
                    : log.details?.taskTitle
                    ? `"${log.details.taskTitle}"`
                    : log.entityType}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No activity logs recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
