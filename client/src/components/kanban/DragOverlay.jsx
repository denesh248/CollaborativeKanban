// client/src/components/kanban/DragOverlay.jsx
// Displays the floating preview of a task card during an active drag operation

import React from 'react';
import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import TaskCard from './TaskCard.jsx';

export default function KanbanDragOverlay({ activeDragTask, columns = [] }) {
  return (
    <DndDragOverlay>
      {activeDragTask ? (
        <TaskCard
          task={activeDragTask}
          isOverlay={true}
          columns={columns}
        />
      ) : null}
    </DndDragOverlay>
  );
}
