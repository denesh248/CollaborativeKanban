// client/src/components/kanban/DroppableColumn.jsx
// Implements dnd-kit droppable container and sortable context for column task list

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTask from './SortableTask.jsx';

export default function DroppableColumn({
  column,
  columns,
  onEditTask,
  onDeleteTask,
  onQuickMoveTask,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const tasks = column.tasks || [];

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 overflow-y-auto pr-1 flex-1 min-h-[140px] rounded-xl p-1 transition-colors ${
        isOver ? 'bg-indigo-50/40' : ''
      }`}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onQuickMove={onQuickMoveTask}
              columns={columns}
            />
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center h-full">
            Drop tasks here
          </div>
        )}
      </SortableContext>
    </div>
  );
}
