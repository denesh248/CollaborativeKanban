// client/src/components/kanban/KanbanHeader.jsx
// Displays board title, branch indicator, presence indicator, and board action buttons

import React from 'react';
import PresenceIndicator from './PresenceIndicator.jsx';

export default function KanbanHeader({
  boardName,
  tenantName,
  socketConnected,
  onlineUsers,
  onRefresh,
  onNewTask,
  hasColumns,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Board Identity & Presence */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {boardName || 'Kanban Workspace'}
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            {tenantName}
          </span>
        </div>

        <PresenceIndicator socketConnected={socketConnected} onlineUsers={onlineUsers} />
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Refresh
        </button>
        {hasColumns && (
          <button
            type="button"
            onClick={onNewTask}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            + New Task
          </button>
        )}
      </div>
    </div>
  );
}
