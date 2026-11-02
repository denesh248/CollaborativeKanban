// client/src/components/kanban/SortableTask.jsx
// Implements dnd-kit sortable behavior for an individual task card

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard.jsx';

export default function SortableTask({
  task,
  onEdit,
  onDelete,
  onQuickMove,
  columns,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border p-3.5 shadow-xs transition-all cursor-grab active:cursor-grabbing select-none hover:border-slate-300 hover:shadow-sm ${
        isDragging
          ? 'border-dashed border-indigo-400 bg-indigo-50/20'
          : 'border-slate-200/90'
      }`}
    >
      <TaskCard
        task={task}
        isOverlay={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onQuickMove={onQuickMove}
        columns={columns}
      />
    </div>
  );
}
