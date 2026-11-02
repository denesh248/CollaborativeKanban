// client/src/components/kanban/KanbanColumn.jsx
// Displays a column container with header, task count, "+ Add" button, and droppable tasks list

import React from 'react';
import DroppableColumn from './DroppableColumn.jsx';

export default function KanbanColumn({
  column,
  columns,
  onOpenAdd,
  onEditTask,
  onDeleteTask,
  onQuickMoveTask,
}) {
  const taskCount = column.tasks?.length || 0;

  return (
    <div className="rounded-2xl border p-3.5 flex flex-col min-h-[500px] bg-slate-100/70 border-slate-200/80 shadow-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{column.name}</h3>
          <span className="w-5 h-5 rounded-full bg-white text-slate-600 text-[11px] font-bold flex items-center justify-center shadow-xs border border-slate-200/60">
            {taskCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenAdd(column.id)}
          className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Droppable Task List */}
      <DroppableColumn
        column={column}
        columns={columns}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onQuickMoveTask={onQuickMoveTask}
      />
    </div>
  );
}
