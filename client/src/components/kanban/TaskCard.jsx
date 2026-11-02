// client/src/components/kanban/TaskCard.jsx
// Displays individual task card details, priority badge, OCC version, and actions

import React from 'react';

// Priority badge style helper
const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LOW':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-sky-50 text-sky-700 border-sky-200';
  }
};

export default function TaskCard({
  task,
  isOverlay = false,
  onEdit,
  onDelete,
  onQuickMove,
  columns = [],
}) {
  const assigneeName = task.assignee?.fullName || 'Unassigned';

  return (
    <div
      className={`space-y-3 ${
        isOverlay
          ? 'bg-white rounded-xl border-2 border-indigo-500 p-4 shadow-xl cursor-grabbing'
          : ''
      }`}
    >
      {/* Priority & OCC Version */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadgeClass(
            task.priority
          )}`}
        >
          {task.priority || 'MEDIUM'}
        </span>
        <span
          className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80"
          title="Optimistic Concurrency Version"
        >
          v{task.version}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-semibold text-slate-900 text-sm leading-snug tracking-tight">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Assignee & Action Buttons */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {assigneeName.charAt(0).toUpperCase()}
          </div>
          <span className="text-slate-600 text-xs truncate max-w-[110px]" title={assigneeName}>
            {assigneeName}
          </span>
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit?.(task)}
              className="px-2 py-0.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer font-medium"
            >
              Edit
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete?.(task.id)}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Accessible Quick Move select */}
      {!isOverlay && columns.length > 1 && (
        <div
          className="pt-1 flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-slate-400 font-medium">Move:</span>
          <select
            value={task.columnId}
            onChange={(e) => onQuickMove?.(task, e.target.value)}
            className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-400"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
